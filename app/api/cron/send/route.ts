import { createClient } from '@supabase/supabase-js';
import nodemailer from 'nodemailer';
import { NextResponse } from 'next/server';

// Supabase admin client (service role — bypasses RLS)
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// Nodemailer transporter using Gmail App Password
const transporter = nodemailer.createTransport({
  host: 'smtp.gmail.com',
  port: 587,
  secure: false, // STARTTLS
  auth: {
    user: process.env.GMAIL_USER,
    pass: process.env.GMAIL_APP_PASSWORD,
  },
});

const delay = (ms: number) => new Promise(r => setTimeout(r, ms));

export async function GET(req: Request) {
  // Verify this is called by Vercel Cron (not a random person hitting the URL)
  const authHeader = req.headers.get('authorization');
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const now = new Date();

  // Check IST send window: 8pm-1am IST = 14:30-19:30 UTC
  const utcHour = now.getUTCHours();
  const utcMin = now.getUTCMinutes();
  const utcTotal = utcHour * 60 + utcMin;
  const windowStart = 14 * 60 + 30; // 8pm IST
  const windowEnd = 19 * 60 + 30;   // 1am IST next day
  if (!(utcTotal >= windowStart && utcTotal <= windowEnd)) {
    return NextResponse.json({ message: `Outside send window. Current UTC: ${utcHour}:${String(utcMin).padStart(2,'0')}` });
  }

  // Find campaigns scheduled up to now that are still in 'scheduled' state
  const { data: campaigns, error } = await supabase
    .from('campaigns')
    .select('*')
    .eq('status', 'scheduled')
    .lte('scheduled_at', now.toISOString());

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  if (!campaigns || campaigns.length === 0) {
    return NextResponse.json({ message: 'No campaigns to send' });
  }

  const results: Record<string, { sent: number; failed: number }> = {};

  for (const campaign of campaigns) {
    // Mark campaign as sending
    await supabase.from('campaigns').update({ status: 'sending' }).eq('id', campaign.id);

    // Get pending recipients for this campaign
    const { data: recipients } = await supabase
      .from('recipients')
      .select('*')
      .eq('campaign_id', campaign.id)
      .eq('status', 'pending');

    let sent = 0, failed = 0;

    for (const recipient of recipients ?? []) {
      try {
        // Personalize body — swap {{name}} with recipient name
        const personalizedBody = (recipient.body_override || campaign.body)
          .replace(/{{name}}/gi, recipient.name || 'there')
          .replace(/{{email}}/gi, recipient.email)
          .replace(/{{first_name}}/gi, recipient.name?.split(' ')[0] || 'there')
          .replace(/{{business_name}}/gi, recipient.metadata ? JSON.parse(recipient.metadata).business_name || '' : '')
          .replace(/{{city}}/gi, recipient.metadata ? JSON.parse(recipient.metadata).city || '' : '')
          .replace(/{{state}}/gi, recipient.metadata ? JSON.parse(recipient.metadata).state || '' : '')
          + '\n\n--\nTo unsubscribe, reply with "unsubscribe".';

        const subject = recipient.subject_override || campaign.subject;

        await supabase.from('recipients').update({
          status: 'sent',
          sent_at: new Date().toISOString(),
        }).eq('id', recipient.id);

        sent++;
      } catch (err: any) {
        await supabase.from('recipients').update({
          status: 'failed',
          error: err.message,
        }).eq('id', recipient.id);
        failed++;
      }

      // Custom delay between emails (default 60s if not set)
      await delay((campaign.delay_seconds ?? 60) * 1000);
    }

    // Mark campaign done
    await supabase.from('campaigns').update({ status: 'done' }).eq('id', campaign.id);
    results[campaign.name] = { sent, failed };
  }

  return NextResponse.json({ success: true, results });
}
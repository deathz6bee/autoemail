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
        const personalizedBody = campaign.body
          .replace(/{{name}}/gi, recipient.name || 'there')
          .replace(/{{email}}/gi, recipient.email);

        await transporter.sendMail({
          from: `"${campaign.from_name}" <${process.env.GMAIL_USER}>`,
          to: recipient.email,
          subject: campaign.subject,
          html: personalizedBody,
        });

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

      // 3 second delay between emails — avoids spam flags + rate limits
      await delay(3000);
    }

    // Mark campaign done
    await supabase.from('campaigns').update({ status: 'done' }).eq('id', campaign.id);
    results[campaign.name] = { sent, failed };
  }

  return NextResponse.json({ success: true, results });
}
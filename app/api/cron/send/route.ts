import { createClient } from '@supabase/supabase-js';
import nodemailer from 'nodemailer';
import { NextResponse } from 'next/server';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const transporter = nodemailer.createTransport({
  host: 'smtp.gmail.com', port: 587, secure: false,
  auth: { user: process.env.GMAIL_USER, pass: process.env.GMAIL_APP_PASSWORD },
});

const delay = (ms: number) => new Promise(r => setTimeout(r, ms));

// Check if current UTC time is within a campaign's send window (IST = UTC+5:30)
function inWindow(windowStart: string, windowEnd: string): boolean {
  const now = new Date();
  const istOffset = 5.5 * 60; // IST is UTC+5:30 in minutes
  const istMinutes = (now.getUTCHours() * 60 + now.getUTCMinutes() + istOffset) % (24 * 60);

  const [sh, sm] = windowStart.split(':').map(Number);
  const [eh, em] = windowEnd.split(':').map(Number);
  const startMin = sh * 60 + sm;
  const endMin = eh * 60 + em;

  // Handle overnight windows e.g. 20:00-01:00
  if (startMin > endMin) {
    return istMinutes >= startMin || istMinutes <= endMin;
  }
  return istMinutes >= startMin && istMinutes <= endMin;
}

export async function GET(req: Request) {
  // Auth check disabled for now — re-enable after confirming working
  // const authHeader = req.headers.get('authorization');
  // if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
  //   return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  // }

  const now = new Date();

  // Find scheduled OR in_progress campaigns due to send
  const { data: campaigns, error } = await supabase
    .from('campaigns')
    .select('*')
    .in('status', ['scheduled', 'in_progress'])
    .lte('scheduled_at', now.toISOString());

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  if (!campaigns?.length) return NextResponse.json({ message: 'No campaigns to send' });

  const results: Record<string, any> = {};

  for (const campaign of campaigns) {
    const start = campaign.window_start || '20:00';
    const end = campaign.window_end || '01:00';

    // Skip if outside this campaign's send window
    if (!inWindow(start, end)) {
      results[campaign.name] = { skipped: `Outside window ${start}–${end} IST` };
      continue;
    }

    await supabase.from('campaigns').update({ status: 'sending' }).eq('id', campaign.id);

    const { data: recipients } = await supabase
      .from('recipients')
      .select('*')
      .eq('campaign_id', campaign.id)
      .eq('status', 'pending')
      .limit(campaign.daily_limit || 40); // Only send today's batch

    let sent = 0, failed = 0;

    for (const recipient of recipients ?? []) {
      // Re-check window before each email — stop mid-batch if window closes
      if (!inWindow(start, end)) {
        // Window closed mid-send — mark in_progress and stop
        const newSent = (campaign.sent_count || 0) + sent;
        await supabase.from('campaigns').update({
          status: 'in_progress',
          sent_count: newSent,
        }).eq('id', campaign.id);
        results[campaign.name] = { sent, failed, paused: 'Window closed mid-send, will resume next window' };
        break;
      }

      try {
        let body = recipient.body_override || campaign.body;
        const meta = recipient.metadata ? JSON.parse(recipient.metadata) : {};

        body = body
          .replace(/{{first_name}}/gi, recipient.name?.split(' ')[0] || meta.first_name || 'there')
          .replace(/{{business_name}}/gi, meta.business_name || '')
          .replace(/{{company}}/gi, meta.company || meta.business_name || '')
          .replace(/{{city}}/gi, meta.city || '')
          .replace(/{{state}}/gi, meta.state || '')
          .replace(/{{email}}/gi, recipient.email)
          .replace(/{{name}}/gi, recipient.name || 'there')
          + '\n\n--\nTo unsubscribe, reply with "unsubscribe".';

        const subject = recipient.subject_override || campaign.subject;

        await transporter.sendMail({
          from: `"${campaign.from_name}" <${process.env.GMAIL_USER}>`,
          to: recipient.email, subject, html: body,
        });

        await supabase.from('recipients').update({ status: 'sent', sent_at: new Date().toISOString() }).eq('id', recipient.id);
        sent++;
      } catch (err: any) {
        await supabase.from('recipients').update({ status: 'failed', error: err.message }).eq('id', recipient.id);
        failed++;
      }

      await delay((campaign.delay_seconds ?? 60) * 1000);
    }

    // Update sent_count and mark done if all sent
    const totalSent = (campaign.sent_count || 0) + sent;
    const allDone = (recipients?.length ?? 0) - sent - failed === 0;

    await supabase.from('campaigns').update({
      status: allDone ? 'done' : 'in_progress',
      sent_count: totalSent,
    }).eq('id', campaign.id);

    results[campaign.name] = { sent, failed, total_sent_so_far: totalSent };
  }

  return NextResponse.json({ success: true, results });
}
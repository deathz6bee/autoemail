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

// Basic email format check — skip obviously invalid addresses
function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
}

// Convert plain text newlines to HTML <br> tags
function toHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/\n/g, '<br>');
}

function inWindow(windowStart: string, windowEnd: string): boolean {
  const now = new Date();
  const istOffset = 5.5 * 60;
  const istMinutes = (now.getUTCHours() * 60 + now.getUTCMinutes() + istOffset) % (24 * 60);
  const [sh, sm] = windowStart.split(':').map(Number);
  const [eh, em] = windowEnd.split(':').map(Number);
  const startMin = sh * 60 + sm;
  const endMin = eh * 60 + em;
  if (startMin > endMin) return istMinutes >= startMin || istMinutes <= endMin;
  return istMinutes >= startMin && istMinutes <= endMin;
}

export async function GET(req: Request) {
  const now = new Date();

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

    // Follow-ups (have a parent_campaign_id) bypass the send window
    const isFollowUp = !!campaign.parent_campaign_id;

    if (!isFollowUp && !inWindow(start, end)) {
      results[campaign.name] = { skipped: `Outside window ${start}–${end} IST` };
      continue;
    }

    // Parallel safety — lock campaign to prevent double-send if cron fires twice
    const { data: locked } = await supabase
      .from('campaigns')
      .update({ status: 'sending' })
      .eq('id', campaign.id)
      .in('status', ['scheduled', 'in_progress'])
      .select()
      .single();

    if (!locked) {
      results[campaign.name] = { skipped: 'Already being processed' };
      continue;
    }

    // Fetch today's pending batch
    const { data: pendingRecs } = await supabase
      .from('recipients')
      .select('*')
      .eq('campaign_id', campaign.id)
      .eq('status', 'pending')
      .limit(campaign.daily_limit || 40);

    // Top up with failed recipients for 1 retry if batch has room
    const pendingCount = pendingRecs?.length ?? 0;
    const retryLimit = Math.max(0, (campaign.daily_limit || 40) - pendingCount);
    const { data: failedRecs } = retryLimit > 0 ? await supabase
      .from('recipients')
      .select('*')
      .eq('campaign_id', campaign.id)
      .eq('status', 'failed')
      .is('retry_attempted', null)
      .limit(retryLimit) : { data: [] };

    const recipients = [...(pendingRecs ?? []), ...(failedRecs ?? [])];

    if (!recipients.length) {
      await supabase.from('campaigns').update({ status: 'done' }).eq('id', campaign.id);
      results[campaign.name] = { skipped: 'No pending recipients, marked done' };
      continue;
    }

    let sent = 0, failed = 0, skipped = 0;
    let windowClosed = false;

    for (const recipient of recipients) {
      // Re-check window mid-batch (follow-ups are exempt)
      if (!isFollowUp && !inWindow(start, end)) {
        windowClosed = true;
        break;
      }

      // Skip invalid email addresses without wasting a delay slot
      if (!isValidEmail(recipient.email)) {
        await supabase.from('recipients')
          .update({ status: 'failed', error: 'Invalid email format' })
          .eq('id', recipient.id);
        skipped++;
        continue;
      }

      try {
        let meta: Record<string, string> = {};
        try { meta = recipient.metadata ? JSON.parse(recipient.metadata) : {}; } catch { meta = {}; }

        const personalize = (text: string) => text
          .replace(/{{first_name}}/gi, meta.first_name || meta.business_name?.split(' ')[0] || recipient.name || 'there')
          .replace(/{{business_name}}/gi, meta.business_name || recipient.name || '')
          .replace(/{{company}}/gi, meta.company || meta.business_name || recipient.name || '')
          .replace(/{{city}}/gi, meta.city || '')
          .replace(/{{state}}/gi, meta.state || '')
          .replace(/{{email}}/gi, recipient.email)
          .replace(/{{phone}}/gi, meta.phone || '')
          .replace(/{{website}}/gi, meta.website || '')
          .replace(/{{rating}}/gi, meta.rating || '');

        const rawBody = recipient.body_override || campaign.body;
        const rawSubject = recipient.subject_override || campaign.subject;

        const subject = personalize(rawSubject);
        const bodyText = personalize(rawBody);
        const bodyHtml = toHtml(bodyText);

        await transporter.sendMail({
          from: `"${campaign.from_name}" <${process.env.GMAIL_USER}>`,
          to: recipient.email,
          subject,
          html: bodyHtml,
          text: bodyText,
        });

        await supabase.from('recipients')
          .update({ status: 'sent', sent_at: new Date().toISOString(), error: null })
          .eq('id', recipient.id);
        sent++;

      } catch (err: any) {
        const isRetry = recipient.status === 'failed';
        await supabase.from('recipients')
          .update({
            status: 'failed',
            error: err.message,
            ...(isRetry ? { retry_attempted: new Date().toISOString() } : {})
          })
          .eq('id', recipient.id);
        failed++;
      }

      await delay((campaign.delay_seconds ?? 60) * 1000);
    }

    const totalSent = (campaign.sent_count || 0) + sent;

    if (windowClosed) {
      await supabase.from('campaigns')
        .update({ status: 'in_progress', sent_count: totalSent })
        .eq('id', campaign.id);
      results[campaign.name] = { sent, failed, skipped, paused: 'Window closed mid-send, resumes next window' };
    } else {
      const { count } = await supabase
        .from('recipients')
        .select('id', { count: 'exact', head: true })
        .eq('campaign_id', campaign.id)
        .eq('status', 'pending');

      const allDone = (count ?? 0) === 0;
      const newStatus = allDone
        ? (totalSent === 0 && failed > 0 ? 'failed' : 'done')
        : 'in_progress';

      await supabase.from('campaigns')
        .update({ status: newStatus, sent_count: totalSent })
        .eq('id', campaign.id);

      results[campaign.name] = { sent, failed, skipped, total_sent_so_far: totalSent, status: newStatus };
    }
  }

  return NextResponse.json({ success: true, results });
}
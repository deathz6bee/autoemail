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

function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
}

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

// Calculate required gap in minutes between emails based on window duration and daily limit
function getRequiredGapMinutes(windowStart: string, windowEnd: string, dailyLimit: number): number {
  const [sh, sm] = windowStart.split(':').map(Number);
  const [eh, em] = windowEnd.split(':').map(Number);
  const startMin = sh * 60 + sm;
  const endMin = eh * 60 + em;
  // Handle overnight windows (e.g. 20:00–01:00)
  const windowMinutes = endMin > startMin ? endMin - startMin : (24 * 60 - startMin) + endMin;
  // Gap = window duration / daily limit, minimum 5 minutes (cron frequency)
  return Math.max(5, Math.floor(windowMinutes / dailyLimit));
}

export async function GET() {
  const now = new Date();

  const { data: campaigns, error } = await supabase
    .from('campaigns')
    .select('*')
    .in('status', ['scheduled', 'in_progress'])
    .lte('scheduled_at', now.toISOString());

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  if (!campaigns?.length) return NextResponse.json({ message: 'No campaigns to send' });

  // Find first campaign inside its send window
  const campaign = campaigns.find(c => {
    const isFollowUp = !!c.parent_campaign_id;
    if (isFollowUp) return true;
    return inWindow(c.window_start || '20:00', c.window_end || '01:00');
  });

  if (!campaign) return NextResponse.json({ message: 'All campaigns outside send window' });

  // Check if enough time has passed since last email (smart spacing)
  const isFollowUp = !!campaign.parent_campaign_id;
  if (!isFollowUp) {
    const requiredGapMin = getRequiredGapMinutes(
      campaign.window_start || '20:00',
      campaign.window_end || '01:00',
      campaign.daily_limit || 40
    );
    if (campaign.last_sent_at) {
      const minutesSinceLastSend = (now.getTime() - new Date(campaign.last_sent_at).getTime()) / 60000;
      if (minutesSinceLastSend < requiredGapMin) {
        return NextResponse.json({ message: `Waiting — next email in ${Math.ceil(requiredGapMin - minutesSinceLastSend)} min` });
      }
    }
  }

  // Atomic lock — prevents double-send if cron fires twice
  const { data: locked } = await supabase
    .from('campaigns')
    .update({ status: 'sending' })
    .eq('id', campaign.id)
    .in('status', ['scheduled', 'in_progress'])
    .select()
    .single();

  if (!locked) return NextResponse.json({ message: 'Campaign already being processed' });

  // Get the single next pending recipient
  const { data: pendingRecs } = await supabase
    .from('recipients')
    .select('*')
    .eq('campaign_id', campaign.id)
    .eq('status', 'pending')
    .limit(1);

  // If no pending, try one failed recipient for a single retry
  const { data: failedRecs } = !pendingRecs?.length ? await supabase
    .from('recipients')
    .select('*')
    .eq('campaign_id', campaign.id)
    .eq('status', 'failed')
    .is('retry_attempted', null)
    .limit(1) : { data: [] };

  const recipient = pendingRecs?.[0] ?? failedRecs?.[0];

  // No recipients left — mark campaign done
  if (!recipient) {
    await supabase.from('campaigns').update({ status: 'done' }).eq('id', campaign.id);
    return NextResponse.json({ message: 'Campaign complete, marked done' });
  }

  // Re-check window right before sending
  if (!isFollowUp && !inWindow(campaign.window_start || '20:00', campaign.window_end || '01:00')) {
    await supabase.from('campaigns').update({ status: 'in_progress' }).eq('id', campaign.id);
    return NextResponse.json({ message: 'Window closed, will resume next window' });
  }

  // Skip invalid email
  if (!isValidEmail(recipient.email)) {
    await supabase.from('recipients')
      .update({ status: 'failed', error: 'Invalid email format' })
      .eq('id', recipient.id);
    await supabase.from('campaigns').update({ status: 'in_progress' }).eq('id', campaign.id);
    return NextResponse.json({ message: `Skipped invalid email: ${recipient.email}` });
  }

  // Parse metadata for personalization
  let meta: Record<string, string> = {};
  try { meta = recipient.metadata ? JSON.parse(recipient.metadata) : {}; } catch { meta = {}; }

  const personalize = (text: string) => text
    .replace(/{{name}}/gi, meta.name || meta.business_name || recipient.name || '')
    .replace(/{{first_name}}/gi, meta.first_name || (meta.name || meta.business_name || recipient.name || 'there').split(' ')[0])
    .replace(/{{business_name}}/gi, meta.business_name || meta.name || recipient.name || '')
    .replace(/{{company}}/gi, meta.company || meta.name || meta.business_name || recipient.name || '')
    .replace(/{{city}}/gi, meta.city || '')
    .replace(/{{state}}/gi, meta.state || '')
    .replace(/{{email}}/gi, recipient.email)
    .replace(/{{phone}}/gi, meta.phone || '')
    .replace(/{{website}}/gi, meta.website || '')
    .replace(/{{rating}}/gi, meta.rating || '');

  const rawSubject = recipient.subject_override || campaign.subject;
  const rawBody = recipient.body_override || campaign.body;
  const subject = personalize(rawSubject);
  const bodyText = personalize(rawBody);
  const bodyHtml = toHtml(bodyText);

  try {
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

    const totalSent = (campaign.sent_count || 0) + 1;

    const { count: remaining } = await supabase
      .from('recipients')
      .select('id', { count: 'exact', head: true })
      .eq('campaign_id', campaign.id)
      .eq('status', 'pending');

    const newStatus = (remaining ?? 0) > 0 ? 'in_progress' : 'done';

    // Save last_sent_at so next cron run knows when we last sent
    await supabase.from('campaigns')
      .update({ status: newStatus, sent_count: totalSent, last_sent_at: new Date().toISOString() })
      .eq('id', campaign.id);

    return NextResponse.json({ success: true, sent_to: recipient.email, status: newStatus, total_sent: totalSent });

  } catch (err: any) {
    const isRetry = recipient.status === 'failed';
    await supabase.from('recipients')
      .update({
        status: 'failed',
        error: err.message,
        ...(isRetry ? { retry_attempted: new Date().toISOString() } : {})
      })
      .eq('id', recipient.id);

    await supabase.from('campaigns')
      .update({ status: 'in_progress' })
      .eq('id', campaign.id);

    return NextResponse.json({ error: err.message, recipient: recipient.email }, { status: 500 });
  }
}
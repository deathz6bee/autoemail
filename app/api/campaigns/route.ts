import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET() {
  const { data, error } = await supabase
    .from('campaigns')
    .select(`*, recipients(count)`)
    .order('created_at', { ascending: false });
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}

export async function POST(req: Request) {
  const {
    name, subject, body, from_name, scheduled_at, recipients,
    delay_seconds, notes, parent_campaign_id, action,
    window_start, window_end, daily_limit, total_count,
    sender_splits, // NEW: [{ account_id, email, pct }]
  } = await req.json();

  // ── DUPLICATE ──────────────────────────────────────────────────────
  if (action === 'duplicate' && parent_campaign_id) {
    const { data: src } = await supabase.from('campaigns').select('*').eq('id', parent_campaign_id).single();
    const { data: srcRecs } = await supabase.from('recipients').select('*').eq('campaign_id', parent_campaign_id);
    if (!src) return NextResponse.json({ error: 'Source not found' }, { status: 404 });
    const { data: camp } = await supabase.from('campaigns')
      .insert({
        ...src, id: undefined,
        name: name || src.name + ' (copy)',
        subject: subject || src.subject,
        body: body || src.body,
        from_name: from_name || src.from_name,
        scheduled_at: scheduled_at || src.scheduled_at,
        status: 'scheduled', sent_count: 0, last_sent_at: null, created_at: undefined,
        notes: src.notes,
      })
      .select().single();
    if (!camp) return NextResponse.json({ error: 'Duplicate failed' }, { status: 500 });
    if (srcRecs?.length) {
      await supabase.from('recipients').insert(
        srcRecs.map(r => ({
          ...r, id: undefined, campaign_id: camp.id,
          status: 'pending', sent_at: null, error: null, retry_attempted: null,
        }))
      );
    }
    return NextResponse.json({ success: true, campaign: camp });
  }

  // ── CREATE ─────────────────────────────────────────────────────────
  if (!name || !subject || !body || !scheduled_at || !recipients?.length)
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });

  const { data: campaign, error: campErr } = await supabase
    .from('campaigns')
    .insert({
      name, subject, body, from_name, scheduled_at,
      delay_seconds: delay_seconds || 5,
      notes: notes || '',
      parent_campaign_id: parent_campaign_id || null,
      window_start: window_start || '20:00',
      window_end: window_end || '01:00',
      daily_limit: daily_limit || 40,
      total_count: recipients.length,
      sent_count: 0,
    })
    .select().single();
  if (campErr) return NextResponse.json({ error: campErr.message }, { status: 500 });

  // ── ASSIGN SENDER EMAIL PER RECIPIENT ──────────────────────────────
  // sender_splits = [{ email: 'a@x.com', pct: 60 }, { email: 'b@x.com', pct: 40 }]
  // If no splits provided or only 1 account, all recipients get null (uses env GMAIL_USER)
  const assignSenderEmail = (index: number, total: number): string | null => {
    if (!sender_splits || sender_splits.length === 0) return null;
    if (sender_splits.length === 1) return sender_splits[0].email;
    // Calculate cumulative % boundaries
    let cumulative = 0;
    const pct = (index / total) * 100;
    for (const split of sender_splits) {
      cumulative += split.pct;
      if (pct < cumulative) return split.email;
    }
    // fallback to last account
    return sender_splits[sender_splits.length - 1].email;
  };

  const total = recipients.length;
  const { error: recErr } = await supabase.from('recipients').insert(
    recipients.map((r: any, i: number) => ({
      campaign_id: campaign.id,
      email: r.email,
      name: r.name || '',
      subject_override: r.subject_override || null,
      body_override: r.body_override || null,
      metadata: r.metadata || null,
      sender_email: assignSenderEmail(i, total),
    }))
  );
  if (recErr) return NextResponse.json({ error: recErr.message }, { status: 500 });

  return NextResponse.json({ success: true, campaign });
}

export async function DELETE(req: Request) {
  const { searchParams } = new URL(req.url);
  const id = searchParams.get('id');
  if (!id) return NextResponse.json({ error: 'Missing id' }, { status: 400 });
  const { error } = await supabase.from('campaigns').delete().eq('id', id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ success: true });
}

export async function PATCH(req: Request) {
  const { id, status, subject, body, from_name, scheduled_at, notes } = await req.json();
  if (!id) return NextResponse.json({ error: 'Missing id' }, { status: 400 });
  const updates: Record<string, any> = {};
  if (status !== undefined) updates.status = status;
  if (subject !== undefined) updates.subject = subject;
  if (body !== undefined) updates.body = body;
  if (from_name !== undefined) updates.from_name = from_name;
  if (scheduled_at !== undefined) updates.scheduled_at = scheduled_at;
  if (notes !== undefined) updates.notes = notes;
  const { error } = await supabase.from('campaigns').update(updates).eq('id', id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
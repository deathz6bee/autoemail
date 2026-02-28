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
  const { name, subject, body, from_name, scheduled_at, recipients, delay_seconds, notes, parent_campaign_id, action, window_start, window_end, daily_limit, total_count } = await req.json();

  // Duplicate action
  if (action === 'duplicate' && parent_campaign_id) {
    const { data: src } = await supabase.from('campaigns').select('*').eq('id', parent_campaign_id).single();
    const { data: srcRecs } = await supabase.from('recipients').select('*').eq('campaign_id', parent_campaign_id);
    if (!src) return NextResponse.json({ error: 'Source not found' }, { status: 404 });
    const { data: camp } = await supabase.from('campaigns')
      .insert({ ...src, id: undefined, name: src.name + ' (copy)', status: 'scheduled', created_at: undefined, notes: src.notes })
      .select().single();
    if (!camp) return NextResponse.json({ error: 'Duplicate failed' }, { status: 500 });
    if (srcRecs?.length) {
      await supabase.from('recipients').insert(srcRecs.map(r => ({ ...r, id: undefined, campaign_id: camp.id, status: 'pending', sent_at: null, error: null })));
    }
    return NextResponse.json({ success: true, campaign: camp });
  }

  if (!name || !subject || !body || !scheduled_at || !recipients?.length)
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });

  const { data: campaign, error: campErr } = await supabase
    .from('campaigns')
    .insert({ name, subject, body, from_name, scheduled_at, delay_seconds: delay_seconds||60,
      notes: notes||'', parent_campaign_id: parent_campaign_id||null,
      window_start: window_start||'20:00', window_end: window_end||'01:00',
      daily_limit: daily_limit||40, total_count: recipients.length, sent_count:0 })
    .select().single();
  if (campErr) return NextResponse.json({ error: campErr.message }, { status: 500 });

  const { error: recErr } = await supabase.from('recipients').insert(
    recipients.map((r: any) => ({ campaign_id: campaign.id, email: r.email, name: r.name || '',
      subject_override: r.subject_override || null, body_override: r.body_override || null, metadata: r.metadata || null }))
  );
  if (recErr) return NextResponse.json({ error: recErr.message }, { status: 500 });

  // Mark contacts as used in this campaign
  if (contact_ids?.length) {
    await supabase.from('contact_campaign_map').insert(
      contact_ids.map((cid: string) => ({ contact_id: cid, campaign_id: campaign.id }))
    );
  }

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
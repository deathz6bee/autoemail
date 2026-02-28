import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// GET /api/campaigns — list all campaigns with recipient counts
export async function GET() {
  const { data, error } = await supabase
    .from('campaigns')
    .select(`*, recipients(count)`)
    .order('created_at', { ascending: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}

// POST /api/campaigns — create campaign + recipients
// Body: { name, subject, body, from_name, scheduled_at, recipients: [{email, name}] }
export async function POST(req: Request) {
  const { name, subject, body, from_name, scheduled_at, recipients } = await req.json();

  if (!name || !subject || !body || !scheduled_at || !recipients?.length) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
  }

  // Insert campaign
  const { data: campaign, error: campErr } = await supabase
    .from('campaigns')
    .insert({ name, subject, body, from_name, scheduled_at })
    .select()
    .single();

  if (campErr) return NextResponse.json({ error: campErr.message }, { status: 500 });

  // Insert recipients
  const recipientRows = recipients.map((r: { email: string; name?: string }) => ({
    campaign_id: campaign.id,
    email: r.email,
    name: r.name || '',
  }));

  const { error: recErr } = await supabase.from('recipients').insert(recipientRows);
  if (recErr) return NextResponse.json({ error: recErr.message }, { status: 500 });

  return NextResponse.json({ success: true, campaign });
}

// DELETE /api/campaigns?id=xxx
export async function DELETE(req: Request) {
  const { searchParams } = new URL(req.url);
  const id = searchParams.get('id');
  if (!id) return NextResponse.json({ error: 'Missing id' }, { status: 400 });

  const { error } = await supabase.from('campaigns').delete().eq('id', id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ success: true });
}
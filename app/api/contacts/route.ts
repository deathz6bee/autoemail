import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// GET /api/contacts?unused=true — list all or only unused contacts
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const unusedOnly = searchParams.get('unused') === 'true';

  if (unusedOnly) {
    // Get contacts not in any campaign yet
    const { data, error } = await supabase
      .from('contacts')
      .select('*, contact_campaign_map(contact_id)')
      .is('contact_campaign_map.contact_id', null)
      .order('created_at', { ascending: false });
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json(data);
  }

  const { data, error } = await supabase
    .from('contacts')
    .select('*, contact_campaign_map(campaign_id)')
    .order('created_at', { ascending: false });
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}

// POST /api/contacts — bulk upsert contacts
export async function POST(req: Request) {
  const { contacts } = await req.json();
  if (!contacts?.length) return NextResponse.json({ error: 'No contacts' }, { status: 400 });

  const rows = contacts.map((c: any) => ({
    email: c.email?.toLowerCase().trim(),
    first_name: c.first_name || '',
    business_name: c.business_name || '',
    phone: c.phone || '',
    city: c.city || '',
    state: c.state || '',
    overall_score: c.overall_score || '',
    is_safe_to_send: c.is_safe_to_send || '',
  })).filter((c: any) => c.email);

  const { data, error } = await supabase
    .from('contacts')
    .upsert(rows, { onConflict: 'email' })
    .select();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ success: true, count: data.length });
}

// DELETE /api/contacts?id=xxx
export async function DELETE(req: Request) {
  const { searchParams } = new URL(req.url);
  const id = searchParams.get('id');
  if (!id) return NextResponse.json({ error: 'Missing id' }, { status: 400 });
  const { error } = await supabase.from('contacts').delete().eq('id', id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ success: true });
}
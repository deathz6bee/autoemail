import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// GET — return all contacts
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const search = searchParams.get('search') || '';

  let query = supabase.from('contacts').select('*').order('created_at', { ascending: false });
  if (search) query = query.ilike('email', `%${search}%`);

  const { data, error } = await query;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data || []);
}

// POST — upsert contacts (bulk import)
export async function POST(req: Request) {
  const body = await req.json();
  const contacts = body.contacts as any[];
  if (!contacts?.length) return NextResponse.json({ error: 'No contacts provided' }, { status: 400 });

  const rows = contacts.map(c => ({
    email: (c.email || '').toLowerCase().trim(),
    name: c.name || c.business_name || '',
    first_name: c.first_name || '',
    city: c.city || '',
    state: c.state || '',
    phone: c.phone || '',
    website: c.website || '',
    rating: c.rating || '',
    is_safe_to_send: c.is_safe_to_send || 'true',
  })).filter(r => r.email);

  const { error } = await supabase
    .from('contacts')
    .upsert(rows, { onConflict: 'email', ignoreDuplicates: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true, imported: rows.length });
}

// DELETE — remove a contact by email
export async function DELETE(req: Request) {
  const { searchParams } = new URL(req.url);
  const email = searchParams.get('email')?.toLowerCase().trim();
  if (!email) return NextResponse.json({ error: 'No email' }, { status: 400 });

  const { error } = await supabase.from('contacts').delete().eq('email', email);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}

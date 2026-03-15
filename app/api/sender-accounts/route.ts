import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// GET — list all accounts (password never returned)
export async function GET() {
  const { data, error } = await supabase
    .from('sender_accounts')
    .select('id, email, label, is_active, created_at')
    .order('created_at', { ascending: true });
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}

// POST — add new account
export async function POST(req: Request) {
  const { email, app_password, label } = await req.json();
  if (!email || !app_password)
    return NextResponse.json({ error: 'Email and app password required' }, { status: 400 });
  const { data, error } = await supabase
    .from('sender_accounts')
    .insert({ email: email.trim().toLowerCase(), app_password, label: label || '' })
    .select('id, email, label, is_active, created_at')
    .single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ success: true, account: data });
}

// PATCH — toggle active or update label
export async function PATCH(req: Request) {
  const { id, is_active, label } = await req.json();
  if (!id) return NextResponse.json({ error: 'Missing id' }, { status: 400 });
  const updates: Record<string, any> = {};
  if (is_active !== undefined) updates.is_active = is_active;
  if (label !== undefined) updates.label = label;
  const { error } = await supabase.from('sender_accounts').update(updates).eq('id', id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ success: true });
}

// DELETE — remove account
export async function DELETE(req: Request) {
  const { searchParams } = new URL(req.url);
  const id = searchParams.get('id');
  if (!id) return NextResponse.json({ error: 'Missing id' }, { status: 400 });
  const { error } = await supabase.from('sender_accounts').delete().eq('id', id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ success: true });
}
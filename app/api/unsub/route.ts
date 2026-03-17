import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// GET — return all unsubscribed emails
export async function GET() {
  const { data, error } = await supabase
    .from('unsubscribes')
    .select('email')
    .order('created_at', { ascending: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json((data || []).map((r: { email: string }) => r.email));
}

// POST — add email(s) to unsub list
export async function POST(req: Request) {
  const body = await req.json();
  const emails: string[] = Array.isArray(body.emails)
    ? body.emails.map((e: string) => e.toLowerCase().trim()).filter(Boolean)
    : [body.email?.toLowerCase().trim()].filter(Boolean);

  if (!emails.length) return NextResponse.json({ error: 'No email provided' }, { status: 400 });

  const rows = emails.map(email => ({ email }));
  const { error } = await supabase
    .from('unsubscribes')
    .upsert(rows, { onConflict: 'email', ignoreDuplicates: true });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true, added: emails.length });
}

// DELETE — remove an email from unsub list
export async function DELETE(req: Request) {
  const { searchParams } = new URL(req.url);
  const email = searchParams.get('email')?.toLowerCase().trim();
  if (!email) return NextResponse.json({ error: 'No email provided' }, { status: 400 });

  const { error } = await supabase
    .from('unsubscribes')
    .delete()
    .eq('email', email);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}

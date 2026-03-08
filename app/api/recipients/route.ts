import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const campaign_id = searchParams.get('campaign_id');
  const status = searchParams.get('status');
  if (!campaign_id) return NextResponse.json({ error: 'Missing campaign_id' }, { status: 400 });
  let query = supabase
    .from('recipients')
    .select('id, email, name, status, sent_at, error, retry_attempted')
    .eq('campaign_id', campaign_id)
    .order('email');
  if (status) {
    query = query.eq('status', status);
  } else {
    query = query.eq('status', 'sent');
  }
  const { data, error } = await query;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}
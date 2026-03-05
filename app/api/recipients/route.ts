import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const campaign_id = searchParams.get('campaign_id');
  if (!campaign_id) return NextResponse.json({ error: 'Missing campaign_id' }, { status: 400 });
  const { data, error } = await supabase
    .from('recipients')
    .select('id, email, name, status, sent_at')
    .eq('campaign_id', campaign_id)
    .eq('status', 'sent')
    .order('email');
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}
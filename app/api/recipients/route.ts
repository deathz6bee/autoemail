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
    .select('id, email, name, status, sent_at, error, retry_attempted, sender_email')
    .eq('campaign_id', campaign_id)
    .order('created_at', { ascending: true });

  // status=all returns everything, status=sent/failed/pending filters
  if (status && status !== 'all') {
    query = query.eq('status', status);
  } else if (!status) {
    // default to sent for backwards compatibility
    query = query.eq('status', 'sent');
  }

  const { data, error } = await query;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}

// PATCH — requeue all failed recipients back to pending
export async function PATCH(req: Request) {
  const { campaign_id, action } = await req.json();
  if (!campaign_id || action !== 'requeue')
    return NextResponse.json({ error: 'Invalid request' }, { status: 400 });

  const { error } = await supabase
    .from('recipients')
    .update({ status: 'pending', error: null, retry_attempted: null })
    .eq('campaign_id', campaign_id)
    .eq('status', 'failed');

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ success: true });
}
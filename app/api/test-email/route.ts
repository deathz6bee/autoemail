import { createClient } from '@supabase/supabase-js';
import nodemailer from 'nodemailer';
import { NextResponse } from 'next/server';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(req: Request) {
  const { to, subject, body } = await req.json();
  if (!to || !subject || !body)
    return NextResponse.json({ error: 'Missing fields' }, { status: 400 });

  // Get first active sender account from DB
  const { data: account } = await supabase
    .from('sender_accounts')
    .select('email, app_password')
    .eq('is_active', true)
    .order('created_at', { ascending: true })
    .limit(1)
    .single();

  // Fall back to env vars if no account in DB
  const senderEmail = account?.email || process.env.GMAIL_USER;
  const senderPass = account?.app_password || process.env.GMAIL_APP_PASSWORD;

  if (!senderEmail || !senderPass)
    return NextResponse.json({ error: 'No sender account configured. Add one in the Senders tab.' }, { status: 400 });

  const transporter = nodemailer.createTransport({
    host: 'smtp.gmail.com', port: 587, secure: false,
    auth: { user: senderEmail, pass: senderPass },
  });

  try {
    await transporter.sendMail({
      from: `"Test" <${senderEmail}>`,
      to, subject, html: body,
    });
    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
import nodemailer from 'nodemailer';
import { NextResponse } from 'next/server';

const transporter = nodemailer.createTransport({
  host: 'smtp.gmail.com', port: 587, secure: false,
  auth: { user: process.env.GMAIL_USER, pass: process.env.GMAIL_APP_PASSWORD },
});

export async function POST(req: Request) {
  const { to, subject, body } = await req.json();
  if (!to || !subject || !body) return NextResponse.json({ error: 'Missing fields' }, { status: 400 });
  try {
    await transporter.sendMail({
      from: `"Test" <${process.env.GMAIL_USER}>`,
      to, subject, html: body,
    });
    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
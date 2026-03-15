import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  const { password } = await request.json();

  if (!process.env.AUTH_PASSWORD) {
    return NextResponse.json({ error: 'AUTH_PASSWORD not set in environment variables' }, { status: 500 });
  }

  if (password !== process.env.AUTH_PASSWORD) {
    return NextResponse.json({ error: 'Incorrect password' }, { status: 401 });
  }

  // Set auth cookie — 7 days
  const response = NextResponse.json({ ok: true });
  response.cookies.set('ae_auth', process.env.AUTH_PASSWORD, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 60 * 60 * 24 * 7, // 7 days in seconds
    path: '/',
  });

  return response;
}

export async function DELETE() {
  // Logout — clear the cookie
  const response = NextResponse.json({ ok: true });
  response.cookies.set('ae_auth', '', { maxAge: 0, path: '/' });
  return response;
}
import { NextRequest, NextResponse } from 'next/server';

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Allow login page and auth API through
  if (pathname.startsWith('/login') || pathname.startsWith('/api/auth')) {
    return NextResponse.next();
  }

  // Allow cron endpoint through (needs to work without auth)
  if (pathname.startsWith('/api/cron')) {
    return NextResponse.next();
  }

  // Check for auth cookie
  const auth = request.cookies.get('ae_auth')?.value;
  if (auth === process.env.AUTH_PASSWORD) {
    return NextResponse.next();
  }

  // Not authenticated — redirect to login
  const loginUrl = new URL('/login', request.url);
  return NextResponse.redirect(loginUrl);
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
};
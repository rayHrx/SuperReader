import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// Define public paths that don't require authentication
const PUBLIC_PATHS = ['/welcome', '/auth/signin', '/auth/signup'];
const AUTH_PATHS = ['/auth/signin', '/auth/signup'];

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Always allow static assets and API routes
  if (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/static') ||
    pathname.startsWith('/api') ||
    pathname === '/favicon.ico'
  ) {
    return NextResponse.next();
  }

  // Get the token from cookies
  const token = request.cookies.get('auth')?.value;

  // If user is authenticated and tries to access auth pages, redirect to home
  if (token && AUTH_PATHS.includes(pathname)) {
    return NextResponse.redirect(new URL('/', request.url));
  }

  // If user is not authenticated and tries to access protected routes
  if (!token && !PUBLIC_PATHS.includes(pathname)) {
    return NextResponse.redirect(new URL('/welcome', request.url));
  }

  // If user is not authenticated and tries to access welcome/auth pages, allow access
  if (!token && PUBLIC_PATHS.includes(pathname)) {
    return NextResponse.next();
  }

  // For all other cases, allow the request
  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
};
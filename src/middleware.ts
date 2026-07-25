import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Protect admin/volunteer pages under /dashboard or /profile
  const isProtected = pathname.startsWith('/dashboard') || pathname.startsWith('/profile');

  if (isProtected) {
    const hasSession = request.cookies.getAll().some(cookie => 
      cookie.name.includes('sb-') && cookie.name.includes('-auth-token')
    );

    // Fallback: Check standard login state cookie that we write upon login
    const isLoggedIn = request.cookies.get('sb_logged_in');

    if (!hasSession && !isLoggedIn) {
      const url = request.nextUrl.clone();
      url.pathname = '/login';
      url.searchParams.set('redirect', pathname);
      return NextResponse.redirect(url);
    }
  }

  // Redirect /login to /dashboard if already logged in
  if (pathname === '/login') {
    const hasSession = request.cookies.getAll().some(cookie => 
      cookie.name.includes('sb-') && cookie.name.includes('-auth-token')
    );
    const isLoggedIn = request.cookies.get('sb_logged_in');

    if (hasSession || isLoggedIn) {
      const url = request.nextUrl.clone();
      // Forward to redirection page which figures out role dashboards
      url.pathname = '/dashboard';
      return NextResponse.redirect(url);
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/dashboard/:path*',
    '/profile/:path*',
    '/login',
  ],
};

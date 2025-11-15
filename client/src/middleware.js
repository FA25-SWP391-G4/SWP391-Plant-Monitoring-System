import { NextResponse } from 'next/server';

export function middleware(request) {
  const token = request.cookies.get('token')?.value;
  const user = request.cookies.get('user')?.value;
  const { pathname } = request.nextUrl;

  // Public paths - accessible without authentication
  const publicPaths = ['/', '/login', '/register', '/forgot-password'];

  // If on a public path and logged in, redirect to dashboard
  if (publicPaths.includes(pathname) && pathname !== '/' && token) {
    return NextResponse.redirect(new URL('/dashboard', request.url));
  }

  // If not on a public path and not logged in, redirect to login
  if (!publicPaths.includes(pathname) && !token) {
    // For AI pages, redirect to login instead of home
    if (pathname.startsWith('/ai/')) {
      return NextResponse.redirect(new URL('/login', request.url));
    }
    return NextResponse.redirect(new URL('/', request.url));
  }

  // Premium paths - require premium or admin role
  const premiumPaths = ['/zones', '/reports', '/thresholds', '/search-reports', '/customize'];

  // If on a premium path but not premium/admin, redirect to upgrade
  if (premiumPaths.includes(pathname) && user) {
    try {
      const userData = JSON.parse(user);
      if (!['Premium', 'Admin', 'Ultimate'].includes(userData.role)) {
        return NextResponse.redirect(new URL('/premium', request.url));
      }
    } catch (error) {
      // If user data is invalid, redirect to login
      return NextResponse.redirect(new URL('/login', request.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/((?!api|_next/static|_next/image|favicon.ico|images).*)',
  ],
};
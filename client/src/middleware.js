import { NextResponse } from 'next/server';

export function middleware(request) {
  const token = request.cookies.get('token')?.value || request.cookies.get('token_client')?.value;
  const user = request.cookies.get('user')?.value;
  const { pathname } = request.nextUrl;
  const fullUrl = request.nextUrl.toString();

  // Skip middleware for static assets and API routes
  if (
    pathname.startsWith('/_next/') ||          // Next.js internal files
    pathname.startsWith('/api/') ||            // API routes
    pathname.startsWith('/images/') ||         // Static images
    pathname.match(/\.(png|jpg|jpeg|gif|svg|ico|css|js|woff|woff2|ttf|eot|json|xml|txt)$/i) || // Static file extensions
    pathname === '/favicon.ico' ||
    pathname === '/robots.txt' ||
    pathname === '/sitemap.xml'
  ) {
    return NextResponse.next();
  }

  console.log('[MIDDLEWARE] Processing:', { 
    pathname, 
    fullUrl,
    searchParams: request.nextUrl.searchParams.toString(),
    hasToken: !!token, 
    hasUser: !!user 
  });

  // Public paths - accessible without authentication
  const publicPaths = ['/', '/login', '/register', '/forgot-password', '/reset-password'];
  const authPages = ['/login', '/register', '/forgot-password', '/reset-password'];

  // Check if current path is a public/auth page
  const isPublicPage = publicPaths.includes(pathname);
  const isAuthPage = authPages.includes(pathname);

  // If user is authenticated and tries to access auth pages (except reset-password with token), redirect to dashboard
  if (token && user && isAuthPage) {
    // Allow reset-password page even for authenticated users if they have a reset token
    if (pathname === '/reset-password' && request.nextUrl.searchParams.get('token')) {
      console.log('[MIDDLEWARE] Allowing reset-password access with reset token, original URL:', fullUrl);
      return NextResponse.next();
    }
    console.log('[MIDDLEWARE] Authenticated user accessing auth page, redirecting to dashboard. Original URL:', fullUrl);
    return NextResponse.redirect(new URL('/dashboard', request.url));
  }

  // If user is not authenticated and tries to access protected pages, redirect to login
  if (!token && !isPublicPage) {
    console.log('[MIDDLEWARE] Unauthenticated user accessing protected page, redirecting to login. Original URL:', fullUrl);
    return NextResponse.redirect(new URL('/login', request.url));
  }

  // Premium paths - require premium or admin role
  const premiumPaths = ['/zones', '/reports', '/thresholds', '/search-reports', '/customize'];

  // If on a premium path but not premium/admin, redirect to upgrade
  if (premiumPaths.includes(pathname) && user && token) {
    try {
      const userData = JSON.parse(user);
      if (!['Premium', 'Admin', 'Ultimate'].includes(userData.role)) {
        console.log('[MIDDLEWARE] Non-premium user accessing premium feature, redirecting to upgrade. Original URL:', fullUrl);
        return NextResponse.redirect(new URL('/premium', request.url));
      }
    } catch (error) {
      // If user data is invalid, redirect to login
      console.log('[MIDDLEWARE] Invalid user data, redirecting to login. Original URL:', fullUrl);
      return NextResponse.redirect(new URL('/login', request.url));
    }
  }

  console.log('[MIDDLEWARE] Allowing request to proceed. Final URL:', fullUrl);
  return NextResponse.next();
}

export const config = {
  matcher: [
    '/((?!api|_next/static|_next/image|favicon.ico|images).*)',
  ],
};
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
    if (pathname === '/reset-password' && request.nextUrl.searchParams.get('token')) {
      // Allow reset-password with token
      return NextResponse.next();
    }
    try {
      const userData = JSON.parse(user);
      if (userData.role === 'Admin') {
        return NextResponse.redirect(new URL('/admin/dashboard', request.url));
      }
      return NextResponse.redirect(new URL('/dashboard', request.url));
    } catch (error) {
      return NextResponse.redirect(new URL('/login', request.url));
    }
  }

  // If user is authenticated and on root, redirect to dashboard/admin
  if (token && user && pathname === '/') {
    try {
      const userData = JSON.parse(user);
      if (userData.role === 'Admin') {
        return NextResponse.redirect(new URL('/admin/dashboard', request.url));
      }
      return NextResponse.redirect(new URL('/dashboard', request.url));
    } catch (error) {
      return NextResponse.redirect(new URL('/login', request.url));
    }
  }

  // If user is not authenticated and tries to access protected pages, redirect to login
  if (!token && !isPublicPage) {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  // Premium paths - require premium or admin role
  const premiumPaths = ['/zones', '/reports', '/thresholds', '/search-reports', '/customize'];
  if (premiumPaths.includes(pathname) && user && token) {
    try {
      const userData = JSON.parse(user);
      if (!['Premium', 'Ultimate'].includes(userData.role)) {
        return NextResponse.redirect(new URL('/premium', request.url));
      }
    } catch (error) {
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
import { NextResponse } from 'next/server';

/**
 * Google OAuth callback handler on the client side
 * Receives the callback from Google and processes it
 */
export async function GET(request) {
  try {
    // Get the URL searchParams
    const { searchParams } = new URL(request.url);
    const code = searchParams.get('code');
    const state = searchParams.get('state');
    
    if (!code) {
      // If there's an error parameter, handle it
      const error = searchParams.get('error');
      return NextResponse.redirect(
        `${process.env.FRONTEND_URL || 'http://localhost:3000'}/login?error=${error || 'missing_code'}`
      );
    }
    
    // Forward the code and state to our backend API
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3010';
    const response = await fetch(
      `${apiUrl}/auth/google/callback?code=${code}&state=${state}`,
      {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
        redirect: 'manual', // Don't auto-follow redirects
      }
    );
    
    // Check if the backend returned a redirect
    if (response.status === 302 || response.status === 307) {
      const location = response.headers.get('Location');
      return NextResponse.redirect(location);
    }
    
    // Process the response
    const data = await response.json();
    
    if (data.success === false) {
      return NextResponse.redirect(
        `${process.env.FRONTEND_URL || 'http://localhost:3000'}/login?error=${data.error || 'auth_failed'}`
      );
    }
    
    // Redirect to the frontend with the token
    return NextResponse.redirect(
      `${process.env.FRONTEND_URL || 'http://localhost:3000'}/auth/callback?token=${data.token}&redirect=${data.redirect || '/dashboard'}`
    );
    
  } catch (error) {
    console.error('API route error:', error);
    return NextResponse.redirect(
      `${process.env.FRONTEND_URL || 'http://localhost:3000'}/login?error=server_error`
    );
  }
}
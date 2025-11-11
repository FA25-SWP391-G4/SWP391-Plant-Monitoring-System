import { NextResponse } from 'next/server';

export async function GET(request) {
  // Extract return URL from environment or use fallback
  const frontendUrl = process.env.FRONTEND_PAYMENT_RESULT_URL || 'http://localhost:3000/payment/result';
  
  // Get query parameters from request URL
  const { searchParams } = new URL(request.url);
  const queryParams = Object.fromEntries(searchParams.entries());
  
  // Build redirect URL with all original parameters
  const redirectUrl = new URL(frontendUrl);
  
  // Add all query parameters to the redirect URL
  Object.entries(queryParams).forEach(([key, value]) => {
    redirectUrl.searchParams.append(key, value);
  });
  
  // Return redirect response
  return NextResponse.redirect(redirectUrl.toString());
}
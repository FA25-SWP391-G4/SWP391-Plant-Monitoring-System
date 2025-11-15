// This file creates a catch-all API route to handle POST requests
// that might be incorrectly sent to the root

import { NextResponse } from 'next/server';

export async function POST(request) {
  // Log the incorrect POST request
  console.log('Received POST request to root path');

  // Return a proper JSON response instead of 405
  return NextResponse.json({
    status: 'error',
    message: 'This endpoint does not accept POST requests',
    redirectTo: '/api/v1' // Suggest the correct API path
  }, { status: 200 });
}

export const dynamic = 'force-dynamic';

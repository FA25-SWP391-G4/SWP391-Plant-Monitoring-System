'use client'

import { useState, useEffect } from 'react';
import Script from 'next/script';

export default function GoogleHeadTags() {
  // Access the environment variable
  const googleClientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;

  // Log for debugging
  useEffect(() => {
    if (!googleClientId) {
      console.error('Google Client ID is not defined in environment variables');
    } else {
      console.log('Google Client ID loaded:', googleClientId);
    }
  }, [googleClientId]);

  return (
    <>
      {/* Meta tag for Google Sign-In */}
      {googleClientId && (
        <meta name="google-signin-client_id" content={googleClientId} />
      )}
      
      {/* Google Identity Services Script - using afterInteractive to avoid hydration errors */}
      <Script
        src="https://accounts.google.com/gsi/client"
        strategy="afterInteractive"
        onLoad={() => {
          console.log('Google Identity Services script loaded');
        }}
      />
    </>
  );
}
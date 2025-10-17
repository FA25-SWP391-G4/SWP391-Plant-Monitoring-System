'use client'

import { useState, useEffect } from 'react';
import Head from 'next/head';
import Script from 'next/script';

export default function GoogleHeadTags() {
  // Access the environment variable
  const googleClientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;
  const [clientId, setClientId] = useState(googleClientId);

  // This ensures the client ID is properly loaded during client-side rendering
  useEffect(() => {
    if (!googleClientId) {
      console.error('Google Client ID is not defined in environment variables');
    } else {
      setClientId(googleClientId);
      console.log('Google Client ID loaded:', googleClientId);
    }
  }, [googleClientId]);

  return (
    <>
      <Head>
        <meta name="google-signin-client_id" content={clientId} />
      </Head>
      <Script
        src="https://accounts.google.com/gsi/client"
        strategy="beforeInteractive"
        onLoad={() => {
          console.log('Google Identity Services script loaded');
        }}
      />
    </>
  );
}
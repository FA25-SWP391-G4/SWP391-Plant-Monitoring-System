import Script from 'next/script';

export default function GoogleHeadTags() {
  const clientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;

  return (
    <>
      <meta name="google-signin-client_id" content={clientId || ''} />
      {/* Removed Google Identity Services script since our OAuth flow uses direct popup */}
      {/* This avoids noisy network errors when external scripts are blocked */}
    </>
  );
}
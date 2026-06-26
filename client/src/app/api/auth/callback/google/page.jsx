'use client';

import { useEffect } from 'react';

export default function GoogleCallbackPage() {
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const code = params.get('code');
    const state = params.get('state');
    const error = params.get('error');

    if (error) {
      window.location.href = `/login?error=${encodeURIComponent(error)}`;
      return;
    }

    if (code && state) {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3010';
      window.location.href = `${apiUrl}/auth/google/callback?code=${encodeURIComponent(code)}&state=${encodeURIComponent(state)}`;
    } else {
      window.location.href = '/login?error=google_auth_callback_missing_params';
    }
  }, []);

  return (
    <div className="flex items-center justify-center min-h-screen bg-slate-900 text-white">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-500 mx-auto mb-4"></div>
        <p className="text-lg font-medium">Completing Google Sign-in...</p>
        <p className="text-sm text-slate-400 mt-2">Connecting to auth services...</p>
      </div>
    </div>
  );
}

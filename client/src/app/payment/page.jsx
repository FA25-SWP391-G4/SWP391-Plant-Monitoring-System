'use client';

import { useEffect } from 'react';

export default function PaymentRedirect() {
  useEffect(() => {
    const search = window.location.search;
    window.location.href = `/payment/result${search}`;
  }, []);

  return (
    <div className="flex items-center justify-center min-h-screen bg-slate-900 text-white">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-500 mx-auto mb-4"></div>
        <p className="text-lg font-medium">Processing payment details...</p>
        <p className="text-sm text-slate-400 mt-2">Redirecting to result page...</p>
      </div>
    </div>
  );
}

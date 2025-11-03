'use client'

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function HistoryPage() {
  const router = useRouter();

  useEffect(() => {
    // Redirect to AI history page since this is the main history page
    router.replace('/ai/history');
  }, [router]);

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="text-center">
        <div className="w-12 h-12 border-4 border-emerald-200 border-t-emerald-600 rounded-full animate-spin mx-auto mb-4"></div>
        <p className="text-gray-600">Redirecting to history page...</p>
      </div>
    </div>
  );
}
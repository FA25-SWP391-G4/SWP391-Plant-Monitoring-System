'use client'

import { useAuth } from '@/providers/AuthProvider';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

export default function TestAuthPage() {
  const { user, token, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !user) {
      router.push('/login');
    }
  }, [user, loading, router]);

  if (loading) {
    return <div>Loading...</div>;
  }

  if (!user) {
    return <div>Not authenticated</div>;
  }

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-4">Authentication Test</h1>
      
      <div className="bg-gray-100 p-4 rounded mb-4">
        <h2 className="font-semibold mb-2">User Info:</h2>
        <pre>{JSON.stringify(user, null, 2)}</pre>
      </div>
      
      <div className="bg-gray-100 p-4 rounded mb-4">
        <h2 className="font-semibold mb-2">Token:</h2>
        <p className="break-all">{token ? `${token.substring(0, 50)}...` : 'No token'}</p>
      </div>
      
      <div className="space-y-2">
        <h2 className="font-semibold">Test AI Pages:</h2>
        <div className="space-x-2">
          <button 
            onClick={() => router.push('/ai/chat')}
            className="bg-blue-500 text-white px-4 py-2 rounded"
          >
            AI Chat
          </button>
          <button 
            onClick={() => router.push('/ai/image-analysis')}
            className="bg-green-500 text-white px-4 py-2 rounded"
          >
            Image Analysis
          </button>
          <button 
            onClick={() => router.push('/ai/predictions')}
            className="bg-purple-500 text-white px-4 py-2 rounded"
          >
            Predictions
          </button>
        </div>
      </div>
    </div>
  );
}
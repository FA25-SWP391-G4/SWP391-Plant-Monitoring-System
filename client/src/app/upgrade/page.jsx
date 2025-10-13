'use client'

import MainLayout from '@/components/MainLayout';
import { useAuth } from '@/providers/AuthProvider';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

export default function UpgradePage() {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !user) {
      router.push('/login');
    }
  }, [user, loading, router]);

  if (loading) {
    return <div className="flex items-center justify-center h-screen">Loading...</div>;
  }

  if (!user) {
    return null; // Will redirect in useEffect
  }

  return (
    <MainLayout>
      <div className="container mx-auto px-4">
        <h1 className="text-3xl font-bold mb-8">Upgrade to Premium</h1>
        
        <div className="max-w-4xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="bg-card text-card-foreground rounded-lg shadow p-6">
              <h2 className="text-xl font-semibold mb-4">Regular Plan</h2>
              <p className="text-2xl font-bold mb-4">Free</p>
              <ul className="space-y-2 mb-6">
                <li>✅ Basic plant monitoring</li>
                <li>✅ Single zone support</li>
                <li>✅ Limited sensor data</li>
                <li>❌ No zone management</li>
                <li>❌ No advanced reports</li>
                <li>❌ No threshold customization</li>
              </ul>
              <p className="text-muted-foreground">Your current plan</p>
            </div>
            
            <div className="bg-card text-card-foreground rounded-lg shadow p-6 border-2 border-primary">
              <div className="absolute top-0 right-0 bg-primary text-primary-foreground px-3 py-1 rounded-bl-lg text-sm">
                Recommended
              </div>
              <h2 className="text-xl font-semibold mb-4">Premium Plan</h2>
              <p className="text-2xl font-bold mb-4">$9.99/month</p>
              <ul className="space-y-2 mb-6">
                <li>✅ Advanced plant monitoring</li>
                <li>✅ Unlimited zones</li>
                <li>✅ Complete sensor history</li>
                <li>✅ Zone management</li>
                <li>✅ Detailed reports</li>
                <li>✅ Custom thresholds & alerts</li>
              </ul>
              <button className="w-full bg-primary text-primary-foreground hover:bg-primary/90 py-2 px-4 rounded">
                Upgrade Now
              </button>
            </div>
          </div>
        </div>
      </div>
    </MainLayout>
  );
}
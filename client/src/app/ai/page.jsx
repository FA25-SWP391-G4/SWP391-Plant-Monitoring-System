/**
 * AI Features Page
 * Premium AI-powered plant care features and insights
 */
'use client'

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../../providers/AuthProvider';
import DashboardLayout from '../../components/DashboardLayout';
import AIFunctionsGrid from '../../components/ai/AIFunctionsGrid';
import ThemedLoader from '../../components/ThemedLoader';

const AIPage = () => {
  const { user, loading } = useAuth();
  const router = useRouter();

  const isPremium = user?.role === 'Premium' || user?.role === 'Admin';

  useEffect(() => {
    if (!loading && !user) {
      router.push('/login');
    }
  }, [user, loading, router]);

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex justify-center items-center min-h-[60vh]">
          <ThemedLoader size="lg" showText={true} text="Loading AI features..." />
        </div>
      </DashboardLayout>
    );
  }

  if (!user) {
    return null;
  }

  return (
      <div className="container mx-auto px-4 py-8 fade-in">
        <AIFunctionsGrid isPremium={isPremium} />
      </div>
  );
};

export default AIPage;
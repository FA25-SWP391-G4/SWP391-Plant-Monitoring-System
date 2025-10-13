'use client'

import MainLayout from '@/components/MainLayout';
import { useAuth } from '@/providers/AuthProvider';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { useTranslation } from 'react-i18next';

export default function ZonesPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const { t } = useTranslation();

  useEffect(() => {
    if (!loading) {
      // Check if user is not logged in
      if (!user) {
        router.push('/login');
        return;
      }
      
      // Check if user doesn't have premium access
      if (!['Premium', 'Admin'].includes(user.role)) {
        router.push('/upgrade');
      }
    }
  }, [user, loading, router]);

  if (loading) {
    return <div className="flex items-center justify-center h-screen">{t('common.loading', 'Loading...')}</div>;
  }

  if (!user || !['Premium', 'Admin'].includes(user.role)) {
    return null; // Will redirect in useEffect
  }

  return (
    <MainLayout>
      <div className="container mx-auto px-4">
        <h1 className="text-3xl font-bold mb-8">{t('zones.title', 'Plant Zones')}</h1>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Zone components would go here */}
          <div className="bg-card text-card-foreground rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold mb-4">{t('zones.zone1', 'Zone 1: Living Room')}</h2>
            <p>{t('zones.plantsMonitored', { count: 4 }, '4 plants monitored')}</p>
          </div>
          
          <div className="bg-card text-card-foreground rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold mb-4">{t('zones.zone2', 'Zone 2: Garden')}</h2>
            <p>{t('zones.plantsMonitored', { count: 8 }, '8 plants monitored')}</p>
          </div>
          
          <div className="bg-card text-card-foreground rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold mb-4">{t('zones.zone3', 'Zone 3: Patio')}</h2>
            <p>{t('zones.plantsMonitored', { count: 2 }, '2 plants monitored')}</p>
          </div>
        </div>
      </div>
    </MainLayout>
  );
}
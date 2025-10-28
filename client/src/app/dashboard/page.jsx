'use client'

import { useState, useEffect, useMemo } from 'react';
import { useAuth } from '@/providers/AuthProvider';
import { useRouter } from 'next/navigation';
import { useTranslation } from 'react-i18next';
import { useTheme } from '@/contexts/ThemeContext';
import DashboardHeader from '@/components/dashboard/DashboardHeader';
import PlantCard from '@/components/dashboard/PlantCard';
import WeatherWidget from '@/components/dashboard/WeatherWidget';
import RecentActivity from '@/components/dashboard/RecentActivity';
import WateringSchedule from '@/components/dashboard/WateringSchedule';
import PremiumFeaturePrompt from '@/components/dashboard/PremiumFeaturePrompt';
import Navbar from '@/components/Navbar';
import ThemedLoader from '@/components/ThemedLoader';
import useMemoizedData from '@/hooks/useMemoizedData';
import axiosClient from '@/api/axiosClient';

export default function DashboardPage() {
  const { user, loading, isPremium } = useAuth();
  const router = useRouter();
  const { t } = useTranslation();
  const { isDark, themeColors } = useTheme();
  const [plants, setPlants] = useState([]);
  const [sensorData, setSensorData] = useState({});
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Use !!user for clean boolean user authentication state
  const isAuthenticated = !!user;

  console.log('[DASHBOARD] Render - user:', user?.email, 'loading:', loading);

  // Redirect if not logged in (only after loading is complete)
  useEffect(() => {
    console.log('[DASHBOARD] Auth check - loading:', loading, 'user:', user?.email);
    
    if (!loading && !user) {
      console.log('[DASHBOARD] No user found after loading complete - redirecting to /login');
      router.push('/login');
    }
  }, [user, loading, router]);

  // Show loading state while auth is being checked
  if (loading) {
    console.log('[DASHBOARD] Still loading auth...');
    return (
      <div className="flex items-center justify-center min-h-screen">
        <ThemedLoader 
          size="xl" 
          showText={true} 
          text={t('common.loading', 'Loading...')}
        />
      </div>
    );
  }

  // If not loading and no user, return null (redirect will happen via useEffect)
  if (!user) {
    console.log('[DASHBOARD] No user and not loading - should redirect');
    return null;
  }

  // Fetch plants data using the custom hook
  const fetchPlants = async () => {
    const response = await axiosClient.get('/api/plants');
    return response.data;
  };
  
  // Fetch sensor data using the custom hook
  const fetchSensorData = async () => {
    const response = await axiosClient.get('/api/sensors/latest');
    return response.data;
  };
  
  // Use the memoized data hook for plants only when user is authenticated
  const { 
    data: plantsData, 
    isLoading: plantsLoading, 
    error: plantsError 
  } = useMemoizedData(
    // Only fetch data if user is authenticated
    async () => {
      if (!user) return [];
      return await fetchPlants();
    },
    [user], // Only re-fetch when user changes
    {
      cacheKey: user ? `dashboard_plants_${user.user_id}` : null,
      cacheDuration: 5 * 60 * 1000, // 5 minutes
      onSuccess: (data) => {
        if (data) setPlants(data);
      },
      onError: (err) => {
        console.error('Error fetching plants:', err);
        setError(t('dashboard.loadError', 'Failed to load plant data. Please try again later.'));
      }
    }
  );
  
  // Use the memoized data hook for sensor data only when user is authenticated
  const {
    data: sensorDataResponse,
    isLoading: sensorsLoading,
    error: sensorsError
  } = useMemoizedData(
    // Only fetch data if user is authenticated
    async () => {
      if (!user) return {};
      return await fetchSensorData();
    },
    [user], // Only re-fetch when user changes
    {
      cacheKey: user ? `dashboard_sensors_${user.user_id}` : null,
      cacheDuration: 60 * 1000, // 1 minute
      onSuccess: (data) => {
        if (data) setSensorData(data);
      },
      onError: (err) => {
        console.error('Error fetching sensor data:', err);
        // Don't show error for sensors as we can fall back to last known values
      }
    }
  );
  
  // Update loading state based on authentication and data fetches
  useEffect(() => {
    setIsLoading(loading || (user && (plantsLoading || sensorsLoading)));
  }, [loading, user, plantsLoading, sensorsLoading]);
  
  // Update error state if plants fetch fails
  useEffect(() => {
    if (plantsError) {
      setError(t('dashboard.loadError', 'Failed to load plant data. Please try again later.'));
    }
  }, [plantsError, t]);
  
  // Check if no plants or sensor data are available
  const noData = user && !isLoading && !error && (!plants || plants.length === 0);

  if (loading || isLoading) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-50 dark:bg-gray-900">
        <div className="animate-pulse flex flex-col items-center">
          <div className="w-12 h-12 rounded-full bg-emerald-200 dark:bg-emerald-800 mb-4"></div>
          <div className="h-4 w-24 bg-emerald-100 dark:bg-emerald-900 rounded"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-screen bg-gray-50 dark:bg-gray-900">
        <div className="text-red-500 dark:text-red-400 mb-4">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
        <h2 className="text-xl font-semibold mb-2 text-gray-900 dark:text-white">{t('dashboard.errorLoading', 'Error Loading Dashboard')}</h2>
        <p className="text-gray-600 dark:text-gray-400">{error}</p>
        <button 
          onClick={() => window.location.reload()} 
          className="mt-4 px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 dark:bg-emerald-700 dark:hover:bg-emerald-600 transition-colors"
        >
          {t('common.retry', 'Retry')}
        </button>
      </div>
    );
  }

  return (
       <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <main className="container mx-auto px-4 py-8">
        {/* No Data Message */}
        {noData && (
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 p-8 text-center my-8">
            <div className="flex justify-center mb-4">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 text-gray-300 dark:text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h3 className="text-lg font-medium mb-2 text-gray-900 dark:text-white">{t('dashboard.noData', 'No dashboard data found')}</h3>
            <p className="text-gray-500 dark:text-gray-400 mb-4">{t('dashboard.noDataDescription', 'We couldn\'t find any plants or sensor data. Add your first plant to get started.')}</p>
            <button 
              onClick={() => router.push('/plants')}
              className="px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 dark:bg-emerald-700 dark:hover:bg-emerald-600 transition-colors"
            >
              {t('dashboard.addFirstPlant', 'Add Your First Plant')}
            </button>
          </div>
        )}
        
        {/* Welcome Banner */}
        <div className="bg-gradient-to-r from-emerald-500 to-emerald-700 dark:from-emerald-600 dark:to-emerald-800 rounded-xl shadow-lg mb-8 p-6 text-white flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold mb-2">
              {t('dashboard.welcome', 'Welcome back')}, {user?.family_name || t('common.plantLover', 'Plant Lover')}!
            </h1>
            <p className="opacity-90">
              {t('dashboard.overview', 'Here\'s an overview of your plant collection')}
            </p>
          </div>
          <div className="hidden md:block">
            <button className="bg-white dark:bg-gray-100 text-emerald-700 dark:text-emerald-800 px-4 py-2 rounded-lg font-medium hover:bg-emerald-50 dark:hover:bg-gray-200 transition-colors">
              {t('dashboard.addPlant', 'Add New Plant')}
            </button>
          </div>
        </div>
        
        {/* Summary Stats */}
        {!noData && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
            <div className="bg-white dark:bg-gray-800 p-5 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 flex items-center">
              <div className="bg-emerald-100 dark:bg-emerald-900 p-3 rounded-full mr-4">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-emerald-600 dark:text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
                </svg>
              </div>
              <div>
                <p className="text-gray-500 dark:text-gray-400 text-sm">{t('dashboard.totalPlants', 'Total Plants')}</p>
                <p className="text-xl font-semibold text-gray-900 dark:text-white">{plants.length}</p>
              </div>
          </div>    
          <div className="bg-white dark:bg-gray-800 p-5 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 flex items-center">
            <div className="bg-blue-100 dark:bg-blue-900 p-3 rounded-full mr-4">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-blue-600 dark:text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
              </svg>
            </div>
            <div>
              <p className="text-gray-500 dark:text-gray-400 text-sm">{t('dashboard.needsWatering', 'Needs Watering')}</p>
              <p className="text-xl font-semibold text-gray-900 dark:text-white">
                {plants.filter(plant => plant.status === 'needs_water').length}
              </p>
            </div>
          </div>
          
          <div className="bg-white dark:bg-gray-800 p-5 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 flex items-center">
            <div className="bg-amber-100 dark:bg-amber-900 p-3 rounded-full mr-4">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-amber-600 dark:text-amber-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
            <div>
              <p className="text-gray-500 dark:text-gray-400 text-sm">{t('dashboard.needsAttention', 'Needs Attention')}</p>
              <p className="text-xl font-semibold text-gray-900 dark:text-white">
                {plants.filter(plant => plant.status === 'needs_attention').length}
              </p>
            </div>
          </div>
        </div>
        )}
        
        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left column - Plant cards */}
          <div className="lg:col-span-2 space-y-6">
            <h2 className="text-xl font-semibold text-gray-800 dark:text-gray-200 mb-4">{t('dashboard.yourPlants', 'Your Plants')}</h2>
            
            {plants.length === 0 ? (
              <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 p-8 text-center">
                <div className="flex justify-center mb-4">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 text-gray-300 dark:text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                  </svg>
                </div>
                <h3 className="text-lg font-medium mb-2 text-gray-900 dark:text-white">{t('dashboard.noPlants', 'No plants added yet')}</h3>
                <p className="text-gray-500 dark:text-gray-400 mb-4">{t('dashboard.startAdding', 'Start adding plants to your collection')}</p>
                <button className="px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 dark:bg-emerald-700 dark:hover:bg-emerald-600 transition-colors">
                  {t('dashboard.addFirstPlant', 'Add Your First Plant')}
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                {plants.map(plant => (
                  <PlantCard 
                    key={plant.plant_id} 
                    plant={plant} 
                    sensorData={sensorData[plant.plant_id]}
                  />
                ))}
              </div>
            )}
          </div>
          
          {/* Right column - Widgets */}
          <div className="space-y-6">
            <WeatherWidget />
            
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 p-5">
              <h3 className="font-medium text-gray-900 dark:text-white mb-4">{t('dashboard.recentActivity', 'Recent Activity')}</h3>
              <RecentActivity />
            </div>
            
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 p-5">
              <h3 className="font-medium text-gray-900 dark:text-white mb-4">{t('dashboard.wateringSchedule', 'Watering Schedule')}</h3>
              <WateringSchedule plants={plants} />
            </div>
            
            {/* Premium feature banner */}
            {user?.role === 'Regular' && (
              <PremiumFeaturePrompt />
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
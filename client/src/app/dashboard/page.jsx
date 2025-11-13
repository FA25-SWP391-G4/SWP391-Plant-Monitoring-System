'use client'

import { useState, useEffect, useMemo } from 'react';
import { useAuth } from '@/providers/AuthProvider';
import { useSettings } from '@/providers/SettingsProvider';
import { useRouter } from 'next/navigation';
import { useTranslation } from 'react-i18next';
import { useTheme } from '@/contexts/ThemeContext';
import settingsApi from '@/api/settingsApi';

import WeatherWidget from '@/components/dashboard/WeatherWidget';
import RecentActivity from '@/components/dashboard/RecentActivity';
import WateringSchedule from '@/components/dashboard/WateringSchedule';
import PremiumFeaturePrompt from '@/components/dashboard/PremiumFeaturePrompt';
import Navbar from '@/components/dashboard/navigation/Navbar';
import ThemedLoader from '@/components/ThemedLoader';
import useMemoizedData from '@/hooks/useMemoizedData';
import axiosClient from '@/api/axiosClient';
import { TreePine, Settings } from 'lucide-react';
import Link from 'next/link';
import { useRenderDebug, useOperationTiming } from '@/utils/renderDebug';
import { useDataFetchDebug } from '@/utils/renderDebug';
import PlantCard from '@/components/plants/PlantCard';

export default function DashboardPage() {
  const { user, loading, isPremium } = useAuth();
  const router = useRouter();
  const { t } = useTranslation();
  const { isDark, themeColors } = useTheme();
  const { settings, loading: settingsLoading } = useSettings();
  
  // Widget settings
  const showTitles = settings?.widgets?.showWidgetTitles ?? true;
  const showIcons = settings?.widgets?.showWidgetIcons ?? true;
  const compactMode = settings?.widgets?.compactMode ?? false;
  const animationsEnabled = settings?.widgets?.animationsEnabled ?? true;
  
  const [plants, setPlants] = useState([]);
  const [sensorData, setSensorData] = useState({});
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Use !!user for clean boolean user authentication state
  const isAuthenticated = !!user;

  // 🚀 RENDER DEBUG - Track dashboard performance
  const renderDebug = useRenderDebug('DashboardPage', {
    userEmail: user?.email,
    loading,
    isPremium,
    isAuthenticated,
    plantsCount: plants.length
  });

  const { startTiming, endTiming } = useOperationTiming('DashboardPage');
  const { fetchState, fetchWithDebug } = useDataFetchDebug('DashboardPage');

  console.log('[DASHBOARD] Render - user:', user?.email, 'loading:', loading, 'isPremium:', isPremium);
  console.log('[DASHBOARD] User object:', user);

  // 🚀 PERFORMANCE MONITOR - Load performance monitoring tools
  useEffect(() => {
    if (!loading && !user) {
      console.log('[DASHBOARD] No user found after loading complete - redirecting to /login');
      router.push('/login');
    }
  }, [user, loading, router]);

  // Show loading state while auth is being checked
  if (loading) {
    console.log('[DASHBOARD] Still loading auth...');
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-pulse flex flex-col items-center">
          <div className="w-12 h-12 rounded-full bg-emerald-200 mb-4"></div>
          <div className="h-4 w-24 bg-emerald-100 rounded"></div>
        </div>
      </div>
    );
  }

  // If not loading and no user, return null (redirect will happen via useEffect)
  if (!user) {
    console.log('[DASHBOARD] No user and not loading - should redirect');
    const redirectRenderStart = performance.now();
    renderDebug.logTiming('redirect-render', redirectRenderStart);
    return null;
  }

  const fetchPlants = async () => {
      try {
        setIsLoading(true);
        const response = await axiosClient.get('/api/plants');
        setPlants(response.data.data);
        setError(null);
      } catch (err) {
        console.error('Error fetching plants:', err);
        setError(t('errors.fetchFailed', 'Failed to fetch plants'));
      } finally {
        setIsLoading(false);
      }
    };
  
  // Fetch sensor data using the custom hook
  const fetchSensorData = async () => {
    const response = await axiosClient.get('/api/sensor/latest');
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
        if (data?.data) {
          //normalize keys by trimming whitespace
          const normalized = Object.fromEntries(
            Object.entries(data.data).map(([key, value]) => [key.trim(), 
              {
                ...value,
                  // normalize fields to what PlantCard expects
                  soil_moisture:
                    value.soil_moisture ??
                    value.moisture ??
                    value.soilMoisture ??
                    null,
                  temperature:
                    value.temperature ??
                    value.temp ??
                    null,
                  light_intensity:
                    value.light ??
                    value.light_intensity ??
                    value.lightLevel ??
                    null,
                  air_humidity:
                    value.air_humidity ??
                    value.humidity ??
                    null,
                },
              ])
            );
          setSensorData(normalized);
          console.log("[DEBUG] Normalized sensorData preview:", normalized);
        }
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
  
  // Calculate tree statistics from plants array
  const treeStats = useMemo(() => {
    if (!Array.isArray(plants)) return { totalTrees: 0, healthyTrees: 0, needsAttention: 0 };
    
    return {
      totalTrees: plants.length,
      healthyTrees: plants.filter(plant => plant.status === 'healthy').length,
      needsAttention: plants.filter(plant => plant.status !== 'healthy').length
    };
  }, [plants]);

  if (loading || isLoading || settingsLoading) {
    console.log('[DEBUG] Full plants array:', plants);
    console.log('[DEBUG] Full sensorData object:', sensorData);
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
       <div className="min-h-screen bg-gray-50 dark:bg-gray-900 page-transition">
      <main className="container mx-auto px-4 py-8">
        {/* No Data Message */}
        
        {/* Welcome Banner */}
        <div className="bg-gradient-to-r from-emerald-500 to-emerald-700 dark:from-emerald-600 dark:to-emerald-800 rounded-xl shadow-lg mb-8 p-6 text-white flex items-center justify-between stagger-item">
          <div>
            <h1 className="text-2xl font-bold mb-2">
              {t('dashboard.welcome', 'Welcome back')}, {user?.family_name || user?.given_name || t('common.user', 'User')}!
            </h1>
            <p className="opacity-90">
              {t('dashboard.overview', 'Your plant monitoring dashboard')}
            </p>
          </div>
          <div className="hidden md:block">
            <button 
            onClick={() => router.push('/add-plant')}
            aria-label={t('dashboard.addPlant', 'Add New Plant')}
            className="bg-white dark:bg-gray-100 text-emerald-700 dark:text-emerald-800 px-4 py-2 rounded-lg font-medium hover:bg-emerald-50 dark:hover:bg-gray-200 transition-colors">
              {t('dashboard.addPlant', 'Add New Plant')}
            </button>
          </div>
        </div>


        
        {/* Tree Statistics */}
        {settings.widgets?.showPlantOverview && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8 stagger-item">
            <div className="bg-white dark:bg-gray-800 p-3 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 flex items-center stagger-item">
              <div className="bg-green-100 dark:bg-green-900 p-3 rounded-full mr-4">
                {showIcons && <TreePine className="h-6 w-6 text-green-600 dark:text-green-400" />}
              </div>
              <div>
                <p className={`text-gray-500 dark:text-gray-400 text-sm ${showTitles ? '' : 'hidden'}`}>{t('stats.total', 'Total Trees')}</p>
                <p className="text-xl font-semibold text-gray-900 dark:text-white">{treeStats.totalTrees}</p>
              </div>
            </div>    
            <div className="bg-white dark:bg-gray-800 p-3 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 flex items-center stagger-item">
              <div className="bg-emerald-100 dark:bg-emerald-900 p-3 rounded-full mr-4">
                {showIcons && (
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-emerald-600 dark:text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                )}
              </div>
              <div>
                <p className={`text-gray-500 dark:text-gray-400 text-sm ${showTitles ? '' : 'hidden'}`}>{t('stats.healthy', 'Healthy')}</p>
                <p className="text-xl font-semibold text-gray-900 dark:text-white">{treeStats.healthyTrees}</p>
              </div>
            </div>
            <div className="bg-white dark:bg-gray-800 p-3 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 flex items-center stagger-item">
              <div className="bg-amber-100 dark:bg-amber-900 p-3 rounded-full mr-4">
                {showIcons && (
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-amber-600 dark:text-amber-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                )}
              </div>
              <div>
                <p className={`text-gray-500 dark:text-gray-400 text-sm ${showTitles ? '' : 'hidden'}`}>{t('stats.attention', 'Needs Attention')}</p>
                <p className="text-xl font-semibold text-gray-900 dark:text-white">{treeStats.needsAttention}</p>
              </div>
            </div>
          </div>
        )}
        
        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left column - Plants & AI Features */}
          <div className="lg:col-span-2 space-y-6">
            {noData ? (
              <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 p-8 text-center my-8 fade-in">
                <div className="flex justify-center mb-4">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 text-gray-300 dark:text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <h3 className="text-lg font-medium mb-2 text-gray-900 dark:text-white">{t('dashboard.noData', 'No dashboard data found')}</h3>
                <p className="text-gray-500 dark:text-gray-400 mb-4">{t('dashboard.noDataDescription', 'We couldn\'t find any plants or sensor data. Add your first plant to get started.')}</p>
                <button 
                  onClick={() => router.push('/plants')}
                  className="px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 dark:bg-emerald-700 dark:hover:bg-emerald-600 transition-colors btn-transition"
                >
                  {t('dashboard.addFirstPlant', 'Add Your First Plant')}
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                {plants.map((plant) => {
                    console.log('[DEBUG] Rendering plant:', plant.custom_name);
                    console.log('[DEBUG] Matching sensorData key:', plant.device_key?.trim());
                    console.log('[DEBUG] Matching sensorData found:', sensorData[plant.device_key?.trim()]);
                    return (
                      <PlantCard
                        key={plant.plant_id}
                        plant={plant}
                        sensorData={sensorData[plant.device_key?.trim()]}
                      />
                    );
                })}
              </div>
            )}
            
            {/* AI Features Section - Shows below plants when AI toggle is enabled and user has Ultimate role */}
            {settings.widgets?.enableAIFeatures && user?.role === 'Ultimate' && !noData && (
              <div className="ai-toggle-enter">
                <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 p-6 card-hover">
                  <div className="flex items-center gap-3 mb-6">
                    <div className="bg-gradient-to-r from-purple-500 to-blue-500 p-3 rounded-full">
                      {showIcons && (
                        <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                        </svg>
                      )}
                    </div>
                    <div>
                      <h3 className={`text-lg font-semibold text-gray-900 dark:text-gray-100 ${showTitles ? '' : 'hidden'}`}>
                        {t('dashboard.aiInsights', 'AI Insights')}
                      </h3>
                      <p className={`text-sm text-gray-500 dark:text-gray-400 ${showTitles ? '' : 'hidden'}`}>
                        {t('dashboard.aiInsightsDesc', 'AI-powered plant care recommendations and analysis')}
                      </p>
                    </div>
                  </div>
                  
                  {/* AI Features Grid */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="bg-gradient-to-br from-emerald-50 to-green-50 dark:from-emerald-900/20 dark:to-green-900/20 rounded-lg p-4 border border-emerald-200 dark:border-emerald-800 scale-in">
                      <div className="flex items-center gap-3 mb-3">
                        <div className="bg-emerald-100 dark:bg-emerald-900 p-2 rounded-full">
                          {showIcons && (
                            <svg className="w-5 h-5 text-emerald-600 dark:text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                            </svg>
                          )}
                        </div>
                        <h4 className={`font-medium text-gray-900 dark:text-gray-100 ${showTitles ? '' : 'hidden'}`}>
                          {t('ai.features.smartPredictions', 'Smart Predictions')}
                        </h4>
                      </div>
                      <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                        {t('ai.features.smartPredictionsDesc', 'Get AI-powered watering schedules and growth predictions')}
                      </p>
                      <Link 
                        href="/ai/predictions" 
                        className="inline-flex items-center text-sm text-emerald-600 hover:text-emerald-700 dark:text-emerald-400 dark:hover:text-emerald-300 font-medium btn-transition"
                      >
                        {t('common.explore', 'Explore')} →
                      </Link>
                    </div>
                    
                    <div className="bg-gradient-to-br from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 rounded-lg p-4 border border-blue-200 dark:border-blue-800 scale-in" style={{animationDelay: '0.1s'}}>
                      <div className="flex items-center gap-3 mb-3">
                        <div className="bg-blue-100 dark:bg-blue-900 p-2 rounded-full">
                          {showIcons && (
                            <svg className="w-5 h-5 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                            </svg>
                          )}
                        </div>
                        <h4 className={`font-medium text-gray-900 dark:text-gray-100 ${showTitles ? '' : 'hidden'}`}>
                          {t('ai.features.imageAnalysis', 'Image Analysis')}
                        </h4>
                      </div>
                      <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                        {t('ai.features.imageAnalysisDesc', 'Analyze plant photos for health assessment and disease detection')}
                      </p>
                      <Link 
                        href="/ai/image-analysis" 
                        className="inline-flex items-center text-sm text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 font-medium btn-transition"
                      >
                        {t('common.explore', 'Explore')} →
                      </Link>
                    </div>
                    
                    <div className="bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 rounded-lg p-4 border border-purple-200 dark:border-purple-800 scale-in" style={{animationDelay: '0.2s'}}>
                      <div className="flex items-center gap-3 mb-3">
                        <div className="bg-purple-100 dark:bg-purple-900 p-2 rounded-full">
                          {showIcons && (
                            <svg className="w-5 h-5 text-purple-600 dark:text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                            </svg>
                          )}
                        </div>
                        <h4 className={`font-medium text-gray-900 dark:text-gray-100 ${showTitles ? '' : 'hidden'}`}>
                          {t('ai.features.aiChat', 'AI Assistant')}
                        </h4>
                      </div>
                      <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                        {t('ai.features.aiChatDesc', 'Ask questions and get personalized plant care advice')}
                      </p>
                      <Link 
                        href="/ai/chat" 
                        className="inline-flex items-center text-sm text-purple-600 hover:text-purple-700 dark:text-purple-400 dark:hover:text-purple-300 font-medium btn-transition"
                      >
                        {t('common.explore', 'Explore')} →
                      </Link>
                    </div>
                    
                    <div className="bg-gradient-to-br from-orange-50 to-red-50 dark:from-orange-900/20 dark:to-red-900/20 rounded-lg p-4 border border-orange-200 dark:border-orange-800 scale-in" style={{animationDelay: '0.3s'}}>
                      <div className="flex items-center gap-3 mb-3">
                        <div className="bg-orange-100 dark:bg-orange-900 p-2 rounded-full">
                          {showIcons && (
                            <svg className="w-5 h-5 text-orange-600 dark:text-orange-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                            </svg>
                          )}
                        </div>
                        <h4 className={`font-medium text-gray-900 dark:text-gray-100 ${showTitles ? '' : 'hidden'}`}>
                          {t('ai.features.analytics', 'Smart Analytics')}
                        </h4>
                      </div>
                      <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                        {t('ai.features.analyticsDesc', 'View detailed insights on plant growth patterns and trends')}
                      </p>
                      <Link 
                        href="/ai/analytics" 
                        className="inline-flex items-center text-sm text-orange-600 hover:text-orange-700 dark:text-orange-400 dark:hover:text-orange-300 font-medium btn-transition"
                      >
                        {t('common.explore', 'Explore')} →
                      </Link>
                    </div>
                  </div>
                  
                  {/* AI Status Indicator */}
                  <div className="mt-6 pt-6 border-t border-gray-200 dark:border-gray-700">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                        <span className="text-sm text-gray-600 dark:text-gray-400">
                          {t('ai.status.active', 'AI Features Active')}
                        </span>
                      </div>
                      <span className="text-xs text-gray-500 dark:text-gray-500 bg-purple-100 dark:bg-purple-900/30 px-2 py-1 rounded-full">
                        {t('ai.status.ultimateOnly', 'Ultimate Plan')}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
          
          {/* Right column - Dashboard Widgets */}
          <div className="space-y-6">
            {settings.widgets?.showWeatherWidget && (
              <div className="slide-in-right">
                <WeatherWidget />
              </div>
            )}
            
            {settings.widgets?.showNotifications && (
              <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 p-5 slide-in-right card-hover">
                <div className="flex items-center gap-3 mb-4">
                  {showIcons && (
                    <svg className="w-5 h-5 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  )}
                  <h3 className={`font-medium text-gray-900 dark:text-gray-100 ${showTitles ? '' : 'hidden'}`}>
                    {t('dashboard.recentActivity', 'Recent Activity')}
                  </h3>
                </div>
                <RecentActivity />
              </div>
            )}
            
            {settings.widgets?.showWateringSchedule && (
              <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 p-5 slide-in-right card-hover">
                <div className="flex items-center gap-3 mb-4">
                  {showIcons && (
                    <svg className="w-5 h-5 text-emerald-600 dark:text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
                    </svg>
                  )}
                  <h3 className={`font-medium text-gray-900 dark:text-gray-100 ${showTitles ? '' : 'hidden'}`}>
                    {t('dashboard.wateringSchedule', 'Watering Schedule')}
                  </h3>
                </div>
                <WateringSchedule plants={plants} />
              </div>
            )}
            
            {/* Show Premium feature banner only for Regular users */}
            {user?.role === 'Regular' && (
              <div className="slide-in-right">
                <PremiumFeaturePrompt />
              </div>
            )}
            
            {/* Settings Quick Access */}
            <div className="bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-800 dark:to-gray-700 rounded-xl p-4 border border-gray-200 dark:border-gray-600 slide-in-right card-hover">
              <div className="flex items-center gap-3 mb-2">
                {showIcons && <Settings size={20} className="text-gray-600 dark:text-gray-400" />}
                <h3 className={`font-medium text-gray-900 dark:text-white ${showTitles ? '' : 'hidden'}`}>
                  {t('dashboard.customizeLayout', 'Customize Your Dashboard')}
                </h3>
              </div>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                {t('dashboard.customizeDescription', 'Manage widget visibility and dashboard preferences')}
              </p>
              <Link 
                href="/settings"
                className="inline-flex items-center gap-2 text-sm bg-emerald-600 hover:bg-emerald-700 text-white px-3 py-2 rounded-lg btn-transition fade-in"
              >
                {showIcons && <Settings size={16} />}
                {t('dashboard.openSettings', 'Open Settings')}
              </Link>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
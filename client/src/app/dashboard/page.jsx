'use client'

import { useState, useEffect, useMemo } from 'react';
import { useAuth } from '@/providers/AuthProvider';
import { useDashboardWidgets } from '@/providers/DashboardWidgetProvider';
import { useRouter } from 'next/navigation';
import { useTranslation } from 'react-i18next';
import { useTheme } from '@/contexts/ThemeContext';
import DashboardHeader from '@/components/dashboard/DashboardHeader';
import WeatherWidget from '@/components/dashboard/WeatherWidget';
import RecentActivity from '@/components/dashboard/RecentActivity';
import WateringSchedule from '@/components/dashboard/WateringSchedule';
import PremiumFeaturePrompt from '@/components/dashboard/PremiumFeaturePrompt';
import AIFeaturesSection from '@/components/ai/AIFeaturesSection';
import Navbar from '@/components/navigation/Navbar';
import ThemedLoader from '@/components/ThemedLoader';
import { Settings, TreePine } from 'lucide-react';
import useMemoizedData from '@/hooks/useMemoizedData';
import axiosClient from '@/api/axiosClient';
import Link from 'next/link';
import { useRenderDebug, useOperationTiming, useDataFetchDebug } from '@/utils/renderDebug';

export default function DashboardPage() {
  const { user, loading, isPremium } = useAuth();
  const { widgetSettings } = useDashboardWidgets();
  const router = useRouter();
  const { t } = useTranslation();
  const { isDark, themeColors } = useTheme();
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
    widgetSettings,
    plantsCount: plants.length
  });

  const { startTiming, endTiming } = useOperationTiming('DashboardPage');
  const { fetchState, fetchWithDebug } = useDataFetchDebug('DashboardPage');

  console.log('[DASHBOARD] Render - user:', user?.email, 'loading:', loading, 'isPremium:', isPremium);
  console.log('[DASHBOARD] User object:', user);

  // 🚀 PERFORMANCE MONITOR - Load performance monitoring tools
  useEffect(() => {
    if (typeof window !== 'undefined' && process.env.NODE_ENV === 'development') {
      // Load performance monitor script
      const script = document.createElement('script');
      script.src = '/utils/performanceMonitor.js';
      script.async = true;
      document.head.appendChild(script);
      
      // Enable render debugging globally
      setTimeout(() => {
        if (window.perfDebug) {
          window.perfDebug.toggle(true);
          console.log('🚀 Dashboard performance monitoring enabled');
        }
      }, 1000);
      
      return () => {
        document.head.removeChild(script);
      };
    }
  }, []);

  // Redirect if not logged in (only after loading is complete)
  useEffect(() => {
    const authCheckStart = startTiming('auth-check');
    
    console.log('[DASHBOARD] Auth check - loading:', loading, 'user:', user?.email);
    console.log('[DASHBOARD] User details:', {
      hasUser: !!user,
      userId: user?.id,
      email: user?.email,
      isPremium: user?.isPremium || user?.role === 'Premium' || user?.role === 'Admin',
      role: user?.role
    });
    
    if (!loading && !user) {
      console.log('[DASHBOARD] No user found after loading complete - redirecting to /login');
      endTiming('auth-check');
      const redirectStart = startTiming('redirect-to-login');
      router.push('/login').then(() => {
        endTiming('redirect-to-login');
      });
    } else if (!loading && user) {
      endTiming('auth-check');
    }
  }, [user, loading, router, startTiming, endTiming]);

  // Show loading state while auth is being checked
  if (loading) {
    console.log('[DASHBOARD] Still loading auth...');
    const loadingRenderStart = performance.now();
    
    const loadingComponent = (
      <div className="flex items-center justify-center min-h-screen">
        <ThemedLoader 
          size="xl" 
          showText={true} 
          text={t('common.loading', 'Loading...')}
        />
      </div>
    );
    
    renderDebug.logTiming('loading-render', loadingRenderStart);
    return loadingComponent;
  }

  // If not loading and no user, return null (redirect will happen via useEffect)
  if (!user) {
    console.log('[DASHBOARD] No user and not loading - should redirect');
    const redirectRenderStart = performance.now();
    renderDebug.logTiming('redirect-render', redirectRenderStart);
    return null;
  }



  // Mock tree statistics - these will be non-toggleable
  const treeStats = {
    totalTrees: 12,
    healthyTrees: 10,
    needsAttention: 2,
    co2Absorbed: 145.7, // kg per year
    oxygenProduced: 106.2 // kg per year
  };

  // Set loading state based on authentication only
  useEffect(() => {
    const loadingStateStart = startTiming('loading-state-update');
    setIsLoading(loading);
    endTiming('loading-state-update');
  }, [loading, startTiming, endTiming]);

  if (loading || isLoading) {
    const dashboardLoadingStart = performance.now();
    const component = (
      <div className="flex items-center justify-center h-screen bg-app-gradient">
        <ThemedLoader 
          size="xl" 
          showText={true} 
          text={t('common.loading', 'Loading Dashboard...')}
        />
      </div>
    );
    renderDebug.logTiming('dashboard-loading-render', dashboardLoadingStart);
    return component;
  }

  // 🚀 RENDER DEBUG - Main dashboard render timing
  const mainRenderStart = performance.now();

  const dashboardComponent = (
    <div className="min-h-screen bg-app-gradient fade-in">
      <main className="container mx-auto px-4 py-8">
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
          <div className="hidden md:flex items-center gap-4 fade-in">
            <Link href="/settings" className="bg-white/20 backdrop-blur-sm rounded-lg px-3 py-2 hover:bg-white/30 btn-transition">
              <div className="flex items-center gap-2">
                <Settings size={20} />
                <span className="text-sm font-medium">{t('navigation.settings', 'Settings')}</span>
              </div>
            </Link>
          </div>
        </div>


        
        {/* Tree Statistics */}
        {widgetSettings.showPlantOverview && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8 stagger-item">
            <div className="bg-white dark:bg-gray-800 p-3 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 flex items-center stagger-item">
              <div className="bg-green-100 dark:bg-green-900 p-3 rounded-full mr-4">
                <TreePine className="h-6 w-6 text-green-600 dark:text-green-400" />
              </div>
              <div>
                <p className="text-gray-500 dark:text-gray-400 text-sm">Total Trees</p>
                <p className="text-xl font-semibold text-gray-900 dark:text-white">{treeStats.totalTrees}</p>
              </div>
            </div>    
            <div className="bg-white dark:bg-gray-800 p-3 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 flex items-center stagger-item">
              <div className="bg-emerald-100 dark:bg-emerald-900 p-3 rounded-full mr-4">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-emerald-600 dark:text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div>
                <p className="text-gray-500 dark:text-gray-400 text-sm">Healthy</p>
                <p className="text-xl font-semibold text-gray-900 dark:text-white">{treeStats.healthyTrees}</p>
              </div>
            </div>
            <div className="bg-white dark:bg-gray-800 p-3 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 flex items-center stagger-item">
              <div className="bg-amber-100 dark:bg-amber-900 p-3 rounded-full mr-4">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-amber-600 dark:text-amber-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
              </div>
              <div>
                <p className="text-gray-500 dark:text-gray-400 text-sm">Needs Attention</p>
                <p className="text-xl font-semibold text-gray-900 dark:text-white">{treeStats.needsAttention}</p>
              </div>
            </div>
          </div>
        )}
        
        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left column - AI Features */}
          <div className="lg:col-span-2 space-y-6">
            {widgetSettings.showAIInsights && (
              <div>
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-xl font-semibold text-gray-800 dark:text-gray-200">{t('dashboard.aiFeatures', 'AI Features')}</h2>
                  <Link href="/settings" className="text-sm text-emerald-600 hover:text-emerald-700 flex items-center gap-1">
                    <Settings size={16} />
                    {t('dashboard.configureWidgets', 'Configure')}
                  </Link>
                </div>
                <AIFeaturesSection />
              </div>
            )}
          </div>
          
          {/* Right column - Dashboard Widgets */}
          <div className="space-y-6">
            {widgetSettings.showWeatherWidget && (
              <WeatherWidget />
            )}
            
            {widgetSettings.showRecentActivity && (
              <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 p-5">
                <h3 className="font-medium text-gray-900 dark:text-white mb-4">{t('dashboard.recentActivity', 'Recent Activity')}</h3>
                <RecentActivity />
              </div>
            )}
            
            {widgetSettings.showWateringSchedule && (
              <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 p-5">
                <h3 className="font-medium text-gray-900 dark:text-white mb-4">{t('dashboard.wateringSchedule', 'Watering Schedule')}</h3>
                <WateringSchedule plants={[]} />
              </div>
            )}
            
            {/* Premium feature banner */}
            {user?.role === 'Regular' && (
              <PremiumFeaturePrompt />
            )}
            
            {/* Settings Quick Access */}
            <div className="bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-800 dark:to-gray-700 rounded-xl p-4 border border-gray-200 dark:border-gray-600">
              <div className="flex items-center gap-3 mb-2">
                <Settings size={20} className="text-gray-600 dark:text-gray-400" />
                <h3 className="font-medium text-gray-900 dark:text-white">{t('dashboard.customizeLayout', 'Customize Your Dashboard')}</h3>
              </div>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                {t('dashboard.customizeDescription', 'Manage widget visibility and dashboard preferences')}
              </p>
              <Link 
                href="/settings"
                className="inline-flex items-center gap-2 text-sm bg-emerald-600 hover:bg-emerald-700 text-white px-3 py-2 rounded-lg btn-transition fade-in"
              >
                <Settings size={16} />
                {t('dashboard.openSettings', 'Open Settings')}
              </Link>
            </div>
          </div>
        </div>
      </main>
    </div>
  );

  // 🚀 RENDER DEBUG - Log main render completion
  renderDebug.logTiming('main-dashboard-render', mainRenderStart);
  
  return dashboardComponent;
}
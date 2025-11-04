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
import Navbar from '@/components/Navbar';

// Mock data for development - would come from API in real app
const MOCK_PLANTS = [
  {
    plant_id: 1,
    name: 'Snake Plant',
    species: 'Sansevieria trifasciata',
    image: '/images/plants/snake-plant.jpg',
    location: 'Living Room',
    status: 'healthy',
    lastWatered: '2023-11-15T10:30:00Z',
  },
  {
    plant_id: 2,
    name: 'Monstera',
    species: 'Monstera deliciosa',
    image: '/images/plants/monstera.jpg',
    location: 'Office',
    status: 'needs_attention',
    lastWatered: '2023-11-10T08:15:00Z',
  },
  {
    plant_id: 3,
    name: 'Peace Lily',
    species: 'Spathiphyllum',
    image: '/images/plants/peace-lily.jpg',
    location: 'Bedroom',
    status: 'needs_water',
    lastWatered: '2023-11-08T14:45:00Z',
  },
];

const MOCK_SENSOR_DATA = {
  1: { moisture: 72, temperature: 22.5, light: 85 },
  2: { moisture: 43, temperature: 24.1, light: 65 },
  3: { moisture: 28, temperature: 21.8, light: 55 },
};

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
    if (!loading && !user) {
      router.push('/login');
    }
  }, [user, loading, router]);

  // Redirect if not logged in (only after loading is complete)
  useEffect(() => {
    if (user) {
      // In a real app, we would fetch from the API here
      // For now, using mock data with a timeout to simulate API call
      const fetchData = async () => {
        setIsLoading(true);
        try {
          // Simulate API call
          await new Promise(resolve => setTimeout(resolve, 800));
          
          // Set mock data
          setPlants(MOCK_PLANTS);
          setSensorData(MOCK_SENSOR_DATA);
        } catch (err) {
          console.error('Error fetching dashboard data:', err);
          setError(t('dashboard.loadError', 'Failed to load dashboard data. Please try again later.'));
        } finally {
          setIsLoading(false);
        }
      };

      fetchData();
    }
  }, [user]);

  if (loading || isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-pulse flex flex-col items-center">
          <div className="w-12 h-12 rounded-full bg-emerald-200 mb-4"></div>
          <div className="h-4 w-24 bg-emerald-100 rounded"></div>
        </div>
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
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar user={user} />
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
            <WeatherWidget />
            
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
              <h3 className="font-medium text-gray-900 mb-4">{t('dashboard.recentActivity', 'Recent Activity')}</h3>
              <RecentActivity />
            </div>
            
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
              <h3 className="font-medium text-gray-900 mb-4">{t('dashboard.wateringSchedule', 'Watering Schedule')}</h3>
              <WateringSchedule plants={plants} />
            </div>
            
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
    </AIProvider>
  );

  // 🚀 RENDER DEBUG - Log main render completion
  renderDebug.logTiming('main-dashboard-render', mainRenderStart);
  
  return dashboardComponent;
}
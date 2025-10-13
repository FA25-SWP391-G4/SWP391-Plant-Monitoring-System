'use client'

import { useState, useEffect } from 'react';
import { useAuth } from '@/providers/AuthProvider';
import { useRouter } from 'next/navigation';
import { useTranslation } from 'react-i18next';
import DashboardHeader from '@/components/dashboard/DashboardHeader';
import PlantCard from '@/components/dashboard/PlantCard';
import WeatherWidget from '@/components/dashboard/WeatherWidget';
import RecentActivity from '@/components/dashboard/RecentActivity';
import WateringSchedule from '@/components/dashboard/WateringSchedule';
import PremiumFeaturePrompt from '@/components/dashboard/PremiumFeaturePrompt';

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
  const router = useRouter();
  const { t } = useTranslation();
  const [plants, setPlants] = useState([]);
  const [sensorData, setSensorData] = useState({});
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  // Redirect if not logged in
  useEffect(() => {
    if (!loading && !user) {
      router.push('/login');
    }
  }, [user, loading, router]);

  // Fetch dashboard data
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
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-screen">
        <div className="text-red-500 mb-4">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
        <h2 className="text-xl font-semibold mb-2">{t('dashboard.errorLoading', 'Error Loading Dashboard')}</h2>
        <p className="text-gray-600">{error}</p>
        <button 
          onClick={() => window.location.reload()} 
          className="mt-4 px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors"
        >
          {t('common.retry', 'Retry')}
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <DashboardHeader user={user} />
      
      <main className="container mx-auto px-4 py-8">
        {/* Welcome Banner */}
        <div className="bg-gradient-to-r from-emerald-500 to-emerald-700 rounded-xl shadow-lg mb-8 p-6 text-white flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold mb-2">
              {t('dashboard.welcome', 'Welcome back')}, {user?.firstName || t('common.plantLover', 'Plant Lover')}!
            </h1>
            <p className="opacity-90">
              {t('dashboard.overview', 'Here\'s an overview of your plant collection')}
            </p>
          </div>
          <div className="hidden md:block">
            <button className="bg-white text-emerald-700 px-4 py-2 rounded-lg font-medium hover:bg-emerald-50 transition-colors">
              {t('dashboard.addPlant', 'Add New Plant')}
            </button>
          </div>
        </div>
        
        {/* Summary Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-100 flex items-center">
            <div className="bg-emerald-100 p-3 rounded-full mr-4">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
              </svg>
            </div>
            <div>
              <p className="text-gray-500 text-sm">{t('dashboard.totalPlants', 'Total Plants')}</p>
              <p className="text-xl font-semibold">{plants.length}</p>
            </div>
          </div>
          
          <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-100 flex items-center">
            <div className="bg-blue-100 p-3 rounded-full mr-4">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
              </svg>
            </div>
            <div>
              <p className="text-gray-500 text-sm">{t('dashboard.needsWatering', 'Needs Watering')}</p>
              <p className="text-xl font-semibold">
                {plants.filter(plant => plant.status === 'needs_water').length}
              </p>
            </div>
          </div>
          
          <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-100 flex items-center">
            <div className="bg-amber-100 p-3 rounded-full mr-4">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-amber-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
            <div>
              <p className="text-gray-500 text-sm">{t('dashboard.needsAttention', 'Needs Attention')}</p>
              <p className="text-xl font-semibold">
                {plants.filter(plant => plant.status === 'needs_attention').length}
              </p>
            </div>
          </div>
        </div>
        
        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left column - Plant cards */}
          <div className="lg:col-span-2 space-y-6">
            <h2 className="text-xl font-semibold text-gray-800 mb-4">{t('dashboard.yourPlants', 'Your Plants')}</h2>
            
            {plants.length === 0 ? (
              <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-8 text-center">
                <div className="flex justify-center mb-4">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                  </svg>
                </div>
                <h3 className="text-lg font-medium mb-2">{t('dashboard.noPlants', 'No plants added yet')}</h3>
                <p className="text-gray-500 mb-4">{t('dashboard.startAdding', 'Start adding plants to your collection')}</p>
                <button className="px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors">
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
            
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
              <h3 className="font-medium text-gray-900 mb-4">{t('dashboard.recentActivity', 'Recent Activity')}</h3>
              <RecentActivity />
            </div>
            
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
              <h3 className="font-medium text-gray-900 mb-4">{t('dashboard.wateringSchedule', 'Watering Schedule')}</h3>
              <WateringSchedule plants={plants} />
            </div>
            
            {/* Premium feature banner */}
            {!isPremium && (
              <PremiumFeaturePrompt />
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
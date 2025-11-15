'use client'

import { useState, useEffect } from 'react';
import { useAuth } from '@/providers/AuthProvider';
import { useRouter } from 'next/navigation';
import { useTranslation } from 'react-i18next';
import PlantDetails from '@/components/plants/PlantDetails';
import AIChatbot from '@/components/ai/AIChatbot';
import AIWateringPrediction from '@/components/AIWateringPrediction';
import AIImageRecognition from '@/components/AIImageRecognition';
import SensorReadings from '@/components/plants/SensorReadings';
import WateringScheduleControl from '@/components/plants/WateringScheduleControl';
import ManualWateringControl from '@/components/plants/ManualWateringControl';
import api from '@/api/axiosClient';

export default function PlantDetailPage({ params }) {
  const { t } = useTranslation();
  const { isAuthenticated, user, loading } = useAuth();
  const router = useRouter();
  const [plant, setPlant] = useState(null);
  const [sensorData, setSensorData] = useState(null);
  const [schedule, setSchedule] = useState(null);
  const [deviceStatus, setDeviceStatus] = useState('offline');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('overview');
  
  const plantId = params?.id;
  
  useEffect(() => {
    if (!loading && !isAuthenticated) {
      router.push('/login');
    }
  }, [isAuthenticated, loading, router]);
  
  useEffect(() => {
    if (isAuthenticated && plantId) {
      fetchPlants();
    }
  }, [isAuthenticated, plantId]);
  
const fetchPlants = async () => {
    try {
      setLoading(true);
      const response = await api.get('/api/plants');
      setPlants(response.data.data);
      setError(null);
    } catch (err) {
      console.error('Error fetching plants:', err);
      setError(t('errors.fetchFailed', 'Failed to fetch plants'));
    } finally {
      setLoading(false);
    }
  };
  
  const handleWateringScheduleUpdate = async (newSchedule) => {
    try {
      const response = await api.put(`/api/plants/${plantId}/watering-schedule`, newSchedule);
      setSchedule(response.data.data);
    } catch (err) {
      console.error('Error updating watering schedule:', err);
      setError(t('errors.updateFailed', 'Failed to update watering schedule'));
    }
  };
  
  const handleManualWatering = async (duration) => {
    try {
      await api.post(`/api/plants/${plantId}/water`, { duration });
      // Show success message
    } catch (err) {
      console.error('Error triggering manual watering:', err);
      setError(t('errors.wateringFailed', 'Failed to trigger watering'));
    }
  };
  
  if (loading || isLoading) {
    return (
      <div className="container mx-auto px-4 py-8 flex justify-center items-center min-h-[70vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-emerald-500"></div>
      </div>
    );
  }
  
  if (!isAuthenticated) {
    return null; // Will redirect to login via useEffect
  }
  
  if (error) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
          <p>{error}</p>
        </div>
      </div>
    );
  }
  
  if (!plant) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="bg-amber-50 border border-amber-200 text-amber-700 px-4 py-3 rounded-lg">
          <p>{t('plants.notFound', 'Plant not found')}</p>
        </div>
      </div>
    );
  }
  
  const isPremiumUser = user?.role === 'Premium' || user?.role === 'Admin';
  
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <div className="text-sm breadcrumbs">
          <ul>
            <li>
              <a href="/dashboard">
                {t('navigation.dashboard', 'Dashboard')}
              </a>
            </li>
            <li>
              <a href="/plants">
                {t('navigation.plants', 'Plants')}
              </a>
            </li>
            <li className="font-medium">
              {plant.name}
            </li>
          </ul>
        </div>
      </div>
      
      <div className="flex flex-col lg:flex-row gap-6">
        {/* Left column: Plant details */}
        <div className="w-full lg:w-2/3">
          <div className="bg-white rounded-xl shadow-sm overflow-hidden border border-gray-100">
            {/* Tabs navigation */}
            <div className="flex border-b border-gray-100">
              <button 
                className={`px-6 py-3 text-sm font-medium ${activeTab === 'overview' ? 'border-b-2 border-emerald-500 text-emerald-600' : 'text-gray-500 hover:text-gray-700'}`}
                onClick={() => setActiveTab('overview')}
              >
                {t('plants.tabs.overview', 'Overview')}
              </button>
              <button 
                className={`px-6 py-3 text-sm font-medium ${activeTab === 'sensors' ? 'border-b-2 border-emerald-500 text-emerald-600' : 'text-gray-500 hover:text-gray-700'}`}
                onClick={() => setActiveTab('sensors')}
              >
                {t('plants.tabs.sensorData', 'Sensor Data')}
              </button>
              {isPremiumUser && (
                <button 
                  className={`px-6 py-3 text-sm font-medium ${activeTab === 'schedule' ? 'border-b-2 border-emerald-500 text-emerald-600' : 'text-gray-500 hover:text-gray-700'}`}
                  onClick={() => setActiveTab('schedule')}
                >
                  {t('plants.tabs.wateringSchedule', 'Watering Schedule')}
                </button>
              )}
              <button 
                className={`px-6 py-3 text-sm font-medium ${activeTab === 'ai-predictions' ? 'border-b-2 border-emerald-500 text-emerald-600' : 'text-gray-500 hover:text-gray-700'}`}
                onClick={() => setActiveTab('ai-predictions')}
              >
                {t('plants.tabs.aiPredictions', 'AI Predictions')}
              </button>
              <button 
                className={`px-6 py-3 text-sm font-medium ${activeTab === 'disease-recognition' ? 'border-b-2 border-emerald-500 text-emerald-600' : 'text-gray-500 hover:text-gray-700'}`}
                onClick={() => setActiveTab('disease-recognition')}
              >
                {t('plants.tabs.diseaseRecognition', 'Disease Recognition')}
              </button>
              <button 
                className={`px-6 py-3 text-sm font-medium ${activeTab === 'ai-assistant' ? 'border-b-2 border-emerald-500 text-emerald-600' : 'text-gray-500 hover:text-gray-700'}`}
                onClick={() => setActiveTab('ai-assistant')}
              >
                {t('plants.tabs.aiAssistant', 'AI Assistant')}
              </button>
            </div>
            
            {/* Tab content */}
            <div className="p-6">
              {activeTab === 'overview' && (
                <PlantDetails plant={plant} />
              )}
              {activeTab === 'sensors' && (
                <SensorReadings readings={sensorData} />
              )}
              {activeTab === 'schedule' && isPremiumUser && (
                <WateringScheduleControl 
                  plantId={plantId} 
                  schedule={schedule} 
                  isPremium={isPremiumUser} 
                  onUpdateSchedule={handleWateringScheduleUpdate}
                />
              )}
              {activeTab === 'ai-predictions' && (
                <div className="max-w-4xl">
                  <AIWateringPrediction 
                    plant={plant} 
                    className="w-full"
                  />
                </div>
              )}
              {activeTab === 'disease-recognition' && (
                <div className="max-w-4xl">
                  <AIImageRecognition 
                    plant={plant} 
                    className="w-full"
                  />
                </div>
              )}
              {activeTab === 'ai-assistant' && (
                <div className="max-w-4xl">
                  <AIChatbot 
                    plant={plant} 
                    className="w-full"
                  />
                </div>
              )}
            </div>
          </div>
        </div>
        
        {/* Right column: Controls and status */}
        <div className="w-full lg:w-1/3">
          {/* Manual watering control */}
          <div className="bg-white rounded-xl shadow-sm overflow-hidden border border-gray-100 mb-6">
            <div className="p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                {t('plants.manualWatering', 'Manual Watering')}
              </h3>
              <ManualWateringControl 
                plantId={plantId} 
                deviceStatus={deviceStatus} 
                onWater={handleManualWatering}
              />
            </div>
          </div>
          
          {/* Status and info cards */}
          <div className="bg-white rounded-xl shadow-sm overflow-hidden border border-gray-100 mb-6">
            <div className="p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                {t('plants.deviceStatus', 'Device Status')}
              </h3>
              <div className="flex items-center mb-4">
                <div className={`w-3 h-3 rounded-full mr-2 ${deviceStatus === 'online' ? 'bg-green-500' : 'bg-red-500'}`}></div>
                <span className="text-gray-700">
                  {deviceStatus === 'online' 
                    ? t('devices.online', 'Online') 
                    : t('devices.offline', 'Offline')}
                </span>
              </div>
              
              <h4 className="font-medium text-gray-700 mb-2">
                {t('plants.lastWatered', 'Last Watered')}
              </h4>
              <p className="text-sm text-gray-600 mb-4">
                {plant.last_watered ? new Date(plant.last_watered).toLocaleString() : t('plants.notWateredYet', 'Not watered yet')}
              </p>
              
              <h4 className="font-medium text-gray-700 mb-2">
                {t('plants.nextScheduled', 'Next Scheduled Watering')}
              </h4>
              <p className="text-sm text-gray-600">
                {schedule?.next_watering ? new Date(schedule.next_watering).toLocaleString() : t('plants.notScheduled', 'Not scheduled')}
              </p>
            </div>
          </div>
          
          {/* Premium features promotion */}
          {!isPremiumUser && (
            <div className="bg-gradient-to-r from-emerald-500 to-teal-600 rounded-xl shadow-sm overflow-hidden text-white">
              <div className="p-6">
                <h3 className="text-lg font-semibold mb-2">
                  {t('premium.unlockFeatures', 'Unlock Premium Features')}
                </h3>
                <p className="mb-4 opacity-90">
                  {t('premium.scheduleDescription', 'Schedule automatic watering, get detailed analytics, and more with Premium.')}
                </p>
                <button
                  onClick={() => router.push('/premium')}
                  className="px-4 py-2 bg-white text-emerald-700 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  {t('premium.upgrade', 'Upgrade to Premium')}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
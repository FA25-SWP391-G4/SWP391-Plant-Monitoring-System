'use client'

import { useState, useEffect } from 'react';
import { useAuth } from '@/providers/AuthProvider';
import { useRouter, useParams } from 'next/navigation';
import { useTranslation } from 'react-i18next';
import Link from 'next/link';
import AIWateringPrediction from '@/components/AIWateringPrediction';
import AIChatbot from '@/components/AIChatbot';

export default function PlantDetailPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const params = useParams();
  const { t } = useTranslation();
  const [plant, setPlant] = useState(null);
  const [sensorData, setSensorData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');

  const plantId = params.id;

  // Redirect if not logged in
  useEffect(() => {
    if (!loading && !user) {
      router.push('/login');
    }
  }, [user, loading, router]);

  // Fetch plant data
  useEffect(() => {
    const fetchPlantData = async () => {
      try {
        // Mock plant data - would come from API
        const mockPlant = {
          plant_id: parseInt(plantId),
          name: 'Snake Plant',
          species: 'Sansevieria trifasciata',
          image: '/images/plants/snake-plant.jpg',
          location: 'Living Room',
          status: 'healthy',
          lastWatered: '2024-10-15T10:30:00Z',
          plantedDate: '2024-08-01T00:00:00Z',
          notes: 'This snake plant has been thriving in low light conditions. Very low maintenance.',
          care_instructions: {
            watering: 'Water every 2-3 weeks, allow soil to dry completely between waterings',
            light: 'Tolerates low light but prefers bright, indirect light',
            temperature: '65-75°F (18-24°C)',
            humidity: '40-50%'
          }
        };

        const mockSensorData = {
          moisture: 72,
          temperature: 22.5,
          humidity: 45,
          light: 85,
          last_updated: '2024-10-17T10:30:00Z'
        };

        // Simulate API delay
        await new Promise(resolve => setTimeout(resolve, 800));
        setPlant(mockPlant);
        setSensorData(mockSensorData);
      } catch (error) {
        console.error('Error fetching plant data:', error);
      } finally {
        setIsLoading(false);
      }
    };

    if (user && plantId) {
      fetchPlantData();
    }
  }, [user, plantId]);

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

  if (!user || !plant) {
    return (
      <div className="flex flex-col items-center justify-center h-screen">
        <div className="text-red-500 mb-4">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
        <h2 className="text-xl font-semibold mb-2">{t('plants.notFound', 'Plant Not Found')}</h2>
        <p className="text-gray-600 mb-4">{t('plants.notFoundDesc', 'The plant you\'re looking for doesn\'t exist or you don\'t have access to it.')}</p>
        <Link href="/dashboard" className="px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors">
          {t('common.backToDashboard', 'Back to Dashboard')}
        </Link>
      </div>
    );
  }

  const getStatusColor = (status) => {
    switch (status) {
      case 'healthy': return 'text-emerald-600 bg-emerald-50 border-emerald-200';
      case 'needs_water': return 'text-blue-600 bg-blue-50 border-blue-200';
      case 'needs_attention': return 'text-amber-600 bg-amber-50 border-amber-200';
      default: return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 mb-6">
          <div className="flex flex-col md:flex-row md:items-start md:space-x-6">
            {/* Plant Image */}
            <div className="w-full md:w-48 h-48 rounded-lg bg-gray-100 flex items-center justify-center overflow-hidden mb-4 md:mb-0">
              {plant.image ? (
                <img src={plant.image} alt={plant.name} className="w-full h-full object-cover" />
              ) : (
                <svg xmlns="http://www.w3.org/2000/svg" width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round" className="text-gray-300">
                  <path d="M12 10a6 6 0 0 0-6-6H4v12h2a6 6 0 0 0 6-6Z"></path>
                  <path d="M12 10a6 6 0 0 1 6-6h2v12h-2a6 6 0 0 1-6-6Z"></path>
                  <path d="M12 22v-8.3"></path>
                </svg>
              )}
            </div>

            {/* Plant Info */}
            <div className="flex-1">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h1 className="text-3xl font-bold text-gray-900 mb-2">{plant.name}</h1>
                  <p className="text-lg text-gray-600 mb-2">{plant.species}</p>
                  <div className="flex items-center text-gray-500 mb-2">
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-1">
                      <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"></path>
                      <circle cx="12" cy="10" r="3"></circle>
                    </svg>
                    {plant.location}
                  </div>
                </div>
                <span className={`px-3 py-1 rounded-full text-sm font-medium border ${getStatusColor(plant.status)}`}>
                  {t(`status.${plant.status}`, plant.status)}
                </span>
              </div>

              {/* Quick Actions */}
              <div className="flex flex-wrap gap-3">
                <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
                  {t('plants.waterNow', 'Water Now')}
                </button>
                <Link href={`/ai/chat?plant=${plant.plant_id}`} className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors">
                  {t('ai.askAI', 'Ask AI')}
                </Link>
                <Link href={`/ai/image-analysis?plant=${plant.plant_id}`} className="px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors">
                  {t('ai.analyzeImage', 'Analyze Image')}
                </Link>
                <button className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors">
                  {t('plants.editPlant', 'Edit Plant')}
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 mb-6">
          <div className="border-b border-gray-200">
            <nav className="flex space-x-8 px-6">
              {[
                { key: 'overview', label: t('plants.tabs.overview', 'Overview'), icon: '📊' },
                { key: 'ai-predictions', label: t('plants.tabs.aiPredictions', 'AI Predictions'), icon: '🔮' },
                { key: 'ai-chat', label: t('plants.tabs.aiChat', 'AI Chat'), icon: '💬' },
                { key: 'history', label: t('plants.tabs.history', 'History'), icon: '📈' }
              ].map(tab => (
                <button
                  key={tab.key}
                  onClick={() => setActiveTab(tab.key)}
                  className={`py-4 px-2 border-b-2 font-medium text-sm transition-colors ${
                    activeTab === tab.key
                      ? 'border-emerald-500 text-emerald-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  <span className="mr-2">{tab.icon}</span>
                  {tab.label}
                </button>
              ))}
            </nav>
          </div>

          <div className="p-6">
            {/* Overview Tab */}
            {activeTab === 'overview' && (
              <div className="space-y-6">
                {/* Current Sensor Data */}
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">
                    {t('plants.currentConditions', 'Current Conditions')}
                  </h3>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="bg-blue-50 p-4 rounded-lg">
                      <div className="flex items-center mb-2">
                        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-blue-600 mr-2">
                          <path d="M12 22a7 7 0 0 0 7-7c0-2-1-3.9-3-5.5s-3.5-4-4-6.5c-.5 2.5-2 4.9-4 6.5C6 11.1 5 13 5 15a7 7 0 0 0 7 7z"></path>
                        </svg>
                        <span className="text-sm font-medium text-gray-700">{t('metrics.moisture', 'Moisture')}</span>
                      </div>
                      <p className="text-2xl font-bold text-blue-600">{sensorData?.moisture}%</p>
                    </div>

                    <div className="bg-red-50 p-4 rounded-lg">
                      <div className="flex items-center mb-2">
                        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-red-600 mr-2">
                          <path d="M14 4v10.54a4 4 0 1 1-4 0V4a2 2 0 0 1 4 0Z"></path>
                        </svg>
                        <span className="text-sm font-medium text-gray-700">{t('metrics.temperature', 'Temperature')}</span>
                      </div>
                      <p className="text-2xl font-bold text-red-600">{sensorData?.temperature}°C</p>
                    </div>

                    <div className="bg-green-50 p-4 rounded-lg">
                      <div className="flex items-center mb-2">
                        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-green-600 mr-2">
                          <path d="M12 2v2"></path>
                          <path d="M12 20v2"></path>
                          <path d="m4.93 4.93 1.41 1.41"></path>
                          <path d="m17.66 17.66 1.41 1.41"></path>
                          <path d="M2 12h2"></path>
                          <path d="M20 12h2"></path>
                          <path d="m6.34 17.66-1.41 1.41"></path>
                          <path d="m19.07 4.93-1.41 1.41"></path>
                        </svg>
                        <span className="text-sm font-medium text-gray-700">{t('metrics.humidity', 'Humidity')}</span>
                      </div>
                      <p className="text-2xl font-bold text-green-600">{sensorData?.humidity}%</p>
                    </div>

                    <div className="bg-amber-50 p-4 rounded-lg">
                      <div className="flex items-center mb-2">
                        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-amber-600 mr-2">
                          <circle cx="12" cy="12" r="4"></circle>
                          <path d="M12 2v2"></path>
                          <path d="M12 20v2"></path>
                          <path d="m4.93 4.93 1.41 1.41"></path>
                          <path d="m17.66 17.66 1.41 1.41"></path>
                          <path d="M2 12h2"></path>
                          <path d="M20 12h2"></path>
                          <path d="m6.34 17.66-1.41 1.41"></path>
                          <path d="m19.07 4.93-1.41 1.41"></path>
                        </svg>
                        <span className="text-sm font-medium text-gray-700">{t('metrics.light', 'Light')}</span>
                      </div>
                      <p className="text-2xl font-bold text-amber-600">{sensorData?.light}%</p>
                    </div>
                  </div>
                </div>

                {/* Care Instructions */}
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">
                    {t('plants.careInstructions', 'Care Instructions')}
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {Object.entries(plant.care_instructions).map(([key, value]) => (
                      <div key={key} className="bg-gray-50 p-4 rounded-lg">
                        <h4 className="font-medium text-gray-900 mb-2 capitalize">
                          {t(`plants.care.${key}`, key)}
                        </h4>
                        <p className="text-sm text-gray-600">{value}</p>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Notes */}
                {plant.notes && (
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">
                      {t('plants.notes', 'Notes')}
                    </h3>
                    <div className="bg-gray-50 p-4 rounded-lg">
                      <p className="text-gray-700">{plant.notes}</p>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* AI Predictions Tab */}
            {activeTab === 'ai-predictions' && (
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">
                  {t('ai.predictions.title', 'AI Watering Predictions')}
                </h3>
                <AIWateringPrediction plantId={plant.plant_id} />
              </div>
            )}

            {/* AI Chat Tab */}
            {activeTab === 'ai-chat' && (
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">
                  {t('ai.chat.title', 'AI Plant Care Assistant')}
                </h3>
                <AIChatbot initialPlantId={plant.plant_id} />
              </div>
            )}

            {/* History Tab */}
            {activeTab === 'history' && (
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">
                  {t('plants.history', 'Plant History')}
                </h3>
                <div className="text-center py-8">
                  <div className="text-4xl mb-4">📈</div>
                  <p className="text-gray-500">
                    {t('plants.historyComingSoon', 'Plant history and analytics coming soon')}
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
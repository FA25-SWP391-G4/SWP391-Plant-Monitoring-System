'use client'

import { useState, useEffect } from 'react';
import { useAuth } from '@/providers/AuthProvider';
import { useRouter, useParams } from 'next/navigation';
import { useTranslation } from 'react-i18next';
import Link from 'next/link';
import { toast } from 'react-toastify';
import AIWateringPrediction from '@/components/AIWateringPrediction';
import AIChatbotBubble from '@/components/ai/AIChatbotBubble';
import ConnectDeviceModal from '@/components/modals/ConnectDeviceModal';
import PlantHistoryChart from '@/components/plants/PlantHistoryChart';
import plantApi from '@/api/plantApi';
import deviceApi from '@/api/deviceApi';

export default function PlantDetailPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const params = useParams();
  const { t } = useTranslation();
  const [plant, setPlant] = useState(null);
  const [sensorData, setSensorData] = useState(null);
  const [sensorHistory, setSensorHistory] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');
  const [activeChart, setActiveChart] = useState('moisture');

  const plantId = params.id;

  const handleConnectDevice = async (deviceId) => {
    try {
      await plantApi.connectDevice(plantId, deviceId);
      const updatedPlant = await plantApi.getById(plantId);
      setPlant(updatedPlant);
      toast.success(t('devices.connected', 'Device connected successfully'));
    } catch (error) {
      console.error('Error connecting device:', error);
      toast.error(t('devices.connectionError', 'Failed to connect device'));
    }
  };

  const handleWaterNow = async () => {
    try {
      await plantApi.waterPlant(plantId, 5); // Default 5 seconds duration
      toast.success(t('plants.wateringTriggered', 'Watering triggered successfully'));
    } catch (error) {
      console.error('Error triggering watering:', error);
      toast.error(t('plants.wateringError', 'Failed to trigger watering'));
    }
  };

  const loadSensorHistory = async () => {
    try {
      let response;
      
      // Use deviceApi if plant has a device_id, otherwise use plantApi
      if (plant?.device_id) {
        response = await deviceApi.getSensorHistory(plant.device_id, { timeRange: '24h' });
      } else {
        response = await plantApi.getSensorHistory(plantId);
      }
      
      if (response?.data && Array.isArray(response.data)) {
        const transformedData = {
          moisture: response.data.map(item => ({
            timestamp: item.timestamp,
            value: item.soil_moisture || item.moisture
          })).filter(item => item.value !== null),
          
          temperature: response.data.map(item => ({
            timestamp: item.timestamp,
            value: item.temperature
          })).filter(item => item.value !== null),
          
          humidity: response.data.map(item => ({
            timestamp: item.timestamp,
            value: item.air_humidity || item.humidity
          })).filter(item => item.value !== null),
          
          light: response.data.map(item => ({
            timestamp: item.timestamp,
            value: item.light_intensity || item.light
          })).filter(item => item.value !== null)
        };
        
        setSensorHistory(transformedData);
      } else {
        setSensorHistory({
          moisture: [],
          temperature: [],
          humidity: [],
          light: []
        });
      }
    } catch (error) {
      console.error('Error loading sensor history:', error);
      setSensorHistory({
        moisture: [],
        temperature: [],
        humidity: [],
        light: []
      });
    }
  };

  // Redirect if not logged in
  useEffect(() => {
    if (!loading && !user) {
      router.push('/login');
    }
  }, [user, loading, router]);

  const [showConnectModal, setShowConnectModal] = useState(false);

  // Fetch plant and sensor data
  useEffect(() => {
    const fetchPlantData = async () => {
      try {
        setIsLoading(true);
        console.log('Fetching data for plant ID:', plantId);
        
        // [2025-11-06] Fixed JWT malformed error by using plantApi service
        // Instead of direct fetch to ensure consistent token handling
        const rawData = await plantApi.getById(plantId);
        console.log('Plant API response:', rawData);
        console.log('Parsed plant data:', rawData);

        // Map the plant data structure
        const plantData = {
          plant_id: rawData.plant_id,
          name: rawData.name,
          species: rawData.species,
          location: rawData.location || 'Not specified',
          status: rawData.status,
          image: rawData.image,
          device_id: rawData.device_key?.trim(), // Trim any padding from device key
          device_name: rawData.device_name
        };

        // Map sensor data directly from the response
        let sensorData = null;
        if (rawData.data) {
          sensorData = {
            timestamp: rawData.data.timestamp,
            moisture: rawData.data.moisture,
            temperature: rawData.data.temperature,
            humidity: rawData.data.humidity,
            light: rawData.data.light
          };
        }

        // Log the state updates
        console.log('Setting plant state to:', plantData);
        console.log('Setting sensor state to:', sensorData);

        setPlant(plantData);
        setSensorData(sensorData);
      } catch (error) {
        console.error('Full error details:', {
          message: error.message,
          stack: error.stack,
          response: error.response
        });
        toast.error(t('plants.errorFetching', 'Failed to fetch plant data'));
      } finally {
        setIsLoading(false);
      }
    };

    if (user && plantId) {
      console.log('Starting data fetch with:', {
        userId: user?.id,
        plantId: plantId,
        token: user?.token ? 'present' : 'missing'
      });
      fetchPlantData();
    }
  }, [user, plantId, t]);

  // Load sensor history when history tab is active
  useEffect(() => {
    if (user && plantId && activeTab === 'history' && !sensorHistory) {
      loadSensorHistory();
    }
  }, [user, plantId, activeTab]);

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
      <div className="flex flex-col items-center justify-center min-h-screen p-4">
        <div className="text-red-500 mb-4">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
        <h2 className="text-xl font-semibold mb-2">{t('plants.notFound', 'Plant Not Found')}</h2>
        <p className="text-gray-600 mb-4">{t('plants.notFoundDesc', 'The plant you\'re looking for doesn\'t exist or you don\'t have access to it.')}</p>
        
        {/* Debug Information */}
        {process.env.NODE_ENV !== 'production' && (
          <div className="mt-4 p-4 bg-gray-100 rounded-lg text-left w-full max-w-2xl">
            <h3 className="font-mono text-sm mb-2">Debug Info:</h3>
            <pre className="text-xs overflow-auto">
              {JSON.stringify({
                plantId,
                user: user ? { 
                  id: user.id,
                  hasToken: !!user.token
                } : null,
                plant,
                sensorData,
                isLoading,
                currentState: {
                  hasUser: !!user,
                  hasPlant: !!plant,
                  hasSensorData: !!sensorData
                }
              }, null, 2)}
            </pre>
          </div>
        )}

        <Link href="/dashboard" className="mt-4 px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors">
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
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 p-6 mb-6">
          <div className="flex flex-col md:flex-row md:items-start md:space-x-6">
            {/* Plant Image */}
            <div className="w-full md:w-48 h-48 rounded-lg bg-gray-100 dark:bg-gray-700 flex items-center justify-center overflow-hidden mb-4 md:mb-0">
              {plant.image ? (
                <img src={plant.image} alt={plant.name} className="w-full h-full object-cover" />
              ) : (
                <svg xmlns="http://www.w3.org/2000/svg" width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round" className="text-gray-300 dark:text-gray-600">
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
                  <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-2">{plant.name}</h1>
                  <p className="text-lg text-gray-600 dark:text-gray-400 mb-2">{plant.species}</p>
                  <div className="flex items-center text-gray-500 dark:text-gray-400 mb-2">
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
                {plant.device_id ? (
                  <button 
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center"
                    onClick={handleWaterNow}
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M12 22a7 7 0 0 0 7-7c0-2-1-3.9-3-5.5s-3.5-4-4-6.5c-.5 2.5-2 4.9-4 6.5C6 11.1 5 13 5 15a7 7 0 0 0 7 7z"/>
                    </svg>
                    {t('plants.waterNow', 'Water Now')}
                  </button>
                ) : (
                  <button 
                    className="px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors flex items-center"
                    onClick={() => setShowConnectModal(true)}
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M5 12h14"/>
                      <path d="M12 5v14"/>
                    </svg>
                    {t('devices.connectDevice', 'Connect Device')}
                  </button>
                )}
                <Link 
                  href={`/ai/chat?plant=${plant.plant_id}`} 
                  className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors flex items-center"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
                  </svg>
                  {t('ai.askAI', 'Ask AI')}
                </Link>
                <Link 
                  href={`/ai/image-analysis?plant=${plant.plant_id}`} 
                  className="px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors flex items-center"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/>
                    <circle cx="8.5" cy="8.5" r="1.5"/>
                    <polyline points="21 15 16 10 5 21"/>
                  </svg>
                  {t('ai.analyzeImage', 'Analyze Image')}
                </Link>
                <Link 
                  href={`/plants/${plant.plant_id}/edit`}
                  className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors flex items-center"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M17 3a2.828 2.828 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z"/>
                  </svg>
                  {t('plants.editPlant', 'Edit Plant')}
                </Link>
              </div>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 mb-6">
          <div className="border-b border-gray-200 dark:border-gray-600">
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
                      ? 'border-emerald-500 text-emerald-600 dark:text-emerald-400'
                      : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 hover:border-gray-300 dark:hover:border-gray-500'
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
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
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
                      <p className="text-2xl font-bold text-amber-600">{sensorData?.light} lux</p>
                    </div>
                  </div>
                </div>

                {/* Care Instructions */}
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">
                    {t('plants.careInstructions', 'Care Instructions')}
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {plant.care_instructions && typeof plant.care_instructions === 'object' ? (
                      Object.entries(plant.care_instructions).map(([key, value]) => (
                        <div key={key} className="bg-gray-50 p-4 rounded-lg">
                          <h4 className="font-medium text-gray-900 mb-2 capitalize">
                            {t(`plants.care.${key}`, key)}
                          </h4>
                          <p className="text-sm text-gray-600">{value}</p>
                        </div>
                      ))
                    ) : (
                      <div className="bg-gray-50 p-4 rounded-lg col-span-2">
                        <p className="text-gray-500 text-center">
                          {t('plants.noCareInstructions', 'No care instructions available')}
                        </p>
                      </div>
                    )}
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
                <AIChatbotBubble initialPlantId={plant.plant_id} />
              </div>
            )}

            {/* History Tab */}
            {activeTab === 'history' && (
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">
                  {t('plants.history', 'Plant History')}
                </h3>
                
                {/* Chart Selection */}
                <div className="flex flex-wrap gap-2 mb-6">
                  {[
                    { key: 'moisture', label: t('metrics.moisture', 'Moisture'), color: 'bg-blue-100 text-blue-700', icon: '💧' },
                    { key: 'temperature', label: t('metrics.temperature', 'Temperature'), color: 'bg-red-100 text-red-700', icon: '🌡️' },
                    { key: 'humidity', label: t('metrics.humidity', 'Humidity'), color: 'bg-green-100 text-green-700', icon: '💨' },
                    { key: 'light', label: t('metrics.light', 'Light'), color: 'bg-amber-100 text-amber-700', icon: '☀️' }
                  ].map(chart => (
                    <button
                      key={chart.key}
                      onClick={() => setActiveChart(chart.key)}
                      className={`px-4 py-2 rounded-lg font-medium transition-colors flex items-center space-x-2 ${
                        activeChart === chart.key
                          ? chart.color + ' ring-2 ring-offset-1 ring-gray-300'
                          : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                      }`}
                    >
                      <span>{chart.icon}</span>
                      <span>{chart.label}</span>
                    </button>
                  ))}
                </div>

                {/* Chart Display */}
                {sensorHistory ? (
                  <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-6">
                    <div className="flex justify-between items-center mb-4">
                      <h4 className="text-lg font-medium text-gray-900 dark:text-gray-100">
                        {t(`metrics.${activeChart}`, activeChart)} {t('charts.over24Hours', 'Over Last 24 Hours')}
                      </h4>
                      <button 
                        onClick={loadSensorHistory}
                        className="text-sm text-emerald-600 dark:text-emerald-400 hover:text-emerald-700 dark:hover:text-emerald-300 flex items-center space-x-1"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M23 4v6h-6"/>
                          <path d="M1 20v-6h6"/>
                          <path d="m3.51 9a9 9 0 0 1 14.85-3.36L23 10"/>
                          <path d="M20.49 15a9 9 0 0 1-14.85 3.36L1 14"/>
                        </svg>
                        <span>{t('common.refresh', 'Refresh')}</span>
                      </button>
                    </div>
                    
                    <div className="h-80">
                      <PlantHistoryChart 
                        data={sensorHistory[activeChart] || []}
                        dataType={activeChart === 'moisture' ? 'soil_moisture' : activeChart === 'light' ? 'light_intensity' : activeChart === 'humidity' ? 'air_humidity' : activeChart}
                        timeRange="day"
                      />
                    </div>
                    
                    {/* Chart Statistics */}
                    {sensorHistory[activeChart] && sensorHistory[activeChart].length > 0 && (
                      <div className="mt-4 grid grid-cols-3 gap-4 pt-4 border-t border-gray-100">
                        <div className="text-center">
                          <p className="text-sm text-gray-500">{t('stats.average', 'Average')}</p>
                          <p className="text-lg font-semibold text-gray-900">
                            {(sensorHistory[activeChart].reduce((sum, item) => sum + item.value, 0) / sensorHistory[activeChart].length).toFixed(1)}
                            {activeChart === 'temperature' ? '°C' : activeChart === 'light' ? ' lux' : '%'}
                          </p>
                        </div>
                        <div className="text-center">
                          <p className="text-sm text-gray-500">{t('stats.minimum', 'Minimum')}</p>
                          <p className="text-lg font-semibold text-gray-900">
                            {Math.min(...sensorHistory[activeChart].map(item => item.value))}
                            {activeChart === 'temperature' ? '°C' : activeChart === 'light' ? ' lux' : '%'}
                          </p>
                        </div>
                        <div className="text-center">
                          <p className="text-sm text-gray-500">{t('stats.maximum', 'Maximum')}</p>
                          <p className="text-lg font-semibold text-gray-900">
                            {Math.max(...sensorHistory[activeChart].map(item => item.value))}
                            {activeChart === 'temperature' ? '°C' : activeChart === 'light' ? ' lux' : '%'}
                          </p>
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center h-64 bg-gray-50 rounded-lg border border-gray-200">
                    <div className="animate-pulse flex flex-col items-center">
                      <div className="w-12 h-12 rounded-full bg-gray-200 mb-4"></div>
                      <div className="h-4 w-32 bg-gray-200 rounded"></div>
                    </div>
                    <p className="text-gray-500 mt-2">{t('charts.loading', 'Loading chart data...')}</p>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Connect Device Modal */}
      <ConnectDeviceModal
        isOpen={showConnectModal}
        onClose={() => setShowConnectModal(false)}
        onConnect={handleConnectDevice}
        plantId={plantId}
      />
    </div>
  );
}
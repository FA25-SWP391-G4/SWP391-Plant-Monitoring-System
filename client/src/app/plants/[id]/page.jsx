'use client'

import { useState, useEffect } from 'react';
import { useAuth } from '@/providers/AuthProvider';
import { useRouter } from 'next/navigation';
import { useTranslation } from 'react-i18next';
// import DashboardHeader from '@/components/dashboard/DashboardHeader';
// import PlantHeader from '@/components/plants/PlantHeader';
// import PlantStats from '@/components/plants/PlantStats';
// import WateringHistory from '@/components/plants/WateringHistory';
// import SensorChart from '@/components/plants/SensorChart';
// import PlantActions from '@/components/plants/PlantActions';
// import WateringSchedule from '@/components/plants/WateringSchedule';
// import NotesList from '@/components/plants/NotesList';

// Mock data for development - would come from API in real app
const MOCK_PLANT = {
  plant_id: 1,
  name: 'Snake Plant',
  species: 'Sansevieria trifasciata',
  image: '/images/plants/snake-plant.jpg',
  location: 'Living Room',
  status: 'healthy',
  lastWatered: '2023-11-15T10:30:00Z',
  zone: 'Indoor',
  notes: 'Low maintenance plant, perfect for beginners.',
  dateAdded: '2023-09-10T08:00:00Z',
  thresholds: {
    moisture: { min: 20, max: 65 },
    temperature: { min: 18, max: 27 },
    light: { min: 30, max: 80 }
  }
};

const MOCK_SENSOR_DATA = {
  moisture: [
    { timestamp: '2023-11-01T00:00:00Z', value: 55 },
    { timestamp: '2023-11-02T00:00:00Z', value: 52 },
    { timestamp: '2023-11-03T00:00:00Z', value: 48 },
    { timestamp: '2023-11-04T00:00:00Z', value: 45 },
    { timestamp: '2023-11-05T00:00:00Z', value: 40 },
    { timestamp: '2023-11-06T00:00:00Z', value: 38 },
    { timestamp: '2023-11-07T00:00:00Z', value: 35 },
    { timestamp: '2023-11-08T00:00:00Z', value: 32 },
    { timestamp: '2023-11-09T00:00:00Z', value: 30 },
    { timestamp: '2023-11-10T00:00:00Z', value: 60 }, // after watering
    { timestamp: '2023-11-11T00:00:00Z', value: 58 },
    { timestamp: '2023-11-12T00:00:00Z', value: 55 },
    { timestamp: '2023-11-13T00:00:00Z', value: 50 },
    { timestamp: '2023-11-14T00:00:00Z', value: 48 },
    { timestamp: '2023-11-15T00:00:00Z', value: 72 } // after watering
  ],
  temperature: [
    { timestamp: '2023-11-01T00:00:00Z', value: 22.1 },
    { timestamp: '2023-11-02T00:00:00Z', value: 22.3 },
    { timestamp: '2023-11-03T00:00:00Z', value: 22.0 },
    { timestamp: '2023-11-04T00:00:00Z', value: 21.8 },
    { timestamp: '2023-11-05T00:00:00Z', value: 21.5 },
    { timestamp: '2023-11-06T00:00:00Z', value: 22.2 },
    { timestamp: '2023-11-07T00:00:00Z', value: 22.4 },
    { timestamp: '2023-11-08T00:00:00Z', value: 22.6 },
    { timestamp: '2023-11-09T00:00:00Z', value: 22.5 },
    { timestamp: '2023-11-10T00:00:00Z', value: 22.8 },
    { timestamp: '2023-11-11T00:00:00Z', value: 23.0 },
    { timestamp: '2023-11-12T00:00:00Z', value: 22.7 },
    { timestamp: '2023-11-13T00:00:00Z', value: 22.5 },
    { timestamp: '2023-11-14T00:00:00Z', value: 22.3 },
    { timestamp: '2023-11-15T00:00:00Z', value: 22.5 }
  ],
  light: [
    { timestamp: '2023-11-01T00:00:00Z', value: 65 },
    { timestamp: '2023-11-02T00:00:00Z', value: 68 },
    { timestamp: '2023-11-03T00:00:00Z', value: 70 },
    { timestamp: '2023-11-04T00:00:00Z', value: 72 },
    { timestamp: '2023-11-05T00:00:00Z', value: 67 },
    { timestamp: '2023-11-06T00:00:00Z', value: 65 },
    { timestamp: '2023-11-07T00:00:00Z', value: 60 },
    { timestamp: '2023-11-08T00:00:00Z', value: 62 },
    { timestamp: '2023-11-09T00:00:00Z', value: 66 },
    { timestamp: '2023-11-10T00:00:00Z', value: 70 },
    { timestamp: '2023-11-11T00:00:00Z', value: 73 },
    { timestamp: '2023-11-12T00:00:00Z', value: 75 },
    { timestamp: '2023-11-13T00:00:00Z', value: 72 },
    { timestamp: '2023-11-14T00:00:00Z', value: 70 },
    { timestamp: '2023-11-15T00:00:00Z', value: 85 }
  ]
};

const MOCK_WATERING_HISTORY = [
  { id: 1, timestamp: '2023-11-15T10:30:00Z', duration: 15, amount: 1500, method: 'manual' },
  { id: 2, timestamp: '2023-11-10T08:15:00Z', duration: 12, amount: 1200, method: 'manual' },
  { id: 3, timestamp: '2023-11-05T14:45:00Z', duration: 10, amount: 1000, method: 'automatic' },
  { id: 4, timestamp: '2023-10-30T09:20:00Z', duration: 15, amount: 1500, method: 'manual' }
];

const MOCK_NOTES = [
  { id: 1, text: 'Repotted into larger container', timestamp: '2023-10-15T11:30:00Z' },
  { id: 2, text: 'Added some fertilizer', timestamp: '2023-10-30T14:20:00Z' },
  { id: 3, text: 'Noticed new growth on top', timestamp: '2023-11-10T09:15:00Z' }
];

export default function PlantDetailsPage({ params }) {
  const { user, loading, isPremium } = useAuth();
  const router = useRouter();
  const { t } = useTranslation();
  
  const [plant, setPlant] = useState(null);
  const [sensorData, setSensorData] = useState({});
  const [wateringHistory, setWateringHistory] = useState([]);
  const [notes, setNotes] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('overview');

  // Redirect if not logged in
  useEffect(() => {
    if (!loading && !user) {
      router.push('/login');
    }
  }, [user, loading, router]);

  // Fetch plant data
  useEffect(() => {
    if (user && params.id) {
      // In a real app, we would fetch from the API here
      // For now, using mock data with a timeout to simulate API call
      const fetchData = async () => {
        setIsLoading(true);
        try {
          // Simulate API call
          await new Promise(resolve => setTimeout(resolve, 800));
          
          // Set mock data
          setPlant(MOCK_PLANT);
          setSensorData(MOCK_SENSOR_DATA);
          setWateringHistory(MOCK_WATERING_HISTORY);
          setNotes(MOCK_NOTES);
        } catch (err) {
          console.error('Error fetching plant data:', err);
          setError('Failed to load plant data. Please try again later.');
        } finally {
          setIsLoading(false);
        }
      };

      fetchData();
    }
  }, [user, params.id]);

  const handleWaterNow = async () => {
    // This would call the API endpoint to water the plant
    console.log('Watering plant', params.id);
    alert('Watering initiated! This would trigger the water pump in a real system.');
  };

  const handleAddNote = (noteText) => {
    const newNote = {
      id: notes.length + 1,
      text: noteText,
      timestamp: new Date().toISOString()
    };
    setNotes([newNote, ...notes]);
  };

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
        <h2 className="text-xl font-semibold mb-2">Error Loading Plant Details</h2>
        <p className="text-gray-600">{error}</p>
        <button 
          onClick={() => window.location.reload()} 
          className="mt-4 px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors"
        >
          Retry
        </button>
      </div>
    );
  }

  if (!plant) {
    return (
      <div className="flex flex-col items-center justify-center h-screen">
        <div className="text-amber-500 mb-4">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
        </div>
        <h2 className="text-xl font-semibold mb-2">Plant Not Found</h2>
        <p className="text-gray-600">The plant you're looking for doesn't exist or has been removed.</p>
        <button 
          onClick={() => router.push('/plants')} 
          className="mt-4 px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors"
        >
          Go Back to Plants
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <DashboardHeader user={user} />
      
      <main className="container mx-auto px-4 py-8">
        {/* Plant Header */}
        <PlantHeader plant={plant} />
        
        {/* Navigation Tabs */}
        <div className="border-b border-gray-200 mb-6">
          <nav className="-mb-px flex space-x-8">
            <button 
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'overview' 
                  ? 'border-emerald-500 text-emerald-600' 
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
              onClick={() => setActiveTab('overview')}
            >
              {t('plants.overview', 'Overview')}
            </button>
            <button 
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'data' 
                  ? 'border-emerald-500 text-emerald-600' 
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
              onClick={() => setActiveTab('data')}
            >
              {t('plants.sensorData', 'Sensor Data')}
            </button>
            <button 
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'watering' 
                  ? 'border-emerald-500 text-emerald-600' 
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
              onClick={() => setActiveTab('watering')}
            >
              {t('plants.watering', 'Watering')}
            </button>
            <button 
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'notes' 
                  ? 'border-emerald-500 text-emerald-600' 
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
              onClick={() => setActiveTab('notes')}
            >
              {t('plants.notes', 'Notes')}
            </button>
            {isPremium && (
              <button 
                className={`py-4 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'settings' 
                    ? 'border-emerald-500 text-emerald-600' 
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
                onClick={() => setActiveTab('settings')}
              >
                {t('plants.settings', 'Settings')}
              </button>
            )}
          </nav>
        </div>
        
        {/* Content based on active tab */}
        <div className="mt-6">
          {activeTab === 'overview' && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2 space-y-6">
                <PlantStats plant={plant} sensorData={sensorData} />
                <SensorChart 
                  data={sensorData} 
                  thresholds={plant.thresholds} 
                  type="moisture"
                  title={t('plants.moistureOverTime', 'Soil Moisture Over Time')}
                />
              </div>
              <div className="space-y-6">
                <PlantActions 
                  plant={plant}
                  onWaterNow={handleWaterNow}
                  isPremium={isPremium}
                />
                <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
                  <h3 className="font-medium text-gray-900 mb-4">{t('plants.latestNotes', 'Latest Notes')}</h3>
                  <NotesList notes={notes.slice(0, 2)} compact />
                  <button 
                    className="mt-3 text-sm text-emerald-600 hover:text-emerald-700"
                    onClick={() => setActiveTab('notes')}
                  >
                    {t('common.viewAll', 'View All')} →
                  </button>
                </div>
              </div>
            </div>
          )}
          
          {activeTab === 'data' && (
            <div className="space-y-6">
              <SensorChart 
                data={sensorData} 
                thresholds={plant.thresholds} 
                type="moisture"
                title={t('plants.moistureOverTime', 'Soil Moisture Over Time')}
              />
              <SensorChart 
                data={sensorData} 
                thresholds={plant.thresholds} 
                type="temperature"
                title={t('plants.temperatureOverTime', 'Temperature Over Time')}
              />
              <SensorChart 
                data={sensorData} 
                thresholds={plant.thresholds} 
                type="light"
                title={t('plants.lightOverTime', 'Light Levels Over Time')}
              />
            </div>
          )}
          
          {activeTab === 'watering' && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2">
                <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                  <h3 className="font-medium text-gray-900 mb-4">{t('plants.wateringHistory', 'Watering History')}</h3>
                  <WateringHistory history={wateringHistory} />
                </div>
              </div>
              <div>
                <WateringSchedule plant={plant} isPremium={isPremium} />
              </div>
            </div>
          )}
          
          {activeTab === 'notes' && (
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
              <h3 className="font-medium text-gray-900 mb-4">{t('plants.notes', 'Plant Notes')}</h3>
              <NotesList notes={notes} onAddNote={handleAddNote} />
            </div>
          )}
          
          {activeTab === 'settings' && isPremium && (
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
              <h3 className="font-medium text-gray-900 mb-4">{t('plants.plantSettings', 'Plant Settings')}</h3>
              <p className="text-gray-500">Advanced settings for premium users</p>
              
              {/* Thresholds settings would go here */}
              <div className="mt-4">
                <h4 className="font-medium text-gray-700 mb-3">{t('plants.sensorThresholds', 'Sensor Thresholds')}</h4>
                {/* Threshold settings form would go here */}
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
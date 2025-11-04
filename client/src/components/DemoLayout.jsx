/**
 * DemoLayout Component
 * Demo layout that showcases the dashboard design without authentication
 */
'use client'

import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import DashboardSidebar from './DashboardSidebar';
import DashboardTopBar from './DashboardTopBar';

// Mock user data for demo
const mockUser = {
  given_name: 'Demo',
  family_name: 'User',
  email: 'demo@plantsmart.com',
  role: 'Premium'
};

// Mock data generator
const generateMockData = () => {
  const plantNames = [
    'Snake Plant', 'Monstera Deliciosa', 'Peace Lily', 'Rubber Plant', 'Fiddle Leaf Fig',
    'Pothos', 'Spider Plant', 'ZZ Plant', 'Aloe Vera', 'Philodendron',
    'Boston Fern', 'Cactus', 'Succulent Mix', 'Bamboo Palm', 'English Ivy'
  ];

  const conditions = ['Excellent', 'Good', 'Needs Attention', 'Critical'];
  const locations = ['Living Room', 'Bedroom', 'Kitchen', 'Office', 'Balcony', 'Bathroom', 'Garden'];
  const wateringStatus = ['Well Watered', 'Needs Water', 'Overwatered', 'Dry Soil'];

  // Generate 8-12 random plants
  const plantCount = Math.floor(Math.random() * 5) + 8;
  const plants = Array.from({ length: plantCount }, (_, i) => ({
    id: i + 1,
    name: plantNames[Math.floor(Math.random() * plantNames.length)],
    condition: conditions[Math.floor(Math.random() * conditions.length)],
    location: locations[Math.floor(Math.random() * locations.length)],
    moisture: Math.floor(Math.random() * 100),
    temperature: Math.floor(Math.random() * 15) + 18, // 18-32°C
    lastWatered: Math.floor(Math.random() * 7) + 1, // 1-7 days ago
    wateringStatus: wateringStatus[Math.floor(Math.random() * wateringStatus.length)],
    healthScore: Math.floor(Math.random() * 40) + 60 // 60-100%
  }));

  // Generate devices
  const deviceTypes = ['Soil Sensor', 'Water Pump', 'Light Sensor', 'Temperature Sensor'];
  const deviceStatuses = ['Online', 'Offline', 'Maintenance'];
  
  const deviceCount = Math.floor(Math.random() * 6) + 4;
  const devices = Array.from({ length: deviceCount }, (_, i) => ({
    id: i + 1,
    name: `${deviceTypes[Math.floor(Math.random() * deviceTypes.length)]} #${i + 1}`,
    type: deviceTypes[Math.floor(Math.random() * deviceTypes.length)],
    status: deviceStatuses[Math.floor(Math.random() * deviceStatuses.length)],
    battery: Math.floor(Math.random() * 100),
    lastUpdate: Math.floor(Math.random() * 30) + 1 // 1-30 minutes ago
  }));

  // Generate alerts
  const alertTypes = ['Water needed', 'Low battery', 'Temperature alert', 'Device offline', 'Maintenance due'];
  const alertCount = Math.floor(Math.random() * 4) + 2;
  const alerts = Array.from({ length: alertCount }, (_, i) => ({
    id: i + 1,
    type: alertTypes[Math.floor(Math.random() * alertTypes.length)],
    plant: plants[Math.floor(Math.random() * plants.length)].name,
    severity: ['Low', 'Medium', 'High'][Math.floor(Math.random() * 3)],
    time: Math.floor(Math.random() * 60) + 1 // 1-60 minutes ago
  }));

  return { plants, devices, alerts };
};

const DemoLayout = ({ children }) => {
  const { t } = useTranslation();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [mockData, setMockData] = useState(null);

  // Generate mock data on mount and refresh every 30 seconds
  useEffect(() => {
    const refreshData = () => {
      setMockData(generateMockData());
    };

    refreshData(); // Initial load
    const interval = setInterval(refreshData, 30000); // Refresh every 30 seconds

    return () => clearInterval(interval);
  }, []);

  const handleSidebarToggle = () => {
    setSidebarOpen(!sidebarOpen);
  };

  const getPageTitle = () => {
    return 'Dashboard Demo - PlantSmart';
  };

  if (!mockData) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600"></div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-app-gradient">
      {/* Demo Sidebar - using mock user data */}
      <div className={`${sidebarOpen ? 'w-72' : 'w-16'} transition-all duration-300`}>
        <DashboardSidebar 
          isOpen={sidebarOpen} 
          onToggle={handleSidebarToggle}
          // Override user prop for demo
          demoUser={mockUser}
        />
      </div>
      
      {/* Main content area */}
      <div className="flex-1 flex flex-col">
        {/* Demo Top Bar */}
        <DashboardTopBar 
          title={getPageTitle()}
          onMenuToggle={handleSidebarToggle}
          sidebarOpen={sidebarOpen}
          showSearch={true}
          isDemo={true}
        />

        {/* Demo Content */}
        <main className="flex-1 overflow-y-auto p-6">
          {/* Demo Banner */}
          <div className="mb-6 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-semibold">🌱 Interactive Demo</h2>
                <p className="text-blue-100 text-sm">
                  This is a live preview of PlantSmart. Data refreshes automatically every 30 seconds.
                </p>
              </div>
              <div className="text-right">
                <button className="bg-white/20 hover:bg-white/30 px-4 py-2 rounded-lg text-sm font-medium transition">
                  Get Started
                </button>
              </div>
            </div>
          </div>

          {/* Dashboard Stats */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm">
              <div className="flex items-center">
                <div className="p-2 bg-green-100 dark:bg-green-900 rounded-lg">
                  <svg className="w-6 h-6 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7,17.2C5.4,16.5,4,14.9,4,12c0-3.9,3.1-7,7-7c3.9,0,7,3.1,7,7c0,2.9-2.1,5.3-4.8,6.4" />
                  </svg>
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Total Plants</p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">{mockData.plants.length}</p>
                </div>
              </div>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm">
              <div className="flex items-center">
                <div className="p-2 bg-blue-100 dark:bg-blue-900 rounded-lg">
                  <svg className="w-6 h-6 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 3v2m6-2v2M9 19v2m6-2v2M5 9H3m2 6H3m18-6h-2m2 6h-2M7 19h10a2 2 0 002-2V7a2 2 0 00-2-2H7a2 2 0 00-2 2v10a2 2 0 002 2zM9 9h6v6H9V9z" />
                  </svg>
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Active Devices</p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">
                    {mockData.devices.filter(d => d.status === 'Online').length}
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm">
              <div className="flex items-center">
                <div className="p-2 bg-amber-100 dark:bg-amber-900 rounded-lg">
                  <svg className="w-6 h-6 text-amber-600 dark:text-amber-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.502 0L4.268 16.5c-.77.833.192 2.5 1.732 2.5z" />
                  </svg>
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Active Alerts</p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">{mockData.alerts.length}</p>
                </div>
              </div>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm">
              <div className="flex items-center">
                <div className="p-2 bg-green-100 dark:bg-green-900 rounded-lg">
                  <svg className="w-6 h-6 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Healthy Plants</p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">
                    {mockData.plants.filter(p => p.condition === 'Excellent' || p.condition === 'Good').length}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Main content area for additional demo components */}
          <div className="space-y-6">
            {children}
          </div>

          {/* Recent Plants Grid */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm">
            <div className="p-6 border-b border-gray-200 dark:border-gray-700">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Your Plants</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">Monitor your plant collection</p>
            </div>
            <div className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {mockData.plants.slice(0, 6).map((plant) => (
                  <div key={plant.id} className="border border-gray-200 dark:border-gray-700 rounded-lg p-4 hover:shadow-md transition-shadow">
                    <div className="flex items-center justify-between mb-3">
                      <h4 className="font-medium text-gray-900 dark:text-white">{plant.name}</h4>
                      <span className={`px-2 py-1 text-xs rounded-full ${
                        plant.condition === 'Excellent' ? 'bg-green-100 text-green-800' :
                        plant.condition === 'Good' ? 'bg-blue-100 text-blue-800' :
                        plant.condition === 'Needs Attention' ? 'bg-yellow-100 text-yellow-800' :
                        'bg-red-100 text-red-800'
                      }`}>
                        {plant.condition}
                      </span>
                    </div>
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600 dark:text-gray-400">Moisture</span>
                        <span className="font-medium">{plant.moisture}%</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600 dark:text-gray-400">Location</span>
                        <span className="font-medium">{plant.location}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600 dark:text-gray-400">Last Watered</span>
                        <span className="font-medium">{plant.lastWatered}d ago</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};

export default DemoLayout;
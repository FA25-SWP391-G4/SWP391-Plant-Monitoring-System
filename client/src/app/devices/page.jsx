'use client'

import { useState, useEffect } from 'react';
import { useAuth } from '@/providers/AuthProvider';
import { useRouter } from 'next/navigation';
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import AppLayout from '@/components/layout/AppLayout';

import deviceApi from '@/api/deviceApi';
import { useSettings } from '@/providers/SettingsProvider';
import { toast } from 'react-toastify';
import DeviceListItem from '@/components/devices/DeviceListItem';

export default function DevicesPage() {
  const { t } = useTranslation();
  const { user, isLoading: authLoading } = useAuth();
  const router = useRouter();
  const { settings } = useSettings();

  const animationsEnabled = settings?.widgets?.animationsEnabled ?? true;
  const compactMode = settings?.widgets?.compactMode ?? false;
  
  const [devices, setDevices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Handle device update
  const handleDeviceUpdate = (updatedDevice) => {
    setDevices(prevDevices => 
      prevDevices.map(device => 
        device.device_key === updatedDevice.device_key ? updatedDevice : device
      )
    );
  };

  // Handle device deletion
  const handleDeviceDelete = (deviceKey) => {
    setDevices(prevDevices => 
      prevDevices.filter(device => device.device_key !== deviceKey)
    );
  };

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login');
      return;
    }

    const fetchDevices = async () => {
      try {
        setLoading(true);
        const response = await deviceApi.getAll();
        // Ensure we're getting an array of devices
        const devicesData = Array.isArray(response) ? response : 
                          response.data ? (Array.isArray(response.data) ? response.data : []) : 
                          [];
        console.log('Devices data:', devicesData); // For debugging
        setDevices(devicesData);
        setError(null);
      } catch (err) {
        console.error('Error fetching devices:', err);
        setError(t('devices.errorFetching', 'Failed to fetch devices. Please try again later.'));
        toast.error(t('devices.errorFetching', 'Failed to fetch devices. Please try again later.'));
      } finally {
        setLoading(false);
      }
    };

    if (user) {
      fetchDevices();
    }
  }, [user, authLoading, router, t]);

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, ease: "easeOut" }}
      className="min-h-screen bg-gray-50 dark:bg-gray-900 page-transition"
    >
      <main className={`container mx-auto px-4 py-8 ${animationsEnabled ? 'transition-all duration-200' : ''}`}>
        {/* Welcome Banner */}
        <div className="bg-gradient-to-r from-emerald-500 to-emerald-700 dark:from-emerald-600 dark:to-emerald-800 rounded-xl shadow-lg mb-8 p-6 text-white flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="bg-white/20 backdrop-blur-sm p-3 rounded-lg">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 3v2m6-2v2M9 19v2m6-2v2M5 9H3m2 6H3m18-6h-2m2 6h-2M7 19h10a2 2 0 002-2V7a2 2 0 00-2-2H7a2 2 0 00-2 2v10a2 2 0 002 2zM9 9h6v6H9V9z" />
              </svg>
            </div>
            
            <div>
              <h1 className="text-2xl font-bold mb-2">
                {t('devices.myDevices', 'My Devices')}
              </h1>
              <p className="opacity-90">
                {t('devices.manage', 'Monitor and manage your connected devices')}
              </p>
            </div>
          </div>

          <div className="hidden md:block">
            <button 
              onClick={() => router.push('/devices/add')}
              className="bg-white/20 backdrop-blur-sm hover:bg-white/30 text-white px-4 py-2 rounded-lg font-medium transition-colors flex items-center space-x-2 btn-transition"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
              <span>{t('devices.addDevice', 'Add Device')}</span>
            </button>
          </div>
        </div>

        {/* Mobile Add Device Button */}
        <div className="mb-6 md:hidden">
          <button 
            onClick={() => router.push('/devices/add')}
            className="w-full bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-lg font-medium transition-colors flex items-center justify-center space-x-2 btn-transition"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
            </svg>
            <span>{t('devices.addDevice', 'Add Device')}</span>
          </button>
        </div>

        {/* Devices Content */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
          {loading ? (
            <div className="p-8 flex justify-center">
              <div className="flex flex-col items-center space-y-4">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600"></div>
                <p className="text-gray-600 dark:text-gray-400">
                  {t('devices.loading', 'Loading devices...')}
                </p>
              </div>
            </div>
          ) : error ? (
            <div className="p-8 text-center">
              <div className="flex justify-center mb-4">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 18.5c-.77.833.192 2.5 1.732 2.5z" />
                </svg>
              </div>
              <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">
                {t('devices.error', 'Error Loading Devices')}
              </h3>
              <p className="text-red-500 dark:text-red-400 mb-4">
                {error}
              </p>
              <button 
                onClick={() => window.location.reload()} 
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg transition-colors"
              >
                {t('common.retry', 'Retry')}
              </button>
            </div>
          ) : !Array.isArray(devices) ? (
            <div className="p-8 text-center">
              <div className="flex justify-center mb-4">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 18.5c-.77.833.192 2.5 1.732 2.5z" />
                </svg>
              </div>
              <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">
                {t('devices.dataError', 'Invalid Data')}
              </h3>
              <p className="text-red-500 dark:text-red-400 mb-4">
                {t('devices.invalidData', 'Invalid data received from server')}
              </p>
              <button 
                onClick={() => window.location.reload()} 
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg transition-colors"
              >
                {t('common.retry', 'Retry')}
              </button>
            </div>
          ) : devices.length === 0 ? (
            <div className="p-8 text-center">
              <div className="flex justify-center mb-4">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 text-gray-300 dark:text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 3v2m6-2v2M9 19v2m6-2v2M5 9H3m2 6H3m18-6h-2m2 6h-2M7 19h10a2 2 0 002-2V7a2 2 0 00-2-2H7a2 2 0 00-2 2v10a2 2 0 002 2zM9 9h6v6H9V9z" />
                </svg>
              </div>
              <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">
                {t('devices.noDevices', 'No devices connected yet')}
              </h3>
              <p className="text-gray-500 dark:text-gray-400 mb-4">
                {t('devices.getStarted', 'Get started by adding your first IoT device')}
              </p>
              <button 
                onClick={() => router.push('/devices/add')} 
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg transition-colors"
              >
                {t('devices.addFirstDevice', 'Add Your First Device')}
              </button>
            </div>
          ) : (
            <div className="p-6">
              <div className={`grid gap-6 ${compactMode ? 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4' : 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3'}`}>
                {devices.map((device) => (
                  <DeviceListItem
                    key={device.device_key}
                    device={device}
                    onUpdate={handleDeviceUpdate}
                    onDelete={handleDeviceDelete}
                  />
                ))}
              </div>
            </div>
          )}
        </div>
      </main>
    </motion.div>
  );
}
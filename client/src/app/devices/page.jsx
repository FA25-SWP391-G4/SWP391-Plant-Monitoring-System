'use client'

import { useState, useEffect } from 'react';
import { useAuth } from '@/providers/AuthProvider';
import { useRouter } from 'next/navigation';
import { useTranslation } from 'react-i18next';
import AppLayout from '@/components/layout/AppLayout';
import DashboardHeader from '@/components/dashboard/DashboardHeader';
import deviceApi from '@/api/deviceApi';
import { toast } from 'react-toastify';

export default function DevicesPage() {
  const { t } = useTranslation();
  const { user, isLoading: authLoading } = useAuth();
  const router = useRouter();
  
  const [devices, setDevices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login');
      return;
    }

    const fetchDevices = async () => {
      try {
        setLoading(true);
        const devicesData = await deviceApi.getAll();
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
    <AppLayout>
      <div className="flex flex-col flex-1 p-4 lg:p-8">
        <DashboardHeader 
          title={t('devices.title', 'My Devices')} 
          description={t('devices.description', 'Manage your connected devices and sensors')}
        />

        <div className="mt-6 bg-white dark:bg-gray-800 rounded-lg shadow">
          {loading ? (
            <div className="p-8 flex justify-center">
              <div className="animate-pulse flex flex-col space-y-4 w-full">
                {[...Array(3)].map((_, i) => (
                  <div key={i} className="h-24 bg-gray-200 dark:bg-gray-700 rounded w-full"></div>
                ))}
              </div>
            </div>
          ) : error ? (
            <div className="p-8 text-center text-red-500">
              {error}
              <button 
                onClick={() => window.location.reload()} 
                className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                {t('common.retry', 'Retry')}
              </button>
            </div>
          ) : devices.length === 0 ? (
            <div className="p-8 text-center">
              <p className="text-lg text-gray-600 dark:text-gray-300">
                {t('devices.noDevices', 'No devices connected yet.')}
              </p>
              <button 
                onClick={() => router.push('/devices/add')} 
                className="mt-4 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
              >
                {t('devices.addDevice', 'Add a new device')}
              </button>
            </div>
          ) : (
            <div className="overflow-hidden">
              <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                <thead className="bg-gray-50 dark:bg-gray-900">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      {t('devices.deviceName', 'Device Name')}
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      {t('devices.deviceType', 'Type')}
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      {t('devices.status', 'Status')}
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      {t('devices.lastActive', 'Last Active')}
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      {t('common.actions', 'Actions')}
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                  {devices.map((device) => (
                    <tr key={device.device_key}>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="ml-4">
                            <div className="text-sm font-medium text-gray-900 dark:text-gray-100">
                              {device.device_name}
                            </div>
                            <div className="text-sm text-gray-500 dark:text-gray-400">
                              ID: {device.device_key}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900 dark:text-gray-100">{device.device_type}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full 
                          ${device.status === 'online' ? 'bg-green-100 text-green-800' : 
                          device.status === 'offline' ? 'bg-red-100 text-red-800' : 
                          'bg-yellow-100 text-yellow-800'}`}>
                          {device.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                        {new Date(device.last_active).toLocaleString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <button 
                          onClick={() => router.push(`/devices/${device.device_key}`)} 
                          className="text-blue-600 hover:text-blue-900 dark:text-blue-400 dark:hover:text-blue-300 mr-4"
                        >
                          {t('common.view', 'View')}
                        </button>
                        <button 
                          onClick={() => router.push(`/devices/${device.device_key}/edit`)} 
                          className="text-indigo-600 hover:text-indigo-900 dark:text-indigo-400 dark:hover:text-indigo-300"
                        >
                          {t('common.edit', 'Edit')}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </AppLayout>
  );
}
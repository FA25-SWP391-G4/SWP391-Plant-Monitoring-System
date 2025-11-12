'use client'

import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import deviceApi from '@/api/deviceApi';
import { toast } from 'react-toastify';

export default function ConnectDeviceModal({ isOpen, onClose, onConnect, plantId }) {
  const { t } = useTranslation();
  const [devices, setDevices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedDevice, setSelectedDevice] = useState('');
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchDevices = async () => {
      try {
        setLoading(true);
        const response = await deviceApi.getAll();
        const availableDevices = Array.isArray(response) ? response : 
                               response.data ? (Array.isArray(response.data) ? response.data : []) : 
                               [];
        setDevices(availableDevices.filter(d => !d.plant_id)); // Only show unconnected devices
        setError(null);
      } catch (err) {
        console.error('Error fetching devices:', err);
        setError(t('devices.errorFetching', 'Failed to fetch devices'));
      } finally {
        setLoading(false);
      }
    };

    if (isOpen) {
      fetchDevices();
    }
  }, [isOpen, t]);

  const handleConnect = async () => {
    if (!selectedDevice) {
      toast.error(t('devices.selectDevice', 'Please select a device'));
      return;
    }
    
    try {
      await onConnect(selectedDevice);
      onClose();
      toast.success(t('devices.connected', 'Device connected successfully'));
    } catch (error) {
      console.error('Error connecting device:', error);
      toast.error(t('devices.connectionError', 'Failed to connect device'));
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
        <div className="fixed inset-0 transition-opacity" aria-hidden="true">
          <div className="absolute inset-0 bg-gray-500 opacity-75"></div>
        </div>

        <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
          <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
            <div className="sm:flex sm:items-start">
              <div className="mt-3 text-center sm:mt-0 sm:text-left w-full">
                <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">
                  {t('devices.connectDevice', 'Connect Device')}
                </h3>
                
                {loading ? (
                  <div className="flex justify-center py-4">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-500"></div>
                  </div>
                ) : error ? (
                  <div className="text-red-500 text-center py-4">
                    {error}
                  </div>
                ) : devices.length === 0 ? (
                  <div className="text-center py-4">
                    <p className="text-gray-600 mb-4">{t('devices.noAvailableDevices', 'No available devices found')}</p>
                    <a href="/devices/add" className="text-emerald-600 hover:text-emerald-700">
                      {t('devices.addNewDevice', 'Add a new device')}
                    </a>
                  </div>
                ) : (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      {t('devices.selectDevice', 'Select Device')}
                    </label>
                    <select
                      value={selectedDevice}
                      onChange={(e) => setSelectedDevice(e.target.value)}
                      className="mt-1 block w-full py-2 px-3 border border-gray-300 bg-white rounded-md shadow-sm focus:outline-none focus:ring-emerald-500 focus:border-emerald-500"
                    >
                      <option value="">{t('common.select', 'Select...')}</option>
                      {devices.map((device) => (
                        <option key={device.device_key} value={device.device_key}>
                          {device.device_name} ({device.device_type})
                        </option>
                      ))}
                    </select>
                  </div>
                )}
              </div>
            </div>
          </div>
          <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
            <button
              type="button"
              onClick={handleConnect}
              disabled={!selectedDevice || loading}
              className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-emerald-600 text-base font-medium text-white hover:bg-emerald-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500 sm:ml-3 sm:w-auto sm:text-sm disabled:opacity-50"
            >
              {t('common.connect', 'Connect')}
            </button>
            <button
              type="button"
              onClick={onClose}
              className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm"
            >
              {t('common.cancel', 'Cancel')}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
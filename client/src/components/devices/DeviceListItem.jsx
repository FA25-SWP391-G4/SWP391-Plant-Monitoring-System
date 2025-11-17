'use client'

import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useSettings } from '@/providers/SettingsProvider';
import { motion } from 'framer-motion';
import Link from 'next/link';
import Modal from '@/components/ui/Modal';
import ConfirmDialog from '@/components/ui/ConfirmDialog';
import deviceApi from '@/api/deviceApi';
import { toast } from 'react-toastify';
import { formatDate } from '@/utils/dateFormat';

export default function DeviceListItem({ device, onUpdate, onDelete }) {
  const { t } = useTranslation();
  const { settings } = useSettings();
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [sensorData, setSensorData] = useState(null);
  const [lastDataTime, setLastDataTime] = useState(null);

  const showTitles = settings?.widgets?.showWidgetTitles ?? true;
  const showIcons = settings?.widgets?.showWidgetIcons ?? true;
  const compactMode = settings?.widgets?.compactMode ?? false;
  const animationsEnabled = settings?.widgets?.animationsEnabled ?? true;


  // Calculate device status based on last sensor data timestamp
  const getDeviceStatus = () => {
    if (!lastDataTime) return 'offline';
    
    const now = new Date();
    const lastData = new Date(lastDataTime);
    const timeDiffMinutes = (now - lastData) / (1000 * 60);
    
    // Consider device offline if no data for more than 10 minutes
    if (timeDiffMinutes > 10) {
      return 'offline';
    } else if (timeDiffMinutes > 5) {
      return 'warning';
    } else {
      return 'online';
    }
  };

  // Get status info for display
  const getStatusInfo = () => {
    const deviceStatus = getDeviceStatus();
    
    if (deviceStatus === 'online') {
      return { 
        color: 'text-emerald-600', 
        bgColor: 'bg-emerald-100 dark:bg-emerald-900/30', 
        text: t('device.online', 'Online'),
        icon: (
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-1">
            <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
            <path d="m9 11 3 3L22 4"></path>
          </svg>
        )
      };
    }
    
    if (deviceStatus === 'warning') {
      return {
        color: 'text-amber-600',
        bgColor: 'bg-amber-100 dark:bg-amber-900/30',
        text: t('device.warning', 'Warning'),
        icon: (
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-1">
            <path d="M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path>
            <line x1="12" y1="9" x2="12" y2="13"></line>
            <line x1="12" y1="17" x2="12.01" y2="17"></line>
          </svg>
        )
      };
    }
    
    return {
      color: 'text-red-600',
      bgColor: 'bg-red-100 dark:bg-red-900/30',
      text: t('device.offline', 'Offline'),
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-1">
          <circle cx="12" cy="12" r="10"></circle>
          <path d="m15 9-6 6"></path>
          <path d="m9 9 6 6"></path>
        </svg>
      )
    };
  };

  // Load sensor data for device
  const loadSensorData = async () => {
    try {
      const response = await deviceApi.getSensorHistory(device.device_key, {
        limit: 1,
        order: 'desc'
      });
      
      if (response?.data && Array.isArray(response.data) && response.data.length > 0) {
        const latestData = response.data[0];
        setSensorData(latestData);
        setLastDataTime(latestData.timestamp);
      }
    } catch (error) {
      console.error('Error loading sensor data:', error);
      // Set device as offline if we can't fetch data
      setLastDataTime(null);
    }
  };

  const statusInfo = getStatusInfo();

  // Get last active display
  const getLastActiveDisplay = () => {
    if (lastDataTime) {
      const lastActive = new Date(lastDataTime);
      const now = new Date();
      const diffMs = now - lastActive;
      const diffMins = Math.floor(diffMs / (1000 * 60));
      const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
      const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

      if (diffMins < 1) return t('device.justNow', 'Just now');
      if (diffMins < 60) return t('device.minutesAgo', '{{minutes}} minutes ago', { minutes: diffMins });
      if (diffHours < 24) return t('device.hoursAgo', '{{hours}} hours ago', { hours: diffHours });
      return t('device.daysAgo', '{{days}} days ago', { days: diffDays });
    }
    
    if (device.last_active) {
      return formatDate(new Date(device.last_active).toLocaleDateString(), settings.language.dateFormat);
    }
    
    return t('device.neverActive', 'Never active');
  };

  const lastActiveInfo = getLastActiveDisplay();

  // Animation variants
  const cardVariants = {
    hidden: { opacity: 0, scale: 0.9 },
    visible: { opacity: 1, scale: 1, transition: { duration: 0.3, ease: "easeOut" } },
    hover: { y: -4, transition: { duration: 0.2 } }
  };

  useEffect(() => {
    // Load sensor data on component mount
    loadSensorData();
    
    // Set up interval to refresh sensor data every 30 seconds
    const interval = setInterval(loadSensorData, 30000);
    
    return () => clearInterval(interval);
  }, [device.device_key]);

  // Handle edit action
  const handleEdit = () => {
    setShowEditModal(true);
  };

  // Handle delete action
  const handleDelete = async () => {
    setShowDeleteConfirm(true);
  };

  // Confirm delete action
  const handleConfirmDelete = async () => {
    try {
      await deviceApi.deleteDevice(device.device_key);
      toast.success(t('devices.deleteSuccess', 'Device deleted successfully'));
      if (onDelete) onDelete(device.device_key);
    } catch (error) {
      console.error('Error deleting device:', error);
      toast.error(t('devices.deleteError', 'Failed to delete device'));
    }
  };

  // Handle save from edit modal
  const handleSave = async (updatedData) => {
    try {
      const response = await deviceApi.updateDevice(device.device_key, updatedData);
      toast.success(t('devices.updateSuccess', 'Device updated successfully'));
      if (onUpdate) onUpdate(response.data || { ...device, ...updatedData });
      setShowEditModal(false);
    } catch (error) {
      console.error('Error updating device:', error);
      toast.error(t('devices.updateError', 'Failed to update device'));
    }
  };

  
  return (
    <div 
      variants={cardVariants}
      initial="hidden"
      animate="visible"
      whileHover={animationsEnabled ? "hover" : undefined}
      className={`bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden hover:shadow-md transition-shadow ${animationsEnabled ? 'duration-200 ease-in-out fade-in' : ''}`}
    >
      {/* Device Icon/Image */}
      <div className={`relative ${compactMode ? 'h-28' : 'h-48'} bg-gray-100 dark:bg-gray-700`}>
        <div className="flex items-center justify-center h-full">
          <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round" className="text-gray-300 dark:text-gray-600">
            <rect width="18" height="18" x="3" y="3" rx="2"></rect>
            <path d="M9 9h.01"></path>
            <path d="M9 15h.01"></path>
            <path d="M15 9h.01"></path>
            <path d="M15 15h.01"></path>
          </svg>
        </div>
        
        {/* Status badge */}
        <div className={`${statusInfo.bgColor} ${statusInfo.color} px-2 py-1 rounded-full flex items-center text-xs font-medium absolute top-3 right-3`}>
          {showIcons && statusInfo.icon}
          {statusInfo.text}
        </div>
      </div>
      
      {/* Device Info */}
      <div className="p-4">
        <h3 className={`${showTitles ? 'text-lg font-semibold' : 'hidden'} text-gray-900 dark:text-gray-100 mb-1`}>{device.device_name}</h3>
        <p className={`${showTitles ? 'text-sm' : 'hidden'} text-gray-500 dark:text-gray-400 mb-3`}>{device.device_type}</p>
        
        <div className="grid grid-cols-2 gap-2 mb-4">
          {/* Device ID */}
          <div className="flex items-center text-sm text-gray-700 dark:text-gray-300">
            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-gray-400 dark:text-gray-500 mr-1.5">
              <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"></path>
              <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"></path>
            </svg>
            {device.device_key.substring(0, 8)}...
          </div>
          
          {/* Last Active */}
          <div className="flex items-center text-sm text-gray-700 dark:text-gray-300">
            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-gray-400 dark:text-gray-500 mr-1.5">
              <circle cx="12" cy="12" r="10"></circle>
              <polyline points="12 6 12 12 16 14"></polyline>
            </svg>
            {lastActiveInfo}
          </div>
        </div>
        
        {/* Sensor Data Display */}
        {sensorData && (
          <div className="mb-4">
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="flex items-center text-gray-600 dark:text-gray-400">
                <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-blue-500 mr-1">
                  <path d="M12 22a7 7 0 0 0 7-7c0-2-1-3.9-3-5.5s-3.5-4-4-6.5c-.5 2.5-2 4.9-4 6.5C6 11.1 5 15 5 15a7 7 0 0 0 7 7z"></path>
                </svg>
                {sensorData.soil_moisture}% {t('metrics.moisture', 'moisture')}
              </div>
              <div className="flex items-center text-gray-600 dark:text-gray-400">
                <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-red-500 mr-1">
                  <path d="M14 4v10.54a4 4 0 1 1-4 0V4a2 2 0 0 1 4 0Z"></path>
                </svg>
                {sensorData.temperature}°C
              </div>
            </div>
          </div>
        )}
        
        {/* Actions */}
        <div className="flex justify-between items-center">
          <div className="flex gap-2">
            <Link 
              href={`/devices/${device.device_key}`} 
              className="px-3 py-1.5 bg-emerald-600 text-white text-sm rounded hover:bg-emerald-700 transition-colors btn-transition"
            >
              {t('devices.viewDetails', 'View Details')}
            </Link>
            <button
              onClick={handleEdit}
              className="px-3 py-1.5 bg-blue-600 text-white text-sm rounded hover:bg-blue-700 transition-colors btn-transition"
            >
              {t('devices.edit', 'Edit')}
            </button>
            <button
              onClick={handleDelete}
              className="px-3 py-1.5 bg-red-600 text-white text-sm rounded hover:bg-red-700 transition-colors btn-transition"
            >
              {t('devices.delete', 'Delete')}
            </button>
          </div>
        </div>
      </div>

      {/* Edit Modal */}
      {showEditModal && (
        <EditDeviceModal
          device={device}
          onClose={() => setShowEditModal(false)}
          onSave={handleSave}
        />
      )}

      {/* Delete Confirmation Dialog */}
      {showDeleteConfirm && (
        <ConfirmDialog
          isOpen={showDeleteConfirm}
          onClose={() => setShowDeleteConfirm(false)}
          onConfirm={handleConfirmDelete}
          title={t('devices.confirmDeleteTitle', 'Delete Device')}
          message={t('devices.confirmDelete', 'Are you sure you want to delete this device? This action cannot be undone.')}
          confirmText={t('common.delete', 'Delete')}
          variant="danger"
        />
      )}
    </div>
  );
}

// EditDeviceModal component for editing device information
function EditDeviceModal({ device, onClose, onSave }) {
  const { t } = useTranslation();
  const [formData, setFormData] = useState({
    device_name: device.device_name || '',
    device_type: device.device_type || '',
    location: device.location || '',
    description: device.description || ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.device_name.trim()) {
      setError(t('devices.nameRequired', 'Device name is required'));
      return;
    }

    setLoading(true);
    setError('');
    
    try {
      await onSave(formData);
    } catch (err) {
      setError(err.message || t('devices.updateError', 'Failed to update device'));
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  return (
    <Modal isOpen={true} onClose={onClose} size="lg">
      <div className="p-6">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
            {t('devices.editDevice', 'Edit Device')}
          </h2>
          <button
            type="button"
            className="text-gray-400 hover:text-gray-500 dark:hover:text-gray-300 transition-colors"
            onClick={onClose}
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {error && (
            <div className="mb-4 p-3 bg-red-100 dark:bg-red-900/30 border border-red-300 dark:border-red-700 text-red-700 dark:text-red-300 rounded-lg">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit}>
            {/* Device Name */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                {t('devices.deviceName', 'Device Name')} *
              </label>
              <input
                type="text"
                name="device_name"
                value={formData.device_name}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 dark:bg-gray-700 dark:text-gray-100"
                placeholder={t('devices.namePlaceholder', 'Enter device name')}
                required
              />
            </div>

            {/* Submit Buttons */}
            <div className="flex gap-3">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
              >
                {t('common.cancel', 'Cancel')}
              </button>
              <button
                type="submit"
                disabled={loading}
                className="flex-1 px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 disabled:opacity-50 transition-colors"
              >
                {loading ? t('common.saving', 'Saving...') : t('common.save', 'Save')}
              </button>
            </div>
          </form>
        </div>
    </Modal>
  );
}
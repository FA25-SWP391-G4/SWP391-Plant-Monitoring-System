import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Card, CardContent } from '../ui/Card';
import { Button } from '../ui/Button';

const ManualWateringControl = ({ plantId, deviceStatus, onWater }) => {
  const { t } = useTranslation();
  const [isWatering, setIsWatering] = useState(false);
  const [duration, setDuration] = useState(30);

  const handleWater = async () => {
    if (deviceStatus !== 'online') {
      alert(t('watering.deviceOffline', 'Device is offline. Cannot start watering.'));
      return;
    }

    setIsWatering(true);
    try {
      await onWater(duration);
      // Show success message
      alert(t('watering.success', 'Watering started successfully!'));
    } catch (error) {
      console.error('Watering failed:', error);
      alert(t('watering.failed', 'Failed to start watering. Please try again.'));
    } finally {
      setIsWatering(false);
    }
  };

  const presetDurations = [
    { value: 15, label: '15s' },
    { value: 30, label: '30s' },
    { value: 60, label: '1min' },
    { value: 120, label: '2min' }
  ];

  return (
    <div className="space-y-4">
      {/* Device Status Indicator */}
      <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
        <span className="text-sm font-medium text-gray-700">
          {t('watering.deviceStatus', 'Device Status')}
        </span>
        <div className="flex items-center">
          <div className={`w-2 h-2 rounded-full mr-2 ${
            deviceStatus === 'online' ? 'bg-green-500' : 'bg-red-500'
          }`}></div>
          <span className={`text-sm font-medium ${
            deviceStatus === 'online' ? 'text-green-700' : 'text-red-700'
          }`}>
            {deviceStatus === 'online' 
              ? t('devices.online', 'Online') 
              : t('devices.offline', 'Offline')
            }
          </span>
        </div>
      </div>

      {/* Duration Selection */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          {t('watering.duration', 'Watering Duration')}
        </label>
        
        {/* Preset Buttons */}
        <div className="grid grid-cols-4 gap-2 mb-3">
          {presetDurations.map((preset) => (
            <Button
              key={preset.value}
              variant={duration === preset.value ? 'default' : 'outline'}
              size="sm"
              onClick={() => setDuration(preset.value)}
              className="text-xs"
            >
              {preset.label}
            </Button>
          ))}
        </div>
        
        {/* Custom Duration Input */}
        <div className="flex items-center space-x-2">
          <input
            type="range"
            min="10"
            max="300"
            value={duration}
            onChange={(e) => setDuration(parseInt(e.target.value))}
            className="flex-1"
          />
          <span className="text-sm font-medium text-gray-700 min-w-[60px]">
            {duration}s
          </span>
        </div>
      </div>

      {/* Water Button */}
      <Button
        onClick={handleWater}
        disabled={isWatering || deviceStatus !== 'online'}
        className="w-full"
        size="lg"
      >
        {isWatering ? (
          <div className="flex items-center">
            <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            {t('watering.inProgress', 'Watering...')}
          </div>
        ) : (
          <div className="flex items-center justify-center">
            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 7.172V5L8 4z" />
            </svg>
            {t('watering.startWatering', 'Start Watering')}
          </div>
        )}
      </Button>

      {/* Warning Message */}
      {deviceStatus !== 'online' && (
        <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
          <div className="flex">
            <svg className="w-5 h-5 text-yellow-400 mr-2" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
            <div>
              <p className="text-sm font-medium text-yellow-800">
                {t('watering.deviceOfflineWarning', 'Device Offline')}
              </p>
              <p className="text-sm text-yellow-700">
                {t('watering.checkConnection', 'Please check your device connection and try again.')}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Last Watering Info */}
      <div className="text-xs text-gray-500 text-center">
        {t('watering.tip', 'Tip: Monitor your plant after watering to ensure optimal moisture levels.')}
      </div>
    </div>
  );
};

export default ManualWateringControl;
import React from 'react';
import { useTranslation } from 'react-i18next';
import { Card } from '../ui/Card';
import { FiDroplet, FiSun, FiThermometer, FiClock } from 'react-icons/fi';

/**
 * PlantStats component shows the key stats and health indicators for a plant
 */
const PlantStats = ({ plant, sensorData }) => {
  const { t } = useTranslation();
  
  // Use placeholder data if none provided
  const stats = {
    moisture: sensorData?.moisture || '--',
    light: sensorData?.light || '--',
    temperature: sensorData?.temperature || '--',
    lastWatered: plant?.lastWatered || null,
    healthStatus: plant?.healthStatus || 'unknown',
  };

  // Helper to get status indicator colors
  const getStatusColor = (status) => {
    switch(status) {
      case 'healthy':
        return {
          bg: 'bg-green-50',
          text: 'text-green-600',
          border: 'border-green-200',
          label: t('status.healthy', 'Healthy')
        };
      case 'needs_water':
        return {
          bg: 'bg-yellow-50',
          text: 'text-yellow-600',
          border: 'border-yellow-200',
          label: t('status.needsWater', 'Needs Water')
        };
      case 'overwatered':
        return {
          bg: 'bg-blue-50',
          text: 'text-blue-600',
          border: 'border-blue-200',
          label: t('status.overwatered', 'Overwatered')
        };
      case 'needs_light':
        return {
          bg: 'bg-amber-50',
          text: 'text-amber-600',
          border: 'border-amber-200',
          label: t('status.needsLight', 'Needs Light')
        };
      case 'too_much_light':
        return {
          bg: 'bg-orange-50',
          text: 'text-orange-600',
          border: 'border-orange-200',
          label: t('status.tooMuchLight', 'Too Much Light')
        };
      case 'temperature_issue':
        return {
          bg: 'bg-red-50',
          text: 'text-red-600',
          border: 'border-red-200',
          label: t('status.temperatureIssue', 'Temperature Issue')
        };
      case 'pest_detected':
        return {
          bg: 'bg-red-50',
          text: 'text-red-600',
          border: 'border-red-200',
          label: t('status.pestDetected', 'Pest Detected')
        };
      default:
        return {
          bg: 'bg-gray-50',
          text: 'text-gray-600',
          border: 'border-gray-200',
          label: t('status.unknown', 'Unknown')
        };
    }
  };

  const statusInfo = getStatusColor(stats.healthStatus);

  return (
    <Card className="mb-6">
      <div className="p-5">
        <h3 className="text-lg font-medium mb-4">{t('plants.plantStats', 'Plant Stats')}</h3>
        
        {/* Health status indicator */}
        <div className={`mb-4 p-4 rounded-lg border ${statusInfo.border} ${statusInfo.bg}`}>
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <div className={`w-3 h-3 rounded-full ${stats.healthStatus === 'healthy' ? 'bg-green-500' : (stats.healthStatus === 'unknown' ? 'bg-gray-400' : 'bg-yellow-500')}`}></div>
              <span className={`ml-2 font-medium ${statusInfo.text}`}>
                {statusInfo.label}
              </span>
            </div>
            {stats.lastUpdated && (
              <span className="text-xs text-gray-500">
                {t('plants.lastUpdated', 'Updated')}: {new Date(stats.lastUpdated).toLocaleTimeString()}
              </span>
            )}
          </div>
        </div>
        
        {/* Stats grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {/* Moisture */}
          <div className="border rounded-lg p-3">
            <div className="flex items-center mb-2">
              <FiDroplet className="text-blue-500 mr-2" />
              <span className="text-sm text-gray-500">{t('sensors.moisture', 'Moisture')}</span>
            </div>
            <p className="text-xl font-semibold">
              {stats.moisture !== '--' ? `${stats.moisture}%` : '--'}
            </p>
          </div>
          
          {/* Light */}
          <div className="border rounded-lg p-3">
            <div className="flex items-center mb-2">
              <FiSun className="text-amber-500 mr-2" />
              <span className="text-sm text-gray-500">{t('sensors.light', 'Light')}</span>
            </div>
            <p className="text-xl font-semibold">
              {stats.light !== '--' ? `${stats.light}%` : '--'}
            </p>
          </div>
          
          {/* Temperature */}
          <div className="border rounded-lg p-3">
            <div className="flex items-center mb-2">
              <FiThermometer className="text-red-500 mr-2" />
              <span className="text-sm text-gray-500">{t('sensors.temperature', 'Temperature')}</span>
            </div>
            <p className="text-xl font-semibold">
              {stats.temperature !== '--' ? `${stats.temperature}°C` : '--'}
            </p>
          </div>
          
          {/* Last Watered */}
          <div className="border rounded-lg p-3">
            <div className="flex items-center mb-2">
              <FiClock className="text-gray-500 mr-2" />
              <span className="text-sm text-gray-500">{t('plants.lastWatered', 'Last Watered')}</span>
            </div>
            <p className="text-sm font-medium">
              {stats.lastWatered 
                ? new Date(stats.lastWatered).toLocaleDateString() 
                : t('plants.noRecord', 'No record')}
            </p>
          </div>
        </div>
        
        {/* Sensor disclaimer */}
        <p className="text-xs text-gray-500 mt-4">
          {t('sensors.disclaimer', 'Sensor data is updated every 30 minutes when the device is connected.')}
        </p>
      </div>
    </Card>
  );
};

export default PlantStats;
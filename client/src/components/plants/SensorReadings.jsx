import React from 'react';
import { useTranslation } from 'react-i18next';
import { Card } from '../ui/Card';
import { FiDroplet, FiThermometer, FiSun } from 'react-icons/fi';

/**
 * SensorReadings component displays the current sensor readings for a plant
 * including moisture, temperature, and light levels
 */
const SensorReadings = ({ plantId, sensorData }) => {
  const { t } = useTranslation();
  
  // Default placeholder data if no sensor data is provided
  const data = sensorData || {
    moisture: '–',
    temperature: '–',
    light: '–',
    lastUpdated: null
  };

  const getStatusColor = (type, value) => {
    if (value === '–') return 'bg-gray-100 text-gray-400';
    
    // Different thresholds based on reading type
    switch (type) {
      case 'moisture':
        if (value < 30) return 'bg-red-100 text-red-600';
        if (value > 80) return 'bg-blue-100 text-blue-600';
        return 'bg-green-100 text-green-600';
        
      case 'temperature':
        if (value < 15) return 'bg-blue-100 text-blue-600';
        if (value > 30) return 'bg-red-100 text-red-600';
        return 'bg-green-100 text-green-600';
        
      case 'light':
        if (value < 20) return 'bg-purple-100 text-purple-600';
        if (value > 90) return 'bg-yellow-100 text-yellow-600';
        return 'bg-green-100 text-green-600';
        
      default:
        return 'bg-gray-100 text-gray-400';
    }
  };

  return (
    <Card className="mb-6">
      <div className="p-5">
        <h3 className="text-lg font-medium mb-4">{t('plants.sensorReadings', 'Sensor Readings')}</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Soil Moisture */}
          <div className="flex items-center p-4 rounded-lg border border-gray-200">
            <div className={`p-3 rounded-full mr-4 ${getStatusColor('moisture', data.moisture)}`}>
              <FiDroplet className="h-6 w-6" />
            </div>
            <div>
              <p className="text-sm text-gray-500">{t('sensors.moisture', 'Soil Moisture')}</p>
              <div className="flex items-baseline">
                <span className="text-2xl font-semibold">{data.moisture}</span>
                {data.moisture !== '–' && <span className="ml-1 text-gray-500">%</span>}
              </div>
            </div>
          </div>
          
          {/* Temperature */}
          <div className="flex items-center p-4 rounded-lg border border-gray-200">
            <div className={`p-3 rounded-full mr-4 ${getStatusColor('temperature', data.temperature)}`}>
              <FiThermometer className="h-6 w-6" />
            </div>
            <div>
              <p className="text-sm text-gray-500">{t('sensors.temperature', 'Temperature')}</p>
              <div className="flex items-baseline">
                <span className="text-2xl font-semibold">{data.temperature}</span>
                {data.temperature !== '–' && <span className="ml-1 text-gray-500">°C</span>}
              </div>
            </div>
          </div>
          
          {/* Light */}
          <div className="flex items-center p-4 rounded-lg border border-gray-200">
            <div className={`p-3 rounded-full mr-4 ${getStatusColor('light', data.light)}`}>
              <FiSun className="h-6 w-6" />
            </div>
            <div>
              <p className="text-sm text-gray-500">{t('sensors.light', 'Light')}</p>
              <div className="flex items-baseline">
                <span className="text-2xl font-semibold">{data.light}</span>
                {data.light !== '–' && <span className="ml-1 text-gray-500">%</span>}
              </div>
            </div>
          </div>
        </div>
        
        {data.lastUpdated ? (
          <p className="text-xs text-gray-500 mt-4">
            {t('sensors.lastUpdated', 'Last updated')}: {new Date(data.lastUpdated).toLocaleString()}
          </p>
        ) : (
          <p className="text-xs text-gray-500 mt-4">
            {t('sensors.noReadings', 'No sensor readings available')}
          </p>
        )}
      </div>
    </Card>
  );
};

export default SensorReadings;
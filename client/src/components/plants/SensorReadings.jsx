import React from 'react';
import { useTranslation } from 'react-i18next';
import { Card, CardHeader, CardTitle, CardContent } from '../ui/Card';

const SensorReadings = ({ readings }) => {
  const { t } = useTranslation();

  if (!readings) {
    return (
      <Card>
        <CardContent className="text-center py-8">
          <p className="text-gray-500">
            {t('sensors.noData', 'No sensor data available')}
          </p>
        </CardContent>
      </Card>
    );
  }

  const sensorData = [
    {
      name: t('sensors.moisture', 'Moisture'),
      value: readings.moisture || 0,
      unit: '%',
      icon: '💧',
      color: 'text-blue-600',
      bgColor: 'bg-blue-100'
    },
    {
      name: t('sensors.temperature', 'Temperature'),
      value: readings.temperature || 0,
      unit: '°C',
      icon: '🌡️',
      color: 'text-red-600',
      bgColor: 'bg-red-100'
    },
    {
      name: t('sensors.humidity', 'Humidity'),
      value: readings.humidity || 0,
      unit: '%',
      icon: '💨',
      color: 'text-green-600',
      bgColor: 'bg-green-100'
    },
    {
      name: t('sensors.light', 'Light'),
      value: readings.light || 0,
      unit: 'lux',
      icon: '☀️',
      color: 'text-yellow-600',
      bgColor: 'bg-yellow-100'
    }
  ];

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          {t('sensors.currentReadings', 'Current Sensor Readings')}
        </h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {sensorData.map((sensor, index) => (
            <Card key={index} className="text-center">
              <CardContent className="p-4">
                <div className={`w-12 h-12 ${sensor.bgColor} rounded-full flex items-center justify-center mx-auto mb-3`}>
                  <span className="text-2xl">{sensor.icon}</span>
                </div>
                <h4 className="font-medium text-gray-700 mb-1">{sensor.name}</h4>
                <div className={`text-2xl font-bold ${sensor.color} mb-1`}>
                  {sensor.value}{sensor.unit}
                </div>
                <p className="text-xs text-gray-500">
                  {t('sensors.lastUpdated', 'Last updated: {{time}}', { 
                    time: new Date().toLocaleTimeString() 
                  })}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{t('sensors.history', 'Sensor History')}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-gray-500">
            <p>{t('sensors.historyPlaceholder', 'Sensor history chart will be displayed here')}</p>
            <p className="text-sm mt-2">{t('sensors.comingSoon', 'Coming soon in future updates')}</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default SensorReadings;
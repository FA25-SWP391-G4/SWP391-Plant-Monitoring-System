import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { FiDroplet, FiThermometer, FiSun } from 'react-icons/fi';

/**
 * SensorChart component displays sensor data over time with interactive chart
 * Note: In a real application, you would use a charting library like Chart.js,
 * Recharts, or ApexCharts. This is a simplified placeholder.
 */
const SensorChart = ({ plantId, sensorData = {} }) => {
  const { t } = useTranslation();
  const [timeRange, setTimeRange] = useState('week'); // 'day', 'week', 'month'
  const [sensorType, setSensorType] = useState('moisture'); // 'moisture', 'temperature', 'light'
  
  const sensorTypes = {
    moisture: {
      icon: <FiDroplet className="text-blue-500" />,
      label: t('sensors.moisture', 'Soil Moisture'),
      color: 'blue',
      unit: '%'
    },
    temperature: {
      icon: <FiThermometer className="text-red-500" />,
      label: t('sensors.temperature', 'Temperature'),
      color: 'red',
      unit: '°C'
    },
    light: {
      icon: <FiSun className="text-amber-500" />,
      label: t('sensors.light', 'Light'),
      color: 'amber',
      unit: '%'
    }
  };
  
  const timeRanges = {
    day: t('time.day', 'Day'),
    week: t('time.week', 'Week'),
    month: t('time.month', 'Month')
  };
  
  // Get data for selected sensor type and time range
  const getChartData = () => {
    if (!sensorData || !sensorData[sensorType]) {
      return [];
    }
    
    const data = sensorData[sensorType] || [];
    
    // In a real app, you'd filter based on the timeRange
    switch(timeRange) {
      case 'day':
        return data.slice(-24); // Last 24 hours
      case 'week':
        return data.slice(-7 * 24); // Last 7 days
      case 'month':
        return data.slice(-30 * 24); // Last 30 days
      default:
        return data;
    }
  };
  
  const chartData = getChartData();
  const currentSensor = sensorTypes[sensorType];
  
  // Simple function to get min/max values for the chart
  const getMinMax = () => {
    if (!chartData || chartData.length === 0) {
      return { min: 0, max: 100 };
    }
    
    const values = chartData.map(item => item.value);
    return {
      min: Math.min(...values),
      max: Math.max(...values)
    };
  };
  
  // Get recommended range for this plant and sensor type
  const getRecommendedRange = () => {
    // This would come from the plant's data in a real app
    const ranges = {
      moisture: { min: 30, max: 65 },
      temperature: { min: 18, max: 26 },
      light: { min: 40, max: 80 }
    };
    
    return ranges[sensorType] || { min: 0, max: 100 };
  };
  
  const recommendedRange = getRecommendedRange();
  const { min: dataMin, max: dataMax } = getMinMax();
  
  // Helper to format date for display
  const formatDate = (timestamp) => {
    if (!timestamp) return '';
    const date = new Date(timestamp);
    if (timeRange === 'day') {
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    }
    return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
  };

  return (
    <Card className="mb-6">
      <div className="p-5">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-medium">{t('plants.sensorHistory', 'Sensor History')}</h3>
          
          <div className="flex space-x-2">
            {Object.entries(timeRanges).map(([key, label]) => (
              <Button
                key={key}
                variant={timeRange === key ? 'default' : 'outline'}
                size="sm"
                className={`px-3 py-1 text-xs ${timeRange === key ? '' : 'border-gray-200'}`}
                onClick={() => setTimeRange(key)}
              >
                {label}
              </Button>
            ))}
          </div>
        </div>
        
        {/* Sensor type selector */}
        <div className="flex mb-6 border-b">
          {Object.entries(sensorTypes).map(([key, { icon, label }]) => (
            <button
              key={key}
              className={`flex items-center px-4 py-2 border-b-2 ${
                sensorType === key 
                  ? `border-${sensorTypes[key].color}-500 text-${sensorTypes[key].color}-600` 
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
              onClick={() => setSensorType(key)}
            >
              <span className="mr-2">{icon}</span>
              {label}
            </button>
          ))}
        </div>
        
        {chartData.length === 0 ? (
          <div className="py-12 text-center">
            <p className="text-gray-500">
              {t('plants.noSensorData', 'No sensor data available for this time period')}
            </p>
          </div>
        ) : (
          <div className="h-64 relative">
            {/* This is a placeholder for a real chart library */}
            <div className="absolute inset-0 flex items-end">
              {/* Recommended range indicator */}
              <div 
                className={`absolute left-0 right-0 bg-${currentSensor.color}-50 opacity-30`}
                style={{
                  bottom: `${(recommendedRange.min / 100) * 100}%`,
                  height: `${((recommendedRange.max - recommendedRange.min) / 100) * 100}%`
                }}
              />
              
              {/* Chart bars - simplified representation */}
              <div className="flex items-end justify-between w-full h-full">
                {chartData.map((entry, index) => {
                  // Normalize the value to a percentage of the chart height
                  const heightPercent = (entry.value / (dataMax > 100 ? dataMax : 100)) * 100;
                  
                  // Only show label for some points to avoid overcrowding
                  const showLabel = index % Math.ceil(chartData.length / 7) === 0;
                  
                  return (
                    <div key={index} className="flex flex-col items-center flex-1">
                      <div 
                        className={`w-2 bg-${currentSensor.color}-500 rounded-t`}
                        style={{ height: `${heightPercent}%` }}
                      />
                      {showLabel && (
                        <div className="text-xs text-gray-500 mt-2 -rotate-45 origin-top-left">
                          {formatDate(entry.timestamp)}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
            
            {/* Y-axis labels */}
            <div className="absolute left-0 top-0 bottom-0 w-10 flex flex-col justify-between text-xs text-gray-500">
              <span>{dataMax}{currentSensor.unit}</span>
              <span>{Math.floor((dataMax + dataMin) / 2)}{currentSensor.unit}</span>
              <span>{dataMin}{currentSensor.unit}</span>
            </div>
          </div>
        )}
        
        <div className="mt-4 text-xs text-gray-500">
          <div className="flex items-center space-x-4">
            <div className="flex items-center">
              <div className={`w-3 h-3 bg-${currentSensor.color}-500 rounded-full mr-1`}></div>
              <span>{currentSensor.label}</span>
            </div>
            <div className="flex items-center">
              <div className={`w-3 h-3 bg-${currentSensor.color}-50 opacity-60 rounded-full mr-1`}></div>
              <span>{t('plants.recommendedRange', 'Recommended range')}</span>
            </div>
          </div>
        </div>
      </div>
    </Card>
  );
};

export default SensorChart;
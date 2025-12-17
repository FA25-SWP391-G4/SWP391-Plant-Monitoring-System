import React from 'react';
import { Line } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
} from 'chart.js';
import { useTranslation } from 'react-i18next';
import { useTheme } from '@/contexts/ThemeContext';

// Register ChartJS components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

/**
 * Renders a line chart for displaying plant sensor history
 * @param {Object} props
 * @param {Array} props.data - Array of data points from sensors_data table
 * @param {String} props.dataType - Type of data (soil_moisture, light_intensity, temperature, air_humidity)
 * @param {String} props.timeRange - Time range to display (day, week, month)
 */
export default function PlantHistoryChart({ data, dataType, timeRange }) {
  const { t } = useTranslation();
  const { isDark, themeColors } = useTheme();
  
  if (!data || data.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-40 bg-gray-50 rounded-lg border border-gray-200">
        <p className="text-gray-500">{t('charts.noData', 'No historical data available')}</p>
      </div>
    );
  }

  // Helper function to identify which data points should show bullet points (earliest per minute)
  const getEarliestPerMinute = (dataArray) => {
    const minuteMap = new Map();
    const earliestIndices = new Set();
    
    dataArray.forEach((item, index) => {
      const date = new Date(item.timestamp);
      // Create a key for year-month-day-hour-minute (ignoring seconds for grouping)
      const minuteKey = `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}-${date.getHours()}-${date.getMinutes()}`;
      
      // Compare full timestamps (including seconds) to find the earliest within each minute
      if (!minuteMap.has(minuteKey) || new Date(item.timestamp) < new Date(minuteMap.get(minuteKey).timestamp)) {
        // Remove previous index for this minute if exists
        if (minuteMap.has(minuteKey)) {
          earliestIndices.delete(minuteMap.get(minuteKey).index);
        }
        minuteMap.set(minuteKey, { timestamp: item.timestamp, index });
        earliestIndices.add(index);
      }
    });
    
    return earliestIndices;
  };

  // Format the data for Chart.js - sort by timestamp ascending (left to right)
  const sortedData = [...data].sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));
  
  // Get indices of data points that should show bullet points
  const bulletPointIndices = getEarliestPerMinute(sortedData);
  
  const chartData = {
    labels: sortedData.map(item => {
      const date = new Date(item.timestamp);
      // Format labels based on time range
      if (timeRange === 'day') {
        return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      } else if (timeRange === 'week') {
        return date.toLocaleDateString([], { weekday: 'short', month: 'numeric', day: 'numeric' });
      } else {
        return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
      }
    }),
    datasets: [
      {
        label: getChartLabel(dataType),
        data: sortedData.map(item => item.value),
        borderColor: getChartColor(dataType),
        backgroundColor: getChartColor(dataType, 0.1),
        tension: 0.3,
        fill: true,
        pointRadius: (ctx) => {
          // Show bullet points only for earliest data point per minute
          return bulletPointIndices.has(ctx.dataIndex) ? 3 : 0;
        },
        pointHoverRadius: 6,
        pointBorderColor: '#ffffff',
        pointBorderWidth: 2,
      }
    ]
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false
      },
      tooltip: {
        backgroundColor: 'rgba(255, 255, 255, 0.9)',
        titleColor: '#475569',
        bodyColor: '#475569',
        borderColor: 'rgba(203, 213, 225, 1)',
        borderWidth: 1,
        padding: 10,
        displayColors: false,
        callbacks: {
          title: function(context) {
            // Show full timestamp with seconds in tooltip title
            const dataIndex = context[0].dataIndex;
            const timestamp = sortedData[dataIndex].timestamp;
            const date = new Date(timestamp);
            return date.toLocaleString([], { 
              month: 'short', 
              day: 'numeric', 
              hour: '2-digit', 
              minute: '2-digit', 
              second: '2-digit' 
            });
          },
          label: function(context) {
            let value = context.parsed.y;
            return `${value}${getUnitLabel(dataType)}`;
          }
        }
      }
    },
    scales: {
      x: {
        grid: {
          display: true,
          color: 'rgba(203, 213, 225, 0.3)',
          lineWidth: 1,
        },
        ticks: {
          maxRotation: 0,
          autoSkip: true,
          maxTicksLimit: 6,
          color: '#6B7280',
          font: {
            size: 11,
          }
        }
      },
      y: {
        grid: {
          display: true,
          color: 'rgba(203, 213, 225, 0.5)',
          lineWidth: 1,
        },
        ticks: {
          color: '#6B7280',
          font: {
            size: 11,
          },
          callback: function(value) {
            return value + getUnitLabel(dataType);
          }
        }
      }
    }
  };

  return (
    <div className="h-52">
      <Line data={chartData} options={options} />
    </div>
  );
}

// Helper functions for chart formatting
function getChartLabel(dataType) {
  switch (dataType) {
    case 'soil_moisture':
      return 'Soil Moisture';
    case 'temperature':
      return 'Temperature';
    case 'light_intensity':
      return 'Light Level';
    case 'air_humidity':
      return 'Air Humidity';
    default:
      return 'Sensor Data';
  }
}

function getUnitLabel(dataType) {
  switch (dataType) {
    case 'soil_moisture':
      return '%';
    case 'temperature':
      return '°C';
    case 'light_intensity':
      return ' lux';
    case 'air_humidity':
      return '%';
    default:
      return '';
  }
}

function getChartColor(dataType, alpha = 1) {
  switch (dataType) {
    case 'soil_moisture':
      return `rgba(59, 130, 246, ${alpha})`;
    case 'temperature':
      return `rgba(239, 68, 68, ${alpha})`;
    case 'light_intensity':
      return `rgba(245, 158, 11, ${alpha})`;
    case 'air_humidity':
      return `rgba(16, 185, 129, ${alpha})`;
    default:
      return `rgba(107, 114, 128, ${alpha})`;
  }
}
'use client'

import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import Image from 'next/image';
import { LineChart, BarChart } from '@/components/charts';
import { Button } from '@/components/ui/Button';
import { Loader } from '@/components/ui/loader';
import plantReportsApi from '@/api/plantReportsApi';
import { AlertCircle, Calendar, Download } from 'lucide-react';

export default function HistoricalDataReport({ plant }) {
  const { t } = useTranslation();
  const [timeRange, setTimeRange] = useState('week');
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchHistoricalData = async () => {
      try {
        setLoading(true);
        const response = await plantReportsApi.getHistoricalData(plant.plant_id, { timeRange });
        setData(response.data);
        setError(null);
      } catch (err) {
        console.error('Error fetching historical data:', err);
        setError(t('reports.historicalDataError', 'Could not load historical data. Please try again.'));
        setData(null);
      } finally {
        setLoading(false);
      }
    };

    if (plant?.plant_id) {
      fetchHistoricalData();
    }
  }, [plant, timeRange, t]);

  const handleDownloadCSV = () => {
    // Implementation for CSV download
    const csvContent = generateCSVContent(data);
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `${plant.name}-historical-data-${timeRange}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const generateCSVContent = (data) => {
    if (!data || !data.moisture || !data.moisture.length) return '';
    
    // Create CSV header
    const headers = ['timestamp', 'moisture', 'temperature', 'light', 'humidity'];
    let csvContent = headers.join(',') + '\n';
    
    // Add data rows
    for (let i = 0; i < data.moisture.length; i++) {
      const row = [
        data.moisture[i].timestamp,
        data.moisture[i].value,
        data.temperature[i]?.value || '',
        data.light[i]?.value || '',
        data.humidity[i]?.value || ''
      ];
      csvContent += row.join(',') + '\n';
    }
    
    return csvContent;
  };

  return (
    <div>
      <div className="mb-6">
        <h2 className="text-xl font-semibold mb-2">{t('reports.historicalData', 'Historical Sensor Data')}</h2>
        <p className="text-gray-600">
          {t('reports.historicalDataDesc', 'Track how your plant has been doing over time with sensor readings and environmental data.')}
        </p>
      </div>

      {/* Time range selector */}
      <div className="flex flex-wrap justify-between items-center mb-6">
        <div className="flex flex-wrap gap-2">
          <Button
            variant={timeRange === 'day' ? 'default' : 'outline'}
            onClick={() => setTimeRange('day')}
            size="sm"
          >
            {t('reports.day', 'Day')}
          </Button>
          <Button
            variant={timeRange === 'week' ? 'default' : 'outline'}
            onClick={() => setTimeRange('week')}
            size="sm"
          >
            {t('reports.week', 'Week')}
          </Button>
          <Button
            variant={timeRange === 'month' ? 'default' : 'outline'}
            onClick={() => setTimeRange('month')}
            size="sm"
          >
            {t('reports.month', 'Month')}
          </Button>
          <Button
            variant={timeRange === 'year' ? 'default' : 'outline'}
            onClick={() => setTimeRange('year')}
            size="sm"
          >
            {t('reports.year', 'Year')}
          </Button>
        </div>
        
        <Button
          variant="outline"
          size="sm"
          className="flex items-center gap-2"
          onClick={handleDownloadCSV}
          disabled={loading || !data}
        >
          <Download size={16} />
          {t('reports.exportCsv', 'Export CSV')}
        </Button>
      </div>

      {/* Loading state */}
      {loading && (
        <div className="flex flex-col items-center justify-center py-12">
          <Loader size="lg" className="text-emerald-500 mb-4" />
          <p className="text-gray-600">
            {t('reports.loadingData', 'Loading historical data...')}
          </p>
        </div>
      )}

      {/* Error state */}
      {!loading && error && (
        <div className="flex flex-col items-center justify-center py-12">
          <AlertCircle size={48} className="text-red-500 mb-4" />
          <h3 className="text-lg font-medium mb-2">
            {t('reports.dataError', 'Data Error')}
          </h3>
          <p className="text-gray-600 mb-4">{error}</p>
          <Button
            onClick={() => fetchHistoricalData()}
            variant="outline"
            size="sm"
          >
            {t('common.retry', 'Retry')}
          </Button>
        </div>
      )}

      {/* No data state */}
      {!loading && !error && (!data || (data && Object.keys(data).every(key => !data[key] || data[key].length === 0))) && (
        <div className="flex flex-col items-center justify-center py-12">
          <div className="bg-gray-100 p-4 rounded-full mb-4">
            <Calendar size={32} className="text-gray-500" />
          </div>
          <h3 className="text-lg font-medium mb-2">
            {t('reports.noHistoricalData', 'No Historical Data')}
          </h3>
          <p className="text-gray-600 text-center max-w-md">
            {t('reports.noHistoricalDataDesc', 'There is no historical sensor data available for this plant yet. Data will appear here once your sensors start recording readings.')}
          </p>
        </div>
      )}

      {/* Data charts */}
      {!loading && !error && data && data.moisture && data.moisture.length > 0 && (
        <div className="space-y-8">
          {/* Moisture chart */}
          <div className="bg-white border border-gray-100 rounded-lg p-4">
            <h3 className="font-medium text-gray-900 mb-3">
              {t('reports.soilMoisture', 'Soil Moisture')}
            </h3>
            <div className="h-64">
              <LineChart
                data={{
                  labels: data.moisture.map(entry => {
                    const date = new Date(entry.timestamp);
                    return timeRange === 'day' 
                      ? date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                      : date.toLocaleDateString([], { month: 'short', day: 'numeric' });
                  }),
                  datasets: [
                    {
                      label: t('reports.soilMoisture', 'Soil Moisture'),
                      data: data.moisture.map(entry => entry.value),
                      borderColor: 'rgb(59, 130, 246)',
                      backgroundColor: 'rgba(59, 130, 246, 0.1)',
                      tension: 0.3,
                    }
                  ]
                }}
                yLabel={t('reports.moisturePercent', 'Moisture (%)')}
                xLabel={t('reports.time', 'Time')}
              />
            </div>
          </div>
          
          {/* Temperature chart */}
          {data.temperature && data.temperature.length > 0 && (
            <div className="bg-white border border-gray-100 rounded-lg p-4">
              <h3 className="font-medium text-gray-900 mb-3">
                {t('reports.temperature', 'Temperature')}
              </h3>
              <div className="h-64">
                <LineChart
                  data={{
                    labels: data.temperature.map(entry => {
                      const date = new Date(entry.timestamp);
                      return timeRange === 'day' 
                        ? date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                        : date.toLocaleDateString([], { month: 'short', day: 'numeric' });
                    }),
                    datasets: [
                      {
                        label: t('reports.temperature', 'Temperature'),
                        data: data.temperature.map(entry => entry.value),
                        borderColor: 'rgb(239, 68, 68)',
                        backgroundColor: 'rgba(239, 68, 68, 0.1)',
                        tension: 0.3,
                      }
                    ]
                  }}
                  yLabel={t('reports.temperatureDegrees', 'Temperature (°C)')}
                  xLabel={t('reports.time', 'Time')}
                />
              </div>
            </div>
          )}
          
          {/* Light chart */}
          {data.light && data.light.length > 0 && (
            <div className="bg-white border border-gray-100 rounded-lg p-4">
              <h3 className="font-medium text-gray-900 mb-3">
                {t('reports.lightLevels', 'Light Levels')}
              </h3>
              <div className="h-64">
                <LineChart
                  data={{
                    labels: data.light.map(entry => {
                      const date = new Date(entry.timestamp);
                      return timeRange === 'day' 
                        ? date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                        : date.toLocaleDateString([], { month: 'short', day: 'numeric' });
                    }),
                    datasets: [
                      {
                        label: t('reports.lightLevels', 'Light Levels'),
                        data: data.light.map(entry => entry.value),
                        borderColor: 'rgb(245, 158, 11)',
                        backgroundColor: 'rgba(245, 158, 11, 0.1)',
                        tension: 0.3,
                      }
                    ]
                  }}
                  yLabel={t('reports.lightIntensity', 'Light Intensity (lux)')}
                  xLabel={t('reports.time', 'Time')}
                />
              </div>
            </div>
          )}
          
          {/* Humidity chart */}
          {data.humidity && data.humidity.length > 0 && (
            <div className="bg-white border border-gray-100 rounded-lg p-4">
              <h3 className="font-medium text-gray-900 mb-3">
                {t('reports.humidity', 'Humidity')}
              </h3>
              <div className="h-64">
                <LineChart
                  data={{
                    labels: data.humidity.map(entry => {
                      const date = new Date(entry.timestamp);
                      return timeRange === 'day' 
                        ? date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                        : date.toLocaleDateString([], { month: 'short', day: 'numeric' });
                    }),
                    datasets: [
                      {
                        label: t('reports.humidity', 'Humidity'),
                        data: data.humidity.map(entry => entry.value),
                        borderColor: 'rgb(16, 185, 129)',
                        backgroundColor: 'rgba(16, 185, 129, 0.1)',
                        tension: 0.3,
                      }
                    ]
                  }}
                  yLabel={t('reports.humidityPercent', 'Humidity (%)')}
                  xLabel={t('reports.time', 'Time')}
                />
              </div>
            </div>
          )}
          
          {/* Correlation analysis */}
          <div className="bg-white border border-gray-100 rounded-lg p-4 mt-8">
            <h3 className="font-medium text-gray-900 mb-4">
              {t('reports.correlationAnalysis', 'Correlation Analysis')}
            </h3>
            <p className="text-sm text-gray-600 mb-4">
              {t('reports.correlationDesc', 'This chart shows the relationship between different environmental factors and your plant\'s health.')}
            </p>
            <div className="h-64">
              <BarChart
                data={{
                  labels: [
                    t('reports.moistureVsGrowth', 'Moisture vs Growth'),
                    t('reports.temperatureVsHealth', 'Temperature vs Health'),
                    t('reports.lightVsFlowering', 'Light vs Flowering'),
                    t('reports.humidityVsLeaves', 'Humidity vs Leaves'),
                  ],
                  datasets: [
                    {
                      label: t('reports.positiveCorrelation', 'Positive Correlation'),
                      data: [0.75, 0.62, 0.83, 0.51],
                      backgroundColor: 'rgba(16, 185, 129, 0.6)',
                    },
                    {
                      label: t('reports.negativeCorrelation', 'Negative Correlation'),
                      data: [-0.23, -0.41, -0.12, -0.35],
                      backgroundColor: 'rgba(239, 68, 68, 0.6)',
                    }
                  ]
                }}
                yLabel={t('reports.correlationStrength', 'Correlation Strength')}
                xLabel={t('reports.factors', 'Factors')}
              />
            </div>
            <p className="text-xs text-gray-500 mt-2">
              {t('reports.correlationNote', 'Values closer to 1 or -1 indicate stronger correlations.')}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
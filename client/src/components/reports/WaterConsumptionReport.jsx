'use client'

import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import Image from 'next/image';
import plantApi from '@/api/plantApi';
import { AreaChart } from '@/components/charts';
import { Loader } from '@/components/ui/loader';
import plantReportsApi from '@/api/plantReportsApi';

export default function WaterConsumptionReport({ plant }) {
  const { t } = useTranslation();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [timeRange, setTimeRange] = useState('month'); // week, month, year
  
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        let response;
        
        if (plant?.plant_id) {
          // Single plant water consumption
          response = await plantReportsApi.getWaterConsumption(plant.plant_id, timeRange);
        } else {
          // Overall water consumption for all plants
          response = await plantReportsApi.getWaterConsumption(null, timeRange);
        }
        
        setData(response.data);
      } catch (err) {
        console.error('Error fetching water consumption data:', err);
        setError(t('reports.waterDataError', 'Could not load water consumption data.'));
      } finally {
        setLoading(false);
      }
    };
    
    fetchData();
  }, [plant, timeRange, t]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-8">
        <Loader size="md" className="text-blue-500 mb-2" />
        <p className="text-gray-500 text-sm">
          {t('reports.loadingWaterData', 'Loading water consumption data...')}
        </p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-8">
        <div className="text-red-500 mb-2">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
        <p className="text-gray-600">{error}</p>
      </div>
    );
  }

  // If we have no water usage data
  if (!data || !data.usage || data.usage.length === 0) {
    return (
      <div className="text-center py-8">
        <div className="bg-blue-50 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.5 12c0-1.232-.046-2.453-.138-3.662a4.006 4.006 0 00-3.7-3.7 48.678 48.678 0 00-7.324 0 4.006 4.006 0 00-3.7 3.7c-.017.22-.032.441-.046.662M19.5 12l3-3m-3 3l-3-3m-12 3c0 1.232.046 2.453.138 3.662a4.006 4.006 0 003.7 3.7 48.656 48.656 0 007.324 0 4.006 4.006 0 003.7-3.7c.017-.22.032-.441.046-.662M4.5 12l3 3m-3-3l-3 3" />
          </svg>
        </div>
        <h3 className="text-lg font-medium text-gray-800 mb-2">
          {t('reports.noWaterData', 'No Water Usage Data Available')}
        </h3>
        <p className="text-gray-600 max-w-md mx-auto">
          {t('reports.noWaterDataDesc', 'There is no water consumption data available for this time period. Data will appear here once your plants are watered.')}
        </p>
        <div className="mt-4 flex justify-center space-x-2">
          {['week', 'month', 'year'].map((range) => (
            <button
              key={range}
              onClick={() => setTimeRange(range)}
              className={`px-3 py-1 rounded-md text-sm ${
                timeRange === range 
                  ? 'bg-blue-600 text-white' 
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {t(`reports.${range}`, range)}
            </button>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-6">
        <h2 className="text-xl font-semibold mb-2">
          {plant 
            ? t('reports.plantWaterUsage', '{{plantName}} Water Usage', { plantName: plant.name }) 
            : t('reports.overallWaterUsage', 'Overall Water Usage')}
        </h2>
        <p className="text-gray-600 mb-4">
          {t('reports.waterUsageDesc', 'Water consumption tracking, comparison to optimal levels, and efficiency analysis.')}
        </p>
        
        <div className="flex flex-wrap gap-2 mb-6">
          {['week', 'month', 'year'].map((range) => (
            <button
              key={range}
              onClick={() => setTimeRange(range)}
              className={`px-4 py-2 rounded-md text-sm font-medium ${
                timeRange === range 
                  ? 'bg-blue-600 text-white' 
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {t(`reports.${range}`, range)}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-100 dark:border-gray-700 p-4">
          <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">
            {t('reports.totalWaterUsed', 'Total Water Used')}
          </h3>
          <div className="flex items-end">
            <span className="text-2xl font-bold text-blue-600 dark:text-blue-400">{data.totalWaterUsed}</span>
            <span className="ml-1 text-gray-600 dark:text-gray-400">L</span>
          </div>
        </div>
        
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-100 dark:border-gray-700 p-4">
          <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">
            {t('reports.averagePerDay', 'Average Per Day')}
          </h3>
          <div className="flex items-end">
            <span className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">{data.averagePerDay}</span>
            <span className="ml-1 text-gray-600 dark:text-gray-400">L</span>
          </div>
        </div>
        
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-100 dark:border-gray-700 p-4">
          <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">
            {t('reports.efficiencyScore', 'Efficiency Score')}
          </h3>
          <div className="flex items-end">
            <span className={`text-2xl font-bold ${
              parseFloat(data.efficiencyScore) > 80 
                ? 'text-emerald-600 dark:text-emerald-400' 
                : parseFloat(data.efficiencyScore) > 50 
                  ? 'text-amber-600 dark:text-amber-400' 
                  : 'text-red-600 dark:text-red-400'
            }`}>{data.efficiencyScore}</span>
            <span className="ml-1 text-gray-600 dark:text-gray-400">%</span>
          </div>
        </div>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-100 dark:border-gray-700 p-4 mb-6">
        <h3 className="font-medium text-gray-900 dark:text-gray-100 mb-4">
          {t('reports.waterUsageOverTime', 'Water Usage Over Time')}
        </h3>
        <div className="h-72">
          <AreaChart 
            data={{
              labels: data.usage.map(entry => entry.date),
              datasets: [
                {
                  label: t('reports.actualWater', 'Actual Water Used'),
                  data: data.usage.map(entry => entry.actual),
                  borderColor: 'rgb(59, 130, 246)',
                  backgroundColor: 'rgba(59, 130, 246, 0.2)',
                  tension: 0.4,
                  fill: true,
                },
                {
                  label: t('reports.recommendedWater', 'Recommended Amount'),
                  data: data.usage.map(entry => entry.recommended),
                  borderColor: 'rgb(16, 185, 129)',
                  backgroundColor: 'rgba(16, 185, 129, 0.05)',
                  borderDashed: [5, 5],
                  tension: 0.4,
                  fill: false,
                }
              ]
            }}
            yLabel={t('reports.waterVolume', 'Water Volume (L)')}
            xLabel={t('reports.date', 'Date')}
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-100 dark:border-gray-700 p-4">
          <h3 className="font-medium text-gray-900 dark:text-gray-100 mb-4">
            {t('reports.wateringFrequency', 'Watering Frequency')}
          </h3>
          <div className="space-y-3">
            {data.frequency.map((item, index) => (
              <div key={index} className="flex items-center">
                <div className="w-32 text-sm text-gray-600 dark:text-gray-400">{item.day}</div>
                <div className="flex-1">
                  <div className="h-4 bg-gray-100 dark:bg-gray-600 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-blue-500 dark:bg-blue-400" 
                      style={{ width: `${item.percentage}%` }}
                    ></div>
                  </div>
                </div>
                <div className="w-12 text-right text-sm font-medium text-gray-900 dark:text-gray-100">{item.percentage}%</div>
              </div>
            ))}
          </div>
        </div>
        
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-100 dark:border-gray-700 p-4">
          <h3 className="font-medium text-gray-900 dark:text-gray-100 mb-4">
            {t('reports.waterEfficiency', 'Water Efficiency')}
          </h3>
          {data.efficiency.map((item, index) => (
            <div key={index} className="mb-4">
              <div className="flex justify-between mb-1">
                <span className="text-sm text-gray-600 dark:text-gray-400">{item.category}</span>
                <span className="text-sm font-medium text-gray-900 dark:text-gray-100">{item.value}%</span>
              </div>
              <div className="h-2 bg-gray-100 dark:bg-gray-600 rounded-full overflow-hidden">
                <div 
                  className={`h-full ${
                    item.value > 80 
                      ? 'bg-emerald-500 dark:bg-emerald-400' 
                      : item.value > 50 
                        ? 'bg-amber-500 dark:bg-amber-400' 
                        : 'bg-red-500 dark:bg-red-400'
                  }`}
                  style={{ width: `${item.value}%` }}
                ></div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-100 dark:border-gray-700 p-4 mb-6">
        <h3 className="font-medium text-gray-900 dark:text-gray-100 mb-4">
          {t('reports.recommendations', 'Water Saving Recommendations')}
        </h3>
        <ul className="space-y-3">
          {data.recommendations.map((recommendation, index) => (
            <li key={index} className="flex">
              <div className="flex-shrink-0 pt-0.5">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-blue-500 dark:text-blue-400 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <span className="text-gray-700 dark:text-gray-300">{recommendation}</span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
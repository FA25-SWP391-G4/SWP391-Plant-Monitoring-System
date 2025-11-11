'use client'

import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { PieChart } from '@/components/charts';
import plantApi from '@/api/plantApi';
import plantReportsApi from '@/api/plantReportsApi';
import { Loader } from '@/components/ui/loader';

export default function PlantDistributionReport() {
  const { t } = useTranslation();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [distributionType, setDistributionType] = useState('species'); // species, location, health, watering
  
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const response = await plantReportsApi.getPlantDistribution();
        setData(response.data);
      } catch (err) {
        console.error('Error fetching distribution data:', err);
        setError(t('reports.distributionError', 'Could not load distribution data.'));
      } finally {
        setLoading(false);
      }
    };
    
    fetchData();
  }, [t]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-8">
        <Loader size="md" className="text-emerald-500 mb-2" />
        <p className="text-gray-500 text-sm">
          {t('reports.loadingDistribution', 'Loading plant distribution data...')}
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

  // If we have no data
  if (!data || Object.keys(data).length === 0) {
    return (
      <div className="text-center py-8">
        <div className="bg-emerald-50 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.5 6a7.5 7.5 0 107.5 7.5h-7.5V6z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.5 10.5H21A7.5 7.5 0 0013.5 3v7.5z" />
          </svg>
        </div>
        <h3 className="text-lg font-medium text-gray-800 mb-2">
          {t('reports.noDistributionData', 'No Distribution Data Available')}
        </h3>
        <p className="text-gray-600 max-w-md mx-auto">
          {t('reports.noDistributionDesc', 'Add more plants to your collection to see distribution statistics.')}
        </p>
      </div>
    );
  }

  const getChartData = () => {
    switch (distributionType) {
      case 'species':
        return {
          labels: data.species.map(item => item.name),
          datasets: [
            {
              data: data.species.map(item => item.count),
              backgroundColor: [
                '#10B981', '#3B82F6', '#F59E0B', '#EF4444', '#8B5CF6',
                '#14B8A6', '#6366F1', '#EC4899', '#06B6D4', '#F97316',
              ],
              borderWidth: 1,
            },
          ],
        };
      case 'location':
        return {
          labels: data.location.map(item => item.name),
          datasets: [
            {
              data: data.location.map(item => item.count),
              backgroundColor: [
                '#3B82F6', '#10B981', '#F59E0B', '#8B5CF6', '#EF4444',
                '#6366F1', '#14B8A6', '#EC4899', '#F97316', '#06B6D4',
              ],
              borderWidth: 1,
            },
          ],
        };
      case 'health':
        return {
          labels: data.health.map(item => item.name),
          datasets: [
            {
              data: data.health.map(item => item.count),
              backgroundColor: [
                '#10B981', // Healthy
                '#F59E0B', // Needs attention
                '#EF4444', // Unhealthy
                '#6B7280', // Unknown
              ],
              borderWidth: 1,
            },
          ],
        };
      case 'watering':
        return {
          labels: data.watering.map(item => item.name),
          datasets: [
            {
              data: data.watering.map(item => item.count),
              backgroundColor: [
                '#3B82F6', // Watered today
                '#10B981', // Well watered
                '#F59E0B', // Needs watering soon
                '#EF4444', // Needs watering now
              ],
              borderWidth: 1,
            },
          ],
        };
      default:
        return {
          labels: [],
          datasets: [{ data: [], backgroundColor: [], borderWidth: 1 }],
        };
    }
  };

  const renderDistributionList = () => {
    const currentData = data[distributionType] || [];
    return (
      <div className="mt-4">
        <ul className="space-y-2">
          {currentData.map((item, index) => (
            <li key={index} className="flex items-center justify-between">
              <div className="flex items-center">
                <span 
                  className="w-3 h-3 rounded-full mr-2"
                  style={{ 
                    backgroundColor: 
                      distributionType === 'species' ? 
                        ['#10B981', '#3B82F6', '#F59E0B', '#EF4444', '#8B5CF6', '#14B8A6', '#6366F1', '#EC4899', '#06B6D4', '#F97316'][index % 10] :
                      distributionType === 'location' ? 
                        ['#3B82F6', '#10B981', '#F59E0B', '#8B5CF6', '#EF4444', '#6366F1', '#14B8A6', '#EC4899', '#F97316', '#06B6D4'][index % 10] :
                      distributionType === 'health' ? 
                        ['#10B981', '#F59E0B', '#EF4444', '#6B7280'][index % 4] :
                        ['#3B82F6', '#10B981', '#F59E0B', '#EF4444'][index % 4]
                  }}
                ></span>
                <span className="text-sm text-gray-700">{item.name}</span>
              </div>
              <div className="flex items-center">
                <span className="text-sm font-medium">{item.count}</span>
                <span className="text-xs text-gray-500 ml-1">
                  ({Math.round((item.count / currentData.reduce((acc, curr) => acc + curr.count, 0)) * 100)}%)
                </span>
              </div>
            </li>
          ))}
        </ul>
      </div>
    );
  };

  return (
    <div>
      <div className="mb-4">
        <div className="flex flex-wrap gap-2 mb-4">
          {[
            { value: 'species', label: t('reports.bySpecies', 'By Species') },
            { value: 'location', label: t('reports.byLocation', 'By Location') },
            { value: 'health', label: t('reports.byHealth', 'By Health') },
            { value: 'watering', label: t('reports.byWatering', 'By Watering') },
          ].map((type) => (
            <button
              key={type.value}
              onClick={() => setDistributionType(type.value)}
              className={`px-3 py-1 rounded-md text-sm ${
                distributionType === type.value 
                  ? 'bg-emerald-600 text-white' 
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {type.label}
            </button>
          ))}
        </div>

        <h3 className="font-medium text-gray-900">
          {t('reports.plantDistribution', 'Plant Distribution')}
          {distributionType === 'species' && ` ${t('reports.bySpecies', 'By Species')}`}
          {distributionType === 'location' && ` ${t('reports.byLocation', 'By Location')}`}
          {distributionType === 'health' && ` ${t('reports.byHealth', 'By Health')}`}
          {distributionType === 'watering' && ` ${t('reports.byWatering', 'By Watering')}`}
        </h3>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <div className="aspect-square">
            <PieChart data={getChartData()} />
          </div>
        </div>
        <div>
          {renderDistributionList()}
          
          <div className="mt-4 p-3 bg-emerald-50 rounded-lg border border-emerald-100">
            <h4 className="font-medium text-emerald-800 mb-1">
              {t('reports.insight', 'Insight')}
            </h4>
            <p className="text-sm text-emerald-700">
              {distributionType === 'species' && t('reports.speciesInsight', 'Your collection is dominated by {{dominant}} species. Consider adding more variety for a balanced garden ecosystem.', { 
                dominant: data.species[0]?.name || t('reports.unknown', 'unknown') 
              })}
              
              {distributionType === 'location' && t('reports.locationInsight', 'Most of your plants are in {{dominant}}. Ensure each location provides appropriate lighting and humidity for the plants there.', { 
                dominant: data.location[0]?.name || t('reports.unknown', 'unknown location') 
              })}
              
              {distributionType === 'health' && t('reports.healthInsight', '{{percentage}}% of your plants are in good health. Regular monitoring and care will help maintain and improve plant health.', { 
                percentage: Math.round((data.health.find(i => i.name === 'Healthy')?.count || 0) / data.health.reduce((acc, curr) => acc + curr.count, 0) * 100) 
              })}
              
              {distributionType === 'watering' && t('reports.wateringInsight', '{{percentage}}% of your plants need watering soon or now. Setting up watering reminders can help maintain an optimal watering schedule.', { 
                percentage: Math.round(((data.watering.find(i => i.name === 'Needs watering soon')?.count || 0) + (data.watering.find(i => i.name === 'Needs watering now')?.count || 0)) / data.watering.reduce((acc, curr) => acc + curr.count, 0) * 100) 
              })}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
'use client'

import { useState, useEffect } from 'react';
import { useAuth } from '@/providers/AuthProvider';
import { useRouter } from 'next/navigation';
import { useTranslation } from 'react-i18next';
import AppLayout from '@/components/layout/AppLayout';
import Link from 'next/link';
import { Card, CardContent } from '@/components/ui/Card';
import { Loader } from '@/components/ui/loader';
import { AlertCircle, FileSpreadsheet, FileBarChart, Camera, Leaf, BarChart as BarChartIcon, Droplets } from 'lucide-react';
import plantApi from '@/api/plantApi';
import reportsApi from '@/api/reportsApi';
import LineChart from '@/components/charts/LineChart';
import BarChart from '@/components/charts/BarChart';
import PieChart from '@/components/charts/PieChart';

// Simple DashboardHeader component
const DashboardHeader = ({ title, description }) => (
  <div className="mb-6">
    <h1 className="text-2xl font-bold text-gray-800 dark:text-white">{title}</h1>
    {description && <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">{description}</p>}
  </div>
);

export default function ReportsPage() {
  const { t } = useTranslation();
  const { user, isLoading: authLoading, isPremium } = useAuth();
  const router = useRouter();
  
  const [reports, setReports] = useState(null);
  const [timeRange, setTimeRange] = useState('week'); // day, week, month, year
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Define report card items
  const reportCards = [
    {
      title: t('reports.historicalData', 'Historical Data'),
      description: t('reports.historicalDataDesc', 'View historical sensor data and trends'),
      icon: <BarChart className="h-10 w-10 text-amber-500" />,
      link: '/reports/historical-data',
      isPremium: false
    },
    {
      title: t('reports.imageAnalysis', 'AI Image Analysis'),
      description: t('reports.imageAnalysisDesc', 'Analyze plant images for health and issues'),
      icon: <Camera className="h-10 w-10 text-indigo-500" />,
      link: '/reports/image-analysis',
      isPremium: true
    },
    {
      title: t('reports.waterConsumption', 'Water Usage'),
      description: t('reports.waterConsumptionDesc', 'Track water consumption patterns'),
      icon: <Droplets className="h-10 w-10 text-blue-500" />,
      link: '/reports/water-consumption',
      isPremium: false
    },
    {
      title: t('reports.plantHealth', 'Plant Health'),
      description: t('reports.plantHealthDesc', 'Monitor overall plant health metrics'),
      icon: <Leaf className="h-10 w-10 text-emerald-500" />,
      link: '/reports/plant-health',
      isPremium: false
    }
  ];

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login');
      return;
    }

    // Check if user is premium, if not redirect to upgrade page
    if (user && user.role !== 'Premium' && user.role !== 'Admin') {
      router.push('/upgrade');
      return;
    }

    const fetchReports = async () => {
      try {
        setLoading(true);
        const reportsData = await reportsApi.getReports(timeRange);
        setReports(reportsData);
        setError(null);
      } catch (err) {
        console.error('Error fetching reports:', err);
        setError(t('reports.errorFetching', 'Failed to fetch reports. Please try again later.'));
        toast.error(t('reports.errorFetching', 'Failed to fetch reports. Please try again later.'));
      } finally {
        setLoading(false);
      }
    };

    if (user && (user.role === 'Premium' || user.role === 'Admin')) {
      fetchReports();
    }
  }, [user, authLoading, router, timeRange, t]);

  // Handle time range change
  const handleTimeRangeChange = (range) => {
    setTimeRange(range);
  };

  return (
    <AppLayout>
      <div className="flex flex-col flex-1 p-4 lg:p-8">
        <DashboardHeader 
          title={t('reports.title', 'Reports & Analytics')} 
          description={t('reports.description', 'Visualize data from your plants and devices')}
        />

        {/* Report Type Cards */}
        <div className="mb-8">
          <h2 className="text-xl font-semibold mb-4">{t('reports.availableReports', 'Available Reports')}</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {reportCards.map((card, index) => (
              <div 
                key={index} 
                className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden hover:shadow-md transition-shadow"
              >
                <div className="p-5">
                  <div className="flex justify-center mb-4">
                    {card.icon}
                  </div>
                  <h3 className="text-lg font-medium mb-2 text-center">{card.title}</h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400 text-center mb-4">
                    {card.description}
                  </p>
                  
                  {card.isPremium && !isPremium ? (
                    <div className="mt-auto">
                      <div className="flex items-center justify-center mb-3 bg-amber-100 dark:bg-amber-900/30 py-2 px-3 rounded-md">
                        <AlertCircle size={16} className="text-amber-600 dark:text-amber-500 mr-2" />
                        <span className="text-amber-700 dark:text-amber-500 text-sm">{t('reports.premiumFeature', 'Premium Feature')}</span>
                      </div>
                      <Link 
                        href="/upgrade"
                        className="block w-full py-2 px-4 bg-amber-500 hover:bg-amber-600 text-white text-center font-medium rounded-md"
                      >
                        {t('common.upgrade', 'Upgrade')}
                      </Link>
                    </div>
                  ) : (
                    <Link 
                      href={card.link}
                      className="block w-full py-2 px-4 bg-blue-600 hover:bg-blue-700 text-white text-center font-medium rounded-md"
                    >
                      {t('common.viewReport', 'View Report')}
                    </Link>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="mb-6 flex justify-between items-center">
          <div className="text-sm font-medium text-gray-700 dark:text-gray-300">
            {t('reports.timeRange', 'Time Range')}:
          </div>
          <div className="flex space-x-2">
            <button
              onClick={() => handleTimeRangeChange('day')}
              className={`px-4 py-2 text-sm rounded-md ${
                timeRange === 'day'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
              }`}
            >
              {t('reports.day', 'Day')}
            </button>
            <button
              onClick={() => handleTimeRangeChange('week')}
              className={`px-4 py-2 text-sm rounded-md ${
                timeRange === 'week'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
              }`}
            >
              {t('reports.week', 'Week')}
            </button>
            <button
              onClick={() => handleTimeRangeChange('month')}
              className={`px-4 py-2 text-sm rounded-md ${
                timeRange === 'month'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
              }`}
            >
              {t('reports.month', 'Month')}
            </button>
            <button
              onClick={() => handleTimeRangeChange('year')}
              className={`px-4 py-2 text-sm rounded-md ${
                timeRange === 'year'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
              }`}
            >
              {t('reports.year', 'Year')}
            </button>
          </div>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
                <div className="animate-pulse flex flex-col space-y-4">
                  <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/4"></div>
                  <div className="h-64 bg-gray-200 dark:bg-gray-700 rounded"></div>
                </div>
              </div>
            ))}
          </div>
        ) : error ? (
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-8 text-center text-red-500">
            {error}
            <button 
              onClick={() => window.location.reload()} 
              className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              {t('common.retry', 'Retry')}
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Moisture Over Time */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
              <h3 className="text-lg font-medium mb-4 text-gray-800 dark:text-gray-100">
                {t('reports.moistureOverTime', 'Soil Moisture Over Time')}
              </h3>
              <LineChart 
                data={reports?.moisture || []} 
                xKey="date" 
                yKey="value" 
                labelKey="name" 
                height={300} 
              />
            </div>

            {/* Temperature & Humidity */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
              <h3 className="text-lg font-medium mb-4 text-gray-800 dark:text-gray-100">
                {t('reports.tempHumidity', 'Temperature & Humidity')}
              </h3>
              <LineChart 
                data={reports?.tempHumidity || []} 
                xKey="date" 
                yKey="value" 
                labelKey="name" 
                height={300} 
                showLegend={true}
              />
            </div>

            {/* Watering History */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
              <h3 className="text-lg font-medium mb-4 text-gray-800 dark:text-gray-100">
                {t('reports.wateringHistory', 'Watering History')}
              </h3>
              <BarChart 
                data={reports?.watering || []} 
                xKey="date" 
                yKey="amount" 
                height={300} 
              />
            </div>

            {/* Plant Health Distribution */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
              <h3 className="text-lg font-medium mb-4 text-gray-800 dark:text-gray-100">
                {t('reports.plantHealth', 'Plant Health Distribution')}
              </h3>
              <PieChart 
                data={reports?.healthDistribution || []} 
                nameKey="status" 
                valueKey="count" 
                height={300} 
              />
            </div>
          </div>
        )}

        {/* Historical Data Table */}
        {!loading && !error && reports?.historicalData && (
          <div className="mt-8 bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden">
            <h3 className="text-lg font-medium p-6 border-b border-gray-200 dark:border-gray-700 text-gray-800 dark:text-gray-100">
              {t('reports.historicalData', 'Historical Data')}
            </h3>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                <thead className="bg-gray-50 dark:bg-gray-900">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      {t('reports.date', 'Date')}
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      {t('reports.plant', 'Plant')}
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      {t('reports.moisture', 'Moisture')}
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      {t('reports.temperature', 'Temperature')}
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      {t('reports.humidity', 'Humidity')}
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      {t('reports.light', 'Light')}
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                  {reports.historicalData.map((record, index) => (
                    <tr key={index}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                        {new Date(record.timestamp).toLocaleString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900 dark:text-gray-100">
                          {record.plant_name}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                        {record.moisture}%
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                        {record.temperature}°C
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                        {record.humidity}%
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                        {record.light} lux
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </AppLayout>
  );
}
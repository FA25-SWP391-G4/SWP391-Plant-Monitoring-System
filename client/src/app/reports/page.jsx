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
import reportApi from '@/api/reportApi';
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
  const { user, isLoading: authLoading } = useAuth();
  const router = useRouter();
  
  const [reports, setReports] = useState(null);
  const [timeRange, setTimeRange] = useState('week'); // day, week, month, year
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // User tier information
  const userRole = user?.role || 'Regular';
  const isPremium = ['Premium', 'Ultimate', 'Admin'].includes(userRole);
  const isUltimate = ['Ultimate', 'Admin'].includes(userRole);
  const isBasic = userRole === 'Regular';

  // Function to check if user has access to a report
  const hasAccess = (reportTier) => {
    switch (reportTier) {
      case 'basic':
        return true; // Everyone has access to basic features
      case 'premium':
        return isPremium; // Premium, Ultimate, and Admin have access
      case 'ultimate':
        return isUltimate; // Only Ultimate and Admin have access
      default:
        return false;
    }
  };

  // Function to get upgrade message based on required tier
  const getUpgradeMessage = (tier) => {
    switch (tier) {
      case 'premium':
        return {
          title: t('reports.premiumRequired', 'Premium Required'),
          message: t('reports.premiumRequiredDesc', 'Upgrade to Premium to access advanced analytics and reports'),
          buttonText: t('reports.upgradeToPremium', 'Upgrade to Premium'),
          price: '15,000₫/month'
        };
      case 'ultimate':
        return {
          title: t('reports.ultimateRequired', 'Ultimate Required'),
          message: t('reports.ultimateRequiredDesc', 'Upgrade to Ultimate to access AI-powered features'),
          buttonText: t('reports.upgradeToUltimate', 'Upgrade to Ultimate'),
          price: '45,000₫/month'
        };
      default:
        return {
          title: t('reports.upgradeRequired', 'Upgrade Required'),
          message: t('reports.upgradeRequiredDesc', 'Upgrade your plan to access this feature'),
          buttonText: t('reports.upgradePlan', 'Upgrade Plan'),
          price: ''
        };
    }
  };

  // Define report card items with proper tier-based access control
  const reportCards = [
    {
      title: t('reports.historicalData', 'Historical Data'),
      description: t('reports.historicalDataDesc', 'View historical sensor data and trends (Basic: 30 days, Premium+: Unlimited)'),
      icon: <BarChartIcon className="h-10 w-10 text-amber-500" />,
      link: '/reports/historical-data',
      tier: 'basic', // Available to all users but with limitations
      limitations: 'Basic users limited to 30 days history',
      category: 'data'
    },
    {
      title: t('reports.plantAnalysis', 'Plant Analysis'),
      description: t('reports.plantAnalysisDesc', 'Basic plant information and status'),
      icon: <Leaf className="h-10 w-10 text-green-500" />,
      link: '/reports/plant-analysis',
      tier: 'basic', // Available to all users
      category: 'analysis'
    },
    {
      title: t('reports.waterConsumption', 'Water Usage Analytics'),
      description: t('reports.waterConsumptionDesc', 'Advanced water consumption patterns and analytics'),
      icon: <Droplets className="h-10 w-10 text-blue-500" />,
      link: '/reports/water-consumption',
      tier: 'premium', // Premium feature
      category: 'monitoring'
    },
    {
      title: t('reports.plantHealth', 'Plant Health Reports'),
      description: t('reports.plantHealthDesc', 'Comprehensive plant health monitoring and wellness metrics'),
      icon: <Leaf className="h-10 w-10 text-emerald-500" />,
      link: '/reports/plant-health',
      tier: 'premium', // Premium feature
      category: 'health'
    },
    {
      title: t('reports.customReports', 'Custom Reports'),
      description: t('reports.customReportsDesc', 'Create personalized reports with custom metrics and data export'),
      icon: <FileBarChart className="h-10 w-10 text-purple-500" />,
      link: '/reports/custom',
      tier: 'premium', // Premium feature
      category: 'custom'
    },
    {
      title: t('reports.imageAnalysis', 'AI Image Analysis'),
      description: t('reports.imageAnalysisDesc', 'AI-powered plant health analysis and disease detection'),
      icon: <Camera className="h-10 w-10 text-indigo-500" />,
      link: '/reports/image-analysis',
      tier: 'ultimate', // Ultimate feature
      category: 'ai'
    }
  ];

  // Group reports by category
  const reportCategories = [
    {
      key: 'data',
      name: t('reports.categories.dataAnalysis', 'Data Analysis'),
      description: t('reports.categories.dataAnalysisDesc', 'Historical data and trends'),
      icon: <BarChartIcon className="h-6 w-6" />
    },
    {
      key: 'monitoring',
      name: t('reports.categories.monitoring', 'Monitoring'),
      description: t('reports.categories.monitoringDesc', 'Real-time monitoring reports'),
      icon: <Droplets className="h-6 w-6" />
    },
    {
      key: 'health',
      name: t('reports.categories.health', 'Health Assessment'),
      description: t('reports.categories.healthDesc', 'Plant health and wellness'),
      icon: <Leaf className="h-6 w-6" />
    },
    {
      key: 'analysis',
      name: t('reports.categories.analysis', 'Analysis'),
      description: t('reports.categories.analysisDesc', 'Detailed plant analysis'),
      icon: <FileBarChart className="h-6 w-6" />
    },
    {
      key: 'ai',
      name: t('reports.categories.ai', 'AI-Powered'),
      description: t('reports.categories.aiDesc', 'AI and machine learning insights'),
      icon: <Camera className="h-6 w-6" />
    },
    {
      key: 'custom',
      name: t('reports.categories.custom', 'Custom'),
      description: t('reports.categories.customDesc', 'Personalized reports'),
      icon: <FileSpreadsheet className="h-6 w-6" />
    }
  ];

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login');
      return;
    }

    // Check if user is premium, if not redirect to upgrade page
    if (user && !isUltimate && !isAdmin ) {
      router.push('/premium');
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
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <main className="container mx-auto px-4 py-8">
        {/* Welcome Banner */}
        <div className="bg-gradient-to-r from-emerald-500 to-emerald-700 dark:from-emerald-600 dark:to-emerald-800 rounded-xl shadow-lg mb-8 p-6 text-white flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="bg-white/20 backdrop-blur-sm p-3 rounded-lg">
              <FileBarChart className="h-8 w-8" />
            </div>
            
            <div>
              <h1 className="text-2xl font-bold mb-2">
                {t('reports.title', 'Reports & Analytics')}
              </h1>
              <p className="opacity-90">
                {t('reports.description', 'Visualize data from your plants and devices')}
              </p>
            </div>
          </div>
        </div>

        {/* Report Categories and Cards */}
        <div className="space-y-8 grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-12">
          {reportCategories.map((category) => {
            const categoryReports = reportCards.filter(card => card.category === category.key);
            if (categoryReports.length === 0) return null;
            
            return (
                <div key={category.key}>
                  {categoryReports.map((card, index) => (
                    <div 
                      key={index} 
                      className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden hover:shadow-md transition-shadow group"
                    >
                      <div className="p-6">
                        <div className="flex justify-center mb-4 group-hover:scale-110 transition-transform">
                          {card.icon}
                        </div>
                        <h3 className="text-lg font-medium mb-2 text-center text-gray-900 dark:text-white">{card.title}</h3>
                        
                        {!hasAccess(card.tier) ? (
                          <div className="mt-auto">
                            {(() => {
                              const upgradeInfo = getUpgradeMessage(card.tier);
                              return (
                                <>
                                  <div className="flex items-center justify-center mb-3 bg-gradient-to-r from-amber-100 to-orange-100 dark:from-amber-900/30 dark:to-orange-900/30 py-2 px-3 rounded-md">
                                    <AlertCircle size={16} className="text-amber-600 dark:text-amber-500 mr-2" />
                                    <span className="text-amber-700 dark:text-amber-500 text-sm font-medium">{upgradeInfo.title}</span>
                                  </div>
                                  <p className="text-xs text-gray-600 dark:text-gray-400 text-center mb-2">
                                    {upgradeInfo.message}
                                  </p>
                                  <p className="text-xs font-semibold text-green-600 dark:text-green-400 text-center mb-3">
                                    {upgradeInfo.price}
                                  </p>
                                  <Link 
                                    href="/pricing"
                                    className={`block w-full py-2 px-4 text-white text-center font-medium rounded-lg transition-colors ${
                                      card.tier === 'ultimate' 
                                        ? 'bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700'
                                        : 'bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600'
                                    }`}
                                  >
                                    {upgradeInfo.buttonText}
                                  </Link>
                                </>
                              );
                            })()}
                          </div>
                        ) : (
                          <div className="mt-auto">
                            {card.limitations && isBasic && card.tier === 'basic' && (
                              <div className="mb-3 p-2 bg-blue-50 dark:bg-blue-900/20 rounded-md">
                                <p className="text-xs text-blue-700 dark:text-blue-300 text-center">
                                  ℹ️ {card.limitations}
                                </p>
                              </div>
                            )}
                            <Link 
                              href={card.link}
                              className="block w-full py-2 px-4 bg-emerald-600 hover:bg-emerald-700 text-white text-center font-medium rounded-lg transition-colors"
                            >
                              {t('common.viewReport', 'View Report')}
                            </Link>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
            );
          })}
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
          <div className="mt-8 bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden">
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
        </main>
      </div>
  );
}
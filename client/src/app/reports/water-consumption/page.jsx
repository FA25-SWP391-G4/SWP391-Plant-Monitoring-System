'use client'

import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '@/providers/AuthProvider';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/Button';
import { Loader } from '@/components/ui/loader';
import { Card, CardContent } from '@/components/ui/Card';
import { 
  Droplets, 
  TrendingDown, 
  TrendingUp, 
  Calendar,
  Download,
  BarChart as BarChartIcon,
  PieChart as PieChartIcon,
  AlertTriangle,
  FileSpreadsheet,
  FileText
} from 'lucide-react';
import plantApi from '@/api/plantApi';
import reportsApi from '@/api/reportsApi';
import LineChart from '@/components/charts/LineChart';
import BarChart from '@/components/charts/BarChart';
import PieChart from '@/components/charts/PieChart';
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import 'jspdf-autotable';

export default function WaterConsumptionPage() {
  const { t } = useTranslation();
  const { user, isLoading: authLoading } = useAuth();
  const router = useRouter();
  
  const [plants, setPlants] = useState([]);
  const [waterData, setWaterData] = useState(null);
  const [timeRange, setTimeRange] = useState('month');
  const [selectedPlant, setSelectedPlant] = useState('all');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Time range options
  const timeRanges = [
    { key: 'week', label: t('reports.lastWeek', 'Last Week') },
    { key: 'month', label: t('reports.lastMonth', 'Last Month') },
    { key: 'quarter', label: t('reports.lastQuarter', 'Last Quarter') },
    { key: 'year', label: t('reports.lastYear', 'Last Year') }
  ];

  // Redirect if not authenticated
  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login');
    }
  }, [authLoading, user, router]);

  // User tier information
  const userRole = user?.role || 'Regular';
  const isPremium = ['Premium', 'Ultimate', 'Admin'].includes(userRole);
  const isUltimate = ['Ultimate', 'Admin'].includes(userRole);
  const isBasic = userRole === 'Regular';

  // Check Premium access
  useEffect(() => {
    if (user && !isPremium) {
      // For Basic users, show upgrade prompt instead of redirecting
      setError(null);
    }
  }, [user, isPremium]);

  // Fetch plants on component mount
  useEffect(() => {
    const fetchPlants = async () => {
      try {
        const response = await plantApi.getAll();
        setPlants(response.data || []);
      } catch (err) {
        console.error('Error fetching plants:', err);
        setError(t('reports.errorLoadingPlants', 'Error loading plants'));
      }
    };

    if (user && isPremium) {
      fetchPlants();
    }
  }, [user, isPremium, t]);

  // Fetch water consumption data
  useEffect(() => {
    if (user && isPremium) {
      fetchWaterData();
    }
  }, [user, isPremium, timeRange, selectedPlant]);

  const fetchWaterData = async () => {
    setLoading(true);
    setError(null);

    try {
      const data = await reportsApi.getWaterConsumption(timeRange, selectedPlant);
      setWaterData(data);
    } catch (err) {
      console.error('Error fetching water data:', err);
      setError(t('reports.errorFetchingData', 'Error fetching water consumption data'));
      
      // Mock data for development
      if (process.env.NODE_ENV === 'development') {
        setWaterData(generateMockWaterData());
      }
    } finally {
      setLoading(false);
    }
  };

  // Generate mock data for development
  const generateMockWaterData = () => {
    const days = 30;
    const dailyData = [];
    const plantData = [];
    
    for (let i = days; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      
      dailyData.push({
        date: date.toISOString().split('T')[0],
        amount: Math.random() * 2 + 0.5,
        sessions: Math.floor(Math.random() * 4) + 1
      });
    }

    plants.forEach((plant, index) => {
      plantData.push({
        plantName: plant.name,
        totalWater: Math.random() * 20 + 10,
        sessions: Math.floor(Math.random() * 15) + 5,
        efficiency: Math.random() * 20 + 80
      });
    });

    return {
      summary: {
        totalWater: dailyData.reduce((sum, day) => sum + day.amount, 0),
        totalSessions: dailyData.reduce((sum, day) => sum + day.sessions, 0),
        avgDaily: dailyData.reduce((sum, day) => sum + day.amount, 0) / days,
        trend: Math.random() > 0.5 ? 'up' : 'down',
        trendValue: Math.random() * 15 + 5
      },
      dailyData,
      plantData,
      hourlyPattern: Array.from({length: 24}, (_, i) => ({
        hour: i,
        sessions: Math.floor(Math.random() * 5),
        amount: Math.random() * 1.5
      }))
    };
  };

  // Export to Excel
  const exportToExcel = () => {
    if (!waterData) return;

    const workbook = XLSX.utils.book_new();
    
    // Summary sheet
    const summaryWs = XLSX.utils.json_to_sheet([waterData.summary]);
    XLSX.utils.book_append_sheet(workbook, summaryWs, 'Summary');
    
    // Daily data sheet
    const dailyWs = XLSX.utils.json_to_sheet(waterData.dailyData);
    XLSX.utils.book_append_sheet(workbook, dailyWs, 'Daily Data');
    
    // Plant data sheet
    const plantWs = XLSX.utils.json_to_sheet(waterData.plantData);
    XLSX.utils.book_append_sheet(workbook, plantWs, 'Plant Data');
    
    const fileName = `water_consumption_${timeRange}_${new Date().toISOString().split('T')[0]}.xlsx`;
    XLSX.writeFile(workbook, fileName);
  };

  // Export to PDF
  const exportToPDF = () => {
    if (!waterData) return;

    const doc = new jsPDF();
    
    // Title
    doc.setFontSize(20);
    doc.text('Water Consumption Report', 20, 20);
    
    // Summary
    doc.setFontSize(12);
    doc.text(`Time Range: ${timeRanges.find(tr => tr.key === timeRange)?.label}`, 20, 35);
    doc.text(`Total Water Used: ${waterData.summary.totalWater.toFixed(2)} L`, 20, 45);
    doc.text(`Total Sessions: ${waterData.summary.totalSessions}`, 20, 55);
    doc.text(`Average Daily: ${waterData.summary.avgDaily.toFixed(2)} L`, 20, 65);
    
    // Daily data table
    const headers = ['Date', 'Amount (L)', 'Sessions'];
    const rows = waterData.dailyData.map(row => [
      row.date,
      row.amount.toFixed(2),
      row.sessions
    ]);
    
    doc.autoTable({
      head: [headers],
      body: rows,
      startY: 75,
      styles: { fontSize: 8 }
    });
    
    const fileName = `water_consumption_${timeRange}.pdf`;
    doc.save(fileName);
  };

  // Calculate efficiency score
  const getEfficiencyColor = (efficiency) => {
    if (efficiency >= 90) return 'text-green-600';
    if (efficiency >= 75) return 'text-yellow-600';
    return 'text-red-600';
  };

  if (authLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader size="lg" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            {t('reports.waterConsumption', 'Water Consumption')}
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            {t('reports.waterConsumptionDesc', 'Monitor and analyze water usage patterns')}
          </p>
        </div>
        
        {waterData && isPremium && (
          <div className="flex gap-2">
            <Button
              onClick={exportToExcel}
              variant="outline"
              className="flex items-center gap-2"
            >
              <FileSpreadsheet className="w-4 h-4" />
              {t('reports.exportExcel', 'Export Excel')}
            </Button>
            <Button
              onClick={exportToPDF}
              variant="outline"
              className="flex items-center gap-2"
            >
              <FileText className="w-4 h-4" />
              {t('reports.exportPDF', 'Export PDF')}
            </Button>
          </div>
        )}
      </div>

      {/* Premium Access Gate for Basic Users */}
      {isBasic ? (
        <Card>
          <CardContent className="p-8 text-center">
            <div className="bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-blue-900/20 dark:to-indigo-900/30 rounded-full w-24 h-24 flex items-center justify-center mx-auto mb-6">
              <Droplets className="w-12 h-12 text-blue-600 dark:text-blue-400" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
              {t('reports.premiumRequired', 'Premium Feature')}
            </h2>
            <p className="text-gray-600 dark:text-gray-400 mb-6 max-w-md mx-auto">
              {t('reports.waterConsumptionPremiumDesc', 'Advanced water consumption analytics are available with Premium subscription. Track usage patterns, get detailed insights, and export your data.')}
            </p>
            
            <div className="bg-white dark:bg-gray-800 rounded-lg p-6 mb-6 max-w-md mx-auto border">
              <div className="text-left space-y-2">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  <span className="text-sm text-gray-700 dark:text-gray-300">Unlimited water usage tracking</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  <span className="text-sm text-gray-700 dark:text-gray-300">Advanced analytics & reports</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  <span className="text-sm text-gray-700 dark:text-gray-300">Data export (CSV, PDF)</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  <span className="text-sm text-gray-700 dark:text-gray-300">Automated watering schedules</span>
                </div>
              </div>
            </div>

            <div className="space-y-3">
              <Link
                href="/pricing"
                className="inline-block px-8 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-semibold rounded-lg transition-colors"
              >
                {t('reports.upgradeToPremium', 'Upgrade to Premium')} - 15,000₫/month
              </Link>
              <p className="text-xs text-gray-500">
                {t('reports.lifetimeOption', 'Or get lifetime access for 299,000₫')}
              </p>
            </div>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Time Range Selection */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                {t('reports.timeRange', 'Time Range')}
              </label>
              <select
                value={timeRange}
                onChange={(e) => setTimeRange(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 dark:bg-gray-800 dark:border-gray-600"
              >
                {timeRanges.map((range) => (
                  <option key={range.key} value={range.key}>
                    {range.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Plant Selection */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                {t('reports.filterByPlant', 'Filter by Plant')}
              </label>
              <select
                value={selectedPlant}
                onChange={(e) => setSelectedPlant(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 dark:bg-gray-800 dark:border-gray-600"
              >
                <option value="all">{t('reports.allPlants', 'All Plants')}</option>
                {plants.map((plant) => (
                  <option key={plant.id} value={plant.id}>
                    {plant.name}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </CardContent>
      </Card>
      )}

      {/* Content */}
      {loading ? (
        <Card>
          <CardContent className="p-8 text-center">
            <Loader size="lg" />
            <p className="mt-4 text-gray-600 dark:text-gray-400">
              {t('reports.loadingData', 'Loading water consumption data...')}
            </p>
          </CardContent>
        </Card>
      ) : error ? (
        <Card>
          <CardContent className="p-8 text-center">
            <AlertTriangle className="w-12 h-12 text-red-500 mx-auto mb-4" />
            <p className="text-red-600 dark:text-red-400">{error}</p>
            <Button onClick={fetchWaterData} className="mt-4">
              {t('common.retry', 'Retry')}
            </Button>
          </CardContent>
        </Card>
      ) : waterData ? (
        <div className="space-y-6">
          {/* Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                      {t('reports.totalWaterUsed', 'Total Water Used')}
                    </p>
                    <p className="text-2xl font-bold text-gray-900 dark:text-white">
                      {waterData.summary.totalWater.toFixed(1)} L
                    </p>
                  </div>
                  <Droplets className="h-8 w-8 text-blue-500" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                      {t('reports.wateringSessions', 'Watering Sessions')}
                    </p>
                    <p className="text-2xl font-bold text-gray-900 dark:text-white">
                      {waterData.summary.totalSessions}
                    </p>
                  </div>
                  <Calendar className="h-8 w-8 text-green-500" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                      {t('reports.avgDaily', 'Average Daily')}
                    </p>
                    <p className="text-2xl font-bold text-gray-900 dark:text-white">
                      {waterData.summary.avgDaily.toFixed(1)} L
                    </p>
                  </div>
                  <BarChartIcon className="h-8 w-8 text-purple-500" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                      {t('reports.trend', 'Trend')}
                    </p>
                    <div className="flex items-center gap-1">
                      <span className="text-2xl font-bold text-gray-900 dark:text-white">
                        {waterData.summary.trendValue.toFixed(1)}%
                      </span>
                      {waterData.summary.trend === 'up' ? (
                        <TrendingUp className="h-5 w-5 text-red-500" />
                      ) : (
                        <TrendingDown className="h-5 w-5 text-green-500" />
                      )}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Charts */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Daily Usage Trend */}
            <Card>
              <CardContent className="p-6">
                <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                  <Droplets className="w-5 h-5 text-blue-500" />
                  {t('reports.dailyUsageTrend', 'Daily Usage Trend')}
                </h3>
                <LineChart 
                  data={waterData.dailyData}
                  xKey="date"
                  yKey="amount"
                  height={300}
                />
              </CardContent>
            </Card>

            {/* Plant Consumption Distribution */}
            <Card>
              <CardContent className="p-6">
                <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                  <PieChartIcon className="w-5 h-5 text-green-500" />
                  {t('reports.plantDistribution', 'Plant Distribution')}
                </h3>
                <PieChart 
                  data={waterData.plantData}
                  dataKey="totalWater"
                  nameKey="plantName"
                  height={300}
                />
              </CardContent>
            </Card>

            {/* Hourly Pattern */}
            <Card>
              <CardContent className="p-6">
                <h3 className="text-lg font-semibold mb-4">
                  {t('reports.hourlyPattern', 'Hourly Pattern')}
                </h3>
                <BarChart 
                  data={waterData.hourlyPattern}
                  xKey="hour"
                  yKey="amount"
                  height={300}
                />
              </CardContent>
            </Card>

            {/* Efficiency Metrics */}
            <Card>
              <CardContent className="p-6">
                <h3 className="text-lg font-semibold mb-4">
                  {t('reports.plantEfficiency', 'Plant Efficiency')}
                </h3>
                <div className="space-y-3">
                  {waterData.plantData.map((plant, index) => (
                    <div key={index} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                      <span className="font-medium">{plant.plantName}</span>
                      <div className="text-right">
                        <div className={`text-lg font-bold ${getEfficiencyColor(plant.efficiency)}`}>
                          {plant.efficiency.toFixed(1)}%
                        </div>
                        <div className="text-xs text-gray-500">
                          {plant.totalWater.toFixed(1)}L / {plant.sessions} sessions
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Recent Sessions Table */}
          <Card>
            <CardContent className="p-6">
              <h3 className="text-lg font-semibold mb-4">
                {t('reports.recentSessions', 'Recent Watering Sessions')}
              </h3>
              <div className="overflow-x-auto">
                <table className="w-full table-auto">
                  <thead>
                    <tr className="border-b dark:border-gray-700">
                      <th className="text-left p-2 font-medium text-gray-600 dark:text-gray-400">
                        {t('reports.date', 'Date')}
                      </th>
                      <th className="text-left p-2 font-medium text-gray-600 dark:text-gray-400">
                        {t('reports.amount', 'Amount (L)')}
                      </th>
                      <th className="text-left p-2 font-medium text-gray-600 dark:text-gray-400">
                        {t('reports.sessions', 'Sessions')}
                      </th>
                      <th className="text-left p-2 font-medium text-gray-600 dark:text-gray-400">
                        {t('reports.avgPerSession', 'Avg/Session')}
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {waterData.dailyData.slice(-7).reverse().map((day, index) => (
                      <tr key={index} className="border-b dark:border-gray-700">
                        <td className="p-2 text-sm">
                          {new Date(day.date).toLocaleDateString()}
                        </td>
                        <td className="p-2 text-sm">
                          {day.amount.toFixed(2)}
                        </td>
                        <td className="p-2 text-sm">
                          {day.sessions}
                        </td>
                        <td className="p-2 text-sm">
                          {(day.amount / day.sessions).toFixed(2)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </div>
      ) : null}
    </div>
  );
}
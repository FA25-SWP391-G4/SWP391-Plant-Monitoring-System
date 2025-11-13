'use client'

import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '@/providers/AuthProvider';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/Button';
import { Loader } from '@/components/ui/loader';
import { Card, CardContent } from '@/components/ui/Card';
import { 
  Calendar, 
  Download, 
  Filter,
  TrendingUp,
  Droplets,
  Thermometer,
  Cloud,
  Sun,
  AlertTriangle,
  FileSpreadsheet,
  FileText
} from 'lucide-react';
import plantApi from '@/api/plantApi';
import reportsApi from '@/api/reportsApi';
import LineChart from '@/components/charts/LineChart';
import AreaChart from '@/components/charts/AreaChart';
import BarChart from '@/components/charts/BarChart';
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import 'jspdf-autotable';

export default function HistoricalDataPage() {
  const { t } = useTranslation();
  const { user, isLoading: authLoading } = useAuth();
  const router = useRouter();
  
  const [plants, setPlants] = useState([]);
  const [selectedPlant, setSelectedPlant] = useState('');
  const [timeRange, setTimeRange] = useState('week');
  const [selectedMetrics, setSelectedMetrics] = useState(['moisture', 'temperature']);
  const [historicalData, setHistoricalData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // User tier information
  const userRole = user?.role || 'Regular';
  const isPremium = ['Premium', 'Ultimate', 'Admin'].includes(userRole);
  const isUltimate = ['Ultimate', 'Admin'].includes(userRole);
  const isBasic = userRole === 'Regular';

  // Time range limitations based on user tier
  const getTimeRangeOptions = () => {
    const allRanges = [
      { key: 'day', label: t('reports.lastDay', 'Last 24 Hours') },
      { key: 'week', label: t('reports.lastWeek', 'Last Week') },
      { key: 'month', label: t('reports.lastMonth', 'Last Month') },
      { key: 'quarter', label: t('reports.lastQuarter', 'Last Quarter') },
      { key: 'year', label: t('reports.lastYear', 'Last Year') }
    ];

    // Basic users are limited to 30 days (day, week, month only)
    if (isBasic) {
      return allRanges.filter(range => ['day', 'week', 'month'].includes(range.key));
    }
    
    return allRanges;
  };

  const timeRanges = getTimeRangeOptions();

  // Available metrics
  const availableMetrics = [
    { key: 'moisture', label: t('reports.moisture', 'Soil Moisture'), icon: <Droplets className="w-4 h-4" />, color: '#3b82f6', unit: '%' },
    { key: 'temperature', label: t('reports.temperature', 'Temperature'), icon: <Thermometer className="w-4 h-4" />, color: '#ef4444', unit: '°C' },
    { key: 'humidity', label: t('reports.humidity', 'Humidity'), icon: <Cloud className="w-4 h-4" />, color: '#10b981', unit: '%' },
    { key: 'light', label: t('reports.light', 'Light Level'), icon: <Sun className="w-4 h-4" />, color: '#f59e0b', unit: 'lux' }
  ];

  // Redirect if not authenticated
  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login');
    }
  }, [authLoading, user, router]);

  // Fetch plants on component mount
  useEffect(() => {
    const fetchPlants = async () => {
      try {
        const response = await plantApi.getAll();
        setPlants(response.data || []);
        
        // Auto-select first plant if available
        if (response.data && response.data.length > 0) {
          setSelectedPlant(response.data[0].id.toString());
        }
      } catch (err) {
        console.error('Error fetching plants:', err);
        setError(t('reports.errorLoadingPlants', 'Error loading plants'));
      }
    };

    if (user) {
      fetchPlants();
    }
  }, [user, t]);

  // Fetch historical data when filters change
  useEffect(() => {
    if (selectedPlant && selectedMetrics.length > 0) {
      fetchHistoricalData();
    }
  }, [selectedPlant, timeRange, selectedMetrics]);

  const fetchHistoricalData = async () => {
    if (!selectedPlant) return;

    setLoading(true);
    setError(null);

    try {
      const data = await reportsApi.getHistoricalData(
        parseInt(selectedPlant),
        timeRange,
        selectedMetrics
      );
      setHistoricalData(data);
    } catch (err) {
      console.error('Error fetching historical data:', err);
      setError(t('reports.errorFetchingData', 'Error fetching historical data'));
    } finally {
      setLoading(false);
    }
  };

  // Handle metric selection
  const handleMetricToggle = (metricKey) => {
    setSelectedMetrics(prev => 
      prev.includes(metricKey)
        ? prev.filter(m => m !== metricKey)
        : [...prev, metricKey]
    );
  };

  // Export to Excel
  const exportToExcel = () => {
    if (!historicalData || !historicalData.data) return;

    const worksheet = XLSX.utils.json_to_sheet(historicalData.data);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Historical Data');
    
    const fileName = `plant_${selectedPlant}_historical_data_${timeRange}.xlsx`;
    XLSX.writeFile(workbook, fileName);
  };

  // Export to PDF
  const exportToPDF = () => {
    if (!historicalData || !historicalData.data) return;

    const doc = new jsPDF();
    const selectedPlantData = plants.find(p => p.id.toString() === selectedPlant);
    
    // Add title
    doc.setFontSize(20);
    doc.text('Historical Data Report', 20, 20);
    
    // Add plant info
    doc.setFontSize(12);
    doc.text(`Plant: ${selectedPlantData?.name || 'Unknown'}`, 20, 35);
    doc.text(`Time Range: ${timeRanges.find(tr => tr.key === timeRange)?.label}`, 20, 45);
    doc.text(`Metrics: ${selectedMetrics.join(', ')}`, 20, 55);
    doc.text(`Generated: ${new Date().toLocaleDateString()}`, 20, 65);
    
    // Add data table
    const headers = ['Date', ...selectedMetrics];
    const rows = historicalData.data.map(row => [
      new Date(row.timestamp).toLocaleDateString(),
      ...selectedMetrics.map(metric => row[metric] || 'N/A')
    ]);
    
    doc.autoTable({
      head: [headers],
      body: rows,
      startY: 75,
      styles: { fontSize: 8 }
    });
    
    const fileName = `plant_${selectedPlant}_historical_data_${timeRange}.pdf`;
    doc.save(fileName);
  };

  // Calculate summary statistics
  const getSummaryStats = (data, metric) => {
    if (!data || !data.length) return null;
    
    const values = data.map(d => d[metric]).filter(v => v !== null && v !== undefined);
    if (!values.length) return null;
    
    return {
      min: Math.min(...values),
      max: Math.max(...values),
      avg: values.reduce((a, b) => a + b, 0) / values.length,
      latest: values[values.length - 1]
    };
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
              {t('reports.historicalData', 'Historical Data')}
            </h1>
            <p className="text-gray-600 dark:text-gray-400 mt-1">
              {t('reports.historicalDataDesc', 'View and analyze historical sensor data trends')}
            </p>
          </div>
          
          {historicalData && (
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

        {/* Tier Limitation Notice for Basic Users */}
        {isBasic && (
          <div className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 dark:bg-blue-800/30 rounded-lg">
                <AlertTriangle className="w-5 h-5 text-blue-600" />
              </div>
              <div className="flex-1">
                <h3 className="font-medium text-blue-900 dark:text-blue-100">
                  {t('reports.basicPlanLimitations', 'Basic Plan Limitations')}
                </h3>
                <p className="text-sm text-blue-700 dark:text-blue-300">
                  {t('reports.basicHistoryLimit', 'You have access to 30 days of data history. Upgrade to Premium for unlimited historical data and advanced analytics.')}
                </p>
              </div>
              <Link
                href="/pricing"
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg transition-colors"
              >
                {t('reports.upgradeToPremium', 'Upgrade to Premium')}
              </Link>
            </div>
          </div>
        )}      {/* Filters */}
      <Card>
        <CardContent className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Plant Selection */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                {t('reports.selectPlant', 'Select Plant')}
              </label>
              <select
                value={selectedPlant}
                onChange={(e) => setSelectedPlant(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 dark:bg-gray-800 dark:border-gray-600"
              >
                <option value="">{t('reports.choosePlant', 'Choose a plant...')}</option>
                {plants.map((plant) => (
                  <option key={plant.id} value={plant.id}>
                    {plant.name} ({plant.type})
                  </option>
                ))}
              </select>
            </div>

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

            {/* Metrics Selection */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                {t('reports.metrics', 'Metrics')}
              </label>
              <div className="flex flex-wrap gap-2">
                {availableMetrics.map((metric) => (
                  <button
                    key={metric.key}
                    onClick={() => handleMetricToggle(metric.key)}
                    className={`flex items-center gap-1 px-3 py-1 rounded-full text-sm transition-colors ${
                      selectedMetrics.includes(metric.key)
                        ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-400'
                    }`}
                  >
                    {metric.icon}
                    {metric.label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Content */}
      {loading ? (
        <Card>
          <CardContent className="p-8 text-center">
            <Loader size="lg" />
            <p className="mt-4 text-gray-600 dark:text-gray-400">
              {t('reports.loadingData', 'Loading historical data...')}
            </p>
          </CardContent>
        </Card>
      ) : error ? (
        <Card>
          <CardContent className="p-8 text-center">
            <AlertTriangle className="w-12 h-12 text-red-500 mx-auto mb-4" />
            <p className="text-red-600 dark:text-red-400">{error}</p>
            <Button onClick={fetchHistoricalData} className="mt-4">
              {t('common.retry', 'Retry')}
            </Button>
          </CardContent>
        </Card>
      ) : !selectedPlant ? (
        <Card>
          <CardContent className="p-8 text-center">
            <Filter className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600 dark:text-gray-400">
              {t('reports.selectPlantPrompt', 'Please select a plant to view historical data')}
            </p>
          </CardContent>
        </Card>
      ) : historicalData ? (
        <div className="space-y-6">
          {/* Summary Statistics */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {selectedMetrics.map((metricKey) => {
              const metric = availableMetrics.find(m => m.key === metricKey);
              const stats = getSummaryStats(historicalData.data, metricKey);
              
              if (!metric || !stats) return null;
              
              return (
                <Card key={metricKey}>
                  <CardContent className="p-4">
                    <div className="flex items-center gap-2 mb-2">
                      {metric.icon}
                      <h3 className="font-medium text-sm">{metric.label}</h3>
                    </div>
                    <div className="space-y-1">
                      <div className="flex justify-between text-xs">
                        <span className="text-gray-500">Latest:</span>
                        <span className="font-medium">{stats.latest.toFixed(1)} {metric.unit}</span>
                      </div>
                      <div className="flex justify-between text-xs">
                        <span className="text-gray-500">Avg:</span>
                        <span className="font-medium">{stats.avg.toFixed(1)} {metric.unit}</span>
                      </div>
                      <div className="flex justify-between text-xs">
                        <span className="text-gray-500">Range:</span>
                        <span className="font-medium">{stats.min.toFixed(1)} - {stats.max.toFixed(1)} {metric.unit}</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>

          {/* Charts */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Line Chart - Trends over time */}
            <Card>
              <CardContent className="p-6">
                <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                  <TrendingUp className="w-5 h-5" />
                  {t('reports.trendsOverTime', 'Trends Over Time')}
                </h3>
                <LineChart 
                  data={historicalData.data}
                  xKey="timestamp"
                  height={300}
                  showLegend={true}
                />
              </CardContent>
            </Card>

            {/* Area Chart - Distribution */}
            <Card>
              <CardContent className="p-6">
                <h3 className="text-lg font-semibold mb-4">
                  {t('reports.dataDistribution', 'Data Distribution')}
                </h3>
                <AreaChart 
                  data={historicalData.data}
                  xKey="timestamp"
                  yKeys={selectedMetrics}
                  height={300}
                />
              </CardContent>
            </Card>
          </div>

          {/* Recent Data Table */}
          <Card>
            <CardContent className="p-6">
              <h3 className="text-lg font-semibold mb-4">
                {t('reports.recentReadings', 'Recent Readings')}
              </h3>
              <div className="overflow-x-auto">
                <table className="w-full table-auto">
                  <thead>
                    <tr className="border-b dark:border-gray-700">
                      <th className="text-left p-2 font-medium text-gray-600 dark:text-gray-400">
                        {t('reports.timestamp', 'Timestamp')}
                      </th>
                      {selectedMetrics.map(metricKey => {
                        const metric = availableMetrics.find(m => m.key === metricKey);
                        return (
                          <th key={metricKey} className="text-left p-2 font-medium text-gray-600 dark:text-gray-400">
                            {metric?.label} ({metric?.unit})
                          </th>
                        );
                      })}
                    </tr>
                  </thead>
                  <tbody>
                    {historicalData.data.slice(-10).reverse().map((reading, index) => (
                      <tr key={index} className="border-b dark:border-gray-700">
                        <td className="p-2 text-sm">
                          {new Date(reading.timestamp).toLocaleString()}
                        </td>
                        {selectedMetrics.map(metricKey => (
                          <td key={metricKey} className="p-2 text-sm">
                            {reading[metricKey] ? reading[metricKey].toFixed(1) : 'N/A'}
                          </td>
                        ))}
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
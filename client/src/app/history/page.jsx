'use client'

import { useState, useEffect } from 'react';
import { useAuth } from '@/providers/AuthProvider';
import { useRouter } from 'next/navigation';
import { useTranslation } from 'react-i18next';
import { useTheme } from '@/contexts/ThemeContext';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/Select';
import { Calendar, Filter, Download, TrendingUp, Droplets, Thermometer, Sun, Wind } from 'lucide-react';
import axiosClient from '@/api/axiosClient';
// Simple date utilities instead of date-fns
const formatDate = (date, formatStr = 'yyyy-MM-dd') => {
  const d = new Date(date);
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  const hours = String(d.getHours()).padStart(2, '0');
  const minutes = String(d.getMinutes()).padStart(2, '0');
  const seconds = String(d.getSeconds()).padStart(2, '0');
  
  if (formatStr === 'yyyy-MM-dd') return `${year}-${month}-${day}`;
  if (formatStr === 'MMM dd HH:mm') return d.toLocaleDateString('en-US', { month: 'short', day: '2-digit' }) + ` ${hours}:${minutes}`;
  if (formatStr === 'MMM dd, yyyy HH:mm:ss') return d.toLocaleDateString('en-US', { month: 'short', day: '2-digit', year: 'numeric' }) + ` ${hours}:${minutes}:${seconds}`;
  return d.toISOString();
};

const subDays = (date, days) => {
  const result = new Date(date);
  result.setDate(result.getDate() - days);
  return result;
};
import { SimpleLineChart } from '@/components/charts/SimpleLineChart';

export default function HistoryPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const { t } = useTranslation();
  const { isDark, getThemeColor } = useTheme();

  // State management
  const [historyData, setHistoryData] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [devices, setDevices] = useState([]);
  
  // Filter state
  const [filters, setFilters] = useState({
    device_key: '',
    start_date: formatDate(subDays(new Date(), 7), 'yyyy-MM-dd'),
    end_date: formatDate(new Date(), 'yyyy-MM-dd')
  });
  
  // Pagination state
  const [pagination, setPagination] = useState({
    currentPage: 1,
    totalPages: 1,
    totalRecords: 0,
    limit: 50
  });

  // Chart data state
  const [chartData, setChartData] = useState([]);
  const [selectedMetrics, setSelectedMetrics] = useState(['moisture', 'temperature']);

  // Redirect if not authenticated
  useEffect(() => {
    if (!loading && !user) {
      router.push('/login');
    }
  }, [user, loading, router]);

  // Fetch devices for filter dropdown
  useEffect(() => {
    const fetchDevices = async () => {
      try {
        const response = await axiosClient.get('/api/plants');
        if (response.data && Array.isArray(response.data)) {
          // Extract unique devices from plants data
          const uniqueDevices = response.data
            .filter(plant => plant.device_key)
            .map(plant => ({
              device_key: plant.device_key,
              device_name: plant.device_name || `Device ${plant.device_key}`,
              plant_name: plant.name
            }))
            .filter((device, index, self) => 
              index === self.findIndex(d => d.device_key === device.device_key)
            );
          setDevices(uniqueDevices);
        }
      } catch (error) {
        console.error('Error fetching devices:', error);
      }
    };

    if (user) {
      fetchDevices();
    }
  }, [user]);

  // Fetch history data
  const fetchHistoryData = async (page = 1) => {
    try {
      setIsLoading(true);
      setError(null);

      const params = new URLSearchParams({
        page: page.toString(),
        limit: pagination.limit.toString(),
        ...Object.fromEntries(
          Object.entries(filters).filter(([_, value]) => value !== '')
        )
      });

      const response = await axiosClient.get(`/api/sensor/history?${params}`);
      
      if (response.data.success) {
        setHistoryData(response.data.data);
        setPagination(response.data.pagination);
        
        // Process data for charts
        const processedChartData = processDataForCharts(response.data.data);
        setChartData(processedChartData);
      } else {
        setError(response.data.message || 'Failed to fetch history data');
      }
    } catch (error) {
      console.error('Error fetching history data:', error);
      setError('Failed to load sensor history. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  // Process data for chart visualization
  const processDataForCharts = (data) => {
    return data.map(item => ({
      timestamp: formatDate(item.timestamp, 'MMM dd HH:mm'),
      fullTimestamp: item.timestamp,
      moisture: item.moisture,
      temperature: item.temperature,
      humidity: item.humidity,
      light: item.light,
      device_name: item.device_name,
      plant_name: item.plant_name
    })).reverse(); // Reverse to show chronological order
  };

  // Handle filter changes
  const handleFilterChange = (key, value) => {
    setFilters(prev => ({
      ...prev,
      [key]: value
    }));
  };

  // Apply filters
  const applyFilters = () => {
    fetchHistoryData(1);
  };

  // Reset filters
  const resetFilters = () => {
    setFilters({
      device_key: '',
      start_date: formatDate(subDays(new Date(), 7), 'yyyy-MM-dd'),
      end_date: formatDate(new Date(), 'yyyy-MM-dd')
    });
  };

  // Handle pagination
  const handlePageChange = (newPage) => {
    if (newPage >= 1 && newPage <= pagination.totalPages) {
      fetchHistoryData(newPage);
    }
  };

  // Export data to CSV
  const exportToCSV = () => {
    if (historyData.length === 0) return;

    const headers = ['Timestamp', 'Device', 'Plant', 'Soil Moisture (%)', 'Temperature (°C)', 'Humidity (%)', 'Light Intensity (lux)'];
    const csvContent = [
      headers.join(','),
      ...historyData.map(item => [
        item.timestamp,
        item.device_name || '',
        item.plant_name || '',
        item.moisture || '',
        item.temperature || '',
        item.humidity || '',
        item.light || ''
      ].join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `sensor-history-${formatDate(new Date(), 'yyyy-MM-dd')}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  // Initial data fetch
  useEffect(() => {
    if (user) {
      fetchHistoryData();
    }
  }, [user]);

  // Metric options for chart
  const metricOptions = [
    { value: 'moisture', label: 'Soil Moisture (%)', color: '#3b82f6', icon: Droplets },
    { value: 'temperature', label: 'Temperature (°C)', color: '#ef4444', icon: Thermometer },
    { value: 'humidity', label: 'Humidity (%)', color: '#10b981', icon: Wind },
    { value: 'light', label: 'Light Intensity (lux)', color: '#f59e0b', icon: Sun }
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-500"></div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
              {t('history.title', 'Sensor History')}
            </h1>
            <p className="text-gray-600 dark:text-gray-400">
              {t('history.description', 'View and analyze your plant sensor data over time')}
            </p>
          </div>
          <Button
            onClick={exportToCSV}
            disabled={historyData.length === 0}
            className="btn-transition"
          >
            <Download className="h-4 w-4 mr-2" />
            {t('history.export', 'Export CSV')}
          </Button>
        </div>

        {/* Filters Card */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Filter className="h-5 w-5" />
              {t('history.filters', 'Filters')}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* Device Filter */}
              <div className="space-y-2">
                <label className="text-sm font-medium">
                  {t('history.device', 'Device')}
                </label>
                <Select value={filters.device_key} onValueChange={(value) => handleFilterChange('device_key', value)}>
                  <SelectTrigger>
                    <SelectValue placeholder={t('history.allDevices', 'All Devices')} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">{t('history.allDevices', 'All Devices')}</SelectItem>
                    {devices.map(device => (
                      <SelectItem key={device.device_key} value={device.device_key}>
                        {device.plant_name} ({device.device_name})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Start Date */}
              <div className="space-y-2">
                <label className="text-sm font-medium">
                  {t('history.startDate', 'Start Date')}
                </label>
                <Input
                  type="date"
                  value={filters.start_date}
                  onChange={(e) => handleFilterChange('start_date', e.target.value)}
                />
              </div>

              {/* End Date */}
              <div className="space-y-2">
                <label className="text-sm font-medium">
                  {t('history.endDate', 'End Date')}
                </label>
                <Input
                  type="date"
                  value={filters.end_date}
                  onChange={(e) => handleFilterChange('end_date', e.target.value)}
                />
              </div>

              {/* Action Buttons */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-transparent">Actions</label>
                <div className="flex gap-2">
                  <Button onClick={applyFilters} className="btn-transition">
                    {t('common.apply', 'Apply')}
                  </Button>
                  <Button variant="outline" onClick={resetFilters} className="btn-transition">
                    {t('common.reset', 'Reset')}
                  </Button>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Chart Visualization */}
        {chartData.length > 0 && (
          <Card>
            <CardHeader>
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5" />
                  {t('history.trends', 'Sensor Trends')}
                </CardTitle>
                
                {/* Metric Selection */}
                <div className="flex flex-wrap gap-2">
                  {metricOptions.map(metric => {
                    const Icon = metric.icon;
                    const isSelected = selectedMetrics.includes(metric.value);
                    return (
                      <Button
                        key={metric.value}
                        variant={isSelected ? "default" : "outline"}
                        size="sm"
                        onClick={() => {
                          if (isSelected) {
                            setSelectedMetrics(prev => prev.filter(m => m !== metric.value));
                          } else {
                            setSelectedMetrics(prev => [...prev, metric.value]);
                          }
                        }}
                        className={`btn-transition ${isSelected ? '' : 'hover:bg-gray-50 dark:hover:bg-gray-800'}`}
                      >
                        <Icon className="h-4 w-4 mr-1" />
                        {metric.label.split(' ')[0]}
                      </Button>
                    );
                  })}
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="h-80 flex items-center justify-center">
                <SimpleLineChart
                  data={chartData}
                  metrics={selectedMetrics}
                  width={800}
                  height={320}
                />
              </div>
            </CardContent>
          </Card>
        )}

        {/* Data Table */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>
                {t('history.dataTable', 'Historical Data')}
              </CardTitle>
              <div className="text-sm text-gray-600 dark:text-gray-400">
                {t('history.showingRecords', 'Showing {{start}} - {{end}} of {{total}} records', {
                  start: (pagination.currentPage - 1) * pagination.limit + 1,
                  end: Math.min(pagination.currentPage * pagination.limit, pagination.totalRecords),
                  total: pagination.totalRecords
                })}
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex items-center justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-500"></div>
              </div>
            ) : error ? (
              <div className="text-center py-8">
                <p className="text-red-600 dark:text-red-400">{error}</p>
                <Button onClick={() => fetchHistoryData()} className="mt-4 btn-transition">
                  {t('common.retry', 'Retry')}
                </Button>
              </div>
            ) : historyData.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-gray-600 dark:text-gray-400">
                  {t('history.noData', 'No sensor data found for the selected filters.')}
                </p>
              </div>
            ) : (
              <>
                {/* Table */}
                <div className="overflow-x-auto">
                  <table className="w-full border-collapse">
                    <thead>
                      <tr className="border-b border-gray-200 dark:border-gray-700">
                        <th className="text-left py-3 px-4 font-medium text-gray-900 dark:text-white">
                          {t('history.timestamp', 'Timestamp')}
                        </th>
                        <th className="text-left py-3 px-4 font-medium text-gray-900 dark:text-white">
                          {t('history.device', 'Device')}
                        </th>
                        <th className="text-left py-3 px-4 font-medium text-gray-900 dark:text-white">
                          {t('history.plant', 'Plant')}
                        </th>
                        <th className="text-right py-3 px-4 font-medium text-gray-900 dark:text-white">
                          <div className="flex items-center justify-end gap-1">
                            <Droplets className="h-4 w-4 text-blue-500" />
                            {t('history.moisture', 'Moisture')}
                          </div>
                        </th>
                        <th className="text-right py-3 px-4 font-medium text-gray-900 dark:text-white">
                          <div className="flex items-center justify-end gap-1">
                            <Thermometer className="h-4 w-4 text-red-500" />
                            {t('history.temperature', 'Temp')}
                          </div>
                        </th>
                        <th className="text-right py-3 px-4 font-medium text-gray-900 dark:text-white">
                          <div className="flex items-center justify-end gap-1">
                            <Wind className="h-4 w-4 text-green-500" />
                            {t('history.humidity', 'Humidity')}
                          </div>
                        </th>
                        <th className="text-right py-3 px-4 font-medium text-gray-900 dark:text-white">
                          <div className="flex items-center justify-end gap-1">
                            <Sun className="h-4 w-4 text-yellow-500" />
                            {t('history.light', 'Light')}
                          </div>
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {historyData.map((item, index) => (
                        <tr 
                          key={item.data_id || index}
                          className="border-b border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800/50"
                        >
                          <td className="py-3 px-4 text-sm text-gray-900 dark:text-gray-300">
                            {formatDate(item.timestamp, 'MMM dd, yyyy HH:mm:ss')}
                          </td>
                          <td className="py-3 px-4 text-sm text-gray-900 dark:text-gray-300">
                            {item.device_name || `Device ${item.device_key}`}
                          </td>
                          <td className="py-3 px-4 text-sm text-gray-900 dark:text-gray-300">
                            {item.plant_name || '-'}
                          </td>
                          <td className="py-3 px-4 text-sm text-right">
                            <span className={`${
                              item.moisture < 30 ? 'text-red-600 dark:text-red-400' :
                              item.moisture < 60 ? 'text-yellow-600 dark:text-yellow-400' :
                              'text-green-600 dark:text-green-400'
                            }`}>
                              {item.moisture ? `${item.moisture}%` : '-'}
                            </span>
                          </td>
                          <td className="py-3 px-4 text-sm text-right text-gray-900 dark:text-gray-300">
                            {item.temperature ? `${item.temperature}°C` : '-'}
                          </td>
                          <td className="py-3 px-4 text-sm text-right text-gray-900 dark:text-gray-300">
                            {item.humidity ? `${item.humidity}%` : '-'}
                          </td>
                          <td className="py-3 px-4 text-sm text-right text-gray-900 dark:text-gray-300">
                            {item.light ? `${item.light} lux` : '-'}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Pagination */}
                {pagination.totalPages > 1 && (
                  <div className="flex items-center justify-between mt-6">
                    <div className="text-sm text-gray-600 dark:text-gray-400">
                      {t('history.page', 'Page {{current}} of {{total}}', {
                        current: pagination.currentPage,
                        total: pagination.totalPages
                      })}
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handlePageChange(pagination.currentPage - 1)}
                        disabled={!pagination.hasPrevPage}
                        className="btn-transition"
                      >
                        {t('common.previous', 'Previous')}
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handlePageChange(pagination.currentPage + 1)}
                        disabled={!pagination.hasNextPage}
                        className="btn-transition"
                      >
                        {t('common.next', 'Next')}
                      </Button>
                    </div>
                  </div>
                )}
              </>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
'use client'

import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '@/providers/AuthProvider';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/Button';
import { Loader } from '@/components/ui/loader';
import { Card, CardContent } from '@/components/ui/Card';
import { 
  Plus,
  Settings,
  Download,
  Eye,
  Edit,
  Trash2,
  Calendar,
  Filter,
  FileSpreadsheet,
  FileText,
  BarChart3,
  LineChart as LineChartIcon,
  PieChart as PieChartIcon,
  TrendingUp,
  AlertTriangle
} from 'lucide-react';
import plantApi from '@/api/plantApi';
import reportsApi from '@/api/reportsApi';
import LineChart from '@/components/charts/LineChart';
import BarChart from '@/components/charts/BarChart';
import PieChart from '@/components/charts/PieChart';
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import 'jspdf-autotable';

export default function CustomReportsPage() {
  const { t } = useTranslation();
  const { user, isLoading: authLoading } = useAuth();
  const router = useRouter();
  
  const [plants, setPlants] = useState([]);
  const [customReports, setCustomReports] = useState([]);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedReport, setSelectedReport] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  
  // Report creation form
  const [reportForm, setReportForm] = useState({
    name: '',
    description: '',
    plants: [],
    metrics: [],
    chartType: 'line',
    timeRange: 'month',
    groupBy: 'day'
  });

  // Available metrics
  const availableMetrics = [
    { key: 'moisture', label: 'Soil Moisture', icon: '💧' },
    { key: 'temperature', label: 'Temperature', icon: '🌡️' },
    { key: 'humidity', label: 'Humidity', icon: '💨' },
    { key: 'light', label: 'Light Level', icon: '☀️' },
    { key: 'waterUsage', label: 'Water Usage', icon: '🚿' },
    { key: 'growthRate', label: 'Growth Rate', icon: '📈' }
  ];

  // Chart types
  const chartTypes = [
    { key: 'line', label: 'Line Chart', icon: LineChartIcon },
    { key: 'bar', label: 'Bar Chart', icon: BarChart3 },
    { key: 'pie', label: 'Pie Chart', icon: PieChartIcon }
  ];

  // Time ranges
  const timeRanges = [
    { key: 'week', label: 'Last Week' },
    { key: 'month', label: 'Last Month' },
    { key: 'quarter', label: 'Last Quarter' },
    { key: 'year', label: 'Last Year' }
  ];

  // Group by options
  const groupByOptions = [
    { key: 'hour', label: 'Hourly' },
    { key: 'day', label: 'Daily' },
    { key: 'week', label: 'Weekly' },
    { key: 'month', label: 'Monthly' }
  ];

  // Redirect if not authenticated
  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login');
    }
  }, [authLoading, user, router]);

  // Fetch initial data
  useEffect(() => {
    if (user) {
      fetchPlants();
      fetchCustomReports();
    }
  }, [user]);

  const fetchPlants = async () => {
    try {
      const response = await plantApi.getAll();
      setPlants(response.data || []);
    } catch (err) {
      console.error('Error fetching plants:', err);
    }
  };

  const fetchCustomReports = async () => {
    try {
      setLoading(true);
      const response = await reportsApi.getCustomReports();
      setCustomReports(response.data || []);
    } catch (err) {
      console.error('Error fetching custom reports:', err);
      // Mock data for development
      if (process.env.NODE_ENV === 'development') {
        setCustomReports(generateMockCustomReports());
      }
    } finally {
      setLoading(false);
    }
  };

  const generateMockCustomReports = () => [
    {
      id: 1,
      name: 'Weekly Plant Moisture Summary',
      description: 'Weekly moisture levels across all plants',
      plants: ['all'],
      metrics: ['moisture'],
      chartType: 'line',
      timeRange: 'week',
      createdAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
      lastRun: new Date(Date.now() - 2 * 60 * 60 * 1000)
    },
    {
      id: 2,
      name: 'Monthly Water Usage by Plant',
      description: 'Compare water consumption across different plants',
      plants: plants.slice(0, 3).map(p => p.id.toString()),
      metrics: ['waterUsage'],
      chartType: 'bar',
      timeRange: 'month',
      createdAt: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000),
      lastRun: new Date(Date.now() - 24 * 60 * 60 * 1000)
    }
  ];

  // Handle form changes
  const handleFormChange = (field, value) => {
    setReportForm(prev => ({
      ...prev,
      [field]: value
    }));
  };

  // Handle plant selection
  const handlePlantToggle = (plantId) => {
    setReportForm(prev => ({
      ...prev,
      plants: prev.plants.includes(plantId.toString())
        ? prev.plants.filter(id => id !== plantId.toString())
        : [...prev.plants, plantId.toString()]
    }));
  };

  // Handle metric selection
  const handleMetricToggle = (metricKey) => {
    setReportForm(prev => ({
      ...prev,
      metrics: prev.metrics.includes(metricKey)
        ? prev.metrics.filter(m => m !== metricKey)
        : [...prev.metrics, metricKey]
    }));
  };

  // Create custom report
  const createCustomReport = async () => {
    if (!reportForm.name || reportForm.plants.length === 0 || reportForm.metrics.length === 0) {
      setError('Please fill in all required fields');
      return;
    }

    try {
      setLoading(true);
      const response = await reportsApi.createCustomReport(reportForm);
      setCustomReports(prev => [...prev, response.data]);
      setShowCreateModal(false);
      setReportForm({
        name: '',
        description: '',
        plants: [],
        metrics: [],
        chartType: 'line',
        timeRange: 'month',
        groupBy: 'day'
      });
    } catch (err) {
      console.error('Error creating custom report:', err);
      setError('Failed to create custom report');
    } finally {
      setLoading(false);
    }
  };

  // Run custom report
  const runCustomReport = async (reportId) => {
    try {
      setLoading(true);
      const response = await reportsApi.runCustomReport(reportId);
      setSelectedReport(response.data);
    } catch (err) {
      console.error('Error running custom report:', err);
      
      // Mock data for development
      if (process.env.NODE_ENV === 'development') {
        const report = customReports.find(r => r.id === reportId);
        setSelectedReport({
          ...report,
          data: generateMockReportData(report),
          generatedAt: new Date()
        });
      }
    } finally {
      setLoading(false);
    }
  };

  const generateMockReportData = (report) => {
    const days = report.timeRange === 'week' ? 7 : report.timeRange === 'month' ? 30 : 90;
    const data = [];
    
    for (let i = days; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      
      const dataPoint = {
        date: date.toISOString().split('T')[0],
        timestamp: date.toISOString()
      };
      
      report.metrics.forEach(metric => {
        dataPoint[metric] = Math.random() * 100;
      });
      
      data.push(dataPoint);
    }
    
    return data;
  };

  // Delete custom report
  const deleteCustomReport = async (reportId) => {
    if (!confirm('Are you sure you want to delete this report?')) return;
    
    try {
      await reportsApi.deleteCustomReport(reportId);
      setCustomReports(prev => prev.filter(r => r.id !== reportId));
    } catch (err) {
      console.error('Error deleting custom report:', err);
      setError('Failed to delete custom report');
    }
  };

  // Export report data
  const exportReportData = (format) => {
    if (!selectedReport || !selectedReport.data) return;

    if (format === 'excel') {
      const worksheet = XLSX.utils.json_to_sheet(selectedReport.data);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, 'Report Data');
      
      const fileName = `custom_report_${selectedReport.name.replace(/\s+/g, '_').toLowerCase()}.xlsx`;
      XLSX.writeFile(workbook, fileName);
    } else if (format === 'pdf') {
      const doc = new jsPDF();
      
      doc.setFontSize(20);
      doc.text(selectedReport.name, 20, 20);
      
      doc.setFontSize(12);
      doc.text(`Description: ${selectedReport.description}`, 20, 35);
      doc.text(`Generated: ${new Date(selectedReport.generatedAt).toLocaleDateString()}`, 20, 45);
      
      const headers = ['Date', ...selectedReport.metrics];
      const rows = selectedReport.data.map(row => [
        new Date(row.timestamp).toLocaleDateString(),
        ...selectedReport.metrics.map(metric => row[metric]?.toFixed(2) || 'N/A')
      ]);
      
      doc.autoTable({
        head: [headers],
        body: rows,
        startY: 55,
        styles: { fontSize: 8 }
      });
      
      const fileName = `custom_report_${selectedReport.name.replace(/\s+/g, '_').toLowerCase()}.pdf`;
      doc.save(fileName);
    }
  };

  // Render chart based on type
  const renderChart = (report) => {
    if (!report.data) return null;

    const commonProps = {
      data: report.data,
      height: 300
    };

    switch (report.chartType) {
      case 'line':
        return (
          <LineChart 
            {...commonProps}
            xKey="date"
            yKey={report.metrics[0]}
            showLegend={true}
          />
        );
      case 'bar':
        return (
          <BarChart 
            {...commonProps}
            xKey="date"
            yKey={report.metrics[0]}
          />
        );
      case 'pie':
        // For pie charts, we need to aggregate data
        const aggregatedData = report.data.slice(-7).map((item, index) => ({
          name: `Day ${index + 1}`,
          value: item[report.metrics[0]]
        }));
        return (
          <PieChart 
            data={aggregatedData}
            dataKey="value"
            nameKey="name"
            height={300}
          />
        );
      default:
        return <p className="text-gray-500">Unsupported chart type</p>;
    }
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
            {t('reports.customReports', 'Custom Reports')}
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            {t('reports.customReportsDesc', 'Create and manage personalized data reports')}
          </p>
        </div>
        
        <Button
          onClick={() => setShowCreateModal(true)}
          className="flex items-center gap-2"
        >
          <Plus className="w-4 h-4" />
          {t('reports.createReport', 'Create Report')}
        </Button>
      </div>

      {/* Custom Reports List */}
      {loading && !selectedReport ? (
        <Card>
          <CardContent className="p-8 text-center">
            <Loader size="lg" />
            <p className="mt-4 text-gray-600 dark:text-gray-400">
              {t('reports.loadingReports', 'Loading custom reports...')}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {customReports.map((report) => (
            <Card key={report.id} className="hover:shadow-md transition-shadow">
              <CardContent className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-1">
                      {report.name}
                    </h3>
                    <p className="text-gray-600 dark:text-gray-400 text-sm mb-2">
                      {report.description}
                    </p>
                    <div className="flex flex-wrap gap-2 mb-2">
                      {report.metrics.map(metric => {
                        const metricInfo = availableMetrics.find(m => m.key === metric);
                        return (
                          <span key={metric} className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">
                            {metricInfo?.icon} {metricInfo?.label}
                          </span>
                        );
                      })}
                    </div>
                  </div>
                  <div className="flex gap-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => runCustomReport(report.id)}
                      className="p-2"
                    >
                      <Eye className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => deleteCustomReport(report.id)}
                      className="p-2 text-red-600 hover:text-red-700"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
                
                <div className="text-xs text-gray-500 space-y-1">
                  <p>Created: {new Date(report.createdAt).toLocaleDateString()}</p>
                  <p>Last run: {report.lastRun ? new Date(report.lastRun).toLocaleDateString() : 'Never'}</p>
                  <p>
                    {report.plants.includes('all') ? 'All plants' : `${report.plants.length} plants`} • 
                    {timeRanges.find(tr => tr.key === report.timeRange)?.label} • 
                    {chartTypes.find(ct => ct.key === report.chartType)?.label}
                  </p>
                </div>
                
                <Button
                  onClick={() => runCustomReport(report.id)}
                  className="w-full mt-4"
                  variant="outline"
                >
                  <TrendingUp className="w-4 h-4 mr-2" />
                  {t('reports.runReport', 'Run Report')}
                </Button>
              </CardContent>
            </Card>
          ))}
          
          {customReports.length === 0 && (
            <div className="col-span-2 text-center py-12">
              <BarChart3 className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-600 mb-2">
                {t('reports.noCustomReports', 'No Custom Reports')}
              </h3>
              <p className="text-gray-500 mb-4">
                {t('reports.createFirstReport', 'Create your first custom report to get started')}
              </p>
              <Button onClick={() => setShowCreateModal(true)}>
                <Plus className="w-4 h-4 mr-2" />
                {t('reports.createReport', 'Create Report')}
              </Button>
            </div>
          )}
        </div>
      )}

      {/* Selected Report Display */}
      {selectedReport && (
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                  {selectedReport.name}
                </h2>
                <p className="text-gray-600 dark:text-gray-400">
                  Generated: {new Date(selectedReport.generatedAt).toLocaleString()}
                </p>
              </div>
              
              <div className="flex gap-2">
                <Button
                  onClick={() => exportReportData('excel')}
                  variant="outline"
                  size="sm"
                  className="flex items-center gap-2"
                >
                  <FileSpreadsheet className="w-4 h-4" />
                  Excel
                </Button>
                <Button
                  onClick={() => exportReportData('pdf')}
                  variant="outline"
                  size="sm"
                  className="flex items-center gap-2"
                >
                  <FileText className="w-4 h-4" />
                  PDF
                </Button>
                <Button
                  onClick={() => setSelectedReport(null)}
                  variant="ghost"
                  size="sm"
                >
                  ✕
                </Button>
              </div>
            </div>
            
            {renderChart(selectedReport)}
          </CardContent>
        </Card>
      )}

      {/* Create Report Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold">Create Custom Report</h2>
              <Button
                variant="ghost"
                onClick={() => setShowCreateModal(false)}
              >
                ✕
              </Button>
            </div>
            
            <div className="space-y-4">
              {/* Basic Info */}
              <div>
                <label className="block text-sm font-medium mb-2">Report Name *</label>
                <input
                  type="text"
                  value={reportForm.name}
                  onChange={(e) => handleFormChange('name', e.target.value)}
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-green-500 dark:bg-gray-700 dark:border-gray-600"
                  placeholder="Enter report name..."
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-2">Description</label>
                <textarea
                  value={reportForm.description}
                  onChange={(e) => handleFormChange('description', e.target.value)}
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-green-500 dark:bg-gray-700 dark:border-gray-600"
                  placeholder="Enter report description..."
                  rows={3}
                />
              </div>
              
              {/* Plant Selection */}
              <div>
                <label className="block text-sm font-medium mb-2">Select Plants *</label>
                <div className="grid grid-cols-2 gap-2 max-h-32 overflow-y-auto">
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={reportForm.plants.includes('all')}
                      onChange={() => handleFormChange('plants', ['all'])}
                      className="mr-2"
                    />
                    All Plants
                  </label>
                  {plants.map((plant) => (
                    <label key={plant.id} className="flex items-center">
                      <input
                        type="checkbox"
                        checked={reportForm.plants.includes(plant.id.toString())}
                        onChange={() => handlePlantToggle(plant.id)}
                        disabled={reportForm.plants.includes('all')}
                        className="mr-2"
                      />
                      {plant.name}
                    </label>
                  ))}
                </div>
              </div>
              
              {/* Metrics Selection */}
              <div>
                <label className="block text-sm font-medium mb-2">Select Metrics *</label>
                <div className="grid grid-cols-2 gap-2">
                  {availableMetrics.map((metric) => (
                    <label key={metric.key} className="flex items-center">
                      <input
                        type="checkbox"
                        checked={reportForm.metrics.includes(metric.key)}
                        onChange={() => handleMetricToggle(metric.key)}
                        className="mr-2"
                      />
                      {metric.icon} {metric.label}
                    </label>
                  ))}
                </div>
              </div>
              
              {/* Chart Type */}
              <div>
                <label className="block text-sm font-medium mb-2">Chart Type</label>
                <select
                  value={reportForm.chartType}
                  onChange={(e) => handleFormChange('chartType', e.target.value)}
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-green-500 dark:bg-gray-700 dark:border-gray-600"
                >
                  {chartTypes.map((type) => (
                    <option key={type.key} value={type.key}>
                      {type.label}
                    </option>
                  ))}
                </select>
              </div>
              
              {/* Time Range */}
              <div>
                <label className="block text-sm font-medium mb-2">Time Range</label>
                <select
                  value={reportForm.timeRange}
                  onChange={(e) => handleFormChange('timeRange', e.target.value)}
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-green-500 dark:bg-gray-700 dark:border-gray-600"
                >
                  {timeRanges.map((range) => (
                    <option key={range.key} value={range.key}>
                      {range.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            
            {error && (
              <div className="mt-4 p-3 bg-red-100 text-red-700 rounded-lg">
                {error}
              </div>
            )}
            
            <div className="flex gap-2 mt-6">
              <Button
                onClick={createCustomReport}
                disabled={loading}
                className="flex-1"
              >
                {loading ? <Loader size="sm" /> : 'Create Report'}
              </Button>
              <Button
                variant="outline"
                onClick={() => setShowCreateModal(false)}
                className="flex-1"
              >
                Cancel
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
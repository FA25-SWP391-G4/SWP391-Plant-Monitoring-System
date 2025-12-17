'use client'

import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '@/providers/AuthProvider';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/Button';
import { Loader } from '@/components/ui/loader';
import { Card, CardContent } from '@/components/ui/Card';
import { 
  Leaf, 
  Heart,
  AlertTriangle,
  CheckCircle,
  TrendingUp,
  TrendingDown,
  Activity,
  Thermometer,
  Droplets,
  Sun,
  Shield,
  Download,
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

export default function PlantHealthPage() {
  const { t } = useTranslation();
  const { user, isLoading: authLoading } = useAuth();
  const router = useRouter();
  
  const [plants, setPlants] = useState([]);
  const [healthData, setHealthData] = useState(null);
  const [timeRange, setTimeRange] = useState('month');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Time range options
  const timeRanges = [
    { key: 'week', label: t('reports.lastWeek', 'Last Week') },
    { key: 'month', label: t('reports.lastMonth', 'Last Month') },
    { key: 'quarter', label: t('reports.lastQuarter', 'Last Quarter') },
    { key: 'year', label: t('reports.lastYear', 'Last Year') }
  ];

  // Health status colors
  const getHealthColor = (score) => {
    if (score >= 80) return { bg: 'bg-green-100', text: 'text-green-800', icon: CheckCircle, label: 'Healthy' };
    if (score >= 60) return { bg: 'bg-yellow-100', text: 'text-yellow-800', icon: AlertTriangle, label: 'Fair' };
    return { bg: 'bg-red-100', text: 'text-red-800', icon: AlertTriangle, label: 'Poor' };
  };

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
      } catch (err) {
        console.error('Error fetching plants:', err);
        setError(t('reports.errorLoadingPlants', 'Error loading plants'));
      }
    };

    if (user) {
      fetchPlants();
    }
  }, [user, t]);

  // Fetch health data
  useEffect(() => {
    if (user) {
      fetchHealthData();
    }
  }, [user, timeRange]);

  const fetchHealthData = async () => {
    setLoading(true);
    setError(null);

    try {
      const data = await reportsApi.getPlantHealth(timeRange);
      setHealthData(data);
    } catch (err) {
      console.error('Error fetching health data:', err);
      setError(t('reports.errorFetchingData', 'Error fetching plant health data'));
      
      // Mock data for development
      if (process.env.NODE_ENV === 'development') {
        setHealthData(generateMockHealthData());
      }
    } finally {
      setLoading(false);
    }
  };

  // Generate mock health data
  const generateMockHealthData = () => {
    const days = 30;
    const healthHistory = [];
    
    for (let i = days; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      
      healthHistory.push({
        date: date.toISOString().split('T')[0],
        avgHealth: Math.random() * 20 + 70,
        healthyPlants: Math.floor(Math.random() * plants.length * 0.8),
        criticalPlants: Math.floor(Math.random() * 3)
      });
    }

    const plantHealth = plants.map((plant, index) => ({
      id: plant.id,
      name: plant.name,
      type: plant.type,
      healthScore: Math.random() * 30 + 70,
      lastCheck: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000),
      issues: Math.random() > 0.7 ? ['Low moisture', 'High temperature'] : [],
      recommendations: ['Increase watering frequency', 'Adjust light exposure'],
      metrics: {
        moisture: Math.random() * 40 + 40,
        temperature: Math.random() * 10 + 20,
        humidity: Math.random() * 30 + 50,
        light: Math.random() * 500 + 200
      }
    }));

    return {
      overview: {
        totalPlants: plants.length,
        healthyPlants: plantHealth.filter(p => p.healthScore >= 80).length,
        warningPlants: plantHealth.filter(p => p.healthScore >= 60 && p.healthScore < 80).length,
        criticalPlants: plantHealth.filter(p => p.healthScore < 60).length,
        avgHealthScore: plantHealth.reduce((sum, p) => sum + p.healthScore, 0) / plantHealth.length
      },
      healthHistory,
      plantHealth,
      healthFactors: [
        { factor: 'Moisture Levels', impact: 85, description: 'Optimal soil moisture maintained' },
        { factor: 'Temperature', impact: 78, description: 'Temperature within ideal range' },
        { factor: 'Light Exposure', impact: 92, description: 'Adequate light exposure' },
        { factor: 'Humidity', impact: 73, description: 'Humidity could be improved' }
      ],
      alerts: [
        { 
          severity: 'high', 
          plant: 'Snake Plant', 
          issue: 'Low moisture detected', 
          time: '2 hours ago' 
        },
        { 
          severity: 'medium', 
          plant: 'Fiddle Leaf Fig', 
          issue: 'Temperature spike', 
          time: '5 hours ago' 
        }
      ]
    };
  };

  // Export to Excel
  const exportToExcel = () => {
    if (!healthData) return;

    const workbook = XLSX.utils.book_new();
    
    // Overview sheet
    const overviewWs = XLSX.utils.json_to_sheet([healthData.overview]);
    XLSX.utils.book_append_sheet(workbook, overviewWs, 'Overview');
    
    // Plant health sheet
    const plantWs = XLSX.utils.json_to_sheet(healthData.plantHealth.map(plant => ({
      name: plant.name,
      type: plant.type,
      healthScore: plant.healthScore,
      issues: plant.issues.join(', '),
      moisture: plant.metrics.moisture,
      temperature: plant.metrics.temperature,
      humidity: plant.metrics.humidity,
      light: plant.metrics.light
    })));
    XLSX.utils.book_append_sheet(workbook, plantWs, 'Plant Health');
    
    // Health history sheet
    const historyWs = XLSX.utils.json_to_sheet(healthData.healthHistory);
    XLSX.utils.book_append_sheet(workbook, historyWs, 'Health History');
    
    const fileName = `plant_health_report_${timeRange}_${new Date().toISOString().split('T')[0]}.xlsx`;
    XLSX.writeFile(workbook, fileName);
  };

  // Export to PDF
  const exportToPDF = () => {
    if (!healthData) return;

    const doc = new jsPDF();
    
    // Title
    doc.setFontSize(20);
    doc.text('Plant Health Report', 20, 20);
    
    // Overview
    doc.setFontSize(12);
    doc.text(`Time Range: ${timeRanges.find(tr => tr.key === timeRange)?.label}`, 20, 35);
    doc.text(`Total Plants: ${healthData.overview.totalPlants}`, 20, 45);
    doc.text(`Healthy Plants: ${healthData.overview.healthyPlants}`, 20, 55);
    doc.text(`Warning Plants: ${healthData.overview.warningPlants}`, 20, 65);
    doc.text(`Critical Plants: ${healthData.overview.criticalPlants}`, 20, 75);
    
    // Plant health table
    const headers = ['Plant Name', 'Type', 'Health Score', 'Issues'];
    const rows = healthData.plantHealth.map(plant => [
      plant.name,
      plant.type,
      plant.healthScore.toFixed(1),
      plant.issues.join(', ') || 'None'
    ]);
    
    doc.autoTable({
      head: [headers],
      body: rows,
      startY: 85,
      styles: { fontSize: 8 }
    });
    
    const fileName = `plant_health_report_${timeRange}.pdf`;
    doc.save(fileName);
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
            {t('reports.plantHealth', 'Plant Health')}
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            {t('reports.plantHealthDesc', 'Monitor overall plant health and wellness metrics')}
          </p>
        </div>
        
        {healthData && (
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

      {/* Filters */}
      <Card>
        <CardContent className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
          </div>
        </CardContent>
      </Card>

      {/* Content */}
      {loading ? (
        <Card>
          <CardContent className="p-8 text-center">
            <Loader size="lg" />
            <p className="mt-4 text-gray-600 dark:text-gray-400">
              {t('reports.loadingData', 'Loading plant health data...')}
            </p>
          </CardContent>
        </Card>
      ) : error ? (
        <Card>
          <CardContent className="p-8 text-center">
            <AlertTriangle className="w-12 h-12 text-red-500 mx-auto mb-4" />
            <p className="text-red-600 dark:text-red-400">{error}</p>
            <Button onClick={fetchHealthData} className="mt-4">
              {t('common.retry', 'Retry')}
            </Button>
          </CardContent>
        </Card>
      ) : healthData ? (
        <div className="space-y-6">
          {/* Overview Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                      {t('reports.totalPlants', 'Total Plants')}
                    </p>
                    <p className="text-2xl font-bold text-gray-900 dark:text-white">
                      {healthData.overview.totalPlants}
                    </p>
                  </div>
                  <Leaf className="h-8 w-8 text-green-500" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                      {t('reports.healthyPlants', 'Healthy Plants')}
                    </p>
                    <p className="text-2xl font-bold text-green-600">
                      {healthData.overview.healthyPlants}
                    </p>
                  </div>
                  <CheckCircle className="h-8 w-8 text-green-500" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                      {t('reports.warningPlants', 'Warning Plants')}
                    </p>
                    <p className="text-2xl font-bold text-yellow-600">
                      {healthData.overview.warningPlants}
                    </p>
                  </div>
                  <AlertTriangle className="h-8 w-8 text-yellow-500" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                      {t('reports.avgHealthScore', 'Avg Health Score')}
                    </p>
                    <p className="text-2xl font-bold text-gray-900 dark:text-white">
                      {healthData.overview.avgHealthScore.toFixed(1)}
                    </p>
                  </div>
                  <Heart className="h-8 w-8 text-red-500" />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Charts and Analysis */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Health Trend */}
            <Card>
              <CardContent className="p-6">
                <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                  <Activity className="w-5 h-5 text-blue-500" />
                  {t('reports.healthTrendOverTime', 'Health Trend Over Time')}
                </h3>
                <LineChart 
                  data={healthData.healthHistory}
                  xKey="date"
                  yKey="avgHealth"
                  height={300}
                />
              </CardContent>
            </Card>

            {/* Health Distribution */}
            <Card>
              <CardContent className="p-6">
                <h3 className="text-lg font-semibold mb-4">
                  {t('reports.healthDistribution', 'Health Distribution')}
                </h3>
                <PieChart 
                  data={[
                    { name: 'Healthy', value: healthData.overview.healthyPlants, color: '#10b981' },
                    { name: 'Warning', value: healthData.overview.warningPlants, color: '#f59e0b' },
                    { name: 'Critical', value: healthData.overview.criticalPlants, color: '#ef4444' }
                  ]}
                  dataKey="value"
                  nameKey="name"
                  height={300}
                />
              </CardContent>
            </Card>

            {/* Health Factors */}
            <Card>
              <CardContent className="p-6">
                <h3 className="text-lg font-semibold mb-4">
                  {t('reports.healthFactors', 'Health Factors Impact')}
                </h3>
                <div className="space-y-4">
                  {healthData.healthFactors.map((factor, index) => (
                    <div key={index} className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center justify-between mb-1">
                          <span className="font-medium text-sm">{factor.factor}</span>
                          <span className="text-sm text-gray-600">{factor.impact}%</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div 
                            className="bg-green-500 h-2 rounded-full" 
                            style={{ width: `${factor.impact}%` }}
                          ></div>
                        </div>
                        <p className="text-xs text-gray-500 mt-1">{factor.description}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Recent Alerts */}
            <Card>
              <CardContent className="p-6">
                <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                  <AlertTriangle className="w-5 h-5 text-orange-500" />
                  {t('reports.recentAlerts', 'Recent Alerts')}
                </h3>
                <div className="space-y-3">
                  {healthData.alerts.map((alert, index) => (
                    <div key={index} className={`p-3 rounded-lg border-l-4 ${
                      alert.severity === 'high' 
                        ? 'bg-red-50 border-red-500' 
                        : 'bg-yellow-50 border-yellow-500'
                    }`}>
                      <div className="flex justify-between items-start">
                        <div>
                          <p className="font-medium text-sm">{alert.plant}</p>
                          <p className="text-sm text-gray-600">{alert.issue}</p>
                        </div>
                        <span className="text-xs text-gray-500">{alert.time}</span>
                      </div>
                    </div>
                  ))}
                  {healthData.alerts.length === 0 && (
                    <p className="text-gray-500 text-center py-4">
                      {t('reports.noRecentAlerts', 'No recent alerts')}
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Individual Plant Health */}
          <Card>
            <CardContent className="p-6">
              <h3 className="text-lg font-semibold mb-4">
                {t('reports.individualPlantHealth', 'Individual Plant Health')}
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {healthData.plantHealth.map((plant) => {
                  const healthStatus = getHealthColor(plant.healthScore);
                  const HealthIcon = healthStatus.icon;
                  
                  return (
                    <div key={plant.id} className="border rounded-lg p-4 hover:shadow-md transition-shadow">
                      <div className="flex items-center justify-between mb-3">
                        <div>
                          <h4 className="font-medium">{plant.name}</h4>
                          <p className="text-sm text-gray-500">{plant.type}</p>
                        </div>
                        <div className={`px-2 py-1 rounded-full ${healthStatus.bg} ${healthStatus.text} flex items-center gap-1`}>
                          <HealthIcon className="w-3 h-3" />
                          <span className="text-xs font-medium">{plant.healthScore.toFixed(0)}</span>
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-2 gap-2 mb-3">
                        <div className="flex items-center gap-1">
                          <Droplets className="w-3 h-3 text-blue-500" />
                          <span className="text-xs">{plant.metrics.moisture.toFixed(0)}%</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Thermometer className="w-3 h-3 text-red-500" />
                          <span className="text-xs">{plant.metrics.temperature.toFixed(0)}°C</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Shield className="w-3 h-3 text-green-500" />
                          <span className="text-xs">{plant.metrics.humidity.toFixed(0)}%</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Sun className="w-3 h-3 text-yellow-500" />
                          <span className="text-xs">{plant.metrics.light.toFixed(0)} lux</span>
                        </div>
                      </div>
                      
                      {plant.issues.length > 0 && (
                        <div className="mb-2">
                          <p className="text-xs font-medium text-red-600 mb-1">Issues:</p>
                          <div className="flex flex-wrap gap-1">
                            {plant.issues.map((issue, idx) => (
                              <span key={idx} className="text-xs bg-red-100 text-red-800 px-2 py-1 rounded">
                                {issue}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}
                      
                      <p className="text-xs text-gray-500">
                        Last check: {new Date(plant.lastCheck).toLocaleDateString()}
                      </p>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </div>
      ) : null}
    </div>
  );
}
'use client';

import { useState, useEffect } from 'react';

import { useAuth } from '@/providers/AuthProvider';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card';

import { Button } from '@/components/ui/Button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/Select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Download, RefreshCw, TrendingUp, Users, Smartphone, Droplets } from 'lucide-react';
import LineChart from '@/components/admin/LineChart';
import BarChart from '@/components/admin/BarChart';
import StatCard from '@/components/admin/StatCard';
import axiosClient from '@/api/axiosClient';
import { useTranslation } from 'react-i18next';

export default function AdminReportsPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const { t } = useTranslation();
  const [reportData, setReportData] = useState(null);

  const [profitData, setProfitData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedPeriod, setSelectedPeriod] = useState('month');
  const [selectedReportType, setSelectedReportType] = useState('users');

  useEffect(() => {
    if (!loading && user && user.role !== 'Admin' && user.role !== 'ADMIN') {
      router.push('/dashboard');
    }
  }, [user, loading, router]);

  useEffect(() => {
    if (user && (user.role === 'Admin' || user.role === 'ADMIN')) {
      fetchReportData();
    }
  }, [user, selectedPeriod, selectedReportType]);

  const formatPrice = (price, locale = 'vi-VN', currency = 'VND') => {
    return new Intl.NumberFormat(locale, {
      style: 'currency',
      currency: currency,
    }).format(price);
  }

  const fetchReportData = async () => {
    try {
      setIsLoading(true);
      
      const [reportsResponse, profitResponse] = await Promise.all([
        axiosClient.get(`/api/admin/reports?type=${selectedReportType}&period=${selectedPeriod}`),
        axiosClient.get(`/api/admin/profit-analysis?period=${selectedPeriod}`)
      ]);

      setReportData(reportsResponse.data.data);
      setProfitData(profitResponse.data.data);
    } catch (error) {
      console.error('Error fetching report data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDownloadReport = async (format = 'csv') => {
    try {
      const response = await axiosClient.get(
        `/api/admin/reports?type=${selectedReportType}&period=${selectedPeriod}&format=${format}`,
        { responseType: 'blob' }
      );
      
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `${selectedReportType}-report-${selectedPeriod}.${format}`);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (error) {
      console.error('Error downloading report:', error);
    }
  };

  if (loading || isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">{t('admin.reports.loading', 'Loading reports...')}</p>
        </div>
      </div>
    );
  }

  if (!user || (user.role !== 'Admin' && user.role !== 'ADMIN')) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle className="text-destructive">{t('admin.common.accessDeniedTitle', 'Access Denied')}</CardTitle>
            <CardDescription>{t('admin.common.accessDeniedDescription', 'You do not have permission to access this page.')}</CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  // Prepare chart data based on report type
  const getChartData = () => {
    if (!reportData?.report) return { labels: [], datasets: [] };

    switch (selectedReportType) {
      case 'users':
        return {
          labels: reportData.report.map(item => new Date(item.date).toLocaleDateString()),
          datasets: [
            {
              label: 'New Users',
              data: reportData.report.map(item => item.new_users || 0),
              borderColor: 'rgb(59, 130, 246)',
              backgroundColor: 'rgba(59, 130, 246, 0.1)',
              tension: 0.3,
            },
            {
              label: 'Premium Users',
              data: reportData.report.map(item => item.new_premium_users || 0),
              borderColor: 'rgb(16, 185, 129)',
              backgroundColor: 'rgba(16, 185, 129, 0.1)',
              tension: 0.3,
            },
          ],
        };
      case 'devices':
        return {
          labels: ['Total', 'Active', 'Inactive'],
          datasets: [
            {
              label: 'Device Count',
              data: [
                reportData.report[0]?.total_devices || 0,
                reportData.report[0]?.active_devices || 0,
                reportData.report[0]?.inactive_devices || 0
              ],
              backgroundColor: ['#3B82F6', '#10B981', '#EF4444'],
            },
          ],
        };
      default:
        return { labels: [], datasets: [] };
    }
  };

  const revenueChartData = {
    labels: profitData?.revenue?.periodData?.map(item => 
      new Date(item.period).toLocaleDateString()
    ) || [],
    datasets: [
      {
        label: 'Revenue ($)',
        data: profitData?.revenue?.periodData?.map(item => parseFloat(item.revenue) || 0) || [],
        backgroundColor: 'rgba(16, 185, 129, 0.8)',
        borderColor: 'rgb(16, 185, 129)',
        borderWidth: 2,
      },
    ],
  };

  return (
    <div className="container mx-auto px-4 py-8 space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">{t('admin.reports.header.title', 'System Reports')}</h1>
          <p className="mt-2 text-gray-600">{t('admin.reports.header.subtitle', 'Comprehensive analytics and reporting dashboard')}</p>
        </div>
        <div className="flex space-x-3">
          {/*<Button variant="outline" onClick={() => handleDownloadReport('csv')}>
            <Download className="w-4 h-4 mr-2" />
            {t('admin.reports.header.download', 'Download CSV')}
          </Button>*/}
          <Button variant="outline" onClick={fetchReportData}>
            <RefreshCw className="w-4 h-4 mr-2" />
            {t('admin.common.refresh', 'Refresh')}
          </Button>
        </div>
      </div>

      {/* Controls */}
        <div className="flex space-x-4">
          <Select value={selectedPeriod} onValueChange={setSelectedPeriod}>
            <SelectTrigger className="w-40">
          <SelectValue placeholder={t('admin.reports.controls.period.placeholder', 'Last Day')}>
            {selectedPeriod
              ? {
              day: t('admin.reports.controls.period.day', 'Last Day'),
              week: t('admin.reports.controls.period.week', 'Last Week'),
              month: t('admin.reports.controls.period.month', 'Last Month'),
              year: t('admin.reports.controls.period.year', 'Last Year'),
            }[selectedPeriod]
              : t('admin.reports.controls.period.day', 'Last Day')}
          </SelectValue>
            </SelectTrigger>
            <SelectContent>
          <SelectItem value="day">{t('admin.reports.controls.period.day', 'Last Day')}</SelectItem>
          <SelectItem value="week">{t('admin.reports.controls.period.week', 'Last Week')}</SelectItem>
          <SelectItem value="month">{t('admin.reports.controls.period.month', 'Last Month')}</SelectItem>
          <SelectItem value="year">{t('admin.reports.controls.period.year', 'Last Year')}</SelectItem>
            </SelectContent>
          </Select>

          {/*  <Select value={selectedReportType} onValueChange={setSelectedReportType}>
            <SelectTrigger className="w-40">
          <SelectValue placeholder="User Reports">
            {selectedReportType
              ? {
              users: t('admin.reports.controls.reportType.users', 'User Reports'),
              devices: t('admin.reports.controls.reportType.devices', 'Device Reports'),
              sensors: t('admin.reports.controls.reportType.sensors', 'Sensor Reports'),
              watering: t('admin.reports.controls.reportType.watering', 'Watering Reports'),
            }[selectedReportType]
              : t('admin.reports.controls.reportType.users', 'User Reports')}
          </SelectValue>
            </SelectTrigger>
            <SelectContent>
          <SelectItem value="users">{t('admin.reports.controls.reportType.users', 'User Reports')}</SelectItem>
          <SelectItem value="devices">{t('admin.reports.controls.reportType.devices', 'Device Reports')}</SelectItem>
          <SelectItem value="sensors">{t('admin.reports.controls.reportType.sensors', 'Sensor Reports')}</SelectItem>
          <SelectItem value="watering">{t('admin.reports.controls.reportType.watering', 'Watering Reports')}</SelectItem>
            </SelectContent>
          </Select>
          */}
        </div>

        <Tabs defaultValue="overview" className="space-y-6">
          <TabsList>
            <TabsTrigger value="overview">{t('admin.reports.tabs.overview', 'Overview')}</TabsTrigger>
            <TabsTrigger value="financial">{t('admin.reports.tabs.financial', 'Financial')}</TabsTrigger>
            <TabsTrigger value="technical">{t('admin.reports.tabs.technical', 'Technical')}</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            {/* Key Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <StatCard
              title={t('admin.reports.metrics.revenue.title', 'Revenue')}
              value={formatPrice(profitData?.revenue?.summary?.totalRevenue)}
              description={t('admin.reports.metrics.revenue.description', 'Total revenue for period')}
              icon={TrendingUp}
              color="green"
            />
            <StatCard
              title={t('admin.reports.metrics.customers.title', 'Customers')}
              value={profitData?.customers?.summary?.totalCustomers?.toLocaleString() || '0'}
              description={t('admin.reports.metrics.customers.description', '{{value}}% conversion rate', {
                value: profitData?.customers?.summary?.conversionRate || 0
              })}
              icon={Users}
              color="blue"
            />
            <StatCard
              title={t('admin.reports.metrics.devices.title', 'Devices')}
              value={reportData?.report?.[0]?.total_devices || '0'}
              description={t('admin.reports.metrics.devices.description', '{{value}} active', {
                value: reportData?.report?.[0]?.active_devices || 0
              })}
              icon={Smartphone}
              color="purple"
            />
            <StatCard
              title={t('admin.reports.metrics.avgCustomerValue.title', 'Avg. Customer Value')}
              value={formatPrice(profitData?.customers?.summary?.averageCustomerValue)}
              description={t('admin.reports.metrics.avgCustomerValue.description', 'Revenue per customer')}
              icon={Droplets}
              color="orange"
            />
          </div>

          {/* Charts */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <LineChart
              title={t('admin.reports.charts.primary.title', '{{type}} Trend', {
                type: selectedReportType.charAt(0).toUpperCase() + selectedReportType.slice(1)
              })}
              description={t('admin.reports.charts.primary.description', '{{type}} data for the last {{period}}', {
                type: selectedReportType,
                period: selectedPeriod
              })}
              data={getChartData()}
              height={300}
            />
            <BarChart
              title={t('admin.reports.charts.revenueDistribution.title', 'Revenue Distribution')}
              description={t('admin.reports.charts.revenueDistribution.description', 'Daily revenue breakdown')}
              data={revenueChartData}
              height={300}
            />
          </div>
        </TabsContent>

        <TabsContent value="financial" className="space-y-6">
          {/* Financial Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>{t('admin.reports.financial.revenueBreakdown.title', 'Revenue Breakdown')}</CardTitle>
                <CardDescription>{t('admin.reports.financial.revenueBreakdown.description', 'Financial performance metrics')}</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex justify-between">
                    <span>{t('admin.reports.financial.revenueBreakdown.totalRevenue', 'Total Revenue:')}</span>
                    <span className="font-bold">{formatPrice(profitData?.profitMargins?.revenue)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>{t('admin.reports.financial.revenueBreakdown.operatingCosts', 'Operating Costs:')}</span>
                    <span className="font-bold">{formatPrice(profitData?.profitMargins?.totalCosts)}</span>
                  </div>
                  <div className="flex justify-between border-t pt-2">
                    <span>{t('admin.reports.financial.revenueBreakdown.grossProfit', 'Gross Profit:')}</span>
                    <span className="font-bold text-green-600">
                      {formatPrice(profitData?.profitMargins?.grossProfit)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>{t('admin.reports.financial.revenueBreakdown.profitMargin', 'Profit Margin:')}</span>
                    <span className="font-bold">
                      {profitData?.profitMargins?.profitMargin || 0}%
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>{t('admin.reports.financial.customerMetrics.title', 'Customer Metrics')}</CardTitle>
                <CardDescription>{t('admin.reports.financial.customerMetrics.description', 'Customer analysis data')}</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {profitData?.customers?.byRole?.map((role, index) => (
                    <div key={index} className="flex justify-between">
                      <span>{t('admin.reports.financial.customerMetrics.roleUsers', '{{role}} Users:', { role: role.role })}</span>
                      <span className="font-bold">{role.customer_count}</span>
                    </div>
                  ))}
                  <div className="border-t pt-2">
                    <div className="flex justify-between">
                      <span>{t('admin.reports.financial.customerMetrics.avgValue', 'Avg. Customer Value:')}</span>
                      <span className="font-bold">
                        {formatPrice(profitData?.customers?.summary?.averageCustomerValue)}
                      </span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>{t('admin.reports.financial.revenueForecast.title', 'Revenue Forecast')}</CardTitle>
                <CardDescription>{t('admin.reports.financial.revenueForecast.description', 'Next 7 days prediction')}</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {profitData?.forecast?.forecast?.slice(0, 3).map((day, index) => (
                    <div key={index} className="flex justify-between text-sm">
                      <span>{new Date(day.date).toLocaleDateString()}</span>
                      <span>{formatPrice(day.predictedRevenue)}</span>
                    </div>
                  ))}
                  <div className="border-t pt-2 text-xs text-gray-500">
                    {t('admin.reports.financial.revenueForecast.methodology', 'Based on {{method}} method', {
                      method: profitData?.forecast?.methodology
                    })}
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Revenue Chart */}
          <BarChart
            title={t('admin.reports.charts.revenueTrendAnalysis.title', 'Revenue Trend Analysis')}
            description={t('admin.reports.charts.revenueTrendAnalysis.description', 'Detailed revenue analysis for selected period')}
            data={revenueChartData}
            height={400}
          />
        </TabsContent>

        <TabsContent value="technical" className="space-y-6">
          {/* Technical Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>{t('admin.reports.technical.performance.title', 'System Performance')}</CardTitle>
                <CardDescription>{t('admin.reports.technical.performance.description', 'Technical system metrics')}</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex justify-between">
                    <span>{t('admin.reports.technical.performance.totalUsers', 'Total Users:')}</span>
                    <span className="font-bold">
                      {profitData?.customers?.summary?.totalCustomers?.toLocaleString() || '0'}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>{t('admin.reports.technical.performance.activeDevices', 'Active Devices:')}</span>
                    <span className="font-bold">{reportData?.report?.[0]?.active_devices || 0}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>{t('admin.reports.technical.performance.dataPoints', 'Data Points:')}</span>
                    <span className="font-bold">
                      {reportData?.report?.reduce((sum, item) => sum + (item.reading_count || 0), 0) || 0}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>{t('admin.reports.technical.dataQuality.title', 'Data Quality')}</CardTitle>
                <CardDescription>{t('admin.reports.technical.dataQuality.description', 'Data integrity and completeness')}</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex justify-between">
                    <span>{t('admin.reports.technical.dataQuality.completeness', 'Data Completeness:')}</span>
                    <span className="font-bold text-green-600">98.5%</span>
                  </div>
                  <div className="flex justify-between">
                    <span>{t('admin.reports.technical.dataQuality.errorRate', 'Error Rate:')}</span>
                    <span className="font-bold text-red-600">0.2%</span>
                  </div>
                  <div className="flex justify-between">
                    <span>{t('admin.reports.technical.dataQuality.uptime', 'Uptime:')}</span>
                    <span className="font-bold text-green-600">99.8%</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* System Chart */}
          <LineChart
            title={t('admin.reports.technical.systemActivity.title', 'System Activity')}
            description={t('admin.reports.technical.systemActivity.description', 'System performance over time')}
            data={getChartData()}
            height={400}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}
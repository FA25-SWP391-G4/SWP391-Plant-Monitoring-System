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

export default function AdminReportsPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
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
          <p className="mt-4 text-gray-600">Loading reports...</p>
        </div>
      </div>
    );
  }

  if (!user || (user.role !== 'Admin' && user.role !== 'ADMIN')) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle className="text-destructive">Access Denied</CardTitle>
            <CardDescription>You do not have permission to access this page.</CardDescription>
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
          <h1 className="text-3xl font-bold text-gray-900">System Reports</h1>
          <p className="mt-2 text-gray-600">
            Comprehensive analytics and reporting dashboard
          </p>
        </div>
        <div className="flex space-x-3">
          <Button variant="outline" onClick={() => handleDownloadReport('csv')}>
            <Download className="w-4 h-4 mr-2" />
            Download CSV
          </Button>
          <Button variant="outline" onClick={fetchReportData}>
            <RefreshCw className="w-4 h-4 mr-2" />
            Refresh
          </Button>
        </div>
      </div>

      {/* Controls */}
      <div className="flex space-x-4">
        <Select value={selectedPeriod} onValueChange={setSelectedPeriod}>
          <SelectTrigger className="w-40">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="day">Last Day</SelectItem>
            <SelectItem value="week">Last Week</SelectItem>
            <SelectItem value="month">Last Month</SelectItem>
            <SelectItem value="year">Last Year</SelectItem>
          </SelectContent>
        </Select>
        
        <Select value={selectedReportType} onValueChange={setSelectedReportType}>
          <SelectTrigger className="w-40">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="users">User Reports</SelectItem>
            <SelectItem value="devices">Device Reports</SelectItem>
            <SelectItem value="sensors">Sensor Reports</SelectItem>
            <SelectItem value="watering">Watering Reports</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="financial">Financial</TabsTrigger>
          <TabsTrigger value="technical">Technical</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          {/* Key Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <StatCard
              title="Revenue"
              value={`$${profitData?.revenue?.summary?.totalRevenue?.toFixed(2) || '0.00'}`}
              description="Total revenue for period"
              icon={TrendingUp}
              color="green"
            />
            <StatCard
              title="Customers"
              value={profitData?.customers?.summary?.totalCustomers?.toLocaleString() || '0'}
              description={`${profitData?.customers?.summary?.conversionRate || 0}% conversion rate`}
              icon={Users}
              color="blue"
            />
            <StatCard
              title="Devices"
              value={reportData?.report?.[0]?.total_devices || '0'}
              description={`${reportData?.report?.[0]?.active_devices || 0} active`}
              icon={Smartphone}
              color="purple"
            />
            <StatCard
              title="Avg. Customer Value"
              value={`$${profitData?.customers?.summary?.averageCustomerValue?.toFixed(2) || '0.00'}`}
              description="Revenue per customer"
              icon={Droplets}
              color="orange"
            />
          </div>

          {/* Charts */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <LineChart
              title={`${selectedReportType.charAt(0).toUpperCase() + selectedReportType.slice(1)} Trend`}
              description={`${selectedReportType} data for the last ${selectedPeriod}`}
              data={getChartData()}
              height={300}
            />
            <BarChart
              title="Revenue Distribution"
              description="Daily revenue breakdown"
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
                <CardTitle>Revenue Breakdown</CardTitle>
                <CardDescription>Financial performance metrics</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex justify-between">
                    <span>Total Revenue:</span>
                    <span className="font-bold">${profitData?.profitMargins?.revenue?.toFixed(2) || '0.00'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Operating Costs:</span>
                    <span className="font-bold">${profitData?.profitMargins?.totalCosts?.toFixed(2) || '0.00'}</span>
                  </div>
                  <div className="flex justify-between border-t pt-2">
                    <span>Gross Profit:</span>
                    <span className="font-bold text-green-600">
                      ${profitData?.profitMargins?.grossProfit?.toFixed(2) || '0.00'}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Profit Margin:</span>
                    <span className="font-bold">
                      {profitData?.profitMargins?.profitMargin || 0}%
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Customer Metrics</CardTitle>
                <CardDescription>Customer analysis data</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {profitData?.customers?.byRole?.map((role, index) => (
                    <div key={index} className="flex justify-between">
                      <span>{role.role} Users:</span>
                      <span className="font-bold">{role.customer_count}</span>
                    </div>
                  ))}
                  <div className="border-t pt-2">
                    <div className="flex justify-between">
                      <span>Avg. Customer Value:</span>
                      <span className="font-bold">
                        ${profitData?.customers?.summary?.averageCustomerValue?.toFixed(2) || '0.00'}
                      </span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Revenue Forecast</CardTitle>
                <CardDescription>Next 7 days prediction</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {profitData?.forecast?.forecast?.slice(0, 3).map((day, index) => (
                    <div key={index} className="flex justify-between text-sm">
                      <span>{new Date(day.date).toLocaleDateString()}</span>
                      <span>${day.predictedRevenue}</span>
                    </div>
                  ))}
                  <div className="border-t pt-2 text-xs text-gray-500">
                    Based on {profitData?.forecast?.methodology} method
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Revenue Chart */}
          <BarChart
            title="Revenue Trend Analysis"
            description="Detailed revenue analysis for selected period"
            data={revenueChartData}
            height={400}
          />
        </TabsContent>

        <TabsContent value="technical" className="space-y-6">
          {/* Technical Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>System Performance</CardTitle>
                <CardDescription>Technical system metrics</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex justify-between">
                    <span>Total Users:</span>
                    <span className="font-bold">
                      {reportData?.report?.reduce((sum, item) => sum + (item.new_users || 0), 0) || 0}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Active Devices:</span>
                    <span className="font-bold">{reportData?.report?.[0]?.active_devices || 0}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Data Points:</span>
                    <span className="font-bold">
                      {reportData?.report?.reduce((sum, item) => sum + (item.reading_count || 0), 0) || 0}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Data Quality</CardTitle>
                <CardDescription>Data integrity and completeness</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex justify-between">
                    <span>Data Completeness:</span>
                    <span className="font-bold text-green-600">98.5%</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Error Rate:</span>
                    <span className="font-bold text-red-600">0.2%</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Uptime:</span>
                    <span className="font-bold text-green-600">99.8%</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* System Chart */}
          <LineChart
            title="System Activity"
            description="System performance over time"
            data={getChartData()}
            height={400}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}
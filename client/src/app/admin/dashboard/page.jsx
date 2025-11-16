'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/providers/AuthProvider';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Users, Settings, BarChart3, Shield, Database, FileText, DollarSign, Activity, Smartphone, RefreshCw } from 'lucide-react';
import StatCard from '@/components/admin/StatCard';
import LineChart from '@/components/admin/LineChart';
import DoughnutChart from '@/components/admin/DoughnutChart';
import BarChart from '@/components/admin/BarChart';
import axiosClient from '@/api/axiosClient';
import { useTranslation } from 'react-i18next';

/**
 * Admin Dashboard Page
 * Comprehensive administrative control panel for system management
 */
export default function AdminDashboard() {
  const router = useRouter();
  const { user, loading } = useAuth();
  const { t } = useTranslation();
  const [dashboardData, setDashboardData] = useState(null);
  const [profitData, setProfitData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    // Redirect non-admin users
    if (!loading && user && user.role !== 'Admin' && user.role !== 'ADMIN') {
      console.log('[ADMIN DASHBOARD] Non-admin user detected, redirecting to regular dashboard');
      router.push('/dashboard');
    }
  }, [user, loading, router]);

  useEffect(() => {
    if (user && (user.role === 'Admin' || user.role === 'ADMIN')) {
      fetchDashboardData();
    }
  }, [user, refreshKey]);

  const fetchDashboardData = async () => {
    try {
      setIsLoading(true);
      
      // Fetch dashboard and profit data in parallel
      const [dashboardResponse, profitResponse] = await Promise.all([
        axiosClient.get('/api/admin/dashboard'),
        axiosClient.get('/api/admin/profit-analysis?period=month')
      ]);

      setDashboardData(dashboardResponse.data.data);
      setProfitData(profitResponse.data.data);
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleRefresh = () => {
    setRefreshKey(prev => prev + 1);
  };

  if (loading || isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">{t('admin.dashboard.loading', 'Loading admin dashboard...')}</p>
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
          <CardContent>
            <Button onClick={() => router.push('/dashboard')} className="w-full">
              {t('admin.common.returnToDashboard', 'Return to Dashboard')}
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const adminFeatures = [
    {
      title: t('admin.dashboard.features.userManagement.title', 'User Management'),
      description: t('admin.dashboard.features.userManagement.description', 'Manage users, roles, and permissions'),
      icon: Users,
      href: '/admin/users',
      color: 'text-blue-600',
      bgColor: 'bg-blue-50',
    },
    {
      title: t('admin.dashboard.features.systemReports.title', 'System Reports'),
      description: t('admin.dashboard.features.systemReports.description', 'View system-wide analytics and reports'),
      icon: BarChart3,
      href: '/admin/reports',
      color: 'text-green-600',
      bgColor: 'bg-green-50',
    },
    {
      title: t('admin.dashboard.features.globalSettings.title', 'Global Settings'),
      description: t('admin.dashboard.features.globalSettings.description', 'Configure system-wide settings'),
      icon: Settings,
      href: '/admin/settings',
      color: 'text-purple-600',
      bgColor: 'bg-purple-50',
    },
    {
      title: t('admin.dashboard.features.security.title', 'Security & Logs'),
      description: t('admin.dashboard.features.security.description', 'Monitor system logs and security'),
      icon: Shield,
      href: '/admin/security',
      color: 'text-red-600',
      bgColor: 'bg-red-50',
    },
    {
      title: t('admin.dashboard.features.database.title', 'Database Management'),
      description: t('admin.dashboard.features.database.description', 'Backup, restore, and manage data'),
      icon: Database,
      href: '/admin/database',
      color: 'text-indigo-600',
      bgColor: 'bg-indigo-50',
    },
    {
      title: t('admin.dashboard.features.content.title', 'Content Management'),
      description: t('admin.dashboard.features.content.description', 'Manage multi-language content'),
      icon: FileText,
      href: '/admin/content',
      color: 'text-orange-600',
      bgColor: 'bg-orange-50',
    },
  ];

  const formatPrice = (price, locale = 'vi-VN', currency = 'VND') => {
    return new Intl.NumberFormat(locale, {
      style: 'currency',
      currency: currency,
    }).format(price);
  }

  const buildMonthlyTimeline = (entries) => {
    if (!Array.isArray(entries) || !entries.length) return null;

    const sortedEntries = [...entries]
      .filter((item) => item?.date)
      .sort((a, b) => new Date(a.date) - new Date(b.date));

    if (!sortedEntries.length) return null;

    const baseDate = new Date(sortedEntries[0].date);
    if (Number.isNaN(baseDate)) return null;

    const targetMonth = baseDate.getMonth();
    const targetYear = baseDate.getFullYear();
    const daysInMonth = new Date(targetYear, targetMonth + 1, 0).getDate();

    const dayMap = sortedEntries.reduce((acc, entry) => {
      const entryDate = new Date(entry.date);
      if (
        !Number.isNaN(entryDate) &&
        entryDate.getMonth() === targetMonth &&
        entryDate.getFullYear() === targetYear
      ) {
        acc[entryDate.getDate()] = entry;
      }
      return acc;
    }, {});

    return {
      labels: Array.from({ length: daysInMonth }, (_, idx) => `${idx + 1}`),
      dayMap,
    };
  };

  const buildDatasetValues = (timeline, key) => {
    if (!timeline) return null;
    return timeline.labels.map((_, idx) => timeline.dayMap[idx + 1]?.[key] ?? 0);
  };

  // Prepare chart data
  const userGrowthTimeline = buildMonthlyTimeline(dashboardData?.users?.growth);

  const userGrowthChartData = {
    labels:
      userGrowthTimeline?.labels ||
      dashboardData?.users?.growth?.map(item => 
        new Date(item.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
      ) || [],
    datasets: [
      {
        label: 'New Users',
        data:
          buildDatasetValues(userGrowthTimeline, 'new_users') ||
          dashboardData?.users?.growth?.map(item => item.new_users) || [],
        borderColor: 'rgb(59, 130, 246)',
        backgroundColor: 'rgba(59, 130, 246, 0.1)',
        tension: 0.3,
      },
      {
        label: 'Premium Users',
        data:
          buildDatasetValues(userGrowthTimeline, 'new_premium_users') ||
          dashboardData?.users?.growth?.map(item => item.new_premium_users) || [],
        borderColor: 'rgb(22, 163, 74)',
        backgroundColor: 'rgba(16, 185, 129, 0.1)',
        tension: 0.3,
      },
      {
        label: 'Ultimate Users',
        data:
          buildDatasetValues(userGrowthTimeline, 'new_ultimate_users') ||
          dashboardData?.users?.growth?.map(item => item.new_ultimate_users) || [],
        borderColor: 'rgb(134, 46, 212)',
        backgroundColor: 'rgba(234, 179, 8, 0.1)',
        tension: 0.3,
      },
    ],
  };

  const deviceStatusChartData = {
    labels: ['Online', 'Offline'],
    datasets: [
      {
        data: [
          dashboardData?.devices?.active || 0,
          (dashboardData?.devices?.total || 0) - (dashboardData?.devices?.active || 0)
        ],
        backgroundColor: ['#10B981', '#EF4444'],
        borderColor: ['#059669', '#DC2626'],
        borderWidth: 2,
      },
    ],
  };

  const revenueChartData = {
    labels: profitData?.revenue?.periodData?.map(item => 
      new Date(item.period).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
    ) || [],
    datasets: [
      {
        label: t('admin.dashboard.charts.revenueDataset', 'Daily Revenue ($)'),
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
          <h1 className="text-3xl font-bold text-gray-900">{t('admin.dashboard.header.title', 'Admin Dashboard')}</h1>
          <p className="mt-2 text-gray-600">
            {t('admin.dashboard.header.subtitle', 'Welcome back, {{name}}', {
              name: user.given_name || user.full_name || t('admin.dashboard.header.defaultName', 'Administrator')
            })}
          </p>
        </div>
        <div className="flex space-x-3">
          <Button variant="outline" onClick={handleRefresh}>
            <RefreshCw className="w-4 h-4 mr-2" />
            {t('admin.common.refresh', 'Refresh')}
          </Button>
          <Button variant="outline" onClick={() => router.push('/dashboard')}>
            {t('admin.dashboard.header.viewUserDashboard', 'View User Dashboard')}
          </Button>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title={t('admin.dashboard.metrics.totalUsers.title', 'Total Users')}
          value={dashboardData?.users?.total?.toLocaleString() || '0'}
          description={t('admin.dashboard.metrics.totalUsers.description', '{{value}}% premium users', {
            value: dashboardData?.users?.percentagePremium || 0
          })}
          icon={Users}
          color="blue"
        />
        <StatCard
          title={t('admin.dashboard.metrics.activeDevices.title', 'Active Devices')}
          value={`${dashboardData?.devices?.active || 0}/${dashboardData?.devices?.total || 0}`}
          description={t('admin.dashboard.metrics.activeDevices.description', '{{value}}% online', {
            value: dashboardData?.devices?.percentageActive || 0
          })}
          icon={Smartphone}
          color="green"
        />
        <StatCard
          title={t('admin.dashboard.metrics.monthlyRevenue.title', 'Monthly Revenue')}
          value={formatPrice(profitData?.revenue?.summary?.totalRevenue || 0)}
          description={t('admin.dashboard.metrics.monthlyRevenue.description', '{{value}} transactions', {
            value: profitData?.revenue?.summary?.totalTransactions || 0
          })}
          icon={DollarSign}
          color="purple"
        />
        <StatCard
          title={t('admin.dashboard.metrics.systemHealth.title', 'System Health')}
          value={Object.values(dashboardData?.systemHealth || {}).filter(Boolean).length}
          description={t('admin.dashboard.metrics.systemHealth.description', '{{value}} services monitored', {
            value: Object.keys(dashboardData?.systemHealth || {}).length
          })}
          icon={Activity}
          color="indigo"
        />
      </div>

      {/* Charts Row 1 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <LineChart
          title={t('admin.dashboard.charts.userGrowth.title', 'User Growth Trend')}
          description={t('admin.dashboard.charts.userGrowth.description', 'Daily new user registrations and premium upgrades')}
          data={userGrowthChartData}
          height={300}
        />
        <DoughnutChart
          title={t('admin.dashboard.charts.deviceStatus.title', 'Device Status')}
          description={t('admin.dashboard.charts.deviceStatus.description', 'Current online/offline device distribution')}
          data={deviceStatusChartData}
          height={300}
        />
      </div>

      {/* Charts Row 2 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <BarChart
          title={t('admin.dashboard.charts.revenueTrend.title', 'Revenue Trend')}
          description={t('admin.dashboard.charts.revenueTrend.description', 'Daily revenue for the last 30 days')}
          data={revenueChartData}
          height={300}
        />
        
        {/* System Health Status */}
        <Card>
          <CardHeader>
            <CardTitle>{t('admin.dashboard.sections.systemHealth.title', 'System Health Status')}</CardTitle>
            <CardDescription>{t('admin.dashboard.sections.systemHealth.description', 'Current status of all system components')}</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {Object.entries(dashboardData?.systemHealth || {}).map(([service, status]) => (
                <div key={service} className="flex items-center justify-between">
                  <span className="capitalize font-medium">{service}</span>
                  <div className={`w-3 h-3 rounded-full ${status ? 'bg-green-500' : 'bg-red-500'}`} />
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Admin Features Grid */}
      <div>
        <h2 className="text-2xl font-bold text-gray-900 mb-6">{t('admin.dashboard.sections.adminTools.title', 'Administrative Tools')}</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {adminFeatures.map((feature) => {
            const Icon = feature.icon;
            return (
              <Card
                key={feature.href}
                className="hover:shadow-lg transition-shadow cursor-pointer"
                onClick={() => router.push(feature.href)}
              >
                <CardHeader>
                  <div className={`w-12 h-12 rounded-lg ${feature.bgColor} flex items-center justify-center mb-4`}>
                    <Icon className={`w-6 h-6 ${feature.color}`} />
                  </div>
                  <CardTitle className="text-lg">{feature.title}</CardTitle>
                  <CardDescription>{feature.description}</CardDescription>
                </CardHeader>
                <CardContent>
                  <Button variant="ghost" className="w-full justify-start">
                    {t('admin.dashboard.sections.adminTools.access', 'Access {{tool}} →', { tool: feature.title })}
                  </Button>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>

      {/* Recent Errors */}
      {dashboardData?.recentErrors && dashboardData.recentErrors.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>{t('admin.dashboard.sections.recentErrors.title', 'Recent System Errors')}</CardTitle>
            <CardDescription>{t('admin.dashboard.sections.recentErrors.description', 'Latest error events that require attention')}</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {dashboardData.recentErrors.slice(0, 5).map((error, index) => (
                <div key={index} className="flex items-start justify-between border-b pb-3 last:border-b-0">
                  <div>
                    <p className="font-medium text-red-600">{error.source}</p>
                    <p className="text-sm text-gray-600">{error.message}</p>
                  </div>
                  <span className="text-xs text-gray-400">
                    {new Date(error.timestamp).toLocaleString()}
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Financial Summary */}
      {profitData && (
        <Card>
          <CardHeader>
            <CardTitle>{t('admin.dashboard.sections.financialOverview.title', 'Financial Overview')}</CardTitle>
            <CardDescription>{t('admin.dashboard.sections.financialOverview.description', 'Key financial metrics and profit analysis')}</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">
                  {formatPrice(profitData.profitMargins?.grossProfit || 0)}
                </div>
                <div className="text-sm text-gray-500">Gross Profit</div>
                <div className="text-xs text-gray-400">
                  {profitData.profitMargins?.profitMargin || 0}% margin
                </div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600">
                  {formatPrice(profitData.profitMargins?.revenue || 0)}
                </div>
                <div className="text-sm text-gray-500">Total Revenue</div>
                <div className="text-xs text-gray-400">
                  {formatPrice(profitData.profitMargins?.revenuePerCustomer || 0)} per customer
                </div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-orange-600">
                  {formatPrice(profitData.profitMargins?.totalCosts || 0)}
                </div>
                <div className="text-sm text-gray-500">Operating Costs</div>
                <div className="text-xs text-gray-400">
                  Fixed + Variable costs
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

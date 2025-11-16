'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/providers/AuthProvider';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { Loader2, RefreshCw, Search } from 'lucide-react';
import adminApi from '@/api/adminApi';
import { toast } from 'sonner';
import axiosClient from '@/api/axiosClient';
import { useTranslation } from 'react-i18next';

const statusStyles = {
  online: 'bg-green-100 text-green-800',
  offline: 'bg-red-100 text-red-800',
  maintenance: 'bg-yellow-100 text-yellow-800',
  pending: 'bg-blue-100 text-blue-800',
};

const getStatusBadgeClass = (status) => {
  const key = status?.toLowerCase();
  return statusStyles[key] || 'bg-gray-100 text-gray-800';
};

const extractList = (response, key) => {
  if (Array.isArray(response)) return response;
  if (Array.isArray(response?.data)) return response.data;
  if (Array.isArray(response?.data?.data?.[key])) return response.data.data[key];
  if (Array.isArray(response?.data?.data)) return response.data.data;
  return [];
};

export default function AdminDevicesPage() {
  const router = useRouter();
  const { user, loading } = useAuth();
  const { t } = useTranslation();

  const [devices, setDevices] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  useEffect(() => {
    if (!loading && user && user.role !== 'Admin' && user.role !== 'ADMIN') {
      router.push('/dashboard');
    }
  }, [user, loading, router]);

  const fetchDevices = async () => {
    try {
      setIsLoading(true);
      const [deviceResponse] = await Promise.all([
        axiosClient.get('/api/admin/devices'),
      ]);
      // Defensive: ensure devices is always an array
      const deviceList = Array.isArray(deviceResponse.data.data.devices)
        ? deviceResponse.data.data.devices
          : [];
      setDevices(deviceList);
    } catch (error) {
      console.error('Failed to load devices:', error);
      toast.error('Failed to load devices');
      setDevices([]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (user && (user.role === 'Admin' || user.role === 'ADMIN')) {
      fetchDevices();
    }
  }, [user]);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await fetchDevices();
    setIsRefreshing(false);
  };

  const filteredDevices = useMemo(() => {
    return devices.filter((device) => {
      const matchesSearch = searchQuery
        ? (device.device_name || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
          (device.device_key || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
          (device.owner_name || '').toLowerCase().includes(searchQuery.toLowerCase())
        : true;

      const matchesStatus =
        statusFilter === 'all' ? true : (device.status || 'unknown').toLowerCase() === statusFilter;

      return matchesSearch && matchesStatus;
    });
  }, [devices, searchQuery, statusFilter]);

  if (loading || isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-emerald-600" />
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

  return (
    <div className="container mx-auto px-4 py-8 space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">{t('admin.devices.title', 'Device Management')}</h1>
          <p className="mt-2 text-gray-600">{t('admin.devices.subtitle', 'Monitor, filter, and audit all plant monitoring devices')}</p>
        </div>
        <Button onClick={handleRefresh} variant="outline" disabled={isRefreshing} className="flex items-center gap-2">
          <RefreshCw className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
          {t('admin.common.refresh', 'Refresh')}
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{t('admin.devices.filters.title', 'Filters')}</CardTitle>
          <CardDescription>{t('admin.devices.filters.description', 'Search across device name, key, or owner, and filter by status.')}</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          <div className="relative">
            <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
            <Input
              placeholder={t('admin.devices.filters.searchPlaceholder', 'Search by name, key, or owner')}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="rounded-lg border border-gray-200 px-3 py-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500"
          >
            <option value="all">{t('admin.devices.filters.status.all', 'All statuses')}</option>
            <option value="online">{t('admin.devices.filters.status.online', 'Online')}</option>
            <option value="offline">{t('admin.devices.filters.status.offline', 'Offline')}</option>
            <option value="maintenance">{t('admin.devices.filters.status.maintenance', 'Maintenance')}</option>
            <option value="pending">{t('admin.devices.filters.status.pending', 'Pending Activation')}</option>
          </select>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>
            {t('admin.devices.table.title', 'Devices ({{count}})', { count: filteredDevices.length })}
          </CardTitle>
          <CardDescription>{t('admin.devices.table.description', 'Overview of every registered IoT device in the system.')}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b text-left text-xs uppercase tracking-wide text-gray-500">
                  <th className="py-3 pr-4">{t('admin.devices.table.headers.device', 'Device')}</th>
                  <th className="py-3 pr-4">{t('admin.devices.table.headers.owner', 'Owner')}</th>
                  <th className="py-3 pr-4">{t('admin.devices.table.headers.status', 'Status')}</th>
                  <th className="py-3 pr-4">{t('admin.devices.table.headers.lastSeen', 'Last Seen')}</th>
                  <th className="py-3 pr-4">{t('admin.devices.table.headers.created', 'Created')}</th>
                  <th className="py-3 pr-4 text-right">{t('admin.devices.table.headers.key', 'Key')}</th>
                </tr>
              </thead>
              <tbody>
                {filteredDevices.map((device) => (
                  <tr key={device.device_key} className="border-b last:border-b-0">
                    <td className="py-4 pr-4">
                      <div className="font-medium text-gray-900">{device.device_name || t('admin.devices.table.unnamedDevice', 'Unnamed Device')}</div>
                      <div className="text-xs text-gray-500">{device.device_type || t('admin.devices.table.defaultType', 'Sensor')}</div>
                    </td>
                    <td className="py-4 pr-4">
                      {device.owner_name || device.user_id || t('admin.devices.table.unassigned', 'Unassigned')}
                    </td>
                    <td className="py-4 pr-4">
                      <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-medium ${getStatusBadgeClass(device.status)}`}>
                        {(device.status || 'Unknown').toUpperCase()}
                      </span>
                    </td>
                    <td className="py-4 pr-4 text-gray-600">
                      {device.last_seen ? new Date(device.last_seen).toLocaleString() : '—'}
                    </td>
                    <td className="py-4 pr-4 text-gray-600">
                      {device.created_at ? new Date(device.created_at).toLocaleDateString() : '—'}
                    </td>
                    <td className="py-4 pl-4 text-right font-mono text-xs text-gray-500">
                      {device.device_key || 'N/A'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {!filteredDevices.length && (
              <div className="py-12 text-center text-sm text-gray-500">
                {t('admin.devices.table.empty', 'No devices match your current filters.')}
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
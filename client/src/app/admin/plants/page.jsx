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

const statusClasses = {
  healthy: 'bg-green-100 text-green-800',
  warning: 'bg-amber-100 text-amber-800',
  critical: 'bg-red-100 text-red-800',
  dormant: 'bg-blue-100 text-blue-800',
};

const getStatusClass = (status) => {
  const key = status?.toLowerCase();
  return statusClasses[key] || 'bg-gray-100 text-gray-800';
};

const extractList = (response, key) => {
  if (Array.isArray(response)) return response;
  if (Array.isArray(response?.data)) return response.data;
  if (Array.isArray(response?.data?.data?.[key])) return response.data.data[key];
  if (Array.isArray(response?.data?.data)) return response.data.data;
  return [];
};

export default function AdminPlantsPage() {
  const router = useRouter();
  const { user, loading } = useAuth();
  const { t } = useTranslation();

  const [plants, setPlants] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  useEffect(() => {
    if (!loading && user && user.role !== 'Admin' && user.role !== 'ADMIN') {
      router.push('/dashboard');
    }
  }, [user, loading, router]);

  const fetchPlants = async () => {
    try {
      setIsLoading(true);
      const [plantResponse] = await Promise.all([
        axiosClient.get('/api/admin/plants'),
      ]);
      // Defensive: ensure plants is always an array
      const plantList = Array.isArray(plantResponse.data.data.plants)
        ? plantResponse.data.data.plants
          : [];
      setPlants(plantList);
    } catch (error) {
      console.error('Failed to load plants:', error);
      toast.error('Failed to load plants');
      setPlants([]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (user && (user.role === 'Admin' || user.role === 'ADMIN')) {
      fetchPlants();
    }
  }, [user]);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await fetchPlants();
    setIsRefreshing(false);
  };

  const filteredPlants = useMemo(() => {
    return plants.filter((plant) => {
      const matchesSearch = searchQuery
        ? (plant.custom_name || plant.name || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
          (plant.species_name || plant.species || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
          (plant.owner_name || '').toLowerCase().includes(searchQuery.toLowerCase())
        : true;

      const matchesStatus =
        statusFilter === 'all' ? true : (plant.status || 'unknown').toLowerCase() === statusFilter;

      return matchesSearch && matchesStatus;
    });
  }, [plants, searchQuery, statusFilter]);

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
          <h1 className="text-3xl font-bold text-gray-900">{t('admin.plants.title', 'Plant Management')}</h1>
          <p className="mt-2 text-gray-600">{t('admin.plants.subtitle', 'Review every registered plant and its associated owner/device.')}</p>
        </div>
        <Button onClick={handleRefresh} variant="outline" disabled={isRefreshing} className="flex items-center gap-2">
          <RefreshCw className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
          {t('admin.common.refresh', 'Refresh')}
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{t('admin.plants.filters.title', 'Filters')}</CardTitle>
          <CardDescription>{t('admin.plants.filters.description', 'Search by plant name, species, or owner and narrow by health status.')}</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          <div className="relative">
            <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
            <Input
              placeholder={t('admin.plants.filters.searchPlaceholder', 'Search by name, species, or owner')}
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
            <option value="all">{t('admin.plants.filters.status.all', 'All statuses')}</option>
            <option value="healthy">{t('admin.plants.filters.status.healthy', 'Healthy')}</option>
            <option value="warning">{t('admin.plants.filters.status.warning', 'Warning')}</option>
            <option value="critical">{t('admin.plants.filters.status.critical', 'Critical')}</option>
            <option value="dormant">{t('admin.plants.filters.status.dormant', 'Dormant')}</option>
          </select>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>{t('admin.plants.table.title', 'Plants ({{count}})', { count: filteredPlants.length })}</CardTitle>
          <CardDescription>{t('admin.plants.table.description', 'Complete view of every plant synced to the platform.')}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b text-left text-xs uppercase tracking-wide text-gray-500">
                  <th className="py-3 pr-4">{t('admin.plants.table.headers.plant', 'Plant')}</th>
                  <th className="py-3 pr-4">{t('admin.plants.table.headers.owner', 'Owner')}</th>
                  <th className="py-3 pr-4">{t('admin.plants.table.headers.device', 'Device')}</th>
                  <th className="py-3 pr-4">{t('admin.plants.table.headers.status', 'Status')}</th>
                  <th className="py-3 pr-4">{t('admin.plants.table.headers.lastWatered', 'Last Watered')}</th>
                  <th className="py-3 pr-4">{t('admin.plants.table.headers.created', 'Created')}</th>
                </tr>
              </thead>
              <tbody>
                {filteredPlants.map((plant) => (
                  <tr key={plant.plant_id || plant.id} className="border-b last:border-b-0">
                    <td className="py-4 pr-4">
                      <div className="font-medium text-gray-900">{plant.custom_name || plant.name || t('admin.plants.table.unnamed', 'Unnamed Plant')}</div>
                      <div className="text-xs text-gray-500">{plant.species_name || plant.species || t('admin.plants.table.unknownSpecies', 'Unknown Species')}</div>
                    </td>
                    <td className="py-4 pr-4">{plant.owner_name || plant.user_id || t('admin.plants.table.unassigned', 'Unassigned')}</td>
                    <td className="py-4 pr-4">
                      <div className="text-sm text-gray-700">{plant.device_name || t('admin.plants.table.noDevice', 'No Device Linked')}</div>
                      <div className="text-xs text-gray-400 font-mono">{plant.device_key || '—'}</div>
                    </td>
                    <td className="py-4 pr-4">
                      <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-medium ${getStatusClass(plant.status)}`}>
                        {(plant.status || 'Unknown').toUpperCase()}
                      </span>
                    </td>
                    <td className="py-4 pr-4 text-gray-600">
                      {plant.last_watered ? new Date(plant.last_watered).toLocaleString() : '—'}
                    </td>
                    <td className="py-4 pr-4 text-gray-600">
                      {plant.created_at ? new Date(plant.created_at).toLocaleDateString() : '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {!filteredPlants.length && (
              <div className="py-12 text-center text-sm text-gray-500">
                {t('admin.plants.table.empty', 'No plants match your current filters.')}
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

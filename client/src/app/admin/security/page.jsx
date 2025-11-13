'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/providers/AuthProvider';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/Select';
import { Badge } from '@/components/ui/Badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Shield, 
  AlertTriangle, 
  Info, 
  XCircle, 
  Search, 
  Filter, 
  Download,
  RefreshCw,
  Trash2,
  Archive,
  Eye
} from 'lucide-react';
import { toast } from 'sonner';
import axiosClient from '@/api/axiosClient';

export default function AdminSecurityPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [logs, setLogs] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterLevel, setFilterLevel] = useState('');
  const [filterSource, setFilterSource] = useState('');
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 50,
    total: 0,
    pages: 0
  });
  const [filters, setFilters] = useState({
    levels: [],
    sources: []
  });

  useEffect(() => {
    if (!loading && user && user.role !== 'Admin' && user.role !== 'ADMIN') {
      router.push('/dashboard');
    }
  }, [user, loading, router]);

  useEffect(() => {
    if (user && (user.role === 'Admin' || user.role === 'ADMIN')) {
      fetchLogs();
    }
  }, [user, pagination.page, filterLevel, filterSource, searchQuery]);

  const fetchLogs = async () => {
    try {
      setIsLoading(true);
      
      const params = new URLSearchParams({
        page: pagination.page.toString(),
        limit: pagination.limit.toString(),
      });
      
      if (filterLevel) params.append('level', filterLevel);
      if (filterSource) params.append('source', filterSource);
      if (searchQuery) params.append('search', searchQuery);

      const response = await axiosClient.get(`/api/admin/logs?${params}`);
      
      setLogs(response.data.data.logs);
      setPagination(prev => ({
        ...prev,
        total: response.data.data.pagination.total,
        pages: response.data.data.pagination.pages
      }));
      setFilters(response.data.data.filters);
    } catch (error) {
      console.error('Error fetching logs:', error);
      toast.error('Failed to load system logs');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteLogs = async (criteria) => {
    if (!confirm('Are you sure you want to delete logs matching these criteria? This action cannot be undone.')) {
      return;
    }

    try {
      await axiosClient.delete('/api/admin/logs', { data: criteria });
      toast.success('Logs deleted successfully');
      fetchLogs();
    } catch (error) {
      console.error('Error deleting logs:', error);
      toast.error('Failed to delete logs');
    }
  };

  const getLogIcon = (level) => {
    switch (level) {
      case 'ERROR':
        return <XCircle className="w-4 h-4 text-red-500" />;
      case 'WARNING':
        return <AlertTriangle className="w-4 h-4 text-yellow-500" />;
      case 'INFO':
        return <Info className="w-4 h-4 text-blue-500" />;
      default:
        return <Shield className="w-4 h-4 text-gray-500" />;
    }
  };

  const getLogBadgeColor = (level) => {
    switch (level) {
      case 'ERROR':
        return 'destructive';
      case 'WARNING':
        return 'secondary';
      case 'INFO':
        return 'default';
      default:
        return 'outline';
    }
  };

  if (loading || isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading security logs...</p>
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

  return (
    <div className="container mx-auto px-4 py-8 space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Security & Logs</h1>
          <p className="mt-2 text-gray-600">
            Monitor system security and audit logs
          </p>
        </div>
        <div className="flex space-x-3">
          <Button variant="outline" onClick={fetchLogs}>
            <RefreshCw className="w-4 h-4 mr-2" />
            Refresh
          </Button>
        </div>
      </div>

      <Tabs defaultValue="logs" className="space-y-6">
        <TabsList>
          <TabsTrigger value="logs">System Logs</TabsTrigger>
          <TabsTrigger value="security">Security Events</TabsTrigger>
          <TabsTrigger value="audit">Audit Trail</TabsTrigger>
        </TabsList>

        <TabsContent value="logs" className="space-y-6">
          {/* Filters */}
          <Card>
            <CardHeader>
              <CardTitle>Filter Logs</CardTitle>
              <CardDescription>Filter and search through system logs</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div>
                  <Input
                    placeholder="Search logs..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full"
                  />
                </div>
                <div>
                  <Select value={filterLevel} onValueChange={setFilterLevel}>
                    <SelectTrigger>
                      <SelectValue placeholder="Log Level" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">All Levels</SelectItem>
                      {filters.levels?.map(level => (
                        <SelectItem key={level} value={level}>{level}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Select value={filterSource} onValueChange={setFilterSource}>
                    <SelectTrigger>
                      <SelectValue placeholder="Source" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">All Sources</SelectItem>
                      {filters.sources?.map(source => (
                        <SelectItem key={source} value={source}>{source}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex space-x-2">
                  <Button variant="outline" onClick={() => {
                    setSearchQuery('');
                    setFilterLevel('');
                    setFilterSource('');
                  }}>
                    Clear
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Log Management Actions */}
          <Card>
            <CardHeader>
              <CardTitle>Log Management</CardTitle>
              <CardDescription>Bulk actions for log management</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex space-x-4">
                <Button
                  variant="outline"
                  onClick={() => handleDeleteLogs({ level: 'INFO', before: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString() })}
                >
                  <Trash2 className="w-4 h-4 mr-2" />
                  Delete Old INFO Logs
                </Button>
                <Button
                  variant="outline"
                  onClick={() => handleDeleteLogs({ before: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString() })}
                >
                  <Archive className="w-4 h-4 mr-2" />
                  Archive Old Logs (30+ days)
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Logs Table */}
          <Card>
            <CardHeader>
              <CardTitle>System Logs</CardTitle>
              <CardDescription>
                Showing {logs.length} of {pagination.total} logs (Page {pagination.page} of {pagination.pages})
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {logs.map((log, index) => (
                  <div
                    key={index}
                    className="border rounded-lg p-4 hover:bg-gray-50 transition-colors"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex items-start space-x-3 flex-1">
                        {getLogIcon(log.log_level)}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center space-x-2 mb-2">
                            <Badge variant={getLogBadgeColor(log.log_level)}>
                              {log.log_level}
                            </Badge>
                            <span className="text-sm text-gray-600">{log.source}</span>
                          </div>
                          <p className="text-sm font-medium text-gray-900 mb-1">
                            {log.message}
                          </p>
                          {log.details && (
                            <div className="bg-gray-100 rounded p-2 mt-2">
                              <code className="text-xs text-gray-700">
                                {JSON.stringify(JSON.parse(log.details), null, 2)}
                              </code>
                            </div>
                          )}
                        </div>
                      </div>
                      <div className="text-xs text-gray-500 ml-4">
                        {new Date(log.timestamp).toLocaleString()}
                        {log.user_id && (
                          <div className="mt-1">User ID: {log.user_id}</div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}

                {/* Pagination */}
                {pagination.pages > 1 && (
                  <div className="flex justify-center items-center space-x-2 mt-6">
                    <Button
                      variant="outline"
                      onClick={() => setPagination(prev => ({ ...prev, page: Math.max(1, prev.page - 1) }))}
                      disabled={pagination.page === 1}
                    >
                      Previous
                    </Button>
                    <span className="text-sm text-gray-600">
                      Page {pagination.page} of {pagination.pages}
                    </span>
                    <Button
                      variant="outline"
                      onClick={() => setPagination(prev => ({ ...prev, page: Math.min(prev.pages, prev.page + 1) }))}
                      disabled={pagination.page === pagination.pages}
                    >
                      Next
                    </Button>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="security" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Security Events</CardTitle>
              <CardDescription>Critical security events and alerts</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {logs.filter(log => log.log_level === 'ERROR' || log.log_level === 'WARNING').map((log, index) => (
                  <div
                    key={index}
                    className="border-l-4 border-red-400 bg-red-50 p-4 rounded-lg"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        {getLogIcon(log.log_level)}
                        <div>
                          <p className="font-medium text-red-800">{log.message}</p>
                          <p className="text-sm text-red-600">{log.source}</p>
                        </div>
                      </div>
                      <span className="text-xs text-red-500">
                        {new Date(log.timestamp).toLocaleString()}
                      </span>
                    </div>
                  </div>
                ))}
                
                {logs.filter(log => log.log_level === 'ERROR' || log.log_level === 'WARNING').length === 0 && (
                  <div className="text-center py-8 text-gray-500">
                    No security events found for the current filters.
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="audit" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Audit Trail</CardTitle>
              <CardDescription>Administrative actions and user activities</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {logs.filter(log => log.source === 'AdminController' || log.source === 'AuthController').map((log, index) => (
                  <div
                    key={index}
                    className="border rounded-lg p-4 bg-blue-50"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <Eye className="w-4 h-4 text-blue-500" />
                        <div>
                          <p className="font-medium text-blue-800">{log.message}</p>
                          <p className="text-sm text-blue-600">
                            {log.source} • User ID: {log.user_id || 'System'}
                          </p>
                        </div>
                      </div>
                      <span className="text-xs text-blue-500">
                        {new Date(log.timestamp).toLocaleString()}
                      </span>
                    </div>
                  </div>
                ))}
                
                {logs.filter(log => log.source === 'AdminController' || log.source === 'AuthController').length === 0 && (
                  <div className="text-center py-8 text-gray-500">
                    No audit events found for the current filters.
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
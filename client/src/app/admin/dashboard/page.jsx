'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/providers/AuthProvider';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Users, Settings, BarChart3, Shield, Database, FileText } from 'lucide-react';

/**
 * Admin Dashboard Page
 * Administrative control panel for system management
 */
export default function AdminDashboard() {
  const router = useRouter();
  const { user, loading } = useAuth();

  useEffect(() => {
    // Redirect non-admin users
    if (!loading && user && user.role !== 'Admin' && user.role !== 'ADMIN') {
      console.log('[ADMIN DASHBOARD] Non-admin user detected, redirecting to regular dashboard');
      router.push('/dashboard');
    }
  }, [user, loading, router]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading admin dashboard...</p>
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
          <CardContent>
            <Button onClick={() => router.push('/dashboard')} className="w-full">
              Return to Dashboard
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const adminFeatures = [
    {
      title: 'User Management',
      description: 'Manage users, roles, and permissions',
      icon: Users,
      href: '/admin/users',
      color: 'text-blue-600',
      bgColor: 'bg-blue-50',
    },
    {
      title: 'System Reports',
      description: 'View system-wide analytics and reports',
      icon: BarChart3,
      href: '/admin/reports',
      color: 'text-green-600',
      bgColor: 'bg-green-50',
    },
    {
      title: 'Global Settings',
      description: 'Configure system-wide settings',
      icon: Settings,
      href: '/admin/settings',
      color: 'text-purple-600',
      bgColor: 'bg-purple-50',
    },
    {
      title: 'Security & Logs',
      description: 'Monitor system logs and security',
      icon: Shield,
      href: '/admin/security',
      color: 'text-red-600',
      bgColor: 'bg-red-50',
    },
    {
      title: 'Database Management',
      description: 'Backup, restore, and manage data',
      icon: Database,
      href: '/admin/database',
      color: 'text-indigo-600',
      bgColor: 'bg-indigo-50',
    },
    {
      title: 'Content Management',
      description: 'Manage multi-language content',
      icon: FileText,
      href: '/admin/content',
      color: 'text-orange-600',
      bgColor: 'bg-orange-50',
    },
  ];

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Admin Dashboard</h1>
            <p className="mt-2 text-gray-600">
              Welcome back, {user.given_name || user.full_name || 'Administrator'}
            </p>
          </div>
          <Button variant="outline" onClick={() => router.push('/dashboard')}>
            View User Dashboard
          </Button>
        </div>
      </div>

      {/* Admin Features Grid */}
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
                  Access {feature.title} →
                </Button>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Quick Stats */}
      <div className="mt-8 grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Total Users</CardDescription>
            <CardTitle className="text-3xl">1,234</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Active Sessions</CardDescription>
            <CardTitle className="text-3xl">156</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>System Health</CardDescription>
            <CardTitle className="text-3xl text-green-600">98%</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Premium Users</CardDescription>
            <CardTitle className="text-3xl">342</CardTitle>
          </CardHeader>
        </Card>
      </div>

      {/* Recent Activity */}
      <Card className="mt-8">
        <CardHeader>
          <CardTitle>Recent System Activity</CardTitle>
          <CardDescription>Latest events and changes in the system</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center justify-between border-b pb-3">
              <div>
                <p className="font-medium">New user registration</p>
                <p className="text-sm text-gray-500">john.doe@example.com joined the platform</p>
              </div>
              <span className="text-xs text-gray-400">2 minutes ago</span>
            </div>
            <div className="flex items-center justify-between border-b pb-3">
              <div>
                <p className="font-medium">Premium upgrade</p>
                <p className="text-sm text-gray-500">User upgraded to premium plan</p>
              </div>
              <span className="text-xs text-gray-400">15 minutes ago</span>
            </div>
            <div className="flex items-center justify-between border-b pb-3">
              <div>
                <p className="font-medium">System backup completed</p>
                <p className="text-sm text-gray-500">Daily backup successful</p>
              </div>
              <span className="text-xs text-gray-400">1 hour ago</span>
            </div>
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">Security alert resolved</p>
                <p className="text-sm text-gray-500">Failed login attempt from unknown IP</p>
              </div>
              <span className="text-xs text-gray-400">3 hours ago</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

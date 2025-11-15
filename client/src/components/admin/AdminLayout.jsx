'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/providers/AuthProvider';
import { Button } from '@/components/ui/Button';
import { Card, CardContent } from '@/components/ui/Card';
import { 
  Menu, 
  X, 
  LayoutDashboard, 
  Users, 
  BarChart3, 
  Settings, 
  Shield, 
  Database,
  FileText,
  LogOut,
  User,
  DollarSign
} from 'lucide-react';

export default function AdminLayout({ children, currentPage = 'dashboard' }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const router = useRouter();
  const { user, logout } = useAuth();

  const adminMenuItems = [
    {
      id: 'dashboard',
      title: 'Dashboard',
      icon: LayoutDashboard,
      href: '/admin/dashboard',
      description: 'System overview and metrics'
    },
    {
      id: 'users',
      title: 'User Management',
      icon: Users,
      href: '/admin/users',
      description: 'Manage users and roles'
    },
    {
      id: 'reports',
      title: 'Reports & Analytics',
      icon: BarChart3,
      href: '/admin/reports',
      description: 'System-wide reports'
    },
    {
      id: 'profit',
      title: 'Financial Analysis',
      icon: DollarSign,
      href: '/admin/profit',
      description: 'Revenue and profit analysis'
    },
    {
      id: 'settings',
      title: 'System Settings',
      icon: Settings,
      href: '/admin/settings',
      description: 'Configure system settings'
    },
    {
      id: 'logs',
      title: 'System Logs',
      icon: Shield,
      href: '/admin/logs',
      description: 'Monitor security and logs'
    },
    {
      id: 'backup',
      title: 'Database Management',
      icon: Database,
      href: '/admin/backup',
      description: 'Backup and restore data'
    },
    {
      id: 'content',
      title: 'Content Management',
      icon: FileText,
      href: '/admin/content',
      description: 'Manage multi-language content'
    }
  ];

  const handleLogout = () => {
    logout();
    router.push('/login');
  };

  const handleReturnToDashboard = () => {
    router.push('/dashboard');
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Mobile sidebar backdrop */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 z-40 bg-black bg-opacity-50 md:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <div className={`
        fixed inset-y-0 left-0 z-50 w-64 bg-white shadow-lg transform transition-transform duration-300 ease-in-out
        ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
        md:translate-x-0 md:static md:inset-0
      `}>
        <div className="flex items-center justify-between h-16 px-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">Admin Panel</h2>
          <Button
            variant="ghost"
            size="sm"
            className="md:hidden"
            onClick={() => setSidebarOpen(false)}
          >
            <X className="w-4 h-4" />
          </Button>
        </div>

        <nav className="flex-1 px-4 py-6 space-y-2">
          {adminMenuItems.map((item) => {
            const Icon = item.icon;
            const isActive = currentPage === item.id;
            
            return (
              <button
                key={item.id}
                onClick={() => {
                  router.push(item.href);
                  setSidebarOpen(false);
                }}
                className={`
                  w-full flex items-center px-3 py-2 text-sm font-medium rounded-lg transition-colors
                  ${isActive 
                    ? 'bg-emerald-100 text-emerald-700 border border-emerald-200' 
                    : 'text-gray-700 hover:bg-gray-100'
                  }
                `}
              >
                <Icon className="w-5 h-5 mr-3" />
                <div className="flex-1 text-left">
                  <div className="font-medium">{item.title}</div>
                  <div className="text-xs text-gray-500">{item.description}</div>
                </div>
              </button>
            );
          })}
        </nav>

        {/* User info and actions */}
        <div className="border-t border-gray-200 p-4">
          <div className="flex items-center mb-3">
            <div className="w-8 h-8 bg-emerald-100 rounded-full flex items-center justify-center">
              <User className="w-4 h-4 text-emerald-600" />
            </div>
            <div className="ml-3">
              <div className="text-sm font-medium text-gray-900">
                {user?.given_name || user?.full_name || 'Admin'}
              </div>
              <div className="text-xs text-gray-500">{user?.role}</div>
            </div>
          </div>
          
          <div className="space-y-2">
            <Button
              variant="outline"
              size="sm"
              className="w-full justify-start"
              onClick={handleReturnToDashboard}
            >
              <LayoutDashboard className="w-4 h-4 mr-2" />
              User Dashboard
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="w-full justify-start"
              onClick={handleLogout}
            >
              <LogOut className="w-4 h-4 mr-2" />
              Sign Out
            </Button>
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="md:ml-64">
        {/* Top bar */}
        <div className="bg-white shadow-sm border-b border-gray-200">
          <div className="px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between h-16">
              <div className="flex items-center">
                <Button
                  variant="ghost"
                  size="sm"
                  className="md:hidden"
                  onClick={() => setSidebarOpen(true)}
                >
                  <Menu className="w-5 h-5" />
                </Button>
                <h1 className="ml-2 text-lg font-semibold text-gray-900 capitalize">
                  {currentPage.replace('-', ' ')}
                </h1>
              </div>
              
              <div className="flex items-center space-x-2">
                <div className="text-sm text-gray-500">
                  Admin Panel
                </div>
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
              </div>
            </div>
          </div>
        </div>

        {/* Page content */}
        <main className="flex-1">
          {children}
        </main>
      </div>
    </div>
  );
}
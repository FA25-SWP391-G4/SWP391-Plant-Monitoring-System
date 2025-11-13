/**
 * DashboardLayout Component
 * Layout wrapper for dashboard pages that includes the sidebar navigation
 */
'use client'

import { useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { useAuth } from '../../providers/AuthProvider';
import { DashboardProvider, useDashboard } from '../../contexts/DashboardContext';
import { DashboardWidgetProvider } from '../../providers/DashboardWidgetProvider';
import DashboardSidebar from './DashboardSidebar';
import DashboardTopBar from '../DashboardTopBar';
import Navbar from '../dashboard/navigation/Navbar';
import AIChatbotBubble from '../ai/AIChatbotBubble';
import ThemedLoader from '../ThemedLoader';

// Inner component that uses the dashboard context
const DashboardLayoutInner = ({ children }) => {
  const { user, loading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const { sidebarOpen, toggleSidebar } = useDashboard();

  const isPremium = user?.role === "Premium";
  const isAdmin = user?.role === "Admin";
  const isRegular = user?.role === "Regular";
  const isAuthenticated = !!user;

  // Check if we're on a dashboard page
  const isDashboardPage = () => {
    const dashboardRoutes = [
      '/dashboard',
      '/plants',
      '/zones', 
      '/reports',
      '/admin',
      '/settings',
      '/notifications',
      '/premium',
      '/support',
      '/documentation',
      '/ai',
      '/profile',
      '/add-plant',
      '/devices',
      '/payment/success',
      '/payment/failed',
    ];
    
    return dashboardRoutes.some(route => 
      pathname === route || pathname.startsWith(route + '/')
    );
  };

    // Helper function to get page title
  const getPageTitle = () => {
    const titleMap = {
      '/dashboard': 'Dashboard',
      '/plants': 'My Plants',
      '/zones': 'Zones', 
      '/reports': 'Reports',
      '/reports/historical-data': 'Historical Data',
      '/reports/water-consumption': 'Water Consumption',
      '/reports/plant-health': 'Plant Health',
      '/reports/plant-analysis': 'Plant Analysis',
      '/reports/image-analysis': 'Image Analysis',
      '/reports/custom': 'Custom Reports',
      '/admin': 'Admin Panel',
      '/settings': 'Settings',
      '/notifications': 'Notifications',
      '/premium': 'Premium',
      '/support': 'Support',
      '/documentation': 'Documentation',
      '/ai': 'AI Assistant',
      '/profile': 'Profile',
      '/add-plant': 'Add New Plant',
      '/devices': 'Devices',
      'payment/success': 'Payment Success',
      'payment/failed': 'Payment Failed',
    };

    // Check for exact match first
    if (titleMap[pathname]) {
      return titleMap[pathname];
    }

    // Check for route prefixes
    for (const [route, title] of Object.entries(titleMap)) {
      if (pathname.startsWith(route + '/')) {
        return title;
      }
    }

    return 'Dashboard';
  };

  // Check if we're on a public landing page
  const isLandingPage = () => {
    const landingRoutes = ['/', '/features', '/benefits', '/pricing', '/contact'];
    const authRoutes = ['/login', '/register', '/forgot-password', '/reset-password'];
    
    // Only consider it a landing page if we're actually on a landing/auth route
    // Don't use (!user && !loading) as it causes routing conflicts on reload
    return landingRoutes.includes(pathname) || authRoutes.includes(pathname);
  };

  // Handle authentication redirect in useEffect to avoid setState during render
  useEffect(() => {
    if (!loading && isDashboardPage() && !user) {
      router.push('/login');
    }
  }, [user, loading, pathname, router]);

  // Handle sidebar toggle (using context now)
  const handleSidebarToggle = () => {
    toggleSidebar();
  };

  // Show loading state while authentication is being checked
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <ThemedLoader size="lg" showText={true} text="Loading dashboard..." />
      </div>
    );
  }

  // Render landing page layout (original navbar) for public pages
  if (isLandingPage()) {
    return (
      <>
        <Navbar />
        <main>{children}</main>
      </>
    );
  }

  // For dashboard pages, show dashboard layout if authenticated, otherwise show loading while redirecting
  if (isDashboardPage()) {
    if (!user) {
      // User is not authenticated, show loading while redirect happens in useEffect
      return (
        <div className="min-h-screen flex items-center justify-center">
          <ThemedLoader size="lg" showText={true} text="Redirecting to login..." />
        </div>
      );
    }

    // User is authenticated, show dashboard layout
    return (
      <div className="flex flex-col h-screen bg-app-gradient">
        {/* Modern Top Bar - Fixed at top */}
        <DashboardTopBar 
          title={getPageTitle()}
          onMenuToggle={handleSidebarToggle}
          sidebarOpen={sidebarOpen}
          showSearch={true}
          isDemo={false}
        />

        {/* Content area with sidebar and main content */}
        <div className="flex flex-1 overflow-hidden">
          <DashboardSidebar 
            isOpen={sidebarOpen} 
            onToggle={handleSidebarToggle} 
          />
          
          {/* Main content area */}
          <main className="flex-1 overflow-y-auto p-6">
            {children}
          </main>
        </div>
        
        {/* AI Chatbot Bubble - Only show for authenticated users */}
        <AIChatbotBubble />
      </div>
    );
  }

  // Fallback to original navbar for other pages
  return (
    <>
      <Navbar />
      <main>{children}</main>
    </>
  );
};

// Main component that provides the dashboard context
const DashboardLayout = ({ children }) => {
  return (
    <DashboardProvider>
      <DashboardWidgetProvider>
        <DashboardLayoutInner>
          {children}
        </DashboardLayoutInner>
      </DashboardWidgetProvider>
    </DashboardProvider>
  );
};

export default DashboardLayout;
import Link from "next/link";
import Image from "next/image";
import { useAuth } from "@/providers/AuthProvider";
import { useTranslation } from "react-i18next";
import UserMenu from './UserMenu';
import { useState, useRef, useEffect } from "react";
<<<<<<< HEAD
=======
import { useTheme } from '@/contexts/ThemeContext';
import LogoutConfirmationModal from '../LogoutConfirmationModal';
>>>>>>> 238337da54f3c9ad3ad777d8b53c3984f6cdc290

export default function Navbar({ hiddenOnPages = ["login", "register", "forgot-password"] }) {
  const { user, logout } = useAuth();
  const { t } = useTranslation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
<<<<<<< HEAD
  const [notificationDropdownOpen, setNotificationDropdownOpen] = useState(false);
  // UserMenu component manages its own open/close state
  const [notifications, setNotifications] = useState([
    {
      id: 1,
      title: 'Plant moisture alert',
      message: 'Snake plant needs watering! Moisture level is below 20%.',
      read: false,
      type: 'alert',
      time: new Date(Date.now() - 30 * 60000) // 30 minutes ago
    },
    {
      id: 2,
      title: 'Device connected',
      message: 'Your new soil moisture sensor has been successfully connected.',
      read: false,
      type: 'success',
      time: new Date(Date.now() - 5 * 3600000) // 5 hours ago
    },
    {
      id: 3,
      title: 'Weekly report available',
      message: 'Your plant health weekly report is now available.',
      read: true,
      type: 'info',
      time: new Date(Date.now() - 24 * 3600000) // 1 day ago
    }
  ]);
  
  // Calculate unread notifications
  const unreadNotifications = notifications.filter(n => !n.read).length;
  
  // Refs for dropdowns (for click outside)
  const notificationRef = useRef(null);

  // Format notification time to relative format (e.g., "2 hours ago")
  const formatNotificationTime = (time) => {
    const now = new Date();
    const diff = now - new Date(time);
    const minutes = Math.floor(diff / 60000);
    
    if (minutes < 1) return t('time.justNow', 'Just now');
    if (minutes < 60) return t('time.minutesAgo', '{{count}} minutes ago', { count: minutes });
    
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return t('time.hoursAgo', '{{count}} hours ago', { count: hours });
    
    const days = Math.floor(hours / 24);
    if (days < 7) return t('time.daysAgo', '{{count}} days ago', { count: days });
    
    return new Date(time).toLocaleDateString();
  };
  
  // Mark all notifications as read
  const markAllAsRead = (e) => {
    e.stopPropagation();
    setNotifications(notifications.map(n => ({ ...n, read: true })));
  };
  
  // Handle notification click
  const handleNotificationClick = (notification) => {
    // Mark this notification as read
    setNotifications(notifications.map(n => 
      n.id === notification.id ? { ...n, read: true } : n
    ));
    
    // Here you would handle navigation based on notification type
    // For example: router.push(`/plants/${notification.plantId}`);
    
    setNotificationDropdownOpen(false);
  };
  
  // Close dropdowns when clicking outside
  useEffect(() => {
    function handleClickOutside(event) {
      // Handle notification dropdown
      if (notificationRef.current && !notificationRef.current.contains(event.target)) {
        setNotificationDropdownOpen(false);
      }
    }
    
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [notificationRef]);
=======
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const { isDark, isLight, getThemeColor } = useTheme();
>>>>>>> 238337da54f3c9ad3ad777d8b53c3984f6cdc290

  // No longer needed since UserMenu handles its own state

  // Determine user role for conditional rendering
  const isPremium = user?.role === "Premium";
  const isAdmin = user?.role === "Admin";
  const isAuthenticated = !!user;

  // Check if we're on a page where navbar should be hidden
<<<<<<< HEAD
  const isHiddenPage = () => {
    if (typeof window !== "undefined") {
      const pathname = window.location.pathname;
      return hiddenOnPages.some(page => pathname.includes(page));
    }
    return false;
  };

  // Don't render navbar on login, register, or forgot password pages
  if (isHiddenPage()) {
    return null;
  }
=======
  const location = typeof window !== 'undefined' ? window.location : { pathname: '' };
  const isAuthPage = location.pathname.includes('/login') || location.pathname.includes('/register') || location.pathname.includes('/forget-password') || location.pathname.includes('/reset-password');
>>>>>>> 238337da54f3c9ad3ad777d8b53c3984f6cdc290

  // Toggle mobile menu
  const toggleMobileMenu = () => {
    setMobileMenuOpen(!mobileMenuOpen);
  };

  return (
    <header className="container mx-auto px-4 py-6 flex items-center justify-between">
      {/* Logo and Brand */}
      <a href="/" className="flex items-center">
        <div className="w-7 h-7 rounded-lg flex items-center justify-center mr-2"
              style={{ 
                background: `linear-gradient(to bottom right, ${getThemeColor('#4ade80', '#22c55e')}, ${getThemeColor('#16a34a', '#15803d')})` 
              }}>
          <Image src="/app-icon.png" alt="PlantSmart Logo" width={20} height={20} />
        </div>
        <span className="text-xl font-bold text-foreground">{t('common.appName', 'PlantSmart')}</span>
      </a>

      {/* Mobile Menu Button */}
      <div className="md:hidden">
        <button
          type="button"
          onClick={toggleMobileMenu}
          className="text-gray-600 hover:text-green-600 focus:outline-none"
        >
          {mobileMenuOpen ? (
            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          ) : (
            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16m-7 6h7" />
            </svg>
          )}
        </button>
      </div>

      {/* Desktop Navigation - Only show on non-auth pages */}
        {!isAuthPage && (
          <>
            <nav className="hidden md:flex space-x-8">
          <Link href="/features" className="text-gray-600 hover:text-green-600 transition">
            {t('navigation.features')}
          </Link>
          <Link href="/benefits" className="text-gray-600 hover:text-green-600 transition">
            {t('navigation.benefits')}
          </Link>
          <Link href="/pricing" className="text-gray-600 hover:text-green-600 transition">
            {t('navigation.pricing')}
          </Link>
          {/* Contact page is always available */}
          <Link href="/contact" className="text-gray-600 hover:text-green-600 transition">
            {t('navigation.contact')}
          </Link>
            </nav>

            {/* Right-side buttons - Change by role */}
          </>
        )}
      <div className="flex items-center space-x-4">
            <Link href="/login" className="text-green-600 hover:text-green-800 font-medium transition">
              {t('auth.login')}
            </Link>
            <Link
              href="/register"
              className="bg-green-500 hover:bg-green-600 text-white py-2 px-4 rounded-md font-medium transition"
            >
              {t('common.getStarted')}
            </Link>
            
            {/* Language and theme for non-authenticated users */}
            <UserMenu />
<<<<<<< HEAD
          </>
        )}
=======
>>>>>>> 238337da54f3c9ad3ad777d8b53c3984f6cdc290
      </div>

      {/* Mobile Menu - Shows when menu button is clicked */}
      {mobileMenuOpen && (
        <div className="md:hidden absolute top-20 left-0 right-0 bg-white border-t border-b border-gray-100 py-4 px-4 z-50">
          <nav className="flex flex-col space-y-4">
            {/* Mobile navigation with same logic as desktop */}
            {!isAuthenticated ? (
              <>
                <Link href="/features" className="text-gray-600 hover:text-green-600 py-2" onClick={() => setMobileMenuOpen(false)}>
                  {t('navigation.features')}
                </Link>
                <Link href="/benefits" className="text-gray-600 hover:text-green-600 py-2" onClick={() => setMobileMenuOpen(false)}>
                  {t('navigation.benefits')}
                </Link>
                <Link href="/pricing" className="text-gray-600 hover:text-green-600 py-2" onClick={() => setMobileMenuOpen(false)}>
                  {t('navigation.pricing')}
                </Link>
              </>
            ) : (
              <>
                <Link href="/dashboard" className="text-gray-600 hover:text-green-600 py-2" onClick={() => setMobileMenuOpen(false)}>
                  {t('navigation.dashboard')}
                </Link>
                <Link href="/plants" className="text-gray-600 hover:text-green-600 py-2" onClick={() => setMobileMenuOpen(false)}>
                  {t('navigation.plants')}
                </Link>

                {(isPremium || isAdmin) && (
                  <>
                    <Link href="/zones" className="text-gray-600 hover:text-green-600 py-2" onClick={() => setMobileMenuOpen(false)}>
                      {t('navigation.zones')}
                    </Link>
                    <Link href="/reports" className="text-gray-600 hover:text-green-600 py-2" onClick={() => setMobileMenuOpen(false)}>
                      {t('navigation.reports')}
                    </Link>
                  </>
                )}

                {isAdmin && (
                  <Link href="/admin" className="text-gray-600 hover:text-green-600 py-2" onClick={() => setMobileMenuOpen(false)}>
                    {t('navigation.admin')}
                  </Link>
                )}
              </>
            )}

            <Link href="/contact" className="text-gray-600 hover:text-green-600 py-2" onClick={() => setMobileMenuOpen(false)}>
              {t('navigation.contact')}
            </Link>

            {/* Auth buttons for mobile */}
            <div className="pt-4 border-t border-gray-100">
              {isAuthenticated ? (
                <div className="flex flex-col space-y-3">
                  {user.role === "Regular" && (
                    <Link href="/upgrade" className="text-amber-600 hover:text-amber-800 font-medium py-2" onClick={() => setMobileMenuOpen(false)}>
                      {t('common.upgrade')}
                    </Link>
                  )}
                  <Link href="/settings" className="text-gray-600 hover:text-green-600 font-medium py-2" onClick={() => setMobileMenuOpen(false)}>
                    {t('navigation.settings')}
                  </Link>
<<<<<<< HEAD
                  <button onClick={() => { logout(); setMobileMenuOpen(false); }} className="text-left text-red-600 hover:text-red-800 py-2">
=======
                  <button onClick={() => { setShowLogoutModal(true); setMobileMenuOpen(false); }} className="text-left text-red-600 hover:text-red-800 py-2">
>>>>>>> 238337da54f3c9ad3ad777d8b53c3984f6cdc290
                    {t('auth.logout')}
                  </button>
                </div>
              ) : (
                <div className="flex flex-col space-y-3">
                  <Link href="/login" className="text-green-600 hover:text-green-800 font-medium py-2" onClick={() => setMobileMenuOpen(false)}>
                    {t('auth.login')}
                  </Link>
                  <Link href="/register" className="bg-green-500 hover:bg-green-600 text-white py-2 px-4 rounded-md font-medium text-center" onClick={() => setMobileMenuOpen(false)}>
                    {t('common.getStarted')}
                  </Link>
                </div>
              )}
            </div>
          </nav>
        </div>
      )}

      {/* Logout Confirmation Modal */}
      <LogoutConfirmationModal 
        isOpen={showLogoutModal} 
        onClose={() => setShowLogoutModal(false)} 
      />
    </header>
  );
}

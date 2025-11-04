import Link from "next/link";
import Image from "next/image";
import { useAuth } from "@/providers/AuthProvider";
import { useTranslation } from "react-i18next";
import UserMenu from './UserMenu';
import { useState, useRef, useEffect } from "react";

export default function Navbar({ hiddenOnPages = ["login", "register", "forgot-password"] }) {
  const { user, logout } = useAuth();
  const { t } = useTranslation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
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

  // No longer needed since UserMenu handles its own state

  // Determine user role for conditional rendering
  const isPremium = user?.role === "Premium";
  const isAdmin = user?.role === "Admin";
  const isAuthenticated = !!user;

  // Check if we're on a page where navbar should be hidden
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

  // Toggle mobile menu
  const toggleMobileMenu = () => {
    setMobileMenuOpen(!mobileMenuOpen);
  };

  return (
    <header className="container mx-auto px-4 py-6 flex items-center justify-between">
      {/* Logo and Brand */}
      <div className="flex items-center">
        <Link href={isAuthenticated ? "/dashboard" : "/"} className="flex items-center">
          <div className="w-8 h-8 bg-gradient-to-br from-green-400 to-green-600 rounded-lg flex items-center justify-center">
            <Image src="/app-icon.png" alt="PlantSmart Logo" width={24} height={24} />
          </div>
          <span className="ml-2 text-xl font-semibold text-gray-800">{t('common.appName', 'PlantSmart')}</span>
        </Link>
      </div>

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

      {/* Desktop Navigation - Changes based on user role */}
      <nav className="hidden md:flex space-x-8">
        {/* Navigation mapping based on availability and role */}
        {!isAuthenticated && (
          <>
            <Link href="/features" className="text-gray-600 hover:text-green-600 transition">
              {t('navigation.features')}
            </Link>
            <Link href="/benefits" className="text-gray-600 hover:text-green-600 transition">
              {t('navigation.benefits')}
            </Link>
            <Link href="/pricing" className="text-gray-600 hover:text-green-600 transition">
              {t('navigation.pricing')}
            </Link>
          </>
        )}

        {/* Authenticated user navigation */}
        {isAuthenticated && (
          <>
            <Link href="/dashboard" className="text-gray-600 hover:text-green-600 transition">
              {t('navigation.dashboard')}
            </Link>
            <Link href="/plants" className="text-gray-600 hover:text-green-600 transition">
              {t('navigation.plants')}
            </Link>

            {/* Premium features */}
            {(isPremium || isAdmin) && (
              <>
                <Link href="/zones" className="text-gray-600 hover:text-green-600 transition">
                  {t('navigation.zones')}
                </Link>
                <Link href="/reports" className="text-gray-600 hover:text-green-600 transition">
                  {t('navigation.reports')}
                </Link>
              </>
            )}

            {/* Admin-only features */}
            {isAdmin && (
              <Link href="/admin" className="text-gray-600 hover:text-green-600 transition">
                {t('navigation.admin')}
              </Link>
            )}
          </>
        )}

        {/* Contact page is always available */}
        <Link href="/contact" className="text-gray-600 hover:text-green-600 transition">
          {t('navigation.contact')}
        </Link>
      </nav>

      {/* Right-side buttons - Change by role */}
      <div className="flex items-center space-x-4">
        {/* User is logged in */}
        {isAuthenticated ? (
          <>
            {/* Show upgrade button for regular users */}
            {user.role === "Regular" && (
              <Link
                href="/premium"
                className="hidden sm:flex items-center text-sm font-medium bg-gradient-to-r from-amber-500 to-amber-600 text-white px-3 py-1.5 rounded-full hover:from-amber-600 hover:to-amber-700 transition"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-1">
                  <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"></polygon>
                </svg>
                {t('common.upgrade')}
              </Link>
            )}

            {/* Notifications */}
            <div className="relative" ref={notificationRef}>
              <button 
                className="text-gray-500 hover:text-green-600 relative p-2"
                onClick={() => setNotificationDropdownOpen(!notificationDropdownOpen)}
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-bell">
                  <path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9"></path>
                  <path d="M10.3 21a1.94 1.94 0 0 0 3.4 0"></path>
                </svg>
                {unreadNotifications > 0 && (
                  <span className="absolute top-1 right-1 bg-red-500 text-white text-xs rounded-full h-4 w-4 flex items-center justify-center">
                    {unreadNotifications}
                  </span>
                )}
              </button>
              
              {/* Notification dropdown */}
              {notificationDropdownOpen && (
                <div className="absolute right-0 mt-2 w-80 bg-white rounded-md shadow-lg border border-gray-100 z-50 overflow-hidden">
                  <div className="py-2 border-b border-gray-100 px-4 flex justify-between items-center">
                    <h3 className="font-medium text-gray-800">{t('notifications.title', 'Notifications')}</h3>
                    {notifications.length > 0 && (
                      <button 
                        onClick={markAllAsRead}
                        className="text-xs text-green-600 hover:text-green-800"
                      >
                        {t('notifications.markAllRead', 'Mark all as read')}
                      </button>
                    )}
                  </div>
                  
                  <div className="max-h-80 overflow-y-auto">
                    {notifications.length > 0 ? (
                      notifications.map((notification, index) => (
                        <div 
                          key={index}
                          className={`px-4 py-3 border-b border-gray-50 hover:bg-gray-50 cursor-pointer ${!notification.read ? 'bg-blue-50' : ''}`}
                          onClick={() => handleNotificationClick(notification)}
                        >
                          <div className="flex items-start">
                            <div className={`flex-shrink-0 h-8 w-8 rounded-full flex items-center justify-center mr-3 ${notification.read ? 'bg-gray-100' : 'bg-green-100'}`}>
                              {notification.type === 'alert' && (
                                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-amber-600">
                                  <path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"></path>
                                  <line x1="12" y1="9" x2="12" y2="13"></line>
                                  <line x1="12" y1="17" x2="12.01" y2="17"></line>
                                </svg>
                              )}
                              {notification.type === 'info' && (
                                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-blue-600">
                                  <circle cx="12" cy="12" r="10"></circle>
                                  <line x1="12" y1="16" x2="12" y2="12"></line>
                                  <line x1="12" y1="8" x2="12.01" y2="8"></line>
                                </svg>
                              )}
                              {notification.type === 'success' && (
                                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-green-600">
                                  <path d="M22 11.08V12a10 10 0 11-5.93-9.14"></path>
                                  <polyline points="22 4 12 14.01 9 11.01"></polyline>
                                </svg>
                              )}
                            </div>
                            <div className="flex-1">
                              <p className={`text-sm ${!notification.read ? 'font-medium text-gray-900' : 'text-gray-700'}`}>{notification.title}</p>
                              <p className="text-xs text-gray-500 mt-1">{notification.message}</p>
                              <p className="text-xs text-gray-400 mt-1">{formatNotificationTime(notification.time)}</p>
                            </div>
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="py-6 text-center text-gray-500">
                        <svg xmlns="http://www.w3.org/2000/svg" className="mx-auto h-12 w-12 text-gray-300 mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
                        </svg>
                        <p>{t('notifications.empty', 'No new notifications')}</p>
                      </div>
                    )}
                  </div>
                  
                  {notifications.length > 0 && (
                    <div className="py-2 text-center border-t border-gray-100">
                      <Link href="/notifications" className="text-sm text-green-600 hover:text-green-800">
                        {t('notifications.viewAll', 'View all notifications')}
                      </Link>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Unified User Menu - combines user profile, language and theme */}
            <UserMenu />
          </>
        ) : (
          /* User is not logged in */
          <>
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
          </>
        )}
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
                  <button onClick={() => { logout(); setMobileMenuOpen(false); }} className="text-left text-red-600 hover:text-red-800 py-2">
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
    </header>
  );
}

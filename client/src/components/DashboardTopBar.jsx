/**
 * DashboardTopBar Component
 * Modern top bar for dashboard pages with logo, search, and actions
 * Based on the reference UI design
 */
'use client'

import { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../providers/AuthProvider';
import { useDashboard } from '../contexts/DashboardContext';
import SidebarUserMenu from './navigation/SidebarUserMenu';

const DashboardTopBar = ({ 
  title, 
  showSearch = true, 
  isDemo = false,
  onMenuToggle,
  sidebarOpen = true 
}) => {
  const { t } = useTranslation();
  const { user } = useAuth();
  const router = useRouter();
  const { toggleSidebar } = useDashboard();
  
  // Use !!user for clean boolean user authentication state  
  const isAuthenticated = !!user;
  
  // Search state
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [showSearchResults, setShowSearchResults] = useState(false);
  const searchRef = useRef(null);

  // Notification state
  const [notifications, setNotifications] = useState([
    {
      id: 1,
      title: 'Plant moisture alert',
      message: 'Snake plant needs watering! Moisture level is below 20%.',
      read: false,
      type: 'alert',
      time: new Date(Date.now() - 30 * 60000)
    },
    {
      id: 2,
      title: 'Device connected', 
      message: 'Your new soil moisture sensor has been successfully connected.',
      read: false,
      type: 'success',
      time: new Date(Date.now() - 5 * 3600000)
    },
    {
      id: 3,
      title: 'Weekly report available',
      message: 'Your plant health weekly report is now available.',
      read: true,
      type: 'info',
      time: new Date(Date.now() - 24 * 3600000)
    }
  ]);

  const [notificationDropdownOpen, setNotificationDropdownOpen] = useState(false);
  const notificationRef = useRef(null);

  // Mock search data
  const searchData = [
    { type: 'page', title: 'Dashboard', url: '/dashboard', icon: '📊' },
    { type: 'page', title: 'My Plants', url: '/plants', icon: '🌱' },
    { type: 'page', title: 'Zones', url: '/zones', icon: '📍' },
    { type: 'page', title: 'Reports', url: '/reports', icon: '📈' },
    { type: 'page', title: 'Settings', url: '/settings', icon: '⚙️' },
    { type: 'plant', title: 'Snake Plant', url: '/plants/1', icon: '🐍' },
    { type: 'plant', title: 'Monstera', url: '/plants/2', icon: '🍃' },
    { type: 'plant', title: 'Peace Lily', url: '/plants/3', icon: '🕊️' },
    { type: 'device', title: 'Soil Sensor #1', url: '/devices/1', icon: '📡' },
    { type: 'device', title: 'Water Pump #1', url: '/devices/2', icon: '💧' }
  ];

  // Calculate unread notifications
  const unreadNotifications = notifications.filter(n => !n.read).length;

  // Handle search
  const handleSearch = (query) => {
    setSearchQuery(query);
    if (query.trim()) {
      const results = searchData.filter(item =>
        item.title.toLowerCase().includes(query.toLowerCase())
      ).slice(0, 8);
      setSearchResults(results);
      setShowSearchResults(true);
    } else {
      setSearchResults([]);
      setShowSearchResults(false);
    }
  };

  // Handle search result click
  const handleSearchResultClick = (result) => {
    router.push(result.url);
    setSearchQuery('');
    setShowSearchResults(false);
  };

  // Handle notification click
  const handleNotificationClick = (notification) => {
    setNotifications(notifications.map(n => 
      n.id === notification.id ? { ...n, read: true } : n
    ));
    // Navigate to relevant page or show detailed notification
    setNotificationDropdownOpen(false);
  };

  // Mark all notifications as read
  const markAllAsRead = () => {
    setNotifications(notifications.map(n => ({ ...n, read: true })));
  };

  // Format notification time
  const formatNotificationTime = (time) => {
    const now = new Date();
    const diff = now - new Date(time);
    const minutes = Math.floor(diff / 60000);
    
    if (minutes < 1) return t('common.justNow', 'Just now');
    if (minutes < 60) return t('common.minutesAgo', '{{count}} minutes ago', { count: minutes });
    
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return t('common.hoursAgo', '{{count}} hours ago', { count: hours });
    
    const days = Math.floor(hours / 24);
    if (days < 7) return t('common.daysAgo', '{{count}} days ago', { count: days });
    
    return new Date(time).toLocaleDateString();
  };

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (searchRef.current && !searchRef.current.contains(event.target)) {
        setShowSearchResults(false);
      }
      if (notificationRef.current && !notificationRef.current.contains(event.target)) {
        setNotificationDropdownOpen(false);
      }
    };
    
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <header className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-4 lg:px-6 py-3 flex items-center justify-between relative z-30">
      
      {/* Left Section - Menu Toggle + Logo */}
      <div className="flex items-center space-x-4">
        {/* Menu Toggle Button */}
        <button
          onClick={toggleSidebar}
          className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
          aria-label="Toggle menu"
        >
          <svg className="w-5 h-5 text-gray-600 dark:text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </button>

        {/* Logo */}
        <Link href={isDemo ? "/demo" : "/dashboard"} className="flex items-center">
          <div style={{ color: 'transparent', marginRight: '3px' }}>
            <Image className="w-9 h-9" src="/app-icon.png" alt="PlantSmart Logo" width={36} height={36} />
          </div>
          <span className="text-xl font-semibold text-gray-800 dark:text-white hidden sm:block">
            PlantSmart
          </span>
        </Link>
      </div>

      {/* Center Section - Search Bar */}
      {showSearch && (
        <div className="flex-1 max-w-2xl mx-4 lg:mx-8 relative" ref={searchRef}>
          <div className="relative">
            <svg className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input
              type="text"
              placeholder={t('common.search', 'Search plants, devices, or pages...')}
              value={searchQuery}
              onChange={(e) => handleSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:ring-2 focus:ring-green-500 focus:border-transparent transition-colors"
            />
          </div>

          {/* Search Results Dropdown */}
          {showSearchResults && searchResults.length > 0 && (
            <div className="absolute top-full left-0 right-0 mt-2 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-600 z-50 max-h-80 overflow-y-auto">
              {searchResults.map((result, index) => (
                <button
                  key={index}
                  onClick={() => handleSearchResultClick(result)}
                  className="w-full flex items-center px-4 py-3 hover:bg-gray-50 dark:hover:bg-gray-700 border-b border-gray-100 dark:border-gray-700 last:border-b-0 text-left"
                >
                  <span className="text-lg mr-3">{result.icon}</span>
                  <div>
                    <p className="text-sm font-medium text-gray-900 dark:text-white">{result.title}</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400 capitalize">{result.type}</p>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Right Section - Actions */}
      <div className="flex items-center space-x-3">
        {/* Premium upgrade button for regular users */}
        {isAuthenticated && !isDemo && user?.role === "Regular" && (
          <button
            onClick={() => router.push('/premium')}
            className="hidden sm:flex items-center px-3 py-2 bg-gradient-to-r from-amber-500 to-amber-600 text-white rounded-lg hover:from-amber-600 hover:to-amber-700 transition text-sm font-medium"
          >
            <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"></polygon>
            </svg>
            {t('common.upgrade', 'Upgrade')}
          </button>
        )}
        
        {/* Notifications */}
        <div className="relative" ref={notificationRef}>
          <button 
            className="p-2 text-gray-500 hover:text-green-600 dark:text-gray-400 dark:hover:text-green-400 relative transition-colors"
            onClick={() => setNotificationDropdownOpen(!notificationDropdownOpen)}
            aria-label="Notifications"
          >
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-bell-icon lucide-bell"><path d="M10.268 21a2 2 0 0 0 3.464 0"/><path d="M3.262 15.326A1 1 0 0 0 4 17h16a1 1 0 0 0 .74-1.673C19.41 13.956 18 12.499 18 8A6 6 0 0 0 6 8c0 4.499-1.411 5.956-2.738 7.326"/></svg>
            {unreadNotifications > 0 && (
              <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                {unreadNotifications}
              </span>
            )}
          </button>
          
          {/* Notification Dropdown */}
          {notificationDropdownOpen && (
            <div className="absolute right-0 mt-2 w-80 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-600 z-50 overflow-hidden">
              <div className="px-4 py-3 border-b border-gray-100 dark:border-gray-700 flex justify-between items-center">
                <h3 className="font-medium text-gray-900 dark:text-white">{t('notifications.title', 'Notifications')}</h3>
                {notifications.length > 0 && (
                  <button 
                    onClick={markAllAsRead}
                    className="text-xs text-green-600 hover:text-green-800 dark:text-green-400 dark:hover:text-green-300"
                  >
                    {t('notifications.markAllRead', 'Mark all as read')}
                  </button>
                )}
              </div>
              
              <div className="max-h-80 overflow-y-auto">
                {notifications.length > 0 ? (
                  notifications.map((notification) => (
                    <div 
                      key={notification.id}
                      className={`px-4 py-3 border-b border-gray-50 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer last:border-b-0 ${!notification.read ? 'bg-blue-50 dark:bg-blue-900/20' : ''}`}
                      onClick={() => handleNotificationClick(notification)}
                    >
                      <div className="flex items-start">
                        <div className={`flex-shrink-0 h-8 w-8 rounded-full flex items-center justify-center mr-3 ${notification.read ? 'bg-gray-100 dark:bg-gray-600' : 'bg-green-100 dark:bg-green-900'}`}>
                          {notification.type === 'alert' && (
                            <svg className="w-4 h-4 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.502 0L4.268 16.5c-.77.833.192 2.5 1.732 2.5z" />
                            </svg>
                          )}
                          {notification.type === 'success' && (
                            <svg className="w-4 h-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                            </svg>
                          )}
                          {notification.type === 'info' && (
                            <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className={`text-sm ${!notification.read ? 'font-medium text-gray-900 dark:text-white' : 'text-gray-700 dark:text-gray-300'}`}>
                            {notification.title}
                          </p>
                          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 truncate">
                            {notification.message}
                          </p>
                          <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
                            {formatNotificationTime(notification.time)}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="py-8 text-center text-gray-500 dark:text-gray-400">
                    <svg className="mx-auto h-12 w-12 text-gray-300 dark:text-gray-600 mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M15 17h5l-5 5v-5zM4 19h6a1 1 0 001-1v-4a1 1 0 00-1-1H4a1 1 0 00-1 1v4a1 1 0 001 1z" />
                    </svg>
                    <p>{t('notifications.empty', 'No new notifications')}</p>
                  </div>
                )}
              </div>
              
              {notifications.length > 0 && (
                <div className="px-4 py-3 text-center border-t border-gray-100 dark:border-gray-700">
                  <Link 
                    href="/notifications" 
                    className="text-sm text-green-600 hover:text-green-800 dark:text-green-400 dark:hover:text-green-300"
                    onClick={() => setNotificationDropdownOpen(false)}
                  >
                    {t('notifications.viewAll', 'View all notifications')}
                  </Link>
                </div>
              )}
            </div>
          )}
        </div>

        {/* User Menu or Auth Buttons */}
        {isDemo || !isAuthenticated ? (
          // Demo mode or non-authenticated - show auth buttons
          <div className="flex items-center space-x-2">
            <Link
              href="/login"
              className="px-3 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:text-green-600 dark:hover:text-green-400 transition-colors"
            >
              {t('auth.login', 'Login')}
            </Link>
            <Link
              href="/register"
              className="px-4 py-2 text-sm font-medium bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors"
            >
              {t('auth.signUp', 'Sign Up')}
            </Link>
          </div>
        ) : (
          // Authenticated mode - show user menu
          <SidebarUserMenu isExpanded={true} />
        )}
      </div>
    </header>
  );
};

export default DashboardTopBar;
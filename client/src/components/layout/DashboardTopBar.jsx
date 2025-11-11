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
import { useAuth } from '../../providers/AuthProvider';
import { useDashboard } from '../../contexts/DashboardContext';
import UserMenu from '../dashboard/navigation/UserMenu';
import NotificationBell from '../notifications/NotificationBell';

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
        {isAuthenticated && !isDemo && (user?.role === "Regular" || user?.role === "Premium") && (
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
        <NotificationBell />

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
          <UserMenu isExpanded={true} />
        )}
      </div>
    </header>
  );
};

export default DashboardTopBar;
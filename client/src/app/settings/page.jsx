'use client'

import { useState, useEffect } from 'react';
import { useAuth } from '@/providers/AuthProvider';
import { useRouter } from 'next/navigation';
import { useTranslation } from 'react-i18next';
import Link from 'next/link';
import DashboardAppearanceSettings from '@/components/settings/DashboardAppearanceSettings';
import settingsApi from '@/api/settingsApi';

export default function SettingsPage() {
  const { t } = useTranslation();
  const { user, loading } = useAuth();
  const router = useRouter();
  const isAuthenticated = !!user;
  const [activeTab, setActiveTab] = useState('dashboard');
  const [isLoading, setIsLoading] = useState(false);
  const [settings, setSettings] = useState({
    appearance: {
      theme: 'system',
      fontSize: 'medium',
      colorScheme: 'default'
    },
    language: {
      preferred: 'en',
      dateFormat: 'MM/DD/YYYY',
      timeFormat: '12h'
    },
    notifications: {
      email: true,
      push: true,
      sms: false,
      wateringReminders: true,
      criticalAlerts: true,
      weeklyReports: true
    },
    privacy: {
      shareData: false,
      anonymousAnalytics: true,
      locationAccess: 'while-using'
    }
  });
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  
  useEffect(() => {
    if (!loading && !isAuthenticated) {
      router.push('/login');
    }
  }, [isAuthenticated, loading, router]);
  
  useEffect(() => {
    if (isAuthenticated) {
      fetchSettings();
    }
  }, [isAuthenticated]);
  
  const fetchSettings = async () => {
    try {
      setIsLoading(true);
      
      // Fetch user settings from the API
      const response = await settingsApi.getUserSettings();
      
      if (response.data.success) {
        setSettings(response.data.data);
      } else {
        throw new Error(response.data.error || 'Failed to fetch settings');
      }
      
      setError(null);
    } catch (err) {
      console.error('Error fetching settings:', err);
      setError(t('errors.fetchFailed', 'Failed to fetch settings'));
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleSettingChange = (category, setting, value) => {
    setSettings(prev => ({
      ...prev,
      [category]: {
        ...prev[category],
        [setting]: value
      }
    }));
  };
  
  const saveSettings = async () => {
    try {
      setIsLoading(true);
      
      // Save settings to the API
      const response = await settingsApi.updateUserSettings(settings);
      
      if (response.data.success) {
        // Settings saved successfully
        setSuccess(t('settings.saveSuccess', 'Settings saved successfully'));
        setTimeout(() => setSuccess(null), 3000);
      } else {
        throw new Error(response.data.error || 'Failed to save settings');
      }
    } catch (err) {
      console.error('Error saving settings:', err);
      setError(t('errors.saveFailed', 'Failed to save settings'));
    } finally {
      setIsLoading(false);
    }
  };
  
  if (loading || isLoading) {
    return (
      <div className="container mx-auto px-4 py-8 flex justify-center items-center min-h-[70vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-emerald-500"></div>
      </div>
    );
  }
  
  if (!isAuthenticated) {
    return null; // Will redirect to login via useEffect
  }
  
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <nav className="flex text-sm text-gray-500">
          <Link href="/dashboard" className="hover:text-emerald-600 transition-colors">
            {t('navigation.dashboard', 'Dashboard')}
          </Link>
          <span className="mx-2">/</span>
          <span className="font-medium text-gray-900">
            {t('navigation.settings', 'Settings')}
          </span>
        </nav>
      </div>
      
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6">
          <p>{error}</p>
        </div>
      )}
      
      {success && (
        <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg mb-6">
          <p>{success}</p>
        </div>
      )}
      
      <div className="flex flex-col md:flex-row gap-6">
        {/* Sidebar navigation */}
        <div className="w-full md:w-64 shrink-0">
          <div className="bg-white rounded-xl shadow-sm overflow-hidden border border-gray-100">
            <nav className="p-2">
              <button 
                className={`flex items-center w-full text-left px-4 py-3 rounded-lg transition-colors ${
                  activeTab === 'dashboard' ? 'bg-emerald-50 text-emerald-700' : 'hover:bg-gray-50'
                }`}
                onClick={() => setActiveTab('dashboard')}
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 5a1 1 0 011-1h14a1 1 0 011 1v2a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM4 13a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H5a1 1 0 01-1-1v-6zM16 13a1 1 0 011-1h2a1 1 0 011 1v6a1 1 0 01-1 1h-2a1 1 0 01-1-1v-6z" />
                </svg>
                <span>{t('settings.dashboard', 'Dashboard Layout')}</span>
              </button>

              <button 
                className={`flex items-center w-full text-left px-4 py-3 rounded-lg transition-colors ${
                  activeTab === 'appearance' ? 'bg-emerald-50 text-emerald-700' : 'hover:bg-gray-50'
                }`}
                onClick={() => setActiveTab('appearance')}
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01" />
                </svg>
                <span>{t('settings.appearance', 'Appearance')}</span>
              </button>
              
              <button 
                className={`flex items-center w-full text-left px-4 py-3 rounded-lg transition-colors ${
                  activeTab === 'language' ? 'bg-emerald-50 text-emerald-700' : 'hover:bg-gray-50'
                }`}
                onClick={() => setActiveTab('language')}
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5h12M9 3v2m1.048 9.5A18.022 18.022 0 016.412 9m6.088 9h7M11 21l5-10 5 10M12.751 5C11.783 10.77 8.07 15.61 3 18.129" />
                </svg>
                <span>{t('settings.language', 'Language & Region')}</span>
              </button>
              
              <button 
                className={`flex items-center w-full text-left px-4 py-3 rounded-lg transition-colors ${
                  activeTab === 'notifications' ? 'bg-emerald-50 text-emerald-700' : 'hover:bg-gray-50'
                }`}
                onClick={() => setActiveTab('notifications')}
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                </svg>
                <span>{t('settings.notifications', 'Notifications')}</span>
              </button>
              
              <button 
                className={`flex items-center w-full text-left px-4 py-3 rounded-lg transition-colors ${
                  activeTab === 'privacy' ? 'bg-emerald-50 text-emerald-700' : 'hover:bg-gray-50'
                }`}
                onClick={() => setActiveTab('privacy')}
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
                <span>{t('settings.privacy', 'Privacy & Security')}</span>
              </button>
            </nav>
          </div>
        </div>
        
        {/* Settings content */}
        <div className="flex-grow">
          <div className="bg-white rounded-xl shadow-sm overflow-hidden border border-gray-100">
            <div className="p-6">
              {/* Dashboard Settings */}
              {activeTab === 'dashboard' && (
                <DashboardAppearanceSettings />
              )}

              {/* Appearance Settings */}
              {activeTab === 'appearance' && (
                <>
                  <h2 className="text-xl font-semibold text-gray-900 mb-6">
                    {t('settings.appearance', 'Appearance')}
                  </h2>
                  
                  <div className="mb-6">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      {t('settings.theme', 'Theme')}
                    </label>
                    <select 
                      value={settings.appearance.theme} 
                      onChange={(e) => handleSettingChange('appearance', 'theme', e.target.value)}
                      className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    >
                      <option value="system">{t('settings.themeSystem', 'System Default')}</option>
                      <option value="light">{t('settings.themeLight', 'Light')}</option>
                      <option value="dark">{t('settings.themeDark', 'Dark')}</option>
                    </select>
                    <p className="mt-1 text-sm text-gray-500">
                      {t('settings.themeDescription', 'Choose how the application looks')}
                    </p>
                  </div>
                  
                  <div className="mb-6">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      {t('settings.fontSize', 'Font Size')}
                    </label>
                    <div className="flex items-center space-x-4">
                      <button 
                        className={`px-4 py-2 border rounded-lg ${
                          settings.appearance.fontSize === 'small' 
                            ? 'bg-emerald-50 border-emerald-500 text-emerald-700' 
                            : 'border-gray-200 hover:bg-gray-50'
                        }`}
                        onClick={() => handleSettingChange('appearance', 'fontSize', 'small')}
                      >
                        {t('settings.fontSizeSmall', 'Small')}
                      </button>
                      <button 
                        className={`px-4 py-2 border rounded-lg ${
                          settings.appearance.fontSize === 'medium' 
                            ? 'bg-emerald-50 border-emerald-500 text-emerald-700' 
                            : 'border-gray-200 hover:bg-gray-50'
                        }`}
                        onClick={() => handleSettingChange('appearance', 'fontSize', 'medium')}
                      >
                        {t('settings.fontSizeMedium', 'Medium')}
                      </button>
                      <button 
                        className={`px-4 py-2 border rounded-lg ${
                          settings.appearance.fontSize === 'large' 
                            ? 'bg-emerald-50 border-emerald-500 text-emerald-700' 
                            : 'border-gray-200 hover:bg-gray-50'
                        }`}
                        onClick={() => handleSettingChange('appearance', 'fontSize', 'large')}
                      >
                        {t('settings.fontSizeLarge', 'Large')}
                      </button>
                    </div>
                  </div>
                  
                  <div className="mb-6">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      {t('settings.colorScheme', 'Color Scheme')}
                    </label>
                    <div className="grid grid-cols-3 gap-4">
                      <button 
                        className={`p-4 border rounded-lg flex flex-col items-center ${
                          settings.appearance.colorScheme === 'default' 
                            ? 'bg-emerald-50 border-emerald-500' 
                            : 'border-gray-200 hover:bg-gray-50'
                        }`}
                        onClick={() => handleSettingChange('appearance', 'colorScheme', 'default')}
                      >
                        <div className="w-12 h-6 rounded-full bg-emerald-500 mb-2"></div>
                        <span className="text-sm">{t('settings.colorDefault', 'Default')}</span>
                      </button>
                      <button 
                        className={`p-4 border rounded-lg flex flex-col items-center ${
                          settings.appearance.colorScheme === 'blue' 
                            ? 'bg-emerald-50 border-emerald-500' 
                            : 'border-gray-200 hover:bg-gray-50'
                        }`}
                        onClick={() => handleSettingChange('appearance', 'colorScheme', 'blue')}
                      >
                        <div className="w-12 h-6 rounded-full bg-blue-500 mb-2"></div>
                        <span className="text-sm">{t('settings.colorBlue', 'Blue')}</span>
                      </button>
                      <button 
                        className={`p-4 border rounded-lg flex flex-col items-center ${
                          settings.appearance.colorScheme === 'purple' 
                            ? 'bg-emerald-50 border-emerald-500' 
                            : 'border-gray-200 hover:bg-gray-50'
                        }`}
                        onClick={() => handleSettingChange('appearance', 'colorScheme', 'purple')}
                      >
                        <div className="w-12 h-6 rounded-full bg-purple-500 mb-2"></div>
                        <span className="text-sm">{t('settings.colorPurple', 'Purple')}</span>
                      </button>
                    </div>
                  </div>
                </>
              )}
              
              {/* Language & Region Settings */}
              {activeTab === 'language' && (
                <>
                  <h2 className="text-xl font-semibold text-gray-900 mb-6">
                    {t('settings.language', 'Language & Region')}
                  </h2>
                  
                  <div className="mb-6">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      {t('settings.preferredLanguage', 'Preferred Language')}
                    </label>
                    <select 
                      value={settings.language.preferred} 
                      onChange={(e) => handleSettingChange('language', 'preferred', e.target.value)}
                      className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    >
                      <option value="en">{t('languages.english', 'English')}</option>
                      <option value="es">{t('languages.spanish', 'Spanish')}</option>
                      <option value="fr">{t('languages.french', 'French')}</option>
                      <option value="de">{t('languages.german', 'German')}</option>
                      <option value="zh">{t('languages.chinese', 'Chinese')}</option>
                    </select>
                  </div>
                  
                  <div className="mb-6">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      {t('settings.dateFormat', 'Date Format')}
                    </label>
                    <div className="flex flex-wrap gap-3">
                      <button 
                        className={`px-4 py-2 border rounded-lg ${
                          settings.language.dateFormat === 'MM/DD/YYYY' 
                            ? 'bg-emerald-50 border-emerald-500 text-emerald-700' 
                            : 'border-gray-200 hover:bg-gray-50'
                        }`}
                        onClick={() => handleSettingChange('language', 'dateFormat', 'MM/DD/YYYY')}
                      >
                        MM/DD/YYYY
                      </button>
                      <button 
                        className={`px-4 py-2 border rounded-lg ${
                          settings.language.dateFormat === 'DD/MM/YYYY' 
                            ? 'bg-emerald-50 border-emerald-500 text-emerald-700' 
                            : 'border-gray-200 hover:bg-gray-50'
                        }`}
                        onClick={() => handleSettingChange('language', 'dateFormat', 'DD/MM/YYYY')}
                      >
                        DD/MM/YYYY
                      </button>
                      <button 
                        className={`px-4 py-2 border rounded-lg ${
                          settings.language.dateFormat === 'YYYY-MM-DD' 
                            ? 'bg-emerald-50 border-emerald-500 text-emerald-700' 
                            : 'border-gray-200 hover:bg-gray-50'
                        }`}
                        onClick={() => handleSettingChange('language', 'dateFormat', 'YYYY-MM-DD')}
                      >
                        YYYY-MM-DD
                      </button>
                    </div>
                  </div>
                  
                  <div className="mb-6">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      {t('settings.timeFormat', 'Time Format')}
                    </label>
                    <div className="flex gap-3">
                      <button 
                        className={`px-4 py-2 border rounded-lg ${
                          settings.language.timeFormat === '12h' 
                            ? 'bg-emerald-50 border-emerald-500 text-emerald-700' 
                            : 'border-gray-200 hover:bg-gray-50'
                        }`}
                        onClick={() => handleSettingChange('language', 'timeFormat', '12h')}
                      >
                        {t('settings.timeFormat12h', '12-hour (AM/PM)')}
                      </button>
                      <button 
                        className={`px-4 py-2 border rounded-lg ${
                          settings.language.timeFormat === '24h' 
                            ? 'bg-emerald-50 border-emerald-500 text-emerald-700' 
                            : 'border-gray-200 hover:bg-gray-50'
                        }`}
                        onClick={() => handleSettingChange('language', 'timeFormat', '24h')}
                      >
                        {t('settings.timeFormat24h', '24-hour')}
                      </button>
                    </div>
                  </div>
                </>
              )}
              
              {/* Notification Settings */}
              {activeTab === 'notifications' && (
                <>
                  <h2 className="text-xl font-semibold text-gray-900 mb-6">
                    {t('settings.notifications', 'Notifications')}
                  </h2>
                  
                  <div className="mb-6">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      {t('settings.notificationChannels', 'Notification Channels')}
                    </label>
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-medium">{t('settings.emailNotifications', 'Email Notifications')}</p>
                          <p className="text-xs text-gray-500">{t('settings.emailNotificationsDescription', 'Receive notifications via email')}</p>
                        </div>
                        <label className="relative inline-flex items-center cursor-pointer">
                          <input 
                            type="checkbox" 
                            className="sr-only peer" 
                            checked={settings.notifications.email}
                            onChange={(e) => handleSettingChange('notifications', 'email', e.target.checked)}
                          />
                          <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-emerald-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-600"></div>
                        </label>
                      </div>
                      
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-medium">{t('settings.pushNotifications', 'Push Notifications')}</p>
                          <p className="text-xs text-gray-500">{t('settings.pushNotificationsDescription', 'Receive notifications on your device')}</p>
                        </div>
                        <label className="relative inline-flex items-center cursor-pointer">
                          <input 
                            type="checkbox" 
                            className="sr-only peer" 
                            checked={settings.notifications.push}
                            onChange={(e) => handleSettingChange('notifications', 'push', e.target.checked)}
                          />
                          <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-emerald-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-600"></div>
                        </label>
                      </div>
                      
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-medium">{t('settings.smsNotifications', 'SMS Notifications')}</p>
                          <p className="text-xs text-gray-500">{t('settings.smsNotificationsDescription', 'Receive text messages for critical alerts (Premium only)')}</p>
                        </div>
                        <label className="relative inline-flex items-center cursor-pointer">
                          <input 
                            type="checkbox" 
                            className="sr-only peer" 
                            checked={settings.notifications.sms}
                            onChange={(e) => handleSettingChange('notifications', 'sms', e.target.checked)}
                            disabled={user?.role !== 'Premium' && user?.role !== 'Admin'}
                          />
                          <div className={`w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-emerald-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-600 ${
                            user?.role !== 'Premium' && user?.role !== 'Admin' ? 'opacity-50 cursor-not-allowed' : ''
                          }`}></div>
                        </label>
                      </div>
                    </div>
                  </div>
                  
                  <div className="mb-6">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      {t('settings.notificationTypes', 'Notification Types')}
                    </label>
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-medium">{t('settings.wateringReminders', 'Watering Reminders')}</p>
                          <p className="text-xs text-gray-500">{t('settings.wateringRemindersDescription', 'Get notified when plants need water')}</p>
                        </div>
                        <label className="relative inline-flex items-center cursor-pointer">
                          <input 
                            type="checkbox" 
                            className="sr-only peer" 
                            checked={settings.notifications.wateringReminders}
                            onChange={(e) => handleSettingChange('notifications', 'wateringReminders', e.target.checked)}
                          />
                          <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-emerald-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-600"></div>
                        </label>
                      </div>
                      
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-medium">{t('settings.criticalAlerts', 'Critical Alerts')}</p>
                          <p className="text-xs text-gray-500">{t('settings.criticalAlertsDescription', 'Get notified for critical issues (e.g., extreme temperature)')}</p>
                        </div>
                        <label className="relative inline-flex items-center cursor-pointer">
                          <input 
                            type="checkbox" 
                            className="sr-only peer" 
                            checked={settings.notifications.criticalAlerts}
                            onChange={(e) => handleSettingChange('notifications', 'criticalAlerts', e.target.checked)}
                          />
                          <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-emerald-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-600"></div>
                        </label>
                      </div>
                      
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-medium">{t('settings.weeklyReports', 'Weekly Reports')}</p>
                          <p className="text-xs text-gray-500">{t('settings.weeklyReportsDescription', 'Receive weekly plant health reports')}</p>
                        </div>
                        <label className="relative inline-flex items-center cursor-pointer">
                          <input 
                            type="checkbox" 
                            className="sr-only peer" 
                            checked={settings.notifications.weeklyReports}
                            onChange={(e) => handleSettingChange('notifications', 'weeklyReports', e.target.checked)}
                          />
                          <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-emerald-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-600"></div>
                        </label>
                      </div>
                    </div>
                  </div>
                </>
              )}
              
              {/* Privacy & Security Settings */}
              {activeTab === 'privacy' && (
                <>
                  <h2 className="text-xl font-semibold text-gray-900 mb-6">
                    {t('settings.privacy', 'Privacy & Security')}
                  </h2>
                  
                  <div className="mb-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium">{t('settings.shareData', 'Share Anonymous Data')}</p>
                        <p className="text-xs text-gray-500">{t('settings.shareDataDescription', 'Share anonymous usage data to help improve the service')}</p>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input 
                          type="checkbox" 
                          className="sr-only peer" 
                          checked={settings.privacy.shareData}
                          onChange={(e) => handleSettingChange('privacy', 'shareData', e.target.checked)}
                        />
                        <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-emerald-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-600"></div>
                      </label>
                    </div>
                  </div>
                  
                  <div className="mb-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium">{t('settings.anonymousAnalytics', 'Anonymous Analytics')}</p>
                        <p className="text-xs text-gray-500">{t('settings.anonymousAnalyticsDescription', 'Allow collection of anonymized analytics data')}</p>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input 
                          type="checkbox" 
                          className="sr-only peer" 
                          checked={settings.privacy.anonymousAnalytics}
                          onChange={(e) => handleSettingChange('privacy', 'anonymousAnalytics', e.target.checked)}
                        />
                        <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-emerald-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-600"></div>
                      </label>
                    </div>
                  </div>
                  
                  <div className="mb-6">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      {t('settings.locationAccess', 'Location Access')}
                    </label>
                    <select 
                      value={settings.privacy.locationAccess} 
                      onChange={(e) => handleSettingChange('privacy', 'locationAccess', e.target.value)}
                      className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    >
                      <option value="never">{t('settings.locationNever', 'Never')}</option>
                      <option value="while-using">{t('settings.locationWhileUsing', 'While Using the App')}</option>
                      <option value="always">{t('settings.locationAlways', 'Always')}</option>
                    </select>
                    <p className="mt-1 text-sm text-gray-500">
                      {t('settings.locationAccessDescription', 'Control when the app can access your location for weather data')}
                    </p>
                  </div>
                  
                  <div className="mb-6">
                    <h3 className="text-sm font-medium text-gray-700 mb-2">
                      {t('settings.dangerZone', 'Danger Zone')}
                    </h3>
                    <div className="border border-red-200 rounded-lg p-4 bg-red-50">
                      <h4 className="text-sm font-medium text-red-700 mb-2">
                        {t('settings.deleteAccount', 'Delete Account')}
                      </h4>
                      <p className="text-xs text-red-600 mb-4">
                        {t('settings.deleteAccountWarning', 'Once you delete your account, there is no going back. Please be certain.')}
                      </p>
                      <button className="px-4 py-2 bg-white text-red-700 border border-red-300 rounded-lg hover:bg-red-50">
                        {t('settings.deleteAccount', 'Delete Account')}
                      </button>
                    </div>
                  </div>
                </>
              )}
              
              {/* Save button */}
              <div className="border-t border-gray-100 pt-6 mt-6">
                <div className="flex justify-end">
                  <button
                    className="px-6 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors flex items-center"
                    onClick={saveSettings}
                    disabled={isLoading}
                  >
                    {isLoading ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-white mr-2"></div>
                        {t('common.saving', 'Saving...')}
                      </>
                    ) : (
                      t('common.saveChanges', 'Save Changes')
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
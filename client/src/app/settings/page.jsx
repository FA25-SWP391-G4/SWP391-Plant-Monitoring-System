'use client'

import { useState, useEffect } from 'react';
import { useAuth } from '@/providers/AuthProvider';
import { useSettings } from '@/providers/SettingsProvider';
import { useRouter } from 'next/navigation';
import { useTranslation } from 'react-i18next';
import Link from 'next/link';
import settingsApi from '@/api/settingsApi';

export default function SettingsPage() {
  const { t, i18n } = useTranslation();
  const { user, loading } = useAuth();
  const { updateSettings: updateGlobalSettings } = useSettings();
  const router = useRouter();
  const isAuthenticated = !!user;
  const [activeTab, setActiveTab] = useState('widgets');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [settings, setSettings] = useState({
    appearance: {
      theme: 'system',
      fontSize: 'medium',
      colorScheme: 'default'
    },
    language: {
      preferred: 'en',
      dateFormat: 'DD/MM/YYYY',
      timeFormat: '24h'
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
    },
    widgets: {
      // Main dashboard widgets
      showPlantOverview: true,
      showSensorData: true,
      showAIInsights: true,
      showAIPredictions: true,
      showAIHistory: false,
      showWateringSchedule: true,
      showWeatherWidget: true,
      showNotifications: true,
      showQuickActions: true,
      showRecentActivity: false,
      showPlantHealth: true,
      showEnvironmentalData: true,
      
      // AI Section widgets
      showChatbot: true,
      showImageAnalysis: true,
      showDiseaseDetection: false,
      showGrowthPredictions: false,
      
      // Appearance settings
      compactMode: false,
      showWidgetTitles: true,
      showWidgetIcons: true,
      animationsEnabled: true,
      darkModeCompatible: true
    }
  });
  
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
  
  const defaultWidgetSettings = {
    // Main dashboard widgets
    showPlantOverview: true,
    showSensorData: true,
    showWeatherWidget: true,
    showWateringSchedule: true,
    showNotifications: true,
    showQuickActions: true,
    showRecentActivity: false,
    showPlantHealth: true,
    showEnvironmentalData: true,
    
    // AI Section widgets
    showAIInsights: true,
    showAIPredictions: true,
    showAIHistory: false,
    showChatbot: true,
    showImageAnalysis: true,
    showDiseaseDetection: false,
    showGrowthPredictions: false,
    
    // Appearance settings
    compactMode: false,
    showWidgetTitles: true,
    showWidgetIcons: true,
    animationsEnabled: true,
    darkModeCompatible: true
  };

  const fetchSettings = async () => {
    try {
      setIsLoading(true);
      
      // Fetch user settings from the API
      const response = await settingsApi.getUserSettings();
      
      if (response.data.success) {
        const serverSettings = response.data.data;
        console.log('[SETTINGS] Server settings received:', serverSettings);
        
        // Use server settings directly, no merging with local state
        setSettings(serverSettings);
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

    // If language preference changes, immediately update i18next
    if (category === 'language' && setting === 'preferred') {
      i18n.changeLanguage(value);
    }
  };
  
  const saveSettings = async () => {
    try {
      setIsLoading(true);
      
      // Save settings to the API
      const response = await settingsApi.updateUserSettings(settings);
      
      if (response.data.success) {
        // Update global settings context
        await updateGlobalSettings(settings);
        
        // Refetch settings to ensure local state matches what was saved
        await fetchSettings();
        
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
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[var(--sf-accent)]"></div>
      </div>
    );
  }
  
  if (!isAuthenticated) {
    return null; // Will redirect to login via useEffect
  }
  
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <main className="container mx-auto px-4 py-8">
        {/* Welcome Banner */}
        <div className="bg-gradient-to-r from-[var(--primary-green)] to-[var(--primary-green-dark)] rounded-xl shadow-lg mb-8 p-6 text-white flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="bg-white/20 backdrop-blur-sm p-3 rounded-lg">
              <svg xmlns="http://www.w3.org/2000/svg" fill="#fff" className="w-8 h-8" viewBox="0 0 24 24">
                <path fill-rule="evenodd" d="M8,12 C8,13.3062521 7.1651499,14.4175144 5.99991107,14.8293257 L6,21 C6,21.5522847 5.55228475,22 5,22 C4.44771525,22 4,21.5522847 4,21 L3.99909928,14.8289758 C2.83437743,14.4168852 2,13.3058822 2,12 C2,10.6941178 2.83437743,9.58311485 3.99909928,9.17102423 L4,3 C4,2.44771525 4.44771525,2 5,2 C5.55228475,2 6,2.44771525 6,3 L5.99991107,9.17067428 C7.1651499,9.58248558 8,10.6937479 8,12 Z M6,12 C6,11.4477153 5.55228475,11 5,11 C4.44771525,11 4,11.4477153 4,12 C4,12.5522847 4.44771525,13 5,13 C5.55228475,13 6,12.5522847 6,12 Z M15,19 C15,20.6568542 13.6568542,22 12,22 C10.3431458,22 9,20.6568542 9,19 C9,17.6941178 9.83437743,16.5831148 10.9990993,16.1710242 L11,3 C11,2.44771525 11.4477153,2 12,2 C12.5522847,2 13,2.44771525 13,3 L12.9999111,16.1706743 C14.1651499,16.5824856 15,17.6937479 15,19 Z M13,19 C13,18.4477153 12.5522847,18 12,18 C11.4477153,18 11,18.4477153 11,19 C11,19.5522847 11.4477153,20 12,20 C12.5522847,20 13,19.5522847 13,19 Z M22,5 C22,6.31179956 21.1580438,7.42694971 19.9850473,7.83453458 C19.9953052,7.88798638 20,7.94344492 20,8 L20,21 C20,21.5522847 19.5522847,22 19,22 C18.4477153,22 18,21.5522847 18,21 L18,8 C18,7.94344492 18.0046948,7.88798638 18.013716,7.83399285 C16.8419562,7.42694971 16,6.31179956 16,5 C16,3.34314575 17.3431458,2 19,2 C20.6568542,2 22,3.34314575 22,5 Z M20,5 C20,4.44771525 19.5522847,4 19,4 C18.4477153,4 18,4.44771525 18,5 C18,5.55228475 18.4477153,6 19,6 C19.5522847,6 20,5.55228475 20,5 Z"/>
              </svg>
            </div>
            
            <div>
              <h1 className="text-2xl font-bold mb-2">
                {t('navigation.settings', 'Settings')}
              </h1>
              <p className="opacity-90">
                Customize your dashboard and preferences
              </p>
            </div>
          </div>
        </div>
      
      {error && (
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-red-200 dark:border-red-700 p-4 mb-6">
          <p className="text-red-600 dark:text-red-400">{error}</p>
        </div>
      )}
      
      {success && (
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-[var(--primary-green-light)] p-4 mb-6">
          <p className="text-[var(--primary-green)] dark:text-[var(--primary-green-light)]">{success}</p>
        </div>
      )}
      
      <div className="flex flex-col md:flex-row gap-6">
        {/* Sidebar navigation */}
        <div className="w-full md:w-64 shrink-0">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden">
            <nav className="p-2">
              <button 
                className={`flex items-center w-full text-left px-4 py-3 rounded-lg transition-colors ${
                  activeTab === 'widgets' ? 'bg-[var(--primary-green-bg)] text-[var(--primary-green-dark)]' : 'hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300'
                }`}
                onClick={() => setActiveTab('widgets')}
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
                </svg>
                <span>{t('settings.widgets', 'Widgets & Features')}</span>
              </button>

              <button 
                className={`flex items-center w-full text-left px-4 py-3 rounded-lg transition-colors ${
                  activeTab === 'appearance' ? 'bg-[var(--primary-green-bg)] text-[var(--primary-green-dark)]' : 'hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300'
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
                  activeTab === 'language' ? 'bg-[var(--primary-green-bg)] text-[var(--primary-green-dark)]' : 'hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300'
                }`}
                onClick={() => setActiveTab('language')}
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5h12M9 3v2m1.048 9.5A18.022 18.022 0 016.412 9m6.088 9h7M11 21l5-10 5 10M12.751 5C11.783 10.77 8.07 15.61 3 18.129" />
                </svg>
                <span>{t('settings.language', 'Language & Region')}</span>
              </button>
              
              <button 
                className={`flex items-center w-full text-left px-4 py-3 rounded-lg transition-colors settings-nav-item ${
                  activeTab === 'notifications' ? 'bg-emerald-50 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400' : 'hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300'
                }`}
                onClick={() => setActiveTab('notifications')}
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                </svg>
                <span>{t('settings.notifications', 'Notifications')}</span>
              </button>
              
              <button 
                className={`flex items-center w-full text-left px-4 py-3 rounded-lg transition-colors settings-nav-item ${
                  activeTab === 'privacy' ? 'bg-emerald-50 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400' : 'hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300'
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
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden">
            <div className="p-6">
              {/* Appearance Settings */}


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
                      className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 settings-form-element"
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
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                      <button 
                        className={`px-4 py-3 border rounded-lg flex flex-col items-center transition-all ${
                          settings.appearance.fontSize === 'small' 
                            ? 'bg-[var(--primary-green-bg)] border-[var(--primary-green)] text-[var(--primary-green-dark)]' 
                            : 'border-gray-200 hover:bg-gray-50'
                        }`}
                        onClick={() => handleSettingChange('appearance', 'fontSize', 'small')}
                      >
                        <span className="text-sm mb-1">Aa</span>
                        <span className="text-xs">{t('settings.fontSizeSmall', 'Small')}</span>
                      </button>
                      <button 
                        className={`px-4 py-3 border rounded-lg flex flex-col items-center transition-all ${
                          settings.appearance.fontSize === 'medium' 
                            ? 'bg-[var(--primary-green-bg)] border-[var(--primary-green)] text-[var(--primary-green-dark)]' 
                            : 'border-gray-200 hover:bg-gray-50'
                        }`}
                        onClick={() => handleSettingChange('appearance', 'fontSize', 'medium')}
                      >
                        <span className="text-base mb-1">Aa</span>
                        <span className="text-xs">{t('settings.fontSizeMedium', 'Medium')}</span>
                      </button>
                      <button 
                        className={`px-4 py-3 border rounded-lg flex flex-col items-center transition-all ${
                          settings.appearance.fontSize === 'large' 
                            ? 'bg-[var(--primary-green-bg)] border-[var(--primary-green)] text-[var(--primary-green-dark)]' 
                            : 'border-gray-200 hover:bg-gray-50'
                        }`}
                        onClick={() => handleSettingChange('appearance', 'fontSize', 'large')}
                      >
                        <span className="text-lg mb-1">Aa</span>
                        <span className="text-xs">{t('settings.fontSizeLarge', 'Large')}</span>
                      </button>
                      <button 
                        className={`px-4 py-3 border rounded-lg flex flex-col items-center transition-all ${
                          settings.appearance.fontSize === 'xl' 
                            ? 'bg-[var(--primary-green-bg)] border-[var(--primary-green)] text-[var(--primary-green-dark)]' 
                            : 'border-gray-200 hover:bg-gray-50'
                        }`}
                        onClick={() => handleSettingChange('appearance', 'fontSize', 'xl')}
                      >
                        <span className="text-xl mb-1">Aa</span>
                        <span className="text-xs">{t('settings.fontSizeXL', 'Extra Large')}</span>
                      </button>
                    </div>
                  </div>
                  
                  <div className="mb-6">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      {t('settings.colorScheme', 'Color Scheme')}
                    </label>
                    <div className="grid grid-cols-3 gap-4">
                      <button 
                        className={`p-4 border rounded-lg flex flex-col items-center transition-all color-scheme-emerald ${
                          settings.appearance.colorScheme === 'default' 
                            ? 'bg-emerald-50 border-emerald-500 ring-2 ring-emerald-200' 
                            : 'border-gray-200 hover:bg-gray-50'
                        }`}
                        onClick={() => handleSettingChange('appearance', 'colorScheme', 'default')}
                      >
                        <div className="w-12 h-6 rounded-full bg-emerald-500 mb-2"></div>
                        <span className="text-sm">{t('settings.colorEmerald', 'Emerald')}</span>
                      </button>
                      <button 
                        className={`p-4 border rounded-lg flex flex-col items-center transition-all ${
                          settings.appearance.colorScheme === 'blue' 
                            ? 'bg-blue-50 border-blue-500 ring-2 ring-blue-200' 
                            : 'border-gray-200 hover:bg-gray-50'
                        }`}
                        onClick={() => handleSettingChange('appearance', 'colorScheme', 'blue')}
                      >
                        <div className="w-12 h-6 rounded-full bg-blue-500 mb-2"></div>
                        <span className="text-sm">{t('settings.colorBlue', 'Blue')}</span>
                      </button>
                      <button 
                        className={`p-4 border rounded-lg flex flex-col items-center transition-all ${
                          settings.appearance.colorScheme === 'purple' 
                            ? 'bg-purple-50 border-purple-500 ring-2 ring-purple-200' 
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

              {/* Widgets & Features Settings */}
              {activeTab === 'widgets' && (
                <>
                  <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-6">
                    {t('settings.widgets', 'Widgets & Features')}
                  </h2>
                  
                  <div className="mb-6">
                    <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-4">
                      {t('settings.dashboardWidgets', 'Dashboard Widgets')}
                    </h3>
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-medium">{t('settings.showPlantOverview', 'Plant Overview')}</p>
                          <p className="text-xs text-gray-500">{t('settings.showPlantOverviewDesc', 'Show plant statistics cards')}</p>
                        </div>
                        <label className="relative inline-flex items-center cursor-pointer">
                          <input 
                            type="checkbox" 
                            className="sr-only peer" 
                            checked={settings.widgets.showPlantOverview}
                            onChange={(e) => handleSettingChange('widgets', 'showPlantOverview', e.target.checked)}
                          />
                          <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-[var(--primary-green-light)] rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[var(--primary-green)]"></div>
                        </label>
                      </div>

                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-medium">{t('settings.showSensorData', 'Sensor Data Widgets')}</p>
                          <p className="text-xs text-gray-500">{t('settings.showSensorDataDesc', 'Display real-time sensor readings')}</p>
                        </div>
                        <label className="relative inline-flex items-center cursor-pointer">
                          <input 
                            type="checkbox" 
                            className="sr-only peer" 
                            checked={settings.widgets.showSensorData}
                            onChange={(e) => handleSettingChange('widgets', 'showSensorData', e.target.checked)}
                          />
                          <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-[var(--primary-green-light)] rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[var(--primary-green)]"></div>
                        </label>
                      </div>

                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-medium">{t('settings.showWeatherWidget', 'Weather Widget')}</p>
                          <p className="text-xs text-gray-500">{t('settings.showWeatherWidgetDesc', 'Display weather information')}</p>
                        </div>
                        <label className="relative inline-flex items-center cursor-pointer">
                          <input 
                            type="checkbox" 
                            className="sr-only peer" 
                            checked={settings.widgets.showWeatherWidget}
                            onChange={(e) => handleSettingChange('widgets', 'showWeatherWidget', e.target.checked)}
                          />
                          <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-[var(--primary-green-light)] rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[var(--primary-green)]"></div>
                        </label>
                      </div>

                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-medium">{t('settings.showWateringSchedule', 'Watering Schedule')}</p>
                          <p className="text-xs text-gray-500">{t('settings.showWateringScheduleDesc', 'Display upcoming watering schedule')}</p>
                        </div>
                        <label className="relative inline-flex items-center cursor-pointer">
                          <input 
                            type="checkbox" 
                            className="sr-only peer" 
                            checked={settings.widgets.showWateringSchedule}
                            onChange={(e) => handleSettingChange('widgets', 'showWateringSchedule', e.target.checked)}
                          />
                          <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-[var(--primary-green-light)] rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[var(--primary-green)]"></div>
                        </label>
                      </div>

                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-medium">{t('settings.showNotifications', 'Notifications Widget')}</p>
                          <p className="text-xs text-gray-500">{t('settings.showNotificationsDesc', 'Show recent notifications')}</p>
                        </div>
                        <label className="relative inline-flex items-center cursor-pointer">
                          <input 
                            type="checkbox" 
                            className="sr-only peer" 
                            checked={settings.widgets.showNotifications}
                            onChange={(e) => handleSettingChange('widgets', 'showNotifications', e.target.checked)}
                          />
                          <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-[var(--primary-green-light)] rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[var(--primary-green)]"></div>
                        </label>
                      </div>

                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-medium">{t('settings.showRecentActivity', 'Recent Activity')}</p>
                          <p className="text-xs text-gray-500">{t('settings.showRecentActivityDesc', 'Display recent plant care activities')}</p>
                        </div>
                        <label className="relative inline-flex items-center cursor-pointer">
                          <input 
                            type="checkbox" 
                            className="sr-only peer" 
                            checked={settings.widgets.showRecentActivity}
                            onChange={(e) => handleSettingChange('widgets', 'showRecentActivity', e.target.checked)}
                          />
                          <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-[var(--primary-green-light)] rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[var(--primary-green)]"></div>
                        </label>
                      </div>
                    </div>
                  </div>

                  <div className="mb-6 border-t border-gray-100 pt-6">
                    <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-4">
                      {t('settings.aiFeatures', 'AI Features')}
                    </h3>
                    <div className="space-y-4">
                      {/* Master AI Toggle */}
                      <div className="flex items-center justify-between p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
                        <div>
                          <p className="text-sm font-semibold text-blue-900 dark:text-blue-100">{t('settings.enableAIFeatures', 'Enable AI Features')}</p>
                          <p className="text-xs text-blue-700 dark:text-blue-300">{t('settings.enableAIFeaturesDesc', 'Master toggle for all AI-powered features')}</p>
                        </div>
                        <label className="relative inline-flex items-center cursor-pointer">
                          <input 
                            type="checkbox" 
                            className="sr-only peer" 
                            checked={settings.widgets.enableAIFeatures}
                            onChange={(e) => handleSettingChange('widgets', 'enableAIFeatures', e.target.checked)}
                          />
                          <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                        </label>
                      </div>

                      {/* Individual AI Features - disabled when master toggle is off */}
                      <div className={`space-y-4 ${!settings.widgets.enableAIFeatures ? 'opacity-50 pointer-events-none' : ''}`}>
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-sm font-medium">{t('settings.showChatbot', 'AI Chatbot')}</p>
                            <p className="text-xs text-gray-500">{t('settings.showChatbotDesc', 'Enable plant care AI assistant')}</p>
                          </div>
                          <label className="relative inline-flex items-center cursor-pointer">
                            <input 
                              type="checkbox" 
                              className="sr-only peer" 
                              checked={settings.widgets.showChatbot && settings.widgets.enableAIFeatures}
                              onChange={(e) => handleSettingChange('widgets', 'showChatbot', e.target.checked)}
                              disabled={!settings.widgets.enableAIFeatures}
                            />
                            <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-[var(--primary-green-light)] rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[var(--primary-green)]"></div>
                          </label>
                        </div>

                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-sm font-medium">{t('settings.showAIInsights', 'AI Insights')}</p>
                            <p className="text-xs text-gray-500">{t('settings.showAIInsightsDesc', 'Show AI-powered plant analysis')}</p>
                          </div>
                          <label className="relative inline-flex items-center cursor-pointer">
                            <input 
                              type="checkbox" 
                              className="sr-only peer" 
                              checked={settings.widgets.showAIInsights && settings.widgets.enableAIFeatures}
                              onChange={(e) => handleSettingChange('widgets', 'showAIInsights', e.target.checked)}
                              disabled={!settings.widgets.enableAIFeatures}
                            />
                            <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-[var(--primary-green-light)] rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[var(--primary-green)]"></div>
                          </label>
                        </div>

                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-sm font-medium">{t('settings.showImageAnalysis', 'Image Analysis')}</p>
                            <p className="text-xs text-gray-500">{t('settings.showImageAnalysisDesc', 'Enable plant image analysis features')}</p>
                          </div>
                          <label className="relative inline-flex items-center cursor-pointer">
                            <input 
                              type="checkbox" 
                              className="sr-only peer" 
                              checked={settings.widgets.showImageAnalysis && settings.widgets.enableAIFeatures}
                              onChange={(e) => handleSettingChange('widgets', 'showImageAnalysis', e.target.checked)}
                              disabled={!settings.widgets.enableAIFeatures}
                            />
                            <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-[var(--primary-green-light)] rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[var(--primary-green)]"></div>
                          </label>
                        </div>

                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-sm font-medium">{t('settings.showAIPredictions', 'AI Predictions')}</p>
                            <p className="text-xs text-gray-500">{t('settings.showAIPredictionsDesc', 'Show watering and care predictions')}</p>
                          </div>
                          <label className="relative inline-flex items-center cursor-pointer">
                            <input 
                              type="checkbox" 
                              className="sr-only peer" 
                              checked={settings.widgets.showAIPredictions && settings.widgets.enableAIFeatures}
                              onChange={(e) => handleSettingChange('widgets', 'showAIPredictions', e.target.checked)}
                              disabled={!settings.widgets.enableAIFeatures}
                            />
                            <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-[var(--primary-green-light)] rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[var(--primary-green)]"></div>
                          </label>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="mb-6 border-t border-gray-100 pt-6">
                    <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-4">
                      {t('settings.widgetAppearance', 'Widget Appearance')}
                    </h3>
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-medium">{t('settings.compactMode', 'Compact Mode')}</p>
                          <p className="text-xs text-gray-500">{t('settings.compactModeDesc', 'Use smaller widgets to show more content')}</p>
                        </div>
                        <label className="relative inline-flex items-center cursor-pointer">
                          <input 
                            type="checkbox" 
                            className="sr-only peer" 
                            checked={settings.widgets.compactMode}
                            onChange={(e) => handleSettingChange('widgets', 'compactMode', e.target.checked)}
                          />
                          <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-[var(--primary-green-light)] rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[var(--primary-green)]"></div>
                        </label>
                      </div>

                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-medium">{t('settings.showWidgetTitles', 'Widget Titles')}</p>
                          <p className="text-xs text-gray-500">{t('settings.showWidgetTitlesDesc', 'Display titles on widgets')}</p>
                        </div>
                        <label className="relative inline-flex items-center cursor-pointer">
                          <input 
                            type="checkbox" 
                            className="sr-only peer" 
                            checked={settings.widgets.showWidgetTitles}
                            onChange={(e) => handleSettingChange('widgets', 'showWidgetTitles', e.target.checked)}
                          />
                          <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-[var(--primary-green-light)] rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[var(--primary-green)]"></div>
                        </label>
                      </div>

                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-medium">{t('settings.showWidgetIcons', 'Widget Icons')}</p>
                          <p className="text-xs text-gray-500">{t('settings.showWidgetIconsDesc', 'Show icons on widgets')}</p>
                        </div>
                        <label className="relative inline-flex items-center cursor-pointer">
                          <input 
                            type="checkbox" 
                            className="sr-only peer" 
                            checked={settings.widgets.showWidgetIcons}
                            onChange={(e) => handleSettingChange('widgets', 'showWidgetIcons', e.target.checked)}
                          />
                          <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-[var(--primary-green-light)] rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[var(--primary-green)]"></div>
                        </label>
                      </div>

                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-medium">{t('settings.animationsEnabled', 'Animations')}</p>
                          <p className="text-xs text-gray-500">{t('settings.animationsEnabledDesc', 'Enable smooth animations and transitions')}</p>
                        </div>
                        <label className="relative inline-flex items-center cursor-pointer">
                          <input 
                            type="checkbox" 
                            className="sr-only peer" 
                            checked={settings.widgets.animationsEnabled}
                            onChange={(e) => handleSettingChange('widgets', 'animationsEnabled', e.target.checked)}
                          />
                          <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-[var(--primary-green-light)] rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[var(--primary-green)]"></div>
                        </label>
                      </div>
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
                      className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--primary-green)]"
                    >
                      <option value="en">{t('languages.english', 'English')}</option>
                      {/* <option value="es">🇪🇸 {t('languages.spanish', 'Español')}</option> */}
                      {/* <option value="fr">🇫🇷 {t('languages.french', 'Français')}</option> */}
                      {/* <option value="zh">🇨🇳 {t('languages.chinese', '中文')}</option> */}
                      <option value="vi">{t('languages.vietnamese', 'Tiếng Việt')}</option>
                      {/* <option value="ja">🇯🇵 {t('languages.japanese', '日本語')}</option> */}
                      {/* <option value="kr">🇰🇷 {t('languages.korean', '한국어')}</option> */}
                    </select>
                  </div>
                  
                  <div className="mb-6">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      {t('settings.dateFormat', 'Date Format')}
                    </label>
                    <div className="flex flex-wrap gap-3">
                      <button 
                        className={`px-4 py-2 border rounded-lg transition-all ${
                          settings.language.dateFormat === 'MM/DD/YYYY' 
                            ? 'bg-[var(--primary-green-bg)] border-[var(--primary-green)] text-[var(--primary-green-dark)]' 
                            : 'border-gray-200 hover:bg-gray-50'
                        }`}
                        onClick={() => handleSettingChange('language', 'dateFormat', 'MM/DD/YYYY')}
                      >
                        MM/DD/YYYY
                      </button>
                      <button 
                        className={`px-4 py-2 border rounded-lg transition-all ${
                          settings.language.dateFormat === 'DD/MM/YYYY' 
                            ? 'bg-[var(--primary-green-bg)] border-[var(--primary-green)] text-[var(--primary-green-dark)]' 
                            : 'border-gray-200 hover:bg-gray-50'
                        }`}
                        onClick={() => handleSettingChange('language', 'dateFormat', 'DD/MM/YYYY')}
                      >
                        DD/MM/YYYY
                      </button>
                      <button 
                        className={`px-4 py-2 border rounded-lg transition-all ${
                          settings.language.dateFormat === 'YYYY-MM-DD' 
                            ? 'bg-[var(--primary-green-bg)] border-[var(--primary-green)] text-[var(--primary-green-dark)]' 
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
                        className={`px-4 py-2 border rounded-lg transition-all ${
                          settings.language.timeFormat === '12h' 
                            ? 'bg-[var(--primary-green-bg)] border-[var(--primary-green)] text-[var(--primary-green-dark)]' 
                            : 'border-gray-200 hover:bg-gray-50'
                        }`}
                        onClick={() => handleSettingChange('language', 'timeFormat', '12h')}
                      >
                        {t('settings.timeFormat12h', '12-hour (AM/PM)')}
                      </button>
                      <button 
                        className={`px-4 py-2 border rounded-lg transition-all ${
                          settings.language.timeFormat === '24h' 
                            ? 'bg-[var(--primary-green-bg)] border-[var(--primary-green)] text-[var(--primary-green-dark)]' 
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
                          <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-[var(--primary-green-light)] rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[var(--primary-green)]"></div>
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
                          <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-[var(--primary-green-light)] rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[var(--primary-green)]"></div>
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
                          <div className={`w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-[var(--primary-green-light)] rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[var(--primary-green)] ${
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
                          <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-[var(--primary-green-light)] rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[var(--primary-green)]"></div>
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
                          <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-[var(--primary-green-light)] rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[var(--primary-green)]"></div>
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
                          <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-[var(--primary-green-light)] rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[var(--primary-green)]"></div>
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
                        <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-[var(--primary-green-light)] rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[var(--primary-green)]"></div>
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
                        <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-[var(--primary-green-light)] rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[var(--primary-green)]"></div>
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
                      className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 settings-form-element"
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
              
              {/* Save and Reset buttons */}
              <div className="border-t border-gray-100 pt-6 mt-6">
                <div className="flex justify-between items-center">
                  <button
                    className="px-6 py-2 border border-gray-200 text-gray-600 rounded-lg hover:bg-gray-50 transition-colors flex items-center"
                    onClick={() => fetchSettings()} // Re-fetch settings to reset
                    disabled={isLoading}
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                    </svg>
                    {t('common.resetDefaults', 'Reset to Defaults')}
                  </button>
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
                      <>
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                        {t('common.saveChanges', 'Save Changes')}
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      </main>
    </div>
  );
}

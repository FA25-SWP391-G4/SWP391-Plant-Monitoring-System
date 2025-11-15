'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { useTranslation } from 'react-i18next';
import settingsApi from '@/api/settingsApi';

const SettingsContext = createContext();

export function useSettings() {
  const context = useContext(SettingsContext);
  if (!context) {
    throw new Error('useSettings must be used within a SettingsProvider');
  }
  return context;
}

const defaultSettings = {
  appearance: {
    theme: 'system',
    fontSize: 'medium',
    colorScheme: 'blue' // Changed from 'green' to 'blue' as requested
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
  },
  widgets: {
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
    
    // AI Section master toggle
    enableAIFeatures: true,
    
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
  }
};

export function SettingsProvider({ children }) {
  const [settings, setSettings] = useState(defaultSettings);
  const [loading, setLoading] = useState(true);
  const pathname = usePathname();
  const { i18n } = useTranslation();

  // Check if we're on an excluded page (landing, demo, auth)
  const isExcludedPage = pathname === '/' || 
                         pathname.startsWith('/login') || 
                         pathname.startsWith('/register') || 
                         pathname.startsWith('/forgot-password') || 
                         pathname.startsWith('/reset-password') || 
                         pathname.startsWith('/demo');

  useEffect(() => {
    // Only fetch settings if not on excluded pages
    if (!isExcludedPage) {
      fetchSettings();
    } else {
      // For excluded pages, just use defaults and mark as loaded
      setLoading(false);
    }
  }, [isExcludedPage]);

  const fetchSettings = async () => {
    try {
      const response = await settingsApi.getUserSettings();
      if (response.data.success) {
        // Server already returns merged settings with defaults
        setSettings(response.data.data);
      }
    } catch (error) {
      console.error('Failed to fetch settings:', error);
    } finally {
      setLoading(false);
    }
  };

  const updateSettings = async (newSettings) => {
    try {
      const response = await settingsApi.updateUserSettings(newSettings);
      if (response.data.success) {
        // Refetch settings from server to get the correctly merged result
        await fetchSettings();
        return { success: true };
      }
      return { success: false, error: response.data.error };
    } catch (error) {
      console.error('Failed to update settings:', error);
      return { success: false, error: error.message };
    }
  };

  // Apply theme and color scheme settings
  useEffect(() => {
    const themeClass = settings?.appearance.theme === 'system'
      ? (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light')
      : settings?.appearance.theme;
    
    document.documentElement.classList.remove('light', 'dark');
    document.documentElement.classList.add(themeClass);
  }, [settings?.appearance.theme]);

  // Apply color scheme and page scoping
  useEffect(() => {
    const colorScheme = settings?.appearance.colorScheme || 'blue';
    
    // Remove all possible color scheme classes
    document.documentElement.classList.remove('color-emerald', 'color-blue', 'color-purple', 'color-indigo');
    
    // Add/remove scoping class based on current page
    document.documentElement.classList.toggle('apply-color-overrides', !isExcludedPage);
    
    // Apply the selected color scheme
    document.documentElement.classList.add(`color-${colorScheme}`);
  }, [settings?.appearance.colorScheme, isExcludedPage]);

  // Apply font size
  useEffect(() => {
    const fontSize = settings?.appearance.fontSize || 'medium';
    
    // Remove all possible font size classes
    document.documentElement.classList.remove('text-sm', 'text-base', 'text-lg', 'text-xl');
    
    // Apply the selected font size class
    const fontSizeClasses = {
      small: 'text-sm',
      medium: 'text-base', 
      large: 'text-lg',
      xl: 'text-xl'
    };
    
    document.documentElement.classList.add(fontSizeClasses[fontSize]);
    
    // Set CSS custom property for more granular control
    const fontSizeValues = {
      small: '14px',
      medium: '16px',
      large: '18px', 
      xl: '20px'
    };
    
    document.documentElement.style.setProperty('--base-font-size', fontSizeValues[fontSize]);
  }, [settings?.appearance.fontSize]);

  // Apply compact mode
  useEffect(() => {
    const compactMode = settings?.widgets?.compactMode;
    
    // Toggle compact mode class
    document.documentElement.classList.toggle('compact-mode', compactMode);
  }, [settings?.widgets?.compactMode]);

  // Apply widget settings
  useEffect(() => {
    const widgetSettings = settings?.widgets;
    if (!widgetSettings) return;

    // Apply showWidgetTitles setting
    document.documentElement.classList.toggle('hide-widget-titles', !widgetSettings.showWidgetTitles);
    
    // Apply showWidgetIcons setting
    document.documentElement.classList.toggle('hide-widget-icons', !widgetSettings.showWidgetIcons);
    
    // Apply animations setting
    document.documentElement.classList.toggle('disable-animations', !widgetSettings.animationsEnabled);
    document.documentElement.classList.toggle('animate-transitions', widgetSettings.animationsEnabled);
  }, [settings?.widgets?.showWidgetTitles, settings?.widgets?.showWidgetIcons, settings?.widgets?.animationsEnabled]);

  // Apply language settings
  useEffect(() => {
    const preferredLanguage = settings?.language?.preferred;
    if (preferredLanguage && i18n) {
      // Update i18next language if it differs from current
      if (i18n.language !== preferredLanguage) {
        i18n.changeLanguage(preferredLanguage);
        localStorage.setItem('i18nextLng', preferredLanguage);
      }
    }
  }, [settings?.language?.preferred, i18n]);

  return (
    <SettingsContext.Provider value={{ settings, updateSettings, loading }}>
      {children}
    </SettingsContext.Provider>
  );
}
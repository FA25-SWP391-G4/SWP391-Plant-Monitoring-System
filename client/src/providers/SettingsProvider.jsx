'use client';

import { createContext, useContext, useEffect, useState } from 'react';
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
  },
  dashboard: {
    showWateringStatus: true,
    showPlantHealth: true,
    showWeatherInfo: true,
    showSensorData: true,
    showAlerts: true,
    enableAIFeatures: false
  }
};

export function SettingsProvider({ children }) {
  const [settings, setSettings] = useState(defaultSettings);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      const response = await settingsApi.getUserSettings();
      if (response.data.success) {
        setSettings({
          ...defaultSettings,
          ...response.data.data,
          dashboard: {
            ...defaultSettings.dashboard,
            ...(response.data.data.dashboard || {})
          }
        });
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

  // Apply theme setting
  useEffect(() => {
    const themeClass = settings.appearance.theme === 'system'
      ? (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light')
      : settings.appearance.theme;
    
    document.documentElement.classList.remove('light', 'dark');
    document.documentElement.classList.add(themeClass);
  }, [settings.appearance.theme]);

  return (
    <SettingsContext.Provider value={{ settings, updateSettings, loading }}>
      {children}
    </SettingsContext.Provider>
  );
}
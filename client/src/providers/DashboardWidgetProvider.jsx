/**
 * Dashboard Widget Provider
 * Manages widget visibility and appearance settings
 */
'use client'

import React, { createContext, useContext, useState, useEffect } from 'react';
import settingsApi from '@/api/settingsApi';
import { useAuth } from './AuthProvider';

const DashboardWidgetContext = createContext();

export function useDashboardWidgets() {
  const context = useContext(DashboardWidgetContext);
  if (!context) {
    throw new Error('useDashboardWidgets must be used within a DashboardWidgetProvider');
  }
  return context;
}

export function DashboardWidgetProvider({ children }) {
  const { user, isAuthenticated } = useAuth();
  
  // Default widget visibility settings
  const defaultSettings = {
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
  };

  const [widgetSettings, setWidgetSettings] = useState(defaultSettings);
  const [loading, setLoading] = useState(true);

  // Load settings from API on component mount for authenticated users
  useEffect(() => {
    const loadSettings = async () => {
      if (!isAuthenticated || !user) {
        // For non-authenticated users, try to load from localStorage
        try {
          const savedSettings = localStorage.getItem('dashboardAppearanceSettings');
          if (savedSettings) {
            const parsed = JSON.parse(savedSettings);
            setWidgetSettings(prev => ({ ...prev, ...parsed }));
          }
        } catch (error) {
          console.error('Error loading dashboard widget settings from localStorage:', error);
        } finally {
          setLoading(false);
        }
        return;
      }

      // For authenticated users, load from API
      try {
        const response = await settingsApi.getWidgetSettings();
        if (response.data.success) {
          setWidgetSettings(prev => ({ ...prev, ...response.data.data }));
        }
      } catch (error) {
        console.error('Error loading dashboard widget settings from API:', error);
        // Fallback to localStorage
        try {
          const savedSettings = localStorage.getItem('dashboardAppearanceSettings');
          if (savedSettings) {
            const parsed = JSON.parse(savedSettings);
            setWidgetSettings(prev => ({ ...prev, ...parsed }));
          }
        } catch (localError) {
          console.error('Error loading from localStorage fallback:', localError);
        }
      } finally {
        setLoading(false);
      }
    };

    loadSettings();
  }, [isAuthenticated, user]);

  // Save settings to API for authenticated users, localStorage for others
  const updateWidgetSettings = async (newSettings) => {
    const updatedSettings = { ...widgetSettings, ...newSettings };
    setWidgetSettings(updatedSettings);
    
    if (isAuthenticated && user) {
      // Save to API for authenticated users
      try {
        await settingsApi.updateWidgetSettings(updatedSettings);
        
        // Trigger a custom event to notify other components
        window.dispatchEvent(new CustomEvent('dashboardSettingsChanged', { 
          detail: updatedSettings 
        }));
      } catch (error) {
        console.error('Error saving dashboard widget settings to API:', error);
        // Fallback to localStorage
        try {
          localStorage.setItem('dashboardAppearanceSettings', JSON.stringify(updatedSettings));
        } catch (localError) {
          console.error('Error saving to localStorage fallback:', localError);
        }
      }
    } else {
      // Save to localStorage for non-authenticated users
      try {
        localStorage.setItem('dashboardAppearanceSettings', JSON.stringify(updatedSettings));
        
        // Trigger a custom event to notify other components
        window.dispatchEvent(new CustomEvent('dashboardSettingsChanged', { 
          detail: updatedSettings 
        }));
      } catch (error) {
        console.error('Error saving dashboard widget settings to localStorage:', error);
      }
    }
  };

  // Toggle a specific widget
  const toggleWidget = (widgetKey) => {
    updateWidgetSettings({
      [widgetKey]: !widgetSettings[widgetKey]
    });
  };

  // Reset all settings to defaults
  const resetToDefaults = async () => {
    setWidgetSettings(defaultSettings);
    
    if (isAuthenticated && user) {
      // Reset via API for authenticated users
      try {
        await settingsApi.resetWidgetSettings();
        
        // Trigger a custom event to notify other components
        window.dispatchEvent(new CustomEvent('dashboardSettingsChanged', { 
          detail: defaultSettings 
        }));
      } catch (error) {
        console.error('Error resetting dashboard widget settings via API:', error);
        // Fallback to localStorage
        try {
          localStorage.setItem('dashboardAppearanceSettings', JSON.stringify(defaultSettings));
        } catch (localError) {
          console.error('Error saving to localStorage fallback:', localError);
        }
      }
    } else {
      // Reset in localStorage for non-authenticated users
      try {
        localStorage.setItem('dashboardAppearanceSettings', JSON.stringify(defaultSettings));
        
        // Trigger a custom event to notify other components
        window.dispatchEvent(new CustomEvent('dashboardSettingsChanged', { 
          detail: defaultSettings 
        }));
      } catch (error) {
        console.error('Error resetting dashboard widget settings in localStorage:', error);
      }
    }
  };

  // Check if a widget should be visible
  const isWidgetVisible = (widgetKey) => {
    return widgetSettings[widgetKey] !== undefined ? widgetSettings[widgetKey] : true;
  };

  // Get current appearance settings
  const getAppearanceSettings = () => {
    return {
      compactMode: widgetSettings.compactMode,
      showWidgetTitles: widgetSettings.showWidgetTitles,
      showWidgetIcons: widgetSettings.showWidgetIcons,
      animationsEnabled: widgetSettings.animationsEnabled,
      darkModeCompatible: widgetSettings.darkModeCompatible
    };
  };

  const value = {
    widgetSettings,
    updateWidgetSettings,
    toggleWidget,
    resetToDefaults,
    isWidgetVisible,
    getAppearanceSettings,
    loading
  };

  return (
    <DashboardWidgetContext.Provider value={value}>
      {children}
    </DashboardWidgetContext.Provider>
  );
}
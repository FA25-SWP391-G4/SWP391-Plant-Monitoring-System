/**
 * Dashboard Widget Provider
 * Manages widget visibility and appearance settings
 */
'use client'

import React, { createContext, useContext, useState, useEffect } from 'react';

const DashboardWidgetContext = createContext();

export function useDashboardWidgets() {
  const context = useContext(DashboardWidgetContext);
  if (!context) {
    throw new Error('useDashboardWidgets must be used within a DashboardWidgetProvider');
  }
  return context;
}

export function DashboardWidgetProvider({ children }) {
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

  // Load settings from localStorage on component mount
  useEffect(() => {
    try {
      const savedSettings = localStorage.getItem('dashboardAppearanceSettings');
      if (savedSettings) {
        const parsed = JSON.parse(savedSettings);
        setWidgetSettings(prev => ({ ...prev, ...parsed }));
      }
    } catch (error) {
      console.error('Error loading dashboard widget settings:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  // Save settings to localStorage whenever they change
  const updateWidgetSettings = (newSettings) => {
    const updatedSettings = { ...widgetSettings, ...newSettings };
    setWidgetSettings(updatedSettings);
    
    try {
      localStorage.setItem('dashboardAppearanceSettings', JSON.stringify(updatedSettings));
      
      // Trigger a custom event to notify other components
      window.dispatchEvent(new CustomEvent('dashboardSettingsChanged', { 
        detail: updatedSettings 
      }));
    } catch (error) {
      console.error('Error saving dashboard widget settings:', error);
    }
  };

  // Toggle a specific widget
  const toggleWidget = (widgetKey) => {
    updateWidgetSettings({
      [widgetKey]: !widgetSettings[widgetKey]
    });
  };

  // Reset all settings to defaults
  const resetToDefaults = () => {
    setWidgetSettings(defaultSettings);
    try {
      localStorage.setItem('dashboardAppearanceSettings', JSON.stringify(defaultSettings));
      window.dispatchEvent(new CustomEvent('dashboardSettingsChanged', { 
        detail: defaultSettings 
      }));
    } catch (error) {
      console.error('Error resetting dashboard widget settings:', error);
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
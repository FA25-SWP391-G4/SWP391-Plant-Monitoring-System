/**
 * Conditional Widget Wrapper
 * Wraps dashboard widgets and shows/hides them based on user settings
 */
'use client'

import React from 'react';
import { useDashboardWidgets } from '@/providers/DashboardWidgetProvider';

const ConditionalWidget = ({ 
  widgetKey, 
  children, 
  fallback = null,
  className = "",
  animationDelay = 0
}) => {
  const { isWidgetVisible, getAppearanceSettings } = useDashboardWidgets();
  const appearanceSettings = getAppearanceSettings();
  
  if (!isWidgetVisible(widgetKey)) {
    return fallback;
  }

  const baseClasses = appearanceSettings.animationsEnabled 
    ? `fade-in ${className}` 
    : className;

  const animationStyle = appearanceSettings.animationsEnabled && animationDelay > 0 
    ? { animationDelay: `${animationDelay}ms` }
    : {};

  return (
    <div 
      className={baseClasses}
      style={animationStyle}
    >
      {children}
    </div>
  );
};

export default ConditionalWidget;
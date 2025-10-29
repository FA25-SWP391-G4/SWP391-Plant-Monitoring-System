/**
 * Theme Context
 * Manages theme state and provides theme utilities
 * Integrates with next-themes for system theme detection
 */
'use client'

import { createContext, useContext, useEffect, useState } from 'react'
import { useTheme as useNextTheme } from 'next-themes'

const ThemeContext = createContext()

export const useTheme = () => {
  const context = useContext(ThemeContext)
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider')
  }
  return context
}

export const ThemeProvider = ({ children }) => {
  const { theme, setTheme, systemTheme, resolvedTheme } = useNextTheme()
  const [mounted, setMounted] = useState(false)

  // Ensure we're mounted to prevent hydration mismatch
  useEffect(() => {
    setMounted(true)
  }, [])

  // Get the current effective theme
  const currentTheme = resolvedTheme || theme || 'light'
  const isDark = currentTheme === 'dark'
  const isLight = currentTheme === 'light'
  const isSystem = theme === 'system'

  // Theme toggle functions
  const toggleTheme = () => {
    setTheme(isDark ? 'light' : 'dark')
  }

  const setLightTheme = () => setTheme('light')
  const setDarkTheme = () => setTheme('dark')
  const setSystemTheme = () => setTheme('system')

  // Theme-aware color utilities
  const getThemeColor = (lightColor, darkColor) => {
    if (!mounted) return lightColor // Default to light on server
    return isDark ? darkColor : lightColor
  }

  // CSS custom properties for theme colors
  const themeColors = {
    // Background colors
    background: getThemeColor('#ffffff', '#0a0a0a'),
    foreground: getThemeColor('#0a0a0a', '#fafafa'),
    
    // Card colors
    card: getThemeColor('#ffffff', '#0a0a0a'),
    cardForeground: getThemeColor('#0a0a0a', '#fafafa'),
    
    // Popover colors
    popover: getThemeColor('#ffffff', '#0a0a0a'),
    popoverForeground: getThemeColor('#0a0a0a', '#fafafa'),
    
    // Primary colors
    primary: getThemeColor('#171717', '#fafafa'),
    primaryForeground: getThemeColor('#fafafa', '#0a0a0a'),
    
    // Secondary colors
    secondary: getThemeColor('#f5f5f5', '#262626'),
    secondaryForeground: getThemeColor('#171717', '#fafafa'),
    
    // Muted colors
    muted: getThemeColor('#f5f5f5', '#262626'),
    mutedForeground: getThemeColor('#737373', '#a3a3a3'),
    
    // Accent colors
    accent: getThemeColor('#f5f5f5', '#262626'),
    accentForeground: getThemeColor('#171717', '#fafafa'),
    
    // Destructive colors
    destructive: getThemeColor('#dc2626', '#dc2626'),
    destructiveForeground: getThemeColor('#fafafa', '#fafafa'),
    
    // Border and input colors
    border: getThemeColor('#e5e5e5', '#262626'),
    input: getThemeColor('#e5e5e5', '#262626'),
    ring: getThemeColor('#171717', '#d4d4d8'),
    
    // Chart colors
    chart1: getThemeColor('#f97316', '#f97316'),
    chart2: getThemeColor('#3b82f6', '#3b82f6'),
    chart3: getThemeColor('#10b981', '#10b981'),
    chart4: getThemeColor('#f59e0b', '#f59e0b'),
    chart5: getThemeColor('#ef4444', '#ef4444'),
    
    // Plant-specific colors
    plant: {
      primary: getThemeColor('#16a34a', '#22c55e'),
      secondary: getThemeColor('#15803d', '#16a34a'),
      accent: getThemeColor('#dcfce7', '#14532d'),
      light: getThemeColor('#f0fdf4', '#052e16'),
      muted: getThemeColor('#bbf7d0', '#166534')
    }
  }
  
  // Auth form specific styling configurations
  const authStyles = {
    // Container styles
    container: getThemeColor(
      'min-h-screen bg-gray-50 flex items-center justify-center p-4',
      'min-h-screen bg-gray-900 flex items-center justify-center p-4'
    ),
    
    // Card styles
    card: getThemeColor(
      'w-full max-w-md bg-white shadow-lg rounded-lg border border-gray-200',
      'w-full max-w-md bg-gray-800 shadow-xl rounded-lg border border-gray-700'
    ),
    
    // Header styles
    header: 'text-center space-y-2 p-6 pb-4',
    title: getThemeColor(
      'text-2xl font-bold text-gray-900',
      'text-2xl font-bold text-white'
    ),
    description: getThemeColor(
      'text-sm text-gray-600',
      'text-sm text-gray-400'
    ),
    
    // Form styles
    form: 'space-y-4 p-6 pt-0',
    field: 'space-y-2',
    label: getThemeColor(
      'block text-sm font-medium text-gray-700',
      'block text-sm font-medium text-gray-300'
    ),
    
    // Input styles
    input: {
      base: getThemeColor(
        'w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm bg-white text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500',
        'w-full px-3 py-2 border border-gray-600 rounded-md shadow-sm bg-gray-700 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-green-400 focus:border-green-400'
      ),
      error: getThemeColor(
        'border-red-300 focus:ring-red-500 focus:border-red-500',
        'border-red-500 focus:ring-red-400 focus:border-red-400'
      )
    },
    
    // Button styles
    button: {
      primary: getThemeColor(
        'w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500',
        'w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-400'
      ),
      secondary: getThemeColor(
        'w-full flex justify-center py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500',
        'w-full flex justify-center py-2 px-4 border border-gray-600 rounded-md shadow-sm text-sm font-medium text-gray-300 bg-gray-700 hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-400'
      )
    },
    
    // Link styles
    link: getThemeColor(
      'text-green-600 hover:text-green-500 hover:underline transition-colors duration-200',
      'text-green-400 hover:text-green-300 hover:underline transition-colors duration-200'
    ),
    
    // Error styles
    error: getThemeColor(
      'text-red-600 text-sm',
      'text-red-400 text-sm'
    ),
    
    // Helper text styles
    helper: getThemeColor(
      'text-gray-500 text-sm',
      'text-gray-400 text-sm'
    ),
    
    // Divider styles
    divider: {
      container: 'relative flex items-center justify-center my-6',
      line: getThemeColor(
        'absolute inset-0 flex items-center border-t border-gray-300',
        'absolute inset-0 flex items-center border-t border-gray-600'
      ),
      text: getThemeColor(
        'relative bg-white px-4 text-sm text-gray-500',
        'relative bg-gray-800 px-4 text-sm text-gray-400'
      )
    },
    
    // Footer styles
    footer: 'p-6 pt-0 text-center',
    footerText: getThemeColor(
      'text-sm text-gray-600',
      'text-sm text-gray-400'
    )
  }

  // Sidebar specific theme colors
  const sidebarTheme = {
    background: getThemeColor('#f8fafc', '#020817'),
    foreground: getThemeColor('#0f172a', '#f8fafc'),
    border: getThemeColor('#e2e8f0', '#1e293b'),
    accent: getThemeColor('#f1f5f9', '#1e293b'),
    accentForeground: getThemeColor('#0f172a', '#f8fafc'),
    hover: getThemeColor('#e2e8f0', '#334155'),
    muted: getThemeColor('#64748b', '#64748b'),
  }

  // Utility functions for component styling
  const getAuthClass = (element, variant = 'base') => {
    if (!mounted) return '' // Return empty string on server to prevent mismatch
    
    const elementStyles = authStyles[element]
    if (typeof elementStyles === 'string') return elementStyles
    if (typeof elementStyles === 'object' && elementStyles[variant]) {
      return elementStyles[variant]
    }
    return ''
  }
  
  const getPlantClass = (shade = 'primary') => {
    if (!mounted) return themeColors.plant.primary
    return themeColors.plant[shade] || themeColors.plant.primary
  }

  const value = {
    // Next-themes integration
    theme,
    setTheme,
    systemTheme,
    resolvedTheme,
    
    // Current theme state
    currentTheme,
    isDark,
    isLight,
    isSystem,
    mounted,
    
    // Theme actions
    toggleTheme,
    setLightTheme,
    setDarkTheme,
    setSystemTheme,
    
    // Theme utilities
    getThemeColor,
    themeColors,
    sidebarTheme,
    authStyles,
    
    // Helper functions
    getAuthClass,
    getPlantClass,
    
    // Pre-built class combinations for common use cases
    presets: {
      authCard: getAuthClass('card'),
      authButton: getAuthClass('button', 'primary') + ' btn-transition',
      authInput: getAuthClass('input', 'base'),
      authLabel: getAuthClass('label'),
      authError: getAuthClass('error'),
      authHelper: getAuthClass('helper'),
      authLink: getAuthClass('link')
    }
  }

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  )
}

// Export hook for backward compatibility
export { useTheme as useThemeContext }
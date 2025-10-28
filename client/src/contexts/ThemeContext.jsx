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
  }

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  )
}

// Export hook for backward compatibility
export { useTheme as useThemeContext }
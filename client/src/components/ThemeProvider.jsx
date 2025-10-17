import React, { createContext, useContext, useState, useEffect } from 'react';
import { useTheme } from "next-themes";

// Create a theme context
const ThemeContext = createContext({
  theme: 'light',
  systemTheme: 'light',
  setTheme: useTheme(),
  toggleTheme: () => null,
});

/**
 * Theme provider component
 * Provides theme functionality throughout the application
 */
export function ThemeProvider({ children, defaultTheme = 'light' }) {
  // Track the system preference
  const [systemTheme, setSystemTheme] = useState('light');
  
  // Check for saved theme preference or use default
  const [theme, setTheme] = useState(() => {
    if (typeof window !== 'undefined') {
      const savedTheme = localStorage.getItem('plant-system-theme');
      return savedTheme || defaultTheme;
    }
    return defaultTheme;
  });
  
  // Toggle between light and dark themes
  const toggleTheme = () => {
    setTheme(prevTheme => {
      if (prevTheme === 'system') {
        return systemTheme === 'dark' ? 'light' : 'dark';
      } else {
        const newTheme = prevTheme === 'light' ? 'dark' : 'light';
        return newTheme;
      }
    });
  };
  
  // Detect system theme preference
  useEffect(() => {
    if (typeof window !== 'undefined') {
      // Check initial system preference
      const darkModePreference = window.matchMedia('(prefers-color-scheme: dark)');
      setSystemTheme(darkModePreference.matches ? 'dark' : 'light');
      
      // Listen for changes in system preference
      const listener = (e) => {
        setSystemTheme(e.matches ? 'dark' : 'light');
      };
      
      darkModePreference.addEventListener('change', listener);
      return () => darkModePreference.removeEventListener('change', listener);
    }
  }, []);
  
  // Update the document with the current theme
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const root = window.document.documentElement;
      
      // Determine the actual theme to apply (considering system preference)
      const themeToApply = theme === 'system' ? systemTheme : theme;
      
      // Comprehensively apply theme across all methods used in the app
      // 1. Remove any existing theme classes
      root.classList.remove('light', 'dark');
      
      // 2. Add appropriate class for current theme
      root.classList.add(themeToApply);
      
      // 3. Set data-theme attribute for CSS variables
      root.setAttribute('data-theme', themeToApply);
      
      // 4. Update body styles to ensure correct background and text colors
      document.body.style.backgroundColor = 
        themeToApply === 'dark' ? 'var(--background-dark)' : 'var(--background-light)';
      document.body.style.color = 
        themeToApply === 'dark' ? 'var(--text-dark)' : 'var(--text-light)';
      
      // 5. Store theme preference
      localStorage.setItem('plant-system-theme', theme);
      
      console.log('Theme applied:', themeToApply, {
        classList: root.classList.contains(themeToApply),
        dataTheme: root.getAttribute('data-theme'),
        storedPreference: localStorage.getItem('plant-system-theme')
      });
    }
  }, [theme, systemTheme]);
  
  const value = {
    theme,
    systemTheme,
    setTheme,
    toggleTheme,
  };
  
  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  );
}

// Custom hook to use the theme context
export const useTheme = () => {
  const context = useContext(ThemeContext);
  
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  
  return context;
};

export default ThemeProvider;
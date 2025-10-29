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
      
      // Remove dark class first
      root.classList.remove('dark');
      
      // Add dark class if needed
      if (themeToApply === 'dark') {
        root.classList.add('dark');
      }
      
      // Set data-theme attribute for custom CSS variables
      root.setAttribute('data-theme', themeToApply);
      
      // Store theme preference
      localStorage.setItem('plant-system-theme', theme);
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
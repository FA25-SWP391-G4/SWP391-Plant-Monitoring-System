/**
 * ThemeLanguageMenu Component
 * A dropdown menu for theme and language selection similar to UserMenu but with flag avatar
 * Provides quick access to theme switching and language selection
 */
import React, { useState, useRef, useEffect } from 'react';
import Image from "next/image";
import { useTranslation } from "react-i18next";
import { useSettings } from "@/providers/SettingsProvider";
import { useTheme } from '@/contexts/ThemeContext';
import { useAuth } from '@/providers/AuthProvider';

const ThemeLanguageMenu = ({ isExpanded = true }) => {
  const { t, i18n } = useTranslation();
  const { settings, updateSettings } = useSettings();
  const { currentTheme, toggleTheme, setLightTheme, setDarkTheme, setSystemTheme } = useTheme();
  const { user } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [showingThemeMenu, setShowingThemeMenu] = useState(false);
  const [showingLanguageMenu, setShowingLanguageMenu] = useState(false);
  const menuRef = useRef(null);
  
  // Check if user is authenticated
  const isAuthenticated = !!user;
  
  // Available languages with flags
  const availableLanguages = {
    vi: { name: 'Tiếng Việt', flag: '/flags/vi.svg', nativeName: 'Tiếng Việt' },
    en: { name: 'English', flag: '/flags/en.svg', nativeName: 'English' }
  };

  // Get current language from settings or i18n context
  const settingsLanguage = settings?.language?.preferred;
  const currentLanguage = isAuthenticated ? (settingsLanguage || i18n.language) : i18n.language;
  
  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setIsOpen(false);
        setShowingThemeMenu(false);
        setShowingLanguageMenu(false);
      }
    };
    
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);
  
  // Toggle dropdown visibility
  const toggleMenu = () => {
    setIsOpen(!isOpen);
    setShowingThemeMenu(false);
    setShowingLanguageMenu(false);
  };
  
  // Menu control functions
  const showThemeMenu = () => {
    setShowingThemeMenu(true);
    setShowingLanguageMenu(false);
  };
  
  const showLanguageMenu = () => {
    setShowingLanguageMenu(true);
    setShowingThemeMenu(false);
  };
  
  const goBackToMainMenu = () => {
    setShowingThemeMenu(false);
    setShowingLanguageMenu(false);
  };

  // Get current theme from settings or theme context
  const settingsTheme = settings?.appearance?.theme || 'system';
  const effectiveTheme = isAuthenticated ? settingsTheme : (currentTheme || 'system');
  
  // Helper function to get effective theme (resolves 'system' to actual theme)
  const getEffectiveTheme = () => {
    if (effectiveTheme === 'system') {
      return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    }
    return effectiveTheme;
  };

  // Change language and save preference
  const changeLanguage = async (lang) => {
    i18n.changeLanguage(lang);
    
    // Only save to API if user is authenticated, otherwise just keep in local state
    if (isAuthenticated) {
      const updatedSettings = {
        ...settings,
        language: {
          ...settings.language,
          preferred: lang
        }
      };
      
      await updateSettings(updatedSettings);
    }
    
    goBackToMainMenu();
  };

  // Change theme and save preference
  const changeTheme = async (newTheme) => {
    // Apply theme change immediately via theme context (works for all users)
    switch (newTheme) {
      case 'light':
        setLightTheme();
        break;
      case 'dark':
        setDarkTheme();
        break;
      case 'system':
      default:
        setSystemTheme();
        break;
    }
    
    // Only save to API if user is authenticated
    if (isAuthenticated) {
      const updatedSettings = {
        ...settings,
        appearance: {
          ...settings.appearance,
          theme: newTheme
        }
      };
      
      await updateSettings(updatedSettings);
    }
    
    goBackToMainMenu();
  };

  // Get current language flag
  const getCurrentFlag = () => {
    const lang = availableLanguages[currentLanguage];
    return lang ? lang.flag : '/flags/en.svg';
  };

  // Get theme icon
  const getThemeIcon = () => {
    const resolvedTheme = getEffectiveTheme();
    switch (resolvedTheme) {
      case 'dark':
        return (
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"></path>
          </svg>
        );
      case 'light':
        return (
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="5"></circle>
            <path d="M12 1v2m0 18v2M4.2 4.2l1.4 1.4m12.8 12.8l1.4 1.4M1 12h2m18 0h2M4.2 19.8l1.4-1.4M18.4 5.6l1.4-1.4"></path>
          </svg>
        );
      default:
        return (
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <rect x="2" y="3" width="20" height="14" rx="2" ry="2"></rect>
            <line x1="8" y1="21" x2="16" y2="21"></line>
            <line x1="12" y1="17" x2="12" y2="21"></line>
          </svg>
        );
    }
  };

  return (
    <div className="relative" ref={menuRef}>
      {/* Flag trigger button - adapts to expanded state */}
      <button
        className={`flex items-center ${
          isExpanded 
            ? 'p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-600' 
            : 'p-2 justify-center hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg'
        } transition-colors`}
        onClick={toggleMenu}
        aria-expanded={isOpen}
        aria-label={t('accessibility.themeLanguageMenu', 'Theme and language menu')}
      >
        {/* Flag Avatar */}
        <div className="flex-shrink-0">
          <div className="w-8 h-8 rounded-full overflow-hidden border-2 border-gray-200 dark:border-gray-600">
            <Image 
              src={getCurrentFlag()}
              alt={availableLanguages[currentLanguage]?.name || 'Language'}
              width={32}
              height={32}
              className="object-cover w-full h-full"
            />
          </div>
        </div>

        {/* Dropdown arrow - only show when expanded */}
        {isExpanded && (
          <svg 
            xmlns="http://www.w3.org/2000/svg" 
            width="16" 
            height="16" 
            viewBox="0 0 24 24" 
            fill="none" 
            stroke="currentColor" 
            strokeWidth="2" 
            strokeLinecap="round" 
            strokeLinejoin="round" 
            className={`text-gray-500 ml-2 transition-transform ${isOpen ? 'rotate-180' : ''}`}
          >
            <path d="m6 9 6 6 6-6"></path>
          </svg>
        )}
      </button>
      
      {/* Dropdown menu - positioned appropriately */}
      {isOpen && (
        <div className={`absolute ${
          isExpanded ? 'right-0 bottom mb-2' : 'left-full bottom-0 ml-2'
        } w-92 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-600 z-50 overflow-hidden`}>
          
          {/* Main Menu */}
          {!showingThemeMenu && !showingLanguageMenu && (
            <>


              {/* Menu Items */}
              <div className="py-2">
                {/* Theme Option */}
                <button 
                  className="w-full flex items-center px-4 py-3 text-left hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                  onClick={showThemeMenu}
                >
                  <div className="mr-3 text-gray-500 dark:text-gray-400">
                    {getThemeIcon()}
                  </div>
                  <div className="flex-1">
                    <span className="text-sm font-medium text-gray-900 dark:text-white">
                      {t('menu.appearance', 'Appearance')}
                    </span>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      {t(`theme.${effectiveTheme}`, effectiveTheme.charAt(0).toUpperCase() + effectiveTheme.slice(1))}
                    </p>
                  </div>
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-gray-400">
                    <path d="m9 18 6-6-6-6"></path>
                  </svg>
                </button>

                {/* Language Option */}
                <button 
                  className="w-full flex items-center px-4 py-3 text-left hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                  onClick={showLanguageMenu}
                >
                  <div className="mr-3 text-gray-500 dark:text-gray-400">
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="m5 8 6 6"></path>
                      <path d="m4 14 6-6 2-3"></path>
                      <path d="M2 5h12"></path>
                      <path d="M7 2h1"></path>
                      <path d="m22 22-5-10-5 10"></path>
                      <path d="M14 18h6"></path>
                    </svg>
                  </div>
                  <div className="flex-1">
                    <span className="text-sm font-medium text-gray-900 dark:text-white">
                      {t('menu.language', 'Language')}
                    </span>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      {availableLanguages[currentLanguage]?.name || 'English'}
                    </p>
                  </div>
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-gray-400">
                    <path d="m9 18 6-6-6-6"></path>
                  </svg>
                </button>
              </div>
            </>
          )}

          {/* Theme Selection Menu */}
          {showingThemeMenu && (
            <>
              {/* Back Header */}
              <div className="p-4 border-b border-gray-100 dark:border-gray-700 flex items-center">
                <button 
                  onClick={goBackToMainMenu}
                  className="mr-3 p-1 hover:bg-gray-100 dark:hover:bg-gray-600 rounded"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-gray-600 dark:text-gray-400">
                    <path d="m15 18-6-6 6-6"></path>
                  </svg>
                </button>
                <h3 className="font-semibold text-gray-900 dark:text-white">
                  {t('menu.appearance', 'Appearance')}
                </h3>
              </div>

              {/* Theme Options */}
              <div className="py-2">
                {[
                  { key: 'light', icon: 'sun', label: t('theme.light', 'Light') },
                  { key: 'dark', icon: 'moon', label: t('theme.dark', 'Dark') },
                  { key: 'system', icon: 'monitor', label: t('theme.system', 'System') }
                ].map(({ key, icon, label }) => (
                  <button
                    key={key}
                    onClick={() => changeTheme(key)}
                    className={`w-full flex items-center px-4 py-3 text-left hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors ${
                      effectiveTheme === key ? 'bg-blue-50 dark:bg-blue-900/20' : ''
                    }`}
                  >
                    <div className="mr-3 text-gray-500 dark:text-gray-400">
                      {icon === 'sun' && (
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <circle cx="12" cy="12" r="5"></circle>
                          <path d="M12 1v2m0 18v2M4.2 4.2l1.4 1.4m12.8 12.8l1.4 1.4M1 12h2m18 0h2M4.2 19.8l1.4-1.4M18.4 5.6l1.4-1.4"></path>
                        </svg>
                      )}
                      {icon === 'moon' && (
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"></path>
                        </svg>
                      )}
                      {icon === 'monitor' && (
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <rect x="2" y="3" width="20" height="14" rx="2" ry="2"></rect>
                          <line x1="8" y1="21" x2="16" y2="21"></line>
                          <line x1="12" y1="17" x2="12" y2="21"></line>
                        </svg>
                      )}
                    </div>
                    <span className="text-sm font-medium text-gray-900 dark:text-white">
                      {label}
                    </span>
                    {effectiveTheme === key && (
                      <div className="ml-auto">
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-blue-600 dark:text-blue-400">
                          <path d="M20 6 9 17l-5-5"></path>
                        </svg>
                      </div>
                    )}
                  </button>
                ))}
              </div>
            </>
          )}

          {/* Language Selection Menu */}
          {showingLanguageMenu && (
            <>
              {/* Back Header */}
              <div className="p-4 border-b border-gray-100 dark:border-gray-700 flex items-center">
                <button 
                  onClick={goBackToMainMenu}
                  className="mr-3 p-1 hover:bg-gray-100 dark:hover:bg-gray-600 rounded"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-gray-600 dark:text-gray-400">
                    <path d="m15 18-6-6 6-6"></path>
                  </svg>
                </button>
                <h3 className="font-semibold text-gray-900 dark:text-white">
                  {t('menu.language', 'Language')}
                </h3>
              </div>

              {/* Language Options */}
              <div className="py-2">
                {Object.entries(availableLanguages).map(([langCode, lang]) => (
                  <button
                    key={langCode}
                    onClick={() => changeLanguage(langCode)}
                    className={`w-full flex items-center px-4 py-3 text-left hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors ${
                      currentLanguage === langCode ? 'bg-blue-50 dark:bg-blue-900/20' : ''
                    }`}
                  >
                    <div className="mr-3">
                      <div className="w-6 h-6 rounded-full overflow-hidden border border-gray-200 dark:border-gray-600">
                        <Image 
                          src={lang.flag}
                          alt={lang.name}
                          width={24}
                          height={24}
                          className="object-cover w-full h-full"
                        />
                      </div>
                    </div>
                    <div className="flex-1">
                      <span className="text-sm font-medium text-gray-900 dark:text-white">
                        {lang.nativeName}
                      </span>
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        {lang.name}
                      </p>
                    </div>
                    {currentLanguage === langCode && (
                      <div className="ml-auto">
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-blue-600 dark:text-blue-400">
                          <path d="M20 6 9 17l-5-5"></path>
                        </svg>
                      </div>
                    )}
                  </button>
                ))}
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
};

export default ThemeLanguageMenu;
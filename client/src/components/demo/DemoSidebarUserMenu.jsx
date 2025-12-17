/**
 * DemoSidebarUserMenu Component
 * Demo version of UserMenu for showcasing the interface without authentication
 */
import React, { useState, useRef, useEffect } from 'react';
import Link from "next/link";
import Image from "next/image";
import { useTranslation } from "react-i18next";
import { useTheme } from "@/contexts/ThemeContext";

const DemoSidebarUserMenu = ({ isExpanded = true, demoUser }) => {
  const { t, i18n } = useTranslation();
  const { currentTheme, theme, toggleTheme, setLightTheme, setDarkTheme, setSystemTheme } = useTheme();
  const [isOpen, setIsOpen] = useState(false);
  const [showingAppearanceMenu, setShowingAppearanceMenu] = useState(false);
  const [showingLanguageMenu, setShowingLanguageMenu] = useState(false);
  const menuRef = useRef(null);
  
  // Available languages with flags
  const availableLanguages = {
    vi: { name: 'Tiếng Việt', flag: '/flags/vi.svg', nativeName: 'Tiếng Việt' },
    en: { name: 'English', flag: '/flags/en.svg', nativeName: 'English' },
    fr: { name: 'French', flag: '/flags/fr.svg', nativeName: 'Français' },
    zh: { name: 'Chinese', flag: '/flags/zh.svg', nativeName: '中文' },
    kr: { name: 'Korean', flag: '/flags/kr.svg', nativeName: '한국어' },
    es: { name: 'Spanish', flag: '/flags/es.svg', nativeName: 'Español' },
    de: { name: 'German', flag: '/flags/de.svg', nativeName: 'Deutsch' },
    it: { name: 'Italian', flag: '/flags/it.svg', nativeName: 'Italiano' },
    pt: { name: 'Portuguese', flag: '/flags/pt.svg', nativeName: 'Português' },
    ja: { name: 'Japanese', flag: '/flags/ja.svg', nativeName: '日本語' }
  };

  const currentLanguage = availableLanguages[i18n.language] || availableLanguages.en;

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setIsOpen(false);
        setShowingAppearanceMenu(false);
        setShowingLanguageMenu(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  const closeAllMenus = () => {
    setIsOpen(false);
    setShowingAppearanceMenu(false);
    setShowingLanguageMenu(false);
  };

  const handleLanguageChange = (langCode) => {
    i18n.changeLanguage(langCode);
    closeAllMenus();
  };

  const handleThemeChange = (newTheme) => {
    switch(newTheme) {
      case 'light':
        setLightTheme();
        break;
      case 'dark':
        setDarkTheme();
        break;
      case 'system':
        setSystemTheme();
        break;
      default:
        toggleTheme();
    }
    closeAllMenus();
  };

  // User initials for avatar
  const userInitials = demoUser ? 
    `${demoUser.given_name?.[0] || ''}${demoUser.family_name?.[0] || ''}`.toUpperCase() :
    'DU';

  // Dropdown positioning
  const getDropdownClasses = () => {
    const baseClasses = "absolute z-50 mt-2 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 min-w-64";
    
    if (isExpanded) {
      return `${baseClasses} bottom-full left-0 mb-2`;
    } else {
      return `${baseClasses} bottom-0 left-full ml-2`;
    }
  };

  return (
    <div className="relative" ref={menuRef}>
      {/* User Avatar Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`flex items-center w-full p-3 text-left hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors ${
          isExpanded ? 'justify-start space-x-3' : 'justify-center'
        }`}
      >
        {/* Avatar */}
        <div className={`flex-shrink-0 w-8 h-8 bg-gradient-to-br from-green-400 to-green-600 rounded-full flex items-center justify-center text-white text-sm font-medium ${
          !isExpanded ? 'w-10 h-10' : ''
        }`}>
          {userInitials}
        </div>
        
        {/* User Info (only when expanded) */}
        {isExpanded && (
          <div className="flex-1 min-w-0">
            <div className="text-sm font-medium text-gray-900 dark:text-white truncate">
              {demoUser ? `${demoUser.given_name} ${demoUser.family_name}` : 'Demo User'}
            </div>
            <div className="text-xs text-gray-500 dark:text-gray-400 truncate">
              {demoUser?.role || 'Premium'} • Demo
            </div>
          </div>
        )}
        
        {/* Dropdown Arrow (only when expanded) */}
        {isExpanded && (
          <svg 
            className={`w-4 h-4 text-gray-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} 
            fill="none" 
            stroke="currentColor" 
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        )}
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div className={getDropdownClasses()}>
          <div className="py-2">
            {/* Demo User Info Header */}
            <div className="px-4 py-3 border-b border-gray-200 dark:border-gray-700">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-gradient-to-br from-green-400 to-green-600 rounded-full flex items-center justify-center text-white text-sm font-medium">
                  {userInitials}
                </div>
                <div>
                  <div className="text-sm font-medium text-gray-900 dark:text-white">
                    {demoUser ? `${demoUser.given_name} ${demoUser.family_name}` : 'Demo User'}
                  </div>
                  <div className="text-xs text-gray-500 dark:text-gray-400">
                    {demoUser?.email || 'demo@plantsmart.com'}
                  </div>
                  <div className="text-xs text-blue-600 dark:text-blue-400 font-medium">
                    {demoUser?.role || 'Premium'} Demo Account
                  </div>
                </div>
              </div>
            </div>

            {/* Demo Actions */}
            <div className="py-2">
              <button className="flex items-center w-full px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700">
                <svg className="w-4 h-4 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
                View Profile
              </button>
              
              <button className="flex items-center w-full px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700">
                <svg className="w-4 h-4 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                Settings
              </button>

              {/* Appearance Menu */}
              <button 
                onClick={() => setShowingAppearanceMenu(!showingAppearanceMenu)}
                className="flex items-center w-full px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
              >
                <svg className="w-4 h-4 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zM21 5a2 2 0 00-2-2h-4a2 2 0 00-2 2v12a4 4 0 004 4h4a2 2 0 002-2V5z" />
                </svg>
                Appearance
                <svg className={`w-4 h-4 ml-auto transition-transform ${showingAppearanceMenu ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>
              
              {showingAppearanceMenu && (
                <div className="ml-4 border-l border-gray-200 dark:border-gray-600">
                  <button 
                    onClick={() => handleThemeChange('light')}
                    className={`flex items-center w-full px-4 py-2 text-sm hover:bg-gray-100 dark:hover:bg-gray-700 ${
                      theme === 'light' ? 'text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20' : 'text-gray-700 dark:text-gray-300'
                    }`}
                  >
                    <svg className="w-4 h-4 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
                    </svg>
                    Light
                  </button>
                  <button 
                    onClick={() => handleThemeChange('dark')}
                    className={`flex items-center w-full px-4 py-2 text-sm hover:bg-gray-100 dark:hover:bg-gray-700 ${
                      theme === 'dark' ? 'text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20' : 'text-gray-700 dark:text-gray-300'
                    }`}
                  >
                    <svg className="w-4 h-4 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
                    </svg>
                    Dark
                  </button>
                  <button 
                    onClick={() => handleThemeChange('system')}
                    className={`flex items-center w-full px-4 py-2 text-sm hover:bg-gray-100 dark:hover:bg-gray-700 ${
                      theme === 'system' ? 'text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20' : 'text-gray-700 dark:text-gray-300'
                    }`}
                  >
                    <svg className="w-4 h-4 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                    </svg>
                    System
                  </button>
                </div>
              )}

              {/* Language Menu */}
              <button 
                onClick={() => setShowingLanguageMenu(!showingLanguageMenu)}
                className="flex items-center w-full px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
              >
                <Image
                  src={currentLanguage.flag}
                  alt={currentLanguage.name}
                  width={16}
                  height={16}
                  className="mr-3 rounded-sm"
                />
                Language
                <svg className={`w-4 h-4 ml-auto transition-transform ${showingLanguageMenu ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>
              
              {showingLanguageMenu && (
                <div className="ml-4 border-l border-gray-200 dark:border-gray-600 max-h-48 overflow-y-auto">
                  {Object.entries(availableLanguages).map(([code, lang]) => (
                    <button
                      key={code}
                      onClick={() => handleLanguageChange(code)}
                      className={`flex items-center w-full px-4 py-2 text-sm hover:bg-gray-100 dark:hover:bg-gray-700 ${
                        i18n.language === code ? 'text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20' : 'text-gray-700 dark:text-gray-300'
                      }`}
                    >
                      <Image
                        src={lang.flag}
                        alt={lang.name}
                        width={16}
                        height={16}
                        className="mr-3 rounded-sm"
                      />
                      {lang.nativeName}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Demo CTA */}
            <div className="border-t border-gray-200 dark:border-gray-700 pt-2">
              <div className="px-4 py-2">
                <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">
                  Ready to get started?
                </p>
                <button className="w-full bg-green-600 hover:bg-green-700 text-white text-sm font-medium py-2 px-3 rounded-lg transition-colors">
                  Sign Up Now
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DemoSidebarUserMenu;
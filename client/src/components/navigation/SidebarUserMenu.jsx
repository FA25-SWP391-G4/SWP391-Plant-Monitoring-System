 /**
 * SidebarUserMenu Component
 * Specialized version of UserMenu optimized for sidebar integration
 * Adapts to collapsed/expanded sidebar states
 */
import React, { useState, useRef, useEffect } from 'react';
import Link from "next/link";
import Image from "next/image";
import { useTranslation } from "react-i18next";
import { useAuth } from "@/providers/AuthProvider";
import { useTheme } from "@/contexts/ThemeContext";
import { useRouter } from 'next/navigation';
import UserRoleBadge from '@/components/shared/UserRoleBadge';

const SidebarUserMenu = ({ isExpanded = true }) => {
  const { t, i18n } = useTranslation();
  const { user, logout } = useAuth();
  const { currentTheme, theme, toggleTheme, setLightTheme, setDarkTheme, setSystemTheme } = useTheme();
  const [isOpen, setIsOpen] = useState(false);
  const [showingAppearanceMenu, setShowingAppearanceMenu] = useState(false);
  const [showingLanguageMenu, setShowingLanguageMenu] = useState(false);
  const menuRef = useRef(null);
  const router = useRouter();
  
  // Available languages with flags
  const availableLanguages = {
    vi: { name: 'Tiếng Việt', flag: '/flags/vi.svg', nativeName: 'Tiếng Việt' },
    en: { name: 'English', flag: '/flags/en.svg', nativeName: 'English' },

  };

  // Get current language
  const currentLanguage = i18n.language;
  
  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setIsOpen(false);
        setShowingAppearanceMenu(false);
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
    setShowingAppearanceMenu(false);
    setShowingLanguageMenu(false);
  };
  
  // Menu control functions
  const showAppearanceMenu = () => {
    setShowingAppearanceMenu(true);
    setShowingLanguageMenu(false);
  };
  
  const showLanguageMenu = () => {
    setShowingLanguageMenu(true);
    setShowingAppearanceMenu(false);
  };
  
  const goBackToMainMenu = () => {
    setShowingAppearanceMenu(false);
    setShowingLanguageMenu(false);
  };
  
  // Handle profile click
  const handleProfileClick = () => {
    router.push('/profile');
    setIsOpen(false);
  };

  // Change language and save preference
  const changeLanguage = async (lang) => {
    i18n.changeLanguage(lang);
    localStorage.setItem('i18nextLng', lang);
    
    if (user && typeof window !== 'undefined' && window.languageApi) {
      try {
        await window.languageApi.updatePreferences(lang);
      } catch (error) {
        console.error('Error updating language preference:', error);
      }
    }
    
    goBackToMainMenu();
  };

  // Truncate email for display
  const truncateEmail = (email) => {
    if (!email) return '';
    const [username, domain] = email.split('@');
    if (!domain) return username;
    return `${username}@${domain.substring(0, 1)}...`;
  };

  if (!user) return null;

  return (
    <div className="relative" ref={menuRef}>
      {/* User trigger button - adapts to sidebar state */}
      <button
        className={`w-full flex items-center ${
          isExpanded 
            ? 'p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-600' 
            : 'p-2 justify-center hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg'
        } transition-colors`}
        onClick={toggleMenu}
        aria-expanded={isOpen}
        aria-label={t('accessibility.userMenu', 'User menu')}
      >
        {/* User Avatar */}
        <div className="flex-shrink-0">
          {user?.profile_picture ? (
            <div className="w-8 h-8 rounded-full overflow-hidden">
              <Image 
                src={user.profile_picture}
                alt={user.name || t('common.user', 'User')}
                width={32}
                height={32}
                className="object-cover w-full h-full"
              />
            </div>
          ) : (
            <div className="w-8 h-8 bg-gradient-to-br from-blue-400 to-blue-600 rounded-full flex items-center justify-center">
              <span className="text-white text-sm font-medium">
                {user?.given_name?.charAt(0) || user?.family_name?.charAt(0) || user?.email?.charAt(0) || 'U'}
              </span>
            </div>
          )}
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
      
      {/* Dropdown menu - positioned appropriately for sidebar */}
      {isOpen && (
        <div className={`absolute ${
          isExpanded ? 'right-0 bottom mb-2' : 'left-full bottom-0 ml-2'
        } w-60 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-600 z-50 overflow-hidden`}>
          
          {/* User info section - always show in dropdown */}
          <div className="p-4 border-b border-gray-100 dark:border-gray-700">
            <div className="flex items-center">
              {user?.profile_picture ? (
                <div className="w-10 h-10 rounded-full overflow-hidden mr-3">
                  <Image 
                    src={user.profile_picture}
                    alt={user.name || t('common.user', 'User')}
                    width={40}
                    height={40}
                    className="object-cover w-full h-full"
                  />
                </div>
              ) : (
                <div className="w-10 h-10 bg-gradient-to-br from-blue-400 to-blue-600 rounded-full flex items-center justify-center mr-3">
                  <span className="text-white text-sm font-medium">
                    {user?.given_name?.charAt(0) || user?.family_name?.charAt(0) || user?.email?.charAt(0) || 'U'}
                  </span>
                </div>
              )}
              <div>
                  <div className="flex items-center gap-2 mb-0.5">
                    <p className="font-medium text-gray-900 dark:text-white">
                      {user?.given_name && user?.family_name 
                        ? `${user.given_name} ${user.family_name}` 
                        : user?.family_name || user?.given_name || user?.full_name || user?.name || t('common.user', 'User')}
                    </p>
                    <UserRoleBadge role={user?.role || 'free'} small />
                  </div>
                <p className="text-xs text-gray-500 dark:text-gray-400 truncate max-w-[160px]">
                  {user.email}
                </p>
              </div>
            </div>
          </div>
                
          {/* Profile section */}
          {!showingAppearanceMenu && !showingLanguageMenu && (
            <div className="py-1 border-b border-gray-100 dark:border-gray-700">
              <button
                onClick={handleProfileClick}
                className="w-full flex items-center px-4 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-3 text-gray-500">
                  <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                  <circle cx="12" cy="7" r="4"></circle>
                </svg>
                <span>{t('navigation.profile', 'Profile')}</span>
              </button>
              
              {user.role === "Admin" && (
                <Link href="/admin" className="flex items-center px-4 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700">
                  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-3 text-gray-500">
                    <path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
                    <circle cx="8.5" cy="7" r="4"></circle>
                    <path d="M20 8v6"></path>
                    <path d="M23 11h-6"></path>
                  </svg>
                  <span>{t('navigation.admin')}</span>
                </Link>
              )}
              
              <Link href="/settings" className="flex items-center px-4 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700">
                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-3 text-gray-500">
                  <path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z"></path>
                  <circle cx="12" cy="12" r="3"></circle>
                </svg>
                <span>{t('navigation.settings')}</span>
              </Link>
            </div>
          )}

          {/* Appearance section */}
          {!showingAppearanceMenu && !showingLanguageMenu && (
            <div className="py-1 border-b border-gray-100 dark:border-gray-700">
              <div className="px-4 py-2 text-sm text-gray-500 dark:text-gray-400">{t('settings.appearance', 'Appearance')}</div>
              
              <button 
                onClick={showAppearanceMenu}
                className="w-full flex items-center justify-between px-4 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"
              >
                <div className="flex items-center">
                  {theme === 'light' ? (
                    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-3 text-amber-500">
                      <circle cx="12" cy="12" r="4"></circle>
                      <path d="M12 2v2"></path>
                      <path d="M12 20v2"></path>
                      <path d="m4.93 4.93 1.41 1.41"></path>
                      <path d="m17.66 17.66 1.41 1.41"></path>
                      <path d="M2 12h2"></path>
                      <path d="M20 12h2"></path>
                      <path d="m6.34 17.66-1.41 1.41"></path>
                      <path d="m19.07 4.93-1.41 1.41"></path>
                    </svg>
                  ) : theme === 'dark' ? (
                    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-3 text-blue-600">
                      <path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z"></path>
                    </svg>
                  ) : (
                    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-3 text-gray-500">
                      <circle cx="12" cy="12" r="4"></circle>
                      <line x1="12" y1="3" x2="12" y2="5"></line>
                      <line x1="12" y1="19" x2="12" y2="21"></line>
                      <line x1="5" y1="12" x2="3" y2="12"></line>
                      <line x1="21" y1="12" x2="19" y2="12"></line>
                    </svg>
                  )}
                  <span>
                    {theme === 'light' 
                      ? t('settings.theme.light', 'Light Mode') 
                      : theme === 'dark'
                        ? t('settings.theme.dark', 'Dark Mode')
                        : t('settings.theme.system', 'System')}
                  </span>
                </div>
                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-gray-400">
                  <path d="m9 18 6-6-6-6"></path>
                </svg>
              </button>
            </div>
          )}

          {/* Appearance submenu */}
          {showingAppearanceMenu && (
            <div>
              <div className="px-4 py-2 flex items-center border-b border-gray-100 dark:border-gray-700">
                <button 
                  onClick={goBackToMainMenu}
                  className="p-1 mr-2 rounded hover:bg-gray-100 dark:hover:bg-gray-600"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="m15 18-6-6 6-6"></path>
                  </svg>
                </button>
                <span className="font-medium text-gray-900 dark:text-white">{t('settings.appearance', 'Appearance')}</span>
              </div>
              
              {/* Theme options */}
              {[
                { key: 'system', label: t('settings.theme.system', 'System'), action: setSystemTheme, icon: 'system' },
                { key: 'light', label: t('settings.theme.light', 'Light Mode'), action: setLightTheme, icon: 'light' },
                { key: 'dark', label: t('settings.theme.dark', 'Dark Mode'), action: setDarkTheme, icon: 'dark' }
              ].map((themeOption) => (
                <button 
                  key={themeOption.key}
                  onClick={() => {
                    themeOption.action();
                    goBackToMainMenu();
                  }}
                  className="w-full flex items-center justify-between px-4 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"
                >
                  <div className="flex items-center">
                    {themeOption.icon === 'light' ? (
                      <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-3 text-amber-500">
                        <circle cx="12" cy="12" r="4"></circle>
                        <path d="M12 2v2"></path>
                        <path d="M12 20v2"></path>
                        <path d="m4.93 4.93 1.41 1.41"></path>
                        <path d="m17.66 17.66 1.41 1.41"></path>
                        <path d="M2 12h2"></path>
                        <path d="M20 12h2"></path>
                        <path d="m6.34 17.66-1.41 1.41"></path>
                        <path d="m19.07 4.93-1.41 1.41"></path>
                      </svg>
                    ) : themeOption.icon === 'dark' ? (
                      <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-3 text-blue-600">
                        <path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z"></path>
                      </svg>
                    ) : (
                      <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-3 text-gray-500">
                        <circle cx="12" cy="12" r="4"></circle>
                        <line x1="12" y1="3" x2="12" y2="5"></line>
                        <line x1="12" y1="19" x2="12" y2="21"></line>
                        <line x1="5" y1="12" x2="3" y2="12"></line>
                        <line x1="21" y1="12" x2="19" y2="12"></line>
                      </svg>
                    )}
                    <span>{themeOption.label}</span>
                  </div>
                  <div className="text-green-500">
                    {theme === themeOption.key && (
                      <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                    )}
                  </div>
                </button>
              ))}
            </div>
          )}

          {/* Language section */}
          {!showingAppearanceMenu && !showingLanguageMenu && (
            <div className="py-1 border-b border-gray-100 dark:border-gray-700">
              <div className="px-4 py-2 text-sm text-gray-500 dark:text-gray-400">{t('settings.language', 'Language')}</div>
              
              <button
                onClick={showLanguageMenu}
                className="w-full flex items-center justify-between px-4 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"
              >
                <div className="flex items-center">
                  <div className="w-5 h-5 flex-shrink-0 relative overflow-hidden rounded-full border border-gray-200 mr-3">
                    <Image 
                      src={availableLanguages[currentLanguage]?.flag || availableLanguages.en.flag}
                      alt={availableLanguages[currentLanguage]?.name || availableLanguages.en.name}
                      width={20}
                      height={20}
                      className="object-cover w-full h-full"
                    />
                  </div>
                  <span>{availableLanguages[currentLanguage]?.nativeName || availableLanguages.en.nativeName}</span>
                </div>
                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-gray-400">
                  <path d="m9 18 6-6-6-6"></path>
                </svg>
              </button>
            </div>
          )}
          
          {/* Language submenu */}
          {showingLanguageMenu && (
            <div>
              <div className="px-4 py-2 flex items-center border-b border-gray-100 dark:border-gray-700">
                <button 
                  onClick={goBackToMainMenu}
                  className="p-1 mr-2 rounded hover:bg-gray-100 dark:hover:bg-gray-600"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="m15 18-6-6 6-6"></path>
                  </svg>
                </button>
                <span className="font-medium text-gray-900 dark:text-white">{t('settings.language', 'Language')}</span>
              </div>
              
              {/* Language options */}
              {['vi', 'en'].map((langCode) => (
                <button
                  key={langCode}
                  onClick={() => changeLanguage(langCode)}
                  className="w-full flex items-center justify-between px-4 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"
                >
                  <div className="flex items-center">
                    <div className="w-5 h-5 flex-shrink-0 relative overflow-hidden rounded-full border border-gray-200 mr-3">
                      <Image 
                        src={availableLanguages[langCode]?.flag || `/flags/${langCode}.svg`}
                        alt={availableLanguages[langCode]?.nativeName || langCode}
                        width={20}
                        height={20}
                        className="object-cover w-full h-full"
                      />
                    </div>
                    <span>{availableLanguages[langCode]?.nativeName || langCode}</span>
                  </div>
                  {currentLanguage === langCode && (
                    <span className="text-green-500">
                      <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                    </span>
                  )}
                </button>
              ))}
            </div>
          )}
          
          {/* Logout section */}
          {!showingAppearanceMenu && !showingLanguageMenu && (
            <div className="py-1">
              <button 
                onClick={logout}
                className="w-full flex items-center px-4 py-2 text-red-600 hover:bg-gray-50 dark:hover:bg-gray-700"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-3">
                  <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path>
                  <polyline points="16 17 21 12 16 7"></polyline>
                  <line x1="21" y1="12" x2="9" y2="12"></line>
                </svg>
                <span>{t('auth.logout', 'Logout')}</span>
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default SidebarUserMenu;
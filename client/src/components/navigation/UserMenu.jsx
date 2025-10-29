import React, { useState, useRef, useEffect } from 'react';
import Link from "next/link";
import Image from "next/image";
import { useTranslation } from "react-i18next";
import { useAuth } from "@/providers/AuthProvider";
import { useTheme } from "@/contexts/ThemeContext"
import { useRouter } from 'next/navigation'; // For redirecting to profile page

/**
 * UserMenu component 
 * Compact dropdown menu that combines:
 * - User profile options
 * - Language selection
 * - Theme toggle
 */
const UserMenu = () => {
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
    fr: { name: 'French', flag: '/flags/fr.svg', nativeName: 'Français' },
    zh: { name: 'Chinese', flag: '/flags/zh.svg', nativeName: '中文' },
    kr: { name: 'Korean', flag: '/flags/kr.svg', nativeName: '한국어' },
    ja: { name: 'Japanese', flag: '/flags/ja.svg', nativeName: '日本語' },
    es: { name: 'Spanish', flag: '/flags/es.svg', nativeName: 'Español' }
  };

  // Get current language
  const currentLanguage = i18n.language;
  const currentLang = availableLanguages[currentLanguage] || availableLanguages.en;
  
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
  
  // Show appearance menu
  const showAppearanceMenu = () => {
    setShowingAppearanceMenu(true);
    setShowingLanguageMenu(false);
  };
  
  // Show language menu
  const showLanguageMenu = () => {
    setShowingLanguageMenu(true);
    setShowingAppearanceMenu(false);
  };
  
  // Go back to main menu
  const goBackToMainMenu = () => {
    setShowingAppearanceMenu(false);
    setShowingLanguageMenu(false);
  };
  
  // Format name to display family name on top with more robust fallbacks
  // This function is preserved for backward compatibility but we're using direct given_name/family_name access
  const formatName = (fullName) => {
    if (!fullName) return t('common.user', 'User');
    
    try {
      const names = fullName.trim().split(' ');
      if (names.length === 1) return names[0];
      
      const lastName = names[names.length - 1];
      const firstInitial = names[0].charAt(0);
      
      return `${lastName} ${firstInitial}.`;
    } catch (error) {
      console.error('Error formatting name:', error);
      return t('common.user', 'User');
    }
  };
  
  // Truncate email for display
  const truncateEmail = (email) => {
    if (!email) return '';
    const [username, domain] = email.split('@');
    if (!domain) return username;
    return `${username}@${domain.substring(0, 1)}...`;
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
    
    // If user is logged in, update preference in backend
    if (user && typeof window !== 'undefined' && window.languageApi) {
      try {
        await window.languageApi.updatePreferences(lang);
      } catch (error) {
        console.error('Error updating language preference:', error);
      }
    }
    
    // Go back to main menu after selection
    goBackToMainMenu();
  };

  return (
    <div className="relative" ref={menuRef}>
      {/* User avatar/trigger button */}
      <button
        className="flex items-center space-x-1 rounded-full hover:bg-gray-100 p-1.5 transition-colors"
        onClick={toggleMenu}
        aria-expanded={isOpen}
        aria-label={t('accessibility.userMenu', 'User menu')}
      >
        <div>
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
            <div className="w-10 h-10 bg-green-100 text-green-700 rounded-full flex items-center justify-center mr-3">
            {(user?.given_name?.charAt(0) || user?.family_name?.charAt(0) || 'U')}
            </div>
          )}
        </div>
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-gray-500">
          <path d="m6 9 6 6 6-6"></path>
        </svg>
      </button>
      
      {/* Dropdown menu */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-60 bg-white rounded-md shadow-lg border border-gray-100 z-50 overflow-hidden">
          {/* User info section */}
                {user && (
                <div className="p-4 border-b border-gray-100">
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
                    <div className="w-10 h-10 bg-green-100 text-green-700 rounded-full flex items-center justify-center mr-3">
                    {(user?.given_name?.charAt(0) || user?.family_name?.charAt(0) || 'U')}
                    </div>
                  )}
                  <div>
                    <p className="font-medium text-gray-800">
                    {user?.given_name && user?.family_name 
                      ? `${user.given_name} ${user.family_name}` 
                      : user?.family_name || user?.given_name || user?.full_name || user?.name || t('common.user', 'User')}
                    </p>
                    <p className="text-xs text-gray-500 truncate max-w-[160px]">{truncateEmail(user.email)}</p>
                  </div>
                  </div>
                </div>
                )}
                
                {/* Profile section */}
          {user && !showingAppearanceMenu && !showingLanguageMenu && (
            <div className="py-1 border-b border-gray-100">
              <button
                onClick={handleProfileClick}
                className="w-full flex items-center px-4 py-2 text-gray-700 hover:bg-gray-50"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-3 text-gray-500">
                  <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                  <circle cx="12" cy="7" r="4"></circle>
                </svg>
                <span>{t('navigation.profile', 'Profile')}</span>
              </button>
              
              {user.role === "Admin" && (
                <Link href="/admin" className="flex items-center px-4 py-2 text-gray-700 hover:bg-gray-50">
                  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-3 text-gray-500">
                    <path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
                    <circle cx="8.5" cy="7" r="4"></circle>
                    <path d="M20 8v6"></path>
                    <path d="M23 11h-6"></path>
                  </svg>
                  <span>{t('navigation.admin')}</span>
                </Link>
              )}
              
              <Link href="/settings" className="flex items-center px-4 py-2 text-gray-700 hover:bg-gray-50">
                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-3 text-gray-500">
                  <path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z"></path>
                  <circle cx="12" cy="12" r="3"></circle>
                </svg>
                <span>{t('navigation.settings')}</span>
              </Link>
            </div>
          )}

          {/* Appearance section - Main menu button */}
          {!showingAppearanceMenu && !showingLanguageMenu && (
            <div className="py-1 border-b border-gray-100">
              <div className="px-4 py-2 text-sm text-gray-500">{t('settings.appearance', 'Appearance')}</div>
              
              {/* Theme toggle button that shows the appearance submenu */}
              <button 
                onClick={showAppearanceMenu}
                className="w-full flex items-center justify-between px-4 py-2 text-gray-700 hover:bg-gray-50"
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
              <div className="px-4 py-2 flex items-center border-b border-gray-100">
                <button 
                  onClick={goBackToMainMenu}
                  className="p-1 mr-2 rounded hover:bg-gray-100"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="m15 18-6-6 6-6"></path>
                  </svg>
                </button>
                <span className="font-medium">{t('settings.appearance', 'Appearance')}</span>
              </div>
              
              {/* System theme option */}
              <button 
                onClick={() => {
                  setSystemTheme();
                  goBackToMainMenu();
                }}
                className="w-full flex items-center justify-between px-4 py-2 text-gray-700 hover:bg-gray-50"
              >
                <div className="flex items-center">
                  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-3 text-gray-500">
                    <circle cx="12" cy="12" r="4"></circle>
                    <line x1="12" y1="3" x2="12" y2="5"></line>
                    <line x1="12" y1="19" x2="12" y2="21"></line>
                    <line x1="5" y1="12" x2="3" y2="12"></line>
                    <line x1="21" y1="12" x2="19" y2="12"></line>
                  </svg>
                  <span>{t('settings.theme.system', 'System')}</span>
                </div>
                <div className="text-green-500">
                  {theme === 'system' && (
                    <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  )}
                </div>
              </button>
              
              {/* Light theme option */}
              <button 
                onClick={() => {
                  setLightTheme();
                  goBackToMainMenu();
                }}
                className="w-full flex items-center justify-between px-4 py-2 text-gray-700 hover:bg-gray-50"
              >
                <div className="flex items-center">
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
                  <span>{t('settings.theme.light', 'Light Mode')}</span>
                </div>
                <div className="text-green-500">
                  {theme === 'light' && (
                    <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  )}
                </div>
              </button>
              
              {/* Dark theme option */}
              <button 
                onClick={() => {
                  setDarkTheme();
                  goBackToMainMenu();
                }}
                className="w-full flex items-center justify-between px-4 py-2 text-gray-700 hover:bg-gray-50"
              >
                <div className="flex items-center">
                  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-3 text-blue-600">
                    <path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z"></path>
                  </svg>
                  <span>{t('settings.theme.dark', 'Dark Mode')}</span>
                </div>
                <div className="text-green-500">
                  {theme === 'dark' && (
                    <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  )}
                </div>
              </button>
            </div>
          )}

          {/* Language section - Main menu button */}
          {!showingAppearanceMenu && !showingLanguageMenu && (
            <div className="py-1 border-b border-gray-100">
              <div className="px-4 py-2 text-sm text-gray-500">{t('settings.language', 'Language')}</div>
              
              {/* Current language button */}
              <button
                onClick={showLanguageMenu}
                className="w-full flex items-center justify-between px-4 py-2 text-gray-700 hover:bg-gray-50"
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
              <div className="px-4 py-2 flex items-center border-b border-gray-100">
                <button 
                  onClick={goBackToMainMenu}
                  className="p-1 mr-2 rounded hover:bg-gray-100"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="m15 18-6-6 6-6"></path>
                  </svg>
                </button>
                <span className="font-medium">{t('settings.language', 'Language')}</span>
              </div>
              
              {/* Language options */}
              {['vi', 'en', 'fr', 'kr', 'zh', 'ja'].map((langCode) => (
                <button
                  key={langCode}
                  onClick={() => changeLanguage(langCode)}
                  className="w-full flex items-center justify-between px-4 py-2 text-gray-700 hover:bg-gray-50"
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
          {user && !showingAppearanceMenu && !showingLanguageMenu && (
            <div className="py-1">
              <button 
                onClick={logout}
                className="w-full flex items-center px-4 py-2 text-red-600 hover:bg-gray-50"
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

export default UserMenu;
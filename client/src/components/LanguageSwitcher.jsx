import React, { useState, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '@/providers/AuthProvider';
import Image from 'next/image';

/**
 * LanguageSwitcher component
 * Globe icon with vertical dropdown menu for changing the application language
 * Languages: Vietnamese (vi), English (en), French (fr), Chinese (zh), Korean (kr), Japanese (ja)
 */
const LanguageSwitcher = () => {
  const { i18n, t } = useTranslation();
  const { user } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [currentLanguage, setCurrentLanguage] = useState(i18n.language);
  const dropdownRef = useRef(null);

  // Available languages - updated per requirements
  const availableLanguages = {
    vi: { name: 'Tiếng Việt', flag: '/flags/vi.svg', nativeName: 'Tiếng Việt' },
    en: { name: 'English', flag: '/flags/en.svg', nativeName: 'English' },
    fr: { name: 'French', flag: '/flags/fr.svg', nativeName: 'Français' },
    zh: { name: 'Chinese', flag: '/flags/zh.svg', nativeName: '中文' },
    kr: { name: 'Korean', flag: '/flags/kr.svg', nativeName: '한국어' },
    ja: { name: 'Japanese', flag: '/flags/ja.svg', nativeName: '日本語' },
    es: { name: 'Spanish', flag: '/flags/es.svg', nativeName: 'Español' }
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Get user's language preference when logged in
  useEffect(() => {
    const fetchUserPreference = async () => {
      if (user) {
        try {
          // If we have a languageApi, use it
          if (typeof window !== 'undefined' && window.languageApi) {
            const response = await window.languageApi.getPreferences();
            if (response.data?.language) {
              i18n.changeLanguage(response.data.language);
              setCurrentLanguage(response.data.language);
            }
          }
        } catch (error) {
          console.error('Error fetching user language preference:', error);
        }
      }
    };

    fetchUserPreference();
  }, [user, i18n]);

  /**
   * Change the application language
   * @param {string} lang - Language code (e.g., 'en', 'vi')
   */
  const changeLanguage = async (lang) => {
    // Update language in i18next
    i18n.changeLanguage(lang);
    setCurrentLanguage(lang);
    setIsOpen(false);

    // Store in localStorage for non-authenticated users
    localStorage.setItem('i18nextLng', lang);
    
    // If user is logged in, update preference in backend
    if (user && typeof window !== 'undefined' && window.languageApi) {
      try {
        await window.languageApi.updatePreferences(lang);
      } catch (error) {
        console.error('Error updating language preference:', error);
      }
    }
  };

  // Globe icon SVG for the dropdown toggle
  const GlobeIcon = () => (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="22"
      height="22"
      fill="currentColor"
      className="bi bi-globe text-gray-600"
      viewBox="0 0 16 16"
    >
      <path d="M0 8a8 8 0 1 1 16 0A8 8 0 0 1 0 8zm7.5-6.923c-.67.204-1.335.82-1.887 1.855A7.97 7.97 0 0 0 5.145 4H7.5V1.077zM4.09 4a9.267 9.267 0 0 1 .64-1.539 6.7 6.7 0 0 1 .597-.933A7.025 7.025 0 0 0 2.255 4H4.09zm-.582 3.5c.03-.877.138-1.718.312-2.5H1.674a6.958 6.958 0 0 0-.656 2.5h2.49zM4.847 5a12.5 12.5 0 0 0-.338 2.5H7.5V5H4.847zM8.5 5v2.5h2.99a12.495 12.495 0 0 0-.337-2.5H8.5zM4.51 8.5a12.5 12.5 0 0 0 .337 2.5H7.5V8.5H4.51zm3.99 0V11h2.653c.187-.765.306-1.608.338-2.5H8.5zM5.145 12c.138.386.295.744.468 1.068.552 1.035 1.218 1.65 1.887 1.855V12H5.145zm.182 2.472a6.696 6.696 0 0 1-.597-.933A9.268 9.268 0 0 1 4.09 12H2.255a7.024 7.024 0 0 0 3.072 2.472zM3.82 11a13.652 13.652 0 0 1-.312-2.5h-2.49c.062.89.291 1.733.656 2.5H3.82zm6.853 3.472A7.024 7.024 0 0 0 13.745 12H11.91a9.27 9.27 0 0 1-.64 1.539 6.688 6.688 0 0 1-.597.933zM8.5 12v2.923c.67-.204 1.335-.82 1.887-1.855.173-.324.33-.682.468-1.068H8.5zm3.68-1h2.146c.365-.767.594-1.61.656-2.5h-2.49a13.65 13.65 0 0 1-.312 2.5zm2.802-3.5a6.959 6.959 0 0 0-.656-2.5H12.18c.174.782.282 1.623.312 2.5h2.49zM11.27 2.461c.247.464.462.98.64 1.539h1.835a7.024 7.024 0 0 0-3.072-2.472c.218.284.418.598.597.933zM10.855 4a7.966 7.966 0 0 0-.468-1.068C9.835 1.897 9.17 1.282 8.5 1.077V4h2.355z"/>
    </svg>
  );

  // Get current language flag
  const getCurrentFlag = () => {
    const lang = availableLanguages[currentLanguage] || availableLanguages.en;
    return (
      <div className="relative w-6 h-6 overflow-hidden rounded-full">
        {lang.flag ? (
          <div className="absolute inset-0 flex items-center justify-center">
            <Image 
              src={lang.flag} 
              alt={lang.name} 
              width={24} 
              height={24} 
              className="object-cover w-full h-full"
            />
          </div>
        ) : (
          <div className="absolute inset-0 flex items-center justify-center text-xs">
            {lang.name.slice(0, 2)}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Toggle Button */}
      <button
        className="flex items-center p-1.5 rounded-full hover:bg-gray-100 transition-colors focus:outline-none"
        onClick={() => setIsOpen(!isOpen)}
        aria-expanded={isOpen}
        aria-label={t('accessibility.changeLanguage', 'Change language')}
      >
        <div className="relative flex items-center">
          <span className="relative -top -right">
            {getCurrentFlag() ? getCurrentFlag() : <GlobeIcon />}
          </span>
        </div>
      </button>

      {/* Vertical Language Menu */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg border border-gray-100 z-50 overflow-hidden">
          <div className="py-1 border-b border-gray-100">
            <p className="px-4 py-2 text-sm text-gray-500">
              {t('common.selectLanguage', 'Select Language')}
            </p>
          </div>
          <div className="py-1">
            {/* Display languages in the specified order: vi, en, fr, zh, kr, ja */}
            {['vi', 'en', 'fr', 'zh', 'kr', 'ja'].map((langCode) => (
              <button
                key={langCode}
                onClick={() => changeLanguage(langCode)}
                className={`w-full text-left px-4 py-2.5 flex items-center space-x-3 hover:bg-gray-50 transition ${currentLanguage === langCode ? 'bg-gray-50' : ''}`}
              >
                <div className="w-6 h-6 flex-shrink-0 relative overflow-hidden rounded-full border border-gray-200">
                  {availableLanguages[langCode].flag ? (
                    <Image 
                      src={availableLanguages[langCode].flag}
                      alt={availableLanguages[langCode].nativeName}
                      width={24}
                      height={24}
                      className="object-cover w-full h-full"
                    />
                  ) : (
                    <span className="absolute inset-0 flex items-center justify-center text-xs">
                      {availableLanguages[langCode].name.slice(0, 2)}
                    </span>
                  )}
                </div>
                <span className="text-sm">
                  <span className="font-medium block">{availableLanguages[langCode].nativeName}</span>
                  <span className="text-xs text-gray-500 block">{availableLanguages[langCode].nativeName}</span>
                </span>
                {currentLanguage === langCode && (
                  <span className="ml-auto text-green-500">
                    <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  </span>
                )}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default LanguageSwitcher;
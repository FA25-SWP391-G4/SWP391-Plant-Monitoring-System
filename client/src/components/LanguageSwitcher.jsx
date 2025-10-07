import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Dropdown } from 'react-bootstrap';
import { useAuth } from '../auth/AuthContext';
import languageApi from '../api/languageApi';

/**
 * LanguageSwitcher component
 * A dropdown menu for changing the application language
 * Syncs with backend when user is logged in
 */
const LanguageSwitcher = () => {
  const { i18n } = useTranslation();
  const { user } = useAuth();
  const [currentLanguage, setCurrentLanguage] = useState(i18n.language);
  const [availableLanguages, setAvailableLanguages] = useState({
    en: { name: 'English', flag: '🇬🇧' },
    vi: { name: 'Tiếng Việt', flag: '🇻🇳' }
  });

  // Load available languages from backend
  useEffect(() => {
    const fetchAvailableLanguages = async () => {
      try {
        const response = await languageApi.getAvailableLanguages();
        if (response.data?.languages) {
          const languagesMap = {};
          response.data.languages.forEach(lang => {
            languagesMap[lang.code] = {
              name: lang.name,
              flag: lang.flag
            };
          });
          setAvailableLanguages(languagesMap);
        }
      } catch (error) {
        console.error('Error fetching available languages:', error);
      }
    };

    fetchAvailableLanguages();
  }, []);

  // Get user's language preference if logged in
  useEffect(() => {
    const fetchUserPreference = async () => {
      if (user) {
        try {
          const response = await languageApi.getPreferences();
          if (response.data?.language) {
            i18n.changeLanguage(response.data.language);
            setCurrentLanguage(response.data.language);
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
    
    // Store in localStorage for non-authenticated users
    localStorage.setItem('i18nextLng', lang);
    
    // If user is logged in, update preference in backend
    if (user) {
      try {
        await languageApi.updatePreferences(lang);
      } catch (error) {
        console.error('Error updating language preference:', error);
      }
    }
  };

  return (
    <Dropdown align="end">
      <Dropdown.Toggle variant="light" size="sm" id="language-dropdown">
        {availableLanguages[currentLanguage]?.flag || '🌐'} {availableLanguages[currentLanguage]?.name || 'Language'}
      </Dropdown.Toggle>

      <Dropdown.Menu>
        {Object.keys(availableLanguages).map((langCode) => (
          <Dropdown.Item 
            key={langCode}
            onClick={() => changeLanguage(langCode)}
            active={currentLanguage === langCode}
          >
            {availableLanguages[langCode].flag} {availableLanguages[langCode].name}
          </Dropdown.Item>
        ))}
      </Dropdown.Menu>
    </Dropdown>
  );
};

export default LanguageSwitcher;
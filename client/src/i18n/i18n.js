// src/i18n/i18n.js
import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';
import Backend from 'i18next-http-backend';

// Import translation resources
import translationEN from './locales/en/translation.json';
import translationVI from './locales/vi/translation.json';
import translationJA from './locales/ja/translation.json';
import translationKR from './locales/kr/translation.json';
import translationFR from './locales/fr/translation.json';
import translationZH from './locales/zh/translation.json';
import aiEN from './locales/en/ai.json';
import aiVI from './locales/vi/ai.json';
import aiZH from './locales/zh/ai.json';

// Translation resources
const resources = {
  en: {
    translation: translationEN,
    ai: aiEN.ai
  },
  vi: {
    translation: translationVI,
    ai: aiVI.ai
  },
  ja: {
    translation: translationJA
  },
  kr: {
    translation: translationKR
  },
  fr: {
    translation: translationFR
  },
  zh: {
    translation: translationZH,
    ai: aiZH.ai
  }
};

i18n
  // Use backend for loading translations from server (optional)
  .use(Backend)
  // Detect user language
  .use(LanguageDetector)
  // Pass the i18n instance to react-i18next
  .use(initReactI18next)
  // Init i18next
  .init({
    resources,
    fallbackLng: 'vi',
    debug: process.env.NODE_ENV === 'development',
    
    interpolation: {
      escapeValue: false, // React already escapes values
    },
    
    // Detect language from localStorage or navigator
    detection: {
      order: ['localStorage', 'navigator'],
      cachkr: ['localStorage'],
    },
  });

export default i18n;
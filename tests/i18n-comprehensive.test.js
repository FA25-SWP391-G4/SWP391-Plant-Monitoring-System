/**
 * Comprehensive tests for i18n (internationalization) implementation
 */

const fs = require('fs');
const path = require('path');

// Path to i18n locale files
const LOCALES_DIR = path.join(__dirname, '..', 'client', 'src', 'i18n', 'locales');
const SUPPORTED_LANGUAGES = ['en', 'es', 'fr', 'zh'];

// Helper function to flatten nested objects with dot notation
function flattenObject(obj, prefix = '') {
  return Object.keys(obj).reduce((acc, key) => {
    const pre = prefix.length ? `${prefix}.` : '';
    
    if (typeof obj[key] === 'object' && obj[key] !== null && !Array.isArray(obj[key])) {
      Object.assign(acc, flattenObject(obj[key], `${pre}${key}`));
    } else {
      acc[`${pre}${key}`] = obj[key];
    }
    
    return acc;
  }, {});
}

// Helper function to extract format variables from a string
function extractFormatVariables(str) {
  if (typeof str !== 'string') return [];
  const matches = str.match(/\{([^}]+)\}/g) || [];
  return matches.map(match => match.replace(/[{}]/g, ''));
}

describe('i18n Translation Files', () => {
  // Load all translation files before tests
  const translations = {};
  
  beforeAll(() => {
    for (const lang of SUPPORTED_LANGUAGES) {
      const filePath = path.join(LOCALES_DIR, lang, 'translation.json');
      
      if (fs.existsSync(filePath)) {
        translations[lang] = JSON.parse(fs.readFileSync(filePath, 'utf8'));
      } else {
        translations[lang] = null;
      }
    }
  });
  
  test('all required translation files should exist', () => {
    for (const lang of SUPPORTED_LANGUAGES) {
      const filePath = path.join(LOCALES_DIR, lang, 'translation.json');
      expect(fs.existsSync(filePath)).toBe(true);
    }
  });
  
  test('all translation files should be valid JSON', () => {
    for (const lang of SUPPORTED_LANGUAGES) {
      const filePath = path.join(LOCALES_DIR, lang, 'translation.json');
      
      if (fs.existsSync(filePath)) {
        const content = fs.readFileSync(filePath, 'utf8');
        expect(() => JSON.parse(content)).not.toThrow();
      }
    }
  });
  
  test('should have consistent core keys across all locales', () => {
    // Skip test if any translation file is missing
    if (Object.values(translations).includes(null)) {
      console.log("Skipping test because some translation files are missing");
      return;
    }

    // Test common keys directly in the original structure
    for (const lang of SUPPORTED_LANGUAGES) {
      // Check common section
      expect(translations[lang]).toHaveProperty('common');
      expect(translations[lang].common).toHaveProperty('submit');
      expect(translations[lang].common).toHaveProperty('cancel');
      expect(translations[lang].common).toHaveProperty('save');
      
      // Check navigation section
      expect(translations[lang]).toHaveProperty('navigation');
      expect(translations[lang].navigation).toHaveProperty('home');
      expect(translations[lang].navigation).toHaveProperty('login');

      // Check auth section
      expect(translations[lang]).toHaveProperty('auth');
      expect(translations[lang].auth).toHaveProperty('login');
      expect(translations[lang].auth).toHaveProperty('register');
    }
    
    // Check format variables for zones.assignPump which has a variable
    for (const lang of SUPPORTED_LANGUAGES) {
      if (translations[lang].zones && translations[lang].zones.assignPump) {
        const text = translations[lang].zones.assignPump;
        expect(text).toContain('{{zone}}');
      }
    }
  });
  
  test('language structure should have common sections', () => {
    // Define minimum expected top-level sections in translations
    const expectedSections = [
      'common',
      'navigation',
      'auth'
    ];
    
    for (const lang of SUPPORTED_LANGUAGES) {
      if (translations[lang]) {
        for (const section of expectedSections) {
          expect(translations[lang]).toHaveProperty(section);
        }
      }
    }
  });
  
  test('should not have empty translation strings', () => {
    for (const lang of SUPPORTED_LANGUAGES) {
      if (translations[lang]) {
        const flatTranslations = flattenObject(translations[lang]);
        
        for (const [key, value] of Object.entries(flatTranslations)) {
          // Skip array values
          if (Array.isArray(value)) continue;
          
          // Check for empty strings
          if (typeof value === 'string') {
            expect(value.trim()).not.toBe('');
          }
        }
      }
    }
  });
});

// Skip language controller tests in this file since we have a dedicated test file for that
describe('Language Controller Integration - Basic Checks', () => {
  test('language controller file should exist', () => {
    const controllerPath = path.join(__dirname, '..', 'controllers', 'languageController.js');
    expect(fs.existsSync(controllerPath)).toBe(true);
  });
});

describe('i18n Frontend Integration', () => {
  test('translation keys should match frontend component usage patterns', () => {
    // Skip if English translations are missing
    const enPath = path.join(LOCALES_DIR, 'en', 'translation.json');
    if (!fs.existsSync(enPath)) return;
    
    const enTranslations = JSON.parse(fs.readFileSync(enPath, 'utf8'));
    
    // Test common navigation keys that should be present
    expect(enTranslations.navigation).toHaveProperty('dashboard');
    expect(enTranslations.navigation).toHaveProperty('home');
    expect(enTranslations.navigation).toHaveProperty('login');
    expect(enTranslations.navigation).toHaveProperty('profile');
    
    // Check for at least some common keys
    expect(enTranslations.common).toHaveProperty('submit');
    expect(enTranslations.common).toHaveProperty('cancel');
    expect(enTranslations.common).toHaveProperty('email');
  });
});
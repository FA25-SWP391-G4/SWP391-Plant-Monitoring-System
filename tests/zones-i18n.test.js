/**
 * Tests for internationalization in the zones functionality
 * This test validates that the zones feature properly uses the i18n system
 */

const fs = require('fs');
const path = require('path');

// Path to i18n locale files
const LOCALES_DIR = path.join(__dirname, '..', 'client', 'src', 'i18n', 'locales');
const SUPPORTED_LANGUAGES = ['en', 'es', 'fr', 'zh'];

describe('Zones i18n Tests', () => {
  const translations = {};
  
  beforeAll(() => {
    // Load all translation files
    for (const lang of SUPPORTED_LANGUAGES) {
      const filePath = path.join(LOCALES_DIR, lang, 'translation.json');
      
      if (fs.existsSync(filePath)) {
        translations[lang] = JSON.parse(fs.readFileSync(filePath, 'utf8'));
      } else {
        translations[lang] = null;
      }
    }
  });
  
  test('all languages should have zones section', () => {
    for (const lang of SUPPORTED_LANGUAGES) {
      expect(translations[lang]).toHaveProperty('zones');
    }
  });
  
  test('zones section should have all required keys', () => {
    // Core keys that should be present in the zones section
    const coreZonesKeys = [
      'title',
      'createZone',
      'zoneName',
      'zoneDescription',
      'devices',
      'device',
      'assignTo',
      'deleteZone'
    ];
    
    for (const lang of SUPPORTED_LANGUAGES) {
      for (const key of coreZonesKeys) {
        expect(translations[lang].zones).toHaveProperty(key);
      }
    }
  });
  
  test('assignPump translation should contain {{zone}} variable', () => {
    for (const lang of SUPPORTED_LANGUAGES) {
      const assignPumpText = translations[lang].zones.assignPump;
      expect(assignPumpText).toContain('{{zone}}');
    }
  });
  
  test('zones translations should be different across languages', () => {
    // Check that translations are actually different
    // For example, the English "Create Zone" should be different from Spanish "Crear zona"
    
    // Compare a few key translations
    const titleTranslations = SUPPORTED_LANGUAGES.map(lang => 
      translations[lang].zones.title
    );
    
    const uniqueTitles = new Set(titleTranslations);
    expect(uniqueTitles.size).toBe(SUPPORTED_LANGUAGES.length);
    
    const createZoneTranslations = SUPPORTED_LANGUAGES.map(lang => 
      translations[lang].zones.createZone
    );
    
    const uniqueCreateZones = new Set(createZoneTranslations);
    expect(uniqueCreateZones.size).toBe(SUPPORTED_LANGUAGES.length);
  });
});
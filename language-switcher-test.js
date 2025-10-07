/**
 * LanguageSwitcher Component Test
 * This test validates the LanguageSwitcher component by checking its implementation
 */

const fs = require('fs');
const path = require('path');
const assert = require('assert');

const clientDir = path.join(__dirname, 'client');
const componentsDir = path.join(clientDir, 'src', 'components');
const langSwitcherPath = path.join(componentsDir, 'LanguageSwitcher.jsx');
const apiDir = path.join(clientDir, 'src', 'api');
const langApiPath = path.join(apiDir, 'languageApi.js');

console.log('Starting LanguageSwitcher component test...');

// Test 1: Check if LanguageSwitcher component exists
try {
  console.log('Test 1: Checking if LanguageSwitcher.jsx exists...');
  assert.strictEqual(fs.existsSync(langSwitcherPath), true, 'LanguageSwitcher.jsx should exist');
  console.log('✅ LanguageSwitcher.jsx exists');
} catch (error) {
  console.error('❌ Test failed:', error.message);
  process.exit(1);
}

// Test 2: Check if languageApi.js exists
try {
  console.log('Test 2: Checking if languageApi.js exists...');
  assert.strictEqual(fs.existsSync(langApiPath), true, 'languageApi.js should exist');
  console.log('✅ languageApi.js exists');
} catch (error) {
  console.error('❌ Test failed:', error.message);
  process.exit(1);
}

// Test 3: Validate LanguageSwitcher implementation
try {
  console.log('Test 3: Validating LanguageSwitcher implementation...');
  const langSwitcherContent = fs.readFileSync(langSwitcherPath, 'utf8');
  
  // Check for key imports
  assert.ok(langSwitcherContent.includes('useTranslation'), 'LanguageSwitcher should import useTranslation');
  assert.ok(langSwitcherContent.includes('useAuth'), 'LanguageSwitcher should import useAuth');
  assert.ok(langSwitcherContent.includes('languageApi'), 'LanguageSwitcher should import languageApi');
  
  // Check for key functionality
  assert.ok(langSwitcherContent.includes('changeLanguage'), 'LanguageSwitcher should have changeLanguage function');
  assert.ok(langSwitcherContent.includes('i18n.changeLanguage'), 'LanguageSwitcher should call i18n.changeLanguage');
  assert.ok(langSwitcherContent.includes('localStorage.setItem'), 'LanguageSwitcher should store preference in localStorage');
  
  console.log('✅ LanguageSwitcher implementation is valid');
} catch (error) {
  console.error('❌ Test failed:', error.message);
  process.exit(1);
}

// Test 4: Validate languageApi implementation
try {
  console.log('Test 4: Validating languageApi implementation...');
  const langApiContent = fs.readFileSync(langApiPath, 'utf8');
  
  // Check for key API endpoints
  assert.ok(langApiContent.includes('getAvailableLanguages'), 'languageApi should have getAvailableLanguages method');
  assert.ok(langApiContent.includes('getPreferences'), 'languageApi should have getPreferences method');
  assert.ok(langApiContent.includes('updatePreferences'), 'languageApi should have updatePreferences method');
  
  // Check for API endpoints
  assert.ok(langApiContent.includes('/api/language/available'), 'languageApi should call /api/language/available endpoint');
  assert.ok(langApiContent.includes('/api/language/preferences'), 'languageApi should call /api/language/preferences endpoint');
  
  console.log('✅ languageApi implementation is valid');
} catch (error) {
  console.error('❌ Test failed:', error.message);
  process.exit(1);
}

console.log('All LanguageSwitcher tests passed! ✅');
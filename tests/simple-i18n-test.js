/**
 * Simple I18n Validation Test
 * This test verifies that our translations are loaded and accessible
 */

// Check if translation files exist and contain expected keys
const fs = require('fs');
const path = require('path');
const assert = require('assert');

const clientDir = path.join(__dirname, 'client');
const i18nDir = path.join(clientDir, 'src', 'i18n');
const localesDir = path.join(i18nDir, 'locales');

console.log('Starting I18n validation test...');

// Test 1: Check if i18n directory exists
try {
  console.log('Test 1: Checking if i18n directory exists...');
  assert.strictEqual(fs.existsSync(i18nDir), true, 'i18n directory should exist');
  console.log('✅ i18n directory exists');
} catch (error) {
  console.error('❌ Test failed:', error.message);
  process.exit(1);
}

// Test 2: Check if i18n.js file exists
try {
  console.log('Test 2: Checking if i18n.js exists...');
  const i18nJsPath = path.join(i18nDir, 'i18n.js');
  assert.strictEqual(fs.existsSync(i18nJsPath), true, 'i18n.js should exist');
  console.log('✅ i18n.js exists');
} catch (error) {
  console.error('❌ Test failed:', error.message);
  process.exit(1);
}

// Test 3: Check if locales directory exists
try {
  console.log('Test 3: Checking if locales directory exists...');
  assert.strictEqual(fs.existsSync(localesDir), true, 'locales directory should exist');
  console.log('✅ locales directory exists');
} catch (error) {
  console.error('❌ Test failed:', error.message);
  process.exit(1);
}

// Test 4: Check if English translations exist
try {
  console.log('Test 4: Checking English translations...');
  const enDir = path.join(localesDir, 'en');
  assert.strictEqual(fs.existsSync(enDir), true, 'English locale directory should exist');
  
  const enTranslationPath = path.join(enDir, 'translation.json');
  assert.strictEqual(fs.existsSync(enTranslationPath), true, 'English translation file should exist');
  
  const enTranslation = JSON.parse(fs.readFileSync(enTranslationPath, 'utf8'));
  assert.strictEqual(typeof enTranslation, 'object', 'English translation should be an object');
  
  // Check for common keys
  assert.strictEqual(typeof enTranslation.common, 'object', 'English translation should have common section');
  assert.strictEqual(typeof enTranslation.navigation, 'object', 'English translation should have navigation section');
  
  console.log('✅ English translations exist and have expected structure');
} catch (error) {
  console.error('❌ Test failed:', error.message);
  process.exit(1);
}

// Test 5: Check if Vietnamese translations exist
try {
  console.log('Test 5: Checking Vietnamese translations...');
  const viDir = path.join(localesDir, 'vi');
  assert.strictEqual(fs.existsSync(viDir), true, 'Vietnamese locale directory should exist');
  
  const viTranslationPath = path.join(viDir, 'translation.json');
  assert.strictEqual(fs.existsSync(viTranslationPath), true, 'Vietnamese translation file should exist');
  
  const viTranslation = JSON.parse(fs.readFileSync(viTranslationPath, 'utf8'));
  assert.strictEqual(typeof viTranslation, 'object', 'Vietnamese translation should be an object');
  
  // Check for common keys
  assert.strictEqual(typeof viTranslation.common, 'object', 'Vietnamese translation should have common section');
  assert.strictEqual(typeof viTranslation.navigation, 'object', 'Vietnamese translation should have navigation section');
  
  console.log('✅ Vietnamese translations exist and have expected structure');
} catch (error) {
  console.error('❌ Test failed:', error.message);
  process.exit(1);
}

console.log('All i18n validation tests passed! ✅');
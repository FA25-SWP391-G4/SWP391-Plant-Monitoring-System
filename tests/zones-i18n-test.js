/**
 * Zones Page I18n Integration Test
 * This test validates that the Zones page properly uses i18n translations
 */

const fs = require('fs');
const path = require('path');
const assert = require('assert');

const clientDir = path.join(__dirname, 'client');
const pagesDir = path.join(clientDir, 'src', 'pages');
const zonesPagePath = path.join(pagesDir, 'Zones.jsx');

console.log('Starting Zones page i18n integration test...');

// Test 1: Check if Zones page exists
try {
  console.log('Test 1: Checking if Zones.jsx exists...');
  assert.strictEqual(fs.existsSync(zonesPagePath), true, 'Zones.jsx should exist');
  console.log('✅ Zones.jsx exists');
} catch (error) {
  console.error('❌ Test failed:', error.message);
  process.exit(1);
}

// Test 2: Validate Zones page i18n integration
try {
  console.log('Test 2: Validating Zones page i18n integration...');
  const zonesPageContent = fs.readFileSync(zonesPagePath, 'utf8');
  
  // Check for i18n imports
  assert.ok(zonesPageContent.includes('useTranslation'), 'Zones page should import useTranslation');
  
  // Check if useTranslation is initialized
  assert.ok(zonesPageContent.includes('const { t }'), 'Zones page should initialize the t function');
  
  // Check for translation usage
  assert.ok(zonesPageContent.includes('t('), 'Zones page should use translations with the t function');
  
  // Count the number of translation usages
  const translationCount = (zonesPageContent.match(/t\(/g) || []).length;
  assert.ok(translationCount > 5, `Zones page should use translations extensively (found ${translationCount})`);
  
  console.log(`✅ Zones page uses i18n with ${translationCount} translation calls`);
} catch (error) {
  console.error('❌ Test failed:', error.message);
  process.exit(1);
}

// Test 3: Check for key UI elements with translations
try {
  console.log('Test 3: Checking for key UI elements with translations...');
  const zonesPageContent = fs.readFileSync(zonesPagePath, 'utf8');
  
  // Check specific translations used for important UI elements
  const keyTranslations = [
    't(\'zones.title\')',
    't(\'zones.createZone\')',
    't(\'zones.zoneName\')',
    't(\'zones.zoneDescription\')',
    't(\'zones.devices\')',
    't(\'common.add\')',
    't(\'zones.unassignedDevices\')'
  ];
  
  let foundCount = 0;
  keyTranslations.forEach(translationKey => {
    if (zonesPageContent.includes(translationKey)) {
      console.log(`  ✅ Found translation: ${translationKey}`);
      foundCount++;
    } else {
      console.log(`  ❌ Missing translation: ${translationKey}`);
    }
  });
  
  // Some translation keys might be structured differently, so we'll do a fuzzy check too
  keyTranslations.forEach(translationKey => {
    const key = translationKey.replace(/t\(['"]|['"]\)/g, '').replace(/\\/g, '');
    if (zonesPageContent.includes(key) && !zonesPageContent.includes(translationKey)) {
      console.log(`  ⚠️ Found possible alternative format for: ${translationKey}`);
    }
  });
  
  assert.ok(foundCount > 0, 'Zones page should use at least some of the expected translation keys');
  
  console.log(`✅ Found ${foundCount} out of ${keyTranslations.length} expected translation keys`);
} catch (error) {
  console.error('❌ Test failed:', error.message);
  process.exit(1);
}

console.log('All Zones page i18n integration tests passed! ✅');
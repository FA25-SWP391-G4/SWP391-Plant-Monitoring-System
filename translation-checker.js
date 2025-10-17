const fs = require('fs');
const path = require('path');

// Path to the locales directory
const localesDir = path.join(__dirname, 'client', 'src', 'i18n', 'locales');

// Get all language directories
const languages = fs.readdirSync(localesDir).filter(
  file => fs.statSync(path.join(localesDir, file)).isDirectory()
);

// Use English as the reference language
const referenceLanguage = 'en';
const referencePath = path.join(localesDir, referenceLanguage, 'translation.json');
const referenceContent = JSON.parse(fs.readFileSync(referencePath, 'utf8'));

// Check each language against the reference
languages.forEach(lang => {
  if (lang === referenceLanguage) return; // Skip the reference language

  const langPath = path.join(localesDir, lang, 'translation.json');
  const langContent = JSON.parse(fs.readFileSync(langPath, 'utf8'));

  console.log(`\n\nAnalyzing ${lang.toUpperCase()} translations:`);

  // Check for missing keys
  const missingKeys = [];
  const checkForMissingKeys = (refObj, langObj, currentPath = '') => {
    for (const key in refObj) {
      const newPath = currentPath ? `${currentPath}.${key}` : key;

      if (!(key in langObj)) {
        missingKeys.push(newPath);
      } else if (typeof refObj[key] === 'object' && refObj[key] !== null && !Array.isArray(refObj[key])) {
        checkForMissingKeys(refObj[key], langObj[key], newPath);
      }
    }
  };

  checkForMissingKeys(referenceContent, langContent);

  if (missingKeys.length > 0) {
    console.log(`Found ${missingKeys.length} missing keys in ${lang}:`);
    missingKeys.forEach(key => console.log(`  - ${key}`));
  } else {
    console.log(`No missing keys found in ${lang}!`);
  }

  // Check for extra keys (keys in the language file but not in the reference)
  const extraKeys = [];
  const checkForExtraKeys = (langObj, refObj, currentPath = '') => {
    for (const key in langObj) {
      const newPath = currentPath ? `${currentPath}.${key}` : key;

      if (!(key in refObj)) {
        extraKeys.push(newPath);
      } else if (typeof langObj[key] === 'object' && langObj[key] !== null && !Array.isArray(langObj[key])) {
        checkForExtraKeys(langObj[key], refObj[key], newPath);
      }
    }
  };

  checkForExtraKeys(langContent, referenceContent);

  if (extraKeys.length > 0) {
    console.log(`Found ${extraKeys.length} extra keys in ${lang}:`);
    extraKeys.forEach(key => console.log(`  - ${key}`));
  } else {
    console.log(`No extra keys found in ${lang}!`);
  }
});

console.log('\n\nAnalysis complete!');

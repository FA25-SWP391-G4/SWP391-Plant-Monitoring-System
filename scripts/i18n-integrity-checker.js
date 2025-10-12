/**
 * i18n-integrity-checker.js
 * 
 * This script checks the integrity of the i18n setup by verifying:
 * 1. All required language files exist
 * 2. All language files have the same set of keys (complete coverage)
 * 3. No missing translations or placeholder values
 * 4. Format variables are consistent across translations
 */

const fs = require('fs');
const path = require('path');

// Configuration
const LOCALES_DIR = path.join(__dirname, '..', 'client', 'src', 'i18n', 'locales');
const SUPPORTED_LANGUAGES = ['en', 'es', 'fr', 'zh'];
const PRIMARY_LANG = 'en'; // The reference language

// Terminal colors for better output
const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m'
};

/**
 * Flattens nested objects with dot notation
 */
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

/**
 * Extracts format variables from a translation string
 * e.g. "Hello {name}, you have {count} messages" => ["name", "count"]
 */
function extractFormatVariables(str) {
  if (typeof str !== 'string') return [];
  const matches = str.match(/\{([^}]+)\}/g) || [];
  return matches.map(match => match.replace(/[{}]/g, ''));
}

/**
 * Checks if all language files exist
 */
function checkLanguageFilesExist() {
  console.log(`${colors.blue}Checking language files existence...${colors.reset}`);
  
  const missingFiles = [];
  
  for (const lang of SUPPORTED_LANGUAGES) {
    const filePath = path.join(LOCALES_DIR, lang, 'translation.json');
    if (!fs.existsSync(filePath)) {
      missingFiles.push(lang);
    }
  }
  
  if (missingFiles.length === 0) {
    console.log(`${colors.green}✓ All language files exist${colors.reset}`);
    return true;
  } else {
    console.log(`${colors.red}✗ Missing language files: ${missingFiles.join(', ')}${colors.reset}`);
    return false;
  }
}

/**
 * Checks for translation key consistency across all languages
 */
function checkTranslationConsistency() {
  console.log(`${colors.blue}Checking translation key consistency...${colors.reset}`);
  
  // Load primary language as reference
  const primaryLangPath = path.join(LOCALES_DIR, PRIMARY_LANG, 'translation.json');
  let primaryTranslations;
  
  try {
    primaryTranslations = JSON.parse(fs.readFileSync(primaryLangPath, 'utf8'));
  } catch (err) {
    console.log(`${colors.red}✗ Error reading primary language file: ${err.message}${colors.reset}`);
    return false;
  }
  
  const flattenedPrimary = flattenObject(primaryTranslations);
  const primaryKeys = Object.keys(flattenedPrimary);
  
  let allConsistent = true;
  const inconsistencies = {};
  
  // Compare each language with primary
  for (const lang of SUPPORTED_LANGUAGES.filter(l => l !== PRIMARY_LANG)) {
    const langPath = path.join(LOCALES_DIR, lang, 'translation.json');
    
    try {
      const translations = JSON.parse(fs.readFileSync(langPath, 'utf8'));
      const flattenedTranslations = flattenObject(translations);
      const langKeys = Object.keys(flattenedTranslations);
      
      // Check for missing keys
      const missingKeys = primaryKeys.filter(key => !langKeys.includes(key));
      
      // Check for extra keys
      const extraKeys = langKeys.filter(key => !primaryKeys.includes(key));
      
      // Check for format variable consistency
      const formatInconsistencies = [];
      for (const key of primaryKeys) {
        if (langKeys.includes(key)) {
          const primaryVars = extractFormatVariables(flattenedPrimary[key]);
          const langVars = extractFormatVariables(flattenedTranslations[key]);
          
          // Check if variables match
          if (primaryVars.length > 0) {
            const missingVars = primaryVars.filter(v => !langVars.includes(v));
            const extraVars = langVars.filter(v => !primaryVars.includes(v));
            
            if (missingVars.length > 0 || extraVars.length > 0) {
              formatInconsistencies.push({
                key,
                missingVars,
                extraVars
              });
            }
          }
        }
      }
      
      // Check for empty strings or placeholder values
      const placeholders = [];
      for (const key of langKeys) {
        const value = flattenedTranslations[key];
        if (typeof value === 'string' && (value === '' || value === 'TODO' || value.includes('TRANSLATE_ME'))) {
          placeholders.push(key);
        }
      }
      
      if (missingKeys.length > 0 || extraKeys.length > 0 || formatInconsistencies.length > 0 || placeholders.length > 0) {
        allConsistent = false;
        inconsistencies[lang] = {
          missingKeys,
          extraKeys,
          formatInconsistencies,
          placeholders
        };
      }
      
    } catch (err) {
      console.log(`${colors.red}✗ Error processing ${lang}: ${err.message}${colors.reset}`);
      allConsistent = false;
      inconsistencies[lang] = { error: err.message };
    }
  }
  
  if (allConsistent) {
    console.log(`${colors.green}✓ All translations are consistent${colors.reset}`);
  } else {
    console.log(`${colors.red}✗ Translation inconsistencies found:${colors.reset}`);
    Object.keys(inconsistencies).forEach(lang => {
      const issues = inconsistencies[lang];
      console.log(`${colors.yellow}Language: ${lang}${colors.reset}`);
      
      if (issues.error) {
        console.log(`  ${colors.red}Error: ${issues.error}${colors.reset}`);
        return;
      }
      
      if (issues.missingKeys.length > 0) {
        console.log(`  ${colors.red}- Missing ${issues.missingKeys.length} keys:${colors.reset}`);
        issues.missingKeys.slice(0, 5).forEach(key => {
          console.log(`    ${key}`);
        });
        if (issues.missingKeys.length > 5) {
          console.log(`    ... and ${issues.missingKeys.length - 5} more`);
        }
      }
      
      if (issues.extraKeys.length > 0) {
        console.log(`  ${colors.yellow}- Extra ${issues.extraKeys.length} keys:${colors.reset}`);
        issues.extraKeys.slice(0, 5).forEach(key => {
          console.log(`    ${key}`);
        });
        if (issues.extraKeys.length > 5) {
          console.log(`    ... and ${issues.extraKeys.length - 5} more`);
        }
      }
      
      if (issues.formatInconsistencies.length > 0) {
        console.log(`  ${colors.red}- Format inconsistencies in ${issues.formatInconsistencies.length} keys:${colors.reset}`);
        issues.formatInconsistencies.slice(0, 3).forEach(inc => {
          console.log(`    ${inc.key}:`);
          if (inc.missingVars.length > 0) {
            console.log(`      Missing variables: ${inc.missingVars.join(', ')}`);
          }
          if (inc.extraVars.length > 0) {
            console.log(`      Extra variables: ${inc.extraVars.join(', ')}`);
          }
        });
        if (issues.formatInconsistencies.length > 3) {
          console.log(`    ... and ${issues.formatInconsistencies.length - 3} more`);
        }
      }
      
      if (issues.placeholders.length > 0) {
        console.log(`  ${colors.yellow}- ${issues.placeholders.length} placeholder/empty values:${colors.reset}`);
        issues.placeholders.slice(0, 5).forEach(key => {
          console.log(`    ${key}`);
        });
        if (issues.placeholders.length > 5) {
          console.log(`    ... and ${issues.placeholders.length - 5} more`);
        }
      }
    });
  }
  
  return allConsistent;
}

/**
 * Main function to run all checks
 */
function runI18nIntegrityCheck() {
  console.log(`${colors.magenta}=== I18N INTEGRITY CHECK ====${colors.reset}`);
  
  const filesExist = checkLanguageFilesExist();
  const isConsistent = checkTranslationConsistency();
  
  console.log(`${colors.magenta}=== CHECK SUMMARY ====${colors.reset}`);
  console.log(`Files exist: ${filesExist ? colors.green + '✓' : colors.red + '✗'}${colors.reset}`);
  console.log(`Translation consistency: ${isConsistent ? colors.green + '✓' : colors.red + '✗'}${colors.reset}`);
  
  return filesExist && isConsistent;
}

// Run the checks when executed directly
if (require.main === module) {
  const success = runI18nIntegrityCheck();
  process.exit(success ? 0 : 1);
}

module.exports = {
  runI18nIntegrityCheck
};
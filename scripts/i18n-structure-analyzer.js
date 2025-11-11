/**
 * i18n-structure-analyzer.js
 * 
 * This script analyzes the structure of i18n translation files and generates
 * a report on their consistency, completeness, and potential issues.
 */

const fs = require('fs');
const path = require('path');

// Configuration
const LOCALES_DIR = path.join(__dirname, '..', 'client', 'src', 'i18n', 'locales');
const SUPPORTED_LANGUAGES = ['en', 'es', 'fr', 'zh'];
const PRIMARY_LANG = 'en'; // The reference language
const OUTPUT_FILE = path.join(__dirname, '..', 'i18n-structure-report.md');

// Helper to create deep path directories structure for nested keys
function createNestedPathFromKeys(obj, keyPath, value) {
  const keys = keyPath.split('.');
  let current = obj;
  
  for (let i = 0; i < keys.length - 1; i++) {
    const key = keys[i];
    if (!current[key]) {
      current[key] = {};
    }
    current = current[key];
  }
  
  current[keys[keys.length - 1]] = value;
  return obj;
}

// Flattens an object with dot notation
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

// Extracts format variables from a string (e.g., "Hello {name}" -> ["name"])
function extractFormatVariables(str) {
  if (typeof str !== 'string') return [];
  const matches = str.match(/\{([^}]+)\}/g) || [];
  return matches.map(match => match.replace(/[{}]/g, ''));
}

// Load all translation files
function loadTranslationFiles() {
  const translations = {};
  
  for (const lang of SUPPORTED_LANGUAGES) {
    const filePath = path.join(LOCALES_DIR, lang, 'translation.json');
    
    try {
      if (fs.existsSync(filePath)) {
        translations[lang] = JSON.parse(fs.readFileSync(filePath, 'utf8'));
      } else {
        console.warn(`Warning: Translation file for ${lang} does not exist.`);
        translations[lang] = {};
      }
    } catch (err) {
      console.error(`Error loading ${lang} translations:`, err);
      translations[lang] = {};
    }
  }
  
  return translations;
}

// Get a summary of translation completeness
function getTranslationCompleteness(translations) {
  const primaryFlat = flattenObject(translations[PRIMARY_LANG]);
  const primaryKeys = Object.keys(primaryFlat);
  const totalKeys = primaryKeys.length;
  
  const completeness = {};
  
  for (const lang of SUPPORTED_LANGUAGES) {
    if (lang === PRIMARY_LANG) {
      completeness[lang] = { 
        totalKeys,
        translatedKeys: totalKeys,
        missingKeys: [],
        percentage: 100
      };
      continue;
    }
    
    const langFlat = flattenObject(translations[lang]);
    const langKeys = Object.keys(langFlat);
    
    const missingKeys = primaryKeys.filter(key => !langKeys.includes(key));
    const translatedKeys = totalKeys - missingKeys.length;
    const percentage = Math.round((translatedKeys / totalKeys) * 100);
    
    completeness[lang] = {
      totalKeys,
      translatedKeys,
      missingKeys,
      percentage
    };
  }
  
  return completeness;
}

// Find format variable inconsistencies
function findFormatVariableInconsistencies(translations) {
  const primaryFlat = flattenObject(translations[PRIMARY_LANG]);
  const inconsistencies = {};
  
  for (const lang of SUPPORTED_LANGUAGES) {
    if (lang === PRIMARY_LANG) continue;
    
    const langFlat = flattenObject(translations[lang]);
    const formatIssues = [];
    
    for (const key of Object.keys(primaryFlat)) {
      if (!langFlat[key]) continue;
      
      const primaryVars = extractFormatVariables(primaryFlat[key]);
      const langVars = extractFormatVariables(langFlat[key]);
      
      if (primaryVars.length > 0) {
        const missingVars = primaryVars.filter(v => !langVars.includes(v));
        const extraVars = langVars.filter(v => !primaryVars.includes(v));
        
        if (missingVars.length > 0 || extraVars.length > 0) {
          formatIssues.push({
            key,
            primaryVars,
            langVars,
            missingVars,
            extraVars
          });
        }
      }
    }
    
    if (formatIssues.length > 0) {
      inconsistencies[lang] = formatIssues;
    }
  }
  
  return inconsistencies;
}

// Find placeholder values (empty, TODO, etc.)
function findPlaceholderValues(translations) {
  const placeholders = {};
  
  for (const lang of SUPPORTED_LANGUAGES) {
    const langFlat = flattenObject(translations[lang]);
    const foundPlaceholders = [];
    
    for (const [key, value] of Object.entries(langFlat)) {
      if (typeof value === 'string' && (
          value === '' || 
          value === 'TODO' || 
          value.includes('TRANSLATE_ME') ||
          value.includes('[PLACEHOLDER]')
      )) {
        foundPlaceholders.push({ key, value });
      }
    }
    
    if (foundPlaceholders.length > 0) {
      placeholders[lang] = foundPlaceholders;
    }
  }
  
  return placeholders;
}

// Generate a missing translation structure
function generateMissingTranslations(translations) {
  const primaryFlat = flattenObject(translations[PRIMARY_LANG]);
  const missing = {};
  
  for (const lang of SUPPORTED_LANGUAGES) {
    if (lang === PRIMARY_LANG) continue;
    
    const langFlat = flattenObject(translations[lang]);
    const missingTranslations = {};
    
    for (const key of Object.keys(primaryFlat)) {
      if (!langFlat[key]) {
        // Create a template translation based on the primary language
        const primaryValue = primaryFlat[key];
        const templateValue = typeof primaryValue === 'string' 
          ? `[TRANSLATE] ${primaryValue}` 
          : primaryValue;
        
        createNestedPathFromKeys(missingTranslations, key, templateValue);
      }
    }
    
    if (Object.keys(flattenObject(missingTranslations)).length > 0) {
      missing[lang] = missingTranslations;
    }
  }
  
  return missing;
}

// Generate the markdown report
function generateReport(translations) {
  const completeness = getTranslationCompleteness(translations);
  const formatInconsistencies = findFormatVariableInconsistencies(translations);
  const placeholders = findPlaceholderValues(translations);
  const missingTranslations = generateMissingTranslations(translations);
  
  let report = `# i18n Structure Analysis Report\n\n`;
  
  // Add overall summary
  report += `## Overall Summary\n\n`;
  report += `| Language | Completion | Keys Translated | Missing Keys |\n`;
  report += `|----------|------------|----------------|-------------|\n`;
  
  for (const lang of SUPPORTED_LANGUAGES) {
    const { percentage, translatedKeys, totalKeys, missingKeys } = completeness[lang];
    report += `| ${lang} | ${percentage}% | ${translatedKeys}/${totalKeys} | ${missingKeys.length} |\n`;
  }
  
  // Add format inconsistencies
  report += `\n## Format Variable Inconsistencies\n\n`;
  
  if (Object.keys(formatInconsistencies).length === 0) {
    report += `No format variable inconsistencies found. Great job! 👍\n\n`;
  } else {
    for (const [lang, issues] of Object.entries(formatInconsistencies)) {
      report += `### ${lang}\n\n`;
      report += `| Key | Primary Variables | ${lang} Variables | Missing | Extra |\n`;
      report += `|-----|-------------------|-----------------|---------|-------|\n`;
      
      for (const issue of issues) {
        report += `| \`${issue.key}\` | ${issue.primaryVars.join(', ') || '-'} | ${issue.langVars.join(', ') || '-'} | ${issue.missingVars.join(', ') || '-'} | ${issue.extraVars.join(', ') || '-'} |\n`;
      }
      
      report += `\n`;
    }
  }
  
  // Add placeholder values
  report += `\n## Placeholder Values\n\n`;
  
  if (Object.keys(placeholders).length === 0) {
    report += `No placeholder values found. All translations appear to be completed! 👍\n\n`;
  } else {
    for (const [lang, values] of Object.entries(placeholders)) {
      report += `### ${lang}\n\n`;
      report += `| Key | Value |\n`;
      report += `|-----|-------|\n`;
      
      for (const { key, value } of values) {
        report += `| \`${key}\` | ${value || '(empty string)'} |\n`;
      }
      
      report += `\n`;
    }
  }
  
  // Add missing translations examples
  report += `\n## Missing Translations\n\n`;
  
  if (Object.keys(missingTranslations).length === 0) {
    report += `No missing translations found. All languages have complete translations! 👍\n\n`;
  } else {
    for (const [lang, translations] of Object.entries(missingTranslations)) {
      report += `### ${lang}\n\n`;
      report += `${Object.keys(flattenObject(translations)).length} keys are missing in the ${lang} translation file.\n\n`;
      report += `Sample of missing keys:\n\n`;
      
      const flatMissing = flattenObject(translations);
      const sampleKeys = Object.keys(flatMissing).slice(0, 10);
      
      for (const key of sampleKeys) {
        report += `- \`${key}\`\n`;
      }
      
      if (Object.keys(flatMissing).length > 10) {
        report += `- ... and ${Object.keys(flatMissing).length - 10} more\n`;
      }
      
      report += `\n`;
    }
  }
  
  // Add recommendations
  report += `\n## Recommendations\n\n`;
  
  if (Object.keys(missingTranslations).length > 0) {
    report += `- Complete missing translations for: ${Object.keys(missingTranslations).join(', ')}\n`;
  }
  
  if (Object.keys(formatInconsistencies).length > 0) {
    report += `- Fix format variable inconsistencies in: ${Object.keys(formatInconsistencies).join(', ')}\n`;
  }
  
  if (Object.keys(placeholders).length > 0) {
    report += `- Replace placeholder values in: ${Object.keys(placeholders).join(', ')}\n`;
  }
  
  if (Object.keys(missingTranslations).length === 0 && 
      Object.keys(formatInconsistencies).length === 0 && 
      Object.keys(placeholders).length === 0) {
    report += `Everything looks good! Your i18n structure is complete and consistent. 🎉\n`;
  }
  
  return report;
}

// Main function
function analyzeI18nStructure() {
  console.log('Loading translation files...');
  const translations = loadTranslationFiles();
  
  console.log('Generating analysis report...');
  const report = generateReport(translations);
  
  console.log(`Writing report to ${OUTPUT_FILE}...`);
  fs.writeFileSync(OUTPUT_FILE, report);
  
  console.log('Analysis complete!');
  
  return report;
}

// Run if executed directly
if (require.main === module) {
  analyzeI18nStructure();
}

module.exports = { analyzeI18nStructure };
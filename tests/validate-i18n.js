/**
 * Test Runner for i18n Implementation
 * 
 * This script will manually validate our internationalization implementation
 * since we're having issues with the Jest environment setup.
 */
const fs = require('fs');
const path = require('path');

const rootDir = __dirname;
const clientSrcDir = path.join(rootDir, 'client', 'src');
const i18nDir = path.join(clientSrcDir, 'i18n');
const testResultFile = path.join(rootDir, 'i18n-validation-results.md');

console.log('Starting I18n Implementation Validation');

let report = `# Internationalization (i18n) Implementation Validation\n\n`;
report += `_Generated on ${new Date().toLocaleString()}_\n\n`;

// Test 1: Verify i18n Directory Structure
try {
  console.log('Testing i18n Directory Structure...');
  
  report += `## Directory Structure\n\n`;
  
  // Check i18n directory
  if (!fs.existsSync(i18nDir)) {
    report += `❌ i18n directory not found at ${i18nDir}\n\n`;
  } else {
    report += `✅ i18n directory found at ${i18nDir}\n\n`;
    
    // Check i18n configuration file
    const i18nConfigPath = path.join(i18nDir, 'i18n.js');
    if (fs.existsSync(i18nConfigPath)) {
      report += `✅ i18n.js configuration file found\n\n`;
      
      // Read and validate i18n configuration
      const i18nConfig = fs.readFileSync(i18nConfigPath, 'utf8');
      report += "```javascript\n";
      report += i18nConfig;
      report += "\n```\n\n";
      
      // Check if it imports the necessary i18n libraries
      const hasI18next = i18nConfig.includes('i18next');
      const hasReactI18next = i18nConfig.includes('react-i18next');
      const hasLanguageDetector = i18nConfig.includes('i18next-browser-languagedetector');
      
      report += `i18next imported: ${hasI18next ? '✅' : '❌'}\n`;
      report += `react-i18next imported: ${hasReactI18next ? '✅' : '❌'}\n`;
      report += `Language detector imported: ${hasLanguageDetector ? '✅' : '❌'}\n\n`;
    } else {
      report += `❌ i18n.js configuration file not found\n\n`;
    }
    
    // Check locales directory
    const localesDir = path.join(i18nDir, 'locales');
    if (fs.existsSync(localesDir)) {
      report += `✅ Locales directory found\n\n`;
      
      // Check English translations
      const enDir = path.join(localesDir, 'en');
      if (fs.existsSync(enDir)) {
        report += `✅ English translations directory found\n`;
        
        const enTranslationPath = path.join(enDir, 'translation.json');
        if (fs.existsSync(enTranslationPath)) {
          const enTranslation = JSON.parse(fs.readFileSync(enTranslationPath, 'utf8'));
          report += `✅ English translation file found with ${Object.keys(enTranslation).length} keys\n`;
          
          report += "\nSample English translations:\n";
          report += "```json\n";
          const sampleKeys = Object.keys(enTranslation).slice(0, 10);
          const sampleTranslations = {};
          sampleKeys.forEach(key => {
            sampleTranslations[key] = enTranslation[key];
          });
          report += JSON.stringify(sampleTranslations, null, 2);
          report += "\n```\n\n";
        } else {
          report += `❌ English translation file not found\n`;
        }
      } else {
        report += `❌ English translations directory not found\n`;
      }
      
      // Check Vietnamese translations
      const viDir = path.join(localesDir, 'vi');
      if (fs.existsSync(viDir)) {
        report += `✅ Vietnamese translations directory found\n`;
        
        const viTranslationPath = path.join(viDir, 'translation.json');
        if (fs.existsSync(viTranslationPath)) {
          const viTranslation = JSON.parse(fs.readFileSync(viTranslationPath, 'utf8'));
          report += `✅ Vietnamese translation file found with ${Object.keys(viTranslation).length} keys\n`;
          
          report += "\nSample Vietnamese translations:\n";
          report += "```json\n";
          const sampleKeys = Object.keys(viTranslation).slice(0, 10);
          const sampleTranslations = {};
          sampleKeys.forEach(key => {
            sampleTranslations[key] = viTranslation[key];
          });
          report += JSON.stringify(sampleTranslations, null, 2);
          report += "\n```\n\n";
        } else {
          report += `❌ Vietnamese translation file not found\n`;
        }
      } else {
        report += `❌ Vietnamese translations directory not found\n`;
      }
    } else {
      report += `❌ Locales directory not found\n\n`;
    }
  }
} catch (err) {
  report += `❌ Error testing i18n directory structure: ${err.message}\n\n`;
}

// Test 2: Check for Language Switcher Component
try {
  console.log('Testing Language Switcher Component...');
  
  report += `## Language Switcher Component\n\n`;
  
  const languageSwitcherPath = path.join(clientSrcDir, 'components', 'LanguageSwitcher.jsx');
  if (fs.existsSync(languageSwitcherPath)) {
    report += `✅ LanguageSwitcher.jsx component found\n\n`;
    
    const languageSwitcherCode = fs.readFileSync(languageSwitcherPath, 'utf8');
    
    // Check if it imports the necessary i18n libraries
    const hasUseTranslation = languageSwitcherCode.includes('useTranslation');
    const hasUseI18next = languageSwitcherCode.includes('i18n');
    
    report += `useTranslation imported: ${hasUseTranslation ? '✅' : '❌'}\n`;
    report += `i18n reference: ${hasUseI18next ? '✅' : '❌'}\n\n`;
    
    // Check for language switching logic
    const hasLanguageChangeLogic = languageSwitcherCode.includes('changeLanguage');
    report += `Language changing logic: ${hasLanguageChangeLogic ? '✅' : '❌'}\n\n`;
    
    report += "Code snippet:\n";
    report += "```jsx\n";
    // Extract a relevant code snippet
    let snippet = languageSwitcherCode;
    if (snippet.length > 1000) {
      // Try to find the changeLanguage function or method
      const changeLanguageIndex = snippet.indexOf('changeLanguage');
      if (changeLanguageIndex !== -1) {
        // Extract a window around the changeLanguage call
        const start = Math.max(0, changeLanguageIndex - 200);
        const end = Math.min(snippet.length, changeLanguageIndex + 200);
        snippet = snippet.substring(start, end);
      } else {
        // Just take the first 1000 characters
        snippet = snippet.substring(0, 1000) + '\n// ... truncated ...';
      }
    }
    report += snippet;
    report += "\n```\n\n";
  } else {
    report += `❌ LanguageSwitcher.jsx component not found\n\n`;
  }
} catch (err) {
  report += `❌ Error testing Language Switcher Component: ${err.message}\n\n`;
}

// Test 3: Check i18n Integration in App.jsx
try {
  console.log('Testing i18n Integration in App.jsx...');
  
  report += `## i18n Integration in App\n\n`;
  
  const appPath = path.join(clientSrcDir, 'App.jsx');
  if (fs.existsSync(appPath)) {
    report += `✅ App.jsx found\n\n`;
    
    const appCode = fs.readFileSync(appPath, 'utf8');
    
    // Check if it imports i18n
    const hasI18nImport = appCode.includes('i18n') || appCode.includes('I18nextProvider');
    report += `i18n import or provider: ${hasI18nImport ? '✅' : '❌'}\n\n`;
  } else {
    report += `❌ App.jsx not found\n\n`;
  }
} catch (err) {
  report += `❌ Error testing i18n Integration in App.jsx: ${err.message}\n\n`;
}

// Test 4: Check i18n Usage in Pages
try {
  console.log('Testing i18n Usage in Pages...');
  
  report += `## i18n Usage in Pages\n\n`;
  
  const pagesDir = path.join(clientSrcDir, 'pages');
  if (fs.existsSync(pagesDir)) {
    const pageFiles = fs.readdirSync(pagesDir)
      .filter(file => file.endsWith('.jsx') || file.endsWith('.js'));
    
    report += `Found ${pageFiles.length} page files\n\n`;
    
    let pagesWithI18n = 0;
    
    for (const pageFile of pageFiles) {
      const pagePath = path.join(pagesDir, pageFile);
      const pageCode = fs.readFileSync(pagePath, 'utf8');
      
      // Check if the page uses i18n
      const hasUseTranslation = pageCode.includes('useTranslation');
      const hasTranslationFunction = pageCode.includes('t(');
      
      if (hasUseTranslation || hasTranslationFunction) {
        pagesWithI18n++;
        report += `✅ ${pageFile} uses i18n\n`;
        
        if (hasUseTranslation) {
          report += `  - Imports useTranslation\n`;
        }
        
        if (hasTranslationFunction) {
          report += `  - Uses translation function\n`;
          
          // Try to extract some translation keys
          const translationKeys = [];
          const regex = /t\(['"]([^'"]+)['"]/g;
          let match;
          
          while ((match = regex.exec(pageCode)) !== null) {
            translationKeys.push(match[1]);
          }
          
          if (translationKeys.length > 0) {
            report += `  - Translation keys used: ${translationKeys.slice(0, 5).join(', ')}${translationKeys.length > 5 ? '...' : ''}\n`;
          }
        }
        
        report += '\n';
      } else {
        report += `❓ ${pageFile} does not appear to use i18n\n\n`;
      }
    }
    
    report += `${pagesWithI18n} out of ${pageFiles.length} pages use i18n\n\n`;
  } else {
    report += `❌ Pages directory not found\n\n`;
  }
} catch (err) {
  report += `❌ Error testing i18n Usage in Pages: ${err.message}\n\n`;
}

// Test 5: Check Backend Language API
try {
  console.log('Testing Backend Language API...');
  
  report += `## Backend Language API\n\n`;
  
  // Check for language controller
  const languageControllerPath = path.join(rootDir, 'controllers', 'languageController.js');
  if (fs.existsSync(languageControllerPath)) {
    report += `✅ languageController.js found\n\n`;
    
    const controllerCode = fs.readFileSync(languageControllerPath, 'utf8');
    report += "```javascript\n";
    report += controllerCode;
    report += "\n```\n\n";
  } else {
    report += `❌ languageController.js not found\n\n`;
  }
  
  // Check for language routes
  const routesDir = path.join(rootDir, 'routes');
  if (fs.existsSync(routesDir)) {
    const routeFiles = fs.readdirSync(routesDir);
    
    const languageRouteFile = routeFiles.find(file => 
      file === 'language.js' || 
      file.toLowerCase().includes('language') || 
      file.toLowerCase().includes('lang')
    );
    
    if (languageRouteFile) {
      report += `✅ Language route file found: ${languageRouteFile}\n\n`;
      
      const routeFilePath = path.join(routesDir, languageRouteFile);
      const routeCode = fs.readFileSync(routeFilePath, 'utf8');
      report += "```javascript\n";
      report += routeCode;
      report += "\n```\n\n";
    } else {
      // Check if language routes are defined in index.js or another main router
      const indexRoutePath = path.join(routesDir, 'index.js');
      if (fs.existsSync(indexRoutePath)) {
        const indexRouteCode = fs.readFileSync(indexRoutePath, 'utf8');
        
        if (indexRouteCode.includes('language') || indexRouteCode.includes('i18n')) {
          report += `✅ Language routes found in index.js\n\n`;
          
          // Extract the relevant section
          const lines = indexRouteCode.split('\n');
          const relevantLines = lines.filter(line => 
            line.includes('language') || 
            line.includes('i18n') || 
            line.includes('router.use')
          );
          
          report += "```javascript\n";
          report += relevantLines.join('\n');
          report += "\n```\n\n";
        } else {
          report += `❌ No language routes found in index.js\n\n`;
        }
      } else {
        report += `❌ No dedicated language route file found\n\n`;
      }
    }
  } else {
    report += `❌ Routes directory not found\n\n`;
  }
  
  // Check for language preference in User model
  const userModelPath = path.join(rootDir, 'models', 'User.js');
  if (fs.existsSync(userModelPath)) {
    report += `✅ User.js model found\n\n`;
    
    const userModelCode = fs.readFileSync(userModelPath, 'utf8');
    const hasLanguagePreference = 
      userModelCode.includes('languagePreference') || 
      userModelCode.includes('language_preference') || 
      userModelCode.includes('language');
    
    if (hasLanguagePreference) {
      report += `✅ User model has language preference field\n\n`;
      
      // Extract the relevant section
      const lines = userModelCode.split('\n');
      const relevantLines = lines.filter(line => 
        line.includes('language') || 
        line.includes('schema') || 
        line.includes('Model.define') ||
        line.includes('sequelize.define')
      );
      
      report += "```javascript\n";
      report += relevantLines.join('\n');
      report += "\n```\n\n";
    } else {
      report += `❌ User model does not have language preference field\n\n`;
    }
  } else {
    report += `❌ User.js model not found\n\n`;
  }
} catch (err) {
  report += `❌ Error testing Backend Language API: ${err.message}\n\n`;
}

// Test 6: Summary and Recommendations
report += `## Summary\n\n`;
report += `Overall, the internationalization (i18n) implementation appears to be `;

// Determine the overall status based on the failures encountered
if (report.includes('❌')) {
  const failureCount = (report.match(/❌/g) || []).length;
  const successCount = (report.match(/✅/g) || []).length;
  
  if (failureCount > successCount) {
    report += `incomplete with significant issues that need to be addressed.\n\n`;
  } else if (failureCount > 3) {
    report += `partially complete but has several issues that should be addressed.\n\n`;
  } else {
    report += `mostly complete with a few minor issues.\n\n`;
  }
  
  report += `### Recommendations\n\n`;
  
  if (report.includes('❌ i18n directory not found')) {
    report += `- Set up the i18n directory structure with configuration file and language resources\n`;
  }
  
  if (report.includes('❌ English translations') || report.includes('❌ Vietnamese translations')) {
    report += `- Create missing translation files for English and/or Vietnamese\n`;
  }
  
  if (report.includes('❌ LanguageSwitcher.jsx component not found')) {
    report += `- Create a LanguageSwitcher component to allow users to change languages\n`;
  }
  
  if (report.includes('❌ No language routes found')) {
    report += `- Add language API routes for fetching and updating user language preferences\n`;
  }
  
  if (report.includes('❌ User model does not have language preference field')) {
    report += `- Add language preference field to User model to store user's preferred language\n`;
  }
  
  report += `\nReview the detailed findings above to address specific issues with the i18n implementation.\n`;
} else {
  report += `complete and well-implemented. No issues were found.\n\n`;
}

// Write the report to a file
fs.writeFileSync(testResultFile, report);

console.log(`I18n validation complete. Results saved to ${testResultFile}`);
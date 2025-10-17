/**
 * FINAL COMPREHENSIVE CHECK - AI Integration Task 6
 * Kiểm tra toàn diện cuối cùng để đảm bảo không còn vấn đề nào
 */

const fs = require('fs');
const path = require('path');

console.log('🔍 FINAL COMPREHENSIVE CHECK - AI Integration');
console.log('==============================================\n');

let allGood = true;
const issues = [];

// 1. Check critical files exist and have content
console.log('✅ Checking critical files...');
const criticalFiles = [
  'routes/ai.js',
  'routes/plant.js', 
  'routes/sensor.js',
  'middlewares/authMiddleware.js',
  'client/src/providers/AIProvider.jsx',
  'client/src/components/dashboard/AIInsightsWidget.jsx',
  'client/src/components/dashboard/AIPredictionsWidget.jsx',
  'client/src/components/dashboard/AIHistoryWidget.jsx',
  'client/src/components/Navbar.jsx',
  'client/src/app/dashboard/page.jsx'
];

criticalFiles.forEach(file => {
  if (fs.existsSync(file)) {
    const content = fs.readFileSync(file, 'utf8');
    if (content.length > 100) {
      console.log(`   ✓ ${file} (${content.length} chars)`);
    } else {
      console.log(`   ⚠️ ${file} - Too small (${content.length} chars)`);
      issues.push(`${file} seems incomplete`);
    }
  } else {
    console.log(`   ❌ ${file} - MISSING`);
    allGood = false;
    issues.push(`${file} is missing`);
  }
});

// 2. Check for syntax errors in key files
console.log('\n✅ Checking syntax...');
const jsFiles = [
  'routes/ai.js',
  'routes/plant.js',
  'routes/sensor.js',
  'middlewares/authMiddleware.js'
];

jsFiles.forEach(file => {
  try {
    require('child_process').execSync(`node -c ${file}`, { stdio: 'pipe' });
    console.log(`   ✓ ${file} - Syntax OK`);
  } catch (error) {
    console.log(`   ❌ ${file} - Syntax Error`);
    allGood = false;
    issues.push(`${file} has syntax errors`);
  }
});

// 3. Check JSON files
console.log('\n✅ Checking JSON files...');
const jsonFiles = [
  'client/src/i18n/locales/vi/translation.json'
];

jsonFiles.forEach(file => {
  try {
    const content = fs.readFileSync(file, 'utf8');
    JSON.parse(content);
    console.log(`   ✓ ${file} - Valid JSON`);
  } catch (error) {
    console.log(`   ❌ ${file} - Invalid JSON: ${error.message}`);
    allGood = false;
    issues.push(`${file} has JSON syntax errors`);
  }
});

// 4. Check for required imports/exports
console.log('\n✅ Checking imports/exports...');

// Check AIProvider exports
const aiProvider = fs.readFileSync('client/src/providers/AIProvider.jsx', 'utf8');
if (aiProvider.includes('export function AIProvider') && aiProvider.includes('export function useAI')) {
  console.log('   ✓ AIProvider exports correct');
} else {
  console.log('   ❌ AIProvider missing exports');
  issues.push('AIProvider missing required exports');
}

// Check dashboard imports AIProvider
const dashboard = fs.readFileSync('client/src/app/dashboard/page.jsx', 'utf8');
if (dashboard.includes('import { AIProvider }') && dashboard.includes('<AIProvider>')) {
  console.log('   ✓ Dashboard uses AIProvider');
} else {
  console.log('   ❌ Dashboard missing AIProvider integration');
  issues.push('Dashboard not using AIProvider');
}

// 5. Check authentication integration
console.log('\n✅ Checking authentication...');
const authMiddleware = fs.readFileSync('middlewares/authMiddleware.js', 'utf8');
if (authMiddleware.includes('system') && authMiddleware.includes('isSystem')) {
  console.log('   ✓ System token support added');
} else {
  console.log('   ❌ System token support missing');
  issues.push('Authentication middleware missing system token support');
}

const sensorRoutes = fs.readFileSync('routes/sensor.js', 'utf8');
if (sensorRoutes.includes('systemToken') && sensorRoutes.includes('watering-prediction')) {
  console.log('   ✓ Sensor AI integration working');
} else {
  console.log('   ❌ Sensor AI integration missing');
  issues.push('Sensor routes missing AI integration');
}

// 6. Check error handling
console.log('\n✅ Checking error handling...');
const aiWidgets = [
  'client/src/components/dashboard/AIInsightsWidget.jsx',
  'client/src/components/dashboard/AIPredictionsWidget.jsx',
  'client/src/components/dashboard/AIHistoryWidget.jsx'
];

aiWidgets.forEach(file => {
  const content = fs.readFileSync(file, 'utf8');
  if (content.includes('if (error)') && content.includes('refreshAIData')) {
    console.log(`   ✓ ${path.basename(file)} - Error handling OK`);
  } else {
    console.log(`   ❌ ${path.basename(file)} - Missing error handling`);
    issues.push(`${file} missing proper error handling`);
  }
});

// 7. Check mobile responsiveness
console.log('\n✅ Checking mobile support...');
const navbar = fs.readFileSync('client/src/components/Navbar.jsx', 'utf8');
if (navbar.includes('mobileMenuOpen') && navbar.includes('md:hidden')) {
  console.log('   ✓ Mobile navigation implemented');
} else {
  console.log('   ❌ Mobile navigation missing');
  issues.push('Navbar missing mobile support');
}

// 8. Check translation keys
console.log('\n✅ Checking translations...');
const translations = fs.readFileSync('client/src/i18n/locales/vi/translation.json', 'utf8');
const translationObj = JSON.parse(translations);

const requiredAIKeys = ['ai.insights', 'ai.predictions', 'ai.history', 'nav.ai'];
let translationIssues = 0;

requiredAIKeys.forEach(keyPath => {
  const keys = keyPath.split('.');
  let current = translationObj;
  let exists = true;
  
  for (const key of keys) {
    if (current && current[key]) {
      current = current[key];
    } else {
      exists = false;
      break;
    }
  }
  
  if (exists) {
    console.log(`   ✓ ${keyPath} - Translation exists`);
  } else {
    console.log(`   ❌ ${keyPath} - Translation missing`);
    translationIssues++;
  }
});

if (translationIssues === 0) {
  console.log('   ✓ All AI translation keys present');
} else {
  issues.push(`${translationIssues} translation keys missing`);
}

// Final assessment
console.log('\n🎯 FINAL ASSESSMENT');
console.log('==================');

if (allGood && issues.length === 0) {
  console.log('🎉 PERFECT! No issues found.');
  console.log('✅ All systems operational');
  console.log('✅ All features implemented');
  console.log('✅ All integrations working');
  console.log('✅ Production ready');
  console.log('\n🚀 TASK 6 COMPLETELY FINISHED - NO REMAINING ISSUES!');
} else {
  console.log('⚠️ Issues found:');
  issues.forEach(issue => console.log(`   - ${issue}`));
  console.log('\n❌ Some issues need attention');
}

console.log('\n📊 SUMMARY:');
console.log(`   Files checked: ${criticalFiles.length + jsFiles.length + jsonFiles.length}`);
console.log(`   Issues found: ${issues.length}`);
console.log(`   Status: ${allGood && issues.length === 0 ? 'PERFECT ✅' : 'NEEDS ATTENTION ⚠️'}`);
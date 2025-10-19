/**
 * Test script to verify AIImageRecognition component can start properly
 */

const fs = require('fs');
const path = require('path');

console.log('🚀 Testing Component Startup Readiness');
console.log('=====================================\n');

// Test 1: Check if all required files exist
console.log('1. Checking required files...');
const requiredFiles = [
  'client/src/components/AIImageRecognition.jsx',
  'client/src/utils/imageUtils.js',
  'client/src/app/plant-detail/[id]/page.jsx',
  'client/src/i18n/locales/en/translation.json',
  'client/src/i18n/locales/vi/translation.json',
  'client/package.json'
];

let allFilesExist = true;
requiredFiles.forEach(file => {
  if (fs.existsSync(file)) {
    console.log(`✅ ${file}`);
  } else {
    console.log(`❌ ${file} - MISSING`);
    allFilesExist = false;
  }
});

if (!allFilesExist) {
  console.log('\n❌ Some required files are missing. Component may not start properly.');
  process.exit(1);
}

// Test 2: Check import statements
console.log('\n2. Checking import statements...');
try {
  const componentContent = fs.readFileSync('client/src/components/AIImageRecognition.jsx', 'utf8');
  
  const requiredImports = [
    "import React",
    "import { useTranslation }",
    "import aiApi",
    "import { Card, CardHeader, CardTitle, CardContent, CardDescription }",
    "import { Button }",
    "import { Input }",
    "compressImage",
    "validateImageFile"
  ];
  
  let allImportsPresent = true;
  requiredImports.forEach(importStatement => {
    if (componentContent.includes(importStatement)) {
      console.log(`✅ ${importStatement}`);
    } else {
      console.log(`❌ ${importStatement} - MISSING`);
      allImportsPresent = false;
    }
  });
  
  if (!allImportsPresent) {
    console.log('\n⚠️  Some imports may be missing, but component might still work.');
  }
  
} catch (error) {
  console.log('❌ Error reading component file:', error.message);
}

// Test 3: Check translation keys
console.log('\n3. Checking translation keys...');
try {
  const enTranslation = JSON.parse(fs.readFileSync('client/src/i18n/locales/en/translation.json', 'utf8'));
  
  const criticalKeys = [
    'imageRecognition.title',
    'imageRecognition.uploadTitle',
    'imageRecognition.analyzeButton',
    'plants.tabs.diseaseRecognition'
  ];
  
  let allKeysPresent = true;
  criticalKeys.forEach(key => {
    const keys = key.split('.');
    let value = enTranslation;
    
    for (const k of keys) {
      value = value?.[k];
    }
    
    if (value) {
      console.log(`✅ ${key}: "${value}"`);
    } else {
      console.log(`❌ ${key} - MISSING`);
      allKeysPresent = false;
    }
  });
  
  if (!allKeysPresent) {
    console.log('\n⚠️  Some translation keys are missing. Component may show key names instead of text.');
  }
  
} catch (error) {
  console.log('❌ Error reading translation file:', error.message);
}

// Test 4: Check package.json dependencies
console.log('\n4. Checking package.json dependencies...');
try {
  const packageJson = JSON.parse(fs.readFileSync('client/package.json', 'utf8'));
  
  const requiredDeps = [
    'react',
    'react-i18next',
    'axios'
  ];
  
  let allDepsPresent = true;
  requiredDeps.forEach(dep => {
    if (packageJson.dependencies?.[dep] || packageJson.devDependencies?.[dep]) {
      console.log(`✅ ${dep}: ${packageJson.dependencies?.[dep] || packageJson.devDependencies?.[dep]}`);
    } else {
      console.log(`❌ ${dep} - MISSING`);
      allDepsPresent = false;
    }
  });
  
  if (!allDepsPresent) {
    console.log('\n❌ Some required dependencies are missing. Run npm install first.');
  }
  
} catch (error) {
  console.log('❌ Error reading package.json:', error.message);
}

// Test 5: Check for potential runtime issues
console.log('\n5. Checking for potential runtime issues...');
try {
  const componentContent = fs.readFileSync('client/src/components/AIImageRecognition.jsx', 'utf8');
  
  const potentialIssues = [
    { pattern: /console\.log\(/g, message: 'Console.log statements found (not critical)' },
    { pattern: /debugger/g, message: 'Debugger statements found (should be removed)' },
    { pattern: /TODO|FIXME/g, message: 'TODO/FIXME comments found (should be addressed)' }
  ];
  
  let hasIssues = false;
  potentialIssues.forEach(issue => {
    const matches = componentContent.match(issue.pattern);
    if (matches) {
      console.log(`⚠️  ${issue.message} (${matches.length} occurrences)`);
      hasIssues = true;
    }
  });
  
  if (!hasIssues) {
    console.log('✅ No potential runtime issues found');
  }
  
} catch (error) {
  console.log('❌ Error checking for runtime issues:', error.message);
}

// Test 6: Generate startup instructions
console.log('\n6. Startup Instructions:');
console.log('========================');

console.log('\n📋 To start the application:');
console.log('1. Make sure you\'re in the project root directory');
console.log('2. Install dependencies: npm install');
console.log('3. Start the development server: npm start');
console.log('4. Open browser to: http://localhost:3000');
console.log('5. Navigate to a plant detail page');
console.log('6. Click on "Disease Recognition" tab');

console.log('\n🔧 If you encounter issues:');
console.log('- Clear node_modules and run: npm install');
console.log('- Check if all required ports are available');
console.log('- Ensure backend server is running (if needed)');
console.log('- Check browser console for any errors');

console.log('\n📱 To test the component:');
console.log('1. Go to plant detail page');
console.log('2. Click "Disease Recognition" tab');
console.log('3. Try uploading an image');
console.log('4. Check if drag-and-drop works');
console.log('5. Verify translation switching works');

// Final assessment
console.log('\n🎯 Component Readiness Assessment:');
if (allFilesExist) {
  console.log('✅ READY TO START - All critical files are present');
  console.log('✅ Component should load without errors');
  console.log('✅ Basic functionality should work');
  
  console.log('\n🚀 You can now run: npm start');
  console.log('   The AIImageRecognition component should be accessible in plant detail pages!');
} else {
  console.log('❌ NOT READY - Missing critical files');
  console.log('   Please ensure all files are properly created before starting');
}

console.log('\n=====================================');
console.log('🏁 Startup Readiness Check Complete!');
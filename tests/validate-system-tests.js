/**
 * System Test Validation Script
 * Validates that all system test components are properly implemented
 * Requirements: 4.1, 4.2, 4.3
 */

const fs = require('fs');
const path = require('path');

const REQUIRED_FILES = [
  'comprehensive-system-test.js',
  'load-test-runner.js',
  'performance-monitor.js',
  'memory-usage-monitor.js',
  'user-acceptance-test.js',
  'run-comprehensive-system-tests.js',
  'COMPREHENSIVE_SYSTEM_TESTING_GUIDE.md'
];

const REQUIRED_FUNCTIONS = {
  'comprehensive-system-test.js': ['ComprehensiveSystemTester'],
  'load-test-runner.js': ['LoadTestRunner'],
  'performance-monitor.js': ['PerformanceMonitor'],
  'memory-usage-monitor.js': ['MemoryUsageMonitor'],
  'user-acceptance-test.js': ['UserAcceptanceTester'],
  'run-comprehensive-system-tests.js': ['ComprehensiveSystemTestRunner']
};

class SystemTestValidator {
  constructor() {
    this.results = {
      filesValidated: 0,
      functionsValidated: 0,
      errors: [],
      warnings: []
    };
  }

  async validateSystemTests() {
    console.log('🔍 Validating Comprehensive System Testing Implementation...\n');

    // Check required files exist
    this.validateRequiredFiles();

    // Check function exports
    this.validateFunctionExports();

    // Check package.json scripts
    this.validatePackageScripts();

    // Generate validation report
    this.generateValidationReport();
  }

  validateRequiredFiles() {
    console.log('📁 Checking required files...');

    for (const fileName of REQUIRED_FILES) {
      const filePath = path.join(__dirname, fileName);
      
      if (fs.existsSync(filePath)) {
        console.log(`   ✅ ${fileName}`);
        this.results.filesValidated++;
      } else {
        console.log(`   ❌ ${fileName} - Missing`);
        this.results.errors.push(`Missing required file: ${fileName}`);
      }
    }

    console.log(`\n📊 Files validated: ${this.results.filesValidated}/${REQUIRED_FILES.length}\n`);
  }

  validateFunctionExports() {
    console.log('🔧 Checking function exports...');

    for (const [fileName, requiredFunctions] of Object.entries(REQUIRED_FUNCTIONS)) {
      const filePath = path.join(__dirname, fileName);
      
      if (!fs.existsSync(filePath)) {
        continue; // Already reported as missing file
      }

      try {
        const fileContent = fs.readFileSync(filePath, 'utf8');
        
        for (const functionName of requiredFunctions) {
          if (fileContent.includes(`class ${functionName}`) || 
              fileContent.includes(`function ${functionName}`) ||
              fileContent.includes(`const ${functionName}`)) {
            console.log(`   ✅ ${fileName} - ${functionName}`);
            this.results.functionsValidated++;
          } else {
            console.log(`   ❌ ${fileName} - ${functionName} not found`);
            this.results.errors.push(`Missing function ${functionName} in ${fileName}`);
          }
        }
      } catch (error) {
        console.log(`   ❌ ${fileName} - Error reading file: ${error.message}`);
        this.results.errors.push(`Error reading ${fileName}: ${error.message}`);
      }
    }

    const totalExpectedFunctions = Object.values(REQUIRED_FUNCTIONS).flat().length;
    console.log(`\n📊 Functions validated: ${this.results.functionsValidated}/${totalExpectedFunctions}\n`);
  }

  validatePackageScripts() {
    console.log('📦 Checking package.json scripts...');

    const packageJsonPath = path.join(__dirname, '..', 'package.json');
    
    if (!fs.existsSync(packageJsonPath)) {
      console.log('   ❌ package.json not found');
      this.results.errors.push('package.json not found');
      return;
    }

    try {
      const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
      const scripts = packageJson.scripts || {};

      const requiredScripts = [
        'test:system',
        'test:system:load',
        'test:system:performance',
        'test:system:memory',
        'test:system:uat',
        'test:system:comprehensive'
      ];

      for (const scriptName of requiredScripts) {
        if (scripts[scriptName]) {
          console.log(`   ✅ ${scriptName}`);
        } else {
          console.log(`   ❌ ${scriptName} - Missing`);
          this.results.errors.push(`Missing npm script: ${scriptName}`);
        }
      }

    } catch (error) {
      console.log(`   ❌ Error reading package.json: ${error.message}`);
      this.results.errors.push(`Error reading package.json: ${error.message}`);
    }

    console.log('');
  }

  generateValidationReport() {
    console.log('📋 Validation Summary');
    console.log('=' .repeat(50));

    if (this.results.errors.length === 0) {
      console.log('🎉 All system test components are properly implemented!');
      console.log(`✅ Files: ${this.results.filesValidated}/${REQUIRED_FILES.length}`);
      console.log(`✅ Functions: ${this.results.functionsValidated}`);
      console.log('\n🚀 Ready to run comprehensive system tests:');
      console.log('   npm run test:system');
    } else {
      console.log('❌ Validation failed with the following issues:');
      this.results.errors.forEach(error => {
        console.log(`   • ${error}`);
      });
      
      if (this.results.warnings.length > 0) {
        console.log('\n⚠️ Warnings:');
        this.results.warnings.forEach(warning => {
          console.log(`   • ${warning}`);
        });
      }
    }

    console.log('\n📄 Available test commands:');
    console.log('   npm run test:system                 - Run all system tests');
    console.log('   npm run test:system:load            - Load testing only');
    console.log('   npm run test:system:performance     - Performance monitoring only');
    console.log('   npm run test:system:memory          - Memory usage monitoring only');
    console.log('   npm run test:system:uat             - User acceptance testing only');
    console.log('   npm run test:system:comprehensive   - Comprehensive test suite only');

    console.log('\n📚 Documentation:');
    console.log('   tests/COMPREHENSIVE_SYSTEM_TESTING_GUIDE.md');

    return this.results.errors.length === 0;
  }
}

// Main execution
async function validateSystemTests() {
  const validator = new SystemTestValidator();
  const isValid = await validator.validateSystemTests();
  
  process.exit(isValid ? 0 : 1);
}

// Run validation if called directly
if (require.main === module) {
  validateSystemTests();
}

module.exports = { SystemTestValidator };
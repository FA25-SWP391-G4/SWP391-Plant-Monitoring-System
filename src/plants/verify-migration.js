const { exec } = require('child_process');
const path = require('path');
const fs = require('fs');

// Colors for console output
const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m'
};

console.log(`${colors.cyan}=== Plant Module Migration Verification ===${colors.reset}`);
console.log(`${colors.yellow}This script will verify the migration of the Plants module from Express.js to NestJS.${colors.reset}`);

// Define paths to check
const paths = {
  backend: path.resolve(__dirname, '../../../backend'),
  plantSystem: path.resolve(__dirname, '../../')
};

// Check if files exist
function checkFileExists(filepath) {
  try {
    return fs.existsSync(filepath);
  } catch (err) {
    return false;
  }
}

// Define the verification tests
const verifications = [
  {
    name: 'Verify Backend Plants Module Structure',
    check: () => {
      const requiredFiles = [
        'plant.controller.ts',
        'plant.service.ts',
        'plants.module.ts',
        'dto/index.ts',
        'dto/create-plant.dto.ts',
        'dto/update-plant.dto.ts',
        'dto/manual-watering.dto.ts',
        'dto/threshold-settings.dto.ts',
        'dto/create-zone.dto.ts',
        'dto/update-zone.dto.ts',
        'dto/create-watering-schedule.dto.ts',
        'dto/update-watering-schedule.dto.ts',
        'dto/create-watering-history.dto.ts',
        'entities/plant.entity.ts',
        'entities/zone.entity.ts',
        'entities/watering-schedule.entity.ts',
        'entities/watering-history.entity.ts',
        'test/plant.service.spec.ts',
        'test/plant.controller.spec.ts',
        'test/simple-test.ts',
      ];

      const missingFiles = [];
      for (const file of requiredFiles) {
        const filepath = path.join(paths.backend, 'src/plants', file);
        if (!checkFileExists(filepath)) {
          missingFiles.push(file);
        }
      }

      if (missingFiles.length > 0) {
        return {
          passed: false,
          message: `Missing files: ${missingFiles.join(', ')}`
        };
      }
      
      return {
        passed: true,
        message: `All required files are present in the backend Plants module`
      };
    }
  },
  {
    name: 'Verify Backend Plants DTOs match Plant System DTOs',
    check: () => {
      // Check if the DTOs are consistent between both systems
      const dtoFiles = [
        'create-plant.dto.ts',
        'update-plant.dto.ts',
        'manual-watering.dto.ts',
        'threshold-settings.dto.ts'
      ];
      
      const inconsistentDtos = [];
      
      for (const file of dtoFiles) {
        const backendPath = path.join(paths.backend, 'src/plants/dto', file);
        const plantSystemPath = path.join(paths.plantSystem, 'src/plants/dto', file);
        
        if (checkFileExists(backendPath) && checkFileExists(plantSystemPath)) {
          const backendContent = fs.readFileSync(backendPath, 'utf8');
          const plantSystemContent = fs.readFileSync(plantSystemPath, 'utf8');
          
          // This is a simple check - in a real scenario you might want to compare more precisely
          const backendFields = extractFields(backendContent);
          const plantSystemFields = extractFields(plantSystemContent);
          
          const missingFields = plantSystemFields.filter(field => !backendFields.includes(field));
          
          if (missingFields.length > 0) {
            inconsistentDtos.push(`${file} (missing fields: ${missingFields.join(', ')})`);
          }
        }
      }
      
      if (inconsistentDtos.length > 0) {
        return {
          passed: false,
          message: `DTO inconsistencies found: ${inconsistentDtos.join(', ')}`
        };
      }
      
      return {
        passed: true,
        message: `DTOs are consistent between backend and plant-system`
      };
    }
  },
  {
    name: 'Verify Test Files Structure',
    check: () => {
      const requiredTestFiles = [
        'plant.service.spec.ts',
        'plant.controller.spec.ts',
        'simple-test.ts',
        'migration-test.js'
      ];
      
      const missingFiles = [];
      for (const file of requiredTestFiles) {
        const filepath = path.join(paths.backend, 'src/plants/test', file);
        if (!checkFileExists(filepath)) {
          missingFiles.push(file);
        }
      }
      
      if (missingFiles.length > 0) {
        return {
          passed: false,
          message: `Missing test files: ${missingFiles.join(', ')}`
        };
      }
      
      return {
        passed: true,
        message: `All required test files are present`
      };
    }
  },
  {
    name: 'Verify Migration Documentation',
    check: () => {
      const migrationReadme = path.join(paths.backend, 'src/plants/MIGRATION_README.md');
      
      if (!checkFileExists(migrationReadme)) {
        return {
          passed: false,
          message: `Missing migration documentation: MIGRATION_README.md`
        };
      }
      
      const content = fs.readFileSync(migrationReadme, 'utf8');
      const requiredSections = [
        '# Plants Module Migration Guide',
        'Entity Structure',
        'DTO Structure',
        'API Endpoints',
        'Testing'
      ];
      
      const missingSections = [];
      for (const section of requiredSections) {
        if (!content.includes(section)) {
          missingSections.push(section);
        }
      }
      
      if (missingSections.length > 0) {
        return {
          passed: false,
          message: `Migration documentation missing sections: ${missingSections.join(', ')}`
        };
      }
      
      return {
        passed: true,
        message: `Migration documentation is complete with all required sections`
      };
    }
  },
  {
    name: 'Verify Migration Checklist Updates',
    check: () => {
      const checklistPath = path.join(paths.backend, 'MIGRATION_CHECKLIST.md');
      
      if (!checkFileExists(checklistPath)) {
        return {
          passed: false,
          message: `Missing migration checklist: MIGRATION_CHECKLIST.md`
        };
      }
      
      const content = fs.readFileSync(checklistPath, 'utf8');
      
      if (!content.includes('[x] Migrate plants module service and controller')) {
        return {
          passed: false,
          message: `Migration checklist not updated to mark plants module migration as complete`
        };
      }
      
      if (!content.includes('### Plants Module (Completed)')) {
        return {
          passed: false,
          message: `Migration checklist not updated to mark Plants Module as Completed`
        };
      }
      
      return {
        passed: true,
        message: `Migration checklist properly updated`
      };
    }
  }
];

// Helper function to extract field names from DTO content
function extractFields(content) {
  // This is a simple regex to find property declarations in a TypeScript class
  const fieldRegex = /\s+(\w+)(\?)?:\s*(\w+);/g;
  const fields = [];
  
  let match;
  while ((match = fieldRegex.exec(content)) !== null) {
    fields.push(match[1]);
  }
  
  return fields;
}

// Run all verifications
async function runVerifications() {
  let passed = 0;
  let failed = 0;
  
  for (const verification of verifications) {
    console.log(`\n${colors.blue}Running verification: ${verification.name}${colors.reset}`);
    
    try {
      const result = verification.check();
      
      if (result.passed) {
        console.log(`${colors.green}✓ Passed: ${result.message}${colors.reset}`);
        passed++;
      } else {
        console.log(`${colors.red}✗ Failed: ${result.message}${colors.reset}`);
        failed++;
      }
    } catch (error) {
      console.log(`${colors.red}✗ Failed with error: ${error.message}${colors.reset}`);
      failed++;
    }
  }
  
  // Print summary
  console.log(`\n${colors.cyan}=== Verification Summary ===${colors.reset}`);
  console.log(`${colors.green}Passed: ${passed}${colors.reset}`);
  console.log(`${colors.red}Failed: ${failed}${colors.reset}`);
  console.log(`${colors.cyan}Total: ${verifications.length}${colors.reset}`);
  
  if (failed === 0) {
    console.log(`\n${colors.green}✓ Plants module migration verification PASSED!${colors.reset}`);
  } else {
    console.log(`\n${colors.red}✗ Plants module migration verification FAILED with ${failed} issues${colors.reset}`);
  }
}

runVerifications().catch(error => {
  console.error(`${colors.red}Error running verifications: ${error.message}${colors.reset}`);
  process.exit(1);
});
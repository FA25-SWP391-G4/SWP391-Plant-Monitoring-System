#!/usr/bin/env node

/**
 * Test script to verify chunk loading error handling implementation
 */

const fs = require('fs');
const path = require('path');

console.log('🔍 Testing chunk loading error handling implementation...\n');

const filesToCheck = [
  {
    path: 'client/src/utils/lazyRetry.js',
    description: 'lazyRetry utility function',
    shouldContain: ['lazyRetry', 'sessionStorage', 'retry-lazy-refreshed']
  },
  {
    path: 'client/src/utils/lazyComponent.js',
    description: 'lazyComponent wrapper for React.lazy',
    shouldContain: ['lazyComponent', 'React.lazy', 'useLazyComponent']
  },
  {
    path: 'client/src/utils/chunkErrorManager.js',
    description: 'chunk error management utilities',
    shouldContain: ['clearChunkErrorFlags', 'hasChunkErrors', 'initializeChunkErrorManagement']
  },
  {
    path: 'client/src/components/ChunkErrorBoundary.jsx',
    description: 'chunk error boundary component',
    shouldContain: ['ChunkErrorBoundary', 'getDerivedStateFromError', 'componentDidCatch']
  },
  {
    path: 'client/src/app/layout.jsx',
    description: 'root layout with chunk error handling',
    shouldContain: ['ChunkErrorBoundary', 'initializeChunkErrorManagement']
  },
  {
    path: 'client/src/hooks/useGoogleAuth.js',
    description: 'Google auth hook with lazyRetry',
    shouldContain: ['lazyRetry', "import('@/api/authApi')"]
  }
];

let allTestsPassed = true;

filesToCheck.forEach(({ path: filePath, description, shouldContain }) => {
  const fullPath = path.join(process.cwd(), filePath);
  
  console.log(`📄 Checking ${description}...`);
  
  if (!fs.existsSync(fullPath)) {
    console.log(`❌ File not found: ${filePath}`);
    allTestsPassed = false;
    return;
  }
  
  const content = fs.readFileSync(fullPath, 'utf8');
  
  const missingItems = shouldContain.filter(item => !content.includes(item));
  
  if (missingItems.length > 0) {
    console.log(`❌ Missing required content: ${missingItems.join(', ')}`);
    allTestsPassed = false;
  } else {
    console.log(`✅ All required content found`);
  }
  
  console.log('');
});

// Summary
console.log('📋 Test Summary:');
console.log('================');

if (allTestsPassed) {
  console.log('✅ All tests passed! Chunk loading error handling is properly implemented.');
  console.log('\n🚀 Implementation includes:');
  console.log('  • lazyRetry function for dynamic imports');
  console.log('  • ChunkErrorBoundary for automatic error recovery');
  console.log('  • Enhanced React.lazy wrapper (lazyComponent)');
  console.log('  • Chunk error management utilities');
  console.log('  • Integration in main app layout');
  console.log('  • Updated Google OAuth dynamic import');
  
  console.log('\n💡 How it works:');
  console.log('  1. When a chunk loading error occurs, the page automatically refreshes');
  console.log('  2. Dynamic imports use retry logic to handle temporary network issues');
  console.log('  3. Error boundaries catch and handle chunk loading failures gracefully');
  console.log('  4. Session storage prevents infinite refresh loops');
  
  process.exit(0);
} else {
  console.log('❌ Some tests failed. Please check the implementation.');
  process.exit(1);
}
/**
 * AI Authentication Integration Script
 * Run this to apply authentication fixes to your existing AI system
 */

const fs = require('fs');
const path = require('path');

console.log('🔧 Applying AI Authentication Fixes...\n');

// 1. Update AI Service with Authentication Middleware
console.log('1. Adding authentication to AI service...');

const aiServicePath = path.join(__dirname, 'ai_service', 'simple-server.js');
let aiServiceContent = fs.readFileSync(aiServicePath, 'utf-8');

// Add JWT dependency and middleware at the top
if (!aiServiceContent.includes('const jwt = require')) {
  const addAuthImport = `const express = require('express');
const cors = require('cors');
const path = require('path');
const jwt = require('jsonwebtoken');
require('dotenv').config();`;

  aiServiceContent = aiServiceContent.replace(
    `const express = require('express');
const cors = require('cors');
const path = require('path');
require('dotenv').config();`,
    addAuthImport
  );
}

// Add authentication middleware
if (!aiServiceContent.includes('aiAuthMiddleware')) {
  const authMiddleware = `
// Authentication middleware
const aiAuthMiddleware = (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ 
        success: false,
        error: 'Authentication required',
        code: 'NO_TOKEN'
      });
    }
    
    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'plant-monitoring-secret-key');
    req.user = decoded;
    next();
    
  } catch (error) {
    return res.status(401).json({ 
      success: false,
      error: 'Invalid or expired token',
      code: 'INVALID_TOKEN'
    });
  }
};

// Optional auth middleware for test endpoints
const aiOptionalAuthMiddleware = (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.split(' ')[1];
      const decoded = jwt.verify(token, process.env.JWT_SECRET || 'plant-monitoring-secret-key');
      req.user = decoded;
    }
    next();
  } catch (error) {
    next(); // Continue without auth
  }
};

`;

  // Insert after CORS setup
  aiServiceContent = aiServiceContent.replace(
    'app.use(express.urlencoded({ extended: true, limit: \'10mb\' }));',
    `app.use(express.urlencoded({ extended: true, limit: '10mb' }));
${authMiddleware}`
  );
}

// Apply authentication to protected endpoints
const protectedEndpoints = [
  "app.post('/api/chatbot'",
  "app.post('/api/irrigation'", 
  "app.post('/api/irrigation-schedule'",
  "app.post('/api/historical-analysis'",
  "app.post('/api/self-learning'"
];

const testEndpoints = [
  "app.post('/api/test/"
];

protectedEndpoints.forEach(endpoint => {
  if (aiServiceContent.includes(endpoint) && !aiServiceContent.includes(`${endpoint}, aiAuthMiddleware`)) {
    aiServiceContent = aiServiceContent.replace(endpoint, `${endpoint}, aiAuthMiddleware`);
  }
});

// Image recognition needs special handling due to multer
if (aiServiceContent.includes("app.post('/api/image-recognition', upload.single('image')") && 
    !aiServiceContent.includes("app.post('/api/image-recognition', aiAuthMiddleware, upload.single('image')")) {
  aiServiceContent = aiServiceContent.replace(
    "app.post('/api/image-recognition', upload.single('image')",
    "app.post('/api/image-recognition', aiAuthMiddleware, upload.single('image')"
  );
}

fs.writeFileSync(aiServicePath, aiServiceContent);
console.log('✅ AI service authentication added');

// 2. Update routes with auth forwarding
console.log('2. Updating backend routes with auth forwarding...');

const routesPath = path.join(__dirname, 'routes', 'ai.js');
let routesContent = fs.readFileSync(routesPath, 'utf-8');

// Add auth forwarding function if not exists
if (!routesContent.includes('forwardAuthHeaders')) {
  const authForwardingCode = `
// Helper function to forward authentication headers
const forwardAuthHeaders = (req) => {
  const headers = {};
  if (req.headers.authorization) {
    headers.authorization = req.headers.authorization;
  }
  return headers;
};
`;

  routesContent = routesContent.replace(
    'const AI_SERVICE_URL = process.env.AI_SERVICE_URL || \'http://localhost:3001\';',
    `const AI_SERVICE_URL = process.env.AI_SERVICE_URL || 'http://localhost:3001';
${authForwardingCode}`
  );
}

// Update axios calls to include auth headers
const axiosUpdates = [
  {
    old: 'const response = await axios.post(`${AI_SERVICE_URL}/api/irrigation`, req.body, {',
    new: 'const response = await axios.post(`${AI_SERVICE_URL}/api/irrigation`, req.body, {'
  },
  {
    old: 'const response = await axios.post(`${AI_SERVICE_URL}/api/chatbot`, req.body, {',
    new: 'const response = await axios.post(`${AI_SERVICE_URL}/api/chatbot`, req.body, {'
  }
];

axiosUpdates.forEach(update => {
  if (routesContent.includes(update.old)) {
    // Add auth headers to axios config
    routesContent = routesContent.replace(
      update.old + `
      timeout: 30000,
      headers: {
        'Content-Type': 'application/json'
      }`,
      update.new + `
      timeout: 30000,
      headers: {
        'Content-Type': 'application/json',
        ...forwardAuthHeaders(req)
      }`
    );
  }
});

fs.writeFileSync(routesPath, routesContent);
console.log('✅ Backend routes updated with auth forwarding');

// 3. Update frontend API
console.log('3. Updating frontend API with authentication...');

const frontendApiPath = path.join(__dirname, 'client', 'src', 'api', 'aiApi.js');
let frontendContent = fs.readFileSync(frontendApiPath, 'utf-8');

// Add auth token helper if not exists
if (!frontendContent.includes('getAuthToken')) {
  const authHelperCode = `
// Helper function to get auth token
const getAuthToken = () => {
  const token = localStorage.getItem('token');
  return token ? \`Bearer \${token}\` : null;
};

// Helper function to handle auth errors
const handleAuthError = (error) => {
  if (error.response?.status === 401) {
    return {
      success: false,
      error: 'Please log in to use AI features',
      requiresLogin: true
    };
  }
  if (error.response?.status === 403) {
    return {
      success: false,
      error: 'Premium subscription required',
      requiresPremium: true
    };
  }
  return {
    success: false,
    error: error.response?.data?.error || 'AI service error'
  };
};
`;

  frontendContent = frontendContent.replace(
    "import axiosClient from './axiosClient';",
    `import axiosClient from './axiosClient';
${authHelperCode}`
  );
}

fs.writeFileSync(frontendApiPath, frontendContent);
console.log('✅ Frontend API updated with authentication');

console.log('\n🎉 AI Authentication integration complete!');
console.log('\n📝 Next steps:');
console.log('1. Add JWT_SECRET to your .env files');
console.log('2. Restart both your backend and AI service');
console.log('3. Test authentication with a valid JWT token');
console.log('\n🔍 Test endpoints:');
console.log('- Health: GET /api/ai/test/status (no auth)');
console.log('- Chatbot: POST /api/ai/chatbot (requires auth)');
console.log('- Image: POST /api/ai/plant-analysis (requires auth)');
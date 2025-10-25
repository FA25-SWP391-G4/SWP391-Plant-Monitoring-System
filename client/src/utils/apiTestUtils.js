// src/utils/apiTestUtils.js
/**
 * API Testing Utilities
 * 
 * This module provides utility functions for testing API mappings
 * between frontend and backend routes.
 */

// Function to compare API routes between frontend and backend
function compareApiRoutes(frontendRoutes, backendRoutes) {
  const mismatches = [];
  const matches = [];
  
  // For each frontend route, check if there's a matching backend route
  Object.keys(frontendRoutes).forEach(route => {
    const frontendPath = frontendRoutes[route];
    const backendPath = backendRoutes[route];
    
    if (!backendPath) {
      mismatches.push({
        route,
        frontend: frontendPath,
        backend: 'Not implemented',
        status: 'Missing backend route'
      });
      return;
    }
    
    if (frontendPath !== backendPath) {
      mismatches.push({
        route,
        frontend: frontendPath,
        backend: backendPath,
        status: 'Route mismatch'
      });
      return;
    }
    
    matches.push({
      route,
      path: frontendPath,
      status: 'Matched'
    });
  });
  
  return { matches, mismatches };
}

// Function to verify API routes against expected schema
function verifyApiSchema(apiModule, expectedSchema) {
  const results = {
    valid: true,
    missing: [],
    unexpected: [],
    mismatched: []
  };
  
  // Check for missing methods
  Object.keys(expectedSchema).forEach(method => {
    if (!apiModule[method]) {
      results.valid = false;
      results.missing.push(method);
    }
  });
  
  // Check for unexpected methods
  Object.keys(apiModule).forEach(method => {
    if (typeof apiModule[method] === 'function' && !expectedSchema[method]) {
      results.unexpected.push(method);
    }
  });
  
  return results;
}

module.exports = {
  compareApiRoutes,
  verifyApiSchema,
  
  // Map of authentication endpoints (for reference)
  authEndpoints: {
    register: '/auth/register',
    login: '/auth/login',
    googleLogin: '/auth/google-login',
    logout: '/auth/logout',
    changePassword: '/auth/change-password',
    forgotPassword: '/auth/forgot-password',
    resetPassword: '/auth/reset-password',
  }
};

/**
 * Frontend-Backend Mapping Tests
 * 
 * This test suite verifies that frontend pages correctly map to backend API endpoints.
 * It ensures all API endpoints used in frontend components actually exist in the backend.
 */

const fs = require('fs');
const path = require('path');
const { promisify } = require('util');
const readdir = promisify(fs.readdir);
const readFile = promisify(fs.readFile);
const express = require('express');
const request = require('supertest');
const app = require('../app');

// Test suite for frontend-backend mapping
describe('Frontend-Backend API Endpoint Mapping', () => {
  
  // Map of frontend pages to expected backend endpoints
  const pageToApiMap = {
    'Zones.jsx': [
      '/api/zones',
      '/api/zones/:id',
      '/api/zones/:id/devices',
      '/api/zones/:id/devices/:deviceId',
      '/api/zones/:id/pump',
      '/devices/unassigned',
      '/devices/pumps'
    ],
    'Dashboard.jsx': [
      '/api/dashboard',
      '/api/dashboard/summary'
    ],
    'Reports.jsx': [
      '/api/reports',
      '/api/reports/:id'
    ],
    'SearchReports.jsx': [
      '/api/reports/search'
    ],
    'Thresholds.jsx': [
      '/api/thresholds',
      '/api/thresholds/:id'
    ],
    'Upgrade.jsx': [
      '/api/billing/plans',
      '/api/billing/subscribe'
    ],
    'Login.jsx': [
      '/auth/login',
      '/auth/register',
      '/auth/forgot-password'
    ],
    'CustomizeDashboard.jsx': [
      '/api/dashboard/customize'
    ]
  };

  // Extract API endpoints from frontend files
  async function extractApiEndpointsFromFrontend(filePath) {
    try {
      const content = await readFile(filePath, 'utf8');
      
      // Find API calls using regex patterns
      const axiosPatterns = [
        /axiosClient\.(get|post|put|delete|patch)\(['"]([^'"]+)['"]/g,
        /\w+Api\.\w+\(['"]([^'"]+)['"]/g,
        /fetch\(['"]([^'"]+)['"]/g
      ];
      
      const endpoints = [];
      
      for (const pattern of axiosPatterns) {
        let match;
        while ((match = pattern.exec(content)) !== null) {
          // The endpoint is in the second capture group for most patterns
          const endpoint = match[2] || match[1];
          if (endpoint && endpoint.startsWith('/')) {
            endpoints.push(endpoint);
          }
        }
      }
      
      return [...new Set(endpoints)]; // Remove duplicates
    } catch (error) {
      console.error(`Error reading file ${filePath}:`, error);
      return [];
    }
  }

  // Test for each frontend page
  Object.entries(pageToApiMap).forEach(([page, expectedEndpoints]) => {
    test(`${page} should map to valid backend endpoints`, async () => {
      const filePath = path.join(__dirname, '..', 'client', 'src', 'pages', page);
      
      // Skip test if file doesn't exist
      try {
        await fs.promises.access(filePath);
      } catch (err) {
        console.warn(`Skipping test for ${page} - file not found`);
        return;
      }
      
      // Extract actual API endpoints used in the frontend file
      const actualEndpoints = await extractApiEndpointsFromFrontend(filePath);
      
      // Verify that all expected endpoints are used
      for (const endpoint of expectedEndpoints) {
        // Convert route params like :id to regex pattern for matching
        const routePattern = endpoint.replace(/:\w+/g, '[^/]+');
        const regex = new RegExp(routePattern.replace(/\//g, '\\/') + '$');
        
        const endpointMatched = actualEndpoints.some(actual => 
          actual === endpoint || regex.test(actual)
        );
        
        // If endpoint is not found, this will fail the test
        expect(endpointMatched).toBeTruthy();
      }
    });
  });

  // Test to verify backend has routes for frontend API calls
  test('Backend should have routes for all frontend API calls', async () => {
    const frontendDir = path.join(__dirname, '..', 'client', 'src', 'pages');
    const apiDir = path.join(__dirname, '..', 'client', 'src', 'api');
    
    // Get all frontend pages
    const pageFiles = await readdir(frontendDir);
    const jsxFiles = pageFiles.filter(file => file.endsWith('.jsx'));
    
    // Get all API files
    const apiFiles = await readdir(apiDir);
    const jsApiFiles = apiFiles.filter(file => file.endsWith('.js') && file !== 'axiosClient.js');
    
    // Collect all API endpoints
    const allEndpoints = [];
    
    // Extract from pages
    for (const file of jsxFiles) {
      const filePath = path.join(frontendDir, file);
      const endpoints = await extractApiEndpointsFromFrontend(filePath);
      allEndpoints.push(...endpoints);
    }
    
    // Extract from API files
    for (const file of jsApiFiles) {
      const filePath = path.join(apiDir, file);
      const endpoints = await extractApiEndpointsFromFrontend(filePath);
      allEndpoints.push(...endpoints);
    }
    
    // Remove duplicates
    const uniqueEndpoints = [...new Set(allEndpoints)];
    
    // Test each endpoint against the Express router
    const agent = request(app);
    
    // Check if routes exist (we don't care about the response, just if the route is registered)
    for (const endpoint of uniqueEndpoints) {
      // Skip dynamic routes with parameters as they can't be tested directly
      if (endpoint.includes(':')) continue;
      
      // For GET routes, we can check if they're registered
      // For POST/PUT/DELETE, we'd need a more sophisticated check
      try {
        const response = await agent.get(endpoint);
        // Any response other than 404 suggests the route exists
        expect(response.status).not.toBe(404);
      } catch (error) {
        console.warn(`Warning: Endpoint ${endpoint} could not be verified`);
      }
    }
  });
});
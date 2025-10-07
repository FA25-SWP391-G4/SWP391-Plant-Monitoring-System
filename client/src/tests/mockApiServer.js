// src/tests/mockApiServer.js
const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');

/**
 * This creates a mock API server that mimics the backend routes
 * for testing API mapping between frontend and backend.
 */
function createMockServer() {
  const app = express();
  
  // Middleware
  app.use(cors());
  app.use(bodyParser.json());
  
  // Track API calls
  const calls = [];
  
  // Middleware to log all API calls
  app.use((req, res, next) => {
    const call = {
      method: req.method,
      path: req.path,
      body: req.body,
      query: req.query,
      headers: req.headers,
      timestamp: new Date()
    };
    calls.push(call);
    next();
  });
  
  // Auth routes
  app.post('/auth/register', (req, res) => {
    res.json({ success: true, message: 'Registration successful' });
  });
  
  app.post('/auth/login', (req, res) => {
    res.json({ 
      success: true, 
      token: 'mock-token', 
      user: { id: 1, name: 'Mock User', email: req.body.email } 
    });
  });
  
  app.post('/auth/google-login', (req, res) => {
    res.json({ 
      success: true, 
      token: 'mock-google-token', 
      user: { id: 2, name: 'Google User', email: 'google@example.com' } 
    });
  });
  
  app.post('/auth/logout', (req, res) => {
    res.json({ success: true, message: 'Logout successful' });
  });
  
  app.put('/auth/change-password', (req, res) => {
    res.json({ success: true, message: 'Password changed successfully' });
  });
  
  app.post('/auth/forgot-password', (req, res) => {
    res.json({ success: true, message: 'Password reset email sent' });
  });
  
  app.post('/auth/reset-password', (req, res) => {
    res.json({ success: true, message: 'Password reset successful' });
  });
  
  // Helper methods for testing
  app.getCalls = () => [...calls];
  app.clearCalls = () => { calls.length = 0; };
  
  return app;
}

module.exports = { createMockServer };

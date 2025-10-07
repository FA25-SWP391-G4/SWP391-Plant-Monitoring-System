const express = require('express');
const path = require('path');
const cors = require('cors');
const bodyParser = require('body-parser');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, 'client/build')));

// Track API calls for verification
const apiCalls = [];

// Log all API calls
app.use((req, res, next) => {
  if (req.path.startsWith('/auth/')) {
    const call = {
      method: req.method,
      path: req.path,
      body: req.body,
      timestamp: new Date().toISOString()
    };
    
    console.log(`API CALL: ${req.method} ${req.path}`);
    apiCalls.push(call);
  }
  next();
});

// AUTH ROUTES
app.post('/auth/register', (req, res) => {
  console.log('Register request received:', req.body);
  res.json({ 
    success: true, 
    message: 'Registration successful! Please log in.' 
  });
});

app.post('/auth/login', (req, res) => {
  console.log('Login request received:', req.body);
  res.json({ 
    token: 'mock-jwt-token',
    user: {
      id: 1,
      email: req.body.email,
      full_name: req.body.email === 'premium@example.com' ? 'Premium User' : 'Test User',
      role: req.body.email === 'premium@example.com' ? 'Premium' : 'Regular'
    } 
  });
});

app.post('/auth/google-login', (req, res) => {
  console.log('Google login request received:', req.body);
  res.json({ 
    token: 'mock-google-jwt-token',
    user: {
      id: 2,
      email: 'google@example.com',
      full_name: 'Google User',
      role: 'Premium'
    } 
  });
});

app.post('/auth/logout', (req, res) => {
  console.log('Logout request received');
  res.json({ success: true, message: 'Logged out successfully' });
});

app.put('/auth/change-password', (req, res) => {
  console.log('Change password request received:', req.body);
  res.json({ success: true, message: 'Password changed successfully' });
});

app.post('/auth/forgot-password', (req, res) => {
  console.log('Forgot password request received:', req.body);
  res.json({ success: true, message: 'Password reset email sent' });
});

app.post('/auth/reset-password', (req, res) => {
  console.log('Reset password request received:', req.body);
  res.json({ success: true, message: 'Password reset successful' });
});

// API documentation endpoint
app.get('/api/docs', (req, res) => {
  res.json({
    apiVersion: '1.0.0',
    endpoints: [
      { method: 'POST', path: '/auth/register', description: 'Register a new user' },
      { method: 'POST', path: '/auth/login', description: 'Login with email and password' },
      { method: 'POST', path: '/auth/google-login', description: 'Login with Google' },
      { method: 'POST', path: '/auth/logout', description: 'Logout current user' },
      { method: 'PUT', path: '/auth/change-password', description: 'Change password for authenticated user' },
      { method: 'POST', path: '/auth/forgot-password', description: 'Request password reset email' },
      { method: 'POST', path: '/auth/reset-password', description: 'Reset password with token' },
    ],
    apiCalls: apiCalls
  });
});

// Handle all other routes
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'client/build/index.html'));
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT} for styling test`);
  console.log(`Open http://localhost:${PORT} in your browser to view the app`);
  console.log(`Use http://localhost:${PORT}/api/docs to view API documentation and logged calls`);
});

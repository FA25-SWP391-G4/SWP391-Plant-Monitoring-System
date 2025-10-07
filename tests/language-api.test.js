/**
 * Language API Tests
 * Tests for the language settings and preferences API
 */

const request = require('supertest');
const app = require('../app');
const { User } = require('../models');
const jwt = require('jsonwebtoken');

// Mock user for testing
const testUser = {
  id: 9999,
  email: 'language-test@example.com',
  name: 'Test User',
  role: 'Premium'
};

// Generate JWT token for authentication
const generateToken = (user) => {
  return jwt.sign(
    { id: user.id, email: user.email, role: user.role },
    process.env.JWT_SECRET || 'test-secret',
    { expiresIn: '1h' }
  );
};

describe('Language API Tests', () => {
  let token;
  
  beforeAll(async () => {
    // Create a test user or find if exists
    await User.upsert({
      id: testUser.id,
      email: testUser.email,
      name: testUser.name,
      role: testUser.role,
      password: 'hashedpassword',
      languagePreference: 'en'
    });
    
    // Generate token for authentication
    token = generateToken(testUser);
  });
  
  afterAll(async () => {
    // Clean up test user
    await User.destroy({ where: { id: testUser.id } });
  });
  
  // Test getting available languages (public endpoint)
  test('GET /api/language/available should return available languages', async () => {
    const response = await request(app)
      .get('/api/language/available');
    
    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('languages');
    expect(response.body.languages).toBeInstanceOf(Array);
    expect(response.body.languages.length).toBeGreaterThan(0);
    
    // Verify English and Vietnamese are available
    const languages = response.body.languages.map(lang => lang.code);
    expect(languages).toContain('en');
    expect(languages).toContain('vi');
  });
  
  // Test getting user language preferences (authenticated)
  test('GET /api/language/preferences should return user language preference', async () => {
    const response = await request(app)
      .get('/api/language/preferences')
      .set('Authorization', `Bearer ${token}`);
    
    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('language');
    expect(response.body.language).toBe('en'); // Default set in beforeAll
  });
  
  // Test updating user language preferences (authenticated)
  test('PUT /api/language/preferences should update user language preference', async () => {
    // Update to Vietnamese
    const updateResponse = await request(app)
      .put('/api/language/preferences')
      .set('Authorization', `Bearer ${token}`)
      .send({ language: 'vi' });
    
    expect(updateResponse.status).toBe(200);
    expect(updateResponse.body).toHaveProperty('message');
    expect(updateResponse.body).toHaveProperty('language');
    expect(updateResponse.body.language).toBe('vi');
    
    // Verify the update was saved
    const getResponse = await request(app)
      .get('/api/language/preferences')
      .set('Authorization', `Bearer ${token}`);
    
    expect(getResponse.status).toBe(200);
    expect(getResponse.body.language).toBe('vi');
    
    // Set back to English for cleanup
    await request(app)
      .put('/api/language/preferences')
      .set('Authorization', `Bearer ${token}`)
      .send({ language: 'en' });
  });
  
  // Test invalid language code
  test('PUT /api/language/preferences should reject invalid language code', async () => {
    const response = await request(app)
      .put('/api/language/preferences')
      .set('Authorization', `Bearer ${token}`)
      .send({ language: 'invalid-code' });
    
    expect(response.status).toBe(400);
    expect(response.body).toHaveProperty('message');
    expect(response.body.message).toContain('Invalid language code');
  });
  
  // Test authentication requirement
  test('Language API endpoints should require authentication', async () => {
    // Test preferences endpoint without token
    const getResponse = await request(app)
      .get('/api/language/preferences');
    
    expect(getResponse.status).toBe(401);
    
    // Test update endpoint without token
    const putResponse = await request(app)
      .put('/api/language/preferences')
      .send({ language: 'en' });
    
    expect(putResponse.status).toBe(401);
  });
});
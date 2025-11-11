const request = require('supertest');
const app = require('../../../../app');
const { pool } = require('../../../../config/db');

describe('Authentication API Integration Tests', () => {
  let server;
  let testUser = {
    email: 'integration.test@example.com',
    password: 'TestPassword123!',
    confirmPassword: 'TestPassword123!',
    full_name: 'Integration Test User'
  };

  beforeAll(async () => {
    // Start the server for testing
    server = app.listen(0); // Use random available port
    
    // Clean up any existing test user
    try {
      await pool.query('DELETE FROM users WHERE email = $1', [testUser.email]);
    } catch (error) {
      // Ignore if user doesn't exist
    }
  });

  afterAll(async () => {
    // Clean up test data
    try {
      await pool.query('DELETE FROM users WHERE email = $1', [testUser.email]);
    } catch (error) {
      console.error('Cleanup error:', error);
    }
    
    // Close server
    if (server) {
      server.close();
    }
  });

  describe('POST /auth/register', () => {
    test('should register a new user successfully', async () => {
      const response = await request(app)
        .post('/auth/register')
        .send(testUser)
        .expect(201);

      expect(response.body).toMatchObject({
        success: true,
        message: 'Registration successful'
      });

      expect(response.body.data).toHaveProperty('user_id');
      expect(response.body.data.email).toBe(testUser.email);
      expect(response.body.data.full_name).toBe(testUser.full_name);
      expect(response.body.data.role).toBe('Regular');
    });

    test('should reject registration with existing email', async () => {
      const response = await request(app)
        .post('/auth/register')
        .send(testUser)
        .expect(409);

      expect(response.body).toMatchObject({
        success: false,
        error: 'Email already registered'
      });
    });

    test('should validate required fields', async () => {
      const incompleteUser = {
        email: 'incomplete@test.com'
        // Missing password, confirmPassword, full_name
      };

      const response = await request(app)
        .post('/auth/register')
        .send(incompleteUser)
        .expect(400);

      expect(response.body).toMatchObject({
        success: false,
        error: expect.stringContaining('required')
      });
    });

    test('should validate email format', async () => {
      const invalidEmailUser = {
        ...testUser,
        email: 'invalid-email-format'
      };

      const response = await request(app)
        .post('/auth/register')
        .send(invalidEmailUser)
        .expect(400);

      expect(response.body).toMatchObject({
        success: false,
        error: expect.stringContaining('email')
      });
    });

    test('should validate password confirmation', async () => {
      const mismatchedPasswordUser = {
        ...testUser,
        email: 'mismatch@test.com',
        confirmPassword: 'DifferentPassword123!'
      };

      const response = await request(app)
        .post('/auth/register')
        .send(mismatchedPasswordUser)
        .expect(400);

      expect(response.body).toMatchObject({
        success: false,
        error: expect.stringContaining('password')
      });
    });
  });

  describe('POST /auth/login', () => {
    test('should login successfully with valid credentials', async () => {
      const loginCredentials = {
        email: testUser.email,
        password: testUser.password
      };

      const response = await request(app)
        .post('/auth/login')
        .send(loginCredentials)
        .expect(200);

      expect(response.body).toMatchObject({
        success: true,
        message: 'Login successful'
      });

      expect(response.body).toHaveProperty('token');
      expect(response.body.user).toMatchObject({
        email: testUser.email,
        full_name: testUser.full_name,
        role: 'Regular'
      });

      // Store token for other tests
      testUser.token = response.body.token;
    });

    test('should reject login with invalid email', async () => {
      const invalidCredentials = {
        email: 'nonexistent@test.com',
        password: testUser.password
      };

      const response = await request(app)
        .post('/auth/login')
        .send(invalidCredentials)
        .expect(401);

      expect(response.body).toMatchObject({
        success: false,
        error: 'Invalid credentials'
      });
    });

    test('should reject login with invalid password', async () => {
      const invalidCredentials = {
        email: testUser.email,
        password: 'WrongPassword123!'
      };

      const response = await request(app)
        .post('/auth/login')
        .send(invalidCredentials)
        .expect(401);

      expect(response.body).toMatchObject({
        success: false,
        error: 'Invalid credentials'
      });
    });

    test('should validate required fields for login', async () => {
      const incompleteCredentials = {
        email: testUser.email
        // Missing password
      };

      const response = await request(app)
        .post('/auth/login')
        .send(incompleteCredentials)
        .expect(400);

      expect(response.body).toMatchObject({
        success: false,
        error: expect.stringContaining('required')
      });
    });
  });

  describe('PUT /auth/change-password', () => {
    test('should change password successfully with valid token', async () => {
      const passwordChangeData = {
        currentPassword: testUser.password,
        newPassword: 'NewTestPassword123!'
      };

      const response = await request(app)
        .put('/auth/change-password')
        .set('Authorization', `Bearer ${testUser.token}`)
        .send(passwordChangeData)
        .expect(200);

      expect(response.body).toMatchObject({
        success: true,
        message: 'Password changed successfully'
      });

      // Update stored password for future tests
      testUser.password = passwordChangeData.newPassword;
    });

    test('should reject password change without authentication', async () => {
      const passwordChangeData = {
        currentPassword: 'OldPassword123!',
        newPassword: 'NewPassword123!'
      };

      const response = await request(app)
        .put('/auth/change-password')
        .send(passwordChangeData)
        .expect(401);

      expect(response.body).toMatchObject({
        error: expect.stringContaining('token')
      });
    });

    test('should reject password change with wrong current password', async () => {
      const passwordChangeData = {
        currentPassword: 'WrongCurrentPassword123!',
        newPassword: 'NewPassword123!'
      };

      const response = await request(app)
        .put('/auth/change-password')
        .set('Authorization', `Bearer ${testUser.token}`)
        .send(passwordChangeData)
        .expect(401);

      expect(response.body).toMatchObject({
        success: false,
        error: 'Current password is incorrect'
      });
    });
  });

  describe('POST /auth/forgot-password', () => {
    test('should handle forgot password request', async () => {
      const forgotPasswordData = {
        email: testUser.email
      };

      const response = await request(app)
        .post('/auth/forgot-password')
        .send(forgotPasswordData)
        .expect(200);

      expect(response.body).toMatchObject({
        success: true,
        message: expect.stringContaining('reset')
      });
    });

    test('should handle forgot password for non-existent email', async () => {
      const forgotPasswordData = {
        email: 'nonexistent@test.com'
      };

      const response = await request(app)
        .post('/auth/forgot-password')
        .send(forgotPasswordData)
        .expect(200);

      // Should return success even for non-existent email (security)
      expect(response.body).toMatchObject({
        success: true,
        message: expect.stringContaining('reset')
      });
    });
  });

  describe('POST /auth/logout', () => {
    test('should logout successfully with valid token', async () => {
      const response = await request(app)
        .post('/auth/logout')
        .set('Authorization', `Bearer ${testUser.token}`)
        .expect(200);

      expect(response.body).toMatchObject({
        success: true,
        message: 'Logout successful'
      });
    });

    test('should handle logout without token gracefully', async () => {
      const response = await request(app)
        .post('/auth/logout')
        .expect(200);

      expect(response.body).toMatchObject({
        success: true,
        message: 'Logout successful'
      });
    });
  });

  describe('Authentication Flow Integration', () => {
    test('should complete full registration and login flow', async () => {
      const newUser = {
        email: 'flow.test@example.com',
        password: 'FlowTest123!',
        confirmPassword: 'FlowTest123!',
        full_name: 'Flow Test User'
      };

      // Step 1: Register
      const registerResponse = await request(app)
        .post('/auth/register')
        .send(newUser)
        .expect(201);

      expect(registerResponse.body.success).toBe(true);

      // Step 2: Login with registered credentials
      const loginResponse = await request(app)
        .post('/auth/login')
        .send({
          email: newUser.email,
          password: newUser.password
        })
        .expect(200);

      expect(loginResponse.body.success).toBe(true);
      expect(loginResponse.body).toHaveProperty('token');

      // Step 3: Use token to change password
      const changePasswordResponse = await request(app)
        .put('/auth/change-password')
        .set('Authorization', `Bearer ${loginResponse.body.token}`)
        .send({
          currentPassword: newUser.password,
          newPassword: 'NewFlowTest123!'
        })
        .expect(200);

      expect(changePasswordResponse.body.success).toBe(true);

      // Step 4: Login with new password
      const loginWithNewPasswordResponse = await request(app)
        .post('/auth/login')
        .send({
          email: newUser.email,
          password: 'NewFlowTest123!'
        })
        .expect(200);

      expect(loginWithNewPasswordResponse.body.success).toBe(true);

      // Cleanup
      await pool.query('DELETE FROM users WHERE email = $1', [newUser.email]);
    });
  });
});
/**
 * AUTH INTEGRATION TESTS
 * ======================
 * 
 * Integration tests for authentication endpoints
 * Tests the complete authentication flow with HTTP requests
 */

const request = require('supertest');
const app = require('../../../app');
const User = require('../../../models/User');
const SystemLog = require('../../../models/SystemLog');
const { setupTestDB, teardownTestDB, clearDB } = require('../../../config/testdb');

// Mock external dependencies
jest.mock('../../../services/emailService');
const emailService = require('../../../services/emailService');

describe('Auth Integration Tests', () => {
    beforeAll(async () => {
        await setupTestDB();
    });

    afterAll(async () => {
        await teardownTestDB();
    });

    beforeEach(async () => {
        await clearDB();
        jest.clearAllMocks();
        
        // Mock email service
        emailService.sendWelcomeEmail.mockResolvedValue();
        emailService.sendPasswordResetEmail.mockResolvedValue();
    });

    // UC1: User Registration
    describe('POST /auth/register', () => {
        it('should register a new user successfully', async () => {
            const newUser = {
                email: 'testuser@example.com',
                password: 'SecurePassword123!',
                firstName: 'John',
                lastName: 'Doe'
            };

            const response = await request(app)
                .post('/auth/register')
                .send(newUser)
                .expect(201);

            expect(response.body).toHaveProperty('message', 'User registered successfully');
            expect(response.body).toHaveProperty('user');
            expect(response.body.user).toHaveProperty('email', newUser.email);
            expect(response.body.user).toHaveProperty('firstName', newUser.firstName);
            expect(response.body.user).not.toHaveProperty('password');

            // Verify user exists in database
            const user = await User.findByEmail(newUser.email);
            expect(user).toBeTruthy();
            expect(user.email).toBe(newUser.email);
        });

        it('should prevent duplicate email registration', async () => {
            // Create a user first
            const existingUser = {
                email: 'existing@example.com',
                password: 'SecurePassword123!',
                firstName: 'Jane',
                lastName: 'Smith'
            };
            
            await request(app)
                .post('/auth/register')
                .send(existingUser)
                .expect(201);

            // Try to register with same email
            const response = await request(app)
                .post('/auth/register')
                .send(existingUser)
                .expect(400);

            expect(response.body).toHaveProperty('error', 'Email already exists');
        });

        it('should validate required fields', async () => {
            const incompleteUser = {
                email: 'test@example.com'
                // Missing other required fields
            };

            const response = await request(app)
                .post('/auth/register')
                .send(incompleteUser)
                .expect(400);

            expect(response.body).toHaveProperty('error');
        });

        it('should validate email format', async () => {
            const invalidUser = {
                email: 'invalid-email',
                password: 'SecurePassword123!',
                firstName: 'John',
                lastName: 'Doe'
            };

            const response = await request(app)
                .post('/auth/register')
                .send(invalidUser)
                .expect(400);

            expect(response.body).toHaveProperty('error', 'Invalid email format');
        });

        it('should validate password strength', async () => {
            const weakPasswordUser = {
                email: 'test@example.com',
                password: '123',
                firstName: 'John',
                lastName: 'Doe'
            };

            const response = await request(app)
                .post('/auth/register')
                .send(weakPasswordUser)
                .expect(400);

            expect(response.body).toHaveProperty('error');
            expect(response.body.error).toContain('Password');
        });

        it('should log successful registration', async () => {
            const newUser = {
                email: 'logged@example.com',
                password: 'SecurePassword123!',
                firstName: 'Logged',
                lastName: 'User'
            };

            await request(app)
                .post('/auth/register')
                .send(newUser)
                .expect(201);

            // Verify system log entry exists
            // Note: This would need to be implemented based on SystemLog structure
        });
    });

    // UC2: User Login
    describe('POST /auth/login', () => {
        let testUser;
        
        beforeEach(async () => {
            // Create a test user
            testUser = {
                email: 'logintest@example.com',
                password: 'SecurePassword123!',
                firstName: 'Login',
                lastName: 'Test'
            };

            await request(app)
                .post('/auth/register')
                .send(testUser)
                .expect(201);
        });

        it('should login with valid credentials', async () => {
            const loginData = {
                email: testUser.email,
                password: testUser.password
            };

            const response = await request(app)
                .post('/auth/login')
                .send(loginData)
                .expect(200);

            expect(response.body).toHaveProperty('message', 'Login successful');
            expect(response.body).toHaveProperty('token');
            expect(response.body).toHaveProperty('user');
            expect(response.body.user).toHaveProperty('email', testUser.email);
            expect(response.body.user).not.toHaveProperty('password');
            
            // Verify JWT token format
            expect(response.body.token).toMatch(/^[A-Za-z0-9-_]+\.[A-Za-z0-9-_]+\.[A-Za-z0-9-_]+$/);
        });

        it('should reject invalid email', async () => {
            const invalidLogin = {
                email: 'nonexistent@example.com',
                password: testUser.password
            };

            const response = await request(app)
                .post('/auth/login')
                .send(invalidLogin)
                .expect(401);

            expect(response.body).toHaveProperty('error', 'Invalid credentials');
        });

        it('should reject invalid password', async () => {
            const invalidLogin = {
                email: testUser.email,
                password: 'wrongpassword'
            };

            const response = await request(app)
                .post('/auth/login')
                .send(invalidLogin)
                .expect(401);

            expect(response.body).toHaveProperty('error', 'Invalid credentials');
        });

        it('should validate required fields', async () => {
            const incompleteLogin = {
                email: testUser.email
                // Missing password
            };

            const response = await request(app)
                .post('/auth/login')
                .send(incompleteLogin)
                .expect(400);

            expect(response.body).toHaveProperty('error');
        });

        it('should handle empty credentials', async () => {
            const response = await request(app)
                .post('/auth/login')
                .send({})
                .expect(400);

            expect(response.body).toHaveProperty('error');
        });
    });

    // UC3: User Logout
    describe('POST /auth/logout', () => {
        let authToken;

        beforeEach(async () => {
            // Create and login a test user
            const testUser = {
                email: 'logouttest@example.com',
                password: 'SecurePassword123!',
                firstName: 'Logout',
                lastName: 'Test'
            };

            await request(app)
                .post('/auth/register')
                .send(testUser)
                .expect(201);

            const loginResponse = await request(app)
                .post('/auth/login')
                .send({
                    email: testUser.email,
                    password: testUser.password
                })
                .expect(200);

            authToken = loginResponse.body.token;
        });

        it('should logout successfully with valid token', async () => {
            const response = await request(app)
                .post('/auth/logout')
                .set('Authorization', `Bearer ${authToken}`)
                .expect(200);

            expect(response.body).toHaveProperty('message', 'Logout successful');
        });

        it('should handle logout without token', async () => {
            const response = await request(app)
                .post('/auth/logout')
                .expect(401);

            expect(response.body).toHaveProperty('error');
        });

        it('should handle logout with invalid token', async () => {
            const response = await request(app)
                .post('/auth/logout')
                .set('Authorization', 'Bearer invalid-token')
                .expect(401);

            expect(response.body).toHaveProperty('error');
        });
    });

    // UC26: Forgot Password
    describe('POST /auth/forgot-password', () => {
        let testUser;

        beforeEach(async () => {
            testUser = {
                email: 'forgottest@example.com',
                password: 'SecurePassword123!',
                firstName: 'Forgot',
                lastName: 'Test'
            };

            await request(app)
                .post('/auth/register')
                .send(testUser)
                .expect(201);
        });

        it('should send reset email for valid user', async () => {
            const response = await request(app)
                .post('/auth/forgot-password')
                .send({ email: testUser.email })
                .expect(200);

            expect(response.body).toHaveProperty('message', 'Password reset email sent');
            expect(emailService.sendPasswordResetEmail).toHaveBeenCalled();
        });

        it('should handle non-existent email gracefully', async () => {
            const response = await request(app)
                .post('/auth/forgot-password')
                .send({ email: 'nonexistent@example.com' })
                .expect(200);

            // Should not reveal if email exists
            expect(response.body).toHaveProperty('message', 'Password reset email sent');
        });

        it('should validate email field', async () => {
            const response = await request(app)
                .post('/auth/forgot-password')
                .send({})
                .expect(400);

            expect(response.body).toHaveProperty('error');
        });

        it('should validate email format', async () => {
            const response = await request(app)
                .post('/auth/forgot-password')
                .send({ email: 'invalid-email' })
                .expect(400);

            expect(response.body).toHaveProperty('error');
        });
    });

    // UC26: Reset Password
    describe('POST /auth/reset-password', () => {
        let testUser, resetToken;

        beforeEach(async () => {
            testUser = {
                email: 'resettest@example.com',
                password: 'SecurePassword123!',
                firstName: 'Reset',
                lastName: 'Test'
            };

            await request(app)
                .post('/auth/register')
                .send(testUser)
                .expect(201);

            // Initiate password reset to get token
            await request(app)
                .post('/auth/forgot-password')
                .send({ email: testUser.email })
                .expect(200);

            // In a real scenario, we'd extract token from email
            // For testing, we'll use a mock token
            resetToken = 'mock-reset-token-123';
        });

        it('should validate required fields', async () => {
            const response = await request(app)
                .post('/auth/reset-password')
                .send({ token: resetToken })
                .expect(400);

            expect(response.body).toHaveProperty('error');
        });

        it('should validate password strength', async () => {
            const response = await request(app)
                .post('/auth/reset-password')
                .send({
                    token: resetToken,
                    password: '123'
                })
                .expect(400);

            expect(response.body).toHaveProperty('error');
            expect(response.body.error).toContain('Password');
        });
    });

    // UC9: Change Password
    describe('PUT /auth/change-password', () => {
        let authToken, testUser;

        beforeEach(async () => {
            testUser = {
                email: 'changetest@example.com',
                password: 'SecurePassword123!',
                firstName: 'Change',
                lastName: 'Test'
            };

            await request(app)
                .post('/auth/register')
                .send(testUser)
                .expect(201);

            const loginResponse = await request(app)
                .post('/auth/login')
                .send({
                    email: testUser.email,
                    password: testUser.password
                })
                .expect(200);

            authToken = loginResponse.body.token;
        });

        it('should require authentication', async () => {
            const response = await request(app)
                .put('/auth/change-password')
                .send({
                    currentPassword: testUser.password,
                    newPassword: 'NewSecurePassword123!'
                })
                .expect(401);

            expect(response.body).toHaveProperty('error');
        });

        it('should validate required fields', async () => {
            const response = await request(app)
                .put('/auth/change-password')
                .set('Authorization', `Bearer ${authToken}`)
                .send({ currentPassword: testUser.password })
                .expect(400);

            expect(response.body).toHaveProperty('error');
        });

        it('should validate new password strength', async () => {
            const response = await request(app)
                .put('/auth/change-password')
                .set('Authorization', `Bearer ${authToken}`)
                .send({
                    currentPassword: testUser.password,
                    newPassword: '123'
                })
                .expect(400);

            expect(response.body).toHaveProperty('error');
            expect(response.body.error).toContain('Password');
        });

        it('should prevent using same password', async () => {
            const response = await request(app)
                .put('/auth/change-password')
                .set('Authorization', `Bearer ${authToken}`)
                .send({
                    currentPassword: testUser.password,
                    newPassword: testUser.password
                })
                .expect(400);

            expect(response.body).toHaveProperty('error');
        });
    });

    // Profile endpoint tests
    describe('GET /auth/profile', () => {
        let authToken, testUser;

        beforeEach(async () => {
            testUser = {
                email: 'profile@example.com',
                password: 'SecurePassword123!',
                firstName: 'Profile',
                lastName: 'Test'
            };

            await request(app)
                .post('/auth/register')
                .send(testUser)
                .expect(201);

            const loginResponse = await request(app)
                .post('/auth/login')
                .send({
                    email: testUser.email,
                    password: testUser.password
                })
                .expect(200);

            authToken = loginResponse.body.token;
        });

        it('should get user profile with valid token', async () => {
            const response = await request(app)
                .get('/auth/profile')
                .set('Authorization', `Bearer ${authToken}`)
                .expect(200);

            expect(response.body).toHaveProperty('user');
            expect(response.body.user).toHaveProperty('email', testUser.email);
            expect(response.body.user).not.toHaveProperty('password');
        });

        it('should require authentication', async () => {
            const response = await request(app)
                .get('/auth/profile')
                .expect(401);

            expect(response.body).toHaveProperty('error');
        });

        it('should handle invalid token', async () => {
            const response = await request(app)
                .get('/auth/profile')
                .set('Authorization', 'Bearer invalid-token')
                .expect(401);

            expect(response.body).toHaveProperty('error');
        });
    });

    // Error handling tests
    describe('Error Handling', () => {
        it('should handle database errors gracefully during registration', async () => {
            // This would require mocking database failures
            // Implementation depends on how database errors are handled
        });

        it('should handle malformed JSON requests', async () => {
            const response = await request(app)
                .post('/auth/register')
                .set('Content-Type', 'application/json')
                .send('invalid json')
                .expect(400);

            expect(response.body).toHaveProperty('error');
        });

        it('should handle extremely long passwords', async () => {
            const longPassword = 'a'.repeat(1000);
            const user = {
                email: 'longpass@example.com',
                password: longPassword,
                firstName: 'Long',
                lastName: 'Pass'
            };

            const response = await request(app)
                .post('/auth/register')
                .send(user)
                .expect(400);

            expect(response.body).toHaveProperty('error');
        });

        it('should handle SQL injection attempts', async () => {
            const maliciousUser = {
                email: "test'; DROP TABLE users; --",
                password: 'SecurePassword123!',
                firstName: 'Malicious',
                lastName: 'User'
            };

            const response = await request(app)
                .post('/auth/register')
                .send(maliciousUser)
                .expect(400);

            expect(response.body).toHaveProperty('error');
        });
    });
});
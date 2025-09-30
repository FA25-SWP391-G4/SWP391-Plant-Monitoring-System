const { pool } = require('../config/db');

// Mock the pool for testing
jest.mock('../config/postgresql', () => ({
    pool: {
        query: jest.fn(),
        connect: jest.fn()
    },
    connectDB: jest.fn()
}));

const User = require('../models/User');

describe('User Model Tests', () => {
    // Dummy test data
    const dummyUser = {
        user_id: 1,
        email: 'test@example.com',
        password_hash: '$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBdXig/e.4hgHO',
        full_name: 'Test User',
        role: 'Regular',
        notification_prefs: '{}',
        password_reset_token: null,
        password_reset_expires: null,
        created_at: new Date()
    };

    beforeEach(() => {
        jest.clearAllMocks();
    });

    describe('User.findByEmail', () => {
        it('should find user by email', async () => {
            pool.query.mockResolvedValue({ rows: [dummyUser] });

            const user = await User.findByEmail('test@example.com');

            expect(pool.query).toHaveBeenCalledWith(
                'SELECT * FROM Users WHERE email = $1',
                ['test@example.com']
            );
            expect(user).toBeInstanceOf(User);
            expect(user.email).toBe('test@example.com');
            expect(user.full_name).toBe('Test User');
        });

        it('should return null for non-existent user', async () => {
            pool.query.mockResolvedValue({ rows: [] });

            const user = await User.findByEmail('nonexistent@example.com');

            expect(user).toBeNull();
        });

        it('should handle database errors', async () => {
            pool.query.mockRejectedValue(new Error('Database connection failed'));

            await expect(User.findByEmail('test@example.com'))
                .rejects.toThrow('Database connection failed');
        });
    });

    describe('User.findById', () => {
        it('should find user by ID', async () => {
            pool.query.mockResolvedValue({ rows: [dummyUser] });

            const user = await User.findById(1);

            expect(pool.query).toHaveBeenCalledWith(
                'SELECT * FROM Users WHERE user_id = $1',
                [1]
            );
            expect(user).toBeInstanceOf(User);
            expect(user.user_id).toBe(1);
        });

        it('should return null for non-existent ID', async () => {
            pool.query.mockResolvedValue({ rows: [] });

            const user = await User.findById(999);

            expect(user).toBeNull();
        });
    });

    describe('User.findByResetToken', () => {
        it('should find user by valid reset token', async () => {
            const userWithToken = {
                ...dummyUser,
                password_reset_token: 'valid-token-123',
                password_reset_expires: new Date(Date.now() + 3600000)
            };

            pool.query.mockResolvedValue({ rows: [userWithToken] });

            const user = await User.findByResetToken('valid-token-123');

            expect(pool.query).toHaveBeenCalledWith(
                expect.stringContaining('WHERE password_reset_token = $1'),
                ['valid-token-123']
            );
            expect(user).toBeInstanceOf(User);
            expect(user.passwordResetToken).toBe('valid-token-123');
        });

        it('should return null for expired token', async () => {
            pool.query.mockResolvedValue({ rows: [] });

            const user = await User.findByResetToken('expired-token');

            expect(user).toBeNull();
        });
    });

    describe('User instance methods', () => {
        let user;

        beforeEach(() => {
            user = new User(dummyUser);
        });

        describe('validatePassword', () => {
            it('should validate correct password', async () => {
                // Mock bcrypt.compare to return true for the test
                const bcrypt = require('bcryptjs');
                jest.spyOn(bcrypt, 'compare').mockResolvedValue(true);
                
                const isValid = await user.validatePassword('testpass123');
                expect(isValid).toBe(true);
                
                bcrypt.compare.mockRestore();
            });

            it('should reject incorrect password', async () => {
                // Mock bcrypt.compare to return false for the test
                const bcrypt = require('bcryptjs');
                jest.spyOn(bcrypt, 'compare').mockResolvedValue(false);
                
                const isValid = await user.validatePassword('wrongpassword');
                expect(isValid).toBe(false);
                
                bcrypt.compare.mockRestore();
            });
        });

        describe('createPasswordResetToken', () => {
            it('should create and return reset token', () => {
                const token = user.createPasswordResetToken();

                expect(token).toBeDefined();
                expect(typeof token).toBe('string');
                expect(user.passwordResetToken).toBe(token);
                expect(user.passwordResetExpires).toBeInstanceOf(Date);
                expect(user.passwordResetExpires.getTime()).toBeGreaterThan(Date.now());
            });

            it('should set expiration to 1 hour from now', () => {
                const beforeTime = Date.now() + 3590000; // 59 minutes 50 seconds
                const token = user.createPasswordResetToken();
                const afterTime = Date.now() + 3610000; // 60 minutes 10 seconds

                expect(user.passwordResetExpires.getTime()).toBeGreaterThan(beforeTime);
                expect(user.passwordResetExpires.getTime()).toBeLessThan(afterTime);
            });
        });

        describe('updatePasswordResetFields', () => {
            it('should update password reset fields in database', async () => {
                pool.query.mockResolvedValue({ rows: [{ ...dummyUser, password_reset_token: 'new-token' }] });

                const token = 'new-token-123';
                const expires = new Date(Date.now() + 3600000);

                await user.updatePasswordResetFields(token, expires);

                expect(pool.query).toHaveBeenCalledWith(
                    `
                    UPDATE Users 
                    SET password_reset_token = $1, password_reset_expires = $2
                    WHERE user_id = $3
                    RETURNING *
                `,
                    [token, expires, user.user_id]
                );
            });

            it('should clear reset fields when called with null', async () => {
                pool.query.mockResolvedValue({ rows: [dummyUser] });

                await user.updatePasswordResetFields(null, null);

                expect(pool.query).toHaveBeenCalledWith(
                    `
                    UPDATE Users 
                    SET password_reset_token = $1, password_reset_expires = $2
                    WHERE user_id = $3
                    RETURNING *
                `,
                    [null, null, user.user_id]
                );
            });
        });

        describe('updatePassword', () => {
            it('should update password and clear reset fields', async () => {
                // Mock bcrypt.genSalt and bcrypt.hash
                const bcrypt = require('bcryptjs');
                jest.spyOn(bcrypt, 'genSalt').mockResolvedValue('$2b$12$mockSalt');
                jest.spyOn(bcrypt, 'hash').mockResolvedValue('$2b$12$mockHashedPassword');
                
                pool.query.mockResolvedValue({ 
                    rows: [{ 
                        ...dummyUser, 
                        password_reset_token: null, 
                        password_reset_expires: null 
                    }] 
                });

                await user.updatePassword('newpassword123');

                expect(pool.query).toHaveBeenCalledWith(
                    `
                    UPDATE Users 
                    SET password_hash = $1, password_reset_token = NULL, password_reset_expires = NULL
                    WHERE user_id = $2
                    RETURNING *
                `,
                    ['$2b$12$mockHashedPassword', user.user_id]
                );
                
                bcrypt.genSalt.mockRestore();
                bcrypt.hash.mockRestore();
            });
        });

        describe('toJSON', () => {
            it('should exclude sensitive fields', () => {
                const json = user.toJSON();

                expect(json.password).toBeUndefined();
                expect(json.passwordResetToken).toBeUndefined();
                expect(json.email).toBe('test@example.com');
                expect(json.full_name).toBe('Test User');
            });
        });
    });

    describe('Password hashing', () => {
        it('should hash passwords with bcrypt', async () => {
            // Mock bcrypt.genSalt and bcrypt.hash
            const bcrypt = require('bcryptjs');
            jest.spyOn(bcrypt, 'genSalt').mockResolvedValue('$2b$12$mockSalt');
            jest.spyOn(bcrypt, 'hash').mockResolvedValue('$2b$12$mockHashedPassword');
            
            const user = new User({ ...dummyUser, password: 'plaintext123' });
            
            const hashedPassword = await user.hashPassword('plaintext123');
            
            expect(hashedPassword).toBeDefined();
            expect(hashedPassword).not.toBe('plaintext123');
            expect(hashedPassword.startsWith('$2b$')).toBe(true);
            
            bcrypt.genSalt.mockRestore();
            bcrypt.hash.mockRestore();
        });

        it('should return existing password if no new password provided', async () => {
            const user = new User(dummyUser);
            
            const result = await user.hashPassword();
            
            expect(result).toBe(user.password);
        });
    });

    describe('Email handling', () => {
        it('should convert email to lowercase', async () => {
            pool.query.mockResolvedValue({ rows: [dummyUser] });

            await User.findByEmail('TEST@EXAMPLE.COM');

            expect(pool.query).toHaveBeenCalledWith(
                'SELECT * FROM Users WHERE email = $1',
                ['test@example.com']
            );
        });
    });

    describe('Role validation', () => {
        it('should handle different user roles', () => {
            const regularUser = new User({ ...dummyUser, role: 'Regular' });
            const premiumUser = new User({ ...dummyUser, role: 'Premium' });
            const adminUser = new User({ ...dummyUser, role: 'Admin' });

            expect(regularUser.role).toBe('Regular');
            expect(premiumUser.role).toBe('Premium');
            expect(adminUser.role).toBe('Admin');
        });

        it('should default to Regular role', () => {
            const userData = { ...dummyUser };
            delete userData.role;
            
            const user = new User(userData);
            
            expect(user.role).toBe('Regular');
        });
    });
});

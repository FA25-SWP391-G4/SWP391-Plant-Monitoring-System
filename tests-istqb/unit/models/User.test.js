const User = require('../../../models/User');
const { pool } = require('../../../config/db');
const bcrypt = require('bcryptjs');
const { generateUUID, isValidUUID } = require('../../../utils/uuidGenerator');

// Mock dependencies
jest.mock('../../../config/db');
jest.mock('bcryptjs');
jest.mock('../../../utils/uuidGenerator');

describe('User Model - Unit Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Constructor', () => {
    it('should create user with password_hash from database', () => {
      const userData = {
        user_id: '123e4567-e89b-12d3-a456-426614174000',
        email: 'test@example.com',
        password_hash: '$2a$12$hashedpassword',
        family_name: 'Doe',
        given_name: 'John'
      };

      const user = new User(userData);

      expect(user.user_id).toBe('123e4567-e89b-12d3-a456-426614174000');
      expect(user.email).toBe('test@example.com');
      expect(user.password).toBe('$2a$12$hashedpassword');
      expect(user.plain_text_password).toBeNull();
    });

    it('should create user with plaintext password for new user', () => {
      const userData = {
        email: 'new@example.com',
        password: 'PlainPassword123',
        family_name: 'Smith',
        given_name: 'Jane'
      };

      const user = new User(userData);

      expect(user.plain_text_password).toBe('PlainPassword123');
      expect(user.password).toBeNull();
    });

    it('should set default role to Regular', () => {
      const user = new User({ email: 'test@example.com' });
      expect(user.role).toBe('Regular');
    });

    it('should set default language preference to en', () => {
      const user = new User({ email: 'test@example.com' });
      expect(user.language_preference).toBe('en');
    });

    it('should handle Google OAuth fields', () => {
      const userData = {
        email: 'google@example.com',
        google_id: 'google-123',
        profile_picture: 'https://example.com/pic.jpg'
      };

      const user = new User(userData);

      expect(user.google_id).toBe('google-123');
      expect(user.profile_picture).toBe('https://example.com/pic.jpg');
    });
  });

  describe('findByEmail', () => {
    it('should find user by email', async () => {
      const mockUser = {
        user_id: '123e4567-e89b-12d3-a456-426614174000',
        email: 'test@example.com',
        password_hash: '$2a$12$hashed'
      };

      pool.query.mockResolvedValue({ rows: [mockUser] });

      const user = await User.findByEmail('test@example.com');

      expect(pool.query).toHaveBeenCalledWith(
        'SELECT * FROM users WHERE email = $1',
        ['test@example.com']
      );
      expect(user).toBeInstanceOf(User);
      expect(user.email).toBe('test@example.com');
    });

    it('should return null if user not found', async () => {
      pool.query.mockResolvedValue({ rows: [] });

      const user = await User.findByEmail('notfound@example.com');

      expect(user).toBeNull();
    });

    it('should throw error on database failure', async () => {
      pool.query.mockRejectedValue(new Error('Database error'));

      await expect(User.findByEmail('test@example.com')).rejects.toThrow('Database error');
    });
  });

  describe('findById', () => {
    it('should find user by valid UUID', async () => {
      const mockUser = {
        user_id: 'valid-uuid',
        email: 'test@example.com'
      };

      isValidUUID.mockReturnValue(true);
      pool.query.mockResolvedValue({ rows: [mockUser] });

      const user = await User.findById('valid-uuid');

      expect(isValidUUID).toHaveBeenCalledWith('valid-uuid');
      expect(user).toBeInstanceOf(User);
    });

    it('should return null for invalid UUID', async () => {
      isValidUUID.mockReturnValue(false);

      const user = await User.findById('invalid-uuid');

      expect(user).toBeNull();
      expect(pool.query).not.toHaveBeenCalled();
    });

    it('should return null if user not found', async () => {
      isValidUUID.mockReturnValue(true);
      pool.query.mockResolvedValue({ rows: [] });

      const user = await User.findById('valid-uuid');

      expect(user).toBeNull();
    });
  });

  describe('findByResetToken', () => {
    it('should find user by valid reset token', async () => {
      const mockUser = {
        user_id: '123e4567-e89b-12d3-a456-426614174000',
        email: 'test@example.com',
        password_reset_token: 'valid-token'
      };

      pool.query.mockResolvedValue({ rows: [mockUser] });

      const user = await User.findByResetToken('valid-token');

      expect(user).toBeInstanceOf(User);
      expect(user.email).toBe('test@example.com');
    });

    it('should return null for expired token', async () => {
      pool.query.mockResolvedValue({ rows: [] });

      const user = await User.findByResetToken('expired-token');

      expect(user).toBeNull();
    });
  });

  describe('save', () => {
    it('should create new user with hashed password', async () => {
      const newUserData = {
        email: 'new@example.com',
        password: 'Password123',
        family_name: 'Doe',
        given_name: 'John'
      };

      generateUUID.mockReturnValue('new-uuid');
      pool.query.mockResolvedValueOnce({ rows: [] }); // findByEmail returns null
      bcrypt.genSalt.mockResolvedValue('salt');
      bcrypt.hash.mockResolvedValue('$2a$12$hashed');
      pool.query.mockResolvedValueOnce({
        rows: [{
          user_id: 'new-uuid',
          email: 'new@example.com',
          password_hash: '$2a$12$hashed',
          family_name: 'Doe',
          given_name: 'John',
          role: 'Regular'
        }]
      });

      const user = new User(newUserData);
      await user.save();

      expect(bcrypt.genSalt).toHaveBeenCalledWith(12);
      expect(bcrypt.hash).toHaveBeenCalledWith('Password123', 'salt');
      expect(user.user_id).toBe('new-uuid');
    });

    it('should throw error for duplicate email', async () => {
      const existingUser = {
        user_id: 'existing-uuid',
        email: 'existing@example.com'
      };

      pool.query.mockResolvedValue({ rows: [existingUser] });

      const user = new User({
        email: 'existing@example.com',
        password: 'Password123'
      });

      await expect(user.save()).rejects.toThrow('Email already registered');
    });

    it('should update existing user', async () => {
      const existingUser = new User({
        user_id: 'existing-uuid',
        email: 'test@example.com',
        password_hash: '$2a$12$oldhash',
        family_name: 'Doe',
        given_name: 'John'
      });

      pool.query.mockResolvedValue({
        rows: [{
          user_id: 'existing-uuid',
          email: 'test@example.com',
          password_hash: '$2a$12$oldhash',
          family_name: 'Doe',
          given_name: 'John'
        }]
      });

      await existingUser.save();

      expect(pool.query).toHaveBeenCalledWith(
        expect.stringContaining('UPDATE users'),
        expect.any(Array)
      );
    });

    it('should create Google user without password', async () => {
      const googleUser = {
        email: 'google@example.com',
        google_id: 'google-123',
        family_name: 'User',
        given_name: 'Google'
      };

      generateUUID.mockReturnValue('google-uuid');
      pool.query.mockResolvedValueOnce({ rows: [] }); // findByEmail
      pool.query.mockResolvedValueOnce({
        rows: [{
          user_id: 'google-uuid',
          email: 'google@example.com',
          google_id: 'google-123',
          password_hash: null
        }]
      });

      const user = new User(googleUser);
      await user.save();

      expect(user.google_id).toBe('google-123');
    });
  });

  describe('validatePassword', () => {
    it('should validate correct password', async () => {
      const user = new User({
        email: 'test@example.com',
        password_hash: '$2a$12$hashed'
      });

      bcrypt.compare.mockResolvedValue(true);

      const isValid = await user.validatePassword('CorrectPassword');

      expect(bcrypt.compare).toHaveBeenCalledWith('CorrectPassword', '$2a$12$hashed');
      expect(isValid).toBe(true);
    });

    it('should reject incorrect password', async () => {
      const user = new User({
        email: 'test@example.com',
        password_hash: '$2a$12$hashed'
      });

      bcrypt.compare.mockResolvedValue(false);

      const isValid = await user.validatePassword('WrongPassword');

      expect(isValid).toBe(false);
    });

    it('should return false for Google user without password', async () => {
      const user = new User({
        email: 'google@example.com',
        google_id: 'google-123'
      });

      const isValid = await user.validatePassword('anypassword');

      expect(isValid).toBe(false);
      expect(bcrypt.compare).not.toHaveBeenCalled();
    });
  });

  describe('createPasswordResetToken', () => {
    it('should generate reset token', () => {
      const user = new User({ email: 'test@example.com' });

      const token = user.createPasswordResetToken();

      expect(token).toBeDefined();
      expect(typeof token).toBe('string');
      expect(user.password_reset_token).toBe(token);
      expect(user.password_reset_expires).toBeInstanceOf(Date);
    });
  });

  describe('updatePasswordResetFields', () => {
    it('should update reset fields in database', async () => {
      const user = new User({
        user_id: '123e4567-e89b-12d3-a456-426614174000',
        email: 'test@example.com'
      });

      const token = 'reset-token';
      const expires = new Date();

      pool.query.mockResolvedValue({
        rows: [{
          user_id: '123e4567-e89b-12d3-a456-426614174000',
          password_reset_token: token,
          password_reset_expires: expires
        }]
      });

      await user.updatePasswordResetFields(token, expires);

      expect(pool.query).toHaveBeenCalledWith(
        expect.stringContaining('UPDATE users'),
        [token, expires, '123e4567-e89b-12d3-a456-426614174000']
      );
    });
  });

  describe('updatePassword', () => {
    it('should update password and clear reset token', async () => {
      const user = new User({
        user_id: '123e4567-e89b-12d3-a456-426614174000',
        email: 'test@example.com',
        password_hash: '$2a$12$oldhash'
      });

      bcrypt.genSalt.mockResolvedValue('salt');
      bcrypt.hash.mockResolvedValue('$2a$12$newhash');
      pool.query.mockResolvedValue({
        rows: [{
          user_id: '123e4567-e89b-12d3-a456-426614174000',
          password_hash: '$2a$12$newhash',
          password_reset_token: null,
          password_reset_expires: null
        }]
      });

      await user.updatePassword('NewPassword123');

      expect(user.password).toBe('$2a$12$newhash');
      expect(user.passwordResetToken).toBeNull();
    });
  });

  describe('update', () => {
    it('should update user profile fields', async () => {
      const user = new User({
        user_id: '123e4567-e89b-12d3-a456-426614174000',
        email: 'test@example.com',
        family_name: 'Doe',
        given_name: 'John'
      });

      pool.query.mockResolvedValue({
        rows: [{
          user_id: '123e4567-e89b-12d3-a456-426614174000',
          family_name: 'Smith',
          given_name: 'Jane'
        }]
      });

      await user.update({
        family_name: 'Smith',
        given_name: 'Jane'
      });

      expect(user.family_name).toBe('Smith');
      expect(user.given_name).toBe('Jane');
    });

    it('should return user if no valid fields to update', async () => {
      const user = new User({
        user_id: '123e4567-e89b-12d3-a456-426614174000',
        email: 'test@example.com'
      });

      const result = await user.update({ invalid_field: 'value' });

      expect(result).toBe(user);
      expect(pool.query).not.toHaveBeenCalled();
    });
  });

  describe('toJSON', () => {
    it('should exclude sensitive fields', () => {
      const user = new User({
        user_id: '123e4567-e89b-12d3-a456-426614174000',
        email: 'test@example.com',
        password_hash: '$2a$12$hashed',
        password_reset_token: 'token'
      });

      const json = user.toJSON();

      expect(json.password).toBeUndefined();
      expect(json.passwordResetToken).toBeUndefined();
      expect(json.email).toBe('test@example.com');
    });
  });

  describe('upgradeToPremium', () => {
    it('should upgrade user to Premium role', async () => {
      isValidUUID.mockReturnValue(true);
      pool.query.mockResolvedValue({
        rows: [{
          user_id: '123e4567-e89b-12d3-a456-426614174000',
          email: 'test@example.com',
          role: 'Premium'
        }]
      });

      const result = await User.upgradeToPremium('123e4567-e89b-12d3-a456-426614174000');

      expect(result.role).toBe('Premium');
    });

    it('should throw error for invalid UUID', async () => {
      isValidUUID.mockReturnValue(false);

      await expect(User.upgradeToPremium('invalid-uuid'))
        .rejects.toThrow('Invalid user_id UUID');
    });
  });

  describe('countAll', () => {
    it('should count all users', async () => {
      pool.query.mockResolvedValue({ rows: [{ count: '10' }] });

      const count = await User.countAll();

      expect(count).toBe(10);
    });

    it('should count users with search filter', async () => {
      pool.query.mockResolvedValue({ rows: [{ count: '5' }] });

      const count = await User.countAll({ search: 'john' });

      expect(count).toBe(5);
      expect(pool.query).toHaveBeenCalledWith(
        expect.stringContaining('ILIKE'),
        expect.arrayContaining(['%john%'])
      );
    });
  });

  describe('findAll', () => {
    it('should find all users with pagination', async () => {
      pool.query.mockResolvedValue({
        rows: [
          { user_id: 'uuid1', email: 'user1@example.com' },
          { user_id: 'uuid2', email: 'user2@example.com' }
        ]
      });

      const users = await User.findAll({ limit: 10, offset: 0 });

      expect(users).toHaveLength(2);
      expect(users[0]).toBeInstanceOf(User);
    });
  });
});
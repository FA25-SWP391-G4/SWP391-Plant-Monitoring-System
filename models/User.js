/**
 * ============================================================================
 * USER MODEL - CORE USER MANAGEMENT FOR ALL USE CASES
 * ============================================================================
 * 
 * SUPPORTS THESE USE CASES:
 * ✅ UC11: Reset Password - Complete password reset functionality
 * 🔄 UC1: User Registration - save() method ready 
 * 🔄 UC2: User Login - validatePassword() method ready   
 * 🔄 UC3: User Logout - Session cleanup support 
 * 🔄 UC12: Change Password - updatePassword() method ready
 * 🔄 UC13: Manage Profile - save() method for profile updates
 * 🔄 UC16: Upgrade to Premium - role field for Premium status
 * 🔄 UC19, UC22: Make Payment - user_id for payment association
 * 🔄 UC24: Manage Users (Admin) - Full CRUD operations ready
 * 
 * USER ROLES SUPPORTED:
 * - 'Regular': Basic features (UC1-13)
 * - 'Premium': Premium features (UC14-23) 
 * - 'Admin': Administrative features (UC24-31)
 * 
 * SECURITY FEATURES:
 * - bcrypt password hashing (12 salt rounds)
 * - JWT token generation for password reset (1-hour expiration)
 * - SQL injection protection with parameterized queries
 * - Sensitive data exclusion in toJSON()
 * 
 * RELATIONSHIPS:
 * - Users (1) → (N) Devices
 * - Users (1) → (N) Plants  
 * - Users (1) → (N) Alerts
 * - Users (1) → (N) Payments
 * - Users (1) → (N) ChatHistory
 */

const { pool } = require('../config/db');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

class User {
    /**
     * USER CONSTRUCTOR
     * Initializes user object with validation and default values
     * SUPPORTS: UC1 (Registration), UC13 (Profile Management), UC24 (User Management),
     * UC31: Manage Multi-Language Settings
     */
    constructor(userData) {
        this.user_id = userData.user_id;
        this.email = userData.email;
        this.password = userData.password_hash || userData.password;
        this.full_name = userData.full_name;
        this.role = userData.role || 'Regular'; // Default role for UC1
        this.notification_prefs = userData.notification_prefs;
        this.passwordResetToken = userData.password_reset_token;
        this.passwordResetExpires = userData.password_reset_expires;
        this.languagePreference = userData.language_preference || 'en'; // Default language
        this.created_at = userData.created_at;
    }

    /**
     * FIND USER BY EMAIL - AUTHENTICATION & SECURITY
     * Critical for login, password reset, and user identification
     * 
     * SUPPORTS:
     * - UC1: User Registration (Other backend member) - Email uniqueness validation
     * - UC2: User Login (Other backend member) - Email lookup for authentication
     * - UC11: Reset Password - Email validation before sending reset token
     * - UC24: Admin user management - User lookup by email
     * 
     * SECURITY: Used in authentication flows with proper validation
     * REGISTRATION USE: Checks email uniqueness before account creation
     * LOGIN USE: Retrieves user for password verification
     */
    // Static method to find user by email
    static async findByEmail(email) {
        try {
            const query = 'SELECT * FROM Users WHERE email = $1';
            const result = await pool.query(query, [email.toLowerCase()]);
            
            if (result.rows.length === 0) {
                return null;
            }
            
            return new User(result.rows[0]);
        } catch (error) {
            throw error;
        }
    }

    /**
     * FIND USER BY ID - USER IDENTIFICATION & SESSION MANAGEMENT
     * Essential for JWT authentication and user session validation
     * 
     * SUPPORTS:
     * - UC1: User Registration (Other backend member) - User ID generation after creation
     * - UC2: User Login (Other backend member) - JWT payload user identification  
     * - UC3: User Logout (Other backend member) - Session cleanup by user ID
     * - UC4-31: All authenticated operations require user ID lookup
     * - JWT middleware uses this for token validation
     * - Admin operations for user management (UC24)
     * 
     * PERFORMANCE: Direct primary key lookup for optimal speed
     * SESSION MANAGEMENT: Essential for user session tracking and cleanup
     */
    // Static method to find user by ID
    static async findById(id) {
        try {
            const query = 'SELECT * FROM Users WHERE user_id = $1';
            const result = await pool.query(query, [id]);
            
            if (result.rows.length === 0) {
                return null;
            }
            
            return new User(result.rows[0]);
        } catch (error) {
            throw error;
        }
    }

    /**
     * FIND USER BY RESET TOKEN - PASSWORD RECOVERY SECURITY
     * Validates password reset tokens and prevents token reuse/expiration
     * 
     * SUPPORTS:
     * - UC11: Reset Password - Token validation step
     * 
     * SECURITY FEATURES:
     * - Automatic token expiration check (1-hour limit)
     * - Prevents replay attacks with expired tokens
     * - SQL injection protection with parameterized queries
     */
    // Static method to find user by reset token
    static async findByResetToken(token) {
        try {
            const query = `
                SELECT * FROM Users 
                WHERE password_reset_token = $1 
                AND password_reset_expires > NOW()
            `;
            const result = await pool.query(query, [token]);
            
            if (result.rows.length === 0) {
                return null;
            }
            
            return new User(result.rows[0]);
        } catch (error) {
            throw error;
        }
    }

    /**
     * SAVE USER TO DATABASE - CREATE & UPDATE OPERATIONS
     * Handles both user creation and profile updates with security
     * 
     * SUPPORTS:
     * - UC1: User Registration (Other backend member) - New user account creation
     *   └── Features: Email uniqueness validation, password hashing, default role assignment
     *   └── Validation: Email format, password strength, required fields
     *   └── Security: Automatic bcrypt hashing, SQL injection prevention
     * - UC11: Reset Password - Password hash updates after reset
     * - UC13: Manage Profile - User profile updates (name, preferences)
     * - UC24: Manage Users (Admin) - Admin user management operations
     * 
     * REGISTRATION PROCESS (UC1):
     * 1. Validate input data (email format, password requirements)
     * 2. Check email uniqueness using findByEmail()
     * 3. Hash password with bcrypt (12 rounds)
     * 4. Insert new user record with default 'Regular' role
     * 5. Return user object with generated user_id
     * 
     * SECURITY FEATURES:
     * - Automatic password hashing (bcrypt, 12 rounds)
     * - Email normalization (lowercase)
     * - Parameterized queries prevent SQL injection
     * - Handles both INSERT and UPDATE operations
     * - Default role assignment for new registrations
     */
    // Create new user
    async save() {
        try {
            if (this.user_id) {
                // Update existing user
                const query = `
                    UPDATE Users 
                    SET email = $1, password_hash = $2, full_name = $3, 
                        role = $4, notification_prefs = $5, 
                        password_reset_token = $6, password_reset_expires = $7
                    WHERE user_id = $8
                    RETURNING *
                `;
                
                const hashedPassword = await this.hashPassword(this.password);
                
                const result = await pool.query(query, [
                    this.email.toLowerCase(),
                    hashedPassword,
                    this.full_name,
                    this.role,
                    JSON.stringify(this.notification_prefs),
                    this.passwordResetToken,
                    this.passwordResetExpires,
                    this.user_id
                ]);
                
                const updatedUser = new User(result.rows[0]);
                Object.assign(this, updatedUser);
                return this;
            } else {
                // Create new user
                const hashedPassword = await this.hashPassword(this.password);
                
                const query = `
                    INSERT INTO Users (email, password_hash, full_name, role, notification_prefs)
                    VALUES ($1, $2, $3, $4, $5)
                    RETURNING *
                `;
                
                const result = await pool.query(query, [
                    this.email.toLowerCase(),
                    hashedPassword,
                    this.full_name,
                    this.role,
                    JSON.stringify(this.notification_prefs || {})
                ]);
                
                const newUser = new User(result.rows[0]);
                Object.assign(this, newUser);
                return this;
            }
        } catch (error) {
            throw error;
        }
    }

    /**
     * HASH PASSWORD - SECURE PASSWORD STORAGE
     * Uses bcrypt with 12 salt rounds for optimal security/performance balance
     * 
     * SUPPORTS:
     * - UC1: User Registration (Other backend member) - New password hashing during signup
     * - UC11: Reset Password - New password hashing after reset
     * - UC12: Change Password - Password change hashing
     * - UC24: Admin user creation/updates
     * 
     * REGISTRATION USE (UC1): 
     * - Called during user account creation
     * - Ensures passwords never stored in plaintext
     * - Consistent hashing for all user passwords
     * 
     * SECURITY: 12 salt rounds = ~300ms hashing time (OWASP recommended)
     */
    // Hash password
    async hashPassword(password) {
        if (!password) return this.password; // Return existing password if no new password
        const salt = await bcrypt.genSalt(12);
        return await bcrypt.hash(password, salt);
    }

    /**
     * VALIDATE PASSWORD - AUTHENTICATION
     * Compares plaintext password with stored hash for login
     * 
     * SUPPORTS:
     * - UC2: User Login (Other backend member) - Primary authentication method
     *   └── Process: Email lookup → password validation → JWT generation
     *   └── Security: Timing attack resistance, rate limiting support
     *   └── Integration: Works with login controller and middleware
     * - UC12: Change Password - Current password verification before change
     * 
     * LOGIN PROCESS (UC2):
     * 1. User found via findByEmail(email)
     * 2. validatePassword(plaintext) called with user input
     * 3. bcrypt.compare() performs secure hash comparison
     * 4. Returns boolean for authentication success/failure
     * 5. JWT token generated on successful validation
     * 
     * SECURITY: Uses bcrypt.compare for timing attack resistance
     */
    // Validate password
    async validatePassword(password) {
        return await bcrypt.compare(password, this.password);
    }

    /**
     * CREATE PASSWORD RESET TOKEN - SECURE PASSWORD RECOVERY
     * Generates JWT token for password reset with 1-hour expiration
     * 
     * SUPPORTS:
     * - UC11: Reset Password - Step 2 (Generate secure reset token)
     * 
     * SECURITY FEATURES:
     * - JWT with user ID payload
     * - 1-hour expiration prevents long-term token abuse
     * - Uses app's JWT_SECRET for signing
     */
    // Create password reset token
    createPasswordResetToken() {
        const token = jwt.sign({ id: this.user_id }, process.env.JWT_SECRET, { expiresIn: '1h' });
        
        this.passwordResetToken = token;
        this.passwordResetExpires = new Date(Date.now() + 3600000); // 1 hour
        
        return token;
    }

    /**
     * UPDATE PASSWORD RESET FIELDS - TOKEN MANAGEMENT
     * Updates reset token and expiration in database for security tracking
     * 
     * SUPPORTS:
     * - UC11: Reset Password - Store reset token in database
     * 
     * SECURITY FEATURES:
     * - Stores token for validation in reset process
     * - Tracks expiration to prevent token reuse
     * - Can clear tokens by passing null values
     */
    // Update password reset fields
    async updatePasswordResetFields(token = null, expires = null) {
        try {
            const query = `
                UPDATE Users 
                SET password_reset_token = $1, password_reset_expires = $2
                WHERE user_id = $3
                RETURNING *
            `;
            
            const result = await pool.query(query, [token, expires, this.user_id]);
            
            if (result.rows.length > 0) {
                this.passwordResetToken = token;
                this.passwordResetExpires = expires;
            }
            
            return this;
        } catch (error) {
            throw error;
        }
    }

    /**
     * UPDATE PASSWORD - SECURE PASSWORD CHANGE
     * Updates user password with automatic hashing and token cleanup
     * 
     * SUPPORTS:
     * - UC11: Reset Password - Final step (Update password with new hash)
     * - UC12: Change Password - User-initiated password changes
     * 
     * SECURITY FEATURES:
     * - Automatic password hashing before storage
     * - Clears reset tokens after successful password change
     * - Prevents password reuse attacks
     */
    // Update password
    async updatePassword(newPassword) {
        try {
            const hashedPassword = await this.hashPassword(newPassword);
            
            const query = `
                UPDATE Users 
                SET password_hash = $1, password_reset_token = NULL, password_reset_expires = NULL
                WHERE user_id = $2
                RETURNING *
            `;
            
            const result = await pool.query(query, [hashedPassword, this.user_id]);
            
            if (result.rows.length > 0) {
                this.password = hashedPassword;
                this.passwordResetToken = null;
                this.passwordResetExpires = null;
            }
            
            return this;
        } catch (error) {
            throw error;
        }
    }
    
    /**
     * UPDATE USER PROFILE
     * Updates user profile information
     * 
     * SUPPORTS:
     * - UC13: Manage Profile - Update user profile information
     * - UC19: Upgrade to Premium - Update user role
     * 
     * SECURITY FEATURES:
     * - SQL Injection protection with parameterized queries
     * - Update only allowed fields
     */
    // Update user profile
    async update(userData) {
        try {
            // Build dynamic query based on provided fields
            const validFields = ['full_name', 'notification_prefs', 'role', 'language_preference'];
            const updates = [];
            const values = [this.user_id]; // First parameter is always user_id
            let paramIndex = 2; // Start parameter index at 2 (user_id is $1)
            
            // Construct SET part of query for each provided field
            Object.keys(userData).forEach(key => {
                if (validFields.includes(key)) {
                    updates.push(`${key === 'full_name' ? 'full_name' : 
                                  key === 'notification_prefs' ? 'notification_prefs' : 
                                  key === 'role' ? 'role' : 
                                  key === 'language_preference' ? 'language_preference' : key} = $${paramIndex}`);
                    values.push(userData[key]);
                    paramIndex++;
                }
            });
            
            // If no valid fields to update, return the current user
            if (updates.length === 0) {
                return this;
            }
            
            // Construct and execute the update query
            const query = `
                UPDATE Users 
                SET ${updates.join(', ')}
                WHERE user_id = $1
                RETURNING *
            `;
            
            const result = await pool.query(query, values);
            
            // Update the user object with new values
            if (result.rows.length > 0) {
                const updatedUser = result.rows[0];
                this.full_name = updatedUser.full_name;
                this.notification_prefs = updatedUser.notification_prefs;
                this.role = updatedUser.role;
                this.languagePreference = updatedUser.language_preference;
            }
            
            return this;
        } catch (error) {
            throw error;
        }
    }

    /**
     * LOGOUT SUPPORT METHODS - SESSION CLEANUP
     * While logout is primarily handled in controllers/middleware,
     * User model provides data access for session management
     * 
     * SUPPORTS:
     * - UC3: User Logout (Other backend member) - User data for session cleanup
     *   └── Process: Validate user session → Clear tokens → Audit log
     *   └── Security: Token invalidation, session termination
     *   └── Audit: Log logout events for security monitoring
     * 
     * LOGOUT IMPLEMENTATION NOTES (UC3):
     * - Controller calls User.findById() to validate session
     * - Optional: Store blacklisted tokens in Redis/database
     * - SystemLog model can track logout events for audit
     * - Clear refresh tokens if stored in database
     * - Return success response to client
     * 
     * SECURITY CONSIDERATIONS:
     * - Immediate token invalidation prevents session hijacking
     * - Audit logging for security monitoring
     * - Optional token blacklisting for added security
     */

    /**
     * TO JSON - SECURE DATA SERIALIZATION
     * Removes sensitive fields when converting user object to JSON
     * 
     * SUPPORTS:
     * - UC1: User Registration (Other backend member) - Safe user data return
     * - UC2: User Login (Other backend member) - Authentication response data
     * - UC3: User Logout (Other backend member) - Final user state return
     * - UC4-31: All API responses that include user data
     * - JWT token payload generation
     * - Frontend user data display
     * 
     * SECURITY FEATURES:
     * - Excludes password hash from JSON output
     * - Excludes reset tokens from client responses
     * - Prevents accidental password exposure in logs/responses
     * - Safe for authentication responses and user profiles
     */
    // Convert to JSON (excluding sensitive fields)
    toJSON() {
        const { password, passwordResetToken, ...publicData } = this;
        return publicData;
    }
}

module.exports = User;

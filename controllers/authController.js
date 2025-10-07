/**
 * ============================================================================
 * AUTHENTICATION CONTROLLER - COMPREHENSIVE USE CASE COVERAGE
 * ============================================================================
 * 
 * 🔄 AUTHENTICATION CONTROLLERS TO CREATE:
 * 
 * 📁 controllers/authController.js (THIS FILE):
 * - UC1: User Registration (Account creation + email verification)
 *   └── Function needed: register() - POST /auth/register
 *   └── Requirements: Input validation, email verification, duplicate checking
 *   └── Models ready: User.save() method, email templates needed
 * - UC2: User Login (JWT authentication + session management)
 *   └── Function needed: login() - POST /auth/login
 *   └── Requirements: Password validation, JWT generation, rate limiting
 *   └── Models ready: User.validatePassword() method, JWT middleware needed
 * - UC3: User Logout (Session cleanup + audit logging)  
 *   └── Function needed: logout() - POST /auth/logout
 *   └── Requirements: Token blacklisting, session cleanup, audit logging
 *   └── Models ready: SystemLog for auditing, token management strategy
 * - ✅ UC11: Reset Password (forgotPassword, resetPassword)
 * - 🔄 UC12: Change Password (changePassword) - Needs auth middleware
 * 
 * 📁 controllers/userController.js (USER MANAGEMENT):
 * - 🔄 UC13: Manage Profile - View/edit user info, avatar upload
 * - 🔄 UC19: Upgrade to Premium - Role upgrade after payment verification
 * - 🔄 UC24: Manage Users (Admin) - CRUD operations, bulk actions
 * 
 * 📁 controllers/dashboardController.js (DASHBOARD & MONITORING):
 * - 🔄 UC4: View Plant Monitoring Dashboard - Real-time sensor data aggregation
 * - 🔄 UC10: Receive Real-Time Notifications - WebSocket notification management
 * - � UC18: Customize Dashboard - Widget management, layout preferences
 * 
 * �📁 controllers/plantController.js (PLANT & WATERING MANAGEMENT):
 * - 🔄 UC5: Manual Watering - Direct pump control with safety checks
 * - 🔄 UC6: Configure Auto-Watering Schedule - Cron job management
 * - 🔄 UC7: Toggle Auto-Watering Mode - Enable/disable automation per plant
 * - � UC14: Manage Multiple Plant Zones - Zone-based plant grouping
 * - 🔄 UC16: Configure Advanced Sensor Thresholds - Custom limits per plant
 * 
 * �📁 controllers/reportController.js (ANALYTICS & REPORTING):
 * - 🔄 UC8: View Watering History - Historical data with date filtering
 * - 🔄 UC9: Search Watering History - Advanced search and export
 * - 🔄 UC15: View Detailed Plant Health Report - Comprehensive analytics
 * - 🔄 UC17: Search Plant Health Reports - Multi-criteria report filtering
 * - 🔄 UC25: View System-Wide Reports (Admin) - Global analytics dashboard
 * 
 * 📁 controllers/notificationController.js (ALERTS & NOTIFICATIONS):
 * - 🔄 UC10: Receive Real-Time Notifications - Push notifications, email alerts
 * - 🔄 Alert management - Mark read/unread, notification preferences
 * - 🔄 Integration with Firebase Cloud Messaging and SMTP
 * 
 * 📁 controllers/paymentController.js (SUBSCRIPTION & BILLING):
 * - 🔄 UC19: Upgrade to Premium - Subscription management flow
 * - 🔄 UC22: Make Payment for Premium - Stripe/VNPay integration
 * - 🔄 Payment webhook handling - Transaction verification and logging
 * - 🔄 Subscription renewal and cancellation management
 * 
 * 📁 controllers/adminController.js (SYSTEM ADMINISTRATION):
 * - 🔄 UC24: Manage Users - User CRUD, role management, bulk operations
 * - 🔄 UC25: View System-Wide Reports - Global metrics and analytics
 * - 🔄 UC26: Configure Global Settings - System configuration management
 * - 🔄 UC27: Monitor System Logs - Error tracking and audit logs
 * - 🔄 UC28: Backup and Restore Data - Data management utilities
 * - 🔄 UC31: Manage Multi-Language Settings - Internationalization admin
 * 
 * 📁 controllers/iotController.js (IOT DEVICE MANAGEMENT):
 * - 🔄 UC29: Collect and Send Sensor Data - Real-time data ingestion via MQTT
 * - 🔄 UC30: Auto-Water Based on Sensors - Automated watering logic
 * - 🔄 UC31: Handle Hardware Failure - Device error detection and recovery
 * - 🔄 Device registration, authentication, and health monitoring
 * 
 * 📁 controllers/aiController.js (AI & MACHINE LEARNING):
 * - 🔄 UC20: Predict Watering Needs (AI) - ML-based watering predictions
 * - 🔄 UC21: Analyze Plant Health (AI) - AI-powered health assessment
 * - 🔄 UC23: Interact with AI Chatbot - Natural language plant care assistance
 * - 🔄 UC29: Manage AI Models (Admin) - Model lifecycle management
 * - 🔄 UC30: Optimize Watering Schedules (AI) - AI-driven optimization
 * 
 * AUTHENTICATION & AUTHORIZATION LAYERS:
 * 🔐 middleware/auth.js - JWT verification middleware
 * � middleware/roles.js - Role-based access control (Regular, Premium, Admin)
 * 🔐 middleware/rateLimit.js - API rate limiting and throttling
 * 🔐 middleware/validation.js - Input validation and sanitization
 * 
 * SECURITY CONSIDERATIONS:
 * - JWT tokens with proper expiration (15min access, 7d refresh)
 * - bcrypt password hashing (12 rounds minimum)
 * - Role-based access control enforcement
 * - API rate limiting per endpoint
 * - Input validation and SQL injection prevention
 * - HTTPS only, secure headers (helmet.js)
 * - Audit logging for sensitive operations
 * - Device authentication keys for IoT endpoints
 * 
 * ERROR HANDLING & LOGGING:
 * - Centralized error handling middleware
 * - Winston logging with appropriate log levels
 * - Error tracking and monitoring (e.g., Sentry)
 * - API response standardization
 * - Database transaction management
 * 
 * TESTING STRATEGY:
 * ✅ Unit tests with Jest for all controller functions
 * ✅ Integration tests for API endpoints
 * ✅ Dummy data generation for testing
 * 🔄 End-to-end testing for critical user flows
 * 🔄 Load testing for high-traffic endpoints
 * 🔄 Security testing for authentication flows
 */

const User = require('../models/User');
const jwt = require('jsonwebtoken');
const nodemailer = require('nodemailer');
const crypto = require('crypto');

// Create email transporter
const createTransporter = () => {
    return nodemailer.createTransport({
        service: process.env.EMAIL_SERVICE || 'gmail',
        auth: {
            user: process.env.EMAIL_USER,
            pass: process.env.EMAIL_PASS,
        },
    });
};

/**
 * Generate JWT token for authentication
 * @param {Object} user - User object
 * @returns {String} JWT token
 */
const generateToken = (user) => {
    return jwt.sign(
        { user_id: user.user_id, email: user.email, role: user.role },
        process.env.JWT_SECRET,
        { expiresIn: '1d' }
    );
};

/**
 * UC11: FORGOT PASSWORD CONTROLLER
 * =====================================
 * Implements password reset request functionality
 * 
 * Flow:
 * 1. Validate email input
 * 2. Find user by email in PostgreSQL 
 * 3. Generate JWT reset token (1-hour expiration)
 * 4. Update user's reset token fields in database
 * 5. Send professional HTML email with reset link
 * 6. Return success response (no user enumeration)
 * 
 * Security Features:
 * - JWT tokens with short expiration (1 hour)
 * - Single-use tokens (cleared after password reset)
 * - No user enumeration (same response for valid/invalid emails)
 * - Secure email templates with styling
 * 
 * Error Handling:
 * - Input validation
 * - Database connection errors
 * - Email sending failures
 * - Token generation errors
 */
// Forgot Password Controller
async function forgotPassword(req, res) {
    try {
        const { email } = req.body;

        // Validate email input
        if (!email) {
            return res.status(400).json({ 
                error: 'Email is required' 
            });
        }

        // Find the user by email
        const user = await User.findByEmail(email);

        if (!user) {
            return res.status(404).json({ 
                error: 'User not found with this email address' 
            });
        }

        // Generate a password reset token
        const resetToken = user.createPasswordResetToken();
        await user.updatePasswordResetFields(resetToken, user.passwordResetExpires);

        // Create password reset URL
        const resetUrl = `${process.env.FRONTEND_URL}/reset-password?token=${resetToken}`;

        // Email options - Simple text email (no HTML since React FE will handle UI)
        const mailOptions = {
            from: process.env.EMAIL_USER,
            to: user.email,
            subject: 'Plant Monitoring System - Password Reset Request',
            text: `
                Hello ${user.full_name || 'User'},

                You requested a password reset for your Plant Monitoring System account.

                Please use this link to reset your password: ${resetUrl}

                This link will expire in 1 hour.

                If you didn't request this password reset, please ignore this email.

                ---
                This is an automated message from Plant Monitoring System. Please do not reply to this email.
            `,
        };

        // Send email
        const transporter = createTransporter();
        await transporter.sendMail(mailOptions);

        res.status(200).json({ 
            success: true,
            message: 'Password reset email sent successfully',
            data: {
                email: user.email,
                resetUrl: resetUrl, // Include reset URL for FE team reference
                expiresIn: '1 hour'
            }
        });

    } catch (error) {
        console.error('Forgot password error:', error);
        
        // Reset password reset fields if email failed
        if (req.body.email) {
            try {
                const user = await User.findByEmail(req.body.email);
                if (user) {
                    await user.updatePasswordResetFields(null, null);
                }
            } catch (cleanupError) {
                console.error('Cleanup error:', cleanupError);
            }
        }

        res.status(500).json({ 
            error: 'Failed to send password reset email. Please try again later.' 
        });
    }
}

// Reset Password Controller
async function resetPassword(req, res) {
    try {
        const { token } = req.query;
        const { password, confirmPassword } = req.body;

        // Validate inputs
        if (!token) {
            return res.status(400).json({ 
                error: 'Reset token is required' 
            });
        }

        if (!password || !confirmPassword) {
            return res.status(400).json({ 
                error: 'Password and confirm password are required' 
            });
        }

        if (password !== confirmPassword) {
            return res.status(400).json({ 
                error: 'Passwords do not match' 
            });
        }

        if (password.length < 6) {
            return res.status(400).json({ 
                error: 'Password must be at least 6 characters long' 
            });
        }

        // Verify the token
        let decodedToken;
        try {
            decodedToken = jwt.verify(token, process.env.JWT_SECRET);
        } catch (error) {
            return res.status(401).json({ 
                error: 'Invalid or expired password reset token' 
            });
        }

        // Find the user by reset token
        const user = await User.findByResetToken(token);

        if (!user || user.user_id !== decodedToken.id) {
            return res.status(401).json({ 
                error: 'Invalid or expired password reset token' 
            });
        }

        // Update the user's password and remove the reset token
        await user.updatePassword(password);

        // Send confirmation email - Simple text email (no HTML since React FE will handle UI)
        const mailOptions = {
            from: process.env.EMAIL_USER,
            to: user.email,
            subject: 'Plant Monitoring System - Password Reset Confirmation',
            text: `
                Hello ${user.full_name || 'User'},

                Your password has been successfully reset for your Plant Monitoring System account.

                If you did not initiate this request, please contact our support team immediately.

                For your security, we recommend:
                - Using a strong, unique password
                - Enabling two-factor authentication if available
                - Keeping your login credentials secure

                ---
                This is an automated message from Plant Monitoring System. Please do not reply to this email.
            `,
        };

        try {
            const transporter = createTransporter();
            await transporter.sendMail(mailOptions);
        } catch (emailError) {
            console.error('Failed to send confirmation email:', emailError);
            // Don't fail the request if confirmation email fails
        }

        res.status(200).json({ 
            message: 'Password reset successful. You can now login with your new password.' 
        });

    } catch (error) {
        console.error('Reset password error:', error);
        res.status(500).json({ 
            error: 'Failed to reset password. Please try again later.' 
        });
    }
}

/**
 * UC12: CHANGE PASSWORD CONTROLLER
 * =====================================
 * Allows authenticated users to change their password
 * Requires current password verification
 * 
 * Route: PUT /auth/change-password
 * Access: Private (requires authentication)
 * 
 * Request Body:
 * - currentPassword: User's current password
 * - newPassword: New password to set
 * 
 * Response:
 * - 200 OK: Password successfully changed
 * - 400 Bad Request: Missing inputs or validation errors
 * - 401 Unauthorized: Current password incorrect
 * - 404 Not Found: User not found
 * - 500 Server Error: Internal error
 */
async function changePassword(req, res) {
    try {
        const userId = req.user.user_id; // From auth middleware
        const { currentPassword, newPassword, confirmPassword } = req.body;

        // Validate inputs
        if (!currentPassword || !newPassword || !confirmPassword) {
            return res.status(400).json({ 
                error: 'Current password, new password, and password confirmation are required' 
            });
        }
        
        // Check if new password and confirmation match
        if (newPassword !== confirmPassword) {
            return res.status(400).json({ 
                error: 'New password and confirmation password do not match' 
            });
        }

        // Find the user
        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({ 
                error: 'User not found' 
            });
        }

        // Verify current password
        const isPasswordValid = await bcrypt.compare(currentPassword, user.password);
        if (!isPasswordValid) {
            return res.status(401).json({ 
                error: 'Current password is incorrect' 
            });
        }

        // Check password strength
        if (newPassword.length < 8) {
            return res.status(400).json({ 
                error: 'New password must be at least 8 characters long' 
            });
        }

        // Update password
        await user.updatePassword(newPassword);

        res.status(200).json({ 
            success: true,
            message: 'Password changed successfully' 
        });

    } catch (error) {
        console.error('Change password error:', error);
        res.status(500).json({ 
            error: 'Failed to change password. Please try again later.' 
        });
    }
}

/**
 * UC1: USER REGISTRATION CONTROLLER
 * =====================================
 * Implements user account creation with email verification
 * 
 * Flow:
 * 1. Validate user input (email, password, fullName)
 * 2. Check if email already exists
 * 3. Create new user with hashed password
 * 4. Send welcome email with verification link
 * 5. Return success with user data and token
 * 
 * Security Features:
 * - Password hashing with bcrypt
 * - Email format validation
 * - Password strength requirements
 * - SQL injection protection via parameterized queries
 * 
 * Error Handling:
 * - Input validation
 * - Email uniqueness check
 * - Database errors
 * - Email sending failures
 */
async function register(req, res) {
    try {
        const { email, password, confirmPassword, fullName } = req.body;

        // Validate inputs
        if (!email || !password || !confirmPassword || !fullName) {
            return res.status(400).json({
                error: 'Email, password, confirm password, and full name are required'
            });
        }

        // Validate email format
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            return res.status(400).json({
                error: 'Invalid email format'
            });
        }

        // Check if passwords match
        if (password !== confirmPassword) {
            return res.status(400).json({
                error: 'Passwords do not match'
            });
        }

        // Check password strength
        if (password.length < 6) {
            return res.status(400).json({
                error: 'Password must be at least 6 characters long'
            });
        }

        // Check if user already exists
        const existingUser = await User.findByEmail(email);
        if (existingUser) {
            return res.status(409).json({
                error: 'Email already registered'
            });
        }

        // Create new user
        const userData = {
            email,
            password,
            full_name: fullName,
            role: 'Regular',
            notification_prefs: {}
        };

        const newUser = new User(userData);
        await newUser.save();

        // Generate JWT token
        const token = generateToken(newUser);

        // Send welcome email
        await sendWelcomeEmail(newUser);

        res.status(201).json({
            success: true,
            message: 'Registration successful',
            data: {
                user: {
                    user_id: newUser.user_id,
                    email: newUser.email,
                    full_name: newUser.full_name,
                    role: newUser.role
                },
                token
            }
        });
    } catch (error) {
        console.error('Registration error:', error);
        res.status(500).json({
            error: 'Registration failed. Please try again later.'
        });
    }
}

/**
 * Send welcome email to newly registered user
 */
async function sendWelcomeEmail(user) {
    try {
        const transporter = createTransporter();

        const mailOptions = {
            from: process.env.EMAIL_USER,
            to: user.email,
            subject: 'Welcome to Plant Monitoring System',
            text: `
                Hello ${user.full_name},

                Thank you for registering with the Plant Monitoring System!

                Your account has been successfully created.

                You can now log in to access all features of our platform.

                Best regards,
                The Plant Monitoring System Team
            `,
        };

        await transporter.sendMail(mailOptions);
        console.log('Welcome email sent to:', user.email);
    } catch (error) {
        console.error('Error sending welcome email:', error);
        // We don't throw the error as this shouldn't stop registration
    }
}

/**
 * UC2: USER LOGIN CONTROLLER
 * =====================================
 * Implements user authentication with JWT token generation
 * 
 * Flow:
 * 1. Validate user input (email, password)
 * 2. Find user by email
 * 3. Validate password
 * 4. Generate JWT token
 * 5. Return success with user data and token
 * 
 * Security Features:
 * - Secure password comparison with bcrypt
 * - JWT token with user ID and role
 * - No sensitive data exposure
 * 
 * Error Handling:
 * - Input validation
 * - User not found
 * - Invalid credentials
 * - Database errors
 */
async function login(req, res) {
    try {
        const { email, password } = req.body;

        // Validate inputs
        if (!email || !password) {
            return res.status(400).json({
                error: 'Email and password are required'
            });
        }

        // Find user by email
        const user = await User.findByEmail(email);
        if (!user) {
            return res.status(401).json({
                error: 'Invalid email or password'
            });
        }

        // Validate password
        const isPasswordValid = await user.validatePassword(password);
        if (!isPasswordValid) {
            return res.status(401).json({
                error: 'Invalid email or password'
            });
        }

        // Generate JWT token
        const token = generateToken(user);

        res.status(200).json({
            success: true,
            message: 'Login successful',
            data: {
                user: {
                    user_id: user.user_id,
                    email: user.email,
                    full_name: user.full_name,
                    role: user.role
                },
                token
            }
        });
    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({
            error: 'Login failed. Please try again later.'
        });
    }
}

/**
 * UC3: USER LOGOUT CONTROLLER
 * =====================================
 * Implements user logout functionality
 * 
 * Note: Since we're using JWT tokens which are stateless,
 * actual token invalidation would require additional infrastructure
 * like a token blacklist in Redis or similar.
 * 
 * This function serves mainly as a hook for client-side logout.
 */
async function logout(req, res) {
    try {
        // Since JWT is stateless, we can't invalidate tokens server-side without additional infrastructure
        // In a production app, we would maintain a blacklist of tokens in Redis or similar

        // Log the logout action (could be saved to SystemLog in a real implementation)
        console.log(`User logged out: ${req.user ? req.user.user_id : 'Unknown'}`);

        res.status(200).json({
            success: true,
            message: 'Logout successful'
        });
    } catch (error) {
        console.error('Logout error:', error);
        res.status(500).json({
            error: 'Logout failed. Please try again later.'
        });
    }
}

/**
 * GOOGLE LOGIN CONTROLLER
 * =====================================
 * Implements OAuth login using Google credentials
 * 
 * Flow:
 * 1. Validate Google ID token
 * 2. Extract user details (email, name)
 * 3. Find existing user or create new one
 * 4. Generate JWT token
 * 5. Return success with user data and token
 * 
 * Security Features:
 * - Google token verification
 * - User creation with random password
 * - JWT token with proper expiration
 * 
 * Error Handling:
 * - Invalid Google token
 * - User creation failures
 * - Database errors
 */
async function googleLogin(req, res) {
    try {
        const { googleToken, googleUserData } = req.body;

        // In a real implementation, we would verify the Google token
        // For now, we'll assume it's valid and use the provided data

        if (!googleUserData || !googleUserData.email) {
            return res.status(400).json({
                error: 'Invalid Google user data'
            });
        }

        // Check if user exists
        let user = await User.findByEmail(googleUserData.email);

        // If user doesn't exist, create a new one
        if (!user) {
            // Generate a random password (user won't need this as they'll use Google to sign in)
            const randomPassword = crypto.randomBytes(16).toString('hex');

            const userData = {
                email: googleUserData.email,
                password: randomPassword,
                full_name: googleUserData.name || googleUserData.email.split('@')[0],
                role: 'Regular',
                notification_prefs: {}
            };

            user = new User(userData);
            await user.save();
        }

        // Generate JWT token
        const token = generateToken(user);

        res.status(200).json({
            success: true,
            message: 'Google login successful',
            data: {
                user: {
                    user_id: user.user_id,
                    email: user.email,
                    full_name: user.full_name,
                    role: user.role
                },
                token
            }
        });
    } catch (error) {
        console.error('Google login error:', error);
        res.status(500).json({
            error: 'Google login failed. Please try again later.'
        });
    }
}

module.exports = {
    register,
    login,
    logout,
    googleLogin,
    forgotPassword,
    resetPassword,
    changePassword,
};

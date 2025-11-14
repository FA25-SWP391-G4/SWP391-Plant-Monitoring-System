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
const nodemailer = require('nodemailer');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const bcrypt = require('bcryptjs');
const SystemLog = require('../models/SystemLog');
const { generateUUID, isValidUUID } = require('../utils/uuidGenerator');
const emailService = require('../services/emailService');
const { profile } = require('console');

// Create email transporter
const createTransporter = () => {
    // Log email configuration
    console.log('[EMAIL DEBUG] Creating email transporter with config:', {
        service: process.env.EMAIL_SERVICE || 'gmail',
        host: process.env.EMAIL_HOST || 'smtp.gmail.com',
        port: process.env.EMAIL_PORT || 587,
        user: process.env.EMAIL_USER ? `${process.env.EMAIL_USER.substring(0, 3)}...` : 'not set',
        pass: process.env.EMAIL_PASS ? 'set (masked)' : 'not set',
        secure: process.env.EMAIL_SECURE === 'false' ? false : true
    });
    
    // Check for missing configuration
    if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
        console.error('[EMAIL DEBUG] WARNING: Missing email configuration. EMAIL_USER or EMAIL_PASS is not set.');
    }
    
    // Use direct SMTP configuration instead of service
    const transporterConfig = {
        host: process.env.EMAIL_HOST || 'smtp.gmail.com',
        port: 465,
        secure: true, // MUST be false for port 587, true only for port 465
        auth: {
            user: process.env.EMAIL_USER,
            pass: process.env.EMAIL_PASS,
        },
        tls: {
            // Do not fail on invalid certs
            rejectUnauthorized: false
        },
        debug: true, // Enable debug logging
        logger: true // Log info to console
    };
    
    // Fallback to service-based config if explicitly set
    if (process.env.EMAIL_USE_SERVICE === 'true') {
        console.log('[EMAIL DEBUG] Using service-based configuration');
        return nodemailer.createTransport({
            service: process.env.EMAIL_SERVICE || 'gmail',
            auth: {
                user: process.env.EMAIL_USER,
                pass: process.env.EMAIL_PASS,
            },
            debug: true,
            logger: true
        });
    }
    
    console.log('[EMAIL DEBUG] Using direct SMTP configuration');
    return nodemailer.createTransport(transporterConfig);
};

/**
 * Generate JWT token for authentication
 * @param {Object} user - User object with UUID user_id
 * @returns {String} JWT token
 * 
 * UPDATED FOR UUID MIGRATION:
 * - user.user_id is now UUID (not integer)
 * - Validates UUID format before token generation
 * - Logs UUID for debugging authentication issues
 */
const generateToken = (user) => {
    // Validate UUID format
    if (!isValidUUID(user.user_id)) {
        console.error('[AUTH] Invalid user_id UUID format:', user.user_id);
        throw new Error('Invalid user ID format');
    }

    const fullName = user.given_name && user.family_name
        ? `${user.given_name} ${user.family_name}`
        : user.family_name || user.given_name || '';

    console.log('[AUTH] Generating JWT token for user UUID:', user.user_id);
        
    return jwt.sign(
        { 
            user_id: user.user_id,  // Now UUID instead of integer
            email: user.email, 
            role: user.role,
            family_name: user.family_name,
            given_name: user.given_name,
            full_name: fullName
        },
        process.env.JWT_SECRET,
        { expiresIn: '1d' }
    );
};

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
        const { email, password, google_id, given_name, family_name, phoneNumber, profile_picture, newsletter } = req.body;
        
        // Initialize userData with defaults - use snake_case for consistency
        let userData = {
            email,
            password,
            family_name: family_name,
            given_name: given_name,
            role: 'Regular',
            google_id: google_id || null,
            phone_number: phoneNumber || null,
            profile_picture: profile_picture || null,
            notification_prefs: newsletter ?  true : false
        };
        
        console.log(`[REGISTER] Registration attempt for email: ${email}, google_id: ${userData.google_id || 'none'}`);
        console.log(`[REGISTER] Received data:`, JSON.stringify(req.body, null, 2));

        // Check if user already exists
        try {
            const existingUser = await User.findByEmail(userData.email);
            if (existingUser) {
                console.log(`[REGISTER] Email already registered: ${userData.email}`);
                return res.status(409).json({
                    success: false,
                    message: 'Email already registered'
                });
            }
        } catch (lookupError) {
            console.error(`[REGISTER] Error checking for existing user: ${lookupError.message}`);
            // Continue with registration attempt
        }

        console.log(`[REGISTER] Creating new user with email: ${userData.email}, given name: ${userData.given_name || 'none'}, google_id: ${userData.google_id || 'none'}`);

        // Save with explicit error handling
        try {
            const newUser = new User(userData);
            const savedUser = await newUser.save();
            console.log(`[REGISTER] User successfully saved with ID: ${savedUser.user_id}`);

            // Generate JWT token
            const token = generateToken(savedUser);

            // Send welcome email asynchronously (don't await to avoid blocking)
            sendWelcomeEmail(savedUser).catch(emailError => {
                console.error('[REGISTER] Welcome email could not be sent:', emailError.message);
            });

            return res.status(201).json({
                success: true,
                message: 'Registration successful',
                data: {
                    user: {
                        user_id: savedUser.user_id,
                        email: savedUser.email,
                        family_name: savedUser.family_name,
                        given_name: savedUser.given_name,
                        role: savedUser.role

                    },
                    token
                }
            });
        } catch (saveError) {
            console.error(`[REGISTER] Database error during user creation: ${saveError.message}`);

            // Handle specific error cases
            if (saveError.status === 409 || saveError.code === '23505') {
                return res.status(409).json({
                    success: false,
                    message: 'Email already registered'
                });
            }

            throw saveError; // Re-throw to be caught by outer try-catch
        }
    } catch (error) {
        console.error('[REGISTER] Registration error:', error);

        return res.status(500).json({
            success: false,
            message: 'Registration failed. Please try again later.'
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
                Hello ${user.family_name},

                Thank you for registering with the Plant Monitoring System!

                Your account has been successfully created.

                You can now log in to access all features of our platform.

                Best regards,
                The Plant Monitoring System Team
            `,
        };

        console.log(`[EMAIL DEBUG] Attempting to send welcome email to: ${user.email}`);
        console.log('[EMAIL DEBUG] Welcome email transporter created successfully');
        
        const info = await transporter.sendMail(mailOptions);
        console.log(`[EMAIL DEBUG] Welcome email sent successfully: ${JSON.stringify(info)}`);
    } catch (error) {
        console.error('[EMAIL DEBUG] Error sending welcome email:', error.message);
        console.error('[EMAIL DEBUG] Full error:', error);
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
    console.log('\n=== LOGIN CONTROLLER START ===');
    console.log('[LOGIN] Request method:', req.method);
    console.log('[LOGIN] Request URL:', req.url);
    console.log('[LOGIN] Request headers:', JSON.stringify(req.headers, null, 2));
    console.log('[LOGIN] Request body:', JSON.stringify(req.body, null, 2));
    console.log('[LOGIN] Session ID:', req.sessionID);
    console.log('[LOGIN] Session data:', JSON.stringify(req.session, null, 2));
    
    try {
        const { email, password, googleId, refreshToken, loginMethod } = req.body;
        
        console.log(`[LOGIN] Login attempt details:`);
        console.log(`  - Email: ${email}`);
        console.log(`  - Password: ${password ? '[PROVIDED]' : '[NOT PROVIDED]'}`);
        console.log(`  - Google ID: ${googleId || '[NOT PROVIDED]'}`);
        console.log(`  - Refresh token: ${refreshToken ? '[PROVIDED]' : '[NOT PROVIDED]'}`);
        console.log(`  - Login method: ${loginMethod || 'password'}`);

        // Validate inputs for regular login
        if (!googleId && (!email || !password)) {
            console.log('[LOGIN] Validation failed: Missing email or password for regular login');
            return res.status(400).json({
                error: 'Email and password are required'
            });
        }

        // Find user by email
        let user = await User.findByEmail(email);
        if (!user) {
            console.log(`[LOGIN] User not found: ${email}`);
            
            // If this is a Google login and user doesn't exist, redirect to registration
            if (loginMethod === 'google') {
                console.log('[LOGIN] New Google user, redirecting to registration');
                const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
                
                // Redirect to registration page with Google data indicator
                return res.redirect(`${frontendUrl}/register?error=account_not_found&email=${encodeURIComponent(email)}&google=true`);
            }
            
            return res.status(401).json({
                error: 'Invalid email or password'
            });
        }

        // Handle Google login
        if (loginMethod === 'google' || googleId) {
            console.log(`[LOGIN] Google login attempt for user: ${email}`);
            
            if (user.google_id) {
                // User already has Google ID - verify it matches
                console.log('[GOOGLE AUTH] User already has Google ID, verifying match');
                
                if (googleId && user.google_id !== googleId) {
                    console.log('[GOOGLE AUTH] Google ID mismatch');
                    
                    // For OAuth flow, redirect to frontend with error
                    if (loginMethod === 'google') {
                        const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
                        return res.redirect(`${frontendUrl}/login?error=google_id_mismatch`);
                    }
                    
                    // For API calls, return JSON
                    return res.status(401).json({
                        error: 'Google account mismatch'
                    });
                }
                
                // Store refresh token if provided
                if (refreshToken) {
                    await user.update({
                        google_refresh_token: refreshToken
                    });
                    
                    // Refresh user object to get updated data
                    user = await User.findById(user.user_id);
                }
            } else {
                // User exists but doesn't have Google ID - link the account
                console.log('[GOOGLE AUTH] User exists but does not have Google ID, linking account');
                
                try {
                    // Update user with Google ID and refresh token
                    await user.update({
                        google_id: googleId,
                        google_refresh_token: refreshToken
                    });
                    
                    console.log('[GOOGLE AUTH] Successfully linked Google account to existing user');
                    
                    // Refresh user object to get updated data
                    user = await User.findById(user.user_id);
                } catch (error) {
                    console.error('[GOOGLE AUTH] Error linking Google account:', error);
                    
                    // For OAuth flow, redirect to frontend with error
                    if (loginMethod === 'google') {
                        const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
                        return res.redirect(`${frontendUrl}/login?error=linking_failed`);
                    }
                    
                    // For API calls, return JSON
                    return res.status(500).json({
                        error: 'Failed to link Google account'
                    });
                }
            }
        } else {
            // Regular password login
            console.log(`[LOGIN] Regular login attempt for user: ${email}`);

            // Validate password
            const isPasswordValid = await user.validatePassword(password);
            if (!isPasswordValid) {
                console.log(`[LOGIN] Invalid password for user: ${email}`);
                return res.status(401).json({
                    error: 'Invalid email or password'
                });
            }
        }

        // Generate JWT token
        const token = generateToken(user);
        console.log(`[LOGIN] Success for user: ${user.email}`);

        // Include both name fields for proper display
        const fullName = user.given_name && user.family_name
            ? `${user.given_name} ${user.family_name}`
            : user.family_name || user.given_name || 'User';

        console.log(`[LOGIN] User name fields: given_name=${user.given_name}, family_name=${user.family_name}, fullName=${fullName}`);

        // Create user response object with consistent structure
        const userData = {
            id: user.user_id, // Add id field for frontend compatibility
            user_id: user.user_id,
            email: user.email,
            family_name: user.family_name,
            given_name: user.given_name,
            full_name: fullName,
            role: user.role,
            isPremium: user.role === 'Premium' || user.role === 'Admin',
            profile_picture: user.profile_picture,
            language: user.language || 'en',
            created_at: user.created_at
        };
        
        console.log(`[LOGIN] User data being sent to client:`, JSON.stringify(userData));

        // For Google login via OAuth controller, redirect to frontend callback
        if (loginMethod === 'google') {
            const redirectUrl = req.session.redirectAfterLogin || '/dashboard';
            const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
            
            console.log(`[LOGIN] Google OAuth flow - preparing redirect to frontend`);
            console.log(`[LOGIN] Environment variables:`);
            console.log(`  - FRONTEND_URL: ${process.env.FRONTEND_URL}`);
            console.log(`  - NODE_ENV: ${process.env.NODE_ENV}`);
            console.log(`[LOGIN] Computed values:`);
            console.log(`  - Frontend URL: ${frontendUrl}`);
            console.log(`  - Redirect destination: ${redirectUrl}`);
            console.log(`  - Token length: ${token.length}`);
            console.log(`  - Token preview: ${token.substring(0, 50)}...`);
            
            // Set backend cookies BEFORE redirecting (important for cookie-based auth)
            const cookieOptions = {
                secure: process.env.NODE_ENV === 'production',
                sameSite: 'lax',
                path: '/',
                maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
                domain: process.env.NODE_ENV === 'production' ? process.env.COOKIE_DOMAIN : 'localhost'
            };
            
            console.log(`[LOGIN] Setting cookies with options:`, cookieOptions);
            
            // HttpOnly cookie for server-side auth (secure)
            res.cookie('token', token, {
                ...cookieOptions,
                httpOnly: true
            });
            
            // Non-HttpOnly cookie for frontend JS access
            res.cookie('token_client', token, {
                ...cookieOptions,
                httpOnly: false
            });
            
            console.log(`[LOGIN] ✅ Both cookies set successfully for Google auth user`);
            
            // Instead of passing token in URL (less secure), use a session-based approach
            // Store temporary auth success in session
            req.session.authSuccess = {
                token: token,
                userData: userData,
                timestamp: Date.now()
            };
            
            // Construct redirect URL without token in query string
            const callbackUrl = `${frontendUrl}/auth/callback?success=true&redirect=${encodeURIComponent(redirectUrl)}`;
            console.log(`[LOGIN] Final redirect URL: ${callbackUrl}`);
            console.log(`[LOGIN] Redirect URL length: ${callbackUrl.length}`);
            
            // Use a proper 302 redirect instead of default redirect
            console.log(`[LOGIN] ✅ Executing redirect to frontend callback...`);
            res.writeHead(302, { 'Location': callbackUrl });
            res.end();
            return;
        }

        // For regular login, send JSON response with cookie
        // Set TWO cookies: one HttpOnly for security, one readable by frontend JS
        const cookieOptions = {
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'lax',
            path: '/',
            maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
            domain: process.env.NODE_ENV === 'production' ? process.env.COOKIE_DOMAIN : 'localhost'
        };
        
        // HttpOnly cookie for server-side auth (secure)
        res.cookie('token', token, {
            ...cookieOptions,
            httpOnly: true
        });
        
        // Non-HttpOnly cookie for frontend JS access
        res.cookie('token_client', token, {
            ...cookieOptions,
            httpOnly: false // Frontend can read this
        });
        
        res.status(200).json({
            success: true,
            message: 'Login successful', 
            data: {
                user: userData,
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
        console.log(`[PASSWORD RESET] Received request for email: ${email}`);

        // Validate email input
        if (!email) {
            return res.status(400).json({ 
                success: false,
                message: 'Email is required' 
            });
        }

        // Validate email format
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            return res.status(400).json({ 
                success: false,
                message: 'Please provide a valid email address' 
            });
        }

        // Find the user by email
        const user = await User.findByEmail(email);

        // Check if user exists
        if (!user) {
            console.log(`[PASSWORD RESET] Email not registered: ${email}`);
            // Return error for non-existent email
            return res.status(404).json({
                success: false,
                message: 'No account found with this email address. Please check the email or register first.'
            });
        }

        // Generate a password reset token
        const resetToken = user.createPasswordResetToken();
        await user.updatePasswordResetFields(resetToken, user.passwordResetExpires);
        console.log(`[PASSWORD RESET] Token generated for user: ${user.email}`);

        // Create password reset URL
        const resetUrl = `${process.env.FRONTEND_URL}/reset-password?token=${resetToken}`;
        console.log(`[PASSWORD RESET] Generated reset URL: ${resetUrl}`);
        console.log(`[PASSWORD RESET] FRONTEND_URL: ${process.env.FRONTEND_URL}`);
        console.log(`[PASSWORD RESET] Reset token: ${resetToken}`);

        // Email options with HTML template
        const mailOptions = {
            to: user.email,
            subject: 'Plant Monitoring System - Password Reset Request',
            text: `
                Hello ${user.family_name || 'User'},

                You requested a password reset for your Plant Monitoring System account.

                Please use this link to reset your password: ${resetUrl}

                This link will expire in 1 hour.

                If you didn't request this password reset, please ignore this email.

                ---
                This is an automated message from Plant Monitoring System. Please do not reply to this email.
            `,
            html: `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 5px;">
                    <h2 style="color: #4CAF50;">Password Reset Request</h2>
                    <p>Hello ${user.family_name || 'User'},</p>
                    <p>You requested a password reset for your Plant Monitoring System account.</p>
                    <p>Please click the button below to reset your password:</p>
                    <p style="text-align: center;">
                        <a href="${resetUrl}" style="display: inline-block; background-color: #4CAF50; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; font-weight: bold;" target="_blank">Reset Password</a>
                    </p>
                    <p>If the button above doesn't work, copy and paste this link into your browser:</p>
                    <p style="word-break: break-all; background-color: #f5f5f5; padding: 10px; border-radius: 4px; font-family: monospace; font-size: 12px;">
                        <a href="${resetUrl}" target="_blank">${resetUrl}</a>
                    </p>
                    <p>This link will expire in 1 hour.</p>
                    <p>If you didn't request this password reset, please ignore this email.</p>
                    <hr style="border: none; border-top: 1px solid #e0e0e0; margin: 20px 0;">
                    <p style="font-size: 12px; color: #666;">This is an automated message from Plant Monitoring System. Please do not reply to this email.</p>
                </div>
            `
        };

        try {
            console.log(`[PASSWORD RESET] Attempting to send email to: ${user.email}`);

            // Test email connection before sending
            const isConnected = await emailService.verifyConnection();
            if (!isConnected) {
                throw new Error('SMTP connection failed - Email service is not available');
            }

            // Use the emailService to send the email
            const emailResult = await emailService.sendEmail(mailOptions);
            console.log(`[PASSWORD RESET] Email sent with ID: ${emailResult.messageId}`);

            // Log success
            await SystemLog.info('authController', 'forgotPassword', `Password reset email sent to ${user.email}`);

            res.status(200).json({
                success: true,
                message: 'Password reset email sent successfully',
                data: {
                email: user.email,
                    expiresIn: '1 hour'
                }
            });
        } catch (emailError) {
            // Log the email sending error with detailed diagnostics
            console.error(`[PASSWORD RESET] Email sending failed: ${emailError.message}`);

            // Add specific error diagnostics
            if (emailError.code === 'ECONNECTION' || emailError.code === 'ETIMEDOUT') {
                console.error('[PASSWORD RESET] Connection issue - Check network/firewall settings');
            } else if (emailError.code === 'EAUTH') {
                console.error('[PASSWORD RESET] Authentication failed - Check email credentials');
            }

            await SystemLog.error('authController', 'forgotPassword', `Failed to send password reset email: ${emailError.message}`);

            res.status(500).json({
                success: false,
                message: 'Failed to send password reset email. Please try again later or contact support.'
            });
        }
    } catch (error) {
        console.error('Password reset error:', error);
        await SystemLog.error('authController', 'forgotPassword', error.message);

        res.status(500).json({
            success: false,
            message: 'An error occurred during the password reset process'
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

        // Find the user with the given token
        const user = await User.findByResetToken(token);

        if (!user || user.user_id !== decodedToken.id) {
            return res.status(401).json({ 
                error: 'Invalid or expired password reset token' 
            });
        }

        // Update the user's password and remove the reset token
        await user.updatePassword(password);

        // Send confirmation email with HTML template
        const mailOptions = {
            from: process.env.EMAIL_USER,
            to: user.email,
            subject: 'Plant Monitoring System - Password Reset Confirmation',
            text: `
                Hello ${user.family_name || 'User'},

                Your password has been successfully reset for your Plant Monitoring System account.

                If you did not initiate this request, please contact our support team immediately.

                For your security, we recommend:
                - Using a strong, unique password
                - Enabling two-factor authentication if available
                - Keeping your login credentials secure

                ---
                This is an automated message from Plant Monitoring System. Please do not reply to this email.
            `,
            html: `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 5px;">
                    <h2 style="color: #4CAF50;">Password Reset Successful</h2>
                    <p>Hello ${user.family_name || 'User'},</p>
                    <p>Your password has been successfully reset for your Plant Monitoring System account.</p>
                    <p>If you did not initiate this request, please contact our support team immediately.</p>
                    <div style="background-color: #f9f9f9; padding: 15px; border-left: 4px solid #4CAF50; margin: 15px 0;">
                        <p><strong>For your security, we recommend:</strong></p>
                        <ul>
                            <li>Using a strong, unique password</li>
                            <li>Enabling two-factor authentication if available</li>
                            <li>Keeping your login credentials secure</li>
                        </ul>
                    </div>
                    <hr style="border: none; border-top: 1px solid #e0e0e0; margin: 20px 0;">
                    <p style="font-size: 12px; color: #666;">This is an automated message from Plant Monitoring System. Please do not reply to this email.</p>
                </div>
            `
        };

        try {
            console.log(`[EMAIL DEBUG] Attempting to send password reset confirmation email to: ${user.email}`);
            const transporter = createTransporter();
            console.log('[EMAIL DEBUG] Reset confirmation transporter created successfully');
            
            const info = await transporter.sendMail(mailOptions);
            console.log(`[EMAIL DEBUG] Reset confirmation email sent successfully: ${JSON.stringify(info)}`);
        } catch (emailError) {
            console.error('[EMAIL DEBUG] Failed to send confirmation email:', emailError);
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

/**
 * Get current authenticated user profile
 * Used by client to check authentication status
 */
async function getCurrentUser(req, res) {
    console.log('\n=== GET CURRENT USER START ===');
    console.log('[GET CURRENT USER] Request headers:', JSON.stringify(req.headers, null, 2));
    console.log('[GET CURRENT USER] Request cookies:', req.headers.cookie || 'None');
    console.log('[GET CURRENT USER] Auth middleware user:', req.user ? 'Present' : 'Missing');
    
    try {
        // User is attached by the auth middleware
        if (!req.user) {
            console.log('[GET CURRENT USER] ❌ No user found - not authenticated');
            return res.status(401).json({
                success: false,
                error: 'Authentication required. No token provided.'
            });
        }
        
        console.log('[GET CURRENT USER] ✅ User found via auth middleware:');
        console.log('  - User ID:', req.user.user_id);
        console.log('  - Email:', req.user.email);
        console.log('  - Role:', req.user.role);
        console.log('  - Given name:', req.user.given_name || req.user.given_name);
        console.log('  - Family name:', req.user.family_name || req.user.family_name);
        
        // Return the user data without sensitive fields with consistent naming
        const userData = {
            id: req.user.user_id, // Add id field for frontend compatibility
            user_id: req.user.user_id,
            email: req.user.email,
            given_name: req.user.given_name || req.user.given_name,
            family_name: req.user.family_name || req.user.family_name,
            full_name: req.user.full_name || `${req.user.given_name || req.user.given_name || ''} ${req.user.family_name || req.user.family_name || ''}`.trim(),
            role: req.user.role,
            isPremium: req.user.role === 'Premium' || req.user.role === 'Admin',
            profile_picture: req.user.profile_picture,
            language: req.user.language || 'en',
            created_at: req.user.created_at
        };
        
        console.log('[GET CURRENT USER] ✅ Returning user data:', userData);
        
        res.json({
            success: true,
            user: userData
        });
    } catch (error) {
        console.error('[AUTH] Get current user error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to get user profile'
        });
    }
}

async function linkGoogleAccount(req, res) {
    try {
        const userId = req.user.user_id; // From auth middleware
        const { googleId, googleRefreshToken } = req.body;

        // Find the user
        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({
                success: false,
                error: 'User not found'
            });
        }

        // Update user with Google information
        user.google_id = googleId;
        user.google_refresh_token = googleRefreshToken;

        await user.save();

        res.status(200).json({
            success: true,
            message: 'Google account linked successfully'
        });
    } catch (error) {
        console.error('[AUTH] Link Google account error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to link Google account'
        });
    }
}

async function unlinkGoogleAccount(req, res) {
    try {
        const userId = req.user.user_id; // From auth middleware
        
        // Find the user
        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({ 
                success: false,
                error: 'User not found' 
            });
        }
        
        // Check if user has a password set (required for unlinking)
        if (!user.password) {
            return res.status(400).json({
                success: false,
                error: 'You must set a password before unlinking your Google account'
            });
        }
        
        // Check if user has a Google account linked
        if (!user.google_id) {
            return res.status(400).json({
                success: false,
                error: 'No Google account is linked to your account'
            });
        }
        
        // Update user to remove Google information
        const updateData = {
            google_id: null,
            google_refresh_token: null
        };
        
        await user.update(updateData);
        
        res.status(200).json({
            success: true,
            message: 'Google account unlinked successfully'
        });
    } catch (error) {
        console.error('[AUTH] Unlink Google account error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to unlink Google account'
        });
    }
}

/**
 * Refresh JWT token with updated user data
 * Used after user upgrades (premium/ultimate) to get new token with updated role
 */
const refreshToken = async (req, res) => {
    try {
        console.log('[AUTH] Token refresh requested for user:', req.user.user_id);
        
        // Get fresh user data from database
        const user = await User.findById(req.user.user_id);
        
        if (!user) {
            console.log('[AUTH] User not found during token refresh:', req.user.user_id);
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }

        // Generate new token with updated user data
        const newToken = generateToken(user);
        
        console.log('[AUTH] Generated new token for user:', req.user.user_id);
        
        res.json({
            success: true,
            token: newToken,
            user: {
                user_id: user.user_id,
                email: user.email,
                given_name: user.given_name,
                family_name: user.family_name,
                role: user.role,
                subscription_type: user.subscription_type,
                subscription_status: user.subscription_status,
                created_at: user.created_at
            }
        });

    } catch (error) {
        console.error('[AUTH] Refresh token error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to refresh token'
        });
    }
};

module.exports = {
    register,
    login,
    logout,
    forgotPassword,
    resetPassword,
    changePassword,
    generateToken,
    getCurrentUser,
    linkGoogleAccount,
    unlinkGoogleAccount,
    refreshToken
};

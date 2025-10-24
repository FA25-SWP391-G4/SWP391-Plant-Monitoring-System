const express = require('express');
const router = express.Router();
const { 
    register,
    login,
    logout,
    forgotPassword, 
    resetPassword,
    changePassword,
    getCurrentUser,
    linkGoogleAccount,
    unlinkGoogleAccount
} = require('../controllers/authController');
const { authMiddleware } = require('../middlewares/authMiddleware');
const { googleAuthCallback } = require('../controllers/googleAuthController');

/**
 * ============================================================================
 * AUTHENTICATION ROUTES - COMPREHENSIVE USE CASE COVERAGE
 * ============================================================================
 * 
 * 📋 ALL 31 USE CASES MAPPED TO IMPLEMENTATION ROADMAP
 * 
 * ✅ IMPLEMENTED:
 * - UC11: Reset Password (Complete with email + JWT token validation)
 * 
 * 📝 BACKEND TASKS ASSIGNED TO OTHER TEAM MEMBER:
 * - UC1: User Registration (Backend API + email verification)
 * - UC2: User Login (Backend JWT authentication + session management) 
 * - UC3: User Logout (Backend session cleanup + token management)
 * 
 * 🔄 BACKEND IMPLEMENTATION NEEDED:
 * 
 * 👤 REGULAR USER USE CASES (12):
 * - UC1: User Registration [Other Backend Member] - POST /auth/register
 *   └── Account creation, email verification, input validation
 *   └── Models: User.save() method ready, email templates needed
 * - UC2: User Login [Other Backend Member] - POST /auth/login  
 *   └── JWT authentication, session management, rate limiting
 *   └── Models: User.validatePassword() method ready, JWT middleware needed
 * - UC3: User Logout [Other Backend Member] - POST /auth/logout
 *   └── Session termination, token blacklisting, cleanup
 *   └── Models: SystemLog for audit, token management strategy
 * - UC4: View Plant Monitoring Dashboard [Dashboard API] - Real-time sensor data
 * - UC5: Manual Watering [IoT API] - Pump control via MQTT/HTTP
 * - UC6: Configure Auto-Watering Schedule [Scheduling API] - Cron-based automation
 * - UC7: Toggle Auto-Watering Mode [Plant API] - Enable/disable automatic watering
 * - UC8: View Watering History [History API] - Query logs with date filters
 * - UC9: Search Watering History [Search API] - Advanced filtering capabilities
 * - UC10: Receive Real-Time Notifications [WebSocket/Push] - Alert system
 * - UC11: Reset Password ✅ - Complete password recovery flow
 * - UC12: Change Password [Auth API] - Secure password updates
 * - UC13: Manage Profile [Profile API] - User info management
 * 
 * 💎 PREMIUM USER USE CASES (11):
 * - UC14: Manage Multiple Plant Zones [Zone API] - Multi-plant management
 * - UC15: View Detailed Plant Health Report [Analytics API] - Advanced reporting
 * - UC16: Configure Advanced Sensor Thresholds [Settings API] - Custom thresholds
 * - UC17: Search Plant Health Reports [Search API] - Report filtering
 * - UC18: Customize Dashboard [UI API] - Personalized interface
 * - UC19: Upgrade to Premium [Payment API] - Subscription management
 * - UC20: Predict Watering Needs (AI) [AI API] - ML-based predictions
 * - UC21: Analyze Plant Health (AI) [AI API] - Health analysis algorithms
 * - UC22: Make Payment for Premium [Payment Gateway] - Stripe/PayPal integration
 * - UC23: Interact with AI Chatbot [Chatbot API] - NLP plant assistance
 * - UC24: [Premium Feature Extension] [Various APIs] - Additional premium features
 * 
 * 🔧 ADMIN USE CASES (8):
 * - UC25: Manage Users [Admin API] - User CRUD operations with bulk actions
 * - UC26: View System-Wide Reports [Admin Reports API] - Global analytics
 * - UC27: Configure Global Settings [Config API] - System-wide configurations
 * - UC28: Monitor System Logs [Logging API] - Error tracking and audit logs
 * - UC29: Backup and Restore Data [Backup API] - Data management utilities
 * - UC30: Manage AI Models [AI Admin API] - Model training and deployment
 * - UC31: Optimize Watering Schedules (AI) [AI Optimization API] - Schedule optimization
 * - UC32: Manage Multi-Language Settings [i18n API] - Internationalization
 * 
 * 🤖 IOT SYSTEM USE CASES (3):
 * - UC29: Collect and Send Sensor Data [IoT Ingestion API] - Real-time data collection
 * - UC30: Auto-Water Based on Sensors [IoT Control API] - Automated watering logic
 * - UC31: Handle Hardware Failure [IoT Monitoring API] - Error detection and recovery
 * 
 * TECHNICAL STACK REQUIREMENTS:
 * - Authentication: JWT, bcrypt, nodemailer (email verification)
 * - Real-time: WebSocket.io, Server-Sent Events (live updates)
 * - IoT Communication: MQTT broker, HTTP REST APIs (device control)
 * - AI/ML: TensorFlow.js, Python microservices (predictions)
 * - Payments: Stripe SDK, webhook handling (subscription billing)
 * - Analytics: Chart.js, D3.js, custom reporting (data visualization)
 * - Admin Tools: Bulk operations, audit logging, system monitoring
 * - Database: PostgreSQL with proper indexing and relationships
 * 
 * SECURITY CONSIDERATIONS:
 * - Role-based access control (Regular, Premium, Admin)
 * - API rate limiting and throttling
 * - Input validation and sanitization
 * - HTTPS only, secure headers
 * - Device authentication keys
 * - Payment data encryption (PCI compliance)
 * - Admin operation audit trails
 * 
 * DEVELOPMENT PHASES:
 * Phase 1: Core user features (UC1-13) - Authentication & basic functionality
 * Phase 2: Premium features (UC14-24) - Advanced analytics & AI integration  
 * Phase 3: Admin tools (UC25-32) - Management & monitoring capabilities
 * Phase 4: IoT integration (UC29-31) - Hardware communication & automation
 */

// ✅ UC11: Reset Password - Forgot password endpoint
// Allows users to request password reset email when they forget their password
// POST /auth/forgot-password
router.post('/forgot-password', forgotPassword);

// ✅ UC11: Reset Password - Reset password with token endpoint  
// Allows users to set new password using token from email
// POST /auth/reset-password?token=JWT_TOKEN
router.post('/reset-password', resetPassword);

// UC1: User Registration
router.post('/register', register);

// UC2: User Login
router.post('/login', login);

// UC2: Google Login (alternate authentication method)
router.post('/google-login', googleAuthCallback);

// UC3: User Logout
router.post('/logout', authMiddleware, logout);

// Get current authenticated user profile
router.get('/me', authMiddleware, getCurrentUser);

// UC12: Change Password - Authenticated endpoint
// Protected by authMiddleware - requires valid JWT token
router.put('/change-password', authMiddleware, changePassword);

// Link Google account to existing user account
// Protected by authMiddleware - requires valid JWT token
router.post('/link-google-account', authMiddleware, linkGoogleAccount);

// Unlink Google account from existing user account
// Protected by authMiddleware - requires valid JWT token
router.post('/unlink-google-account', authMiddleware, unlinkGoogleAccount);

// UC13: Manage Profile - Moved to userController/userRoutes for better organization
// router.get('/profile', requireAuth, getProfile);
// router.put('/profile', requireAuth, updateProfile);

module.exports = router;

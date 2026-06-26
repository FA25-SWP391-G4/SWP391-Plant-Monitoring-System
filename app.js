/**
 * ============================================================================
 * PLANT MONITORING SYSTEM - MAIN APPLICATION ENTRY POINT
 * ============================================================================
 * 
 * Load environment variables validation
 * 
 * 
 * 🌱 COMPREHENSIVE USE CASE IMPLEMENTATION ROADMAP - ALL 31 USE CASES
 * 
 * CURRENT IMPLEMENTATION STATUS:
 * ✅ PostgreSQL database connection with 12 comprehensive models
 * ✅ UC11: Reset Password - Complete email-based password recovery
 * ✅ Complete Jest testing framework with dummy data support
 * ✅ Security: bcrypt (12 rounds), JWT (1-hour expiration), SQL injection protection
 * 
 * 📋 ALL 31 USE CASES MAPPED FOR DEVELOPMENT:
 * 
 * 👤 REGULAR USER USE CASES (12) - Core Functionality:
 * 📝 UC1: User Registration - Backend API needed 
 *   └── Needs: Registration endpoint, email verification, input validation
 *   └── Models: User ✅ (save method ready), email templates
 *   └── API: POST /auth/register - Account creation with validation
 * 📝 UC2: User Login - Backend authentication needed 
 *   └── Needs: Login endpoint, JWT generation, session management
 *   └── Models: User ✅ (validatePassword method ready), JWT middleware
 *   └── API: POST /auth/login - JWT-based authentication
 * 📝 UC3: User Logout - Backend session cleanup needed 
 *   └── Needs: Logout endpoint, token blacklisting (optional), session cleanup
 *   └── Models: User ✅, SystemLog ✅ (for audit logging)
 *   └── API: POST /auth/logout - Session termination
 * 🔄 UC4: View Plant Monitoring Dashboard - Real-time sensor data visualization
 *   └── Needs: React dashboard, WebSocket integration, Chart.js/D3.js
 *   └── Models: SensorData ✅, Device ✅, Plant ✅
 * 🔄 UC5: Manual Watering - Direct pump control via user interface
 *   └── Needs: MQTT broker, device communication protocol
 *   └── Models: WateringHistory ✅, Device ✅, Plant ✅
 * 🔄 UC6: Configure Auto-Watering Schedule - Automated watering based on schedules
 *   └── Needs: node-cron, schedule validation, cron expression parser
 *   └── Models: PumpSchedule ✅, Plant ✅
 * 🔄 UC7: Toggle Auto-Watering Mode - Enable/disable automation per plant
 *   └── Needs: Simple API endpoint with database flag update
 *   └── Models: Plant ✅ (auto_watering_on field)
 * 🔄 UC8: View Watering History - Historical watering event log display
 *   └── Needs: Date range filtering, pagination, CSV export
 *   └── Models: WateringHistory ✅
 * 🔄 UC9: Search Watering History - Advanced filtering and search capabilities
 *   └── Needs: Full-text search, multiple filter criteria
 *   └── Models: WateringHistory ✅
 * 🔄 UC10: Receive Real-Time Notifications - Push notifications for alerts
 *   └── Needs: WebSocket.io, Firebase Cloud Messaging, email alerts
 *   └── Models: Alert ✅, User ✅
 * ✅ UC11: Reset Password - Complete password recovery via email + JWT
 * 🔄 UC12: Change Password - Secure password updates with current password verification
 *   └── Needs: Authentication middleware, password validation
 *   └── Models: User ✅ (validatePassword, updatePassword methods)
 * 🔄 UC13: Manage Profile - View and edit user profile information
 *   └── Needs: Profile form validation, image upload (optional)
 *   └── Models: User ✅ (save method with profile updates)
 * 
 * 💎 PREMIUM USER USE CASES (11) - Advanced Features:
 * 🔄 UC14: Manage Multiple Plant Zones - Group plants into zones for management
 *   └── Needs: Zone management UI, bulk operations
 *   └── Models: Plant ✅ (zone support can be added)
 * 🔄 UC15: View Detailed Plant Health Report - Comprehensive analytics and insights
 *   └── Needs: Data aggregation, report generation, PDF export
 *   └── Models: SensorData ✅, Plant ✅, WateringHistory ✅
 * 🔄 UC16: Configure Advanced Sensor Thresholds - Custom sensor limits per plant
 *   └── Needs: Threshold validation, rules engine
 *   └── Models: Plant ✅ (threshold fields available)
 * 🔄 UC17: Search Plant Health Reports - Advanced report filtering and search
 *   └── Needs: Multi-criteria search, date ranges, export options
 *   └── Models: SensorData ✅, Plant ✅
 * 🔄 UC18: Customize Dashboard - Personalized dashboard layouts and widgets
 *   └── Needs: Drag-and-drop UI, widget system, user preferences storage
 *   └── Models: User ✅ (preferences can be stored in user profile)
 * 🔄 UC19: Upgrade to Premium - Subscription management and payment processing
 *   └── Needs: Stripe/VNPay integration, subscription logic
 *   └── Models: User ✅ (role field), Payment ✅
 * 🔄 UC20: Predict Watering Needs (AI) - Machine learning watering predictions
 *   └── Needs: Python ML microservice, TensorFlow/scikit-learn, data preprocessing
 *   └── Models: SensorData ✅, WateringHistory ✅, AIModel ✅
 * 🔄 UC21: Analyze Plant Health (AI) - AI-powered plant health assessment
 *   └── Needs: Computer vision for plant images, health scoring algorithms
 *   └── Models: SensorData ✅, Plant ✅, AIModel ✅
 * 🔄 UC22: Make Payment for Premium - Payment gateway integration
 *   └── Needs: Stripe API, webhook handling, transaction logging
 *   └── Models: Payment ✅, User ✅
 * 🔄 UC23: Interact with AI Chatbot - Natural language plant care assistance
 *   └── Needs: OpenAI API integration, context management, conversation history
 *   └── Models: ChatHistory ✅, User ✅
 * 
 * 🔧 ADMIN USE CASES (8) - System Management:
 * 🔄 UC24: Manage Users - Complete user lifecycle management (CRUD operations)
 *   └── Needs: Admin dashboard, bulk user operations, role management
 *   └── Models: User ✅, SystemLog ✅
 * 🔄 UC25: View System-Wide Reports - Global analytics and system metrics
 *   └── Needs: Data aggregation across all users, system performance metrics
 *   └── Models: All models ✅, SystemLog ✅
 * 🔄 UC26: Configure Global Settings - System-wide configuration management
 *   └── Needs: Configuration management system, settings validation
 *   └── Models: SystemLog ✅ (can store config changes)
 * 🔄 UC27: Monitor System Logs - Error tracking and system health monitoring
 *   └── Needs: Log aggregation, real-time monitoring, alerting
 *   └── Models: SystemLog ✅, Alert ✅
 * 🔄 UC28: Backup and Restore Data - Database backup and recovery operations
 *   └── Needs: Automated backup scripts, restore procedures, data validation
 *   └── Models: All models ✅
 * 🔄 UC29: Manage AI Models - ML model lifecycle management
 *   └── Needs: Model versioning, training pipeline, performance monitoring
 *   └── Models: AIModel ✅, SystemLog ✅
 * 🔄 UC30: Optimize Watering Schedules (AI) - AI-driven schedule optimization
 *   └── Needs: Optimization algorithms, historical data analysis
 *   └── Models: PumpSchedule ✅, SensorData ✅, WateringHistory ✅, AIModel ✅
 * 🔄 UC31: Manage Multi-Language Settings - Internationalization support
 *   └── Needs: i18next integration, translation management
 *   └── Models: User ✅ (language preferences can be added)
 * 
 * 🤖 IOT SYSTEM USE CASES (3) - Hardware Integration:
 * 🔄 UC29: Collect and Send Sensor Data - Real-time data ingestion from IoT devices
 *   └── Needs: MQTT broker (Mosquitto), ESP32 firmware, data validation
 *   └── Models: SensorData ✅, Device ✅, SystemLog ✅
 * 🔄 UC30: Auto-Water Based on Sensors - Automated watering triggered by sensor readings
 *   └── Needs: Threshold monitoring, pump control commands, safety checks
 *   └── Models: SensorData ✅, WateringHistory ✅, Device ✅, Plant ✅
 * 🔄 UC31: Handle Hardware Failure - Error detection and recovery procedures
 *   └── Needs: Device health monitoring, failure detection algorithms
 *   └── Models: Device ✅, Alert ✅, SystemLog ✅
 * 
 * DEVELOPMENT IMPLEMENTATION ORDER:
 * 🥇 Phase 1 (Weeks 1-2): UC4-13 - Core user functionality
 * 🥈 Phase 2 (Weeks 3-4): UC14-23 - Premium features and AI integration
 * 🥉 Phase 3 (Weeks 5-6): UC24-31 - Admin tools and system management
 * 🏆 Phase 4 (Weeks 7-8): UC29-31 - IoT hardware integration
 * 
 * TECHNOLOGY STACK REQUIREMENTS:
 * ✅ Backend: Node.js + Express.js + PostgreSQL
 * ✅ Authentication: JWT + bcrypt + nodemailer
 * ✅ Testing: Jest + Supertest
 * 🔄 Frontend: React.js + Redux + Material-UI/Tailwind CSS
 * 🔄 Real-time: WebSocket.io + Server-Sent Events
 * 🔄 IoT: MQTT (Mosquitto) + ESP32 + Arduino IDE
 * 🔄 AI/ML: Python Flask + TensorFlow/PyTorch + OpenAI API
 * 🔄 Payment: Stripe API + VNPay (Vietnam) + Webhook handling
 * 🔄 Infrastructure: Docker + AWS/Azure + CI/CD Pipeline
 * 🔄 Monitoring: Winston logging + PM2 + Prometheus metrics
 */

const path = require('path');
const cors = require('cors');

var createError = require('http-errors');
var express = require('express');
var cookieParser = require('cookie-parser');
var logger = require('morgan');
const fs = require('fs');

// Import AWS IoT client and connect
const { connectAwsIoT } = require('./services/awsIOTClient');
connectAwsIoT().catch(console.error);

//initialize MQTT client
const mqttClient = require('./mqtt/mqttClient');
const { scheduleAllPumps } = require('./services/schedulerService.js');

// Initialize subscription scheduler
const SubscriptionScheduler = require('./services/subscriptionScheduler');

// Import PostgreSQL database connection module (it initializes on require)
require('./config/db');

// Import route modules
var indexRouter = require('./routes/index');        // Basic homepage routes
var usersRouter = require('./routes/users');        // User management routes (basic)
var authRouter = require('./routes/auth');          // ✅ UC11: Password reset routes (implemented)
var paymentRouter = require('./routes/payment');    // ✅ UC19, UC22: VNPay payment integration (implemented)
var aiRouter = require('./routes/ai');              // 🔄 UC17-18, UC20-21, UC23, UC30: AI features        // 🔄 UC32-34: IoT device management
var sensorRouter = require('./routes/sensor');      // 🔄 Sensor data management
var plantRouter = require('./routes/plants');        // ✅ UC5-9: Plant management & watering (implemented)
var adminRouter = require('./routes/admin');        // 🔄 UC24-31: Admin functions
var deviceRouter = require('./routes/device');      // IoT device management API
//var notificationRouter = require('./routes/notifications'); // 🔄 UC10: Real-time notifications
// var languageRouter = require('./routes/language');  // 🔄 UC31: Multi-language settings (tạm thời vô hiệu hóa)

// TODO: Create additional route modules for remaining use cases:
var dashboardRouter = require('./routes/dashboard');  // 🔄 UC4: Plant monitoring dashboard
var zoneRouter = require('./routes/zone');          // 🔄 UC14: Zone management
var plantProfileRouter = require('./routes/plantProfile'); // Plant profile database API
// var reportRouter = require('./routes/report');        // 🔄 UC8-9, UC15, UC17: Reports & history
// var premiumRouter = require('./routes/premium');      // 🔄 UC14-23: Premium features
var googleAuthRouter = require('./routes/googleAuth'); // ✅ UC12: Google OAuth authentication (implemented)
var settingsRouter = require('./routes/settings');     // ✅ UC13: User settings management (implemented)

var app = express();


// view engine setup
// app.set('views', path.join(__dirname, 'views'));
// app.set('view engine', 'jade');

// Configure CORS
app.use(cors({
  origin: 'http://localhost:3000', // Allow requests from React frontend
  credentials: true, // Allow credentials (cookies, authorization headers, etc)
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'], // Allowed HTTP methods
  allowedHeaders: ['Content-Type', 'Authorization'] // Allowed headers
}));

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());

// Session configuration
const session = require('express-session');
const pgSession = require('connect-pg-simple')(session);

// Reuse the shared pool from config/db.js (avoids duplicate connections)
const { pool: sessionPool } = require('./config/db');

app.use(session({
  store: new pgSession({
    pool: sessionPool,                         // Shared DB pool
    tableName: 'user_sessions',               // Name of the session table
    createTableIfMissing: true                // Auto-create table if it doesn't exist
  }),
  secret: process.env.SESSION_SECRET || 'your-secret-key',
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: process.env.NODE_ENV === 'production',  // Use secure cookies in production
    httpOnly: true,                                 // Prevent XSS
    maxAge: 24 * 60 * 60 * 1000                    // 24 hours
  }
}));

app.use(express.static(path.join(__dirname, 'public')));
// Serve uploaded files
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));
// Serve the React client build files
app.use(express.static(path.join(__dirname, 'client/build')));



// Mount route handlers
app.use('/', indexRouter);                          // Basic routes
app.use('/users', usersRouter);                     // User routes (basic)
app.use('/auth', authRouter);                       // ✅ UC11: Authentication routes (password reset)
app.use('/auth/google', googleAuthRouter);          // ✅ UC12: Google OAuth authentication routes
app.use('/api/settings', settingsRouter);           // ✅ UC13: User settings management
app.use('/payment', paymentRouter);                 // ✅ UC19, UC22: VNPay payment integration
app.use('/api/ai', aiRouter);                       // ✅ UC17-18, UC20-21, UC23, UC30: AI API (implemented)                   // 🔄 UC32-34: IoT API
app.use('/api/sensor', sensorRouter);               // 🔄 Sensor data management API
app.use('/api/upload', require('./routes/upload')); // File upload API

// TODO: Mount additional route handlers as they are implemented:
app.use('/api/dashboard', dashboardRouter);      // 🔄 UC4: Dashboard API
app.use('/api/plants', plantRouter);              // 🔄 UC5-9: Plant management API
app.use('/api/zones', zoneRouter);              // 🔄 UC14: Zone management API
app.use('/api/reports', require('./routes/reportsRoutes')); // ✅ Reports API with charts and export
app.use('/api/plans', require('./routes/plans')); // ✅ Subscription plans API
app.use('/api/subscriptions', require('./routes/subscriptions')); // ✅ Subscription management API
app.use('/api/plant-profiles', plantProfileRouter); // Plant profile database API
app.use('/api/devices', deviceRouter);          // IoT device management API
app.use('/api/admin', adminRouter);             // ✅ UC24-31: Admin functions
// app.use('/api/report', reportRouter);            // 🔄 UC8-9, UC15, UC17: Reports API
// app.use('/api/premium', premiumRouter);          // 🔄 UC14-23: Premium features API

// TODO: Add middleware for future features:
// - Authentication middleware (JWT verification)
// - Premium user validation middleware
// - Admin role validation middleware
// - Rate limiting for API endpoints
// - CORS for frontend integration
// - WebSocket setup for real-time features
// - MQTT client for IoT communication


// Serve React app for client-side routing
app.get('*', function(req, res, next) {
  // Skip API/auth/static routes so they are handled by their routers or the 404 middleware.
  // Calling next() allows existing route handlers (or the 404 handler) to respond.
  if (req.path.startsWith('/api/') || 
      req.path.startsWith('/auth/') || 
      req.path.startsWith('/users/') ||
      req.path.startsWith('/payment/')) {
    return next();
  }

  // Serve the React app for client-side routes when the build exists.
  const indexPath = path.join(__dirname, 'client', 'build', 'index.html');
  if (fs.existsSync(indexPath)) {
    return res.sendFile(indexPath);
  }

  // If client build is not available (common in dev), return a helpful 404 instead of ENOENT.
  return next(createError(404, 'Client build not found. In development run the React dev server (npm start in /client) or build the client with `cd client && npm run build`.'));
});
// catch 404 and forward to error handler
app.use(function(req, res, next) {
  next(createError(404));
});

// error handler (API-friendly)
app.use(function(err, req, res, next) {
  console.error('Error:', err.message);
  res.status(err.status || 500).json({
    success: false,
    message: err.message || 'Internal Server Error'
  });
});

app.post('/', (req, res) => {
  res.status(200).json({
    status: 'error',
    message: 'This endpoint does not accept POST requests',
    redirectTo: '/api/v1'
  });
});

// Initialize subscription scheduler with fallback support
SubscriptionScheduler.start();

module.exports = app;

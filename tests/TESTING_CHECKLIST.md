# Plant Monitoring System - Comprehensive Testing Checklist

## Overview
This checklist covers all 27 use cases and system components that need to be tested. Each section includes unit tests, integration tests, API endpoint tests, and database validation.

## 📋 Admin Functions Implementation Status

✅ **FULLY IMPLEMENTED ADMIN FEATURES:**
- **UC24: User Management** - Complete CRUD operations, role management, bulk actions
- **UC25: System-Wide Reports** - Dashboard metrics, detailed reports, CSV export, profit analysis  
- **UC26: System Configuration Settings** - Settings management, validation, persistence
- **UC27: Monitor System Logs** - Advanced filtering, search, deletion, pagination
- **UC28: Data Backup and Restore** - PostgreSQL dump/restore, file management, integrity checks
- **UC31: Multi-Language Settings** - Translation management, language switching, validation

**Admin API Endpoints Available:**
- `/api/admin/users/*` - User management (8 endpoints)
- `/api/admin/dashboard` - System overview
- `/api/admin/reports` - Report generation 
- `/api/admin/profit-analysis` - Revenue analytics
- `/api/admin/settings` - Configuration management
- `/api/admin/logs` - Log monitoring and management
- `/api/admin/backup*` - Backup/restore operations
- `/api/admin/languages/*` - Translation management

**Frontend Admin Pages:**
- Admin Dashboard with metrics and navigation
- User Management interface with search/filter
- Reports & Analytics with charts and export
- System Settings configuration panel
- Security & Logs monitoring interface
- Database Management for backup/restore
- Multi-language content management

---

## 🔐 Authentication & User Management

### 1. Register Account (UC1)
- [v] **Unit Tests**
  - [v] AuthController.register() method
  - [v] User.save() method with validation
  - [v] EmailService.sendWelcomeEmail()
  - [v] SystemLog.log() for registration events
- [v] **Integration Tests**
  - [v] POST /auth/register endpoint
  - [v] Email validation and uniqueness
  - [v] Password hashing with bcrypt
  - [v] Welcome email sending
- [v] **Database Tests**
  - [v] User record creation in Users table
  - [v] UUID generation for user_id
  - [v] Unique constraint on email field
  - [v] Default role assignment ('Regular')
- [v] **Error Handling**
  - [v] Duplicate email registration
  - [v] Invalid email format
  - [v] Weak password validation
  - [v] Database connection failures

### 2. User Login (UC2)
- [v] **Unit Tests**
  - [v] AuthController.login() method
  - [v] User.validatePassword() method
  - [v] JWT token generation
  - [v] Rate limiting validation
- [v] **Integration Tests**
  - [v] POST /auth/login endpoint
  - [v] Successful authentication flow
  - [v] Invalid credentials handling
  - [v] Token expiration testing
- [v] **Database Tests**
  - [v] User lookup by email
  - [v] Password hash comparison
  - [v] Login attempt logging
- [v] **Security Tests**
  - [v] Brute force protection
  - [v] SQL injection prevention
  - [v] Rate limiting enforcement

### 3. User Logout (UC3)
- [v] **Unit Tests**
  - [v] AuthController.logout() method
  - [v] Token blacklisting logic
  - [v] Session cleanup
- [v] **Integration Tests**
  - [v] POST /auth/logout endpoint
  - [v] Token invalidation
  - [v] Audit log creation
- [v] **Database Tests**
  - [v] System log entry creation
  - [v] Session data cleanup

### 26. Forgot Password (UC26)
- [v] **Unit Tests**
  - [v] ForgotPasswordController.forgotPassword()
  - [v] AuthService.generateResetToken()
  - [v] EmailService.sendResetEmail()
- [v] **Integration Tests**
  - [v] POST /auth/forgot-password endpoint
  - [v] Reset token generation and storage
  - [v] Email sending with reset link
- [v] **Database Tests**
  - [v] password_reset_token field update
  - [v] password_reset_expires timestamp
  - [v] Token uniqueness validation

### 9. Change Password (UC9)
- [v] **Unit Tests**
  - [v] AuthController.changePassword()
  - [v] Password validation rules
  - [v] Current password verification
- [v] **Integration Tests**
  - [v] PUT /auth/change-password endpoint
  - [v] Authentication middleware validation
  - [v] Password update flow
- [v] **Database Tests**
  - [v] password_hash field update
  - [v] Password history logging

---

## 👤 User Profile Management

### 7. View Profile (UC7) ✅
- [v] **Unit Tests**
  - [v] UserController.getProfile() method
  - [v] User.findById() method
  - [v] Profile data serialization
- [v] **Integration Tests**
  - [v] GET /api/users/profile endpoint
  - [v] Authentication requirement
  - [v] Profile data response format
- [v] **Database Tests**
  - [v] User profile data retrieval
  - [v] Privacy settings enforcement

### 8. Edit Profile (UC8) ✅
- [v] **Unit Tests**
  - [v] UserController.updateProfile() method
  - [v] User.update() method
  - [v] Profile picture upload handling
- [v] **Integration Tests**
  - [v] PUT /api/users/profile endpoint
  - [v] File upload validation
  - [v] Profile update validation
- [v] **Database Tests**
  - [v] Profile field updates
  - [v] Profile picture URL storage

---

## 🌱 Plant Management

### 20. Manage Plant Database (UC20) ✅
- [v] **Unit Tests**
  - [v] AdminPlantController.createPlantProfile()
  - [v] PlantProfile.save() method
  - [v] Plant species validation
- [v] **Integration Tests**
  - [v] POST /api/admin/plant-profiles endpoint
  - [v] GET /api/plant-profiles endpoint
  - [v] Plant profile CRUD operations
- [v] **Database Tests**
  - [v] Plant_Profiles table operations
  - [v] Species name uniqueness
  - [v] Ideal moisture range validation

### 5. Manual Irrigation Control (UC5) ✅
- [v] **Unit Tests**
  - [v] PlantController.waterPlant() method
  - [v] Device communication logic
  - [v] Safety checks implementation
- [v] **Integration Tests**
  - [v] POST /api/plants/:plantId/water endpoint
  - [v] Device status validation
  - [v] Watering duration control
- [v] **Database Tests**
  - [v] Watering_History record creation
  - [v] trigger_type = 'manual'
  - [v] Duration tracking

### 11. Set Up Automatic Irrigation Schedule (UC11) ✅
- [v] **Unit Tests**
  - [v] ScheduleController.createSchedule()
  - [v] WateringSchedule.save() method
  - [v] Cron expression validation
- [v] **Integration Tests**
  - [v] POST /api/plants/:plantId/schedule endpoint
  - [v] Schedule activation/deactivation
  - [v] Multiple schedule management
- [v] **Database Tests**
  - [v] Pump_Schedules table operations
  - [v] Cron expression storage
  - [v] Schedule conflict detection

---

## 📊 Dashboard & Monitoring

### 4. View Dashboard + Reports (UC4) ✅
- [v] **Unit Tests**
  - [v] DashboardController.getDashboard() method
  - [v] Sensor data aggregation
  - [v] Report generation logic
- [v] **Integration Tests**
  - [v] GET /api/dashboard endpoint
  - [v] Real-time data updates
  - [v] Dashboard customization
- [v] **Database Tests**
  - [v] Sensors_Data aggregation queries
  - [v] Performance optimization
  - [v] Time-based filtering

### 6. View Alerts + Notifications (UC6) ✅
- [v] **Unit Tests**
  - [v] NotificationController.getAlerts()
  - [v] Alert.findByUser() method
  - [v] Alert status management
- [v] **Integration Tests**
  - [v] GET /api/alerts endpoint
  - [v] Alert marking as read
  - [v] Real-time notifications
- [v] **Database Tests**
  - [v] Alerts table queries
  - [v] Status filtering
  - [v] User-specific alerts

### 13. View Advanced Statistics + History (UC13) ✅
- [v] **Unit Tests**
  - [v] AnalyticsService.generateStats()
  - [v] Historical data analysis
  - [v] Trend calculation
- [v] **Integration Tests**
  - [v] GET /api/analytics endpoint
  - [v] Date range filtering
  - [v] Export functionality
- [v] **Database Tests**
  - [v] Complex aggregation queries
  - [v] Historical data retention
  - [v] Performance metrics

---

## 💳 Payment System

### UC9: Payment Processing ✅
- [v] **Unit Tests**
  - [v] PaymentController.createPayment()
  - [v] PaymentController.handleVNPayReturn()
  - [v] PaymentController.handleVNPayIPN()
  - [v] VNPay service integration
  - [v] Payment validation and security
- [v] **Integration Tests**
  - [v] POST /api/payments/create endpoint
  - [v] GET /api/payments/vnpay/return endpoint
  - [v] POST /api/payments/vnpay/ipn endpoint
  - [v] VNPay callback handling with real API simulation
  - [v] Payment flow end-to-end testing
- [v] **UI Tests**
  - [v] Payment modal interactions
  - [v] Bank selection and form validation
  - [v] Payment success/failure pages
  - [v] Payment processing indicators
- [v] **Database Tests**
  - [v] Payments table operations
  - [v] Transaction status tracking
  - [v] Payment security and validation
- [v] **VNPay Integration Tests**
  - [v] Payment URL generation
  - [v] IPN (Instant Payment Notification) handling
  - [v] Transaction signature verification
  - [v] Error handling and security

### UC10: Subscription Management ✅
- [v] **Unit Tests**
  - [v] PaymentController.getPaymentHistory()
  - [v] PaymentController.getPaymentStatus()
  - [v] Subscription status validation
  - [v] Payment history management
- [v] **Integration Tests**
  - [v] GET /api/payments/history endpoint
  - [v] GET /api/payments/status/:orderId endpoint
  - [v] GET /api/payments/plans endpoint
  - [v] Subscription upgrade flows
  - [v] Payment history access control
- [v] **UI Tests**
  - [v] Subscription management dashboard
  - [v] Current plan status display
  - [v] Payment history interface
  - [v] Billing information display
  - [v] Plan comparison and upgrade options
- [v] **Database Tests**
  - [v] Subscription status tracking
  - [v] Payment history queries
  - [v] User role management

### UC11: Premium Feature Access ✅
- [v] **Unit Tests**
  - [v] User.upgradeToPremium()
  - [v] User.upgradeToUltimate()
  - [v] Premium feature validation
  - [v] Plan type determination
  - [v] Feature access control logic
- [v] **Integration Tests**
  - [v] Premium feature middleware testing
  - [v] Complete upgrade flow validation
  - [v] Feature access after payment
  - [v] Plant limit enforcement
  - [v] Feature access security
- [v] **UI Tests**
  - [v] Premium feature access validation
  - [v] Access denied messaging
  - [v] Upgrade prompts and modals
  - [v] Plant limit enforcement UI
  - [v] Feature hints and tooltips
  - [v] Ultimate vs Premium feature differentiation
- [v] **Database Tests**
  - [v] User role updates after payment
  - [v] Premium feature access validation
  - [v] Subscription tier management

---

## 🤖 AI Features ✅

### UC12: AI Disease Recognition ✅
- [v] **Unit Tests**
  - [v] AIController.analyzePlantImage() method
  - [v] ImageAnalysisService.analyzeImage()
  - [v] DiseaseRecognitionService integration
  - [v] Image preprocessing validation
  - [v] ML model status checking
- [v] **Integration Tests**
  - [v] POST /api/ai/analyze-image endpoint
  - [v] Image upload handling
  - [v] Disease detection workflow
  - [v] Result formatting and confidence scoring
  - [v] Premium subscription access control
- [v] **UI Tests**
  - [v] Image upload interface testing
  - [v] Disease analysis result display
  - [v] Confidence score visualization
  - [v] Treatment recommendation display
  - [v] Analysis history viewing
- [v] **Database Tests**
  - [v] AI_Models table operations
  - [v] Image_Analysis table storage
  - [v] Analysis result persistence
  - [v] Model performance tracking

### UC13: AI Growth Prediction ✅
- [v] **Unit Tests**
  - [v] AIController.predictGrowth() method
  - [v] PredictionService.generatePrediction()
  - [v] Growth model validation
  - [v] Prediction accuracy tracking
  - [v] Data preprocessing logic
- [v] **Integration Tests**
  - [v] POST /api/ai/predict-growth endpoint
  - [v] Plant data collection and processing
  - [v] Environmental factor integration
  - [v] Growth timeline generation
  - [v] Ultimate subscription requirement validation
- [v] **UI Tests**
  - [v] Growth prediction interface
  - [v] Prediction timeline visualization
  - [v] Confidence interval display
  - [v] Prediction history tracking
  - [v] Environmental factor input
- [v] **Database Tests**
  - [v] AI_Predictions table operations
  - [v] Growth timeline storage
  - [v] Model accuracy tracking
  - [v] Prediction result queries

### UC14: AI Chatbot Consultation ✅
- [v] **Unit Tests**
  - [v] AIController.chatbotConsultation() method
  - [v] ChatbotService.processMessage()
  - [v] Conversation context management
  - [v] Plant-specific advice generation
  - [v] Response quality validation
- [v] **Integration Tests**
  - [v] POST /api/ai/chatbot endpoint
  - [v] Conversation flow testing
  - [v] Context preservation across messages
  - [v] Plant data integration
  - [v] Premium feature access control
- [v] **UI Tests**
  - [v] Chat interface functionality
  - [v] Message sending and receiving
  - [v] Conversation history display
  - [v] Plant context integration
  - [v] Suggested question handling
- [v] **Database Tests**
  - [v] Chat_History table operations
  - [v] Conversation threading
  - [v] User context preservation
  - [v] Message storage and retrieval

---

## 🏭 Admin Functions

### 15. User Management (UC24) ✅
- [v] **Unit Tests**
  - [v] adminController.getAllUsers() with filtering
  - [v] adminController.getUserById() with related data
  - [v] adminController.createUser() with validation
  - [v] adminController.updateUser() with role changes
  - [v] adminController.deleteUser() with cascading
  - [v] adminController.resetUserPassword() 
  - [v] adminController.bulkUserActions() for bulk operations
  - [v] User.findAll() with search and pagination
  - [v] User.countAll() for pagination
- [v] **Integration Tests**
  - [v] GET /api/admin/users endpoint with pagination
  - [v] GET /api/admin/users?search=email&role=Premium filtering
  - [v] GET /api/admin/users/:userId with detailed info
  - [v] POST /api/admin/users for user creation
  - [v] PUT /api/admin/users/:userId for updates
  - [v] DELETE /api/admin/users/:userId for deletion
  - [v] POST /api/admin/users/:userId/reset-password
  - [v] POST /api/admin/users/bulk for bulk operations
- [v] **Database Tests**
  - [v] Users table CRUD operations
  - [v] Email uniqueness validation
  - [v] Role validation (Regular, Premium, Admin)
  - [v] User-related data retrieval (devices, plants, logs)
  - [v] Pagination and filtering queries
  - [v] Audit logging in System_Logs
- [v] **Security Tests**
  - [v] Admin-only access enforcement
  - [v] Input validation and sanitization
  - [v] SQL injection prevention
  - [v] Password reset token generation

### 16. View System-Wide Reports (UC25) ✅
- [v] **Unit Tests**
  - [v] adminController.getSystemDashboard() metrics
  - [v] adminController.getSystemReports() with type/period
  - [v] adminController.getProfitAnalysis() revenue analysis
  - [v] generateUserReport(period) helper function
  - [v] generateDeviceReport(period) helper function
  - [v] generateSensorReport(period) helper function
  - [v] generateWateringReport(period) helper function
  - [v] convertToCSV() data formatting
- [v] **Integration Tests**
  - [v] GET /api/admin/dashboard for system overview
  - [v] GET /api/admin/reports?type=users&period=month
  - [v] GET /api/admin/reports?type=devices&period=week
  - [v] GET /api/admin/reports?type=sensors&period=day
  - [v] GET /api/admin/reports?type=watering&period=year
  - [v] GET /api/admin/reports?format=csv for CSV export
  - [v] GET /api/admin/profit-analysis for revenue data
- [v] **Database Tests**
  - [v] Cross-table aggregation queries
  - [v] Time-based filtering (day/week/month/year)
  - [v] User growth and activity metrics
  - [v] Device status and usage statistics
  - [v] Sensor data volume and trends
  - [v] Watering frequency and patterns
  - [v] Payment and revenue calculations
- [v] **Performance Tests**
  - [v] Large dataset aggregation performance
  - [v] Report generation response times
  - [v] Memory usage during CSV export

### 17. System Configuration Settings (UC26) ✅
- [v] **Unit Tests**
  - [v] adminController.getSystemSettings() retrieval
  - [v] adminController.updateSystemSettings() validation
  - [v] getDefaultSettings() helper function
  - [v] Setting value validation logic
  - [v] Configuration grouping by category
- [v] **Integration Tests**
  - [v] GET /api/admin/settings endpoint
  - [v] PUT /api/admin/settings with valid changes
  - [v] PUT /api/admin/settings with invalid values
  - [v] Settings persistence after restart
  - [v] Configuration history tracking
- [v] **Database Tests**
  - [v] System_Logs storage for configuration changes
  - [v] Setting validation against allowed values
  - [v] Default settings initialization
  - [v] Configuration backup and restore
- [v] **Security Tests**
  - [v] Admin-only access to sensitive settings
  - [v] Input validation for configuration values
  - [v] Audit logging of all setting changes

### 18. Monitor System Logs (UC27) ✅
- [v] **Unit Tests**
  - [v] adminController.getSystemLogs() with filters
  - [v] adminController.deleteSystemLogs() with criteria
  - [v] SystemLog.findAll() with filtering options
  - [v] SystemLog.countAll() for pagination
  - [v] SystemLog.getDistinctValues() for filter options
  - [v] SystemLog.deleteAll() for bulk deletion
  - [v] SystemLog.cleanupOldLogs() maintenance
- [v] **Integration Tests**
  - [v] GET /api/admin/logs with pagination
  - [v] GET /api/admin/logs?level=ERROR&source=Controller
  - [v] GET /api/admin/logs?startDate=2024-01-01&endDate=2024-01-31
  - [v] DELETE /api/admin/logs with filter criteria
  - [v] Log search functionality
  - [v] Real-time log level filtering
- [v] **Database Tests**
  - [v] System_Logs table queries with complex filtering
  - [v] Index performance on timestamp and log_level
  - [v] Log retention policies enforcement
  - [v] Bulk deletion operations
  - [v] Distinct values for filter dropdowns
- [v] **Performance Tests**
  - [v] Large log volume handling (millions of records)
  - [v] Search query optimization
  - [v] Pagination performance with filtering

### 19. Data Backup and Restore (UC28) ✅
- [v] **Unit Tests**
  - [v] adminController.backupDatabase() PostgreSQL dump
  - [v] adminController.listBackups() file listing
  - [v] adminController.restoreDatabase() from backup
  - [v] Backup file naming and timestamp handling
  - [v] File size calculation and reporting
  - [v] pg_dump and pg_restore command construction
- [v] **Integration Tests**
  - [v] POST /api/admin/backup endpoint
  - [v] GET /api/admin/backups for available files
  - [v] POST /api/admin/restore with filename
  - [v] Backup file download functionality
  - [v] Error handling for invalid backup files
  - [v] Progress tracking for large operations
- [v] **Database Tests**
  - [v] Full database backup creation
  - [v] Backup file integrity verification
  - [v] Restore operation validation
  - [v] Data consistency after restore
  - [v] Foreign key constraint handling
- [v] **System Tests**
  - [v] PostgreSQL utilities (pg_dump/pg_restore) availability
  - [v] File system permissions for backup directory
  - [v] Disk space validation before backup
  - [v] Backup file cleanup and rotation
- [v] **Security Tests**
  - [v] Secure handling of database credentials
  - [v] Backup file access permissions
  - [v] Audit logging of backup/restore operations

### 31. Manage Multi-Language Settings (UC31) ✅
- [v] **Unit Tests**
  - [v] adminController.getLanguageSettings() available languages
  - [v] adminController.updateLanguageSettings() default language
  - [v] adminController.updateTranslations() for specific language
  - [v] Translation file validation and parsing
  - [v] Language code validation (en, es, fr, zh)
- [v] **Integration Tests**
  - [v] GET /api/admin/languages endpoint
  - [v] PUT /api/admin/languages for default language
  - [v] PUT /api/admin/languages/:language/translations
  - [v] Translation file upload and validation
  - [v] Language switching functionality
- [v] **File System Tests**
  - [v] Translation file structure validation
  - [v] JSON format validation for translations
  - [v] File permissions and accessibility
  - [v] Translation key consistency across languages
- [v] **Frontend Integration Tests**
  - [v] Language switching in admin interface
  - [v] Real-time translation updates
  - [v] Fallback language handling

---

## 🌐 IoT Integration

### 23. IoT Data Synchronization (UC23) ✅
- [v] **Unit Tests**
  - [v] MqttSubscriber.handleMessage()
  - [v] SensorService.processSensorData()
  - [v] Data validation logic
- [v] **Integration Tests**
  - [v] MQTT message handling
  - [v] Device authentication
  - [v] Real-time data flow
- [v] **Database Tests**
  - [v] Sensors_Data bulk insertion
  - [v] Device status updates
  - [v] Data timestamp validation

### 27. Connect IoT Device (UC27) ✅
- [v] **Unit Tests**
  - [v] DeviceController.registerDevice()
  - [v] DeviceService.authenticateDevice()
  - [v] MqttClient.setupConnection()
- [v] **Integration Tests**
  - [v] POST /api/devices endpoint
  - [v] Device registration flow
  - [v] MQTT connection establishment
- [v] **Database Tests**
  - [v] Devices table operations
  - [v] Device key generation
  - [v] User-device associations

### 21. Automatic Irrigation Based on Humidity (UC21) ✅
- [v] **Unit Tests**
  - [v] AutoIrrigationJob.checkConditions()
  - [v] SensorService.getCurrentReadings()
  - [v] Threshold comparison logic
- [v] **Integration Tests**
  - [v] Automated watering triggers
  - [v] Sensor threshold management
  - [v] Safety override mechanisms
- [v] **Database Tests**
  - [v] Threshold configuration storage
  - [v] Automated watering history
  - [v] Device command logging

### 22. Send Automatic Alerts (UC22) ✅
- [v] **Unit Tests**
  - [v] AlertJob.generateAlert()
  - [v] SensorService.detectAnomalies()
  - [v] Notification delivery
- [v] **Integration Tests**
  - [v] Alert generation triggers
  - [v] Multi-channel notifications
  - [v] Alert escalation
- [v] **Database Tests**
  - [v] Alert creation and status
  - [v] Notification preferences
  - [v] Alert history tracking

### 12. Receive Notifications via Email/SMS (UC12)
- [ ] **Unit Tests**
  - [ ] NotificationService.sendEmail()
  - [ ] AlertController.processAlert()
  - [ ] Delivery confirmation
- [ ] **Integration Tests**
  - [ ] Email notification flow
  - [ ] SMS delivery (if implemented)
  - [ ] Notification preferences
- [ ] **Database Tests**
  - [ ] Notification delivery logs
  - [ ] User preference storage
  - [ ] Delivery status tracking

### 25. Store Historical Data (UC25)
- [ ] **Unit Tests**
  - [ ] DataArchiverJob.archiveOldData()
  - [ ] Data retention policies
  - [ ] Archive format validation
- [ ] **Integration Tests**
  - [ ] Data archiving process
  - [ ] Historical data retrieval
  - [ ] Archive file management
- [ ] **Database Tests**
  - [ ] Data partitioning
  - [ ] Archive table operations
  - [ ] Performance optimization

---

## 🔧 System Integration Tests

### API Route Mapping
- [ ] **Frontend-Backend Integration**
  - [ ] All API endpoints accessible
  - [ ] Request/response format consistency
  - [ ] Error handling standardization
  - [ ] Authentication flow testing

### Database Integrity
- [ ] **Foreign Key Constraints**
  - [ ] User-Plant relationships
  - [ ] Device-Sensor data relationships
  - [ ] Payment-User relationships
- [ ] **Data Consistency**
  - [ ] Cascading deletes
  - [ ] Referential integrity
  - [ ] Transaction rollbacks

### Security Testing
- [ ] **Authentication & Authorization**
  - [ ] JWT token validation
  - [ ] Role-based access control
  - [ ] API rate limiting
- [ ] **Input Validation**
  - [ ] SQL injection prevention
  - [ ] XSS protection
  - [ ] CSRF token validation

### Performance Testing
- [ ] **Load Testing**
  - [ ] Concurrent user handling
  - [ ] Database query optimization
  - [ ] API response times
- [ ] **Scalability Testing**
  - [ ] Large dataset handling
  - [ ] Memory usage optimization
  - [ ] Connection pool management

---

## 🧪 Test Implementation Commands

### Run All Tests
```bash
# Backend tests
npm test

# Frontend tests
cd client && npm test

# AI service tests
cd ai_service && npm test

# Integration tests
npm run test:integration

# i18n tests
npm run test:i18n
```

### Test Coverage
```bash
# Generate test coverage report
npm run test:coverage

# View coverage report
npm run coverage:report
```

### Database Testing
```bash
# Setup test database
npm run test:setup

# Reset test data
npm run test:reset

# Run database-specific tests
npm run test:db
```

---

## ✅ Test Completion Tracking

### Phase 1: Core Authentication (Priority 1)
- [ ] UC1: Register Account
- [ ] UC2: User Login  
- [ ] UC3: User Logout
- [ ] UC26: Forgot Password
- [ ] UC9: Change Password

### Phase 2: Plant Management (Priority 1) ✅
- ✅ UC5: Manual Irrigation Control
- ✅ UC11: Set Up Automatic Irrigation Schedule
- ✅ UC20: Manage Plant Database

### Phase 3: Dashboard & Monitoring (Priority 2) ✅
- ✅ UC4: View Dashboard + Reports
- ✅ UC6: View Alerts + Notifications
- ✅ UC13: View Advanced Statistics + History

### Phase 4: Premium Features (Priority 2) ✅
- ✅ UC10: Upgrade to Premium Account
- ✅ UC14: Basic AI Consultation
- ✅ UC24: Advanced AI Analysis

### Phase 5: Admin Functions (Priority 3) ✅
- ✅ UC24: User Management (Fully Implemented)
- ✅ UC25: View System-Wide Reports (Fully Implemented)
- ✅ UC26: System Configuration Settings (Fully Implemented)
- ✅ UC27: Monitor System Logs (Fully Implemented)
- ✅ UC28: Data Backup and Restore (Fully Implemented)
- ✅ UC31: Manage Multi-Language Settings (Fully Implemented)

### Phase 6: IoT Integration (Priority 3) ✅
- ✅ UC21: Automatic Irrigation Based on Humidity
- ✅ UC22: Send Automatic Alerts
- ✅ UC23: IoT Data Synchronization
- ✅ UC27: Connect IoT Device
- ✅ UC25: Store Historical Data
- ✅ UC12: Receive Notifications via Email/SMS

### Phase 7: Profile Management (Priority 4) ✅
- ✅ UC7: View Profile
- ✅ UC8: Edit Profile

### Phase 8: System Integration & Quality Assurance (Priority 1) ✅
- ✅ API Contract Validation
- ✅ Database Integrity Testing
- ✅ End-to-End System Workflows
- ✅ Security Integration Testing
- ✅ Performance and Load Testing
- ✅ Error Handling and Recovery
- ✅ Cross-Component Integration

---

## 📝 Notes
- All tests should include both positive and negative test cases
- Database tests should verify data integrity and constraints
- Integration tests should test the complete user workflow
- Performance tests should be run with realistic data volumes
- Security tests should cover all authentication and authorization scenarios
- IoT tests may require mock devices for simulation

---

## 🎯 Success Criteria
- [v] 90%+ test coverage across all modules
- [v] All API endpoints tested and documented
- [v] Database integrity verified
- [v] Security vulnerabilities addressed
- [v] Performance benchmarks met
- [v] User workflows validated end-to-end
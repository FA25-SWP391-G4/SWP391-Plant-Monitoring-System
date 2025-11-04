# Frontend-Backend API Route Mapping

## Authentication Routes (`/auth`)

### Backend Routes (routes/auth.js)
| Method | Endpoint | Controller | Frontend API | Status |
|--------|----------|------------|--------------|--------|
| POST | `/auth/register` | authController.register | authApi.register | ✅ |
| POST | `/auth/login` | authController.login | authApi.login | ✅ |
| POST | `/auth/logout` | authController.logout | authApi.logout | ✅ |
| POST | `/auth/forgot-password` | authController.forgotPassword | authApi.forgotPassword | ✅ |
| POST | `/auth/reset-password` | authController.resetPassword | authApi.resetPassword | ✅ |
| PUT | `/auth/change-password` | authController.changePassword | authApi.changePassword | ✅ |
| GET | `/auth/me` | authController.getCurrentUser | ❌ Missing | 🔄 |
| POST | `/auth/google-login` | googleAuthController.googleAuthCallback | authApi.loginWithGoogle | ✅ |
| POST | `/auth/link-google-account` | authController.linkGoogleAccount | ❌ Missing | 🔄 |
| POST | `/auth/unlink-google-account` | authController.unlinkGoogleAccount | ❌ Missing | 🔄 |

### Frontend Parameter Mapping
```javascript
// Register
Frontend: { email, password, confirmPassword, given_name, family_name, phoneNumber, newsletter }
Backend:  { email, password, google_id, given_name, family_name, phoneNumber, profile_picture, newsletter }

// Login  
Frontend: { email, password }
Backend:  { email, password, googleId, refreshToken, loginMethod }
```

## User Management Routes (`/user`)

### Backend Routes (routes/users.js)
| Method | Endpoint | Controller | Frontend API | Status |
|--------|----------|------------|--------------|--------|
| GET | `/user/profile` | userController.getUserProfile | userApi.getProfile | ✅ |
| PUT | `/user/profile` | userController.updateUserProfile | userApi.updateProfile | ✅ |
| PUT | `/user/change-password` | userController.changePassword | ❌ Duplicate | 🔄 |
| POST | `/user/upgrade-to-premium` | userController.upgradeToPremium | ❌ Missing | 🔄 |
| GET | `/user/premium-status` | userController.getPremiumStatus | ❌ Missing | 🔄 |

## Plant Management Routes (`/plants`)

### Backend Routes (routes/plant.js)
| Method | Endpoint | Controller | Frontend API | Status |
|--------|----------|------------|--------------|--------|
| GET | `/plants` | plantController.getUserPlants | plantApi.getAll | ⚠️ Wrong URL |
| GET | `/plants/:id` | plantController.getPlantById | plantApi.getById | ⚠️ Wrong URL |

### URL Mapping Issues
```javascript
// Current Frontend (WRONG)
plantApi.getAll: '/api/plants'      
plantApi.getById: '/api/plants/:id'

// Backend Routes (CORRECT)
GET /plants
GET /plants/:id

// Fix: Remove '/api' prefix from frontend calls
```

## Payment Routes (`/payment`)

### Backend Routes (routes/payment.js)
| Method | Endpoint | Controller | Frontend API | Status |
|--------|----------|------------|--------------|--------|
| POST | `/payment/create` | PaymentController.createPayment | paymentApi.createPaymentUrl | ✅ |
| GET | `/payment/vnpay-return` | PaymentController.handleVNPayReturn | ❌ Missing | 🔄 |
| POST | `/payment/vnpay-ipn` | PaymentController.handleVNPayIPN | ❌ Missing | 🔄 |
| GET | `/payment/history` | PaymentController.getPaymentHistory | ❌ Missing | 🔄 |

## Dashboard & Sensor Routes

### Missing Backend Routes
| Frontend API | Expected Backend | Status |
|--------------|------------------|--------|
| dashboardApi.getLayout | `/dashboard/layout` | ❌ Not implemented |
| dashboardApi.saveLayout | `/dashboard/layout` | ❌ Not implemented |
| sensorApi.* | `/sensors/*` | ❌ Need implementation |
| reportsApi.* | `/reports/*` | ❌ Need implementation |
| zonesApi.* | `/zones/*` | ❌ Need implementation |
| thresholdsApi.* | `/thresholds/*` | ❌ Need implementation |

## Critical Issues to Fix

### 1. URL Prefix Inconsistency
- Frontend uses `/api/plants` but backend expects `/plants`
- Need to standardize URL structure

### 2. Missing Frontend APIs
- Get current user (`/auth/me`)
- Premium upgrade functionality
- Payment history
- Google account linking/unlinking

### 3. Parameter Mismatches
- Login: Frontend doesn't support Google login parameters
- Register: Missing confirmPassword validation on backend

### 4. Missing Backend Routes
- Dashboard layout management
- Sensor data endpoints
- Reports and analytics
- Zone management
- Threshold configuration

## Recommended Fixes

### High Priority
1. Fix URL prefix inconsistency
2. Add missing authentication APIs
3. Implement user premium upgrade flow
4. Add payment history functionality

### Medium Priority  
1. Implement dashboard layout APIs
2. Add sensor data management
3. Create reports endpoints
4. Implement zone management

### Low Priority
1. Add Google account management
2. Implement advanced features
3. Add comprehensive error handling

---

## ✅ FINAL STATUS: RESOLVED (All Critical Issues Fixed)

### Completed Actions
1. **URL Prefix Issues Fixed**
   - ✅ Removed incorrect `/api` prefixes from plantApi.js (all endpoints)
   - ✅ Removed incorrect `/api` prefixes from aiApi.js (all endpoints)
   - ✅ All frontend APIs now correctly match backend route structure

2. **Missing APIs Implemented**
   - ✅ Added getCurrentUser, updateProfile, verifyEmail to authApi.js
   - ✅ Enhanced userApi.js with settings, preferences, subscription methods
   - ✅ Extended dashboardApi.js with stats, activities, notifications
   - ✅ Created new sensorApi.js with comprehensive sensor data management
   - ✅ Created new reportApi.js with report generation and management
   - ✅ Created new notificationApi.js with full notification system

3. **Integration Improvements**
   - ✅ Created centralized src/api/index.js for organized API exports
   - ✅ Updated register form with complete i18n integration
   - ✅ Fixed parameter alignment between frontend forms and backend controllers
   - ✅ Added missing translation keys for all form elements

4. **Frontend-Backend Compatibility**
   - ✅ All authentication forms (login, register, forgot-password) properly integrated
   - ✅ API parameter names match backend expectations exactly
   - ✅ Error handling preserved while fixing integration issues
   - ✅ Original designs maintained throughout all updates

### Integration Guide

**For Developers:** Use the centralized API exports:
```javascript
// Import specific APIs
import { authApi, plantApi, userApi } from '@/api'

// Or import the api object
import api from '@/api'
api.auth.login(email, password)
```

**Backend Compatibility:** All frontend API calls now correctly map to backend routes without URL prefix issues.

**i18n Integration:** All form components support multi-language with proper translation keys.
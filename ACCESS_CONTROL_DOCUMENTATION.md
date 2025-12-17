# Access Control System - Role-Based Authentication

## Overview
The plant monitoring system now uses a comprehensive 4-tier role-based access control system:

### Roles Hierarchy
1. **Regular** - Basic features only
2. **Premium** - Premium features (advanced reports, analytics)
3. **Ultimate** - AI features + all Premium features
4. **Admin** - All features + administrative controls

## Access Middleware Structure

### File: `middlewares/accessMiddleware.js`
Provides comprehensive role-based access control with the following functions:

#### Core Middleware Functions:
- `isAdmin()` - Requires Admin role only
- `isPremium()` - Requires Premium, Ultimate, or Admin role
- `isUltimate()` - Requires Ultimate or Admin role (for AI features)
- `isPremiumOnly()` - Requires Premium role exactly (excludes Ultimate/Admin)
- `isUltimateOnly()` - Requires Ultimate role exactly (excludes Admin)
- `addRoleStatus()` - Adds role flags to req.user object
- `requireRoles(array)` - Factory function for custom role combinations

## Feature Access Matrix

| Feature Type | Regular | Premium | Ultimate | Admin |
|--------------|---------|---------|----------|-------|
| Basic Plant Monitoring | ✅ | ✅ | ✅ | ✅ |
| Advanced Reports | ❌ | ✅ | ✅ | ✅ |
| Premium Analytics | ❌ | ✅ | ✅ | ✅ |
| AI Chatbot | ❌ | ❌ | ✅ | ✅ |
| AI Image Analysis | ❌ | ❌ | ✅ | ✅ |
| AI Plant Identification | ❌ | ❌ | ✅ | ✅ |
| AI Disease Detection | ❌ | ❌ | ✅ | ✅ |
| Admin Panel | ❌ | ❌ | ❌ | ✅ |

## Route Protection

### AI Routes (`routes/ai.js`)
All AI endpoints now require `isUltimate` middleware:
- `/api/ai/chatbot` - Ultimate or Admin
- `/api/ai/image-recognition` - Ultimate or Admin
- `/api/ai/analyze-health` - Ultimate or Admin
- `/api/ai/identify-plant` - Ultimate or Admin
- `/api/ai/detect-disease` - Ultimate or Admin

### Frontend Integration
- `aiApi.js` - Updated to check for Ultimate role
- All AI components properly handle `requiresUltimate` errors
- Error messages clearly specify "Ultimate subscription required"

## Database Schema
The User model supports all four roles with the following constraint:
```sql
CHECK (role IN ('Regular', 'Premium', 'Ultimate', 'Admin'))
```

## Migration Required
To enable Ultimate role in existing databases:
```bash
node migrations/002_update_user_roles.js
```

## Error Codes
- `AUTH_REQUIRED` - User not logged in
- `PREMIUM_REQUIRED` - Needs Premium, Ultimate, or Admin
- `ULTIMATE_REQUIRED` - Needs Ultimate or Admin (AI features)
- `ADMIN_REQUIRED` - Needs Admin role only
- `INSUFFICIENT_ROLE` - Role doesn't meet requirements

## Usage Examples

### Route Protection:
```javascript
// AI features (Ultimate or Admin only)
router.post('/chatbot', authenticate, isUltimate, controller);

// Premium features (Premium, Ultimate, or Admin)
router.get('/reports', authenticate, isPremium, controller);

// Admin only features
router.delete('/users/:id', authenticate, isAdmin, controller);

// Custom role combinations
router.post('/special', authenticate, requireRoles(['Ultimate', 'Admin']), controller);
```

### Frontend Checks:
```javascript
// Check if user has AI access
const hasAIAccess = user.role === 'Ultimate' || user.role === 'Admin';

// Check API responses
if (response.requiresUltimate) {
  showMessage('Ultimate subscription required for AI features');
}
```

This system provides clear separation of features by subscription tier while maintaining flexibility for future role additions.
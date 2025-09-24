# Profile Management & Premium Upgrade API Documentation

## Overview

This document provides detailed information about the Profile Management and Premium Upgrade features in the Plant Monitoring System. These features allow users to manage their profile information and upgrade to premium status.

## API Endpoints

### Profile Management

#### 1. Get User Profile

```http
GET /users/profile
```

**Authentication Required**: Yes (JWT Token)

**Request Headers**:
```
Authorization: Bearer <jwt_token>
```

**Response (200 OK)**:
```json
{
  "success": true,
  "data": {
    "user_id": 1,
    "email": "user@example.com",
    "full_name": "John Doe",
    "role": "Regular",
    "notification_prefs": {
      "email": true,
      "push": false
    },
    "created_at": "2025-09-01T08:00:00.000Z"
  }
}
```

**Error Responses**:
- 401 Unauthorized: Invalid or missing token
- 404 Not Found: User not found
- 500 Internal Server Error: Server error

#### 2. Update User Profile

```http
PUT /users/profile
```

**Authentication Required**: Yes (JWT Token)

**Request Headers**:
```
Authorization: Bearer <jwt_token>
Content-Type: application/json
```

**Request Body**:
```json
{
  "full_name": "John Smith",
  "notification_prefs": {
    "email": true,
    "push": true
  }
}
```

**Response (200 OK)**:
```json
{
  "success": true,
  "message": "Profile updated successfully",
  "data": {
    "user_id": 1,
    "email": "user@example.com",
    "full_name": "John Smith",
    "role": "Regular",
    "notification_prefs": {
      "email": true,
      "push": true
    },
    "created_at": "2025-09-01T08:00:00.000Z"
  }
}
```

**Error Responses**:
- 400 Bad Request: Invalid input data
- 401 Unauthorized: Invalid or missing token
- 404 Not Found: User not found
- 500 Internal Server Error: Server error

#### 3. Change Password

```http
PUT /users/change-password
```

**Authentication Required**: Yes (JWT Token)

**Request Headers**:
```
Authorization: Bearer <jwt_token>
Content-Type: application/json
```

**Request Body**:
```json
{
  "currentPassword": "oldPassword123",
  "newPassword": "newPassword456"
}
```

**Response (200 OK)**:
```json
{
  "success": true,
  "message": "Password changed successfully"
}
```

**Error Responses**:
- 400 Bad Request: Missing required fields or password too weak
- 401 Unauthorized: Current password is incorrect
- 404 Not Found: User not found
- 500 Internal Server Error: Server error

### Premium Upgrade

#### 1. Upgrade to Premium

```http
POST /users/upgrade-to-premium
```

**Authentication Required**: Yes (JWT Token)

**Request Headers**:
```
Authorization: Bearer <jwt_token>
Content-Type: application/json
```

**Request Body**:
```json
{
  "paymentId": 123
}
```

**Response (200 OK)**:
```json
{
  "success": true,
  "message": "Successfully upgraded to Premium",
  "data": {
    "user_id": 1,
    "email": "user@example.com",
    "full_name": "John Smith",
    "role": "Premium",
    "notification_prefs": {
      "email": true,
      "push": true
    },
    "created_at": "2025-09-01T08:00:00.000Z"
  }
}
```

**Error Responses**:
- 400 Bad Request: Payment ID missing or invalid status
- 401 Unauthorized: Invalid or missing token
- 403 Forbidden: Payment doesn't belong to user
- 404 Not Found: User or payment not found
- 500 Internal Server Error: Server error

#### 2. Get Premium Status

```http
GET /users/premium-status
```

**Authentication Required**: Yes (JWT Token)

**Request Headers**:
```
Authorization: Bearer <jwt_token>
```

**Response (200 OK)**:
```json
{
  "success": true,
  "data": {
    "isPremium": true,
    "role": "Premium",
    "premiumFeatures": [
      "Advanced plant analytics",
      "Multiple plant zones management",
      "Custom dashboard widgets",
      "Advanced sensor thresholds",
      "Priority customer support"
    ]
  }
}
```

**Response (Non-Premium, 200 OK)**:
```json
{
  "success": true,
  "data": {
    "isPremium": false,
    "role": "Regular",
    "premiumFeatures": []
  }
}
```

**Error Responses**:
- 401 Unauthorized: Invalid or missing token
- 404 Not Found: User not found
- 500 Internal Server Error: Server error

## Authentication

All endpoints require authentication using JWT token. The token must be included in the Authorization header:

```
Authorization: Bearer <jwt_token>
```

## Premium Features

Users with Premium role have access to the following additional features:

1. **Advanced plant analytics**: Detailed health metrics and trend analysis
2. **Multiple plant zones management**: Group plants by zones for better organization
3. **Custom dashboard widgets**: Customizable dashboard layout and widgets
4. **Advanced sensor thresholds**: Set complex rules for plant care
5. **Priority customer support**: Faster response time for support requests

## Error Handling

All API endpoints follow a consistent error response format:

```json
{
  "success": false,
  "error": "Error message describing the issue"
}
```

## Implementation Notes

1. The profile management and premium upgrade features use the following components:
   - User model: For profile information and role management
   - Payment model: For payment verification during premium upgrade
   - Authentication middleware: For route protection
   - JWT tokens: For user authentication

2. The user's role is stored in the `role` field and can have one of the following values:
   - `Regular`: Basic user with limited features
   - `Premium`: User with access to all premium features
   - `Admin`: Administrative user with full system access

3. When upgrading to premium, the system verifies that the payment:
   - Belongs to the current user
   - Has a status of "completed"
   - Is a valid payment in the system

4. Profile updates validate input data before saving to prevent invalid or malicious data.

5. Password changes require verification of the current password for security purposes.

## Frontend Integration

Frontend applications should:

1. Include the JWT token in all API requests
2. Handle token expiration and refresh as needed
3. Provide appropriate UI for profile management and premium features
4. Implement form validation for profile updates and password changes

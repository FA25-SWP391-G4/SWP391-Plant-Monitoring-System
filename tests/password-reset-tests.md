# Password Reset API Testing

This document provides JSON examples for testing the password reset functionality using tools like Postman, Thunder Client, or curl.

## Base URL
```
http://localhost:3010
```

## 1. Register a Test User

**POST** `/auth/register`

```json
{
    "email": "testuser@example.com",
    "password": "testpassword123",
    "full_name": "Test User",
    "role": "Regular"
}
```

**Expected Response:**
```json
{
    "message": "User registered successfully",
    "user": {
        "id": "user_id_here",
        "email": "testuser@example.com",
        "full_name": "Test User",
        "role": "Regular"
    }
}
```

## 2. Login Test

**POST** `/auth/login`

```json
{
    "email": "testuser@example.com",
    "password": "testpassword123"
}
```

**Expected Response:**
```json
{
    "message": "Login successful",
    "token": "jwt_token_here",
    "user": {
        "id": "user_id_here",
        "email": "testuser@example.com",
        "full_name": "Test User",
        "role": "Regular"
    }
}
```

## 3. Request Password Reset

**POST** `/auth/forgot-password`

```json
{
    "email": "testuser@example.com"
}
```

**Expected Response:**
```json
{
    "message": "Password reset email sent successfully",
    "email": "testuser@example.com"
}
```

## 4. Reset Password (use token from email)

**POST** `/auth/reset-password?token=YOUR_RESET_TOKEN_HERE`

```json
{
    "password": "newpassword123",
    "confirmPassword": "newpassword123"
}
```

**Expected Response:**
```json
{
    "message": "Password reset successful. You can now login with your new password."
}
```

## 5. Test Login with New Password

**POST** `/auth/login`

```json
{
    "email": "testuser@example.com",
    "password": "newpassword123"
}
```

## Error Response Examples

### User Not Found
```json
{
    "error": "User not found with this email address"
}
```

### Invalid Token
```json
{
    "error": "Invalid or expired password reset token"
}
```

### Password Mismatch
```json
{
    "error": "Passwords do not match"
}
```

### Missing Fields
```json
{
    "error": "Email is required"
}
```

## Testing with curl

### Register User
```bash
curl -X POST http://localhost:3010/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"testuser@example.com","password":"testpassword123","full_name":"Test User"}'
```

### Request Password Reset
```bash
curl -X POST http://localhost:3010/auth/forgot-password \
  -H "Content-Type: application/json" \
  -d '{"email":"testuser@example.com"}'
```

### Reset Password
```bash
curl -X POST "http://localhost:3010/auth/reset-password?token=YOUR_TOKEN_HERE" \
  -H "Content-Type: application/json" \
  -d '{"password":"newpassword123","confirmPassword":"newpassword123"}'
```

## Notes

1. Make sure MongoDB is running before testing
2. Configure your email settings in the .env file for password reset emails to work
3. The reset token expires in 1 hour
4. Each reset token can only be used once
5. Password must be at least 6 characters long

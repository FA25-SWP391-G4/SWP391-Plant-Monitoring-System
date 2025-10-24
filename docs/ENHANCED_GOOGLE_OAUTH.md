# Enhanced Google OAuth 2.0 Configuration

This document outlines the required environment variables for the enhanced Google OAuth 2.0 implementation in the Plant Monitoring System.

## Required Environment Variables

Add these variables to your `.env` file:

```
# Google OAuth 2.0 Configuration
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret
GOOGLE_REDIRECT_URI=http://localhost:3000/auth/google/callback

# Session Configuration
SESSION_SECRET=a_very_long_random_string_for_security

# Frontend URL for CORS
FRONTEND_URL=http://localhost:3000
```

## Setup Instructions

1. Visit the [Google Cloud Console](https://console.cloud.google.com/apis/credentials)
2. Create a new OAuth 2.0 Client ID (Web application type)
3. Add the following Authorized Redirect URIs:
   - `http://localhost:3000/auth/google/callback` (for local development)
   - Your production URL + `/auth/google/callback` (for production)
4. Copy the Client ID and Client Secret to your `.env` file

## Security Best Practices

- Use a strong, randomly generated string for the SESSION_SECRET
- In production, always set secure=true for cookies
- Store refresh tokens securely in the database
- Implement proper CSRF protection with state parameter (already implemented)
- Use HTTPS in production environments

## Testing the Google OAuth Flow

1. Start your application
2. Navigate to `/login`
3. Click the "Login with Google" button
4. You should be redirected to Google's consent page
5. After granting permission, you'll be redirected back to the application
6. For new users, you'll be redirected to the registration page with pre-filled information
7. For existing users, you'll be logged in automatically

## OAuth Flow Diagram

```
Client                           Server                          Google
  │                                │                                │
  │   1. Click "Login with Google" │                                │
  │  ────────────────────────────>│                                │
  │                                │   2. Generate state parameter  │
  │                                │   Store in session             │
  │                                │                                │
  │   3. Redirect to Google        │                                │
  │   with state parameter         │                                │
  │  <────────────────────────────│                                │
  │                                │                                │
  │   4. Redirect to Google        │                                │
  │  ──────────────────────────────────────────────────────────────>│
  │                                │                                │
  │                                │                                │   5. User authenticates
  │                                │                                │   and grants permissions
  │                                │                                │
  │   6. Redirect to callback      │                                │
  │   with code and state          │                                │
  │  <──────────────────────────────────────────────────────────────│
  │                                │                                │
  │   7. Send code and state       │                                │
  │  ────────────────────────────>│                                │
  │                                │   8. Verify state matches      │
  │                                │   session.state                │
  │                                │                                │
  │                                │   9. Exchange code for tokens  │
  │                                │  ────────────────────────────>│
  │                                │                                │
  │                                │   10. Return tokens            │
  │                                │  <────────────────────────────│
  │                                │                                │
  │                                │   11. Get user profile        │
  │                                │  ────────────────────────────>│
  │                                │                                │
  │                                │   12. Return profile data      │
  │                                │  <────────────────────────────│
  │                                │                                │
  │   13. Set auth cookie and      │                                │
  │   redirect to dashboard        │                                │
  │  <────────────────────────────│                                │
  │                                │                                │
```

## Refresh Token Usage

The system now stores refresh tokens, allowing for long-term access to Google APIs without requiring the user to log in repeatedly. This enables background syncing of data from Google services if needed.

## Revoking Access

Users can revoke access to their Google account by calling the `/auth/google/revoke` endpoint. This will:

1. Revoke the access token at Google
2. Remove the refresh token from the database
3. Log the user out of the application

## Resources

- [Google OAuth 2.0 Documentation](https://developers.google.com/identity/protocols/oauth2)
- [Express Session Documentation](https://www.npmjs.com/package/express-session)
- [OAuth 2.0 Security Best Practices](https://tools.ietf.org/html/draft-ietf-oauth-security-topics-15)
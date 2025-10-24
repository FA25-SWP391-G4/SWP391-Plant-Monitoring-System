# Enhanced Google OAuth 2.0 Integration

This document provides a comprehensive overview of the enhanced Google OAuth 2.0 implementation in the Plant Monitoring System.

## Implementation Overview

The system now supports two methods of Google OAuth integration:

1. **Client-side Flow (Popup)**: Uses the Google OAuth implicit flow with a popup window
2. **Server-side Flow (Redirect)**: Uses the more secure authorization code flow with state parameter for CSRF protection

### Security Improvements

The enhanced implementation includes:

- **CSRF Protection**: Using state parameter to prevent cross-site request forgery attacks
- **Refresh Token Storage**: Securely storing refresh tokens for long-term API access
- **Session Cookies**: Implementing session cookies that void on browser close
- **Server-side Validation**: Proper verification of tokens on the server side

## Architecture

```
┌─────────────┐     ┌─────────────┐    ┌─────────────────┐
│ React       │     │ Express     │    │ Google          │
│ Frontend    │◄───►│ Backend     │◄──►│ OAuth 2.0 API   │
└─────────────┘     └─────────────┘    └─────────────────┘
       ▲                   ▲                    ▲
       │                   │                    │
       ▼                   ▼                    ▼
┌─────────────┐     ┌─────────────┐    ┌─────────────────┐
│ useGoogleAuth│     │ Google Auth │    │ OAuth Consent   │
│ Custom Hook  │     │ Controller  │    │ Screen          │
└─────────────┘     └─────────────┘    └─────────────────┘
```

## Key Components

### Backend

1. **`googleAuthController.js`**: Manages server-side Google OAuth flow
   - `initiateGoogleAuth`: Starts OAuth flow with state parameter
   - `googleAuthCallback`: Processes OAuth callback from Google
   - `revokeGoogleAccess`: Revokes Google access for a user

2. **`googleAuthRoutes.js`**: Routes for Google OAuth endpoints
   - `/auth/google/login`: Initiates OAuth flow
   - `/auth/google/callback`: Handles OAuth callback
   - `/auth/google/revoke`: Revokes Google access

### Frontend

1. **`useGoogleAuth.js`**: Enhanced hook with both client and server-side flows
   - `processGoogleToken`: Processes tokens from Google
   - `initiateServerSideAuth`: Starts server-side OAuth flow
   - `handleGoogleCallback`: Handles client-side flow callback
   - `initGoogleSignIn`: Initiates client-side popup flow

2. **`GoogleLoginButton.jsx`**: Flexible button component for Google login
   - Supports both popup and redirect flows
   - Includes loading states and error handling

## Usage Examples

### Adding Google Login to a Form

```jsx
import { GoogleLoginButton } from '@/components/GoogleLoginButton';

export function LoginForm() {
  return (
    <form>
      {/* Regular login fields */}
      <div className="mt-4">
        <GoogleLoginButton flowType="redirect" />
      </div>
    </form>
  );
}
```

### Handling OAuth Callbacks in a Page

```jsx
'use client';

import { useEffect } from 'react';
import { useGoogleAuth } from '@/hooks/useGoogleAuth';

export default function OAuthCallbackPage() {
  const { handleGoogleCallback } = useGoogleAuth();
  
  useEffect(() => {
    handleGoogleCallback();
  }, [handleGoogleCallback]);
  
  return (
    <div>
      <p>Processing authentication...</p>
    </div>
  );
}
```

## Data Flow

### Server-side Flow (Recommended)

1. User clicks "Login with Google" button
2. Backend generates secure state parameter and stores in session
3. User is redirected to Google's consent page
4. After authentication, Google redirects back with code and state
5. Backend verifies state matches session state (CSRF protection)
6. Backend exchanges code for access and refresh tokens
7. Backend fetches user profile from Google
8. Backend creates session for user or redirects to registration
9. Refresh token is securely stored in database for future use

### Client-side Flow (Alternative)

1. User clicks "Login with Google" button
2. Popup window opens with Google's consent page
3. After authentication, Google redirects with token in URL fragment
4. Frontend extracts token and sends to backend for verification
5. Backend verifies token and creates user session
6. Frontend redirects user to appropriate page

## Registration for New Users

For new Google users:

1. User information from Google is stored in localStorage
2. User is redirected to registration page
3. Registration form is pre-filled with Google data
4. Password field is optional for Google users
5. Upon registration, Google ID is linked to the new account

## Future Enhancements

1. **Multi-provider Support**: Extend this pattern to other OAuth providers
2. **Google API Integration**: Use refresh tokens for Google Calendar/Drive integration
3. **Token Rotation**: Implement refresh token rotation for enhanced security
4. **Silent Refresh**: Add background token refresh for seamless experience

## Troubleshooting

1. **Popup Blocked**: Check browser popup blocker settings
2. **State Mismatch**: Ensure session cookies are properly configured
3. **Missing Refresh Token**: Set access_type to 'offline' and prompt to 'consent'
4. **CORS Issues**: Verify CORS settings match your domains

## References

- [Google OAuth 2.0 Documentation](https://developers.google.com/identity/protocols/oauth2)
- [OAuth 2.0 Security Best Practices](https://tools.ietf.org/html/draft-ietf-oauth-security-topics-15)
- [Express Session Documentation](https://www.npmjs.com/package/express-session)
# Google OAuth Flow - Complete Documentation

## Overview

This document explains the complete Google OAuth authentication flow in the Plant Monitoring System.

## Architecture

The system uses **server-side OAuth 2.0 flow** with Google Identity Services:

```
Frontend → Backend OAuth Endpoint → Google → Backend Callback → Frontend Callback → Dashboard
```

## Flow Details

### 1. User Clicks Google Sign In

**File**: `client/src/components/auth/LoginForm.jsx`

```javascript
const handleCredentialResponse = () => {
  const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';
  window.location.href = `${API_URL}/auth/google/login`;
};
```

**Action**: Redirects browser to backend OAuth endpoint

### 2. Backend Initiates OAuth Flow

**File**: `controllers/googleAuthController.js`
**Function**: `initiateGoogleAuth(req, res)`

```javascript
// Generate state parameter for CSRF protection
const state = crypto.randomBytes(16).toString('hex');

// Store state and redirect URL in session
req.session.oauthState = state;
req.session.redirectAfterLogin = req.query.redirect || '/dashboard';

// Generate Google OAuth URL with scopes
const authUrl = oauth2Client.generateAuthUrl({
  access_type: 'offline',
  scope: SCOPES,
  state: state,
  prompt: 'consent'
});

// Redirect to Google consent screen
res.redirect(authUrl);
```

**Action**: Redirects to Google's consent screen

### 3. User Approves on Google

User signs in to Google and approves the requested permissions:
- Email
- Profile information
- OpenID

### 4. Google Redirects to Backend Callback

**URL**: `GET /auth/google/callback?code=...&state=...`
**File**: `controllers/googleAuthController.js`
**Function**: `googleAuthCallback(req, res)`

```javascript
// Verify state parameter (CSRF protection)
if (req.query.state !== req.session.oauthState) {
  throw new Error('Invalid state parameter');
}

// Exchange authorization code for tokens
const { tokens } = await oauth2Client.getToken(req.query.code);
oauth2Client.setCredentials(tokens);

// Get user info from Google
const oauth2 = google.oauth2({ version: 'v2', auth: oauth2Client });
const { data } = await oauth2.userinfo.get();

// Check if user exists
const existingUser = await User.findByEmail(data.email);

if (existingUser) {
  // User exists - call login function
  req.body = {
    email: data.email,
    googleId: data.id,
    loginMethod: 'google',
    refreshToken: tokens.refresh_token
  };
  
  return login(req, res); // Calls authController.login
} else {
  // New user - redirect to registration
  const userData = {
    email: data.email,
    googleId: data.id,
    given_name: data.given_name,
    family_name: data.family_name,
    picture: data.picture
  };
  
  const encodedData = Buffer.from(JSON.stringify(userData)).toString('base64');
  res.redirect(`${FRONTEND_URL}/register?google=${encodedData}`);
}
```

**Action**: 
- Exchanges code for tokens
- Gets user profile from Google
- If user exists → calls `login()` function
- If new user → redirects to registration with Google data

### 5. Backend Login Function

**File**: `controllers/authController.js`
**Function**: `login(req, res)`

```javascript
const { email, googleId, refreshToken, loginMethod } = req.body;

// Find user
const user = await User.findByEmail(email);

// Validate Google login
if (loginMethod === 'google') {
  // Verify user has google_id
  if (!user.google_id) {
    return res.status(401).json({
      error: 'This email is registered without Google. Please login with password.',
      requiresLinking: true
    });
  }
  
  // Store refresh token if provided
  if (refreshToken) {
    await user.update({ google_refresh_token: refreshToken });
  }
}

// Generate JWT token
const token = generateToken(user);

// Set cookie
res.cookie('auth_token', token, {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'lax',
  maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
});

// Redirect to frontend callback
const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
const redirectUrl = req.session.redirectAfterLogin || '/dashboard';

res.redirect(`${frontendUrl}/auth/callback?token=${token}&redirect=${encodeURIComponent(redirectUrl)}`);
```

**Action**: 
- Validates user and Google ID
- Generates JWT token
- Sets HTTP-only cookie
- Redirects to frontend callback

### 6. Frontend Auth Callback

**File**: `client/src/app/auth/callback/page.jsx`

```javascript
const params = new URLSearchParams(window.location.search);
const token = params.get('token');
const redirect = params.get('redirect') || '/dashboard';

// Decode JWT to get user info
const payload = JSON.parse(atob(token.split('.')[1]));
const user = payload.user;

// Store in auth context
login(token, user);

// Redirect to destination
router.push(redirect);
```

**Action**: 
- Extracts token from URL
- Decodes JWT payload
- Stores in auth context (localStorage + state)
- Redirects to dashboard

## Data Flow

### User Object Structure

```javascript
{
  user_id: "uuid",
  email: "user@gmail.com",
  given_name: "John",
  family_name: "Doe",
  full_name: "John Doe",
  google_id: "google-user-id",
  google_refresh_token: "refresh-token",
  picture: "https://...",
  role: "user",
  source: "google"
}
```

### JWT Token Payload

```javascript
{
  user: {
    user_id: "uuid",
    email: "user@gmail.com",
    family_name: "Doe",
    given_name: "John",
    full_name: "John Doe",
    role: "user"
  },
  iat: 1234567890,
  exp: 1234654290
}
```

## Error Handling

### Case 1: User Exists Without Google

```javascript
// Response
{
  error: 'This email is registered without Google. Please login with password.',
  requiresLinking: true
}
```

**Frontend Action**: Show option to link Google account or login with password

### Case 2: Google ID Mismatch

```javascript
// Response
{
  error: 'Google account mismatch'
}
```

**Frontend Action**: Show error, require re-authentication

### Case 3: New User (No Account)

**Backend Action**: Redirect to registration with Google data
```
/register?google=BASE64_ENCODED_DATA
```

**Frontend Action**: Pre-fill registration form with Google data

## Security Features

1. **CSRF Protection**: State parameter validation
2. **HTTP-Only Cookies**: Prevents XSS attacks
3. **Secure Tokens**: JWT with 24-hour expiration
4. **Refresh Tokens**: Stored securely in database
5. **HTTPS**: Required in production
6. **SameSite Cookie**: Prevents CSRF attacks

## Environment Variables

```env
# Backend (.env)
GOOGLE_CLIENT_ID=your-client-id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your-client-secret
GOOGLE_CALLBACK_URL=http://localhost:5000/auth/google/callback
FRONTEND_URL=http://localhost:3000
SESSION_SECRET=your-session-secret

# Frontend (.env.local)
NEXT_PUBLIC_API_URL=http://localhost:5000
NEXT_PUBLIC_GOOGLE_CLIENT_ID=your-client-id.apps.googleusercontent.com
```

## Testing Checklist

- [ ] Google Sign In button redirects to backend OAuth endpoint
- [ ] Backend redirects to Google consent screen
- [ ] Google callback returns to backend with code
- [ ] Backend exchanges code for tokens successfully
- [ ] Backend calls login function with correct data
- [ ] Login function generates JWT token
- [ ] Backend redirects to frontend callback with token
- [ ] Frontend extracts and stores token
- [ ] Frontend redirects to dashboard
- [ ] User info displays correctly in UI
- [ ] Cookie persists across page refreshes
- [ ] Error cases handled properly (no account, mismatched ID, etc.)

## Common Issues

### Issue 1: Redirect Loop

**Symptom**: Constant redirects between frontend and backend

**Solution**: Check that `loginMethod: 'google'` is set correctly in backend callback

### Issue 2: Token Not Stored

**Symptom**: User logged out after redirect

**Solution**: Verify AuthProvider's login function stores token in localStorage

### Issue 3: Google ID Mismatch

**Symptom**: Error "Google account mismatch"

**Solution**: User tried to link different Google account - clear database google_id and retry

### Issue 4: Missing User Data

**Symptom**: Name/email not displaying

**Solution**: Check JWT payload includes all user fields (given_name, family_name, etc.)

## File Reference

| File | Purpose |
|------|---------|
| `controllers/googleAuthController.js` | OAuth flow logic (initiate, callback) |
| `controllers/authController.js` | Login function (handles Google + password) |
| `client/src/components/auth/LoginForm.jsx` | Google Sign In button |
| `client/src/app/auth/callback/page.jsx` | Frontend OAuth callback handler |
| `routes/authRoutes.js` | OAuth route definitions |
| `models/User.js` | User database model |

## Next Steps

1. **Registration Flow**: Implement Google registration for new users
2. **Account Linking**: Allow users to link Google to existing password accounts
3. **Refresh Tokens**: Implement token refresh logic
4. **Error UI**: Create user-friendly error pages for OAuth failures

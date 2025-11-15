# Google OAuth Cookie & Redirect Fix - Complete Solution

## Problems Identified

### Problem 1: Cookie Not Being Set/Accessible
**Symptom**: "No cookies" after successful Google login

**Root Cause**: Cross-domain cookie issue
- Backend sets cookie on `localhost:5000` domain
- Frontend runs on `localhost:3000` domain
- Browser blocks cross-domain cookies by default
- HTTP-only cookie from backend can't be accessed by frontend JavaScript

### Problem 2: Redirect Not Working
**Symptom**: User redirected to landing page instead of dashboard

**Root Cause**: OAuth flow expects redirect, but response handling was mixed
- Backend was setting cookie (for API calls) during OAuth flow
- OAuth flow should only use URL-based token passing
- Frontend callback page successfully extracts token but cookie was missing

## Solutions Applied

### Fix 1: Remove Cookie Setting from OAuth Flow

**File**: `controllers/authController.js`

**Before** (Wrong):
```javascript
// Generate JWT token
const token = generateToken(user);

// Set cookie for ALL login types (including OAuth)
res.cookie('auth_token', token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: 7 * 24 * 60 * 60 * 1000
});

// Then redirect for OAuth (cookie won't work!)
if (loginMethod === 'google') {
    return res.redirect(`${frontendUrl}/auth/callback?token=${token}`);
}
```

**After** (Correct):
```javascript
// Generate JWT token
const token = generateToken(user);

// For Google login via OAuth controller, redirect to frontend callback
if (loginMethod === 'google') {
    // NO COOKIE - just redirect with token in URL
    // Frontend will store token in its own cookie
    return res.redirect(`${frontendUrl}/auth/callback?token=${token}&redirect=${redirectUrl}`);
}

// For regular login, send JSON response with cookie
res.cookie('auth_token', token, { ... });
res.status(200).json({ success: true, ... });
```

**Key Changes**:
1. Moved cookie setting **after** OAuth redirect check
2. OAuth flow only uses URL parameter for token
3. Regular API login still uses cookie + JSON response

### Fix 2: Enhanced Error Handling with Redirects

**File**: `controllers/authController.js`

All error cases now check for `loginMethod === 'google'` and redirect with error parameters:

```javascript
// Case 1: Account not linked to Google
if (!user.google_id) {
    console.log('[GOOGLE AUTH] User exists but does not have Google ID');
    
    if (loginMethod === 'google') {
        const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
        return res.redirect(`${frontendUrl}/login?error=account_not_linked&email=${encodeURIComponent(email)}`);
    }
    
    // For API calls, return JSON
    return res.status(401).json({ error: '...', requiresLinking: true });
}

// Case 2: Google ID mismatch
if (googleId && user.google_id !== googleId) {
    if (loginMethod === 'google') {
        return res.redirect(`${frontendUrl}/login?error=google_id_mismatch`);
    }
    return res.status(401).json({ error: 'Google account mismatch' });
}

// Case 3: New user (no account)
if (!user) {
    if (loginMethod === 'google') {
        return res.redirect(`${frontendUrl}/register?error=account_not_found&email=${email}&google=true`);
    }
    return res.status(401).json({ error: 'Invalid email or password' });
}
```

### Fix 3: Frontend Error Display

**File**: `client/src/app/login/page.jsx`

Added OAuth error detection and display:

```javascript
// Handle OAuth errors from URL parameters
useEffect(() => {
    const error = searchParams.get('error');
    const email = searchParams.get('email');
    
    if (error) {
        if (error === 'account_not_linked') {
            const message = `This email (${email}) is already registered with a password. Please log in with your password, or link your Google account in settings.`;
            setOauthError(message);
            toast.error('Account not linked to Google');
        } else if (error === 'google_id_mismatch') {
            // ...
        } else if (error === 'account_not_found') {
            // Auto-redirect to registration
            setTimeout(() => {
                router.push(`/register?email=${email}&google=true`);
            }, 2000);
        }
    }
}, [searchParams]);
```

**Visual Error Alert**:
```jsx
{oauthError && (
    <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
        <div className="flex items-start">
            <svg>...</svg>
            <div>
                <h4 className="font-semibold text-red-900 mb-1">Authentication Error</h4>
                <p className="text-sm text-red-800">{oauthError}</p>
            </div>
        </div>
    </div>
)}
```

### Fix 4: Enhanced Callback Logging

**File**: `client/src/app/auth/callback/page.jsx`

Added comprehensive logging to debug token flow:

```javascript
console.log('[AUTH CALLBACK] Processing OAuth callback');
console.log('[AUTH CALLBACK] Current URL:', window.location.href);
console.log('[AUTH CALLBACK] Params:', { token: token ? 'present' : 'missing', redirect, error, email });

// ... later ...

console.log('[AUTH CALLBACK] Token received, decoding...');
console.log('[AUTH CALLBACK] User from token:', user);
console.log('[AUTH CALLBACK] Storing token in auth context');
console.log('[AUTH CALLBACK] Token stored, starting redirect countdown');
console.log('[AUTH CALLBACK] Redirecting to:', redirect);
```

## Expected Behavior After Fixes

### Successful Login Flow

```
1. User clicks Google Sign In
   ↓
2. Frontend redirects to: http://localhost:5000/auth/google/login
   ↓
3. Backend generates OAuth URL, redirects to Google
   ↓
4. User approves on Google consent screen
   ↓
5. Google redirects to: http://localhost:5000/auth/google/callback?code=...
   ↓
6. Backend:
   - Verifies state parameter
   - Exchanges code for tokens
   - Gets user profile from Google
   - Calls login(req, res) with loginMethod='google'
   ↓
7. login() function:
   - Validates user & Google ID
   - Generates JWT token
   - SKIPS cookie setting (cross-domain won't work)
   - Redirects to: http://localhost:3000/auth/callback?token=...&redirect=/dashboard
   ↓
8. Frontend callback page:
   - Extracts token from URL
   - Decodes JWT to get user info
   - Stores token in cookie (frontend domain: localhost:3000)
   - Stores user in auth context
   - Redirects to dashboard
   ↓
9. ✅ User on dashboard with token stored in frontend cookie!
```

### Error Case 1: Account Not Linked

```
User: optimusprime1963@gmail.com (has password, no google_id)
   ↓
Backend detects: user.google_id is null
   ↓
Redirects to: /login?error=account_not_linked&email=optimusprime1963@gmail.com
   ↓
Frontend displays:
┌─────────────────────────────────────────────────────────┐
│ ⚠️ Authentication Error                                 │
│                                                          │
│ This email (optimusprime1963@gmail.com) is already      │
│ registered with a password. Please log in with your     │
│ password, or link your Google account in settings.      │
└─────────────────────────────────────────────────────────┘
```

### Error Case 2: New User

```
User: newuser@gmail.com (no account exists)
   ↓
Backend detects: user not found
   ↓
Redirects to: /register?error=account_not_found&email=newuser@gmail.com&google=true
   ↓
Frontend displays:
┌─────────────────────────────────────────────────────────┐
│ ⚠️ Authentication Error                                 │
│                                                          │
│ No account found with this Google email.                │
│ Please register first.                                  │
│                                                          │
│ Redirecting to registration in 2 seconds...            │
└─────────────────────────────────────────────────────────┘
   ↓
Auto-redirects to registration page with email pre-filled
```

## Why This Approach Works

### 1. No Cross-Domain Cookie Issues
- Backend cookie only set for API calls (same domain)
- OAuth flow uses URL parameter for token
- Frontend stores token in its own cookie (localhost:3000 domain)
- Frontend cookie accessible to all frontend code

### 2. Proper OAuth Flow
- Backend handles full OAuth with Google
- Token passed via secure redirect URL
- Frontend extracts and stores token locally
- Clean separation of concerns

### 3. Dual Authentication Support

| Login Type | Token Delivery | Storage |
|------------|----------------|---------|
| **OAuth** | URL parameter → Frontend callback | Frontend cookie (`token`) |
| **API** | JSON response body | Backend cookie (`auth_token`) + Frontend cookie |

### 4. User-Friendly Error Handling
- Errors redirect to appropriate pages (login/register)
- Clear error messages displayed
- Auto-redirect for certain cases (new user → registration)
- Toast notifications for quick feedback

## Testing Checklist

- [ ] **Existing Google User**: 
  - Logs show: `[LOGIN] Google OAuth flow - redirecting to frontend callback`
  - Browser redirects to: `/auth/callback?token=...&redirect=/dashboard`
  - Console shows: `[AUTH CALLBACK] Token received, decoding...`
  - Dashboard loads with user info displayed
  - Token stored in cookies (check DevTools → Application → Cookies → localhost:3000)

- [ ] **New Google User**:
  - Redirects to: `/register?error=account_not_found&email=...&google=true`
  - Error alert displayed on registration page
  - Email pre-filled in registration form

- [ ] **Password Account (No Google)**:
  - Redirects to: `/login?error=account_not_linked&email=...`
  - Error alert displayed: "This email is already registered with a password..."
  - User can log in with password
  - Option to link Google account shown

- [ ] **Google ID Mismatch**:
  - Redirects to: `/login?error=google_id_mismatch`
  - Error alert displayed: "Google account mismatch..."

## Debugging Tips

### Check Backend Logs

**Success Pattern**:
```
[LOGIN] Google OAuth flow - redirecting to frontend callback
[LOGIN] Frontend URL: http://localhost:3000
[LOGIN] Redirect destination: /dashboard
GET /auth/google/callback?code=... 302 867.203 ms - 323  ← 302 Redirect!
```

**Error Pattern** (account not linked):
```
[GOOGLE AUTH] User exists but does not have Google ID
GET /auth/google/callback?code=... 302 1024.898 ms - 89  ← 302 Redirect to error
```

### Check Frontend Console

**Success Pattern**:
```
[AUTH CALLBACK] Processing OAuth callback
[AUTH CALLBACK] Current URL: http://localhost:3000/auth/callback?token=eyJ...&redirect=/dashboard
[AUTH CALLBACK] Params: { token: 'present', redirect: '/dashboard', error: null }
[AUTH CALLBACK] Token received, decoding...
[AUTH CALLBACK] User from token: { user_id: 35, email: '...', ... }
[AUTH CALLBACK] Storing token in auth context
[AUTH CALLBACK] Token stored, starting redirect countdown
[AUTH CALLBACK] Redirecting to: /dashboard
```

**Error Pattern**:
```
[AUTH CALLBACK] Params: { token: 'missing', redirect: '/dashboard', error: 'account_not_linked' }
[AUTH CALLBACK] Error from backend: account_not_linked
```

### Check Cookies

**Frontend Cookie** (should exist after successful login):
- **Domain**: `localhost:3000`
- **Name**: `token`
- **Value**: `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...` (JWT)
- **HttpOnly**: `false` (accessible to JavaScript)
- **Secure**: `false` (dev), `true` (production)
- **SameSite**: `Lax`

**Backend Cookie** (only for API login, not OAuth):
- **Domain**: `localhost:5000`
- **Name**: `auth_token`
- **Value**: JWT
- **HttpOnly**: `true` (not accessible to JavaScript)

## Files Modified

| File | Changes |
|------|---------|
| `controllers/authController.js` | - Moved cookie setting after OAuth check<br>- Added redirect logic for OAuth errors<br>- Separated OAuth and API response handling |
| `client/src/app/auth/callback/page.jsx` | - Added comprehensive logging<br>- Enhanced error handling<br>- Added specific error messages |
| `client/src/app/login/page.jsx` | - Added OAuth error detection<br>- Added error state management<br>- Added visual error alert<br>- Added auto-redirect for new users |

## Related Documentation

- `docs/GOOGLE_OAUTH_FLOW.md` - Complete OAuth flow documentation
- `docs/GOOGLE_OAUTH_LOGIN_FIX.md` - Initial redirect fix documentation
- `docs/ENHANCED_GOOGLE_OAUTH.md` - Enhanced OAuth implementation guide

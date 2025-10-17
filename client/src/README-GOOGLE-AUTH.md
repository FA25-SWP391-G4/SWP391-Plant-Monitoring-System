# Google OAuth Integration Guide

This guide explains how the Google OAuth integration works in the Plant Monitoring System application.

## Files Overview

- `client/src/hooks/useGoogleAuth.js` - Custom hook containing all Google authentication logic
- `client/src/pages/auth/google-callback.js` - Callback page for handling OAuth redirect
- `client/src/components/LoginForm.jsx` - Contains the Google login button and initial auth flow
- `client/next.config.webpack.js` - Custom webpack configuration for Google auth integration
- `client/next.config.mjs` - Next.js configuration including webpack customization

## Authentication Flow

1. **Initialization**: When a user clicks "Sign in with Google" button
   - The `useGoogleAuth.initGoogleSignIn()` function is called
   - A popup window opens with Google's authentication page
   - Account selection is enforced with `prompt=select_account`

2. **Authorization**: User selects their Google account and grants permissions
   - Google redirects to our callback page with access token in URL hash

3. **Callback Processing**: `google-callback.js` page handles the response
   - Extracts access token from URL
   - Calls backend API to verify token and fetch/create user account
   - Redirects user to dashboard upon success

4. **Error Handling**: Proper error states are shown if authentication fails

## Webpack Integration

The webpack configuration optimizes how Google OAuth-related code is bundled:

1. Special handling for the callback page with custom babel options
2. Chunk optimization for auth pages to improve loading performance
3. Better sourcemaps in development mode for debugging

## Troubleshooting

If you encounter the `redirect_uri_mismatch` error:

1. Check Google Cloud Console to ensure these redirect URIs are authorized:
   - `http://localhost:3000`
   - `http://localhost:3010` (if using port 3010)
   - Your production URLs

2. Verify the redirect URI in code matches exactly what's in Google Cloud Console
   - Currently configured to use: `window.location.origin`

3. Clear browser cookies and cache before testing

## Environment Variables

Required environment variables:

```
NEXT_PUBLIC_GOOGLE_CLIENT_ID=your-google-client-id-here
```

## Additional Resources

For more detailed information, see:
- Google OAuth documentation: https://developers.google.com/identity/protocols/oauth2
- Our detailed configuration guide: `/docs/GOOGLE_OAUTH_CONFIGURATION.md`
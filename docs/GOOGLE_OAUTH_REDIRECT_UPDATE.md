# Google OAuth Integration Update

## Configuration Changes

The Google OAuth integration has been updated to use the proper redirect URI format that Google expects:

```
https://localhost:3000/api/auth/callback/google (for development)
https://example.com/api/auth/callback/google (for production)
```

## Required Environment Variables

```
GOOGLE_CLIENT_ID=your-client-id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your-client-secret
GOOGLE_REDIRECT_URI=https://localhost:3000/api/auth/callback/google (in development)
```

## Implementation Flow

1. User clicks "Sign in with Google"
2. Backend generates state parameter and initiates OAuth flow
3. Google redirects to `/api/auth/callback/google` on the Next.js frontend
4. Next.js API route forwards the code to the backend
5. Backend processes code and returns authentication token
6. Frontend handles the token and redirects the user

## Google Developer Console Setup

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Navigate to "APIs & Services" > "Credentials"
3. Edit your OAuth 2.0 Client ID
4. Under "Authorized redirect URIs", add:
   - `https://localhost:3000/api/auth/callback/google` (for development)
   - `https://example.com/api/auth/callback/google` (for production)
5. Save changes

## Testing

After making these changes, the Google OAuth flow should work without the "invalid_request" error.
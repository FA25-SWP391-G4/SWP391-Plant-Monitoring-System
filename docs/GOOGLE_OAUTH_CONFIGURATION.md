# Google OAuth Configuration Guide

This guide will help you properly set up Google OAuth authentication for the Plant Monitoring System.

## Step 1: Configure Google Cloud Console

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Select your project or create a new one
3. Go to "APIs & Services" > "Credentials"
4. Click "Create credentials" > "OAuth client ID"
5. Select "Web application" as the application type
6. Enter a name for your OAuth client (e.g., "Plant Monitoring System")
7. Add the following URLs under "Authorized JavaScript origins":
   - `http://localhost:3000`
   - `http://localhost:3010` (if using port 3010 locally)
   - Your production URL if applicable (e.g., `https://yourapp.com`)

8. Add the following URLs under "Authorized redirect URIs":
   - `http://localhost:3000`
   - `http://localhost:3010` (if using port 3010 locally)
   - `http://localhost:3000/auth/google-callback`
   - `http://localhost:3010/auth/google-callback` (if using port 3010)
   - Your production URLs if applicable

9. Click "Create" and note down your Client ID and Client Secret

## Step 2: Configure Environment Variables

1. Update your `.env` file with the following variables:

```
# Google OAuth Configuration
NEXT_PUBLIC_GOOGLE_CLIENT_ID=your-client-id-here
GOOGLE_CLIENT_SECRET=your-client-secret-here
```

2. Make sure to restart your application after updating environment variables

## Step 3: Verify Configuration

1. Try signing in with Google again
2. Check for these common issues if you still have problems:
   - Ensure the redirect URI in your code exactly matches one in the Google Cloud Console
   - Check that you're using the correct Client ID in your frontend code
   - Make sure cookies are enabled in your browser
   - Check for any browser console errors

## Troubleshooting

### Error: redirect_uri_mismatch

This happens when the redirect URI used in your application doesn't match any of the authorized URIs in the Google Cloud Console.

**Solution**:
- Double-check the exact URI being sent in your authentication request
- Ensure it's listed in the "Authorized redirect URIs" in Google Cloud Console
- Note that `http://localhost:3000` and `http://localhost:3000/` are treated as different URIs

### Error: Must select an account

If users aren't being prompted to select an account:

**Solution**:
- Ensure you're using `prompt=select_account` in your OAuth URL
- Set `auto_select: false` in Google Identity Services initialization

### Error: disallowed_useragent

This usually happens on embedded browsers or certain mobile contexts.

**Solution**:
- Open the authentication flow in a standard browser window
- Use a popup window approach as implemented in our code

## Testing Your Configuration

Run this simple test to check if your Google OAuth is properly configured:

1. Sign out completely from your application
2. Clear browser cookies and cache
3. Attempt to sign in with Google
4. You should be prompted to select a Google account
5. After selection, you should be redirected back to your application and logged in

If any step fails, check the browser console for specific error messages.
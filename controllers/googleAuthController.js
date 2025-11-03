/**
 * Enhanced Google OAuth Integration Controller
 * Based on best practices for security and user flow
 */
const { google } = require('googleapis');
const crypto = require('crypto');
const User = require('../models/User');
const { storeOAuthState, verifyOAuthState } = require('../services/oauthStateStore');
const { login } = require('./authController');

// Create oauth2Client instance with your credentials
const oauth2Client = new google.auth.OAuth2(
  process.env.GOOGLE_CLIENT_ID,
  process.env.GOOGLE_CLIENT_SECRET,
  process.env.GOOGLE_REDIRECT_URI || 'https://localhost:3000/api/auth/callback/google'
);

// Define Google OAuth scopes - profile is sufficient for our needs
const SCOPES = [
  'https://www.googleapis.com/auth/userinfo.email',
  'https://www.googleapis.com/auth/userinfo.profile'
];

const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
/**
 * Generate OAuth authorization URL with state parameter for CSRF protection
 */
function getAuthorizationUrl(state) {
  return oauth2Client.generateAuthUrl({
    access_type: 'offline', // Get refresh token for long-term access
    scope: SCOPES,
    include_granted_scopes: true,
    state: state, // CSRF protection
    prompt: 'consent' // Force display of consent screen to get refresh_token
  });
}

/**
 * Start Google OAuth flow - generate secure state and redirect to Google's consent page
 */
async function initiateGoogleAuth(req, res) {
  try {
    // Generate secure random state value for CSRF protection
    const state = crypto.randomBytes(32).toString('hex');
    
    console.log('[GOOGLE AUTH] Generated new state:', state);
    console.log('[GOOGLE AUTH] Session ID:', req.sessionID);
    
    // Check if session is available
    if (!req.session) {
      console.error('[GOOGLE AUTH] Session middleware not configured');
      return res.status(500).redirect(`${frontendUrl}/login?error=session_not_configured`);
    }
    
    // Store the intended redirect URL after login if provided
    const redirectAfterLogin = req.query.redirect || '/dashboard';
    req.session.redirectAfterLogin = redirectAfterLogin;
    
    // Store state in both session AND database (double protection)
    req.session.oauthState = state;
    
    // Generate authorization URL with state parameter
    const authUrl = getAuthorizationUrl(state);
    
    // Force session save before redirecting and return a promise
    await new Promise((resolve, reject) => {
      req.session.save((err) => {
        if (err) {
          console.error('[GOOGLE AUTH] Session save error:', err);
          reject(err);
          return;
        }
        
        console.log('[GOOGLE AUTH] Session saved successfully with state:', state);
        console.log('[GOOGLE AUTH] Session data:', req.session);
        resolve();
      });
    });
    
    // Also store state in database
    await storeOAuthState(state, req.sessionID);
    
    // Check if session was saved correctly
    if (!req.session.oauthState) {
      console.warn('[GOOGLE AUTH] Session state not persisted after save operation');
      // Continue anyway since we have database backup
    }
    
    console.log('[GOOGLE AUTH] Redirecting to Google with state:', state);
    
    // Redirect user to Google's OAuth consent page
    res.redirect(authUrl);
  } catch (error) {
    console.error('[GOOGLE AUTH] Initiation error:', error);
    
    res.status(500).redirect(`${frontendUrl}/login?error=google_auth_initiation_failed`);
  }
}

/**
 * Google OAuth callback handler - process token, verify state, and login or redirect to registration
 */
async function googleAuthCallback(req, res) {
  console.log('\n=== GOOGLE AUTH CALLBACK START ===');
  console.log('[GOOGLE AUTH] Request URL:', req.url);
  console.log('[GOOGLE AUTH] Request headers:', JSON.stringify(req.headers, null, 2));
  console.log('[GOOGLE AUTH] Session ID:', req.sessionID);
  console.log('[GOOGLE AUTH] Session data:', JSON.stringify(req.session, null, 2));
  
  try {
    const { code, state, error: oauthError } = req.query;
    
    console.log('[GOOGLE AUTH] Query parameters:');
    console.log('  - code:', code ? `${code.substring(0, 20)}...` : 'MISSING');
    console.log('  - state:', state || 'MISSING');
    console.log('  - error:', oauthError || 'none');
    
    // Check for OAuth errors from Google
    if (oauthError) {
      console.error('[GOOGLE AUTH] OAuth error from Google:', oauthError);
      return res.status(400).redirect(`${frontendUrl}/login?error=oauth_${oauthError}`);
    }
    
    if (!code) {
      console.error('[GOOGLE AUTH] Missing authorization code');
      return res.status(400).redirect(`${frontendUrl}/login?error=missing_code`);
    }
    
    // Verify state parameter to prevent CSRF attacks
    console.log('[GOOGLE AUTH] State verification:');
    console.log('  - Received state:', state);
    console.log('  - Session oauthState:', req.session.oauthState);
    console.log('  - Session exists:', !!req.session);
    
    if (!state) {
      console.error('[GOOGLE AUTH] Missing state parameter');
      return res.status(400).redirect(`${frontendUrl}/login?error=missing_state`);
    }
    
    const sessionStateValid = req.session.oauthState === state;
    const dbStateValid = await verifyOAuthState(state);
    
    console.log('[GOOGLE AUTH] State validation results:');
    console.log('  - Session state valid:', sessionStateValid);
    console.log('  - Database state valid:', dbStateValid);
    
    if (!sessionStateValid && !dbStateValid) {
      console.error('[GOOGLE AUTH] Invalid state parameter - CSRF protection triggered');
      return res.status(400).redirect(`${frontendUrl}/login?error=invalid_state`);
    }

    // Clear the state once used
    console.log('[GOOGLE AUTH] Clearing session state');
    delete req.session.oauthState;
    
    // Exchange code for tokens
    console.log('[GOOGLE AUTH] Exchanging authorization code for tokens...');
    let tokens;
    try {
      const tokenResponse = await oauth2Client.getToken(code);
      tokens = tokenResponse.tokens;
      console.log('[GOOGLE AUTH] Token exchange successful:');
      console.log('  - Access token:', tokens.access_token ? `${tokens.access_token.substring(0, 20)}...` : 'MISSING');
      console.log('  - Refresh token:', tokens.refresh_token ? `${tokens.refresh_token.substring(0, 20)}...` : 'MISSING');
      console.log('  - ID token:', tokens.id_token ? `${tokens.id_token.substring(0, 20)}...` : 'MISSING');
      console.log('  - Expires in:', tokens.expires_in);
    } catch (tokenError) {
      console.error('[GOOGLE AUTH] Token exchange failed:', tokenError.message);
      console.error('[GOOGLE AUTH] Token error details:', tokenError);
      return res.status(400).redirect(`${frontendUrl}/login?error=token_exchange_failed`);
    }
    
    oauth2Client.setCredentials(tokens);
    
    // Get user profile with more complete information
    console.log('[GOOGLE AUTH] Fetching user profile from Google People API...');
    let profile;
    try {
      const people = google.people({ version: 'v1', auth: oauth2Client });
      profile = await people.people.get({
        resourceName: 'people/me',
        personFields: 'emailAddresses,names,photos'
      });
      console.log('[GOOGLE AUTH] Profile fetch successful');
      console.log('[GOOGLE AUTH] Raw profile data:', JSON.stringify(profile.data, null, 2));
    } catch (profileError) {
      console.error('[GOOGLE AUTH] Profile fetch failed:', profileError.message);
      console.error('[GOOGLE AUTH] Profile error details:', profileError);
      return res.status(400).redirect(`${frontendUrl}/login?error=profile_fetch_failed`);
    }

    // Extract profile information
    const email = profile.data.emailAddresses?.[0]?.value;
    const names = profile.data.names?.[0];
    const googleId = names?.metadata?.source?.id;
    const givenName = names?.givenName || '';
    const familyName = names?.familyName || '';
    const profilePicture = profile.data.photos?.[0]?.url || '';

    console.log('[GOOGLE AUTH] Profile data extracted:');
    console.log('  - Email:', email);
    console.log('  - Google ID:', googleId);
    console.log('  - Given name:', givenName);
    console.log('  - Family name:', familyName);
    console.log('  - Profile picture:', profilePicture ? 'present' : 'none');

    if (!email || !googleId) {
      console.error('[GOOGLE AUTH] Missing required profile data');
      console.error('[GOOGLE AUTH] Email present:', !!email);
      console.error('[GOOGLE AUTH] Google ID present:', !!googleId);
      return res.status(400).redirect(`${frontendUrl}/login?error=profile_incomplete`);
    }

    // Check if user exists first
    console.log('[GOOGLE AUTH] Checking if user exists in database...');
    const User = require('../models/User');
    let existingUser;
    try {
      existingUser = await User.findByEmail(email);
      console.log('[GOOGLE AUTH] User lookup result:', existingUser ? 'FOUND' : 'NOT FOUND');
      if (existingUser) {
        console.log('[GOOGLE AUTH] Existing user details:');
        console.log('  - User ID:', existingUser.user_id);
        console.log('  - Email:', existingUser.email);
        console.log('  - Has Google ID:', !!existingUser.google_id);
        console.log('  - Has password:', !!existingUser.password);
        console.log('  - Role:', existingUser.role);
      }
    } catch (userLookupError) {
      console.error('[GOOGLE AUTH] User lookup failed:', userLookupError.message);
      console.error('[GOOGLE AUTH] User lookup error details:', userLookupError);
      return res.status(500).redirect(`${frontendUrl}/login?error=user_lookup_failed`);
    }

    if (!existingUser) {
      // New user - redirect to registration with pre-filled data
      console.log('[GOOGLE AUTH] New user detected, redirecting to registration');
      
      const googleProfileData = {
        email,
        google_id: googleId,
        given_name: givenName,
        family_name: familyName,
        profile_picture: profilePicture,
        google_refresh_token: tokens.refresh_token
      };

      console.log('[GOOGLE AUTH] Creating registration redirect with profile data:');
      console.log('  - Profile data keys:', Object.keys(googleProfileData));
      
      // Encode profile data as base64 for URL transmission
      const encodedData = Buffer.from(JSON.stringify(googleProfileData)).toString('base64');
      const registrationUrl = `${frontendUrl}/register?source=google&data=${encodedData}`;
      
      console.log('[GOOGLE AUTH] Registration redirect URL:', registrationUrl);
      console.log('[GOOGLE AUTH] Encoded data length:', encodedData.length);
      
      return res.redirect(registrationUrl);
    }

    // Existing user - proceed with login
    console.log('[GOOGLE AUTH] Existing user found, proceeding with login');
    req.body = {
      email: email,
      googleId: googleId,
      refreshToken: tokens.refresh_token,
      loginMethod: 'google'
    };

    console.log('[GOOGLE AUTH] Calling login handler with data:');
    console.log('  - Email:', email);
    console.log('  - Google ID:', googleId);
    console.log('  - Has refresh token:', !!tokens.refresh_token);
    console.log('  - Login method:', 'google');

    // Call login handler from authController
    console.log('[GOOGLE AUTH] Handing off to login controller...');
    return login(req, res);

  } catch (error) {
    console.error('\n=== GOOGLE AUTH CALLBACK ERROR ===');
    console.error('[GOOGLE AUTH] Error type:', error.constructor.name);
    console.error('[GOOGLE AUTH] Error message:', error.message);
    console.error('[GOOGLE AUTH] Error stack:', error.stack);
    console.error('[GOOGLE AUTH] Request URL:', req.url);
    console.error('[GOOGLE AUTH] Request headers:', JSON.stringify(req.headers, null, 2));
    console.error('[GOOGLE AUTH] Session ID:', req.sessionID);
    console.error('[GOOGLE AUTH] Session data:', JSON.stringify(req.session, null, 2));
    console.error('=== END GOOGLE AUTH ERROR ===\n');
    
    const errorRedirectUrl = `${frontendUrl}/login?error=google_auth_failed&details=${encodeURIComponent(error.message)}`;
    console.error('[GOOGLE AUTH] Redirecting to error page:', errorRedirectUrl);
    
    res.status(500).redirect(errorRedirectUrl);
  }
}

/**
 * Revoke Google access and sign user out
 */
async function revokeGoogleAccess(req, res) {
  try {
    const userId = req.user.user_id; // From auth middleware
    const user = await User.findById(userId);
    
    if (!user || !user.google_refresh_token) {
      return res.status(400).json({
        success: false,
        error: 'No Google account connected or token not found'
      });
    }
    
    // Set the refresh token to revoke
    oauth2Client.setCredentials({
      refresh_token: user.google_refresh_token
    });
    
    // Revoke the token
    await oauth2Client.revokeToken(user.google_refresh_token);
    
    // Remove the token from the user record
    await user.update({ google_refresh_token: null });
    
    res.status(200).json({
      success: true,
      message: 'Google access revoked successfully'
    });
  } catch (error) {
    console.error('[GOOGLE AUTH] Revoke error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to revoke Google access'
    });
  }
}

module.exports = {
  initiateGoogleAuth,
  googleAuthCallback,
  revokeGoogleAccess
};
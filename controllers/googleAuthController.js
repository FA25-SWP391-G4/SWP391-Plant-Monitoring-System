/**
 * Enhanced Google OAuth Integration Controller
 * Based on best practices for security and user flow
 */
const { google } = require('googleapis');
const crypto = require('crypto');
const User = require('../models/User');
const { generateToken } = require('./authController');
const { storeOAuthState, verifyOAuthState } = require('../services/oauthStateStore');

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
const backendUrl = process.env.BACKEND_URL || 'http://localhost:3010';

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
  try {
    const { code, state } = req.query;
    
    
    console.log('[GOOGLE AUTH] Callback received with state:', state);
    console.log('[GOOGLE AUTH] Session ID:', req.sessionID);
    console.log('[GOOGLE AUTH] Session data:', req.session);
    console.log('[GOOGLE AUTH] Session state:', req.session.oauthState);
    
    // Verify state parameter to prevent CSRF attacks
    if (!state) {
      console.error('[GOOGLE AUTH] Missing state parameter in request');
      return res.status(400).redirect(`${frontendUrl}/login?error=missing_state_param`);
    }
    
    // First try to verify with session (ideal case)
    let stateIsValid = false;
    if (req.session.oauthState && state === req.session.oauthState) {
      console.log('[GOOGLE AUTH] State verified via session');
      stateIsValid = true;
    } else {
      // Fallback to database verification
      console.log('[GOOGLE AUTH] Session state not found, trying database verification');
      stateIsValid = await verifyOAuthState(state);
      
      if (stateIsValid) {
        console.log('[GOOGLE AUTH] State verified via database');
      } else {
        console.error('[GOOGLE AUTH] State verification failed in both session and database');
        console.error(`Got state: ${state}, Session state: ${req.session.oauthState || 'undefined'}`);
        return res.status(400).redirect(`${frontendUrl}/login?error=invalid_state`);
      }
    }
    
    // At this point, state is valid either from session or database
    
    // Clear the state from session once used
    const redirectAfterLogin = req.session.redirectAfterLogin || '/dashboard';
    delete req.session.oauthState;
    
    // Exchange authorization code for tokens
    const { tokens } = await oauth2Client.getToken(code);
    oauth2Client.setCredentials(tokens);
    
    // Get user profile information using the access token
    const people = google.people({ version: 'v1', auth: oauth2Client });
    const profile = await people.people.get({
      resourceName: 'people/me',
      personFields: 'emailAddresses,names,photos'
    });
    
    // Extract user information
    const email = profile.data.emailAddresses[0].value;
    const googleId = profile.data.resourceName.split('/')[1];
    const name = profile.data.names ? profile.data.names[0] : {};
    const givenName = name.givenName || '';
    const familyName = name.familyName || '';
    const picture = profile.data.photos ? profile.data.photos[0].url : '';
    
    // First try to find the user by Google ID (more reliable for OAuth)
    let user = await User.findByGoogleId(googleId);
    
    // If not found by Google ID, try finding by email
    if (!user) {
      console.log('[GOOGLE AUTH] User not found by Google ID, trying email lookup');
      user = await User.findByEmail(email);
    }
    
    // Store refresh token in database for long-term access if provided
    const refreshToken = tokens.refresh_token;
    
    // If user doesn't exist, redirect to registration page with Google data
    if (!user) {
      console.log('[GOOGLE AUTH] New user from Google login, redirecting to registration with Google data:', email);
      
      // Create user data object for registration
      const userData = {
        email,
        password: null, // No password for Google-registered users
        family_name: familyName,
        given_name: givenName,
        google_id: googleId,
        profile_picture: picture,
        role: 'Regular'
      };
      
      try {
        // Encode userData as base64 to pass safely in URL
        const encodedData = Buffer.from(JSON.stringify(userData)).toString('base64');
        
        // Redirect to frontend registration page with pre-filled data
        const registrationUrl = new URL(`${frontendUrl}/register`);
        registrationUrl.searchParams.append('source', 'google');
        registrationUrl.searchParams.append('data', encodedData);
        
        console.log('[GOOGLE AUTH] Redirecting to registration page with Google data');
        return res.redirect(registrationUrl.toString());
      } catch (userCreationError) {
        console.error('[GOOGLE AUTH] Error preparing registration data:', userCreationError);
        return res.redirect(`${frontendUrl}/login?error=google_registration_failed`);
      }
    }
  else { 
    console.log('[GOOGLE AUTH] User already exists:', user.user_id);
    
    // Only proceed if user already has a google_id
    if (user.google_id) {
      console.log('[GOOGLE AUTH] User already has Google ID, proceeding with Google auth');
      
      // Store refresh token if provided
      if (refreshToken) {
        await user.update({
          google_refresh_token: refreshToken
        });
        
        // Refresh user object to get updated data
        user = await User.findById(user.user_id);
      }
    } else {
      console.log('[GOOGLE AUTH] User exists but does not have Google ID. Redirecting to login page');
      // Send user to login page with message that they need to bind their account
      return res.redirect(`${frontendUrl}/login?error=google_auth_not_linked&message=${encodeURIComponent('You need to log in manually and link your Google account in profile settings')}&email=${encodeURIComponent(email)}`);
    }
  }
    
    // Only generate token if user has google_id (ensuring only proper Google-linked accounts can login)
    if (user && user.google_id && user.google_id === googleId) {
      console.log('[GOOGLE AUTH] User has matching Google ID, generating token and logging in');
      
      // Generate JWT token
      const token = generateToken(user);
      
      // Set session cookie with proper settings to match regular login flow
      res.cookie('auth_token', token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax', // Use 'lax' for redirects in OAuth flow
        path: '/',       // Ensure cookie is available across all paths
        maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days - set explicit expiration for consistency
      });
      
      // Build the frontend URL with the token as a query parameter for the client to process
      const frontendRedirectUrl = `${frontendUrl}/auth/callback?token=${token}&redirect=${redirectAfterLogin}`;
      
      // Clear session data
      delete req.session.redirectAfterLogin;
      
      // Redirect to the frontend which will handle storing the token and further redirection
      res.redirect(frontendRedirectUrl);
    } else {
      // Redirect to login page if user doesn't have a matching Google ID
      console.log('[GOOGLE AUTH] Google ID mismatch or not found, redirecting to login page');
      return res.redirect(`${frontendUrl}/login?error=google_auth_not_linked&message=${encodeURIComponent('You need to log in manually and link your Google account in profile settings')}&email=${encodeURIComponent(email)}`);
    }
  } catch (error) {
    console.error('[GOOGLE AUTH] Callback error:', error);
    res.status(500).redirect(`${frontendUrl}/login?error=google_auth_failed`);
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
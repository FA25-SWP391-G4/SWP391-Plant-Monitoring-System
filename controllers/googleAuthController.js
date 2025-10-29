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
    
    // Verify state parameter to prevent CSRF attacks
    if (!state || (!req.session.oauthState && !await verifyOAuthState(state))) {
      console.error('[GOOGLE AUTH] Invalid state parameter');
      return res.status(400).redirect(`${frontendUrl}/login?error=invalid_state`);
    }

    // Clear the state once used
    delete req.session.oauthState;
    
    // Exchange code for tokens
    const { tokens } = await oauth2Client.getToken(code);
    oauth2Client.setCredentials(tokens);
    
    // Get user profile
    const people = google.people({ version: 'v1', auth: oauth2Client });
    const profile = await people.people.get({
      resourceName: 'people/me',
      personFields: 'emailAddresses,names'
    });

    // Extract email for login
    const email = profile.data.emailAddresses[0].value;
    const googleId = profile.data.names[0].metadata.source.id;

    // Forward to login handler as if user submitted login form
    req.body = {
      email: email,
      googleId: googleId,
      loginMethod: 'google'
    };

    // Call login handler from authController
    return login(req, res);

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
/**
 * JWT Utility Functions
 * Provides UTF-8 safe JWT decoding to handle Unicode characters properly
 */

/**
 * Safely decode a JWT payload with proper UTF-8 support
 * @param {string} token - The JWT token
 * @returns {object} Decoded payload object
 * @throws {Error} If token is invalid or decoding fails
 */
export function decodeJWTPayload(token) {
  try {
    const tokenParts = token.split('.');
    if (tokenParts.length !== 3) {
      throw new Error('Invalid JWT format: token must have 3 parts');
    }
    
    // Get the payload (middle part)
    const base64Payload = tokenParts[1];
    
    // Add padding if necessary (JWT base64 might not be padded)
    const paddedBase64 = base64Payload + '='.repeat((4 - base64Payload.length % 4) % 4);
    
    // Decode base64 to bytes, then bytes to UTF-8 string
    // This properly handles Unicode characters like Vietnamese text
    const binaryString = atob(paddedBase64);
    const bytes = new Uint8Array(binaryString.length);
    for (let i = 0; i < binaryString.length; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }
    const utf8String = new TextDecoder('utf-8').decode(bytes);
    
    // Parse the JSON payload
    const payload = JSON.parse(utf8String);
    
    return payload;
  } catch (error) {
    console.error('[JWT DECODE] Failed to decode JWT payload:', error);
    throw new Error(`JWT decode error: ${error.message}`);
  }
}

/**
 * Check if a JWT token is expired
 * @param {string} token - The JWT token
 * @returns {boolean} True if token is expired
 */
export function isJWTExpired(token) {
  try {
    const payload = decodeJWTPayload(token);
    if (!payload.exp) {
      return false; // No expiration claim
    }
    
    const currentTime = Math.floor(Date.now() / 1000);
    return payload.exp < currentTime;
  } catch (error) {
    return true; // If we can't decode it, consider it expired
  }
}

/**
 * Extract user information from JWT token
 * @param {string} token - The JWT token
 * @returns {object|null} User object or null if invalid
 */
export function extractUserFromJWT(token) {
  try {
    const payload = decodeJWTPayload(token);
    return {
      user_id: payload.user_id,
      email: payload.email,
      family_name: payload.family_name,
      given_name: payload.given_name,
      full_name: payload.full_name,
      role: payload.role
    };
  } catch (error) {
    console.error('[JWT] Failed to extract user from token:', error);
    return null;
  }
}
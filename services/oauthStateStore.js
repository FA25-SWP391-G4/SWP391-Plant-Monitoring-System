/**
 * OAuth state store for CSRF protection
 */
const { pool } = require('../config/postgresql.prod');

/**
 * Store OAuth state in database
 * @param {string} state - The state token to store
 * @param {string} sessionId - Associated session ID
 * @returns {Promise<boolean>} Success status
 */
async function storeOAuthState(state, sessionId) {
  try {
    // Create table if it doesn't exist
    await pool.query(`
      CREATE TABLE IF NOT EXISTS oauth_states (
        state VARCHAR(255) PRIMARY KEY,
        session_id VARCHAR(255) NOT NULL,
        created_at TIMESTAMP NOT NULL DEFAULT NOW(),
        used BOOLEAN DEFAULT FALSE
      )
    `);
    
    // Store the state
    await pool.query(
      'INSERT INTO oauth_states (state, session_id) VALUES ($1, $2)',
      [state, sessionId]
    );
    
    // Create index for cleanup if doesn't exist
    await pool.query(`
      CREATE INDEX IF NOT EXISTS idx_oauth_states_created_at ON oauth_states (created_at)
    `);
    
    console.log(`[OAUTH STATE] Stored state ${state} for session ${sessionId}`);
    return true;
  } catch (error) {
    console.error('[OAUTH STATE] Error storing state:', error);
    return false;
  }
}

/**
 * Verify OAuth state from database
 * @param {string} state - The state token to verify
 * @returns {Promise<boolean>} True if valid state
 */
async function verifyOAuthState(state) {
  try {
    if (!state) return false;
    
    // Get the state from database
    const result = await pool.query(
      'SELECT * FROM oauth_states WHERE state = $1 AND used = FALSE',
      [state]
    );
    
    if (result.rows.length === 0) {
      console.error('[OAUTH STATE] State not found or already used');
      return false;
    }
    
    // Mark the state as used to prevent replay attacks
    await pool.query(
      'UPDATE oauth_states SET used = TRUE WHERE state = $1',
      [state]
    );
    
    // Clean up old states (older than 1 hour)
    await pool.query(
      'DELETE FROM oauth_states WHERE created_at < NOW() - INTERVAL \'1 hour\''
    );
    
    console.log(`[OAUTH STATE] Verified state ${state}`);
    return true;
  } catch (error) {
    console.error('[OAUTH STATE] Error verifying state:', error);
    return false;
  }
}

module.exports = {
  storeOAuthState,
  verifyOAuthState
};
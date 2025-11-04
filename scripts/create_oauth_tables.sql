-- OAuth States Table for CSRF protection
CREATE TABLE IF NOT EXISTS oauth_states (
  state VARCHAR(255) PRIMARY KEY,
  session_id VARCHAR(255) NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  used BOOLEAN DEFAULT FALSE
);

-- Index for cleanup
CREATE INDEX IF NOT EXISTS idx_oauth_states_created_at ON oauth_states (created_at);

-- User Sessions Table for persistent sessions
CREATE TABLE IF NOT EXISTS user_sessions (
  sid VARCHAR NOT NULL PRIMARY KEY,
  sess JSON NOT NULL,
  expire TIMESTAMP(6) NOT NULL
);

-- Index for session expiration
CREATE INDEX IF NOT EXISTS idx_user_sessions_expire ON user_sessions (expire);
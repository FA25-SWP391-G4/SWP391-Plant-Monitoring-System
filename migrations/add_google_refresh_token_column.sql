-- Migration to add Google refresh token column to users table

ALTER TABLE users ADD COLUMN IF NOT EXISTS google_refresh_token TEXT;
COMMENT ON COLUMN users.google_refresh_token IS 'Google OAuth 2.0 refresh token for long-term API access';
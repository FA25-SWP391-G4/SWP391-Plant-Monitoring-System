-- Add google_id column to Users table
ALTER TABLE Users ADD COLUMN IF NOT EXISTS google_id VARCHAR(255) NULL;
ALTER TABLE Users ADD COLUMN IF NOT EXISTS profile_picture VARCHAR(255) NULL;
-- Create an index for improved lookup performance
CREATE INDEX IF NOT EXISTS idx_users_google_id ON Users(google_id);

-- Note: Existing users will have NULL google_id values

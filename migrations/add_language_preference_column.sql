-- Add language_preference column to Users table for multi-language support (UC31)
ALTER TABLE Users ADD COLUMN IF NOT EXISTS language_preference VARCHAR(5) DEFAULT 'en';

-- Add comment to the column
COMMENT ON COLUMN Users.language_preference IS 'User language preference code (e.g., en, vi) for UC31: Multi-Language Settings';

-- Update existing users to have English as default language
UPDATE Users SET language_preference = 'en' WHERE language_preference IS NULL;
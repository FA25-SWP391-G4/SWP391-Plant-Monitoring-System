-- Migration script to add Google Authentication columns to Users table
-- For Plant Monitoring System

-- Check if the full_name column exists and migrate data if needed
DO $$
BEGIN
    -- Check if full_name column exists
    IF EXISTS (
        SELECT column_name 
        FROM information_schema.columns 
        WHERE table_name = 'users' AND column_name = 'full_name'
    ) THEN
        -- Add family_name and given_name if they don't exist
        IF NOT EXISTS (
            SELECT column_name 
            FROM information_schema.columns 
            WHERE table_name = 'users' AND column_name = 'family_name'
        ) THEN
            -- Add family_name column
            ALTER TABLE users ADD COLUMN family_name VARCHAR(100);
            
            -- Split full_name into family_name (extract last word)
            UPDATE users 
            SET family_name = 
                CASE 
                    WHEN full_name IS NOT NULL AND position(' ' in full_name) > 0 THEN 
                        substring(full_name from position(' ' in reverse(full_name)) for char_length(full_name))
                    ELSE full_name
                END
            WHERE full_name IS NOT NULL;
        END IF;
        
        IF NOT EXISTS (
            SELECT column_name 
            FROM information_schema.columns 
            WHERE table_name = 'users' AND column_name = 'given_name'
        ) THEN
            -- Add given_name column
            ALTER TABLE users ADD COLUMN given_name VARCHAR(100);
            
            -- Split full_name into given_name (everything before last word)
            UPDATE users 
            SET given_name = 
                CASE 
                    WHEN full_name IS NOT NULL AND position(' ' in full_name) > 0 THEN 
                        substring(full_name from 1 for char_length(full_name) - position(' ' in reverse(full_name)))
                    ELSE NULL
                END
            WHERE full_name IS NOT NULL;
        END IF;
    ELSE
        -- If full_name doesn't exist, make sure family_name and given_name exist
        IF NOT EXISTS (
            SELECT column_name 
            FROM information_schema.columns 
            WHERE table_name = 'users' AND column_name = 'family_name'
        ) THEN
            ALTER TABLE users ADD COLUMN family_name VARCHAR(100);
        END IF;
        
        IF NOT EXISTS (
            SELECT column_name 
            FROM information_schema.columns 
            WHERE table_name = 'users' AND column_name = 'given_name'
        ) THEN
            ALTER TABLE users ADD COLUMN given_name VARCHAR(100);
        END IF;
    END IF;
    
    -- Make password_hash nullable for Google-only accounts
    ALTER TABLE users ALTER COLUMN password_hash DROP NOT NULL;
    
    -- Add Google authentication columns if they don't exist
    IF NOT EXISTS (
        SELECT column_name 
        FROM information_schema.columns 
        WHERE table_name = 'users' AND column_name = 'google_id'
    ) THEN
        ALTER TABLE users ADD COLUMN google_id VARCHAR(255) UNIQUE;
    END IF;
    
    IF NOT EXISTS (
        SELECT column_name 
        FROM information_schema.columns 
        WHERE table_name = 'users' AND column_name = 'google_refresh_token'
    ) THEN
        ALTER TABLE users ADD COLUMN google_refresh_token TEXT;
    END IF;
    
    IF NOT EXISTS (
        SELECT column_name 
        FROM information_schema.columns 
        WHERE table_name = 'users' AND column_name = 'profile_picture'
    ) THEN
        ALTER TABLE users ADD COLUMN profile_picture TEXT;
    END IF;
    
    IF NOT EXISTS (
        SELECT column_name 
        FROM information_schema.columns 
        WHERE table_name = 'users' AND column_name = 'language_preference'
    ) THEN
        ALTER TABLE users ADD COLUMN language_preference VARCHAR(10) NOT NULL DEFAULT 'en';
    END IF;
    
    -- Create index for Google ID
    IF NOT EXISTS (
        SELECT indexname 
        FROM pg_indexes 
        WHERE indexname = 'idx_users_google_id'
    ) THEN
        CREATE INDEX idx_users_google_id ON users(google_id);
    END IF;
    
END $$;

-- Log migration completion
INSERT INTO system_logs (component, message, level)
VALUES ('migration', 'Added Google Authentication columns to Users table', 'info')
ON CONFLICT DO NOTHING;
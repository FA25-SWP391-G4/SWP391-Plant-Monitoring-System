-- Health History Table Creation
-- This table stores detailed plant health history records with individual factors

CREATE TABLE IF NOT EXISTS health_history (
    id SERIAL PRIMARY KEY,
    plant_id INTEGER NOT NULL,
    timestamp TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    health_score INTEGER NOT NULL, -- 0-100 scale
    moisture_factor INTEGER NOT NULL, -- 0-100 scale
    temperature_factor INTEGER NOT NULL, -- 0-100 scale
    humidity_factor INTEGER NOT NULL, -- 0-100 scale
    light_factor INTEGER NOT NULL, -- 0-100 scale
    notes TEXT,
    FOREIGN KEY (plant_id) REFERENCES plants(plant_id) ON DELETE CASCADE
);

-- Create indexes for faster queries
CREATE INDEX IF NOT EXISTS idx_health_history_plant_id ON health_history (plant_id);
CREATE INDEX IF NOT EXISTS idx_health_history_timestamp ON health_history (timestamp);

-- Add health and status columns to plants table if not exists
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                  WHERE table_name='plants' AND column_name='health') THEN
        ALTER TABLE plants ADD COLUMN health INTEGER DEFAULT 80;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                  WHERE table_name='plants' AND column_name='status') THEN
        ALTER TABLE plants ADD COLUMN status VARCHAR(20) DEFAULT 'healthy';
    END IF;
END$$;
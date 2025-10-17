-- Create image_analysis table for disease recognition history
-- This table stores the results of plant disease recognition analysis

CREATE TABLE IF NOT EXISTS image_analysis (
    analysis_id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
    plant_id INTEGER REFERENCES plants(plant_id) ON DELETE SET NULL,
    image_path VARCHAR(255) NOT NULL,
    original_filename VARCHAR(255),
    analysis_result JSONB NOT NULL,
    disease_detected VARCHAR(100),
    confidence_score DECIMAL(5,4),
    treatment_suggestions TEXT[],
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_image_analysis_user_id ON image_analysis(user_id);
CREATE INDEX IF NOT EXISTS idx_image_analysis_plant_id ON image_analysis(plant_id);
CREATE INDEX IF NOT EXISTS idx_image_analysis_disease ON image_analysis(disease_detected);
CREATE INDEX IF NOT EXISTS idx_image_analysis_created_at ON image_analysis(created_at);

-- Add trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_image_analysis_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_image_analysis_updated_at
    BEFORE UPDATE ON image_analysis
    FOR EACH ROW
    EXECUTE FUNCTION update_image_analysis_updated_at();
-- AI Features Enhanced Database Schema Migration
-- This script creates the enhanced database schema for AI features

-- 1. Create ai_analyses table for storing AI analysis results
CREATE TABLE IF NOT EXISTS ai_analyses (
    id SERIAL PRIMARY KEY,
    plant_id INTEGER,
    user_id VARCHAR(255) NOT NULL,
    analysis_type VARCHAR(50) NOT NULL CHECK (analysis_type IN ('disease_detection', 'irrigation_prediction', 'chatbot_analysis')),
    input_data JSONB NOT NULL,
    result_data JSONB NOT NULL,
    confidence_score FLOAT CHECK (confidence_score >= 0 AND confidence_score <= 1),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Add foreign key constraint if plants table exists
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'plants') THEN
        ALTER TABLE ai_analyses 
        ADD CONSTRAINT fk_ai_analyses_plant_id 
        FOREIGN KEY (plant_id) REFERENCES plants(plant_id) ON DELETE CASCADE;
    END IF;
EXCEPTION
    WHEN duplicate_object THEN
        -- Foreign key already exists, ignore
        NULL;
END $$;

-- 2. Create ai_feedback table for user feedback on AI results
CREATE TABLE IF NOT EXISTS ai_feedback (
    id SERIAL PRIMARY KEY,
    analysis_id INTEGER,
    user_id VARCHAR(255) NOT NULL,
    feedback_type VARCHAR(50) CHECK (feedback_type IN ('correct', 'incorrect', 'partially_correct')),
    user_comment TEXT,
    actual_result JSONB,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Add foreign key constraint for ai_feedback
DO $$
BEGIN
    ALTER TABLE ai_feedback 
    ADD CONSTRAINT fk_ai_feedback_analysis_id 
    FOREIGN KEY (analysis_id) REFERENCES ai_analyses(id) ON DELETE CASCADE;
EXCEPTION
    WHEN duplicate_object THEN
        -- Foreign key already exists, ignore
        NULL;
END $$;

-- 3. Create plant_disease_images table for storing disease detection images
CREATE TABLE IF NOT EXISTS plant_disease_images (
    id SERIAL PRIMARY KEY,
    plant_id INTEGER,
    user_id VARCHAR(255) NOT NULL,
    image_path VARCHAR(500) NOT NULL,
    image_size INTEGER,
    image_type VARCHAR(50),
    analysis_id INTEGER,
    upload_timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    is_processed BOOLEAN DEFAULT FALSE,
    processing_status VARCHAR(50) DEFAULT 'pending'
);

-- Add foreign key constraints for plant_disease_images
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'plants') THEN
        ALTER TABLE plant_disease_images 
        ADD CONSTRAINT fk_plant_disease_images_plant_id 
        FOREIGN KEY (plant_id) REFERENCES plants(plant_id) ON DELETE CASCADE;
    END IF;
EXCEPTION
    WHEN duplicate_object THEN
        NULL;
END $$;

DO $$
BEGIN
    ALTER TABLE plant_disease_images 
    ADD CONSTRAINT fk_plant_disease_images_analysis_id 
    FOREIGN KEY (analysis_id) REFERENCES ai_analyses(id) ON DELETE SET NULL;
EXCEPTION
    WHEN duplicate_object THEN
        NULL;
END $$;

-- 4. Create ai_model_configs table for AI model metadata (different from existing ai_models)
CREATE TABLE IF NOT EXISTS ai_model_configs (
    id SERIAL PRIMARY KEY,
    model_name VARCHAR(100) NOT NULL,
    model_type VARCHAR(50) NOT NULL CHECK (model_type IN ('disease_detection', 'irrigation_prediction', 'chatbot')),
    version VARCHAR(20) NOT NULL,
    accuracy_score FLOAT CHECK (accuracy_score >= 0 AND accuracy_score <= 1),
    model_path VARCHAR(500),
    model_config JSONB,
    is_active BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(model_name, version)
);

-- 5. Update chat_histories table with new columns (if it exists)
-- First check if the table exists, if not create it
CREATE TABLE IF NOT EXISTS chat_histories (
    id SERIAL PRIMARY KEY,
    user_id VARCHAR(255) NOT NULL,
    user_message TEXT NOT NULL,
    ai_response TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Add new columns to chat_histories table
ALTER TABLE chat_histories 
ADD COLUMN IF NOT EXISTS session_id VARCHAR(255),
ADD COLUMN IF NOT EXISTS plant_context JSONB,
ADD COLUMN IF NOT EXISTS ai_confidence FLOAT CHECK (ai_confidence >= 0 AND ai_confidence <= 1),
ADD COLUMN IF NOT EXISTS topic_category VARCHAR(100),
ADD COLUMN IF NOT EXISTS plant_id INTEGER,
ADD COLUMN IF NOT EXISTS language VARCHAR(10) DEFAULT 'vi',
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP;

-- Add foreign key constraint for chat_histories plant_id
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'plants') THEN
        ALTER TABLE chat_histories 
        ADD CONSTRAINT fk_chat_histories_plant_id 
        FOREIGN KEY (plant_id) REFERENCES plants(plant_id) ON DELETE SET NULL;
    END IF;
EXCEPTION
    WHEN duplicate_object THEN
        NULL;
END $$;

-- 6. Create performance optimization indexes
-- Indexes for ai_analyses table
CREATE INDEX IF NOT EXISTS idx_ai_analyses_plant_id ON ai_analyses(plant_id);
CREATE INDEX IF NOT EXISTS idx_ai_analyses_user_id ON ai_analyses(user_id);
CREATE INDEX IF NOT EXISTS idx_ai_analyses_type ON ai_analyses(analysis_type);
CREATE INDEX IF NOT EXISTS idx_ai_analyses_created_at ON ai_analyses(created_at);
CREATE INDEX IF NOT EXISTS idx_ai_analyses_confidence ON ai_analyses(confidence_score);

-- Indexes for ai_feedback table
CREATE INDEX IF NOT EXISTS idx_ai_feedback_analysis_id ON ai_feedback(analysis_id);
CREATE INDEX IF NOT EXISTS idx_ai_feedback_user_id ON ai_feedback(user_id);
CREATE INDEX IF NOT EXISTS idx_ai_feedback_type ON ai_feedback(feedback_type);

-- Indexes for plant_disease_images table
CREATE INDEX IF NOT EXISTS idx_plant_disease_images_plant_id ON plant_disease_images(plant_id);
CREATE INDEX IF NOT EXISTS idx_plant_disease_images_user_id ON plant_disease_images(user_id);
CREATE INDEX IF NOT EXISTS idx_plant_disease_images_analysis_id ON plant_disease_images(analysis_id);
CREATE INDEX IF NOT EXISTS idx_plant_disease_images_upload_timestamp ON plant_disease_images(upload_timestamp);
CREATE INDEX IF NOT EXISTS idx_plant_disease_images_processing_status ON plant_disease_images(processing_status);

-- Indexes for ai_model_configs table
CREATE INDEX IF NOT EXISTS idx_ai_model_configs_type ON ai_model_configs(model_type);
CREATE INDEX IF NOT EXISTS idx_ai_model_configs_active ON ai_model_configs(is_active);
CREATE INDEX IF NOT EXISTS idx_ai_model_configs_name_version ON ai_model_configs(model_name, version);

-- Indexes for enhanced chat_histories table
CREATE INDEX IF NOT EXISTS idx_chat_histories_user_id ON chat_histories(user_id);
CREATE INDEX IF NOT EXISTS idx_chat_histories_session_id ON chat_histories(session_id);
CREATE INDEX IF NOT EXISTS idx_chat_histories_plant_id ON chat_histories(plant_id);
CREATE INDEX IF NOT EXISTS idx_chat_histories_topic_category ON chat_histories(topic_category);
CREATE INDEX IF NOT EXISTS idx_chat_histories_created_at ON chat_histories(created_at);

-- 7. Create triggers for updated_at timestamps
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply triggers to tables with updated_at columns
DROP TRIGGER IF EXISTS update_ai_analyses_updated_at ON ai_analyses;
CREATE TRIGGER update_ai_analyses_updated_at 
    BEFORE UPDATE ON ai_analyses 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_ai_model_configs_updated_at ON ai_model_configs;
CREATE TRIGGER update_ai_model_configs_updated_at 
    BEFORE UPDATE ON ai_model_configs 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_chat_histories_updated_at ON chat_histories;
CREATE TRIGGER update_chat_histories_updated_at 
    BEFORE UPDATE ON chat_histories 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- 8. Insert default AI model configurations
INSERT INTO ai_model_configs (model_name, model_type, version, accuracy_score, is_active, model_config) VALUES
('mistral-7b-instruct', 'chatbot', '1.0.0', 0.85, true, '{"provider": "openrouter", "temperature": 0.7, "max_tokens": 1000}'),
('plant-disease-mobilenetv2', 'disease_detection', '1.0.0', 0.82, true, '{"input_size": [224, 224, 3], "classes": 8, "threshold": 0.6}'),
('irrigation-prediction-lstm', 'irrigation_prediction', '1.0.0', 0.78, true, '{"features": ["soil_moisture", "temperature", "humidity", "light_level"], "sequence_length": 24}')
ON CONFLICT (model_name, version) DO NOTHING;

-- 9. Create views for common queries
CREATE OR REPLACE VIEW ai_analysis_summary AS
SELECT 
    a.id,
    a.plant_id,
    a.user_id,
    a.analysis_type,
    a.confidence_score,
    a.created_at,
    p.custom_name as plant_name,
    'unknown' as plant_type,
    CASE 
        WHEN f.feedback_type IS NOT NULL THEN f.feedback_type
        ELSE 'no_feedback'
    END as user_feedback
FROM ai_analyses a
LEFT JOIN plants p ON a.plant_id = p.plant_id
LEFT JOIN ai_feedback f ON a.id = f.analysis_id;

CREATE OR REPLACE VIEW chat_session_summary AS
SELECT 
    session_id,
    user_id,
    plant_id,
    COUNT(*) as message_count,
    MIN(created_at) as session_start,
    MAX(created_at) as session_end,
    AVG(ai_confidence) as avg_confidence,
    STRING_AGG(DISTINCT topic_category, ', ') as topics_discussed
FROM chat_histories 
WHERE session_id IS NOT NULL
GROUP BY session_id, user_id, plant_id;

-- 10. Create function to clean old data
CREATE OR REPLACE FUNCTION cleanup_old_ai_data(days_to_keep INTEGER DEFAULT 90)
RETURNS INTEGER AS $$
DECLARE
    deleted_count INTEGER := 0;
BEGIN
    -- Delete old chat histories (keep only recent ones)
    DELETE FROM chat_histories 
    WHERE created_at < CURRENT_TIMESTAMP - INTERVAL '1 day' * days_to_keep;
    
    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    
    -- Delete old unprocessed images (keep only recent ones)
    DELETE FROM plant_disease_images 
    WHERE upload_timestamp < CURRENT_TIMESTAMP - INTERVAL '1 day' * days_to_keep
    AND is_processed = FALSE;
    
    -- Delete old AI analyses (keep only recent ones or those with feedback)
    DELETE FROM ai_analyses 
    WHERE created_at < CURRENT_TIMESTAMP - INTERVAL '1 day' * days_to_keep
    AND id NOT IN (SELECT DISTINCT analysis_id FROM ai_feedback WHERE analysis_id IS NOT NULL);
    
    RETURN deleted_count;
END;
$$ LANGUAGE plpgsql;

-- 11. Grant permissions (adjust as needed for your setup)
-- GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO your_app_user;
-- GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO your_app_user;

COMMENT ON TABLE ai_analyses IS 'Stores results from AI analysis operations (disease detection, irrigation prediction, etc.)';
COMMENT ON TABLE ai_feedback IS 'Stores user feedback on AI analysis results for model improvement';
COMMENT ON TABLE plant_disease_images IS 'Stores uploaded images for disease detection analysis';
COMMENT ON TABLE ai_model_configs IS 'Configuration metadata about AI models used in the system';
COMMENT ON COLUMN chat_histories.session_id IS 'Groups related chat messages in a conversation session';
COMMENT ON COLUMN chat_histories.plant_context IS 'JSON data about the plant being discussed';
COMMENT ON COLUMN chat_histories.ai_confidence IS 'Confidence score of the AI response (0-1)';
COMMENT ON COLUMN chat_histories.topic_category IS 'Category of the conversation topic (watering, disease, general, etc.)';
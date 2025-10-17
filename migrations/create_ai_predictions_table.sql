-- Create ai_predictions table for storing AI prediction results
-- This table stores watering predictions, disease recognition results, and other AI predictions

CREATE TABLE IF NOT EXISTS ai_predictions (
    prediction_id SERIAL PRIMARY KEY,
    plant_id INTEGER REFERENCES plants(plant_id),
    prediction_type VARCHAR(50) NOT NULL, -- 'watering', 'disease', 'health'
    input_data JSONB NOT NULL,
    prediction_result JSONB NOT NULL,
    confidence_score DECIMAL(5,4),
    model_version VARCHAR(20),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_ai_predictions_plant_id ON ai_predictions(plant_id);
CREATE INDEX IF NOT EXISTS idx_ai_predictions_type ON ai_predictions(prediction_type);
CREATE INDEX IF NOT EXISTS idx_ai_predictions_created_at ON ai_predictions(created_at);
CREATE INDEX IF NOT EXISTS idx_ai_predictions_plant_type ON ai_predictions(plant_id, prediction_type);

-- Add comments for documentation
COMMENT ON TABLE ai_predictions IS 'Stores AI prediction results including watering predictions, disease recognition, and health assessments';
COMMENT ON COLUMN ai_predictions.prediction_type IS 'Type of prediction: watering, disease, health, etc.';
COMMENT ON COLUMN ai_predictions.input_data IS 'JSON data containing sensor readings or other input used for prediction';
COMMENT ON COLUMN ai_predictions.prediction_result IS 'JSON data containing the prediction results and recommendations';
COMMENT ON COLUMN ai_predictions.confidence_score IS 'Confidence score of the prediction (0.0000 to 1.0000)';
COMMENT ON COLUMN ai_predictions.model_version IS 'Version of the AI model used for this prediction';
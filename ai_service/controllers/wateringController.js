const { validationResult } = require('express-validator');
const { sensorUtils, modelUtils, predictionUtils } = require('../services/aiUtils');

/**
 * Predict watering needs using AI model
 */
const predictWateringNeeds = async (req, res) => {
    try {
        // Validate request
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({
                success: false,
                message: 'Validation failed',
                errors: errors.array()
            });
        }

        const { plant_id, sensor_data, historical_data } = req.body;
        const userId = req.user?.user_id || req.user?.id;

        if (!sensor_data) {
            return res.status(400).json({
                success: false,
                message: 'Sensor data is required'
            });
        }

        console.log(`Watering prediction request for plant ${plant_id} from user ${userId}`);

        // Load watering prediction model (placeholder for now)
        // const model = await modelUtils.loadModel('../ai_models/watering_prediction');
        
        // For now, return a simulated prediction based on sensor data
        const prediction = generateWateringPrediction(sensor_data, historical_data);

        return res.json({
            success: true,
            data: {
                plant_id,
                prediction: prediction.prediction,
                confidence: prediction.confidence,
                reasoning: prediction.reasoning,
                recommended_action: prediction.recommendedAction,
                next_watering: prediction.nextWatering,
                timestamp: new Date(),
                model_version: 'v1.0.0-placeholder'
            }
        });

    } catch (error) {
        console.error('Error predicting watering needs:', error);
        
        return res.status(500).json({
            success: false,
            message: 'Failed to predict watering needs',
            error: error.message
        });
    }
};

/**
 * Generate watering prediction (placeholder implementation)
 */
function generateWateringPrediction(sensorData, historicalData = []) {
    const { moisture, temperature, humidity, light } = sensorData;
    
    // Simple rule-based prediction for demonstration
    let needsWatering = false;
    let confidence = 0;
    let reasoning = '';
    let recommendedAction = '';
    let nextWatering = null;
    
    if (moisture < 30) {
        needsWatering = true;
        confidence = 0.9;
        reasoning = 'Soil moisture is critically low';
        recommendedAction = 'Water immediately';
        nextWatering = new Date();
    } else if (moisture < 45 && temperature > 25) {
        needsWatering = true;
        confidence = 0.75;
        reasoning = 'Low moisture combined with high temperature';
        recommendedAction = 'Water within 2-4 hours';
        nextWatering = new Date(Date.now() + 2 * 60 * 60 * 1000); // 2 hours
    } else if (moisture < 60 && temperature > 30 && light > 80) {
        needsWatering = true;
        confidence = 0.65;
        reasoning = 'Moderate moisture with high temperature and light';
        recommendedAction = 'Water within 6-8 hours';
        nextWatering = new Date(Date.now() + 6 * 60 * 60 * 1000); // 6 hours
    } else {
        needsWatering = false;
        confidence = 0.8;
        reasoning = 'Soil moisture levels are adequate';
        recommendedAction = 'No watering needed at this time';
        nextWatering = new Date(Date.now() + 24 * 60 * 60 * 1000); // Check again in 24 hours
    }
    
    return {
        prediction: needsWatering ? 'needs_water' : 'no_water_needed',
        confidence,
        reasoning,
        recommendedAction,
        nextWatering
    };
}

module.exports = {
    predictWateringNeeds
};
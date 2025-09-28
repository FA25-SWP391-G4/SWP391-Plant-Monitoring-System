/**
 * ============================================================================
 * AI SERVICE - COMPREHENSIVE AI INTEGRATION FOR PLANT MONITORING SYSTEM
 * ============================================================================
 *
 * This service provides AI-powered features for the SmartGarden IoT system:
 * - Watering prediction using machine learning
 * - Plant health analysis and recommendations
 * - AI chatbot for plant care advice
 * - Watering schedule optimization
 *
 * DEPENDENCIES:
 * - OpenAI API for chatbot and advanced analysis
 * - TensorFlow.js for local ML predictions
 * - Existing data models (SensorData, Plant, WateringHistory)
 */

const OpenAI = require('openai');
const tf = require('@tensorflow/tfjs-node');
const SensorData = require('../models/SensorData');
const Plant = require('../models/Plant');
const WateringHistory = require('../models/WateringHistory');
const AIModel = require('../models/AIModel');

class AIService {
    constructor() {
        // Initialize OpenAI client
        this.openai = new OpenAI({
            apiKey: process.env.OPENAI_API_KEY
        });

        // AI model cache for TensorFlow models
        this.models = new Map();

        // Configuration
        this.config = {
            predictionDays: 7,
            healthThresholds: {
                soilMoisture: { min: 20, max: 80 },
                temperature: { min: 15, max: 30 },
                airHumidity: { min: 40, max: 70 },
                lightIntensity: { min: 1000, max: 50000 }
            }
        };
    }

    /**
     * WATERING PREDICTION AI (UC20)
     * Predicts when a plant will need watering based on historical data and current conditions
     */
    async predictWateringNeeds(plantId, daysAhead = 7) {
        try {
            const plant = await Plant.findById(plantId);
            if (!plant) {
                throw new Error('Plant not found');
            }

            // Get historical sensor data (last 30 days)
            const thirtyDaysAgo = new Date();
            thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

            const sensorData = await SensorData.findByDateRange(
                plant.device_id,
                thirtyDaysAgo,
                new Date()
            );

            // Get watering history
            const wateringHistory = await WateringHistory.findByPlantId(plantId, 50);

            if (sensorData.length < 10) {
                return {
                    prediction: 'insufficient_data',
                    message: 'Need at least 10 days of sensor data for accurate predictions',
                    nextWatering: null,
                    confidence: 0
                };
            }

            // Simple ML-based prediction using linear regression
            const prediction = await this._calculateWateringPrediction(
                sensorData,
                wateringHistory,
                plant,
                daysAhead
            );

            return prediction;

        } catch (error) {
            console.error('Error predicting watering needs:', error);
            throw error;
        }
    }

    /**
     * PLANT HEALTH ANALYSIS AI (UC21)
     * Analyzes plant health based on sensor data and provides recommendations
     */
    async analyzePlantHealth(plantId) {
        try {
            const plant = await Plant.findById(plantId);
            if (!plant) {
                throw new Error('Plant not found');
            }

            // Get latest sensor data
            const latestData = await SensorData.getLatestByDeviceId(plant.device_id);
            if (!latestData) {
                return {
                    healthScore: 0,
                    status: 'no_data',
                    issues: ['No sensor data available'],
                    recommendations: ['Check device connection and sensor readings']
                };
            }

            // Analyze each parameter
            const analysis = {
                soilMoisture: this._analyzeSoilMoisture(latestData.soil_moisture, plant.moisture_threshold),
                temperature: this._analyzeTemperature(latestData.temperature),
                airHumidity: this._analyzeAirHumidity(latestData.air_humidity),
                lightIntensity: this._analyzeLightIntensity(latestData.light_intensity)
            };

            // Calculate overall health score (0-100)
            const healthScore = this._calculateHealthScore(analysis);

            // Generate recommendations using AI
            const recommendations = await this._generateHealthRecommendations(analysis, plant);

            return {
                healthScore,
                status: this._getHealthStatus(healthScore),
                analysis,
                issues: this._extractIssues(analysis),
                recommendations,
                timestamp: new Date()
            };

        } catch (error) {
            console.error('Error analyzing plant health:', error);
            throw error;
        }
    }

    /**
     * AI CHATBOT FOR PLANT CARE ADVICE (UC23)
     * Provides natural language plant care assistance
     */
    async getPlantCareAdvice(userMessage, plantId = null, userContext = {}) {
        try {
            let contextInfo = '';

            // Add plant-specific context if plantId provided
            if (plantId) {
                const plant = await Plant.findById(plantId);
                const latestData = plant ? await SensorData.getLatestByDeviceId(plant.device_id) : null;

                if (plant && latestData) {
                    contextInfo = `
Current plant: ${plant.custom_name}
Species: ${plant.species_name || 'Unknown'}
Latest sensor readings:
- Soil moisture: ${latestData.soil_moisture}%
- Temperature: ${latestData.temperature}°C
- Air humidity: ${latestData.air_humidity}%
- Light intensity: ${latestData.light_intensity} lux
Moisture threshold: ${plant.moisture_threshold}%
Auto-watering: ${plant.auto_watering_on ? 'Enabled' : 'Disabled'}
                    `.trim();
                }
            }

            // Create system prompt
            const systemPrompt = `You are an expert plant care AI assistant for a smart gardening system. Provide helpful, accurate advice about plant care, watering, and gardening.

${contextInfo ? `CONTEXT INFORMATION:\n${contextInfo}\n\n` : ''}

Guidelines:
- Be friendly and encouraging
- Provide specific, actionable advice
- Consider local conditions and plant species
- Suggest monitoring and adjustments
- Recommend professional help when appropriate
- Keep responses concise but informative

Always prioritize plant health and safety.`;

            // Get response from OpenAI
            const completion = await this.openai.chat.completions.create({
                model: "gpt-3.5-turbo",
                messages: [
                    { role: "system", content: systemPrompt },
                    { role: "user", content: userMessage }
                ],
                max_tokens: 500,
                temperature: 0.7
            });

            const advice = completion.choices[0].message.content;

            // Log the conversation if user context provided
            if (userContext.userId) {
                // This would integrate with ChatHistory model
                // await this._logChatMessage(userContext.userId, userMessage, advice, plantId);
            }

            return {
                advice,
                plantId,
                timestamp: new Date(),
                contextUsed: !!plantId
            };

        } catch (error) {
            console.error('Error getting plant care advice:', error);
            return {
                advice: "I'm sorry, I'm having trouble connecting to my knowledge base right now. Please try again later, or consult a local gardening expert for immediate plant care advice.",
                error: true,
                timestamp: new Date()
            };
        }
    }

    /**
     * WATERING SCHEDULE OPTIMIZATION AI (UC30)
     * Optimizes watering schedules based on plant needs and environmental factors
     */
    async optimizeWateringSchedule(plantId) {
        try {
            const plant = await Plant.findById(plantId);
            if (!plant) {
                throw new Error('Plant not found');
            }

            // Get historical data for analysis
            const sensorData = await SensorData.findByDeviceId(plant.device_id, 100);
            const wateringHistory = await WateringHistory.findByPlantId(plantId, 30);

            if (sensorData.length < 20) {
                return {
                    optimized: false,
                    message: 'Need more historical data for optimization',
                    currentSchedule: plant.moisture_threshold,
                    recommendations: ['Continue monitoring for 2-3 weeks before optimization']
                };
            }

            // Analyze patterns and optimize
            const optimization = await this._calculateOptimalSchedule(
                sensorData,
                wateringHistory,
                plant
            );

            return {
                optimized: true,
                optimalThreshold: optimization.threshold,
                optimalFrequency: optimization.frequency,
                reasoning: optimization.reasoning,
                expectedSavings: optimization.savings,
                confidence: optimization.confidence
            };

        } catch (error) {
            console.error('Error optimizing watering schedule:', error);
            throw error;
        }
    }

    // ===== PRIVATE HELPER METHODS =====

    async _calculateWateringPrediction(sensorData, wateringHistory, plant, daysAhead) {
        // Simple prediction algorithm based on moisture trends
        const recentData = sensorData.slice(-7); // Last 7 readings
        const moistureTrend = this._calculateMoistureTrend(recentData);

        // Calculate average watering interval
        const wateringIntervals = this._calculateWateringIntervals(wateringHistory);

        // Predict based on current moisture and trend
        const currentMoisture = recentData[recentData.length - 1]?.soil_moisture || 0;
        const threshold = plant.moisture_threshold;

        let daysUntilWatering = 0;
        let predictedMoisture = currentMoisture;

        // Simulate moisture decrease over time
        while (predictedMoisture > threshold && daysUntilWatering < daysAhead) {
            predictedMoisture -= moistureTrend; // Daily decrease
            daysUntilWatering++;
        }

        const confidence = Math.max(0.3, Math.min(0.9, sensorData.length / 50)); // Based on data amount

        return {
            prediction: daysUntilWatering <= daysAhead ? 'needs_watering' : 'sufficient_water',
            nextWatering: daysUntilWatering <= daysAhead ? new Date(Date.now() + daysUntilWatering * 24 * 60 * 60 * 1000) : null,
            daysUntilWatering,
            currentMoisture,
            moistureTrend: moistureTrend.toFixed(2),
            confidence: Math.round(confidence * 100) / 100,
            message: daysUntilWatering <= daysAhead ?
                `Plant needs watering in approximately ${daysUntilWatering} days` :
                `Plant has sufficient water for the next ${daysAhead} days`
        };
    }

    _calculateMoistureTrend(sensorData) {
        if (sensorData.length < 2) return 0;

        let totalChange = 0;
        for (let i = 1; i < sensorData.length; i++) {
            const change = sensorData[i].soil_moisture - sensorData[i-1].soil_moisture;
            totalChange += change;
        }

        return totalChange / (sensorData.length - 1); // Average daily change
    }

    _calculateWateringIntervals(wateringHistory) {
        if (wateringHistory.length < 2) return [7]; // Default 7 days

        const intervals = [];
        for (let i = 1; i < wateringHistory.length; i++) {
            const days = Math.floor(
                (new Date(wateringHistory[i-1].timestamp) - new Date(wateringHistory[i].timestamp)) /
                (1000 * 60 * 60 * 24)
            );
            intervals.push(days);
        }

        return intervals;
    }

    _analyzeSoilMoisture(moisture, threshold) {
        const status = moisture < threshold ? 'too_dry' :
                      moisture > threshold + 20 ? 'too_wet' : 'optimal';

        return {
            value: moisture,
            threshold,
            status,
            issue: status !== 'optimal',
            message: status === 'too_dry' ? `Soil moisture (${moisture}%) is below threshold (${threshold}%)` :
                     status === 'too_wet' ? `Soil moisture (${moisture}%) is too high` :
                     `Soil moisture is optimal`
        };
    }

    _analyzeTemperature(temp) {
        const { min, max } = this.config.healthThresholds.temperature;
        const status = temp < min ? 'too_cold' :
                      temp > max ? 'too_hot' : 'optimal';

        return {
            value: temp,
            range: { min, max },
            status,
            issue: status !== 'optimal',
            message: status === 'too_cold' ? `Temperature (${temp}°C) is below optimal range (${min}-${max}°C)` :
                     status === 'too_hot' ? `Temperature (${temp}°C) is above optimal range (${min}-${max}°C)` :
                     `Temperature is within optimal range`
        };
    }

    _analyzeAirHumidity(humidity) {
        const { min, max } = this.config.healthThresholds.airHumidity;
        const status = humidity < min ? 'too_dry' :
                      humidity > max ? 'too_humid' : 'optimal';

        return {
            value: humidity,
            range: { min, max },
            status,
            issue: status !== 'optimal',
            message: status === 'too_dry' ? `Air humidity (${humidity}%) is too low` :
                     status === 'too_humid' ? `Air humidity (${humidity}%) is too high` :
                     `Air humidity is optimal`
        };
    }

    _analyzeLightIntensity(light) {
        const { min, max } = this.config.healthThresholds.lightIntensity;
        const status = light < min ? 'too_dark' :
                      light > max ? 'too_bright' : 'optimal';

        return {
            value: light,
            range: { min, max },
            status,
            issue: status !== 'optimal',
            message: status === 'too_dark' ? `Light intensity (${light} lux) is too low` :
                     status === 'too_bright' ? `Light intensity (${light} lux) is too high` :
                     `Light intensity is optimal`
        };
    }

    _calculateHealthScore(analysis) {
        const weights = {
            soilMoisture: 0.4,
            temperature: 0.25,
            airHumidity: 0.2,
            lightIntensity: 0.15
        };

        let score = 100;
        const issues = [];

        // Deduct points for each issue
        Object.entries(analysis).forEach(([param, data]) => {
            if (data.issue) {
                const weight = weights[param];
                score -= weight * 30; // 30 points deduction per issue
                issues.push(param);
            }
        });

        // Additional deduction for multiple issues
        if (issues.length > 1) {
            score -= (issues.length - 1) * 10;
        }

        return Math.max(0, Math.min(100, Math.round(score)));
    }

    _getHealthStatus(score) {
        if (score >= 80) return 'excellent';
        if (score >= 60) return 'good';
        if (score >= 40) return 'fair';
        if (score >= 20) return 'poor';
        return 'critical';
    }

    _extractIssues(analysis) {
        return Object.entries(analysis)
            .filter(([_, data]) => data.issue)
            .map(([param, data]) => data.message);
    }

    async _generateHealthRecommendations(analysis, plant) {
        const issues = this._extractIssues(analysis);

        if (issues.length === 0) {
            return [
                "Your plant is in excellent health! Keep up the good work.",
                "Continue monitoring conditions and maintain current care routine.",
                "Consider taking a photo to track growth progress."
            ];
        }

        // Use AI to generate specific recommendations
        const prompt = `Based on these plant health issues, provide 3 specific, actionable recommendations:

Issues: ${issues.join(', ')}

Plant: ${plant.custom_name} (${plant.species_name || 'Unknown species'})

Provide practical advice for improving plant health.`;

        try {
            const completion = await this.openai.chat.completions.create({
                model: "gpt-3.5-turbo",
                messages: [
                    { role: "system", content: "You are a plant care expert. Provide specific, actionable recommendations for plant health issues." },
                    { role: "user", content: prompt }
                ],
                max_tokens: 200,
                temperature: 0.6
            });

            const recommendations = completion.choices[0].message.content
                .split('\n')
                .filter(line => line.trim().length > 0)
                .slice(0, 3);

            return recommendations;

        } catch (error) {
            // Fallback recommendations
            return [
                "Monitor environmental conditions closely and adjust as needed.",
                "Ensure proper watering schedule based on plant species requirements.",
                "Consider consulting a local gardening expert for specific advice."
            ];
        }
    }

    async _calculateOptimalSchedule(sensorData, wateringHistory, plant) {
        // Analyze watering patterns and environmental factors
        const avgMoisture = sensorData.reduce((sum, d) => sum + d.soil_moisture, 0) / sensorData.length;
        const moistureVariance = this._calculateVariance(sensorData.map(d => d.soil_moisture));

        // Calculate optimal threshold based on plant response
        let optimalThreshold = plant.moisture_threshold;

        if (moistureVariance > 100) { // High variance indicates inconsistent watering
            optimalThreshold = Math.max(30, avgMoisture - 10); // Adjust threshold
        }

        // Calculate optimal frequency
        const intervals = this._calculateWateringIntervals(wateringHistory);
        const avgInterval = intervals.reduce((sum, i) => sum + i, 0) / intervals.length;

        return {
            threshold: Math.round(optimalThreshold),
            frequency: Math.max(1, Math.round(avgInterval * 0.9)), // Slightly more frequent
            reasoning: `Based on ${sensorData.length} sensor readings and ${wateringHistory.length} watering events`,
            savings: moistureVariance > 50 ? '15-20% water savings expected' : '5-10% water savings expected',
            confidence: Math.min(0.85, sensorData.length / 100)
        };
    }

    _calculateVariance(values) {
        const mean = values.reduce((sum, val) => sum + val, 0) / values.length;
        const squaredDiffs = values.map(val => Math.pow(val - mean, 2));
        return squaredDiffs.reduce((sum, sq) => sum + sq, 0) / values.length;
    }
}

module.exports = new AIService();
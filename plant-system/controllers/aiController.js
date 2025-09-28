/**
 * ============================================================================
 * AI CONTROLLER - HANDLES AI-POWERED FEATURES FOR PLANT MONITORING SYSTEM
 * ============================================================================
 *
 * This controller provides endpoints for AI-powered plant care features:
 * - Watering predictions
 * - Plant health analysis
 * - AI chatbot for plant care advice
 * - Watering schedule optimization
 *
 * All endpoints require premium user authentication
 */

const aiService = require('../services/aiService');
const User = require('../models/User');
const Plant = require('../models/Plant');

class AIController {
    /**
     * PREDICT WATERING NEEDS (UC20)
     * GET /api/ai/predict-watering/:plantId
     */
    async predictWatering(req, res) {
        try {
            const { plantId } = req.params;
            const { daysAhead = 7 } = req.query;
            const userId = req.user?.user_id;

            // Validate user has access to this plant
            const plant = await Plant.findByUserId(userId).then(plants =>
                plants.find(p => p.plant_id === parseInt(plantId))
            );

            if (!plant) {
                return res.status(404).json({
                    success: false,
                    message: 'Plant not found or access denied'
                });
            }

            // Check if user is premium (AI features are premium-only)
            const user = await User.findById(userId);
            if (!user || user.role !== 'premium') {
                return res.status(403).json({
                    success: false,
                    message: 'AI features require premium subscription',
                    upgradeRequired: true
                });
            }

            const prediction = await aiService.predictWateringNeeds(plantId, parseInt(daysAhead));

            res.json({
                success: true,
                data: prediction,
                plant: {
                    id: plant.plant_id,
                    name: plant.custom_name,
                    species: plant.species_name
                }
            });

        } catch (error) {
            console.error('Error in predictWatering:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to predict watering needs',
                error: error.message
            });
        }
    }

    /**
     * ANALYZE PLANT HEALTH (UC21)
     * GET /api/ai/analyze-health/:plantId
     */
    async analyzeHealth(req, res) {
        try {
            const { plantId } = req.params;
            const userId = req.user?.user_id;

            // Validate user has access to this plant
            const plant = await Plant.findByUserId(userId).then(plants =>
                plants.find(p => p.plant_id === parseInt(plantId))
            );

            if (!plant) {
                return res.status(404).json({
                    success: false,
                    message: 'Plant not found or access denied'
                });
            }

            // Check if user is premium
            const user = await User.findById(userId);
            if (!user || user.role !== 'premium') {
                return res.status(403).json({
                    success: false,
                    message: 'AI features require premium subscription',
                    upgradeRequired: true
                });
            }

            const analysis = await aiService.analyzePlantHealth(plantId);

            res.json({
                success: true,
                data: analysis,
                plant: {
                    id: plant.plant_id,
                    name: plant.custom_name,
                    species: plant.species_name
                }
            });

        } catch (error) {
            console.error('Error in analyzeHealth:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to analyze plant health',
                error: error.message
            });
        }
    }

    /**
     * AI CHATBOT FOR PLANT CARE ADVICE (UC23)
     * POST /api/ai/chat
     */
    async chat(req, res) {
        try {
            const { message, plantId } = req.body;
            const userId = req.user?.user_id;

            if (!message || message.trim().length === 0) {
                return res.status(400).json({
                    success: false,
                    message: 'Message is required'
                });
            }

            // Check if user is premium
            const user = await User.findById(userId);
            if (!user || user.role !== 'premium') {
                return res.status(403).json({
                    success: false,
                    message: 'AI chatbot requires premium subscription',
                    upgradeRequired: true
                });
            }

            // Validate plant access if plantId provided
            let plantContext = null;
            if (plantId) {
                const plant = await Plant.findByUserId(userId).then(plants =>
                    plants.find(p => p.plant_id === parseInt(plantId))
                );

                if (!plant) {
                    return res.status(404).json({
                        success: false,
                        message: 'Plant not found or access denied'
                    });
                }

                plantContext = {
                    id: plant.plant_id,
                    name: plant.custom_name,
                    species: plant.species_name
                };
            }

            const response = await aiService.getPlantCareAdvice(message, plantId, {
                userId,
                userName: user.full_name
            });

            res.json({
                success: true,
                data: {
                    ...response,
                    plant: plantContext
                }
            });

        } catch (error) {
            console.error('Error in chat:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to get AI advice',
                error: error.message
            });
        }
    }

    /**
     * OPTIMIZE WATERING SCHEDULE (UC30)
     * GET /api/ai/optimize-schedule/:plantId
     */
    async optimizeSchedule(req, res) {
        try {
            const { plantId } = req.params;
            const userId = req.user?.user_id;

            // Validate user has access to this plant
            const plant = await Plant.findByUserId(userId).then(plants =>
                plants.find(p => p.plant_id === parseInt(plantId))
            );

            if (!plant) {
                return res.status(404).json({
                    success: false,
                    message: 'Plant not found or access denied'
                });
            }

            // Check if user is premium
            const user = await User.findById(userId);
            if (!user || user.role !== 'premium') {
                return res.status(403).json({
                    success: false,
                    message: 'AI optimization requires premium subscription',
                    upgradeRequired: true
                });
            }

            const optimization = await aiService.optimizeWateringSchedule(plantId);

            res.json({
                success: true,
                data: optimization,
                plant: {
                    id: plant.plant_id,
                    name: plant.custom_name,
                    species: plant.species_name,
                    currentThreshold: plant.moisture_threshold
                }
            });

        } catch (error) {
            console.error('Error in optimizeSchedule:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to optimize watering schedule',
                error: error.message
            });
        }
    }

    /**
     * GET AI FEATURES STATUS
     * GET /api/ai/status
     */
    async getStatus(req, res) {
        try {
            const userId = req.user?.user_id;
            const user = await User.findById(userId);

            const isPremium = user && user.role === 'premium';

            // Get user's plants count for context
            const userPlants = await Plant.findByUserId(userId);
            const plantsWithData = [];

            for (const plant of userPlants) {
                const latestData = await Plant.prototype.getLatestSensorData.call({ device_id: plant.device_id });
                if (latestData) {
                    plantsWithData.push({
                        id: plant.plant_id,
                        name: plant.custom_name,
                        hasRecentData: true
                    });
                }
            }

            res.json({
                success: true,
                data: {
                    isPremium,
                    features: {
                        wateringPrediction: isPremium,
                        healthAnalysis: isPremium,
                        aiChatbot: isPremium,
                        scheduleOptimization: isPremium
                    },
                    plantsAvailable: plantsWithData.length,
                    plantsWithData: plantsWithData,
                    upgradeRequired: !isPremium
                }
            });

        } catch (error) {
            console.error('Error in getStatus:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to get AI status',
                error: error.message
            });
        }
    }

    /**
     * BULK HEALTH ANALYSIS FOR ALL USER PLANTS
     * GET /api/ai/bulk-health
     */
    async bulkHealthAnalysis(req, res) {
        try {
            const userId = req.user?.user_id;

            // Check if user is premium
            const user = await User.findById(userId);
            if (!user || user.role !== 'premium') {
                return res.status(403).json({
                    success: false,
                    message: 'Bulk analysis requires premium subscription',
                    upgradeRequired: true
                });
            }

            const plants = await Plant.findByUserId(userId);
            const results = [];

            for (const plant of plants) {
                try {
                    const analysis = await aiService.analyzePlantHealth(plant.plant_id);
                    results.push({
                        plant: {
                            id: plant.plant_id,
                            name: plant.custom_name,
                            species: plant.species_name
                        },
                        health: analysis
                    });
                } catch (error) {
                    results.push({
                        plant: {
                            id: plant.plant_id,
                            name: plant.custom_name,
                            species: plant.species_name
                        },
                        error: 'Failed to analyze plant health'
                    });
                }
            }

            // Sort by health score (worst first)
            results.sort((a, b) => {
                const scoreA = a.health?.healthScore || 0;
                const scoreB = b.health?.healthScore || 0;
                return scoreA - scoreB;
            });

            res.json({
                success: true,
                data: {
                    totalPlants: plants.length,
                    analyzedPlants: results.length,
                    results
                }
            });

        } catch (error) {
            console.error('Error in bulkHealthAnalysis:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to perform bulk health analysis',
                error: error.message
            });
        }
    }
}

module.exports = new AIController();
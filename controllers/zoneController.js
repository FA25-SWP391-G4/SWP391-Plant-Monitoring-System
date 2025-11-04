/**
 * ============================================================================
 * ZONE CONTROLLER - PLANT ORGANIZATION MANAGEMENT
 * ============================================================================
 * 
 * Handles HTTP requests for plant zone management functionality.
 * Zones replace the deprecated location field with flexible organization.
 * 
 * FEATURES:
 * - Create custom zones (Premium/Ultimate feature)
 * - List user zones with plant counts
 * - Update/delete zones
 * - Assign plants to zones
 * - Zone-based plant filtering
 * 
 * ENDPOINTS:
 * - GET    /api/zones          - List all user zones
 * - POST   /api/zones          - Create new zone
 * - GET    /api/zones/:id      - Get specific zone details
 * - PUT    /api/zones/:id      - Update zone
 * - DELETE /api/zones/:id      - Delete zone
 * - POST   /api/zones/:id/plants/:plantId - Assign plant to zone
 */

const Zone = require('../models/Zone');
const Plant = require('../models/Plant');
const SystemLog = require('../models/SystemLog');

class ZoneController {
    
    /**
     * GET /api/zones
     * List all zones for authenticated user
     */
    static async getAllZones(req, res) {
        try {
            const userId = req.user.user_id;
            
            // Check if user has premium/ultimate access
            const isPremium = req.user.role === 'Premium' || req.user.role === 'Ultimate' || req.user.role === 'Admin';
            if (!isPremium) {
                return res.status(403).json({
                    success: false,
                    error: 'Zone management requires Premium or Ultimate subscription'
                });
            }

            const zones = await Zone.findByUserId(userId);

            await SystemLog.info('ZoneController', 'getAllZones', 
                `Retrieved ${zones.length} zones for user ${userId}`);

            res.json({
                success: true,
                data: zones.map(zone => zone.toJSON())
            });

        } catch (error) {
            await SystemLog.error('ZoneController', 'getAllZones', error.message);
            res.status(500).json({
                success: false,
                error: 'Failed to retrieve zones'
            });
        }
    }

    /**
     * POST /api/zones
     * Create a new zone
     */
    static async createZone(req, res) {
        try {
            const userId = req.user.user_id;
            const { zone_name, description } = req.body;

            // Check if user has premium/ultimate access
            const isPremium = req.user.role === 'Premium' || req.user.role === 'Ultimate' || req.user.role === 'Admin';
            if (!isPremium) {
                return res.status(403).json({
                    success: false,
                    error: 'Zone management requires Premium or Ultimate subscription'
                });
            }

            // Validate input
            if (!zone_name || zone_name.trim().length === 0) {
                return res.status(400).json({
                    success: false,
                    error: 'Zone name is required'
                });
            }

            if (zone_name.trim().length > 100) {
                return res.status(400).json({
                    success: false,
                    error: 'Zone name must be 100 characters or less'
                });
            }

            // Create zone
            const zoneData = {
                user_id: userId,
                zone_name: zone_name.trim(),
                description: description ? description.trim() : null
            };

            const newZone = await Zone.create(zoneData);

            await SystemLog.info('ZoneController', 'createZone', 
                `Created zone: ${zone_name} for user ${userId}`);

            res.status(201).json({
                success: true,
                message: 'Zone created successfully',
                data: newZone.toJSON()
            });

        } catch (error) {
            await SystemLog.error('ZoneController', 'createZone', error.message);
            
            if (error.message.includes('unique_zone_name_per_user')) {
                return res.status(400).json({
                    success: false,
                    error: 'You already have a zone with this name'
                });
            }

            res.status(500).json({
                success: false,
                error: 'Failed to create zone'
            });
        }
    }

    /**
     * GET /api/zones/:id
     * Get specific zone details with plants
     */
    static async getZoneById(req, res) {
        try {
            const userId = req.user.user_id;
            const zoneId = parseInt(req.params.id);

            // Check if user has premium/ultimate access
            const isPremium = req.user.role === 'Premium' || req.user.role === 'Ultimate' || req.user.role === 'Admin';
            if (!isPremium) {
                return res.status(403).json({
                    success: false,
                    error: 'Zone management requires Premium or Ultimate subscription'
                });
            }

            const zone = await Zone.findById(zoneId);
            
            if (!zone) {
                return res.status(404).json({
                    success: false,
                    error: 'Zone not found'
                });
            }

            // Check if zone belongs to user
            if (zone.user_id !== userId) {
                return res.status(403).json({
                    success: false,
                    error: 'Access denied'
                });
            }

            // Get plants in this zone
            const plants = await Zone.getPlantsInZone(zoneId);

            const zoneData = zone.toJSON();
            zoneData.plants = plants;

            await SystemLog.info('ZoneController', 'getZoneById', 
                `Retrieved zone ${zoneId} with ${plants.length} plants`);

            res.json({
                success: true,
                data: zoneData
            });

        } catch (error) {
            await SystemLog.error('ZoneController', 'getZoneById', error.message);
            res.status(500).json({
                success: false,
                error: 'Failed to retrieve zone'
            });
        }
    }

    /**
     * PUT /api/zones/:id
     * Update zone information
     */
    static async updateZone(req, res) {
        try {
            const userId = req.user.user_id;
            const zoneId = parseInt(req.params.id);
            const { zone_name, description } = req.body;

            // Check if user has premium/ultimate access
            const isPremium = req.user.role === 'Premium' || req.user.role === 'Ultimate' || req.user.role === 'Admin';
            if (!isPremium) {
                return res.status(403).json({
                    success: false,
                    error: 'Zone management requires Premium or Ultimate subscription'
                });
            }

            // Validate input
            if (zone_name && zone_name.trim().length === 0) {
                return res.status(400).json({
                    success: false,
                    error: 'Zone name cannot be empty'
                });
            }

            if (zone_name && zone_name.trim().length > 100) {
                return res.status(400).json({
                    success: false,
                    error: 'Zone name must be 100 characters or less'
                });
            }

            // Check if zone exists and belongs to user
            const existingZone = await Zone.findById(zoneId);
            if (!existingZone || existingZone.user_id !== userId) {
                return res.status(404).json({
                    success: false,
                    error: 'Zone not found'
                });
            }

            // Update zone
            const updateData = {};
            if (zone_name) updateData.zone_name = zone_name.trim();
            if (description !== undefined) updateData.description = description ? description.trim() : null;

            const updatedZone = await Zone.update(zoneId, updateData);

            await SystemLog.info('ZoneController', 'updateZone', 
                `Updated zone ${zoneId} for user ${userId}`);

            res.json({
                success: true,
                message: 'Zone updated successfully',
                data: updatedZone.toJSON()
            });

        } catch (error) {
            await SystemLog.error('ZoneController', 'updateZone', error.message);
            
            if (error.message.includes('unique_zone_name_per_user')) {
                return res.status(400).json({
                    success: false,
                    error: 'You already have a zone with this name'
                });
            }

            res.status(500).json({
                success: false,
                error: 'Failed to update zone'
            });
        }
    }

    /**
     * DELETE /api/zones/:id
     * Delete a zone (plants will be unassigned)
     */
    static async deleteZone(req, res) {
        try {
            const userId = req.user.user_id;
            const zoneId = parseInt(req.params.id);

            // Check if user has premium/ultimate access
            const isPremium = req.user.role === 'Premium' || req.user.role === 'Ultimate' || req.user.role === 'Admin';
            if (!isPremium) {
                return res.status(403).json({
                    success: false,
                    error: 'Zone management requires Premium or Ultimate subscription'
                });
            }

            // Check if zone exists and belongs to user
            const existingZone = await Zone.findById(zoneId);
            if (!existingZone || existingZone.user_id !== userId) {
                return res.status(404).json({
                    success: false,
                    error: 'Zone not found'
                });
            }

            // Delete zone
            const deleted = await Zone.delete(zoneId, userId);

            if (!deleted) {
                return res.status(404).json({
                    success: false,
                    error: 'Zone not found'
                });
            }

            await SystemLog.info('ZoneController', 'deleteZone', 
                `Deleted zone ${zoneId} for user ${userId}`);

            res.json({
                success: true,
                message: 'Zone deleted successfully'
            });

        } catch (error) {
            await SystemLog.error('ZoneController', 'deleteZone', error.message);
            res.status(500).json({
                success: false,
                error: 'Failed to delete zone'
            });
        }
    }

    /**
     * POST /api/zones/:id/plants/:plantId
     * Assign a plant to a zone
     */
    static async assignPlantToZone(req, res) {
        try {
            const userId = req.user.user_id;
            const zoneId = parseInt(req.params.id);
            const plantId = parseInt(req.params.plantId);

            // Check if user has premium/ultimate access
            const isPremium = req.user.role === 'Premium' || req.user.role === 'Ultimate' || req.user.role === 'Admin';
            if (!isPremium) {
                return res.status(403).json({
                    success: false,
                    error: 'Zone management requires Premium or Ultimate subscription'
                });
            }

            // Verify zone belongs to user
            const zone = await Zone.findById(zoneId);
            if (!zone || zone.user_id !== userId) {
                return res.status(404).json({
                    success: false,
                    error: 'Zone not found'
                });
            }

            // Verify plant belongs to user (we'll need to add this check to Plant model)
            // For now, just attempt the assignment
            const assigned = await Zone.assignPlant(zoneId, plantId);

            if (!assigned) {
                return res.status(404).json({
                    success: false,
                    error: 'Plant not found'
                });
            }

            await SystemLog.info('ZoneController', 'assignPlantToZone', 
                `Assigned plant ${plantId} to zone ${zoneId} for user ${userId}`);

            res.json({
                success: true,
                message: 'Plant assigned to zone successfully'
            });

        } catch (error) {
            await SystemLog.error('ZoneController', 'assignPlantToZone', error.message);
            res.status(500).json({
                success: false,
                error: 'Failed to assign plant to zone'
            });
        }
    }
}

module.exports = ZoneController;
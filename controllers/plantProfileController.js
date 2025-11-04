/**
 * ============================================================================
 * PLANT PROFILE CONTROLLER - SPECIES DATABASE MANAGEMENT
 * ============================================================================
 * 
 * This controller handles plant species profile management:
 * - Browse plant species database
 * - Search for specific plant species
 * - Get detailed plant care information
 * - CRUD operations for plant profiles (Admin only)
 * 
 * IMPLEMENTATION NOTES:
 * - Read-only access for regular users
 * - Full CRUD for admin users
 * - Supports pagination and search functionality
 */

const PlantProfile = require('../models/PlantProfile');
const SystemLog = require('../models/SystemLog');
const { isValidUUID } = require('../utils/uuidGenerator');

/**
 * GET /api/plant-profiles
 * Get all plant profiles with optional pagination and search
 */
const getAllPlantProfiles = async (req, res) => {
    try {
        const { 
            page = 1, 
            limit = 20, 
            search = '', 
            moisture_min, 
            moisture_max,
            sort = 'species_name',
            order = 'ASC'
        } = req.query;

        // Validate pagination parameters
        const pageNum = Math.max(1, parseInt(page));
        const limitNum = Math.min(100, Math.max(1, parseInt(limit))); // Max 100 per page
        const offset = (pageNum - 1) * limitNum;

        // Build query with filters
        let query = `
            SELECT profile_id, species_name, description, ideal_moisture
            FROM Plant_Profiles
            WHERE 1=1
        `;
        const queryParams = [];
        let paramIndex = 1;

        // Search filter
        if (search.trim()) {
            query += ` AND (
                LOWER(species_name) LIKE LOWER($${paramIndex}) OR 
                LOWER(description) LIKE LOWER($${paramIndex + 1})
            )`;
            queryParams.push(`%${search.trim()}%`, `%${search.trim()}%`);
            paramIndex += 2;
        }

        // Moisture range filters
        if (moisture_min) {
            query += ` AND ideal_moisture >= $${paramIndex}`;
            queryParams.push(parseInt(moisture_min));
            paramIndex++;
        }
        if (moisture_max) {
            query += ` AND ideal_moisture <= $${paramIndex}`;
            queryParams.push(parseInt(moisture_max));
            paramIndex++;
        }

        // Sorting
        const validSortFields = ['species_name', 'ideal_moisture', 'profile_id'];
        const sortField = validSortFields.includes(sort) ? sort : 'species_name';
        const sortOrder = order.toUpperCase() === 'DESC' ? 'DESC' : 'ASC';
        query += ` ORDER BY ${sortField} ${sortOrder}`;

        // Pagination
        query += ` LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`;
        queryParams.push(limitNum, offset);

        // Execute query
        const { pool } = require('../config/db');
        const result = await pool.query(query, queryParams);

        // Get total count for pagination
        let countQuery = `
            SELECT COUNT(*) as total
            FROM Plant_Profiles
            WHERE 1=1
        `;
        const countParams = [];
        let countParamIndex = 1;

        if (search.trim()) {
            countQuery += ` AND (
                LOWER(species_name) LIKE LOWER($${countParamIndex}) OR 
                LOWER(description) LIKE LOWER($${countParamIndex + 1})
            )`;
            countParams.push(`%${search.trim()}%`, `%${search.trim()}%`);
            countParamIndex += 2;
        }

        if (moisture_min) {
            countQuery += ` AND ideal_moisture >= $${countParamIndex}`;
            countParams.push(parseInt(moisture_min));
            countParamIndex++;
        }
        if (moisture_max) {
            countQuery += ` AND ideal_moisture <= $${countParamIndex}`;
            countParams.push(parseInt(moisture_max));
            countParamIndex++;
        }

        const countResult = await pool.query(countQuery, countParams);
        const totalCount = parseInt(countResult.rows[0].total);
        const totalPages = Math.ceil(totalCount / limitNum);

        await SystemLog.info('PlantProfileController', 'getAllPlantProfiles', 
            `Retrieved ${result.rows.length} plant profiles (page ${pageNum}/${totalPages})`);

        res.json({
            success: true,
            data: result.rows,
            pagination: {
                current_page: pageNum,
                total_pages: totalPages,
                total_items: totalCount,
                items_per_page: limitNum,
                has_next: pageNum < totalPages,
                has_prev: pageNum > 1
            },
            filters: {
                search,
                moisture_min,
                moisture_max,
                sort: sortField,
                order: sortOrder
            }
        });

    } catch (error) {
        await SystemLog.error('PlantProfileController', 'getAllPlantProfiles', error.message);
        res.status(500).json({
            success: false,
            error: 'Failed to retrieve plant profiles'
        });
    }
};

/**
 * GET /api/plant-profiles/:id
 * Get a specific plant profile by ID
 */
const getPlantProfileById = async (req, res) => {
    try {
        const { id } = req.params;

        // Validate ID format
        if (!id || isNaN(parseInt(id))) {
            return res.status(400).json({
                success: false,
                error: 'Invalid profile ID format'
            });
        }

        const profile = await PlantProfile.findById(parseInt(id));

        if (!profile) {
            return res.status(404).json({
                success: false,
                error: 'Plant profile not found'
            });
        }

        await SystemLog.info('PlantProfileController', 'getPlantProfileById', 
            `Retrieved plant profile: ${profile.species_name}`);

        res.json({
            success: true,
            data: profile.toJSON()
        });

    } catch (error) {
        await SystemLog.error('PlantProfileController', 'getPlantProfileById', error.message);
        res.status(500).json({
            success: false,
            error: 'Failed to retrieve plant profile'
        });
    }
};

/**
 * GET /api/plant-profiles/species/:name
 * Get a plant profile by species name
 */
const getPlantProfileBySpecies = async (req, res) => {
    try {
        const { name } = req.params;

        if (!name || name.trim().length === 0) {
            return res.status(400).json({
                success: false,
                error: 'Species name is required'
            });
        }

        const profile = await PlantProfile.findBySpeciesName(name.trim());

        if (!profile) {
            return res.status(404).json({
                success: false,
                error: 'Plant species not found'
            });
        }

        await SystemLog.info('PlantProfileController', 'getPlantProfileBySpecies', 
            `Retrieved plant profile for species: ${name}`);

        res.json({
            success: true,
            data: profile.toJSON()
        });

    } catch (error) {
        await SystemLog.error('PlantProfileController', 'getPlantProfileBySpecies', error.message);
        res.status(500).json({
            success: false,
            error: 'Failed to retrieve plant profile'
        });
    }
};

/**
 * POST /api/plant-profiles
 * Create a new plant profile (Admin only)
 */
const createPlantProfile = async (req, res) => {
    try {
        // Check if user is admin
        if (req.user.role !== 'Admin') {
            return res.status(403).json({
                success: false,
                error: 'Access denied. Admin privileges required.'
            });
        }

        const { species_name, description, ideal_moisture } = req.body;

        // Validate required fields
        if (!species_name || species_name.trim().length === 0) {
            return res.status(400).json({
                success: false,
                error: 'Species name is required'
            });
        }

        // Validate moisture range
        if (ideal_moisture !== null && ideal_moisture !== undefined) {
            const moisture = parseInt(ideal_moisture);
            if (isNaN(moisture) || moisture < 0 || moisture > 100) {
                return res.status(400).json({
                    success: false,
                    error: 'Ideal moisture must be between 0 and 100 percent'
                });
            }
        }

        // Check if species already exists
        const existing = await PlantProfile.findBySpeciesName(species_name.trim());
        if (existing) {
            return res.status(409).json({
                success: false,
                error: 'A plant profile with this species name already exists'
            });
        }

        // Create new plant profile
        const plantProfile = new PlantProfile({
            species_name: species_name.trim(),
            description: description ? description.trim() : null,
            ideal_moisture: ideal_moisture ? parseInt(ideal_moisture) : null
        });

        const savedProfile = await plantProfile.save();

        await SystemLog.info('PlantProfileController', 'createPlantProfile', 
            `Created plant profile: ${savedProfile.species_name} by admin ${req.user.email}`);

        res.status(201).json({
            success: true,
            message: 'Plant profile created successfully',
            data: savedProfile.toJSON()
        });

    } catch (error) {
        await SystemLog.error('PlantProfileController', 'createPlantProfile', error.message);
        res.status(500).json({
            success: false,
            error: 'Failed to create plant profile'
        });
    }
};

/**
 * PUT /api/plant-profiles/:id
 * Update an existing plant profile (Admin only)
 */
const updatePlantProfile = async (req, res) => {
    try {
        // Check if user is admin
        if (req.user.role !== 'Admin') {
            return res.status(403).json({
                success: false,
                error: 'Access denied. Admin privileges required.'
            });
        }

        const { id } = req.params;
        const { species_name, description, ideal_moisture } = req.body;

        // Validate ID format
        if (!id || isNaN(parseInt(id))) {
            return res.status(400).json({
                success: false,
                error: 'Invalid profile ID format'
            });
        }

        // Find existing profile
        const profile = await PlantProfile.findById(parseInt(id));
        if (!profile) {
            return res.status(404).json({
                success: false,
                error: 'Plant profile not found'
            });
        }

        // Validate species name if provided
        if (species_name !== undefined) {
            if (!species_name || species_name.trim().length === 0) {
                return res.status(400).json({
                    success: false,
                    error: 'Species name cannot be empty'
                });
            }

            // Check if new species name conflicts with existing (excluding current profile)
            const existing = await PlantProfile.findBySpeciesName(species_name.trim());
            if (existing && existing.profile_id !== profile.profile_id) {
                return res.status(409).json({
                    success: false,
                    error: 'A plant profile with this species name already exists'
                });
            }
        }

        // Validate moisture range if provided
        if (ideal_moisture !== null && ideal_moisture !== undefined) {
            const moisture = parseInt(ideal_moisture);
            if (isNaN(moisture) || moisture < 0 || moisture > 100) {
                return res.status(400).json({
                    success: false,
                    error: 'Ideal moisture must be between 0 and 100 percent'
                });
            }
        }

        // Update profile fields
        if (species_name !== undefined) profile.species_name = species_name.trim();
        if (description !== undefined) profile.description = description ? description.trim() : null;
        if (ideal_moisture !== undefined) profile.ideal_moisture = ideal_moisture ? parseInt(ideal_moisture) : null;

        const updatedProfile = await profile.save();

        await SystemLog.info('PlantProfileController', 'updatePlantProfile', 
            `Updated plant profile ID ${id}: ${updatedProfile.species_name} by admin ${req.user.email}`);

        res.json({
            success: true,
            message: 'Plant profile updated successfully',
            data: updatedProfile.toJSON()
        });

    } catch (error) {
        await SystemLog.error('PlantProfileController', 'updatePlantProfile', error.message);
        res.status(500).json({
            success: false,
            error: 'Failed to update plant profile'
        });
    }
};

/**
 * DELETE /api/plant-profiles/:id
 * Delete a plant profile (Admin only)
 */
const deletePlantProfile = async (req, res) => {
    try {
        // Check if user is admin
        if (req.user.role !== 'Admin') {
            return res.status(403).json({
                success: false,
                error: 'Access denied. Admin privileges required.'
            });
        }

        const { id } = req.params;

        // Validate ID format
        if (!id || isNaN(parseInt(id))) {
            return res.status(400).json({
                success: false,
                error: 'Invalid profile ID format'
            });
        }

        // Find existing profile
        const profile = await PlantProfile.findById(parseInt(id));
        if (!profile) {
            return res.status(404).json({
                success: false,
                error: 'Plant profile not found'
            });
        }

        // Check if profile is being used by any plants
        const { pool } = require('../config/db');
        const usageCheck = await pool.query(
            'SELECT COUNT(*) as count FROM Plants WHERE species_name = $1',
            [profile.species_name]
        );

        if (parseInt(usageCheck.rows[0].count) > 0) {
            return res.status(409).json({
                success: false,
                error: 'Cannot delete plant profile: it is currently being used by existing plants'
            });
        }

        await profile.delete();

        await SystemLog.info('PlantProfileController', 'deletePlantProfile', 
            `Deleted plant profile ID ${id}: ${profile.species_name} by admin ${req.user.email}`);

        res.json({
            success: true,
            message: 'Plant profile deleted successfully'
        });

    } catch (error) {
        await SystemLog.error('PlantProfileController', 'deletePlantProfile', error.message);
        res.status(500).json({
            success: false,
            error: 'Failed to delete plant profile'
        });
    }
};

/**
 * GET /api/plant-profiles/search/suggest
 * Get species name suggestions for autocomplete
 */
const getSpeciesSuggestions = async (req, res) => {
    try {
        const { q = '', limit = 10 } = req.query;

        if (q.trim().length < 2) {
            return res.json({
                success: true,
                data: []
            });
        }

        const limitNum = Math.min(50, Math.max(1, parseInt(limit)));
        const searchTerm = q.trim();

        const { pool } = require('../config/db');
        const result = await pool.query(`
            SELECT 
                profile_id, 
                species_name, 
                description,
                ideal_moisture
            FROM Plant_Profiles
            WHERE 
                LOWER(species_name) LIKE LOWER($1)
                OR LOWER(description) LIKE LOWER($1)
            ORDER BY 
                -- Prioritize exact starts with match
                CASE WHEN LOWER(species_name) LIKE LOWER($2) THEN 1 ELSE 2 END,
                -- Then prioritize by name length (shorter/simpler names first)
                LENGTH(species_name),
                species_name ASC
            LIMIT $3
        `, [`%${searchTerm}%`, `${searchTerm}%`, limitNum]);

        const suggestions = result.rows.map(row => ({
            profile_id: row.profile_id,
            species_name: row.species_name,
            description: row.description,
            ideal_moisture: row.ideal_moisture
        }));

        await SystemLog.info('PlantProfileController', 'getSpeciesSuggestions', 
            `Returned ${suggestions.length} suggestions for query: "${searchTerm}"`);

        res.json({
            success: true,
            data: suggestions
        });

    } catch (error) {
        await SystemLog.error('PlantProfileController', 'getSpeciesSuggestions', error.message);
        res.status(500).json({
            success: false,
            error: 'Failed to get species suggestions'
        });
    }
};

/**
 * GET /api/plant-profiles/stats
 * Get database statistics for plant profiles
 */
const getPlantProfileStats = async (req, res) => {
    try {
        const { pool } = require('../config/db');
        
        // Get basic stats
        const statsResult = await pool.query(`
            SELECT 
                COUNT(*) as total_profiles,
                COUNT(CASE WHEN ideal_moisture IS NOT NULL THEN 1 END) as profiles_with_moisture,
                AVG(ideal_moisture) as avg_moisture,
                MIN(ideal_moisture) as min_moisture,
                MAX(ideal_moisture) as max_moisture
            FROM Plant_Profiles
        `);

        // Get moisture distribution
        const distributionResult = await pool.query(`
            SELECT 
                CASE 
                    WHEN ideal_moisture IS NULL THEN 'Unknown'
                    WHEN ideal_moisture <= 25 THEN 'Very Low (≤25%)'
                    WHEN ideal_moisture <= 50 THEN 'Low (26-50%)'
                    WHEN ideal_moisture <= 75 THEN 'Medium (51-75%)'
                    ELSE 'High (>75%)'
                END as moisture_category,
                COUNT(*) as count
            FROM Plant_Profiles
            GROUP BY moisture_category
            ORDER BY 
                CASE 
                    WHEN ideal_moisture IS NULL THEN 0
                    ELSE MIN(ideal_moisture)
                END
        `);

        const stats = statsResult.rows[0];
        
        res.json({
            success: true,
            data: {
                total_profiles: parseInt(stats.total_profiles),
                profiles_with_moisture: parseInt(stats.profiles_with_moisture),
                average_moisture: stats.avg_moisture ? Math.round(parseFloat(stats.avg_moisture) * 10) / 10 : null,
                moisture_range: {
                    min: stats.min_moisture ? parseInt(stats.min_moisture) : null,
                    max: stats.max_moisture ? parseInt(stats.max_moisture) : null
                },
                distribution: distributionResult.rows.map(row => ({
                    category: row.moisture_category,
                    count: parseInt(row.count)
                }))
            }
        });

    } catch (error) {
        await SystemLog.error('PlantProfileController', 'getPlantProfileStats', error.message);
        res.status(500).json({
            success: false,
            error: 'Failed to get plant profile statistics'
        });
    }
};

module.exports = {
    getAllPlantProfiles,
    getPlantProfileById,
    getPlantProfileBySpecies,
    createPlantProfile,
    updatePlantProfile,
    deletePlantProfile,
    getSpeciesSuggestions,
    getPlantProfileStats
};
/**
 * ============================================================================
 * ZONE MODEL - PLANT ORGANIZATION & GROUPING
 * ============================================================================
 * 
 * Manages user-defined zones for organizing plants by location or category.
 * Replaces the deprecated location field in plants with flexible zone system.
 * 
 * FEATURES:
 * - Create custom zones (Living Room, Garden, etc.)
 * - Assign plants to zones for better organization
 * - Premium/Ultimate feature for advanced plant management
 * - Hierarchical zone structure support
 * 
 * RELATIONSHIPS:
 * - Zone belongs to User (user_id FK)
 * - Zone can contain multiple Plants (plant_id FK)
 * - Plants can be assigned to one Zone (zone_id FK)
 */

const { pool } = require('../config/db');
const { generateUUID, isValidUUID } = require('../utils/uuidGenerator');

class Zone {
    constructor(data = {}) {
        this.zone_id = data.zone_id || null;
        this.zone_name = data.zone_name || '';
        this.user_id = data.user_id || null;
        this.plant_id = data.plant_id || null;
        this.description = data.description || null;
        this.created_at = data.created_at || new Date();
    }

    /**
     * CREATE NEW ZONE
     * Creates a new zone for organizing plants
     */
    static async create(zoneData) {
        try {
            const { user_id, zone_name, description } = zoneData;

            // Validate required fields
            if (!user_id || !zone_name) {
                throw new Error('User ID and zone name are required');
            }

            // Validate UUID
            if (!isValidUUID(user_id)) {
                throw new Error('Invalid user_id UUID');
            }

            const query = `
                INSERT INTO zones (user_id, zone_name, description, created_at)
                VALUES ($1, $2, $3, $4)
                RETURNING zone_id, user_id, zone_name, description, created_at
            `;

            const values = [
                user_id,
                zone_name.trim(),
                description ? description.trim() : null,
                new Date()
            ];

            const result = await pool.query(query, values);
            return new Zone(result.rows[0]);

        } catch (error) {
            console.error('[ZONE ERROR] Error creating zone:', error.message);
            throw error;
        }
    }

    /**
     * GET ALL ZONES FOR USER
     * Retrieves all zones created by a specific user
     */
    static async findByUserId(userId) {
        try {
            if (!isValidUUID(userId)) {
                throw new Error('Invalid user_id UUID');
            }

            const query = `
                SELECT z.*, COUNT(p.plant_id) as plant_count
                FROM zones z
                LEFT JOIN plants p ON p.zone_id = z.zone_id
                WHERE z.user_id = $1
                GROUP BY z.zone_id, z.zone_name, z.user_id, z.description, z.created_at
                ORDER BY z.created_at DESC
            `;

            const result = await pool.query(query, [userId]);
            return result.rows.map(row => new Zone(row));

        } catch (error) {
            console.error('[ZONE ERROR] Error finding zones by user ID:', error.message);
            throw error;
        }
    }

    /**
     * GET ZONE BY ID
     * Retrieves a specific zone by its ID
     */
    static async findById(zoneId) {
        try {
            const query = `
                SELECT z.*, COUNT(p.plant_id) as plant_count
                FROM zones z
                LEFT JOIN plants p ON p.zone_id = z.zone_id
                WHERE z.zone_id = $1
                GROUP BY z.zone_id, z.zone_name, z.user_id, z.description, z.created_at
            `;

            const result = await pool.query(query, [zoneId]);
            return result.rows.length > 0 ? new Zone(result.rows[0]) : null;

        } catch (error) {
            console.error('[ZONE ERROR] Error finding zone by ID:', error.message);
            throw error;
        }
    }

    /**
     * UPDATE ZONE
     * Updates zone information
     */
    static async update(zoneId, updateData) {
        try {
            const { zone_name, description } = updateData;
            
            const query = `
                UPDATE zones 
                SET zone_name = COALESCE($2, zone_name),
                    description = COALESCE($3, description)
                WHERE zone_id = $1
                RETURNING *
            `;

            const values = [
                zoneId,
                zone_name ? zone_name.trim() : null,
                description ? description.trim() : null
            ];

            const result = await pool.query(query, values);
            return result.rows.length > 0 ? new Zone(result.rows[0]) : null;

        } catch (error) {
            console.error('[ZONE ERROR] Error updating zone:', error.message);
            throw error;
        }
    }

    /**
     * DELETE ZONE
     * Removes a zone (plants will have zone_id set to NULL)
     */
    static async delete(zoneId, userId) {
        try {
            // First, unassign all plants from this zone
            await pool.query(`
                UPDATE plants 
                SET zone_id = NULL 
                WHERE zone_id = $1
            `, [zoneId]);

            // Then delete the zone
            const query = `
                DELETE FROM zones 
                WHERE zone_id = $1 AND user_id = $2
                RETURNING *
            `;

            const result = await pool.query(query, [zoneId, userId]);
            return result.rows.length > 0;

        } catch (error) {
            console.error('[ZONE ERROR] Error deleting zone:', error.message);
            throw error;
        }
    }

    /**
     * ASSIGN PLANT TO ZONE
     * Links a plant to a specific zone
     */
    static async assignPlant(zoneId, plantId) {
        try {
            const query = `
                UPDATE plants 
                SET zone_id = $1
                WHERE plant_id = $2
                RETURNING *
            `;

            const result = await pool.query(query, [zoneId, plantId]);
            return result.rows.length > 0;

        } catch (error) {
            console.error('[ZONE ERROR] Error assigning plant to zone:', error.message);
            throw error;
        }
    }

    /**
     * GET PLANTS IN ZONE
     * Retrieves all plants assigned to a specific zone
     */
    static async getPlantsInZone(zoneId) {
        try {
            const query = `
                SELECT p.*, pp.species_name
                FROM plants p
                LEFT JOIN plant_profiles pp ON p.profile_id = pp.profile_id
                WHERE p.zone_id = $1
                ORDER BY p.created_at DESC
            `;

            const result = await pool.query(query, [zoneId]);
            return result.rows;

        } catch (error) {
            console.error('[ZONE ERROR] Error getting plants in zone:', error.message);
            throw error;
        }
    }

    /**
     * CONVERT TO JSON
     * Returns zone data in JSON format for API responses
     */
    toJSON() {
        return {
            zone_id: this.zone_id,
            zone_name: this.zone_name,
            user_id: this.user_id,
            plant_id: this.plant_id,
            description: this.description,
            plant_count: this.plant_count || 0,
            created_at: this.created_at
        };
    }
}

module.exports = Zone;
const { Pool } = require('pg');
const pool = require('../config/db').pool;

class ImageAnalysis {
    constructor(data = {}) {
        this.analysis_id = data.analysis_id || null;
        this.user_id = data.user_id || null;
        this.plant_id = data.plant_id || null;
        this.image_path = data.image_path || null;
        this.original_filename = data.original_filename || null;
        this.analysis_result = data.analysis_result || {};
        this.disease_detected = data.disease_detected || null;
        this.confidence_score = data.confidence_score || null;
        this.treatment_suggestions = data.treatment_suggestions || [];
        this.created_at = data.created_at || null;
        this.updated_at = data.updated_at || null;
    }

    /**
     * Save image analysis to database
     * @returns {Promise<ImageAnalysis>} Saved image analysis instance
     */
    async save() {
        try {
            if (this.analysis_id) {
                // Update existing record
                const query = `
                    UPDATE image_analysis 
                    SET user_id = $1, plant_id = $2, image_path = $3, original_filename = $4,
                        analysis_result = $5, disease_detected = $6, confidence_score = $7,
                        treatment_suggestions = $8, updated_at = CURRENT_TIMESTAMP
                    WHERE analysis_id = $9
                    RETURNING *
                `;
                const values = [
                    this.user_id, this.plant_id, this.image_path, this.original_filename,
                    JSON.stringify(this.analysis_result), this.disease_detected, 
                    this.confidence_score, this.treatment_suggestions, this.analysis_id
                ];
                
                const result = await pool.query(query, values);
                const updatedData = result.rows[0];
                
                // Update instance properties
                Object.assign(this, updatedData);
                if (typeof this.analysis_result === 'string') {
                    this.analysis_result = JSON.parse(this.analysis_result);
                }
                
                return this;
            } else {
                // Create new record
                const query = `
                    INSERT INTO image_analysis (user_id, plant_id, image_path, original_filename,
                                              analysis_result, disease_detected, confidence_score, treatment_suggestions)
                    VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
                    RETURNING *
                `;
                const values = [
                    this.user_id, this.plant_id, this.image_path, this.original_filename,
                    JSON.stringify(this.analysis_result), this.disease_detected,
                    this.confidence_score, this.treatment_suggestions
                ];
                
                const result = await pool.query(query, values);
                const newData = result.rows[0];
                
                // Update instance properties
                Object.assign(this, newData);
                if (typeof this.analysis_result === 'string') {
                    this.analysis_result = JSON.parse(this.analysis_result);
                }
                
                return this;
            }
        } catch (error) {
            console.error('Error saving image analysis:', error);
            throw error;
        }
    }

    /**
     * Find image analysis by ID
     * @param {number} analysisId - Analysis ID
     * @returns {Promise<ImageAnalysis|null>} Image analysis instance or null
     */
    static async findById(analysisId) {
        try {
            const query = 'SELECT * FROM image_analysis WHERE analysis_id = $1';
            const result = await pool.query(query, [analysisId]);
            
            if (result.rows.length === 0) {
                return null;
            }
            
            const data = result.rows[0];
            if (typeof data.analysis_result === 'string') {
                data.analysis_result = JSON.parse(data.analysis_result);
            }
            
            return new ImageAnalysis(data);
        } catch (error) {
            console.error('Error finding image analysis by ID:', error);
            throw error;
        }
    }

    /**
     * Find all image analyses for a user
     * @param {number} userId - User ID
     * @param {Object} options - Query options (limit, offset, orderBy)
     * @returns {Promise<Array<ImageAnalysis>>} Array of image analysis instances
     */
    static async findByUserId(userId, options = {}) {
        try {
            const limit = options.limit || 50;
            const offset = options.offset || 0;
            const orderBy = options.orderBy || 'created_at DESC';
            
            const query = `
                SELECT * FROM image_analysis 
                WHERE user_id = $1 
                ORDER BY ${orderBy}
                LIMIT $2 OFFSET $3
            `;
            const result = await pool.query(query, [userId, limit, offset]);
            
            return result.rows.map(row => {
                if (typeof row.analysis_result === 'string') {
                    row.analysis_result = JSON.parse(row.analysis_result);
                }
                return new ImageAnalysis(row);
            });
        } catch (error) {
            console.error('Error finding image analyses by user ID:', error);
            throw error;
        }
    }

    /**
     * Find all image analyses for a plant
     * @param {number} plantId - Plant ID
     * @param {Object} options - Query options (limit, offset, orderBy)
     * @returns {Promise<Array<ImageAnalysis>>} Array of image analysis instances
     */
    static async findByPlantId(plantId, options = {}) {
        try {
            const limit = options.limit || 50;
            const offset = options.offset || 0;
            const orderBy = options.orderBy || 'created_at DESC';
            
            const query = `
                SELECT * FROM image_analysis 
                WHERE plant_id = $1 
                ORDER BY ${orderBy}
                LIMIT $2 OFFSET $3
            `;
            const result = await pool.query(query, [plantId, limit, offset]);
            
            return result.rows.map(row => {
                if (typeof row.analysis_result === 'string') {
                    row.analysis_result = JSON.parse(row.analysis_result);
                }
                return new ImageAnalysis(row);
            });
        } catch (error) {
            console.error('Error finding image analyses by plant ID:', error);
            throw error;
        }
    }

    /**
     * Create a new image analysis record
     * @param {Object} analysisData - Analysis data
     * @returns {Promise<ImageAnalysis>} Created image analysis instance
     */
    static async create(analysisData) {
        try {
            const imageAnalysis = new ImageAnalysis(analysisData);
            return await imageAnalysis.save();
        } catch (error) {
            console.error('Error creating image analysis:', error);
            throw error;
        }
    }

    /**
     * Delete image analysis by ID
     * @param {number} analysisId - Analysis ID
     * @returns {Promise<boolean>} True if deleted successfully
     */
    static async deleteById(analysisId) {
        try {
            const query = 'DELETE FROM image_analysis WHERE analysis_id = $1';
            const result = await pool.query(query, [analysisId]);
            return result.rowCount > 0;
        } catch (error) {
            console.error('Error deleting image analysis:', error);
            throw error;
        }
    }

    /**
     * Get analysis statistics for a user
     * @param {number} userId - User ID
     * @returns {Promise<Object>} Analysis statistics
     */
    static async getStatsByUserId(userId) {
        try {
            const query = `
                SELECT 
                    COUNT(*) as total_analyses,
                    COUNT(CASE WHEN disease_detected != 'Healthy' AND disease_detected IS NOT NULL THEN 1 END) as diseases_detected,
                    COUNT(CASE WHEN disease_detected = 'Healthy' OR disease_detected IS NULL THEN 1 END) as healthy_plants,
                    AVG(confidence_score) as avg_confidence,
                    MAX(created_at) as last_analysis
                FROM image_analysis 
                WHERE user_id = $1
            `;
            const result = await pool.query(query, [userId]);
            
            const stats = result.rows[0];
            return {
                totalAnalyses: parseInt(stats.total_analyses) || 0,
                diseasesDetected: parseInt(stats.diseases_detected) || 0,
                healthyPlants: parseInt(stats.healthy_plants) || 0,
                avgConfidence: parseFloat(stats.avg_confidence) || 0,
                lastAnalysis: stats.last_analysis
            };
        } catch (error) {
            console.error('Error getting analysis statistics:', error);
            throw error;
        }
    }

    /**
     * Get recent analyses with disease detection
     * @param {number} userId - User ID
     * @param {number} limit - Number of results to return
     * @returns {Promise<Array<ImageAnalysis>>} Recent analyses with diseases
     */
    static async getRecentDiseases(userId, limit = 10) {
        try {
            const query = `
                SELECT * FROM image_analysis 
                WHERE user_id = $1 
                AND disease_detected IS NOT NULL 
                AND disease_detected != 'Healthy'
                ORDER BY created_at DESC
                LIMIT $2
            `;
            const result = await pool.query(query, [userId, limit]);
            
            return result.rows.map(row => {
                if (typeof row.analysis_result === 'string') {
                    row.analysis_result = JSON.parse(row.analysis_result);
                }
                return new ImageAnalysis(row);
            });
        } catch (error) {
            console.error('Error getting recent diseases:', error);
            throw error;
        }
    }

    /**
     * Search image analyses by disease name
     * @param {number} userId - User ID
     * @param {string} diseaseQuery - Disease search query
     * @param {Object} options - Query options
     * @returns {Promise<Array<ImageAnalysis>>} Matching analyses
     */
    static async searchByDisease(userId, diseaseQuery, options = {}) {
        try {
            const limit = options.limit || 20;
            const offset = options.offset || 0;
            
            const query = `
                SELECT * FROM image_analysis 
                WHERE user_id = $1 
                AND disease_detected ILIKE $2
                ORDER BY created_at DESC
                LIMIT $3 OFFSET $4
            `;
            const result = await pool.query(query, [userId, `%${diseaseQuery}%`, limit, offset]);
            
            return result.rows.map(row => {
                if (typeof row.analysis_result === 'string') {
                    row.analysis_result = JSON.parse(row.analysis_result);
                }
                return new ImageAnalysis(row);
            });
        } catch (error) {
            console.error('Error searching analyses by disease:', error);
            throw error;
        }
    }

    /**
     * Delete this image analysis instance
     * @returns {Promise<boolean>} True if deleted successfully
     */
    async delete() {
        if (!this.analysis_id) {
            throw new Error('Cannot delete image analysis without ID');
        }
        return await ImageAnalysis.deleteById(this.analysis_id);
    }

    /**
     * Convert to JSON representation
     * @returns {Object} JSON representation
     */
    toJSON() {
        return {
            analysis_id: this.analysis_id,
            user_id: this.user_id,
            plant_id: this.plant_id,
            image_path: this.image_path,
            original_filename: this.original_filename,
            analysis_result: this.analysis_result,
            disease_detected: this.disease_detected,
            confidence_score: this.confidence_score,
            treatment_suggestions: this.treatment_suggestions,
            created_at: this.created_at,
            updated_at: this.updated_at
        };
    }
}

module.exports = ImageAnalysis;
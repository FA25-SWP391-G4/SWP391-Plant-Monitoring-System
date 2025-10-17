const { Pool } = require('pg');
const pool = require('../config/db').pool;

class AIPrediction {
    constructor(data = {}) {
        this.prediction_id = data.prediction_id;
        this.plant_id = data.plant_id;
        this.prediction_type = data.prediction_type;
        this.input_data = data.input_data;
        this.prediction_result = data.prediction_result;
        this.confidence_score = data.confidence_score;
        this.model_version = data.model_version;
        this.created_at = data.created_at;
    }

    /**
     * Save prediction to database
     */
    async save() {
        try {
            const query = `
                INSERT INTO ai_predictions (plant_id, prediction_type, input_data, prediction_result, confidence_score, model_version)
                VALUES ($1, $2, $3, $4, $5, $6)
                RETURNING *
            `;
            
            const values = [
                this.plant_id,
                this.prediction_type,
                JSON.stringify(this.input_data),
                JSON.stringify(this.prediction_result),
                this.confidence_score,
                this.model_version
            ];

            const result = await pool.query(query, values);
            const savedPrediction = result.rows[0];
            
            // Update this instance with saved data
            Object.assign(this, savedPrediction);
            
            return this;
        } catch (error) {
            console.error('Error saving AI prediction:', error);
            throw error;
        }
    }

    /**
     * Find prediction by ID
     */
    static async findById(predictionId) {
        try {
            const query = 'SELECT * FROM ai_predictions WHERE prediction_id = $1';
            const result = await pool.query(query, [predictionId]);
            
            if (result.rows.length === 0) {
                return null;
            }
            
            return new AIPrediction(result.rows[0]);
        } catch (error) {
            console.error('Error finding AI prediction by ID:', error);
            throw error;
        }
    }

    /**
     * Find predictions by plant ID
     */
    static async findByPlantId(plantId, limit = 10, offset = 0) {
        try {
            const query = `
                SELECT * FROM ai_predictions 
                WHERE plant_id = $1 
                ORDER BY created_at DESC 
                LIMIT $2 OFFSET $3
            `;
            const result = await pool.query(query, [plantId, limit, offset]);
            
            return result.rows.map(row => new AIPrediction(row));
        } catch (error) {
            console.error('Error finding AI predictions by plant ID:', error);
            throw error;
        }
    }

    /**
     * Find predictions by type
     */
    static async findByType(predictionType, limit = 10, offset = 0) {
        try {
            const query = `
                SELECT * FROM ai_predictions 
                WHERE prediction_type = $1 
                ORDER BY created_at DESC 
                LIMIT $2 OFFSET $3
            `;
            const result = await pool.query(query, [predictionType, limit, offset]);
            
            return result.rows.map(row => new AIPrediction(row));
        } catch (error) {
            console.error('Error finding AI predictions by type:', error);
            throw error;
        }
    }

    /**
     * Find predictions by plant ID and type
     */
    static async findByPlantIdAndType(plantId, predictionType, limit = 10, offset = 0) {
        try {
            const query = `
                SELECT * FROM ai_predictions 
                WHERE plant_id = $1 AND prediction_type = $2 
                ORDER BY created_at DESC 
                LIMIT $3 OFFSET $4
            `;
            const result = await pool.query(query, [plantId, predictionType, limit, offset]);
            
            return result.rows.map(row => new AIPrediction(row));
        } catch (error) {
            console.error('Error finding AI predictions by plant ID and type:', error);
            throw error;
        }
    }

    /**
     * Get latest prediction for a plant and type
     */
    static async getLatestPrediction(plantId, predictionType) {
        try {
            const query = `
                SELECT * FROM ai_predictions 
                WHERE plant_id = $1 AND prediction_type = $2 
                ORDER BY created_at DESC 
                LIMIT 1
            `;
            const result = await pool.query(query, [plantId, predictionType]);
            
            if (result.rows.length === 0) {
                return null;
            }
            
            return new AIPrediction(result.rows[0]);
        } catch (error) {
            console.error('Error getting latest AI prediction:', error);
            throw error;
        }
    }

    /**
     * Get predictions within date range
     */
    static async findByDateRange(startDate, endDate, plantId = null, predictionType = null) {
        try {
            let query = `
                SELECT * FROM ai_predictions 
                WHERE created_at >= $1 AND created_at <= $2
            `;
            const values = [startDate, endDate];
            let paramCount = 2;

            if (plantId) {
                paramCount++;
                query += ` AND plant_id = $${paramCount}`;
                values.push(plantId);
            }

            if (predictionType) {
                paramCount++;
                query += ` AND prediction_type = $${paramCount}`;
                values.push(predictionType);
            }

            query += ' ORDER BY created_at DESC';

            const result = await pool.query(query, values);
            return result.rows.map(row => new AIPrediction(row));
        } catch (error) {
            console.error('Error finding AI predictions by date range:', error);
            throw error;
        }
    }

    /**
     * Get prediction statistics
     */
    static async getStatistics(plantId = null, predictionType = null, days = 30) {
        try {
            const startDate = new Date();
            startDate.setDate(startDate.getDate() - days);

            let query = `
                SELECT 
                    prediction_type,
                    COUNT(*) as total_predictions,
                    AVG(confidence_score) as avg_confidence,
                    MIN(confidence_score) as min_confidence,
                    MAX(confidence_score) as max_confidence,
                    COUNT(DISTINCT plant_id) as unique_plants
                FROM ai_predictions 
                WHERE created_at >= $1
            `;
            const values = [startDate];
            let paramCount = 1;

            if (plantId) {
                paramCount++;
                query += ` AND plant_id = $${paramCount}`;
                values.push(plantId);
            }

            if (predictionType) {
                paramCount++;
                query += ` AND prediction_type = $${paramCount}`;
                values.push(predictionType);
            }

            query += ' GROUP BY prediction_type ORDER BY total_predictions DESC';

            const result = await pool.query(query, values);
            return result.rows;
        } catch (error) {
            console.error('Error getting AI prediction statistics:', error);
            throw error;
        }
    }

    /**
     * Delete prediction by ID
     */
    static async deleteById(predictionId) {
        try {
            const query = 'DELETE FROM ai_predictions WHERE prediction_id = $1 RETURNING *';
            const result = await pool.query(query, [predictionId]);
            
            return result.rows.length > 0;
        } catch (error) {
            console.error('Error deleting AI prediction:', error);
            throw error;
        }
    }

    /**
     * Delete old predictions (cleanup)
     */
    static async deleteOldPredictions(daysOld = 90) {
        try {
            const cutoffDate = new Date();
            cutoffDate.setDate(cutoffDate.getDate() - daysOld);

            const query = 'DELETE FROM ai_predictions WHERE created_at < $1';
            const result = await pool.query(query, [cutoffDate]);
            
            return result.rowCount;
        } catch (error) {
            console.error('Error deleting old AI predictions:', error);
            throw error;
        }
    }

    /**
     * Create a new watering prediction
     */
    static async createWateringPrediction(plantId, sensorData, predictionResult, confidence, modelVersion) {
        const prediction = new AIPrediction({
            plant_id: plantId,
            prediction_type: 'watering',
            input_data: sensorData,
            prediction_result: predictionResult,
            confidence_score: confidence,
            model_version: modelVersion
        });

        return await prediction.save();
    }

    /**
     * Create a new disease prediction
     */
    static async createDiseasePrediction(plantId, imageData, predictionResult, confidence, modelVersion) {
        const prediction = new AIPrediction({
            plant_id: plantId,
            prediction_type: 'disease',
            input_data: imageData,
            prediction_result: predictionResult,
            confidence_score: confidence,
            model_version: modelVersion
        });

        return await prediction.save();
    }

    /**
     * Create a new health assessment prediction
     */
    static async createHealthPrediction(plantId, inputData, predictionResult, confidence, modelVersion) {
        const prediction = new AIPrediction({
            plant_id: plantId,
            prediction_type: 'health',
            input_data: inputData,
            prediction_result: predictionResult,
            confidence_score: confidence,
            model_version: modelVersion
        });

        return await prediction.save();
    }

    /**
     * Convert to JSON (for API responses)
     */
    toJSON() {
        return {
            prediction_id: this.prediction_id,
            plant_id: this.plant_id,
            prediction_type: this.prediction_type,
            input_data: this.input_data,
            prediction_result: this.prediction_result,
            confidence_score: this.confidence_score,
            model_version: this.model_version,
            created_at: this.created_at
        };
    }
}

module.exports = AIPrediction;
const { pool } = require('../config/db');
const { isValidUUID } = require('../utils/uuidGenerator');

class AIModel {
    constructor(modelData) {
        this.model_id = modelData.model_id;
        this.model_name = modelData.model_name;
        this.version = modelData.version;
        this.file_path = modelData.file_path;
        this.is_active = modelData.is_active;
        this.uploaded_by = modelData.uploaded_by;
        this.created_at = modelData.created_at;
    }

    // Static method to find all AI models
    static async findAll() {
        try {
            const query = `
                SELECT am.*, u.full_name as uploader_name 
                FROM ai_models am
                LEFT JOIN users u ON am.uploaded_by = u.user_id
                ORDER BY am.created_at DESC
            `;
            const result = await pool.query(query);
            return result.rows.map(row => new AIModel(row));
        } catch (error) {
            throw error;
        }
    }

    // Static method to find AI model by ID
    static async findById(id) {
        try {
            const query = `
                SELECT am.*, u.full_name as uploader_name 
                FROM ai_models am
                LEFT JOIN users u ON am.uploaded_by = u.user_id
                WHERE am.model_id = $1
            `;
            const result = await pool.query(query, [id]);
            
            if (result.rows.length === 0) {
                return null;
            }
            
            return new AIModel(result.rows[0]);
        } catch (error) {
            throw error;
        }
    }

    // Static method to find active AI model
    static async findActive() {
        try {
            const query = `
                SELECT am.*, u.full_name as uploader_name 
                FROM ai_models am
                LEFT JOIN users u ON am.uploaded_by = u.user_id
                WHERE am.is_active = true
                LIMIT 1
            `;
            const result = await pool.query(query);
            
            if (result.rows.length === 0) {
                return null;
            }
            
            return new AIModel(result.rows[0]);
        } catch (error) {
            throw error;
        }
    }

    // Static method to find models by uploader
    static async findByUploader(uploaderId) {
        // Validate UUID
        if (!isValidUUID(uploaderId)) {
            console.error('[AI_MODEL] Invalid uploaded_by UUID:', uploaderId);
            return [];
        }

        try {
            const query = `
                SELECT am.*, u.full_name as uploader_name 
                FROM ai_models am
                LEFT JOIN users u ON am.uploaded_by = u.user_id
                WHERE am.uploaded_by = $1
                ORDER BY am.created_at DESC
            `;
            const result = await pool.query(query, [uploaderId]);
            return result.rows.map(row => new AIModel(row));
        } catch (error) {
            throw error;
        }
    }

    // Create or update AI model
    async save() {
        // Validate uploaded_by UUID if provided
        if (this.uploaded_by && !isValidUUID(this.uploaded_by)) {
            console.error('[AI_MODEL] Invalid uploaded_by UUID in save:', this.uploaded_by);
            throw new Error('Valid uploaded_by UUID is required');
        }

        try {
            if (this.model_id) {
                // Update existing model
                const query = `
                    UPDATE ai_models 
                    SET model_name = $1, version = $2, file_path = $3, 
                        is_active = $4, uploaded_by = $5
                    WHERE model_id = $6
                    RETURNING *
                `;
                
                const result = await pool.query(query, [
                    this.model_name,
                    this.version,
                    this.file_path,
                    this.is_active,
                    this.uploaded_by,
                    this.model_id
                ]);
                
                const updatedModel = new AIModel(result.rows[0]);
                Object.assign(this, updatedModel);
                return this;
            } else {
                // Create new model
                const query = `
                    INSERT INTO ai_models (model_name, version, file_path, is_active, uploaded_by)
                    VALUES ($1, $2, $3, $4, $5)
                    RETURNING *
                `;
                
                const result = await pool.query(query, [
                    this.model_name,
                    this.version,
                    this.file_path,
                    this.is_active || false,
                    this.uploaded_by
                ]);
                
                const newModel = new AIModel(result.rows[0]);
                Object.assign(this, newModel);
                return this;
            }
        } catch (error) {
            throw error;
        }
    }

    // Set as active model (deactivate others first)
    async setAsActive() {
        try {
            // Start transaction
            const client = await pool.connect();
            
            try {
                await client.query('BEGIN');
                
                // Deactivate all models
                await client.query('UPDATE ai_models SET is_active = false');
                
                // Activate this model
                const query = `
                    UPDATE ai_models 
                    SET is_active = true 
                    WHERE model_id = $1
                    RETURNING *
                `;
                const result = await client.query(query, [this.model_id]);
                
                await client.query('COMMIT');
                
                this.is_active = true;
                return this;
            } catch (error) {
                await client.query('ROLLBACK');
                throw error;
            } finally {
                client.release();
            }
        } catch (error) {
            throw error;
        }
    }

    // Delete AI model
    async delete() {
        try {
            if (!this.model_id) {
                throw new Error('Cannot delete model without ID');
            }

            const query = 'DELETE FROM ai_models WHERE model_id = $1';
            await pool.query(query, [this.model_id]);
            
            return true;
        } catch (error) {
            throw error;
        }
    }

    // Convert to JSON
    toJSON() {
        return {
            model_id: this.model_id,
            model_name: this.model_name,
            version: this.version,
            file_path: this.file_path,
            is_active: this.is_active,
            uploaded_by: this.uploaded_by,
            created_at: this.created_at
        };
    }
}

module.exports = AIModel;

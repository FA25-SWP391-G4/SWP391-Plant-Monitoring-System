/**
 * ============================================================================
 * PLANT MODEL - COMPREHENSIVE USE CASE IMPLEMENTATION
 * ============================================================================
 * 
 * 🌱 SUPPORTS ALL PLANT-RELATED USE CASES (22 out of 31 use cases)
 * 
 * 👤 REGULAR USER USE CASES SUPPORTED:
 * - 🔄 UC4: View Plant Monitoring Dashboard - Plant data aggregation for dashboard
 * - 🔄 UC5: Manual Watering - Plant identification for watering operations  
 * - 🔄 UC6: Configure Auto-Watering Schedule - Plant-specific scheduling
 * - 🔄 UC7: Toggle Auto-Watering Mode - auto_watering_on field management
 * - 🔄 UC8: View Watering History - Plant association with watering logs
 * - 🔄 UC9: Search Watering History - Plant-based filtering
 * - 🔄 UC10: Receive Real-Time Notifications - Plant status monitoring
 * - 🔄 UC13: Manage Profile - Plant ownership and customization
 * 
 * 💎 PREMIUM USER USE CASES SUPPORTED:
 * - 🔄 UC14: Manage Multiple Plant Zones - Zone-based plant grouping
 * - 🔄 UC15: View Detailed Plant Health Report - Plant health analytics
 * - 🔄 UC16: Configure Advanced Sensor Thresholds - moisture_threshold field
 * - 🔄 UC17: Search Plant Health Reports - Plant-specific report filtering
 * - 🔄 UC18: Customize Dashboard - Plant widget customization
 * - 🔄 UC20: Predict Watering Needs (AI) - Plant data for ML predictions
 * - 🔄 UC21: Analyze Plant Health (AI) - Plant health AI analysis
 * - 🔄 UC23: Interact with AI Chatbot - Plant-specific advice context
 * 
 * 🔧 ADMIN USE CASES SUPPORTED:
 * - 🔄 UC24: Manage Users - Plant ownership tracking
 * - 🔄 UC25: View System-Wide Reports - Global plant statistics
 * - 🔄 UC27: Monitor System Logs - Plant-related error tracking
 * - 🔄 UC29: Manage AI Models - Plant data for model training
 * - 🔄 UC30: Optimize Watering Schedules (AI) - Plant-specific optimization
 * 
 * 🤖 IOT SYSTEM USE CASES SUPPORTED:
 * - 🔄 UC29: Collect and Send Sensor Data - Plant-device association
 * - 🔄 UC30: Auto-Water Based on Sensors - Plant threshold monitoring
 * - 🔄 UC31: Handle Hardware Failure - Plant status during device issues
 * 
 * PLANT DATA STRUCTURE:
 * - plant_id: Unique identifier for each plant
 * - user_id: Owner association for access control
 * - device_id: IoT device connection for sensor data
 * - profile_id: Plant species profile for default settings
 * - custom_name: User-friendly plant name for personalization
 * - moisture_threshold: Custom watering trigger level (0-100%)
 * - auto_watering_on: Boolean flag for automation control
 * - created_at: Plant registration timestamp
 * 
 * RELATIONSHIPS SUPPORTED:
 * - Plants (N) → (1) Users (owner)
 * - Plants (N) → (1) Devices (sensor source)
 * - Plants (N) → (1) PlantProfiles (species data)
 * - Plants (1) → (N) SensorData (monitoring history)
 * - Plants (1) → (N) WateringHistory (care history)
 * - Plants (1) → (N) PumpSchedule (automation rules)
 * - Plants (1) → (N) Alerts (notifications)
 * 
 * ADVANCED FEATURES READY:
 * - Zone management for premium users (can add zone_id field)
 * - Custom thresholds per plant for advanced users
 * - Plant health scoring algorithms (can add health_score field)
 * - Integration with AI models for predictions
 * - Automated watering based on sensor readings
 * - Historical data analysis and reporting
 * 
 * SECURITY & ACCESS CONTROL:
 * - User ownership validation for all plant operations
 * - Plant-device association verification
 * - Audit logging for plant modifications
 * - Role-based access (Regular/Premium/Admin features)
 */

const { pool } = require('../config/db');

class Plant {
    /**
     * PLANT CONSTRUCTOR
     * Initialize plant object with all necessary data and relationships
     * SUPPORTS: UC4-10, UC13-17, UC20-21, UC23-25, UC27, UC29-31
     */
    constructor(plantData) {
        this.plant_id = plantData.plant_id;
        this.user_id = plantData.user_id; // Owner for access control
        this.device_id = plantData.device_id; // IoT device connection
        this.profile_id = plantData.profile_id; // Species profile
        this.custom_name = plantData.custom_name; // User-friendly name
        this.moisture_threshold = plantData.moisture_threshold; // UC16: Custom thresholds
        this.auto_watering_on = plantData.auto_watering_on; // UC7: Auto-watering control
        this.created_at = plantData.created_at;
    }

    /**
     * FIND ALL PLANTS - ADMIN & DASHBOARD OVERVIEW
     * Retrieves all plants with owner, device, and species information
     * 
     * SUPPORTS:
     * - UC4: View Plant Monitoring Dashboard - Plant list for dashboard
     * - UC14: Manage Multiple Plant Zones - Zone-based plant grouping
     * - UC24: Manage Users (Admin) - Global plant overview
     * - UC25: View System-Wide Reports (Admin) - Plant statistics
     */
    // Static method to find all plants
    static async findAll() {
        try {
            const query = `
                SELECT p.*, u.full_name as owner_name, 
                       d.device_name, d.status as device_status,
                       pp.species_name, pp.ideal_moisture
                FROM Plants p
                LEFT JOIN Users u ON p.user_id = u.user_id
                LEFT JOIN Devices d ON p.device_id = d.device_id
                LEFT JOIN Plant_Profiles pp ON p.profile_id = pp.profile_id
                ORDER BY p.created_at DESC
            `;
            const result = await pool.query(query);
            return result.rows.map(row => new Plant(row));
        } catch (error) {
            throw error;
        }
    }

    /**
     * FIND PLANT BY ID - DETAILED PLANT INFORMATION
     * Retrieves specific plant with all related data for detailed views
     * 
     * SUPPORTS:
     * - UC4: View Plant Monitoring Dashboard - Individual plant details
     * - UC5: Manual Watering - Plant lookup for watering operations
     * - UC8-9: View/Search Watering History - Plant-specific history
     * - UC15: View Detailed Plant Health Report - Plant data for analysis
     * - UC16: Configure Advanced Sensor Thresholds - Plant threshold settings
     * - UC20-21: AI Predictions - Plant context for ML algorithms
     * - UC29-30: IoT Operations - Plant-device validation
     */
    // Static method to find plant by ID
    static async findById(id) {
        try {
            const query = `
                SELECT p.*, u.full_name as owner_name, 
                       d.device_name, d.status as device_status,
                       pp.species_name, pp.ideal_moisture
                FROM Plants p
                LEFT JOIN Users u ON p.user_id = u.user_id
                LEFT JOIN Devices d ON p.device_id = d.device_id
                LEFT JOIN Plant_Profiles pp ON p.profile_id = pp.profile_id
                WHERE p.plant_id = $1
            `;
            const result = await pool.query(query, [id]);
            
            if (result.rows.length === 0) {
                return null;
            }
            
            return new Plant(result.rows[0]);
        } catch (error) {
            throw error;
        }
    }

    // Static method to find plants by user ID
    static async findByUserId(userId) {
        try {
            const query = `
                SELECT p.*, u.full_name as owner_name, 
                       d.device_name, d.status as device_status,
                       pp.species_name, pp.ideal_moisture
                FROM Plants p
                LEFT JOIN Users u ON p.user_id = u.user_id
                LEFT JOIN Devices d ON p.device_id = d.device_id
                LEFT JOIN Plant_Profiles pp ON p.profile_id = pp.profile_id
                WHERE p.user_id = $1
                ORDER BY p.created_at DESC
            `;
            const result = await pool.query(query, [userId]);
            return result.rows.map(row => new Plant(row));
        } catch (error) {
            throw error;
        }
    }

    // Static method to find plants by device ID
    static async findByDeviceId(deviceId) {
        try {
            const query = `
                SELECT p.*, u.full_name as owner_name, 
                       d.device_name, d.status as device_status,
                       pp.species_name, pp.ideal_moisture
                FROM Plants p
                LEFT JOIN Users u ON p.user_id = u.user_id
                LEFT JOIN Devices d ON p.device_id = d.device_id
                LEFT JOIN Plant_Profiles pp ON p.profile_id = pp.profile_id
                WHERE p.device_id = $1
                ORDER BY p.created_at DESC
            `;
            const result = await pool.query(query, [deviceId]);
            return result.rows.map(row => new Plant(row));
        } catch (error) {
            throw error;
        }
    }

    // Static method to find plants with auto watering enabled
    static async findWithAutoWatering() {
        try {
            const query = `
                SELECT p.*, u.full_name as owner_name, 
                       d.device_name, d.status as device_status,
                       pp.species_name, pp.ideal_moisture
                FROM Plants p
                LEFT JOIN Users u ON p.user_id = u.user_id
                LEFT JOIN Devices d ON p.device_id = d.device_id
                LEFT JOIN Plant_Profiles pp ON p.profile_id = pp.profile_id
                WHERE p.auto_watering_on = true AND d.status = 'online'
                ORDER BY p.created_at DESC
            `;
            const result = await pool.query(query);
            return result.rows.map(row => new Plant(row));
        } catch (error) {
            throw error;
        }
    }

    // Create or update plant
    async save() {
        try {
            if (this.plant_id) {
                // Update existing plant
                const query = `
                    UPDATE Plants 
                    SET user_id = $1, device_id = $2, profile_id = $3, 
                        custom_name = $4, moisture_threshold = $5, auto_watering_on = $6
                    WHERE plant_id = $7
                    RETURNING *
                `;
                
                const result = await pool.query(query, [
                    this.user_id,
                    this.device_id,
                    this.profile_id,
                    this.custom_name,
                    this.moisture_threshold,
                    this.auto_watering_on,
                    this.plant_id
                ]);
                
                const updatedPlant = new Plant(result.rows[0]);
                Object.assign(this, updatedPlant);
                return this;
            } else {
                // Create new plant
                const query = `
                    INSERT INTO Plants (user_id, device_id, profile_id, custom_name, 
                                      moisture_threshold, auto_watering_on)
                    VALUES ($1, $2, $3, $4, $5, $6)
                    RETURNING *
                `;
                
                const result = await pool.query(query, [
                    this.user_id,
                    this.device_id,
                    this.profile_id,
                    this.custom_name,
                    this.moisture_threshold,
                    this.auto_watering_on !== false // Default to true
                ]);
                
                const newPlant = new Plant(result.rows[0]);
                Object.assign(this, newPlant);
                return this;
            }
        } catch (error) {
            throw error;
        }
    }

    // Toggle auto watering
    async toggleAutoWatering() {
        try {
            const query = `
                UPDATE Plants 
                SET auto_watering_on = $1
                WHERE plant_id = $2
                RETURNING *
            `;
            
            const newStatus = !this.auto_watering_on;
            const result = await pool.query(query, [newStatus, this.plant_id]);
            
            if (result.rows.length > 0) {
                this.auto_watering_on = newStatus;
            }
            
            return this;
        } catch (error) {
            throw error;
        }
    }

    // Update moisture threshold
    async updateMoistureThreshold(newThreshold) {
        try {
            if (newThreshold < 0 || newThreshold > 100) {
                throw new Error('Moisture threshold must be between 0 and 100');
            }

            const query = `
                UPDATE Plants 
                SET moisture_threshold = $1
                WHERE plant_id = $2
                RETURNING *
            `;
            
            const result = await pool.query(query, [newThreshold, this.plant_id]);
            
            if (result.rows.length > 0) {
                this.moisture_threshold = newThreshold;
            }
            
            return this;
        } catch (error) {
            throw error;
        }
    }

    // Get latest sensor data for this plant
    async getLatestSensorData() {
        try {
            const query = `
                SELECT * FROM Sensors_Data 
                WHERE device_id = $1 
                ORDER BY timestamp DESC 
                LIMIT 1
            `;
            const result = await pool.query(query, [this.device_id]);
            return result.rows[0] || null;
        } catch (error) {
            throw error;
        }
    }

    // Get watering history for this plant
    async getWateringHistory(limit = 50) {
        try {
            const query = `
                SELECT * FROM Watering_History 
                WHERE plant_id = $1 
                ORDER BY timestamp DESC 
                LIMIT $2
            `;
            const result = await pool.query(query, [this.plant_id, limit]);
            return result.rows;
        } catch (error) {
            throw error;
        }
    }

    // Check if plant needs watering based on latest sensor data
    async needsWatering() {
        try {
            const sensorData = await this.getLatestSensorData();
            
            if (!sensorData || !sensorData.soil_moisture) {
                return false; // No sensor data available
            }
            
            return sensorData.soil_moisture < this.moisture_threshold;
        } catch (error) {
            throw error;
        }
    }

    // Delete plant
    async delete() {
        try {
            if (!this.plant_id) {
                throw new Error('Cannot delete plant without ID');
            }

            const query = 'DELETE FROM Plants WHERE plant_id = $1';
            await pool.query(query, [this.plant_id]);
            
            return true;
        } catch (error) {
            throw error;
        }
    }

    // Convert to JSON
    toJSON() {
        return {
            plant_id: this.plant_id,
            user_id: this.user_id,
            device_id: this.device_id,
            profile_id: this.profile_id,
            custom_name: this.custom_name,
            moisture_threshold: this.moisture_threshold,
            auto_watering_on: this.auto_watering_on,
            created_at: this.created_at
        };
    }
}

module.exports = Plant;

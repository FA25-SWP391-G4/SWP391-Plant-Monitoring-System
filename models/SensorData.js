const { pool } = require('../config/db');

class SensorData {
    constructor(sensorData) {
        this.data_id = sensorData.data_id;
        this.device_id = sensorData.device_id;
        this.timestamp = sensorData.timestamp;
        this.soil_moisture = sensorData.soil_moisture;
        this.temperature = sensorData.temperature;
        this.air_humidity = sensorData.air_humidity;
        this.light_intensity = sensorData.light_intensity;
    }

    // Static method to find all sensor data
    static async findAll(limit = 100) {
        try {
            const query = `
                SELECT sd.*, d.device_name, d.user_id 
                FROM sensors_data sd
                LEFT JOIN devices d ON sd.device_id = d.device_id
                ORDER BY sd.timestamp DESC 
                LIMIT $1
            `;
            const result = await pool.query(query, [limit]);
            return result.rows.map(row => new SensorData(row));
        } catch (error) {
            throw error;
        }
    }

    // Static method to find sensor data by ID
    static async findById(id) {
        try {
            const query = `
                SELECT sd.*, d.device_name, d.user_id 
                FROM sensors_data sd
                LEFT JOIN devices d ON sd.device_id = d.device_id
                WHERE sd.data_id = $1
            `;
            const result = await pool.query(query, [id]);
            
            if (result.rows.length === 0) {
                return null;
            }
            
            return new SensorData(result.rows[0]);
        } catch (error) {
            throw error;
        }
    }

    // Static method to find sensor data by device ID
    static async findByDeviceId(deviceId, limit = 100) {
        try {
            const query = `
                SELECT sd.*, d.device_name, d.user_id 
                FROM sensors_data sd
                LEFT JOIN devices d ON sd.device_id = d.device_id
                WHERE sd.device_id = $1
                ORDER BY sd.timestamp DESC 
                LIMIT $2
            `;
            const result = await pool.query(query, [deviceId, limit]);
            return result.rows.map(row => new SensorData(row));
        } catch (error) {
            throw error;
        }
    }

    // Static method to find sensor data by user ID
    static async findByUserId(userId, limit = 100) {
        try {
            const query = `
                SELECT sd.*, d.device_name, d.user_id 
                FROM sensors_data sd
                INNER JOIN devices d ON sd.device_id = d.device_id
                WHERE d.user_id = $1
                ORDER BY sd.timestamp DESC 
                LIMIT $2
            `;
            const result = await pool.query(query, [userId, limit]);
            return result.rows.map(row => new SensorData(row));
        } catch (error) {
            throw error;
        }
    }

    //Static method to find the latest sensor data for multiple plants
    static async findLatestForPlants(plants) {
    if (!plants || plants.length === 0) return {};

    const deviceIds = plants.map(p => p.device_id);
    const placeholders = deviceIds.map((_, i) => `$${i + 1}`).join(', ');

    const query = `
        SELECT DISTINCT ON (sd.device_id)
            sd.device_id,
            sd.data_id,
            sd.timestamp,
            sd.soil_moisture,
            sd.temperature,
            sd.air_humidity,
            sd.light_intensity
        FROM sensors_data sd
        WHERE sd.device_id IN (${placeholders})
        ORDER BY sd.device_id, sd.timestamp DESC
    `;

    try {
        const result = await pool.query(query, deviceIds);

        // Map device_id → latest reading
        const readingsMap = {};
        result.rows.forEach(row => {
            readingsMap[row.device_id] = new SensorData(row);
        });

        return readingsMap;
    } catch (error) {
        console.error('Error fetching latest readings for plants:', error);
        throw error;
    }
}


    // Static method to find sensor data within date range
    static async findByDateRange(deviceId, startDate, endDate) {
        try {
            const query = `
                SELECT sd.*, d.device_name, d.user_id 
                FROM sensors_data sd
                LEFT JOIN devices d ON sd.device_id = d.device_id
                WHERE sd.device_id = $1 
                AND sd.timestamp >= $2 
                AND sd.timestamp <= $3
                ORDER BY sd.timestamp DESC
            `;
            const result = await pool.query(query, [deviceId, startDate, endDate]);
            return result.rows.map(row => new SensorData(row));
        } catch (error) {
            throw error;
        }
    }

    // Static method to get latest sensor data for a device
    static async getLatestByDeviceId(deviceId) {
        try {
            const query = `
                SELECT sd.*, d.device_name, d.user_id 
                FROM sensors_data sd
                LEFT JOIN devices d ON sd.device_id = d.device_id
                WHERE sd.device_id = $1
                ORDER BY sd.timestamp DESC 
                LIMIT 1
            `;
            const result = await pool.query(query, [deviceId]);
            
            if (result.rows.length === 0) {
                return null;
            }
            
            return new SensorData(result.rows[0]);
        } catch (error) {
            throw error;
        }
    }

    // Static method to get average values for a device within time period
    static async getAveragesByDeviceId(deviceId, hours = 24) {
        try {
            const query = `
                SELECT 
                    device_id,
                    AVG(soil_moisture) as avg_soil_moisture,
                    AVG(temperature) as avg_temperature,
                    AVG(air_humidity) as avg_air_humidity,
                    AVG(light_intensity) as avg_light_intensity,
                    COUNT(*) as data_points
                FROM sensors_data
                WHERE device_id = $1 
                AND timestamp >= NOW() - INTERVAL '${hours} hours'
                GROUP BY device_id
            `;
            const result = await pool.query(query, [deviceId]);
            return result.rows[0] || null;
        } catch (error) {
            throw error;
        }
    }

    // Create sensor data entry
    async save() {
        try {
            if (this.data_id) {
                // Update existing data (rarely needed for sensor data)
                const query = `
                    UPDATE sensors_data
                    SET device_id = $1, timestamp = $2, soil_moisture = $3, 
                        temperature = $4, air_humidity = $5, light_intensity = $6
                    WHERE data_id = $7
                    RETURNING *
                `;
                
                const result = await pool.query(query, [
                    this.device_id,
                    this.timestamp || new Date(),
                    this.soil_moisture,
                    this.temperature,
                    this.air_humidity,
                    this.light_intensity,
                    this.data_id
                ]);
                
                const updatedData = new SensorData(result.rows[0]);
                Object.assign(this, updatedData);
                return this;
            } else {
                // Create new sensor data
                const query = `
                    INSERT INTO sensors_data (device_id, timestamp, soil_moisture, 
                                            temperature, air_humidity, light_intensity)
                    VALUES ($1, $2, $3, $4, $5, $6)
                    RETURNING *
                `;
                
                const result = await pool.query(query, [
                    this.device_id,
                    this.timestamp || new Date(),
                    this.soil_moisture,
                    this.temperature,
                    this.air_humidity,
                    this.light_intensity
                ]);
                
                const newData = new SensorData(result.rows[0]);
                Object.assign(this, newData);
                return this;
            }
        } catch (error) {
            throw error;
        }
    }

    // Static method to create sensor data from IoT device
    static async createFromDevice(deviceId, sensorReadings) {
        try {
            const sensorData = new SensorData({
                device_id: deviceId,
                timestamp: new Date(),
                soil_moisture: sensorReadings.soil_moisture,
                temperature: sensorReadings.temperature,
                air_humidity: sensorReadings.air_humidity,
                light_intensity: sensorReadings.light_intensity
            });
            
            return await sensorData.save();
        } catch (error) {
            throw error;
        }
    }

    // Delete sensor data (for cleanup)
    async delete() {
        try {
            if (!this.data_id) {
                throw new Error('Cannot delete sensor data without ID');
            }

            const query = 'DELETE FROM sensors_data WHERE data_id = $1';
            await pool.query(query, [this.data_id]);
            
            return true;
        } catch (error) {
            throw error;
        }
    }

    // Static method to cleanup old sensor data
    static async cleanupOldData(daysToKeep = 30) {
        try {
            const query = `
                DELETE FROM sensors_data
                WHERE timestamp < NOW() - INTERVAL '${daysToKeep} days'
            `;
            const result = await pool.query(query);
            return result.rowCount;
        } catch (error) {
            throw error;
        }
    }

    // Check if readings are within normal ranges
    isWithinNormalRanges() {
        const ranges = {
            soil_moisture: { min: 0, max: 100 },
            temperature: { min: -10, max: 50 },
            air_humidity: { min: 0, max: 100 },
            light_intensity: { min: 0, max: 100000 }
        };

        for (const [key, range] of Object.entries(ranges)) {
            const value = this[key];
            if (value !== null && value !== undefined && 
                (value < range.min || value > range.max)) {
                return false;
            }
        }
        
        return true;
    }

    // Static method to get recent sensor data for a plant (via device)
    static async getRecentData(plantId, days = 7) {
        try {
            const query = `
                SELECT sd.*, d.device_name 
                FROM sensors_data sd
                JOIN devices d ON sd.device_id = d.device_id
                JOIN plants p ON d.device_id = p.device_id
                WHERE p.plant_id = $1 
                AND sd.timestamp >= NOW() - INTERVAL '${days} days'
                ORDER BY sd.timestamp DESC
                LIMIT 100
            `;
            const result = await pool.query(query, [plantId]);
            
            // Convert to format expected by AI models
            return result.rows.map(row => ({
                moisture: row.soil_moisture,
                temperature: row.temperature,
                humidity: row.air_humidity,
                light: row.light_intensity,
                timestamp: row.timestamp
            }));
        } catch (error) {
            console.error('Error fetching recent sensor data:', error);
            return [];
        }
    }

    // Convert to JSON
    toJSON() {
        return {
            data_id: this.data_id,
            device_id: this.device_id,
            timestamp: this.timestamp,
            soil_moisture: this.soil_moisture,
            temperature: this.temperature,
            air_humidity: this.air_humidity,
            light_intensity: this.light_intensity,
            is_normal: this.isWithinNormalRanges()
        };
    }
}

module.exports = SensorData;

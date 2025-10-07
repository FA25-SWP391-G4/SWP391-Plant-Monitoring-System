const { pool } = require('../config/db');

class PumpSchedule {
    constructor(scheduleData) {
        this.schedule_id = scheduleData.schedule_id;
        this.plant_id = scheduleData.plant_id;
        this.cron_expression = scheduleData.cron_expression;
        this.is_active = scheduleData.is_active;
    }

    // Static method to find all pump schedules
    static async findAll() {
        try {
            const query = `
                SELECT ps.*, p.custom_name as plant_name, 
                       u.full_name as owner_name, d.device_name
                FROM Pump_Schedules ps
                LEFT JOIN Plants p ON ps.plant_id = p.plant_id
                LEFT JOIN Users u ON p.user_id = u.user_id
                LEFT JOIN Devices d ON p.device_id = d.device_id
                ORDER BY ps.schedule_id
            `;
            const result = await pool.query(query);
            return result.rows.map(row => new PumpSchedule(row));
        } catch (error) {
            throw error;
        }
    }

    // Static method to find pump schedule by ID
    static async findById(id) {
        try {
            const query = `
                SELECT ps.*, p.custom_name as plant_name, 
                       u.full_name as owner_name, d.device_name
                FROM Pump_Schedules ps
                LEFT JOIN Plants p ON ps.plant_id = p.plant_id
                LEFT JOIN Users u ON p.user_id = u.user_id
                LEFT JOIN Devices d ON p.device_id = d.device_id
                WHERE ps.schedule_id = $1
            `;
            const result = await pool.query(query, [id]);
            
            if (result.rows.length === 0) {
                return null;
            }
            
            return new PumpSchedule(result.rows[0]);
        } catch (error) {
            throw error;
        }
    }

    // Static method to find pump schedules by plant ID
    static async findByPlantId(plantId) {
        try {
            const query = `
                SELECT ps.*, p.custom_name as plant_name, 
                       u.full_name as owner_name, d.device_name
                FROM Pump_Schedules ps
                LEFT JOIN Plants p ON ps.plant_id = p.plant_id
                LEFT JOIN Users u ON p.user_id = u.user_id
                LEFT JOIN Devices d ON p.device_id = d.device_id
                WHERE ps.plant_id = $1
                ORDER BY ps.schedule_id
            `;
            const result = await pool.query(query, [plantId]);
            return result.rows.map(row => new PumpSchedule(row));
        } catch (error) {
            throw error;
        }
    }

    // Static method to find pump schedules by user ID
    static async findByUserId(userId) {
        try {
            const query = `
                SELECT ps.*, p.custom_name as plant_name, 
                       u.full_name as owner_name, d.device_name
                FROM Pump_Schedules ps
                INNER JOIN Plants p ON ps.plant_id = p.plant_id
                INNER JOIN Users u ON p.user_id = u.user_id
                LEFT JOIN Devices d ON p.device_id = d.device_id
                WHERE u.user_id = $1
                ORDER BY ps.schedule_id
            `;
            const result = await pool.query(query, [userId]);
            return result.rows.map(row => new PumpSchedule(row));
        } catch (error) {
            throw error;
        }
    }

    // Static method to find active pump schedules
    static async findActive() {
        try {
            const query = `
                SELECT ps.*, p.custom_name as plant_name, 
                       u.full_name as owner_name, d.device_name,
                       d.status as device_status
                FROM Pump_Schedules ps
                INNER JOIN Plants p ON ps.plant_id = p.plant_id
                INNER JOIN Users u ON p.user_id = u.user_id
                INNER JOIN Devices d ON p.device_id = d.device_id
                WHERE ps.is_active = true 
                AND d.status = 'online'
                AND p.auto_watering_on = true
                ORDER BY ps.schedule_id
            `;
            const result = await pool.query(query);
            return result.rows.map(row => new PumpSchedule(row));
        } catch (error) {
            throw error;
        }
    }

    // Create or update pump schedule
    async save() {
        try {
            if (this.schedule_id) {
                // Update existing schedule
                const query = `
                    UPDATE Pump_Schedules 
                    SET plant_id = $1, cron_expression = $2, is_active = $3
                    WHERE schedule_id = $4
                    RETURNING *
                `;
                
                const result = await pool.query(query, [
                    this.plant_id,
                    this.cron_expression,
                    this.is_active,
                    this.schedule_id
                ]);
                
                const updatedSchedule = new PumpSchedule(result.rows[0]);
                Object.assign(this, updatedSchedule);
                return this;
            } else {
                // Create new schedule
                const query = `
                    INSERT INTO Pump_Schedules (plant_id, cron_expression, is_active)
                    VALUES ($1, $2, $3)
                    RETURNING *
                `;
                
                const result = await pool.query(query, [
                    this.plant_id,
                    this.cron_expression,
                    this.is_active !== false // Default to true
                ]);
                
                const newSchedule = new PumpSchedule(result.rows[0]);
                Object.assign(this, newSchedule);
                return this;
            }
        } catch (error) {
            throw error;
        }
    }

    // Toggle schedule active status
    async toggleActive() {
        try {
            const query = `
                UPDATE Pump_Schedules 
                SET is_active = $1
                WHERE schedule_id = $2
                RETURNING *
            `;
            
            const newStatus = !this.is_active;
            const result = await pool.query(query, [newStatus, this.schedule_id]);
            
            if (result.rows.length > 0) {
                this.is_active = newStatus;
            }
            
            return this;
        } catch (error) {
            throw error;
        }
    }

    // Update cron expression
    async updateCronExpression(newCronExpression) {
        try {
            if (!this.isValidCronExpression(newCronExpression)) {
                throw new Error('Invalid cron expression format');
            }

            const query = `
                UPDATE Pump_Schedules 
                SET cron_expression = $1
                WHERE schedule_id = $2
                RETURNING *
            `;
            
            const result = await pool.query(query, [newCronExpression, this.schedule_id]);
            
            if (result.rows.length > 0) {
                this.cron_expression = newCronExpression;
            }
            
            return this;
        } catch (error) {
            throw error;
        }
    }

    // Basic cron expression validation
    isValidCronExpression(cronExpr) {
        if (!cronExpr || typeof cronExpr !== 'string') {
            return false;
        }
        
        const parts = cronExpr.trim().split(/\s+/);
        
        // Basic validation - should have 5 parts (minute, hour, day, month, weekday)
        return parts.length === 5;
    }

    // Parse cron expression to human readable format
    getCronDescription() {
        if (!this.cron_expression) {
            return 'No schedule set';
        }
        
        const parts = this.cron_expression.split(' ');
        if (parts.length !== 5) {
            return 'Invalid schedule format';
        }
        
        const [minute, hour, day, month, weekday] = parts;
        
        // Simple common patterns
        if (minute === '0' && hour !== '*' && day === '*' && month === '*' && weekday === '*') {
            return `Daily at ${hour}:00`;
        }
        
        if (minute !== '*' && hour !== '*' && day === '*' && month === '*' && weekday === '*') {
            return `Daily at ${hour}:${minute.padStart(2, '0')}`;
        }
        
        if (minute === '0' && hour === '8' && day === '*' && month === '*' && weekday === '*') {
            return 'Daily at 8:00 AM';
        }
        
        if (minute === '0' && hour === '18' && day === '*' && month === '*' && weekday === '*') {
            return 'Daily at 6:00 PM';
        }
        
        return `Custom schedule: ${this.cron_expression}`;
    }

    // Delete pump schedule
    async delete() {
        try {
            if (!this.schedule_id) {
                throw new Error('Cannot delete schedule without ID');
            }

            const query = 'DELETE FROM Pump_Schedules WHERE schedule_id = $1';
            await pool.query(query, [this.schedule_id]);
            
            return true;
        } catch (error) {
            throw error;
        }
    }

    // Static method to create common schedules
    static async createDailySchedule(plantId, hour, minute = 0) {
        try {
            const cronExpression = `${minute} ${hour} * * *`;
            
            const schedule = new PumpSchedule({
                plant_id: plantId,
                cron_expression: cronExpression,
                is_active: true
            });
            
            return await schedule.save();
        } catch (error) {
            throw error;
        }
    }

    static async createWeeklySchedule(plantId, weekday, hour, minute = 0) {
        try {
            const cronExpression = `${minute} ${hour} * * ${weekday}`;
            
            const schedule = new PumpSchedule({
                plant_id: plantId,
                cron_expression: cronExpression,
                is_active: true
            });
            
            return await schedule.save();
        } catch (error) {
            throw error;
        }
    }

    // Convert to JSON
    toJSON() {
        return {
            schedule_id: this.schedule_id,
            plant_id: this.plant_id,
            cron_expression: this.cron_expression,
            is_active: this.is_active,
            description: this.getCronDescription()
        };
    }
}

module.exports = PumpSchedule;

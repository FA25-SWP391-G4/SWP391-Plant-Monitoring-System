/**
 * ============================================================================
 * DEVICE MODEL - IOT DEVICE MANAGEMENT & MONITORING
 * ============================================================================
 * 
 * SUPPORTS THESE USE CASES:
 * 🔄 UC3: Add Device - Device registration and setup
 * 🔄 UC4: Connect to Device - Device pairing and authentication
 * 🔄 UC5: Monitor Plant Status - Device status monitoring
 * 🔄 UC6: Automated Watering - Device control commands
 * 🔄 UC7: Receive Real-time Alerts - Device status changes
 * 🔄 UC14: Historical Data Analysis - Device data history
 * 🔄 UC15: Advanced Analytics - Device performance metrics
 * 🔄 UC25: Monitor System Performance - Device uptime tracking
 * 🔄 UC26: Manage IoT Devices - Admin device management
 * 🔄 UC27: Generate Reports - Device usage reports
 * 
 * DEVICE STATES:
 * - 'online': Device actively connected and responsive
 * - 'offline': Device disconnected or unresponsive  
 * - 'error': Device experiencing technical issues
 * - 'maintenance': Device temporarily disabled for maintenance
 * 
 * SECURITY FEATURES:
 * - Unique device keys for API authentication
 * - User ownership validation
 * - Last seen timestamp for connection monitoring
 * - Secure device pairing process
 * 
 * RELATIONSHIPS:
 * - Devices (N) → (1) Users (owner)
 * - Devices (1) → (N) Plants
 * - Devices (1) → (N) SensorData
 * - Devices (1) → (N) WateringHistory
 */

const { pool } = require('../config/db');
const crypto = require('crypto');

class Device {
    /**
     * DEVICE CONSTRUCTOR
     * Initializes device object with default values and validation
     * SUPPORTS: UC3 (Add Device), UC26 (Admin device management)
     */
    constructor(deviceData) {
        this.device_id = deviceData.device_id;
        this.user_id = deviceData.user_id;
        this.device_key = deviceData.device_key;
        this.device_name = deviceData.device_name;
        this.status = deviceData.status || 'offline'; // Default to offline for security
        this.last_seen = deviceData.last_seen;
        this.created_at = deviceData.created_at;
    }

    /**
     * FIND ALL DEVICES - ADMIN & USER DEVICE LISTING
     * Retrieves all devices with owner information for management interfaces
     * 
     * SUPPORTS:
     * - UC26: Manage IoT Devices - Admin device overview
     * - UC27: Generate Reports - Device inventory reports
     * - User dashboard device listing
     */
    // Static method to find all devices
    static async findAll() {
        try {
            const query = `
                SELECT d.*, u.full_name as owner_name 
                FROM Devices d
                LEFT JOIN Users u ON d.user_id = u.user_id
                ORDER BY d.created_at DESC
            `;
            const result = await pool.query(query);
            return result.rows.map(row => new Device(row));
        } catch (error) {
            throw error;
        }
    }

    /**
     * FIND DEVICE BY ID - DEVICE IDENTIFICATION & CONTROL
     * Retrieves specific device with owner info for operations and monitoring
     * 
     * SUPPORTS:
     * - UC4: Connect to Device - Device lookup for pairing
     * - UC5: Monitor Plant Status - Device status checking
     * - UC6: Automated Watering - Device control target identification
     * - UC26: Admin device management - Device details view
     * 
     * SECURITY: Includes owner validation for authorization checks
     */
    // Static method to find device by ID
    static async findById(id) {
        try {
            const query = `
                SELECT d.*, u.full_name as owner_name 
                FROM Devices d
                LEFT JOIN Users u ON d.user_id = u.user_id
                WHERE d.device_id = $1
            `;
            const result = await pool.query(query, [id]);
            
            if (result.rows.length === 0) {
                return null;
            }
            
            return new Device(result.rows[0]);
        } catch (error) {
            throw error;
        }
    }

    // Static method to find device by device key
    static async findByDeviceKey(deviceKey) {
        try {
            const query = `
                SELECT d.*, u.full_name as owner_name 
                FROM Devices d
                LEFT JOIN Users u ON d.user_id = u.user_id
                WHERE d.device_key = $1
            `;
            const result = await pool.query(query, [deviceKey]);
            
            if (result.rows.length === 0) {
                return null;
            }
            
            return new Device(result.rows[0]);
        } catch (error) {
            throw error;
        }
    }

    // Static method to find devices by user ID
    static async findByUserId(userId) {
        try {
            const query = `
                SELECT d.*, u.full_name as owner_name 
                FROM Devices d
                LEFT JOIN Users u ON d.user_id = u.user_id
                WHERE d.user_id = $1
                ORDER BY d.created_at DESC
            `;
            const result = await pool.query(query, [userId]);
            return result.rows.map(row => new Device(row));
        } catch (error) {
            throw error;
        }
    }

    // Static method to find devices by status
    static async findByStatus(status) {
        try {
            const query = `
                SELECT d.*, u.full_name as owner_name 
                FROM Devices d
                LEFT JOIN Users u ON d.user_id = u.user_id
                WHERE d.status = $1
                ORDER BY d.last_seen DESC
            `;
            const result = await pool.query(query, [status]);
            return result.rows.map(row => new Device(row));
        } catch (error) {
            throw error;
        }
    }

    // Generate a unique device key (UUID)
    static generateDeviceKey() {
        return crypto.randomUUID();
    }

    // Create or update device
    async save() {
        try {
            if (this.device_id) {
                // Update existing device
                const query = `
                    UPDATE Devices 
                    SET user_id = $1, device_key = $2, device_name = $3, 
                        status = $4, last_seen = $5
                    WHERE device_id = $6
                    RETURNING *
                `;
                
                const result = await pool.query(query, [
                    this.user_id,
                    this.device_key,
                    this.device_name,
                    this.status,
                    this.last_seen,
                    this.device_id
                ]);
                
                const updatedDevice = new Device(result.rows[0]);
                Object.assign(this, updatedDevice);
                return this;
            } else {
                // Create new device
                if (!this.device_key) {
                    this.device_key = Device.generateDeviceKey();
                }
                
                const query = `
                    INSERT INTO Devices (user_id, device_key, device_name, status)
                    VALUES ($1, $2, $3, $4)
                    RETURNING *
                `;
                
                const result = await pool.query(query, [
                    this.user_id,
                    this.device_key,
                    this.device_name,
                    this.status || 'offline'
                ]);
                
                const newDevice = new Device(result.rows[0]);
                Object.assign(this, newDevice);
                return this;
            }
        } catch (error) {
            throw error;
        }
    }

    // Update device status and last seen
    async updateStatus(status) {
        try {
            const query = `
                UPDATE Devices 
                SET status = $1, last_seen = CURRENT_TIMESTAMP
                WHERE device_id = $2
                RETURNING *
            `;
            
            const result = await pool.query(query, [status, this.device_id]);
            
            if (result.rows.length > 0) {
                this.status = status;
                this.last_seen = result.rows[0].last_seen;
            }
            
            return this;
        } catch (error) {
            throw error;
        }
    }

    // Ping device (update last seen)
    async ping() {
        try {
            const query = `
                UPDATE Devices 
                SET last_seen = CURRENT_TIMESTAMP, status = 'online'
                WHERE device_id = $1
                RETURNING *
            `;
            
            const result = await pool.query(query, [this.device_id]);
            
            if (result.rows.length > 0) {
                this.last_seen = result.rows[0].last_seen;
                this.status = 'online';
            }
            
            return this;
        } catch (error) {
            throw error;
        }
    }

    // Delete device
    async delete() {
        try {
            if (!this.device_id) {
                throw new Error('Cannot delete device without ID');
            }

            const query = 'DELETE FROM Devices WHERE device_id = $1';
            await pool.query(query, [this.device_id]);
            
            return true;
        } catch (error) {
            throw error;
        }
    }

    // Check if device is online (last seen within 5 minutes)
    isOnline() {
        if (!this.last_seen || this.status === 'offline') {
            return false;
        }
        
        const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
        return new Date(this.last_seen) > fiveMinutesAgo;
    }

    // Convert to JSON
    toJSON() {
        return {
            device_id: this.device_id,
            user_id: this.user_id,
            device_key: this.device_key,
            device_name: this.device_name,
            status: this.status,
            last_seen: this.last_seen,
            created_at: this.created_at,
            is_online: this.isOnline()
        };
    }
}

module.exports = Device;

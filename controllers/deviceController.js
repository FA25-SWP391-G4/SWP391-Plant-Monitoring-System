/**
 * ============================================================================
 * DEVICE CONTROLLER - IOT DEVICE MANAGEMENT
 * ============================================================================
 */

const { pool } = require('../config/db');
const SystemLog = require('../models/SystemLog');

/**
 * GET /api/devices
 * Get all devices, optionally filtered by user_id
 */
const getAllDevices = async (req, res) => {
    try {
        const userId = req.user ? req.user.user_id : null;
        
        let query;
        let params = [];
        
        if (userId) {
        // For authenticated users, show only their devices
        query = `
            SELECT d.*,
                    p.plant_id,
                    p.custom_name as plant_name
            FROM devices d
            LEFT JOIN plants p ON TRIM(d.device_key) = TRIM(p.device_key)
            WHERE d.user_id = $1
            ORDER BY d.created_at DESC
        `;
        params = [userId];
        } else {
            // For public/admin view, show all devices
            query = `
                SELECT d.*,
                       p.plant_id,
                       p.custom_name as plant_name,
                       u.family_name as owner_name
                FROM devices d
                LEFT JOIN plants p ON TRIM(d.device_key) = TRIM(p.device_key)
                LEFT JOIN users u ON d.user_id = u.user_id
                ORDER BY d.created_at DESC
            `;
        }

        const { rows } = await pool.query(query, params);
        
        // Format the data to ensure consistent structure
        const formattedDevices = rows.map(device => ({
            device_key: device.device_key ? device.device_key.trim() : null, // Handle CHAR(36) padding
            device_name: device.device_name,
            device_type: device.device_type || 'sensor',
            status: device.status || 'offline',
            last_active: device.last_seen || device.created_at,
            plant_id: device.plant_id,
            plant_name: device.plant_name,
            owner_name: device.owner_name
        }));

        await SystemLog.info('DeviceController', 'getAllDevices',
            `Retrieved ${formattedDevices.length} devices${userId ? ' for user ' + userId : ''}`);

        return res.json({
            success: true,
            data: formattedDevices
        });

    } catch (error) {
        await SystemLog.error('DeviceController', 'getAllDevices', error.message);
        res.status(500).json({
            success: false,
            error: 'Failed to retrieve devices'
        });
    }
};

/**
 * PUT /api/devices/:deviceId
 * Update device information (name, etc.)
 */
const updateDevice = async (req, res) => {
    try {
        const deviceId = req.params.deviceId;
        const userId = req.user ? req.user.user_id : null;
        const { device_name, device_type, location, description } = req.body;

        // Validate required fields
        if (!device_name || !device_name.trim()) {
            return res.status(400).json({
                success: false,
                error: 'Device name is required'
            });
        }

        // Check if device exists and belongs to user
        const deviceCheckQuery = `
            SELECT * FROM devices 
            WHERE device_key = $1 AND user_id = $2
        `;
        const deviceCheck = await pool.query(deviceCheckQuery, [deviceId, userId]);

        if (deviceCheck.rows.length === 0) {
            return res.status(404).json({
                success: false,
                error: 'Device not found or not authorized'
            });
        }

        // Update device
        const updateQuery = `
            UPDATE devices 
            SET device_name = $1, 
                last_seen = NOW()
            WHERE device_key = $2 AND user_id = $3
            RETURNING *
        `;
        
        const result = await pool.query(updateQuery, [
            device_name.trim(),
            deviceId,
            userId
        ]);

        if (result.rows.length === 0) {
            return res.status(404).json({
                success: false,
                error: 'Failed to update device'
            });
        }

        const updatedDevice = result.rows[0];

        // Format the response consistently
        const formattedDevice = {
            device_key: updatedDevice.device_key ? updatedDevice.device_key.trim() : null,
            device_name: updatedDevice.device_name,
            status: updatedDevice.status || 'offline',
            last_active: updatedDevice.last_seen || updatedDevice.created_at
        };

        await SystemLog.info('DeviceController', 'updateDevice', 
            `Updated device ${deviceId} for user ${userId}`);

        return res.json({
            success: true,
            message: 'Device updated successfully',
            data: formattedDevice
        });

    } catch (error) {
        await SystemLog.error('DeviceController', 'updateDevice', error.message);
        console.error('Error updating device:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to update device'
        });
    }
};

module.exports = {
    getAllDevices,
    updateDevice
};

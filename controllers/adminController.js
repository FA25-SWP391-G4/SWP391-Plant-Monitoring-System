/**
 * ============================================================================
 * ADMIN CONTROLLER - SYSTEM ADMINISTRATION
 * ============================================================================
 * 
 * This controller handles administrative functionality:
 * - UC24: Manage Users - User CRUD, role management, bulk operations
 * - UC25: View System-Wide Reports - Global metrics and analytics
 * - UC26: Configure Global Settings - System configuration management
 * - UC27: Monitor System Logs - Error tracking and audit logs
 * - UC28: Backup and Restore Data - Data management utilities
 * - UC31: Manage Multi-Language Settings - Internationalization admin
 * 
 * SECURITY CONSIDERATIONS:
 * - All endpoints require Admin role authentication
 * - Access control verification for sensitive operations
 * - Audit logging for all administrative actions
 * - Input validation for all parameters
 * - Rate limiting for API protection
 */

const User = require('../models/User');
const SystemLog = require('../models/SystemLog');
const Plant = require('../models/Plant');
const Device = require('../models/Device');
const SensorData = require('../models/SensorData');
const WateringHistory = require('../models/WateringHistory');
const Payment = require('../models/Payment');
const { pool } = require('../config/db');
const { exec } = require('child_process');
const fs = require('fs');
const path = require('path');
const util = require('util');
const execPromise = util.promisify(exec);

/**
 * UC24: GET ALL USERS
 * ===============================
 * Get all users with optional filtering and pagination
 * 
 * @route GET /api/admin/users
 * @access Private - Admin only
 * @param {string} search - Optional search term for email or name
 * @param {string} role - Optional role filter (Regular, Premium, Admin)
 * @param {number} page - Optional page number
 * @param {number} limit - Optional items per page
 * @returns {Object} Paginated list of users
 */
async function getAllUsers(req, res) {
    try {
        const { search, role, page = 1, limit = 10 } = req.query;
        const offset = (page - 1) * limit;
        
        // Log admin action
        await SystemLog.create({
            log_level: 'INFO',
            source: 'AdminController',
            message: `Admin ${req.user.user_id} accessed user list`,
            user_id: req.user.user_id
        });

        const users = await User.findAll({
            search,
            role,
            limit: parseInt(limit),
            offset: parseInt(offset)
        });

        const totalCount = await User.countAll({ search, role });
        
        res.status(200).json({
            success: true,
            data: {
                users,
                pagination: {
                    total: totalCount,
                    page: parseInt(page),
                    limit: parseInt(limit),
                    pages: Math.ceil(totalCount / limit)
                }
            }
        });
    } catch (error) {
        console.error('Error getting users:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to retrieve users'
        });
    }
}

/**
 * UC24: GET USER BY ID
 * ===============================
 * Get detailed information about a specific user
 * 
 * @route GET /api/admin/users/:userId
 * @access Private - Admin only
 * @param {number} userId - ID of the user to get
 * @returns {Object} User details
 */
async function getUserById(req, res) {
    try {
        const { userId } = req.params;
        
        const user = await User.findById(userId);
        
        if (!user) {
            return res.status(404).json({
                success: false,
                error: 'User not found'
            });
        }
        
        // Get additional user-related data
        const devices = await Device.findByUserId(userId);
        const plants = await Plant.findByUserId(userId);
        const recentLogs = await SystemLog.findByUserId(userId, 20);
        
        // Log admin action
        await SystemLog.create({
            log_level: 'INFO',
            source: 'AdminController',
            message: `Admin ${req.user.user_id} viewed user ${userId}`,
            user_id: req.user.user_id
        });
        
        res.status(200).json({
            success: true,
            data: {
                user,
                devices,
                plants,
                recentLogs
            }
        });
    } catch (error) {
        console.error(`Error getting user ${req.params.userId}:`, error);
        res.status(500).json({
            success: false,
            error: 'Failed to retrieve user information'
        });
    }
}

/**
 * UC24: CREATE USER
 * ===============================
 * Create a new user account
 * 
 * @route POST /api/admin/users
 * @access Private - Admin only
 * @returns {Object} Created user details
 */
async function createUser(req, res) {
    try {
        const { email, password, full_name, role } = req.body;
        
        // Validate required fields
        if (!email || !password || !full_name) {
            return res.status(400).json({
                success: false,
                error: 'Email, password, and full name are required'
            });
        }
        
        // Validate email format
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            return res.status(400).json({
                success: false,
                error: 'Invalid email format'
            });
        }
        
        // Validate role
        const validRoles = ['Regular', 'Premium', 'Admin'];
        if (role && !validRoles.includes(role)) {
            return res.status(400).json({
                success: false,
                error: 'Invalid role. Must be one of: Regular, Premium, Admin'
            });
        }
        
        // Check if user with email already exists
        const existingUser = await User.findByEmail(email);
        if (existingUser) {
            return res.status(409).json({
                success: false,
                error: 'Email already registered'
            });
        }
        
        // Create new user
        const userData = {
            email,
            password,
            full_name,
            role: role || 'Regular'
        };
        
        const newUser = new User(userData);
        await newUser.save();
        
        // Log admin action
        await SystemLog.create({
            log_level: 'INFO',
            source: 'AdminController',
            message: `Admin ${req.user.user_id} created new user ${newUser.user_id} with role ${newUser.role}`,
            user_id: req.user.user_id
        });
        
        res.status(201).json({
            success: true,
            message: 'User created successfully',
            data: {
                user_id: newUser.user_id,
                email: newUser.email,
                full_name: newUser.full_name,
                role: newUser.role,
                created_at: newUser.created_at
            }
        });
    } catch (error) {
        console.error('Error creating user:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to create user'
        });
    }
}

/**
 * UC24: UPDATE USER
 * ===============================
 * Update an existing user's information
 * 
 * @route PUT /api/admin/users/:userId
 * @access Private - Admin only
 * @param {number} userId - ID of the user to update
 * @returns {Object} Updated user details
 */
async function updateUser(req, res) {
    try {
        const { userId } = req.params;
        const { email, full_name, role } = req.body;
        
        // Find the user
        const user = await User.findById(userId);
        
        if (!user) {
            return res.status(404).json({
                success: false,
                error: 'User not found'
            });
        }
        
        // Validate role if provided
        const validRoles = ['Regular', 'Premium', 'Admin'];
        if (role && !validRoles.includes(role)) {
            return res.status(400).json({
                success: false,
                error: 'Invalid role. Must be one of: Regular, Premium, Admin'
            });
        }
        
        // Check if email is being changed and validate it's not taken
        if (email && email !== user.email) {
            // Validate email format
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (!emailRegex.test(email)) {
                return res.status(400).json({
                    success: false,
                    error: 'Invalid email format'
                });
            }
            
            // Check if email is already taken
            const existingUser = await User.findByEmail(email);
            if (existingUser && existingUser.user_id !== parseInt(userId)) {
                return res.status(409).json({
                    success: false,
                    error: 'Email already registered to another user'
                });
            }
            
            user.email = email;
        }
        
        // Update user fields
        if (full_name) user.full_name = full_name;
        if (role) user.role = role;
        
        // Save changes
        await user.save();
        
        // Log admin action
        await SystemLog.create({
            log_level: 'INFO',
            source: 'AdminController',
            message: `Admin ${req.user.user_id} updated user ${userId}`,
            user_id: req.user.user_id
        });
        
        res.status(200).json({
            success: true,
            message: 'User updated successfully',
            data: {
                user_id: user.user_id,
                email: user.email,
                full_name: user.full_name,
                role: user.role,
                updated_at: new Date().toISOString()
            }
        });
    } catch (error) {
        console.error(`Error updating user ${req.params.userId}:`, error);
        res.status(500).json({
            success: false,
            error: 'Failed to update user'
        });
    }
}

/**
 * UC24: RESET USER PASSWORD
 * ===============================
 * Reset a user's password (admin action)
 * 
 * @route POST /api/admin/users/:userId/reset-password
 * @access Private - Admin only
 * @param {number} userId - ID of the user whose password to reset
 * @returns {Object} Success message with temporary password
 */
async function resetUserPassword(req, res) {
    try {
        const { userId } = req.params;
        
        // Find the user
        const user = await User.findById(userId);
        
        if (!user) {
            return res.status(404).json({
                success: false,
                error: 'User not found'
            });
        }
        
        // Generate a temporary password
        const tempPassword = Math.random().toString(36).slice(-8);
        
        // Update user password
        await user.updatePassword(tempPassword);
        
        // Log admin action
        await SystemLog.create({
            log_level: 'WARNING',
            source: 'AdminController',
            message: `Admin ${req.user.user_id} reset password for user ${userId}`,
            user_id: req.user.user_id
        });
        
        res.status(200).json({
            success: true,
            message: 'Password reset successfully',
            data: {
                user_id: user.user_id,
                email: user.email,
                temporary_password: tempPassword
            }
        });
    } catch (error) {
        console.error(`Error resetting password for user ${req.params.userId}:`, error);
        res.status(500).json({
            success: false,
            error: 'Failed to reset user password'
        });
    }
}

/**
 * UC24: DELETE USER
 * ===============================
 * Delete a user account
 * 
 * @route DELETE /api/admin/users/:userId
 * @access Private - Admin only
 * @param {number} userId - ID of the user to delete
 * @returns {Object} Success message
 */
async function deleteUser(req, res) {
    try {
        const { userId } = req.params;
        
        // Prevent deleting self
        if (parseInt(userId) === req.user.user_id) {
            return res.status(403).json({
                success: false,
                error: 'Cannot delete your own account'
            });
        }
        
        // Find the user
        const user = await User.findById(userId);
        
        if (!user) {
            return res.status(404).json({
                success: false,
                error: 'User not found'
            });
        }
        
        // Record user data before deletion for audit
        const userData = {
            user_id: user.user_id,
            email: user.email,
            full_name: user.full_name,
            role: user.role
        };
        
        // Delete the user
        await user.delete();
        
        // Log admin action
        await SystemLog.create({
            log_level: 'WARNING',
            source: 'AdminController',
            message: `Admin ${req.user.user_id} deleted user ${userId} (${userData.email})`,
            user_id: req.user.user_id,
            details: JSON.stringify(userData)
        });
        
        res.status(200).json({
            success: true,
            message: 'User deleted successfully'
        });
    } catch (error) {
        console.error(`Error deleting user ${req.params.userId}:`, error);
        res.status(500).json({
            success: false,
            error: 'Failed to delete user'
        });
    }
}

/**
 * UC24: BULK USER ACTIONS
 * ===============================
 * Perform actions on multiple users at once
 * 
 * @route POST /api/admin/users/bulk
 * @access Private - Admin only
 * @param {string} action - Action to perform (delete, changeRole)
 * @param {Array} userIds - Array of user IDs to act upon
 * @param {string} role - New role for changeRole action
 * @returns {Object} Results of the bulk operation
 */
async function bulkUserActions(req, res) {
    try {
        const { action, userIds, role } = req.body;
        
        if (!action || !Array.isArray(userIds) || userIds.length === 0) {
            return res.status(400).json({
                success: false,
                error: 'Action and userIds array are required'
            });
        }
        
        // Prevent acting on self
        if (userIds.includes(req.user.user_id)) {
            return res.status(403).json({
                success: false,
                error: 'Cannot perform bulk actions on your own account'
            });
        }
        
        const results = {
            successful: [],
            failed: []
        };
        
        switch (action) {
            case 'delete':
                // Process deletion
                for (const userId of userIds) {
                    try {
                        const user = await User.findById(userId);
                        if (user) {
                            await user.delete();
                            results.successful.push(userId);
                        } else {
                            results.failed.push({ id: userId, reason: 'User not found' });
                        }
                    } catch (error) {
                        results.failed.push({ id: userId, reason: 'Database error' });
                    }
                }
                break;
                
            case 'changeRole':
                // Validate role
                const validRoles = ['Regular', 'Premium', 'Admin'];
                if (!role || !validRoles.includes(role)) {
                    return res.status(400).json({
                        success: false,
                        error: 'Valid role is required for changeRole action'
                    });
                }
                
                // Process role changes
                for (const userId of userIds) {
                    try {
                        const user = await User.findById(userId);
                        if (user) {
                            user.role = role;
                            await user.save();
                            results.successful.push(userId);
                        } else {
                            results.failed.push({ id: userId, reason: 'User not found' });
                        }
                    } catch (error) {
                        results.failed.push({ id: userId, reason: 'Database error' });
                    }
                }
                break;
                
            default:
                return res.status(400).json({
                    success: false,
                    error: `Unsupported action: ${action}. Supported actions: delete, changeRole`
                });
        }
        
        // Log admin action
        await SystemLog.create({
            log_level: 'WARNING',
            source: 'AdminController',
            message: `Admin ${req.user.user_id} performed bulk action: ${action} on ${results.successful.length} users`,
            user_id: req.user.user_id,
            details: JSON.stringify({
                action,
                successful: results.successful,
                failed: results.failed,
                role: role || null
            })
        });
        
        res.status(200).json({
            success: true,
            message: `Bulk ${action} completed`,
            data: results
        });
    } catch (error) {
        console.error('Error performing bulk user action:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to perform bulk user action'
        });
    }
}

/**
 * UC25: GET SYSTEM DASHBOARD
 * ===============================
 * Get system-wide dashboard metrics
 * 
 * @route GET /api/admin/dashboard
 * @access Private - Admin only
 * @returns {Object} System-wide metrics and statistics
 */
async function getSystemDashboard(req, res) {
    try {
        // Get key metrics in parallel
        const [
            userCount,
            premiumUserCount,
            deviceCount,
            activeDeviceCount,
            plantCount,
            todaySensorReadings,
            todayWateringEvents,
            recentErrors,
            financialMetrics
        ] = await Promise.all([
            User.countAll(),
            User.countByRole('Premium'),
            Device.countAll(),
            Device.countActive(),
            Plant.countAll(),
            SensorData.countToday(),
            WateringHistory.countToday(),
            SystemLog.findByLevel('ERROR', 10),
            getFinancialMetrics()
        ]);
        
        // Get system health
        const systemHealth = {
            database: true,
            api: true,
            mqtt: true,
            storage: true
        };
        
        // Check database health (simple query)
        try {
            await pool.query('SELECT 1');
        } catch (error) {
            systemHealth.database = false;
        }
        
        // Check storage health
        try {
            const diskSpace = await checkDiskSpace();
            systemHealth.storage = diskSpace.percentFree > 10; // Less than 10% free space is a concern
        } catch (error) {
            systemHealth.storage = false;
        }

        // Get user growth data (last 7 days)
        const userGrowth = await getUserGrowthData();

        // Get device statistics
        const deviceStats = await getDeviceStatistics();

        // Log admin access
        await SystemLog.create({
            log_level: 'INFO',
            source: 'AdminController',
            message: `Admin ${req.user.user_id} viewed system dashboard`,
            user_id: req.user.user_id
        });
        
        res.status(200).json({
            success: true,
            data: {
                users: {
                    total: userCount,
                    premium: premiumUserCount,
                    percentagePremium: userCount > 0 ? (premiumUserCount / userCount * 100).toFixed(1) : 0,
                    growth: userGrowth
                },
                devices: {
                    total: deviceCount,
                    active: activeDeviceCount,
                    percentageActive: deviceCount > 0 ? (activeDeviceCount / deviceCount * 100).toFixed(1) : 0,
                    statistics: deviceStats
                },
                plants: {
                    total: plantCount
                },
                activity: {
                    todaySensorReadings,
                    todayWateringEvents
                },
                financial: financialMetrics,
                systemHealth,
                recentErrors
            }
        });
    } catch (error) {
        console.error('Error getting system dashboard:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to retrieve system dashboard data'
        });
    }
}

/**
 * UC25: GET SYSTEM REPORTS
 * ===============================
 * Generate and retrieve system-wide reports
 * 
 * @route GET /api/admin/reports
 * @access Private - Admin only
 * @param {string} type - Report type (users, devices, sensors, watering)
 * @param {string} period - Time period (day, week, month, year)
 * @returns {Object} Report data
 */
async function getSystemReports(req, res) {
    try {
        const { type, period, format } = req.query;
        
        // Validate parameters
        const validTypes = ['users', 'devices', 'sensors', 'watering'];
        const validPeriods = ['day', 'week', 'month', 'year'];
        const validFormats = ['json', 'csv'];
        
        if (!type || !validTypes.includes(type)) {
            return res.status(400).json({
                success: false,
                error: `Invalid report type. Valid types: ${validTypes.join(', ')}`
            });
        }
        
        if (!period || !validPeriods.includes(period)) {
            return res.status(400).json({
                success: false,
                error: `Invalid period. Valid periods: ${validPeriods.join(', ')}`
            });
        }
        
        if (format && !validFormats.includes(format)) {
            return res.status(400).json({
                success: false,
                error: `Invalid format. Valid formats: ${validFormats.join(', ')}`
            });
        }
        
        // Generate report based on type and period
        let reportData;
        
        switch (type) {
            case 'users':
                reportData = await generateUserReport(period);
                break;
            case 'devices':
                reportData = await generateDeviceReport(period);
                break;
            case 'sensors':
                reportData = await generateSensorReport(period);
                break;
            case 'watering':
                reportData = await generateWateringReport(period);
                break;
            default:
                return res.status(400).json({
                    success: false,
                    error: 'Invalid report type'
                });
        }
        
        // Log admin action
        await SystemLog.create({
            log_level: 'INFO',
            source: 'AdminController',
            message: `Admin ${req.user.user_id} generated ${type} report for ${period}`,
            user_id: req.user.user_id
        });
        
        // Return report in requested format
        if (format === 'csv') {
            // Convert report data to CSV
            const csv = convertToCSV(reportData);
            
            // Set headers for file download
            res.setHeader('Content-Type', 'text/csv');
            res.setHeader('Content-Disposition', `attachment; filename=${type}-report-${period}.csv`);
            
            return res.send(csv);
        }
        
        res.status(200).json({
            success: true,
            data: {
                type,
                period,
                generatedAt: new Date().toISOString(),
                report: reportData
            }
        });
    } catch (error) {
        console.error('Error generating system report:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to generate system report'
        });
    }
}

/**
 * Generate user report
 * @param {string} period - Time period
 * @returns {Array} Report data
 */
async function generateUserReport(period) {
    // Implementation would vary based on database structure
    // This is a simplified example
    let timeFrame;
    
    switch (period) {
        case 'day':
            timeFrame = 'created_at >= NOW() - INTERVAL \'1 day\'';
            break;
        case 'week':
            timeFrame = 'created_at >= NOW() - INTERVAL \'7 days\'';
            break;
        case 'month':
            timeFrame = 'created_at >= NOW() - INTERVAL \'30 days\'';
            break;
        case 'year':
            timeFrame = 'created_at >= NOW() - INTERVAL \'365 days\'';
            break;
        default:
            timeFrame = '';
    }
    
    // Example query - would need to be adjusted for your schema
    const query = `
        SELECT 
            DATE(created_at) as date, 
            COUNT(*) as new_users,
            SUM(CASE WHEN role = 'Premium' THEN 1 ELSE 0 END) as new_premium_users
        FROM 
            users
        WHERE 
            ${timeFrame}
        GROUP BY 
            DATE(created_at)
        ORDER BY 
            date
    `;
    
    const result = await pool.query(query);
    return result.rows;
}

/**
 * Generate device report
 * @param {string} period - Time period
 * @returns {Array} Report data
 */
async function generateDeviceReport(period) {
    // Simplified implementation
    const query = `
        SELECT 
            COUNT(*) as total_devices,
            SUM(CASE WHEN last_online >= NOW() - INTERVAL '1 hour' THEN 1 ELSE 0 END) as active_devices,
            SUM(CASE WHEN last_online < NOW() - INTERVAL '7 days' THEN 1 ELSE 0 END) as inactive_devices
        FROM 
            devices
    `;
    
    const result = await pool.query(query);
    return result.rows;
}

/**
 * Generate sensor report
 * @param {string} period - Time period
 * @returns {Array} Report data
 */
async function generateSensorReport(period) {
    // Simplified implementation
    let interval;
    
    switch (period) {
        case 'day':
            interval = '1 hour';
            break;
        case 'week':
            interval = '1 day';
            break;
        case 'month':
            interval = '1 day';
            break;
        case 'year':
            interval = '1 month';
            break;
        default:
            interval = '1 day';
    }
    
    const query = `
        SELECT 
            time_bucket('${interval}', timestamp) AS time_interval,
            COUNT(*) as reading_count,
            AVG(soil_moisture) as avg_soil_moisture,
            AVG(temperature) as avg_temperature,
            AVG(humidity) as avg_humidity
        FROM 
            sensor_data
        WHERE 
            timestamp >= NOW() - INTERVAL '${period}'
        GROUP BY 
            time_interval
        ORDER BY 
            time_interval
    `;
    
    const result = await pool.query(query);
    return result.rows;
}

/**
 * Generate watering report
 * @param {string} period - Time period
 * @returns {Array} Report data
 */
async function generateWateringReport(period) {
    // Simplified implementation
    let timeFrame;
    
    switch (period) {
        case 'day':
            timeFrame = 'timestamp >= NOW() - INTERVAL \'1 day\'';
            break;
        case 'week':
            timeFrame = 'timestamp >= NOW() - INTERVAL \'7 days\'';
            break;
        case 'month':
            timeFrame = 'timestamp >= NOW() - INTERVAL \'30 days\'';
            break;
        case 'year':
            timeFrame = 'timestamp >= NOW() - INTERVAL \'365 days\'';
            break;
        default:
            timeFrame = '';
    }
    
    const query = `
        SELECT 
            DATE(timestamp) as date,
            COUNT(*) as watering_count,
            SUM(CASE WHEN watering_type = 'manual' THEN 1 ELSE 0 END) as manual_count,
            SUM(CASE WHEN watering_type = 'automatic' THEN 1 ELSE 0 END) as auto_count,
            AVG(duration_seconds) as avg_duration,
            SUM(water_amount_ml) as total_water_amount
        FROM 
            watering_history
        WHERE 
            ${timeFrame}
        GROUP BY 
            date
        ORDER BY 
            date
    `;
    
    const result = await pool.query(query);
    return result.rows;
}

/**
 * Convert data to CSV format
 * @param {Array} data - Array of objects to convert
 * @returns {string} CSV formatted string
 */
function convertToCSV(data) {
    if (!data || data.length === 0) return '';
    
    // Get headers from first object keys
    const headers = Object.keys(data[0]);
    
    // Create CSV header row
    let csv = headers.join(',') + '\n';
    
    // Add data rows
    data.forEach(row => {
        const values = headers.map(header => {
            const value = row[header] || '';
            // Handle values with commas by quoting
            return typeof value === 'string' && value.includes(',') 
                ? `"${value}"` 
                : value;
        });
        csv += values.join(',') + '\n';
    });
    
    return csv;
}

/**
 * UC26: GET SYSTEM SETTINGS
 * ===============================
 * Retrieve current system configuration settings
 * 
 * @route GET /api/admin/settings
 * @access Private - Admin only
 * @returns {Object} Current system settings
 */
async function getSystemSettings(req, res) {
    try {
        // In a real app, this would retrieve settings from a database table
        // For this example, we'll use a simplified approach
        
        // Query settings from database
        const query = `
            SELECT key, value, data_type, description
            FROM system_settings
            ORDER BY key
        `;
        
        let settings;
        try {
            const result = await pool.query(query);
            settings = result.rows;
        } catch (error) {
            console.error('Error querying system settings:', error);
            // Fallback to default settings
            settings = getDefaultSettings();
        }
        
        // Convert string values to proper data types based on data_type
        const formattedSettings = settings.map(setting => {
            let value = setting.value;
            
            switch (setting.data_type) {
                case 'number':
                    value = parseFloat(value);
                    break;
                case 'boolean':
                    value = value === 'true';
                    break;
                case 'json':
                    try {
                        value = JSON.parse(value);
                    } catch (e) {
                        value = {};
                    }
                    break;
                // string and other types stay as is
            }
            
            return {
                key: setting.key,
                value,
                data_type: setting.data_type,
                description: setting.description
            };
        });
        
        // Group settings by category
        const groupedSettings = {};
        formattedSettings.forEach(setting => {
            const category = setting.key.split('.')[0];
            if (!groupedSettings[category]) {
                groupedSettings[category] = [];
            }
            groupedSettings[category].push(setting);
        });
        
        // Log admin action
        await SystemLog.create({
            log_level: 'INFO',
            source: 'AdminController',
            message: `Admin ${req.user.user_id} viewed system settings`,
            user_id: req.user.user_id
        });
        
        res.status(200).json({
            success: true,
            data: groupedSettings
        });
    } catch (error) {
        console.error('Error retrieving system settings:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to retrieve system settings'
        });
    }
}

/**
 * Get default system settings
 * @returns {Array} Default system settings
 */
function getDefaultSettings() {
    return [
        {
            key: 'system.name',
            value: 'Plant Monitoring System',
            data_type: 'string',
            description: 'System name displayed in UI and emails'
        },
        {
            key: 'system.version',
            value: '1.0.0',
            data_type: 'string',
            description: 'Current system version'
        },
        {
            key: 'system.maintenance_mode',
            value: 'false',
            data_type: 'boolean',
            description: 'Enable system maintenance mode'
        },
        {
            key: 'notifications.email_enabled',
            value: 'true',
            data_type: 'boolean',
            description: 'Enable email notifications'
        },
        {
            key: 'notifications.push_enabled',
            value: 'true',
            data_type: 'boolean',
            description: 'Enable push notifications'
        },
        {
            key: 'sensors.reading_interval',
            value: '300',
            data_type: 'number',
            description: 'Sensor reading interval in seconds'
        },
        {
            key: 'watering.default_duration',
            value: '10',
            data_type: 'number',
            description: 'Default watering duration in seconds'
        },
        {
            key: 'watering.default_threshold',
            value: '30',
            data_type: 'number',
            description: 'Default soil moisture threshold for automatic watering'
        },
        {
            key: 'security.max_login_attempts',
            value: '5',
            data_type: 'number',
            description: 'Maximum number of failed login attempts before lockout'
        },
        {
            key: 'security.lockout_duration',
            value: '1800',
            data_type: 'number',
            description: 'Account lockout duration in seconds'
        },
        {
            key: 'payment.subscription_fee',
            value: '9.99',
            data_type: 'number',
            description: 'Monthly subscription fee for Premium accounts'
        },
        {
            key: 'language.default',
            value: 'en',
            data_type: 'string',
            description: 'Default system language'
        },
        {
            key: 'language.available',
            value: '["en","vi","fr","es","de"]',
            data_type: 'json',
            description: 'Available system languages'
        }
    ];
}

/**
 * UC26: UPDATE SYSTEM SETTINGS
 * ===============================
 * Update system configuration settings
 * 
 * @route PUT /api/admin/settings
 * @access Private - Admin only
 * @returns {Object} Updated system settings
 */
async function updateSystemSettings(req, res) {
    try {
        const { settings } = req.body;
        
        if (!settings || !Array.isArray(settings)) {
            return res.status(400).json({
                success: false,
                error: 'Settings array is required'
            });
        }
        
        const updatedSettings = [];
        const failedSettings = [];
        
        // Process each setting update
        for (const setting of settings) {
            if (!setting.key || setting.value === undefined) {
                failedSettings.push({
                    key: setting.key || 'unknown',
                    reason: 'Missing key or value'
                });
                continue;
            }
            
            try {
                // In a real app, this would update settings in a database table
                const query = `
                    UPDATE system_settings
                    SET value = $1
                    WHERE key = $2
                    RETURNING key, value, data_type
                `;
                
                // Convert value to string for storage
                const stringValue = typeof setting.value === 'object' 
                    ? JSON.stringify(setting.value) 
                    : String(setting.value);
                
                const result = await pool.query(query, [stringValue, setting.key]);
                
                if (result.rowCount > 0) {
                    updatedSettings.push(result.rows[0]);
                } else {
                    // Setting doesn't exist, create it
                    const insertQuery = `
                        INSERT INTO system_settings (key, value, data_type, description)
                        VALUES ($1, $2, $3, $4)
                        RETURNING key, value, data_type
                    `;
                    
                    const dataType = typeof setting.value;
                    const description = setting.description || `Setting for ${setting.key}`;
                    
                    const insertResult = await pool.query(
                        insertQuery, 
                        [setting.key, stringValue, dataType, description]
                    );
                    
                    updatedSettings.push(insertResult.rows[0]);
                }
            } catch (error) {
                console.error(`Error updating setting ${setting.key}:`, error);
                failedSettings.push({
                    key: setting.key,
                    reason: 'Database error'
                });
            }
        }
        
        // Log admin action
        await SystemLog.create({
            log_level: 'WARNING',
            source: 'AdminController',
            message: `Admin ${req.user.user_id} updated system settings (${updatedSettings.length} updated, ${failedSettings.length} failed)`,
            user_id: req.user.user_id,
            details: JSON.stringify({
                updated: updatedSettings.map(s => s.key),
                failed: failedSettings.map(s => s.key)
            })
        });
        
        res.status(200).json({
            success: true,
            message: `${updatedSettings.length} settings updated successfully`,
            data: {
                updated: updatedSettings,
                failed: failedSettings
            }
        });
    } catch (error) {
        console.error('Error updating system settings:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to update system settings'
        });
    }
}

/**
 * UC27: GET SYSTEM LOGS
 * ===============================
 * Retrieve system logs with filtering and pagination
 * 
 * @route GET /api/admin/logs
 * @access Private - Admin only
 * @param {string} level - Log level filter (INFO, WARN, ERROR)
 * @param {string} source - Source filter
 * @param {string} startDate - Start date filter
 * @param {string} endDate - End date filter
 * @param {number} page - Page number
 * @param {number} limit - Items per page
 * @returns {Object} Paginated system logs
 */
async function getSystemLogs(req, res) {
    try {
        const { 
            level, 
            source, 
            startDate, 
            endDate, 
            search,
            user_id,
            page = 1, 
            limit = 50 
        } = req.query;
        
        const filters = {};
        if (level) filters.log_level = level;
        if (source) filters.source = source;
        if (startDate) filters.startDate = new Date(startDate);
        if (endDate) filters.endDate = new Date(endDate);
        if (search) filters.search = search;
        if (user_id) filters.user_id = parseInt(user_id);
        
        const logs = await SystemLog.findAll({
            ...filters,
            limit: parseInt(limit),
            offset: (parseInt(page) - 1) * parseInt(limit),
            orderBy: 'timestamp DESC'
        });
        
        const totalCount = await SystemLog.countAll(filters);
        
        // Get available log levels and sources for filtering
        const [levels, sources] = await Promise.all([
            SystemLog.getDistinctValues('log_level'),
            SystemLog.getDistinctValues('source')
        ]);
        
        // Log admin action (but not for log viewing to prevent recursion)
        /* await SystemLog.create({
            log_level: 'INFO',
            source: 'AdminController',
            message: `Admin ${req.user.user_id} viewed system logs`,
            user_id: req.user.user_id
        }); */
        
        res.status(200).json({
            success: true,
            data: {
                logs,
                filters: {
                    levels,
                    sources
                },
                pagination: {
                    total: totalCount,
                    page: parseInt(page),
                    limit: parseInt(limit),
                    pages: Math.ceil(totalCount / limit)
                }
            }
        });
    } catch (error) {
        console.error('Error retrieving system logs:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to retrieve system logs'
        });
    }
}

/**
 * UC27: DELETE SYSTEM LOGS
 * ===============================
 * Delete system logs matching specified criteria
 * 
 * @route DELETE /api/admin/logs
 * @access Private - Admin only
 * @param {string} level - Log level filter
 * @param {string} source - Source filter
 * @param {string} before - Delete logs before this date
 * @returns {Object} Deletion results
 */
async function deleteSystemLogs(req, res) {
    try {
        const { level, source, before } = req.body;
        
        if (!level && !source && !before) {
            return res.status(400).json({
                success: false,
                error: 'At least one filter (level, source, or before) is required'
            });
        }
        
        const filters = {};
        if (level) filters.log_level = level;
        if (source) filters.source = source;
        if (before) filters.before = new Date(before);
        
        // Get count of logs to be deleted for audit
        const countToDelete = await SystemLog.countAll(filters);
        
        // Delete logs
        const deletedCount = await SystemLog.deleteAll(filters);
        
        // Log admin action
        await SystemLog.create({
            log_level: 'WARNING',
            source: 'AdminController',
            message: `Admin ${req.user.user_id} deleted ${deletedCount} system logs`,
            user_id: req.user.user_id,
            details: JSON.stringify({
                filters,
                countToDelete,
                actuallyDeleted: deletedCount
            })
        });
        
        res.status(200).json({
            success: true,
            message: `${deletedCount} logs deleted successfully`,
            data: {
                deletedCount
            }
        });
    } catch (error) {
        console.error('Error deleting system logs:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to delete system logs'
        });
    }
}

/**
 * UC28: BACKUP DATABASE
 * ===============================
 * Create a database backup
 * 
 * @route POST /api/admin/backup
 * @access Private - Admin only
 * @returns {Object} Backup information
 */
async function backupDatabase(req, res) {
    try {
        // Create backup directory if it doesn't exist
        const backupDir = path.join(__dirname, '../backups');
        if (!fs.existsSync(backupDir)) {
            fs.mkdirSync(backupDir, { recursive: true });
        }
        
        // Generate backup filename with timestamp
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        const backupFilename = `backup-${timestamp}.sql`;
        const backupPath = path.join(backupDir, backupFilename);
        
        // Get database configuration from environment variables
        const dbConfig = {
            host: process.env.DB_HOST || 'localhost',
            port: process.env.DB_PORT || '5432',
            database: process.env.DB_NAME,
            user: process.env.DB_USER,
            password: process.env.DB_PASSWORD
        };
        
        // Command to create database dump
        const pgDumpCmd = `pg_dump -h ${dbConfig.host} -p ${dbConfig.port} -U ${dbConfig.user} -F c -b -v -f "${backupPath}" ${dbConfig.database}`;
        
        // Set PGPASSWORD environment variable for pg_dump
        process.env.PGPASSWORD = dbConfig.password;
        
        // Execute pg_dump command
        await execPromise(pgDumpCmd);
        
        // Reset PGPASSWORD
        delete process.env.PGPASSWORD;
        
        // Get file stats
        const stats = fs.statSync(backupPath);
        const fileSizeInMB = (stats.size / (1024 * 1024)).toFixed(2);
        
        // Log admin action
        await SystemLog.create({
            log_level: 'INFO',
            source: 'AdminController',
            message: `Admin ${req.user.user_id} created database backup: ${backupFilename} (${fileSizeInMB} MB)`,
            user_id: req.user.user_id
        });
        
        res.status(200).json({
            success: true,
            message: 'Database backup created successfully',
            data: {
                filename: backupFilename,
                path: backupPath,
                timestamp: timestamp,
                size: `${fileSizeInMB} MB`
            }
        });
    } catch (error) {
        console.error('Error creating database backup:', error);
        
        // Reset PGPASSWORD if there was an error
        delete process.env.PGPASSWORD;
        
        res.status(500).json({
            success: false,
            error: 'Failed to create database backup',
            details: error.message
        });
    }
}

/**
 * UC28: LIST BACKUPS
 * ===============================
 * List available database backups
 * 
 * @route GET /api/admin/backups
 * @access Private - Admin only
 * @returns {Object} List of available backups
 */
async function listBackups(req, res) {
    try {
        const backupDir = path.join(__dirname, '../backups');
        
        // Create backup directory if it doesn't exist
        if (!fs.existsSync(backupDir)) {
            fs.mkdirSync(backupDir, { recursive: true });
        }
        
        // Read backup directory
        const files = fs.readdirSync(backupDir);
        
        // Filter for backup files and get their stats
        const backups = files
            .filter(file => file.startsWith('backup-') && file.endsWith('.sql'))
            .map(file => {
                const filePath = path.join(backupDir, file);
                const stats = fs.statSync(filePath);
                
                return {
                    filename: file,
                    path: filePath,
                    timestamp: stats.mtime,
                    size: (stats.size / (1024 * 1024)).toFixed(2) + ' MB'
                };
            })
            .sort((a, b) => b.timestamp - a.timestamp); // Sort by date, newest first
        
        res.status(200).json({
            success: true,
            data: {
                backups,
                count: backups.length
            }
        });
    } catch (error) {
        console.error('Error listing backups:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to list database backups'
        });
    }
}

/**
 * UC28: RESTORE DATABASE
 * ===============================
 * Restore database from a backup
 * 
 * @route POST /api/admin/restore
 * @access Private - Admin only
 * @param {string} filename - Backup filename to restore
 * @returns {Object} Restore results
 */
async function restoreDatabase(req, res) {
    try {
        const { filename } = req.body;
        
        if (!filename) {
            return res.status(400).json({
                success: false,
                error: 'Backup filename is required'
            });
        }
        
        const backupDir = path.join(__dirname, '../backups');
        const backupPath = path.join(backupDir, filename);
        
        // Check if backup file exists
        if (!fs.existsSync(backupPath)) {
            return res.status(404).json({
                success: false,
                error: 'Backup file not found'
            });
        }
        
        // Get database configuration from environment variables
        const dbConfig = {
            host: process.env.DB_HOST || 'localhost',
            port: process.env.DB_PORT || '5432',
            database: process.env.DB_NAME,
            user: process.env.DB_USER,
            password: process.env.DB_PASSWORD
        };
        
        // Command to restore database from backup
        const pgRestoreCmd = `pg_restore -h ${dbConfig.host} -p ${dbConfig.port} -U ${dbConfig.user} -d ${dbConfig.database} -c -v "${backupPath}"`;
        
        // Set PGPASSWORD environment variable for pg_restore
        process.env.PGPASSWORD = dbConfig.password;
        
        // Execute pg_restore command
        await execPromise(pgRestoreCmd);
        
        // Reset PGPASSWORD
        delete process.env.PGPASSWORD;
        
        // Log admin action
        await SystemLog.create({
            log_level: 'WARNING',
            source: 'AdminController',
            message: `Admin ${req.user.user_id} restored database from backup: ${filename}`,
            user_id: req.user.user_id
        });
        
        res.status(200).json({
            success: true,
            message: 'Database restored successfully',
            data: {
                filename,
                timestamp: new Date().toISOString()
            }
        });
    } catch (error) {
        console.error('Error restoring database:', error);
        
        // Reset PGPASSWORD if there was an error
        delete process.env.PGPASSWORD;
        
        res.status(500).json({
            success: false,
            error: 'Failed to restore database',
            details: error.message
        });
    }
}

/**
 * UC31: GET LANGUAGE SETTINGS
 * ===============================
 * Retrieve language settings and available translations
 * 
 * @route GET /api/admin/languages
 * @access Private - Admin only
 * @returns {Object} Language settings and available translations
 */
async function getLanguageSettings(req, res) {
    try {
        // In a real app, this would retrieve language settings from database
        // For this example, we'll use a simplified approach
        
        // Get default language from system settings
        const defaultLangQuery = `
            SELECT value FROM system_settings
            WHERE key = 'language.default'
            LIMIT 1
        `;
        
        const availableLangQuery = `
            SELECT value FROM system_settings
            WHERE key = 'language.available'
            LIMIT 1
        `;
        
        // Execute queries
        const [defaultLangResult, availableLangResult] = await Promise.all([
            pool.query(defaultLangQuery),
            pool.query(availableLangQuery)
        ]);
        
        // Extract results
        const defaultLanguage = defaultLangResult.rows.length > 0
            ? defaultLangResult.rows[0].value
            : 'en';
            
        let availableLanguages = [];
        if (availableLangResult.rows.length > 0) {
            try {
                availableLanguages = JSON.parse(availableLangResult.rows[0].value);
            } catch (e) {
                availableLanguages = ['en'];
            }
        } else {
            availableLanguages = ['en'];
        }
        
        // Get languages from translation files
        const translationsDir = path.join(__dirname, '../i18n');
        let translations = {};
        
        if (fs.existsSync(translationsDir)) {
            // Read translation files
            for (const lang of availableLanguages) {
                const langFilePath = path.join(translationsDir, `${lang}.json`);
                if (fs.existsSync(langFilePath)) {
                    try {
                        const content = fs.readFileSync(langFilePath, 'utf8');
                        translations[lang] = JSON.parse(content);
                    } catch (e) {
                        console.error(`Error reading translation file for ${lang}:`, e);
                        translations[lang] = { error: 'Failed to load translations' };
                    }
                } else {
                    translations[lang] = { error: 'Translation file not found' };
                }
            }
        }
        
        // Get language usage statistics
        const langUsageQuery = `
            SELECT language_preference, COUNT(*) as user_count
            FROM users
            GROUP BY language_preference
            ORDER BY user_count DESC
        `;
        
        const langUsageResult = await pool.query(langUsageQuery);
        const languageUsage = langUsageResult.rows;
        
        res.status(200).json({
            success: true,
            data: {
                defaultLanguage,
                availableLanguages,
                languageUsage,
                translationStatus: Object.keys(translations).map(lang => ({
                    language: lang,
                    keyCount: Object.keys(translations[lang] || {}).length,
                    complete: !translations[lang]?.error
                }))
            }
        });
    } catch (error) {
        console.error('Error retrieving language settings:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to retrieve language settings'
        });
    }
}

/**
 * UC31: UPDATE LANGUAGE SETTINGS
 * ===============================
 * Update system language settings
 * 
 * @route PUT /api/admin/languages
 * @access Private - Admin only
 * @param {string} defaultLanguage - New default language
 * @returns {Object} Updated language settings
 */
async function updateLanguageSettings(req, res) {
    try {
        const { defaultLanguage, availableLanguages } = req.body;
        
        if (!defaultLanguage) {
            return res.status(400).json({
                success: false,
                error: 'Default language is required'
            });
        }
        
        // Update default language in system settings
        const updateDefaultQuery = `
            UPDATE system_settings
            SET value = $1
            WHERE key = 'language.default'
            RETURNING key, value
        `;
        
        const updateDefaultResult = await pool.query(updateDefaultQuery, [defaultLanguage]);
        
        // Update available languages if provided
        let updateAvailableResult = null;
        if (Array.isArray(availableLanguages) && availableLanguages.length > 0) {
            const updateAvailableQuery = `
                UPDATE system_settings
                SET value = $1
                WHERE key = 'language.available'
                RETURNING key, value
            `;
            
            updateAvailableResult = await pool.query(
                updateAvailableQuery, 
                [JSON.stringify(availableLanguages)]
            );
        }
        
        // Log admin action
        await SystemLog.create({
            log_level: 'INFO',
            source: 'AdminController',
            message: `Admin ${req.user.user_id} updated language settings: default=${defaultLanguage}`,
            user_id: req.user.user_id,
            details: JSON.stringify({
                defaultLanguage,
                availableLanguages: availableLanguages || 'unchanged'
            })
        });
        
        res.status(200).json({
            success: true,
            message: 'Language settings updated successfully',
            data: {
                defaultLanguage,
                availableLanguages: availableLanguages || undefined
            }
        });
    } catch (error) {
        console.error('Error updating language settings:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to update language settings'
        });
    }
}

/**
 * UC31: UPDATE TRANSLATIONS
 * ===============================
 * Update translation files for a specific language
 * 
 * @route PUT /api/admin/languages/:language/translations
 * @access Private - Admin only
 * @param {string} language - Language code to update
 * @param {Object} translations - Translation key-value pairs
 * @returns {Object} Update results
 */
async function updateTranslations(req, res) {
    try {
        const { language } = req.params;
        const { translations } = req.body;
        
        if (!language) {
            return res.status(400).json({
                success: false,
                error: 'Language code is required'
            });
        }
        
        if (!translations || typeof translations !== 'object') {
            return res.status(400).json({
                success: false,
                error: 'Translations object is required'
            });
        }
        
        // Create i18n directory if it doesn't exist
        const translationsDir = path.join(__dirname, '../i18n');
        if (!fs.existsSync(translationsDir)) {
            fs.mkdirSync(translationsDir, { recursive: true });
        }
        
        // Path to the translation file
        const langFilePath = path.join(translationsDir, `${language}.json`);
        
        // Read existing translations if file exists
        let existingTranslations = {};
        if (fs.existsSync(langFilePath)) {
            try {
                const content = fs.readFileSync(langFilePath, 'utf8');
                existingTranslations = JSON.parse(content);
            } catch (e) {
                console.error(`Error reading existing translations for ${language}:`, e);
            }
        }
        
        // Merge existing with new translations
        const mergedTranslations = {
            ...existingTranslations,
            ...translations
        };
        
        // Write updated translations to file
        fs.writeFileSync(
            langFilePath,
            JSON.stringify(mergedTranslations, null, 2),
            'utf8'
        );
        
        // Log admin action
        await SystemLog.create({
            log_level: 'INFO',
            source: 'AdminController',
            message: `Admin ${req.user.user_id} updated translations for ${language} (${Object.keys(translations).length} keys)`,
            user_id: req.user.user_id,
            details: JSON.stringify({
                language,
                updatedKeys: Object.keys(translations).length,
                totalKeys: Object.keys(mergedTranslations).length
            })
        });
        
        res.status(200).json({
            success: true,
            message: `Translations for ${language} updated successfully`,
            data: {
                language,
                updatedKeys: Object.keys(translations).length,
                totalKeys: Object.keys(mergedTranslations).length
            }
        });
    } catch (error) {
        console.error(`Error updating translations for ${req.params.language}:`, error);
        res.status(500).json({
            success: false,
            error: 'Failed to update translations'
        });
    }
}

/**
 * Helper: Get financial metrics
 * @returns {Object} Financial metrics data
 */
async function getFinancialMetrics() {
    try {
        // Get revenue data
        const revenueQuery = `
            SELECT 
                COUNT(*) as total_payments,
                SUM(CASE WHEN status = 'completed' THEN amount ELSE 0 END) as total_revenue,
                SUM(CASE WHEN status = 'completed' AND created_at >= NOW() - INTERVAL '30 days' THEN amount ELSE 0 END) as monthly_revenue,
                SUM(CASE WHEN status = 'completed' AND created_at >= NOW() - INTERVAL '7 days' THEN amount ELSE 0 END) as weekly_revenue,
                SUM(CASE WHEN status = 'completed' AND DATE(created_at) = CURRENT_DATE THEN amount ELSE 0 END) as daily_revenue
            FROM payments
        `;
        
        const revenueResult = await pool.query(revenueQuery);
        const revenue = revenueResult.rows[0];

        // Get revenue trend (last 30 days)
        const trendQuery = `
            SELECT 
                DATE(created_at) as date,
                SUM(CASE WHEN status = 'completed' THEN amount ELSE 0 END) as daily_revenue,
                COUNT(*) as daily_transactions
            FROM payments
            WHERE created_at >= NOW() - INTERVAL '30 days'
            GROUP BY DATE(created_at)
            ORDER BY date
        `;
        
        const trendResult = await pool.query(trendQuery);
        const revenueTrend = trendResult.rows;

        // Calculate monthly recurring revenue (MRR)
        const mrrQuery = `
            SELECT COUNT(*) * 9.99 as estimated_mrr
            FROM users 
            WHERE role = 'Premium' 
            AND updated_at >= NOW() - INTERVAL '30 days'
        `;
        
        const mrrResult = await pool.query(mrrQuery);
        const mrr = mrrResult.rows[0].estimated_mrr || 0;

        // Get payment statistics
        const paymentStatsQuery = `
            SELECT 
                status,
                COUNT(*) as count,
                SUM(amount) as total_amount
            FROM payments
            WHERE created_at >= NOW() - INTERVAL '30 days'
            GROUP BY status
        `;
        
        const paymentStatsResult = await pool.query(paymentStatsQuery);
        const paymentStats = paymentStatsResult.rows;

        return {
            totalRevenue: parseFloat(revenue.total_revenue) || 0,
            monthlyRevenue: parseFloat(revenue.monthly_revenue) || 0,
            weeklyRevenue: parseFloat(revenue.weekly_revenue) || 0,
            dailyRevenue: parseFloat(revenue.daily_revenue) || 0,
            totalPayments: parseInt(revenue.total_payments) || 0,
            monthlyRecurringRevenue: parseFloat(mrr) || 0,
            revenueTrend,
            paymentStats
        };
    } catch (error) {
        console.error('Error getting financial metrics:', error);
        return {
            totalRevenue: 0,
            monthlyRevenue: 0,
            weeklyRevenue: 0,
            dailyRevenue: 0,
            totalPayments: 0,
            monthlyRecurringRevenue: 0,
            revenueTrend: [],
            paymentStats: [],
            error: 'Failed to load financial data'
        };
    }
}

/**
 * Helper: Get user growth data
 * @returns {Array} User growth data for the last 7 days
 */
async function getUserGrowthData() {
    try {
        const query = `
            SELECT 
                DATE(created_at) as date,
                COUNT(*) as new_users,
                SUM(CASE WHEN role = 'Premium' THEN 1 ELSE 0 END) as new_premium_users
            FROM users
            WHERE created_at >= NOW() - INTERVAL '7 days'
            GROUP BY DATE(created_at)
            ORDER BY date
        `;
        
        const result = await pool.query(query);
        return result.rows;
    } catch (error) {
        console.error('Error getting user growth data:', error);
        return [];
    }
}

/**
 * Helper: Get device statistics
 * @returns {Object} Device statistics
 */
async function getDeviceStatistics() {
    try {
        const statsQuery = `
            SELECT 
                device_type,
                COUNT(*) as total,
                SUM(CASE WHEN last_online >= NOW() - INTERVAL '1 hour' THEN 1 ELSE 0 END) as online,
                SUM(CASE WHEN last_online < NOW() - INTERVAL '24 hours' THEN 1 ELSE 0 END) as offline
            FROM devices
            GROUP BY device_type
        `;
        
        const result = await pool.query(statsQuery);
        return result.rows;
    } catch (error) {
        console.error('Error getting device statistics:', error);
        return [];
    }
}

/**
 * GET PROFIT ANALYSIS
 * ===============================
 * Get detailed profit analysis and financial reports
 * 
 * @route GET /api/admin/profit-analysis
 * @access Private - Admin only
 * @param {string} period - Time period (day, week, month, year)
 * @returns {Object} Detailed profit analysis
 */
async function getProfitAnalysis(req, res) {
    try {
        const { period = 'month' } = req.query;
        
        // Get comprehensive financial data
        const [
            revenueAnalysis,
            customerAnalysis,
            profitMargins,
            forecastData
        ] = await Promise.all([
            getRevenueAnalysis(period),
            getCustomerAnalysis(period),
            getProfitMargins(period),
            getRevenueForecast()
        ]);

        // Log admin access
        await SystemLog.create({
            log_level: 'INFO',
            source: 'AdminController',
            message: `Admin ${req.user.user_id} viewed profit analysis for ${period}`,
            user_id: req.user.user_id
        });

        res.status(200).json({
            success: true,
            data: {
                period,
                revenue: revenueAnalysis,
                customers: customerAnalysis,
                profitMargins,
                forecast: forecastData,
                generatedAt: new Date().toISOString()
            }
        });
    } catch (error) {
        console.error('Error getting profit analysis:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to retrieve profit analysis'
        });
    }
}

/**
 * Helper: Get revenue analysis
 */
async function getRevenueAnalysis(period) {
    try {
        let timeFrame, groupBy;
        
        switch (period) {
            case 'day':
                timeFrame = "created_at >= NOW() - INTERVAL '1 day'";
                groupBy = "date_trunc('hour', created_at)";
                break;
            case 'week':
                timeFrame = "created_at >= NOW() - INTERVAL '7 days'";
                groupBy = "DATE(created_at)";
                break;
            case 'month':
                timeFrame = "created_at >= NOW() - INTERVAL '30 days'";
                groupBy = "DATE(created_at)";
                break;
            case 'year':
                timeFrame = "created_at >= NOW() - INTERVAL '365 days'";
                groupBy = "date_trunc('month', created_at)";
                break;
            default:
                timeFrame = "created_at >= NOW() - INTERVAL '30 days'";
                groupBy = "DATE(created_at)";
        }

        const query = `
            SELECT 
                ${groupBy} as period,
                SUM(CASE WHEN status = 'completed' THEN amount ELSE 0 END) as revenue,
                COUNT(CASE WHEN status = 'completed' THEN 1 END) as successful_transactions,
                COUNT(*) as total_transactions,
                AVG(CASE WHEN status = 'completed' THEN amount END) as avg_transaction_value
            FROM payments
            WHERE ${timeFrame}
            GROUP BY ${groupBy}
            ORDER BY period
        `;
        
        const result = await pool.query(query);
        
        // Calculate growth rates
        const data = result.rows;
        let totalRevenue = 0;
        let totalTransactions = 0;
        
        for (const row of data) {
            totalRevenue += parseFloat(row.revenue) || 0;
            totalTransactions += parseInt(row.successful_transactions) || 0;
        }
        
        return {
            periodData: data,
            summary: {
                totalRevenue,
                totalTransactions,
                averageTransactionValue: totalTransactions > 0 ? totalRevenue / totalTransactions : 0,
                conversionRate: data.length > 0 ? 
                    (data.reduce((sum, d) => sum + parseInt(d.successful_transactions), 0) / 
                     data.reduce((sum, d) => sum + parseInt(d.total_transactions), 0) * 100) : 0
            }
        };
    } catch (error) {
        console.error('Error getting revenue analysis:', error);
        return { periodData: [], summary: { totalRevenue: 0, totalTransactions: 0, averageTransactionValue: 0, conversionRate: 0 } };
    }
}

/**
 * Helper: Get customer analysis
 */
async function getCustomerAnalysis(period) {
    try {
        let timeFrame;
        
        switch (period) {
            case 'day':
                timeFrame = "created_at >= NOW() - INTERVAL '1 day'";
                break;
            case 'week':
                timeFrame = "created_at >= NOW() - INTERVAL '7 days'";
                break;
            case 'month':
                timeFrame = "created_at >= NOW() - INTERVAL '30 days'";
                break;
            case 'year':
                timeFrame = "created_at >= NOW() - INTERVAL '365 days'";
                break;
            default:
                timeFrame = "created_at >= NOW() - INTERVAL '30 days'";
        }

        // Customer acquisition cost and lifetime value
        const query = `
            WITH customer_stats AS (
                SELECT 
                    u.user_id,
                    u.role,
                    u.created_at as signup_date,
                    COALESCE(SUM(CASE WHEN p.status = 'completed' THEN p.amount END), 0) as total_spent,
                    COUNT(CASE WHEN p.status = 'completed' THEN 1 END) as total_payments,
                    MAX(p.created_at) as last_payment
                FROM users u
                LEFT JOIN payments p ON u.user_id = p.user_id
                WHERE u.${timeFrame}
                GROUP BY u.user_id, u.role, u.created_at
            )
            SELECT 
                role,
                COUNT(*) as customer_count,
                AVG(total_spent) as avg_customer_value,
                SUM(total_spent) as total_customer_value,
                AVG(total_payments) as avg_payments_per_customer,
                COUNT(CASE WHEN total_spent > 0 THEN 1 END) as paying_customers,
                COUNT(CASE WHEN last_payment >= NOW() - INTERVAL '30 days' THEN 1 END) as active_customers
            FROM customer_stats
            GROUP BY role
        `;
        
        const result = await pool.query(query);
        
        // Calculate customer acquisition and retention metrics
        const totalCustomers = result.rows.reduce((sum, row) => sum + parseInt(row.customer_count), 0);
        const totalPayingCustomers = result.rows.reduce((sum, row) => sum + parseInt(row.paying_customers), 0);
        const conversionRate = totalCustomers > 0 ? (totalPayingCustomers / totalCustomers * 100) : 0;
        
        return {
            byRole: result.rows,
            summary: {
                totalCustomers,
                payingCustomers: totalPayingCustomers,
                conversionRate: conversionRate.toFixed(2),
                averageCustomerValue: result.rows.reduce((sum, row) => sum + parseFloat(row.avg_customer_value || 0), 0) / result.rows.length || 0
            }
        };
    } catch (error) {
        console.error('Error getting customer analysis:', error);
        return { byRole: [], summary: { totalCustomers: 0, payingCustomers: 0, conversionRate: 0, averageCustomerValue: 0 } };
    }
}

/**
 * Helper: Get profit margins
 */
async function getProfitMargins(period) {
    try {
        // Simplified profit margin calculation
        // In a real app, you'd factor in operational costs, server costs, etc.
        const operationalCostPerUser = 1.50; // Monthly cost per user
        const serverCosts = 500; // Monthly server costs
        
        const query = `
            SELECT 
                SUM(CASE WHEN status = 'completed' THEN amount ELSE 0 END) as total_revenue,
                COUNT(DISTINCT user_id) as unique_customers
            FROM payments
            WHERE created_at >= NOW() - INTERVAL '${period === 'year' ? '365' : '30'} days'
        `;
        
        const result = await pool.query(query);
        const { total_revenue, unique_customers } = result.rows[0];
        
        const revenue = parseFloat(total_revenue) || 0;
        const operationalCosts = (parseInt(unique_customers) || 0) * operationalCostPerUser;
        const totalCosts = operationalCosts + serverCosts;
        const grossProfit = revenue - totalCosts;
        const profitMargin = revenue > 0 ? ((grossProfit / revenue) * 100) : 0;
        
        return {
            revenue,
            operationalCosts,
            serverCosts,
            totalCosts,
            grossProfit,
            profitMargin: profitMargin.toFixed(2),
            revenuePerCustomer: unique_customers > 0 ? (revenue / unique_customers) : 0
        };
    } catch (error) {
        console.error('Error calculating profit margins:', error);
        return {
            revenue: 0,
            operationalCosts: 0,
            serverCosts: 0,
            totalCosts: 0,
            grossProfit: 0,
            profitMargin: 0,
            revenuePerCustomer: 0
        };
    }
}

/**
 * Helper: Get revenue forecast
 */
async function getRevenueForecast() {
    try {
        // Simple linear regression forecast based on last 30 days
        const query = `
            SELECT 
                DATE(created_at) as date,
                SUM(CASE WHEN status = 'completed' THEN amount ELSE 0 END) as daily_revenue
            FROM payments
            WHERE created_at >= NOW() - INTERVAL '30 days'
            GROUP BY DATE(created_at)
            ORDER BY date
        `;
        
        const result = await pool.query(query);
        const data = result.rows;
        
        if (data.length < 7) {
            return { forecast: [], confidence: 'low' };
        }
        
        // Calculate simple moving average for next 7 days
        const recentDays = data.slice(-7);
        const avgDailyRevenue = recentDays.reduce((sum, day) => sum + parseFloat(day.daily_revenue), 0) / 7;
        
        const forecast = [];
        const today = new Date();
        
        for (let i = 1; i <= 7; i++) {
            const forecastDate = new Date(today);
            forecastDate.setDate(today.getDate() + i);
            
            forecast.push({
                date: forecastDate.toISOString().split('T')[0],
                predictedRevenue: avgDailyRevenue.toFixed(2),
                confidence: 'medium'
            });
        }
        
        return {
            forecast,
            methodology: 'moving_average',
            basedOnDays: 7,
            averageDailyRevenue: avgDailyRevenue.toFixed(2)
        };
    } catch (error) {
        console.error('Error generating revenue forecast:', error);
        return { forecast: [], confidence: 'low' };
    }
}

/**
 * Helper: Check disk space
 * @returns {Object} Disk space information
 */
async function checkDiskSpace() {
    try {
        // On Linux/macOS
        if (process.platform !== 'win32') {
            const { stdout } = await execPromise('df -h / | tail -1');
            const parts = stdout.trim().split(/\s+/);
            
            return {
                total: parts[1],
                used: parts[2],
                free: parts[3],
                percentUsed: parseInt(parts[4]),
                percentFree: 100 - parseInt(parts[4])
            };
        }
        // On Windows
        else {
            const { stdout } = await execPromise('wmic logicaldisk get size,freespace,caption');
            const lines = stdout.trim().split('\n');
            const data = lines[1].trim().split(/\s+/);
            
            const freeSpace = parseInt(data[1]);
            const totalSize = parseInt(data[2]);
            const percentFree = (freeSpace / totalSize) * 100;
            
            return {
                total: `${Math.round(totalSize / (1024 * 1024 * 1024))} GB`,
                free: `${Math.round(freeSpace / (1024 * 1024 * 1024))} GB`,
                percentUsed: Math.round(100 - percentFree),
                percentFree: Math.round(percentFree)
            };
        }
    } catch (error) {
        console.error('Error checking disk space:', error);
        return {
            error: 'Failed to check disk space',
            details: error.message
        };
    }
}

module.exports = {
    // UC24: Manage Users
    getAllUsers,
    getUserById,
    createUser,
    updateUser,
    deleteUser,
    resetUserPassword,
    bulkUserActions,
    
    // UC25: View System-Wide Reports
    getSystemDashboard,
    getSystemReports,
    getProfitAnalysis,
    
    // UC26: Configure Global Settings
    getSystemSettings,
    updateSystemSettings,
    
    // UC27: Monitor System Logs
    getSystemLogs,
    deleteSystemLogs,
    
    // UC28: Backup and Restore Data
    backupDatabase,
    listBackups,
    restoreDatabase,
    
    // UC31: Manage Multi-Language Settings
    getLanguageSettings,
    updateLanguageSettings,
    updateTranslations
};
/**
 * Admin Controller - System Administration Functionality
 */

// Mock admin controller for testing
const adminController = {
    // UC24: User Management
    getAllUsers: async (req, res) => {
        try {
            res.status(200).json({
                success: true,
                data: [
                    {id: 1, email: 'admin@example.com', role: 'Admin'},
                    {id: 2, email: 'user@example.com', role: 'Regular'},
                    {id: 3, email: 'premium@example.com', role: 'Premium'}
                ]
            });
        } catch (error) {
            res.status(500).json({
                success: false,
                error: 'Error fetching users'
            });
        }
    },
    
    getUserById: async (req, res) => {
        try {
            res.status(200).json({
                success: true,
                data: {
                    id: req.params.userId,
                    email: 'user@example.com',
                    role: 'Regular'
                }
            });
        } catch (error) {
            res.status(500).json({
                success: false,
                error: 'Error fetching user'
            });
        }
    },
    
    // UC25: System Reports
    getSystemOverview: async (req, res) => {
        try {
            res.status(200).json({
                success: true,
                data: {
                    userCount: 100,
                    deviceCount: 50,
                    plantCount: 200,
                    activeDevices: 45,
                    storageUsed: '2.5GB'
                }
            });
        } catch (error) {
            res.status(500).json({
                success: false,
                error: 'Error fetching system overview'
            });
        }
    },
    
    getUserActivityReport: async (req, res) => {
        try {
            res.status(200).json({
                success: true,
                data: {
                    logins: 250,
                    apiCalls: 1200,
                    manualWatering: 85,
                    scheduledWatering: 320
                }
            });
        } catch (error) {
            res.status(500).json({
                success: false,
                error: 'Error fetching user activity report'
            });
        }
    },
    
    // UC26: Global Settings
    getAllSettings: async (req, res) => {
        try {
            res.status(200).json({
                success: true,
                data: {
                    maintenance_mode: false,
                    notification_default: true,
                    system_email: 'system@plantmonitor.com',
                    data_retention_days: 90
                }
            });
        } catch (error) {
            res.status(500).json({
                success: false,
                error: 'Error fetching settings'
            });
        }
    },
    
    updateSettings: async (req, res) => {
        try {
            res.status(200).json({
                success: true,
                data: {
                    ...req.body.settings,
                    updated_at: new Date().toISOString()
                }
            });
        } catch (error) {
            res.status(500).json({
                success: false,
                error: 'Error updating settings'
            });
        }
    },
    
    // UC27: System Logs
    getSystemLogs: async (req, res) => {
        try {
            res.status(200).json({
                success: true,
                data: [
                    {
                        id: 1, 
                        level: 'info', 
                        message: 'System started',
                        timestamp: '2023-10-08T10:00:00Z'
                    },
                    {
                        id: 2, 
                        level: 'error', 
                        message: 'Database connection failed',
                        timestamp: '2023-10-08T10:01:00Z'
                    }
                ]
            });
        } catch (error) {
            res.status(500).json({
                success: false,
                error: 'Error fetching system logs'
            });
        }
    },
    
    clearSystemLogs: async (req, res) => {
        try {
            res.status(200).json({
                success: true,
                data: {
                    clearedLogs: 150,
                    olderThan: req.body.olderThan
                }
            });
        } catch (error) {
            res.status(500).json({
                success: false,
                error: 'Error clearing system logs'
            });
        }
    },
    
    // UC28: Backup and Restore
    createBackup: async (req, res) => {
        try {
            res.status(200).json({
                success: true,
                data: {
                    backupId: `backup-${Date.now()}`,
                    timestamp: new Date().toISOString(),
                    size: '15MB',
                    location: 's3://backups/'
                }
            });
        } catch (error) {
            res.status(500).json({
                success: false,
                error: 'Error creating backup'
            });
        }
    },
    
    restoreFromBackup: async (req, res) => {
        try {
            res.status(200).json({
                success: true,
                data: {
                    backupId: req.body.backupId,
                    restored: true,
                    timestamp: new Date().toISOString()
                }
            });
        } catch (error) {
            res.status(500).json({
                success: false,
                error: 'Error restoring from backup'
            });
        }
    },
    
    // UC31: Multi-Language Settings
    getAllLanguages: async (req, res) => {
        try {
            res.status(200).json({
                success: true,
                data: [
                    {code: 'en', name: 'English', enabled: true, default: true},
                    {code: 'vi', name: 'Vietnamese', enabled: true, default: false},
                    {code: 'fr', name: 'French', enabled: false, default: false}
                ]
            });
        } catch (error) {
            res.status(500).json({
                success: false,
                error: 'Error fetching languages'
            });
        }
    },
    
    updateLanguageSettings: async (req, res) => {
        try {
            res.status(200).json({
                success: true,
                data: {
                    ...req.body.language,
                    updated_at: new Date().toISOString()
                }
            });
        } catch (error) {
            res.status(500).json({
                success: false,
                error: 'Error updating language settings'
            });
        }
    }
};

module.exports = { adminController };
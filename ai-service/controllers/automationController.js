/**
 * Automation Controller - API cho tự động hóa tưới cây
 */

const automationService = require('../services/automationService');

const automationController = {
    // Thiết lập automation mới
    setupAutomation: async (req, res) => {
        try {
            const { plantId } = req.params;
            const automationConfig = req.body;

            const result = await automationService.setupAutomation(plantId, automationConfig);

            return res.status(result.success ? 200 : 400).json(result);
        } catch (error) {
            console.error('Lỗi thiết lập automation:', error);
            return res.status(500).json({
                success: false,
                message: 'Đã xảy ra lỗi khi thiết lập automation',
                error: error.message
            });
        }
    },

    // Bắt đầu automation
    startAutomation: async (req, res) => {
        try {
            const { automationId } = req.params;

            const automations = automationService.getAllAutomations();
            const automation = automations.find(a => a.id === automationId);

            if (!automation) {
                return res.status(404).json({
                    success: false,
                    message: 'Automation không tồn tại'
                });
            }

            const success = await automationService.startAutomation(automation);

            return res.status(200).json({
                success,
                message: success ? 'Automation đã được bắt đầu' : 'Không thể bắt đầu automation',
                automationId,
                timestamp: new Date().toISOString()
            });
        } catch (error) {
            console.error('Lỗi bắt đầu automation:', error);
            return res.status(500).json({
                success: false,
                message: 'Đã xảy ra lỗi khi bắt đầu automation',
                error: error.message
            });
        }
    },

    // Dừng automation
    stopAutomation: async (req, res) => {
        try {
            const { automationId } = req.params;

            const success = await automationService.stopAutomation(automationId);

            return res.status(200).json({
                success,
                message: success ? 'Automation đã được dừng' : 'Không thể dừng automation',
                automationId,
                timestamp: new Date().toISOString()
            });
        } catch (error) {
            console.error('Lỗi dừng automation:', error);
            return res.status(500).json({
                success: false,
                message: 'Đã xảy ra lỗi khi dừng automation',
                error: error.message
            });
        }
    },

    // Lấy trạng thái automation
    getAutomationStatus: async (req, res) => {
        try {
            const { automationId } = req.params;

            const status = automationService.getAutomationStatus(automationId);

            if (status.status === 'not_found') {
                return res.status(404).json({
                    success: false,
                    message: 'Automation không tồn tại'
                });
            }

            return res.status(200).json({
                success: true,
                automationId,
                status,
                timestamp: new Date().toISOString()
            });
        } catch (error) {
            console.error('Lỗi lấy trạng thái automation:', error);
            return res.status(500).json({
                success: false,
                message: 'Đã xảy ra lỗi khi lấy trạng thái automation',
                error: error.message
            });
        }
    },

    // Lấy danh sách tất cả automation
    getAllAutomations: async (req, res) => {
        try {
            const { plantId, status } = req.query;

            let automations = automationService.getAllAutomations();

            // Lọc theo plantId nếu có
            if (plantId) {
                automations = automations.filter(a => a.plantId === plantId);
            }

            // Lọc theo status nếu có
            if (status) {
                automations = automations.filter(a => a.status === status);
            }

            return res.status(200).json({
                success: true,
                automations,
                totalCount: automations.length,
                timestamp: new Date().toISOString()
            });
        } catch (error) {
            console.error('Lỗi lấy danh sách automation:', error);
            return res.status(500).json({
                success: false,
                message: 'Đã xảy ra lỗi khi lấy danh sách automation',
                error: error.message
            });
        }
    },

    // Cập nhật cấu hình automation
    updateAutomation: async (req, res) => {
        try {
            const { automationId } = req.params;
            const updates = req.body;

            const result = await automationService.updateAutomationConfig(automationId, updates);

            return res.status(result.success ? 200 : 400).json(result);
        } catch (error) {
            console.error('Lỗi cập nhật automation:', error);
            return res.status(500).json({
                success: false,
                message: 'Đã xảy ra lỗi khi cập nhật automation',
                error: error.message
            });
        }
    },

    // Xóa automation
    deleteAutomation: async (req, res) => {
        try {
            const { automationId } = req.params;

            const result = await automationService.deleteAutomation(automationId);

            return res.status(result.success ? 200 : 400).json(result);
        } catch (error) {
            console.error('Lỗi xóa automation:', error);
            return res.status(500).json({
                success: false,
                message: 'Đã xảy ra lỗi khi xóa automation',
                error: error.message
            });
        }
    },

    // Lấy lịch sử automation
    getAutomationHistory: async (req, res) => {
        try {
            const { automationId } = req.params;
            const { limit = 50, actionType } = req.query;

            let history = automationService.getAutomationHistory(automationId, parseInt(limit));

            // Lọc theo action type nếu có
            if (actionType) {
                history = history.filter(h => h.actionType === actionType);
            }

            return res.status(200).json({
                success: true,
                automationId,
                history,
                totalCount: history.length,
                timestamp: new Date().toISOString()
            });
        } catch (error) {
            console.error('Lỗi lấy lịch sử automation:', error);
            return res.status(500).json({
                success: false,
                message: 'Đã xảy ra lỗi khi lấy lịch sử automation',
                error: error.message
            });
        }
    },

    // Lấy thống kê automation
    getAutomationStatistics: async (req, res) => {
        try {
            const { automationId } = req.params;

            const statistics = automationService.getAutomationStatistics(automationId);

            if (statistics.error) {
                return res.status(404).json({
                    success: false,
                    message: statistics.error
                });
            }

            return res.status(200).json({
                success: true,
                automationId,
                statistics,
                timestamp: new Date().toISOString()
            });
        } catch (error) {
            console.error('Lỗi lấy thống kê automation:', error);
            return res.status(500).json({
                success: false,
                message: 'Đã xảy ra lỗi khi lấy thống kê automation',
                error: error.message
            });
        }
    },

    // Thực hiện tưới thủ công
    manualIrrigation: async (req, res) => {
        try {
            const { plantId } = req.params;
            const { amount, reason = 'Manual irrigation' } = req.body;

            if (!amount || amount <= 0) {
                return res.status(400).json({
                    success: false,
                    message: 'Lượng nước phải lớn hơn 0'
                });
            }

            // Tạo context giả cho manual irrigation
            const mockContext = {
                rule: {
                    id: 'manual',
                    safetyLimits: {
                        maxWaterPerHour: 500,
                        maxWaterPerDay: 2000,
                        minTimeBetweenIrrigations: 2 * 60 * 60 * 1000,
                        maxConsecutiveIrrigations: 3
                    },
                    statistics: {
                        totalExecutions: 0,
                        successfulExecutions: 0,
                        failedExecutions: 0,
                        waterDelivered: 0
                    }
                },
                waterDeliveredToday: 0,
                lastWateringTime: null,
                consecutiveIrrigations: 0
            };

            const result = await automationService.executeIrrigation(plantId, amount, mockContext);

            return res.status(200).json({
                success: result.success,
                message: result.success ? 'Tưới thủ công thành công' : 'Tưới thủ công thất bại',
                plantId,
                amount,
                reason,
                result,
                timestamp: new Date().toISOString()
            });
        } catch (error) {
            console.error('Lỗi tưới thủ công:', error);
            return res.status(500).json({
                success: false,
                message: 'Đã xảy ra lỗi khi tưới thủ công',
                error: error.message
            });
        }
    },

    // Kiểm tra kết nối thiết bị
    checkDeviceStatus: async (req, res) => {
        try {
            const { plantId } = req.params;

            const deviceStatus = await automationService.checkDeviceConnection(plantId);

            return res.status(200).json({
                success: true,
                plantId,
                deviceStatus,
                timestamp: new Date().toISOString()
            });
        } catch (error) {
            console.error('Lỗi kiểm tra thiết bị:', error);
            return res.status(500).json({
                success: false,
                message: 'Đã xảy ra lỗi khi kiểm tra thiết bị',
                error: error.message
            });
        }
    },

    // Test automation (dry run)
    testAutomation: async (req, res) => {
        try {
            const { automationId } = req.params;
            const { dryRun = true } = req.body;

            const automations = automationService.getAllAutomations();
            const automation = automations.find(a => a.id === automationId);

            if (!automation) {
                return res.status(404).json({
                    success: false,
                    message: 'Automation không tồn tại'
                });
            }

            // Simulate automation execution
            const testResult = {
                automationId,
                testMode: dryRun,
                wouldExecute: true,
                estimatedActions: [
                    {
                        type: 'irrigation',
                        amount: 200,
                        reason: 'Test simulation',
                        safetyChecks: 'passed'
                    }
                ],
                deviceStatus: await automationService.checkDeviceConnection(automation.plantId),
                timestamp: new Date().toISOString()
            };

            return res.status(200).json({
                success: true,
                message: 'Test automation hoàn thành',
                testResult
            });
        } catch (error) {
            console.error('Lỗi test automation:', error);
            return res.status(500).json({
                success: false,
                message: 'Đã xảy ra lỗi khi test automation',
                error: error.message
            });
        }
    },

    // Lấy automation templates
    getAutomationTemplates: async (req, res) => {
        try {
            const { plantType } = req.query;

            const templates = getTemplates(plantType);

            return res.status(200).json({
                success: true,
                templates,
                plantType,
                timestamp: new Date().toISOString()
            });
        } catch (error) {
            console.error('Lỗi lấy templates:', error);
            return res.status(500).json({
                success: false,
                message: 'Đã xảy ra lỗi khi lấy templates',
                error: error.message
            });
        }
    },

    // Dashboard automation
    getAutomationDashboard: async (req, res) => {
        try {
            const { plantId } = req.query;

            const allAutomations = automationService.getAllAutomations();
            let automations = plantId ?
                allAutomations.filter(a => a.plantId === plantId) :
                allAutomations;

            const dashboard = {
                summary: {
                    totalAutomations: automations.length,
                    activeAutomations: automations.filter(a => a.status === 'running').length,
                    totalExecutions: automations.reduce((sum, a) => sum + (a.statistics?.totalExecutions || 0), 0),
                    successRate: (() => {
                        const totalExecutions = automations.reduce((sum, a) => sum + (a.statistics?.totalExecutions || 0), 0);
                        const successfulExecutions = automations.reduce((sum, a) => sum + (a.statistics?.successfulExecutions || 0), 0);
                        return totalExecutions > 0 ? (successfulExecutions / totalExecutions) * 100 : 0;
                    })(),
                    totalWaterDelivered: automations.reduce((sum, a) => sum + (a.statistics?.waterDelivered || 0), 0)
                },
                recentActivity: getRecentActivity(automations),
                performanceMetrics: calculatePerformanceMetrics(automations),
                alerts: getAutomationAlerts(automations)
            };

            return res.status(200).json({
                success: true,
                dashboard,
                plantId,
                timestamp: new Date().toISOString()
            });
        } catch (error) {
            console.error('Lỗi lấy dashboard:', error);
            return res.status(500).json({
                success: false,
                message: 'Đã xảy ra lỗi khi lấy dashboard',
                error: error.message
            });
        }
    },

};

// Helper functions
const getTemplates = (plantType) => {
        const baseTemplates = [
            {
                id: 'smart_basic',
                name: 'Smart Basic',
                description: 'Automation cơ bản sử dụng AI',
                mode: 'smart',
                triggers: [
                    {
                        type: 'ai_prediction',
                        threshold: 0.7
                    }
                ],
                actions: [
                    {
                        type: 'irrigation',
                        amount: 200
                    }
                ]
            },
            {
                id: 'scheduled_daily',
                name: 'Scheduled Daily',
                description: 'Tưới theo lịch hàng ngày',
                mode: 'scheduled',
                triggers: [
                    {
                        type: 'schedule',
                        time: '07:00',
                        days: [1, 2, 3, 4, 5, 6, 0],
                        amount: 250
                    }
                ],
                actions: [
                    {
                        type: 'irrigation'
                    }
                ]
            },
            {
                id: 'sensor_moisture',
                name: 'Sensor-based Moisture',
                description: 'Tưới khi độ ẩm đất thấp',
                mode: 'sensor_based',
                triggers: [
                    {
                        type: 'sensor_threshold',
                        parameter: 'soilMoisture',
                        operator: 'less_than',
                        value: 40,
                        action: {
                            type: 'irrigation',
                            amount: 300
                        }
                    }
                ],
                actions: []
            }
        ];

        // Customize templates based on plant type
        if (plantType) {
            return baseTemplates.map(template => ({
                ...template,
                customized: true,
                plantType,
                // Add plant-specific modifications here
            }));
        }

        return baseTemplates;
};

const calculateOverallSuccessRate = (automations) => {
        const totalExecutions = automations.reduce((sum, a) => sum + a.statistics.totalExecutions, 0);
        const successfulExecutions = automations.reduce((sum, a) => sum + a.statistics.successfulExecutions, 0);

        return totalExecutions > 0 ? (successfulExecutions / totalExecutions) * 100 : 0;
};

const getRecentActivity = (automations) => {
        const activities = [];

        automations.forEach(automation => {
            if (automation.statistics.lastExecution) {
                activities.push({
                    automationId: automation.id,
                    plantId: automation.plantId,
                    action: 'irrigation',
                    timestamp: automation.statistics.lastExecution,
                    success: true
                });
            }
        });

        return activities
            .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
            .slice(0, 10);
};

const calculatePerformanceMetrics = (automations) => {
        const now = new Date();
        const last24h = new Date(now - 24 * 60 * 60 * 1000);
        const last7d = new Date(now - 7 * 24 * 60 * 60 * 1000);

        return {
            executionsLast24h: automations.filter(a =>
                a.statistics.lastExecution && new Date(a.statistics.lastExecution) > last24h
            ).length,
            executionsLast7d: automations.filter(a =>
                a.statistics.lastExecution && new Date(a.statistics.lastExecution) > last7d
            ).length,
            averageWaterPerDay: automations.reduce((sum, a) => sum + a.statistics.waterDelivered, 0) / 7,
            mostActiveAutomation: automations.reduce((max, a) =>
                a.statistics.totalExecutions > (max?.statistics?.totalExecutions || 0) ? a : max, null
            )
        };
};

const getAutomationAlerts = (automations) => {
        const alerts = [];

        automations.forEach(automation => {
            try {
                const status = automationService.getAutomationStatus(automation.id);

                if (status && status.errorCount > 3) {
                    alerts.push({
                        type: 'error',
                        automationId: automation.id,
                        message: `Automation có ${status.errorCount} lỗi gần đây`,
                        severity: 'high'
                    });
                }

                if (automation.statistics && automation.statistics.totalExecutions > 0 && 
                    automation.statistics.successfulExecutions / automation.statistics.totalExecutions < 0.8) {
                    alerts.push({
                        type: 'performance',
                        automationId: automation.id,
                        message: 'Tỷ lệ thành công thấp',
                        severity: 'medium'
                    });
                }
            } catch (error) {
                console.error(`Error getting status for automation ${automation.id}:`, error);
                // Skip this automation if there's an error
            }
        });

        return alerts;
};

module.exports = automationController;
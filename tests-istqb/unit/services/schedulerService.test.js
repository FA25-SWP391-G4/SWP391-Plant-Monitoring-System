const schedulerService = require('./schedulerService');
const cron = require('node-cron');
const PumpSchedule = require('../models/PumpSchedule');
const Device = require('../models/Device');
const SystemLog = require('../models/SystemLog');
const { sendPumpCommand } = require('../mqtt/mqttClient');
const { activeCronJobs } = require('./schedulerService');

// Mock dependencies
jest.mock('node-cron');
jest.mock('../models/PumpSchedule');
jest.mock('../models/Device');
jest.mock('../models/SystemLog');
jest.mock('../mqtt/mqttClient');

describe('SchedulerService', () => {
    let mockJob;

    beforeEach(() => {
        jest.clearAllMocks();
        
        // Mock cron job
        mockJob = {
            stop: jest.fn(),
            start: jest.fn()
        };
        cron.schedule.mockReturnValue(mockJob);
        
        // Clear the activeCronJobs map
        if (activeCronJobs) activeCronJobs.clear();
    });

    describe('schedulePump', () => {
        it('should return early if schedule is not active', async () => {
            const schedule = { is_active: false, schedule_id: 1 };
            
            await schedulerService.schedulePump(schedule);
            
            expect(cron.schedule).not.toHaveBeenCalled();
        });

        it('should cancel existing job before creating new one', async () => {
            const schedule = {
                is_active: true,
                schedule_id: 1,
                cron_expression: '0 8 * * *',
                plant_id: 'plant1',
                duration_seconds: 30
            };
            
            // First call to create job
            await schedulerService.schedulePump(schedule);
            expect(cron.schedule).toHaveBeenCalledTimes(1);
            
            // Second call should stop existing job
            await schedulerService.schedulePump(schedule);
            expect(mockJob.stop).toHaveBeenCalledTimes(1);
            expect(cron.schedule).toHaveBeenCalledTimes(2);
        });

        it('should schedule pump with correct parameters', async () => {
            const schedule = {
                is_active: true,
                schedule_id: 1,
                cron_expression: '0 8 * * *',
                plant_id: 'plant1',
                duration_seconds: 30
            };
            
            await schedulerService.schedulePump(schedule);
            
            expect(cron.schedule).toHaveBeenCalledWith(
                '0 8 * * *',
                expect.any(Function),
                { timezone: 'Asia/Ho_Chi_Minh' }
            );
        });

        it('should use default duration if not specified', async () => {
            const schedule = {
                is_active: true,
                schedule_id: 1,
                cron_expression: '0 8 * * *',
                plant_id: 'plant1'
            };
            
            sendPumpCommand.mockResolvedValue();
            
            await schedulerService.schedulePump(schedule);
            
            // Trigger the cron job
            const cronCallback = cron.schedule.mock.calls[0][1];
            await cronCallback();
            
            expect(sendPumpCommand).toHaveBeenCalledWith('plant1', 'pump_on', 10);
        });
    });

    describe('scheduleAllPumps', () => {
        it('should schedule all active pumps from database', async () => {
            const mockSchedules = [
                { schedule_id: 1 },
                { schedule_id: 2 }
            ];
            
            PumpSchedule.findAll.mockResolvedValue(mockSchedules);
            PumpSchedule.findById.mockImplementation(id => 
                Promise.resolve({
                    schedule_id: id,
                    is_active: true,
                    cron_expression: '0 8 * * *',
                    device_key: 'device1'
                })
            );
            
            await schedulerService.scheduleAllPumps();
            
            expect(PumpSchedule.findAll).toHaveBeenCalled();
            expect(PumpSchedule.findById).toHaveBeenCalledTimes(2);
            expect(cron.schedule).toHaveBeenCalledTimes(2);
        });
    });

    describe('updateSchedule', () => {
        it('should remove schedule if not found or inactive', async () => {
            PumpSchedule.findById.mockResolvedValue(null);
            
            await schedulerService.updateSchedule(1);
            
            expect(cron.schedule).not.toHaveBeenCalled();
        });

        it('should create new schedule for active pump', async () => {
            const mockSchedule = {
                schedule_id: 1,
                is_active: true,
                cron_expression: '0 8 * * *',
                device_key: 'device1',
                duration_seconds: 30
            };
            
            PumpSchedule.findById.mockResolvedValue(mockSchedule);
            
            await schedulerService.updateSchedule(1);
            
            expect(cron.schedule).toHaveBeenCalledWith(
                '0 8 * * *',
                expect.any(Function)
            );
        });

        it('should check device status before executing pump command', async () => {
            const mockSchedule = {
                schedule_id: 1,
                is_active: true,
                cron_expression: '0 8 * * *',
                device_key: 'device1',
                duration_seconds: 30
            };
            
            const mockDevice = {
                isOnline: jest.fn().mockReturnValue(false)
            };
            
            PumpSchedule.findById.mockResolvedValue(mockSchedule);
            Device.findById.mockResolvedValue(mockDevice);
            SystemLog.create.mockResolvedValue();
            
            await schedulerService.updateSchedule(1);
            
            // Execute the cron job
            const cronCallback = cron.schedule.mock.calls[0][1];
            await cronCallback();
            
            expect(Device.findById).toHaveBeenCalledWith('device1');
            expect(mockDevice.isOnline).toHaveBeenCalled();
            expect(sendPumpCommand).not.toHaveBeenCalled();
            expect(SystemLog.create).toHaveBeenCalledWith({
                log_level: 'WARN',
                source: 'SchedulerService',
                message: 'Skipped scheduled watering - device offline: device1'
            });
        });

        it('should execute pump command when device is online', async () => {
            const mockSchedule = {
                schedule_id: 1,
                is_active: true,
                cron_expression: '0 8 * * *',
                device_key: 'device1',
                duration_seconds: 30
            };
            
            const mockDevice = {
                isOnline: jest.fn().mockReturnValue(true)
            };
            
            PumpSchedule.findById.mockResolvedValue(mockSchedule);
            Device.findById.mockResolvedValue(mockDevice);
            sendPumpCommand.mockResolvedValue();
            SystemLog.create.mockResolvedValue();
            
            await schedulerService.updateSchedule(1);
            
            // Execute the cron job
            const cronCallback = cron.schedule.mock.calls[0][1];
            await cronCallback();
            
            expect(sendPumpCommand).toHaveBeenCalledWith('device1', 'pump_on', 30);
            expect(SystemLog.create).toHaveBeenCalledWith({
                log_level: 'INFO',
                source: 'SchedulerService',
                message: 'Scheduled watering executed successfully - Schedule: 1, Device: device1, Duration: 30s'
            });
        });

        it('should handle device not found error', async () => {
            const mockSchedule = {
                schedule_id: 1,
                is_active: true,
                cron_expression: '0 8 * * *',
                device_key: 'device1',
                duration_seconds: 30
            };
            
            PumpSchedule.findById.mockResolvedValue(mockSchedule);
            Device.findById.mockResolvedValue(null);
            SystemLog.error.mockResolvedValue();
            
            await schedulerService.updateSchedule(1);
            
            // Execute the cron job
            const cronCallback = cron.schedule.mock.calls[0][1];
            await cronCallback();
            
            expect(SystemLog.error).toHaveBeenCalledWith(
                'SchedulerService',
                'Device not found for scheduled watering: device1'
            );
        });

        it('should handle pump command errors', async () => {
            const mockSchedule = {
                schedule_id: 1,
                is_active: true,
                cron_expression: '0 8 * * *',
                device_key: 'device1',
                duration_seconds: 30
            };
            
            const mockDevice = {
                isOnline: jest.fn().mockReturnValue(true)
            };
            
            PumpSchedule.findById.mockResolvedValue(mockSchedule);
            Device.findById.mockResolvedValue(mockDevice);
            sendPumpCommand.mockRejectedValue(new Error('MQTT connection failed'));
            SystemLog.error.mockResolvedValue();
            
            await schedulerService.updateSchedule(1);
            
            // Execute the cron job
            const cronCallback = cron.schedule.mock.calls[0][1];
            await cronCallback();
            
            expect(SystemLog.error).toHaveBeenCalledWith(
                'SchedulerService',
                'Failed scheduled watering execution - Schedule: 1, Error: MQTT connection failed'
            );
        });
    });

    describe('removeSchedule', () => {
        it('should stop and remove existing schedule', () => {
            // Simulate existing job
            const mockActiveCronJobs = new Map();
            mockActiveCronJobs.set(1, mockJob);
            
            // Mock the activeCronJobs map
            jest.doMock('./schedulerService', () => {
                const original = jest.requireActual('./schedulerService');
                original.activeCronJobs = mockActiveCronJobs;
                return original;
            });
            
            schedulerService.removeSchedule(1);
            
            expect(mockJob.stop).toHaveBeenCalled();
        });

        it('should handle non-existent schedule gracefully', () => {
            expect(() => {
                schedulerService.removeSchedule(999);
            }).not.toThrow();
        });
    });
});
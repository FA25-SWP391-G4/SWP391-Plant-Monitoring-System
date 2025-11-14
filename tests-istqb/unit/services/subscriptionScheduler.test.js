const SubscriptionScheduler = require('./subscriptionScheduler');
const cron = require('node-cron');
const Subscription = require('../models/Subscription');
const SystemLog = require('../models/SystemLog');

// Mock the dependencies
jest.mock('node-cron');
jest.mock('../models/Subscription');
jest.mock('../models/SystemLog');

describe('SubscriptionScheduler', () => {
    let mockScheduledTasks = [];
    let consoleSpy;

    beforeEach(() => {
        jest.clearAllMocks();
        mockScheduledTasks = [];
        
        // Mock console methods
        consoleSpy = {
            log: jest.spyOn(console, 'log').mockImplementation(),
            error: jest.spyOn(console, 'error').mockImplementation()
        };

        // Mock cron.schedule to capture the scheduled tasks
        cron.schedule.mockImplementation((schedule, callback) => {
            mockScheduledTasks.push({ schedule, callback });
        });

        // Mock SystemLog methods
        SystemLog.info.mockResolvedValue();
        SystemLog.error.mockResolvedValue();
    });

    afterEach(() => {
        consoleSpy.log.mockRestore();
        consoleSpy.error.mockRestore();
    });

    describe('start()', () => {
        it('should schedule two cron jobs', () => {
            SubscriptionScheduler.start();

            expect(cron.schedule).toHaveBeenCalledTimes(2);
            expect(cron.schedule).toHaveBeenCalledWith('0 * * * *', expect.any(Function));
            expect(cron.schedule).toHaveBeenCalledWith('0 2 * * *', expect.any(Function));
            expect(consoleSpy.log).toHaveBeenCalledWith('[SUBSCRIPTION SCHEDULER] Started subscription monitoring...');
        });

        describe('hourly subscription check', () => {
            let hourlyCallback;

            beforeEach(() => {
                SubscriptionScheduler.start();
                hourlyCallback = mockScheduledTasks.find(task => task.schedule === '0 * * * *').callback;
            });

            it('should process expired subscriptions successfully', async () => {
                const mockResult = {
                    regularExpired: 3,
                    expiredWithFallback: 2
                };
                Subscription.handleExpirationWithFallback.mockResolvedValue(mockResult);

                await hourlyCallback();

                expect(consoleSpy.log).toHaveBeenCalledWith('[SUBSCRIPTION SCHEDULER] Checking for expired subscriptions...');
                expect(Subscription.handleExpirationWithFallback).toHaveBeenCalled();
                expect(consoleSpy.log).toHaveBeenCalledWith('[SUBSCRIPTION SCHEDULER] Expired 3 regular subscriptions');
                expect(consoleSpy.log).toHaveBeenCalledWith('[SUBSCRIPTION SCHEDULER] Processed 2 subscriptions with fallback to lifetime Premium');
                expect(SystemLog.info).toHaveBeenCalledWith('subscriptionScheduler', 'expireSubscriptions', 'Expired 3 regular subscriptions');
                expect(SystemLog.info).toHaveBeenCalledWith('subscriptionScheduler', 'handleFallbacks', 'Processed 2 subscriptions with fallback to lifetime Premium');
            });

            it('should not log when no subscriptions expired', async () => {
                const mockResult = {
                    regularExpired: 0,
                    expiredWithFallback: 0
                };
                Subscription.handleExpirationWithFallback.mockResolvedValue(mockResult);

                await hourlyCallback();

                expect(consoleSpy.log).toHaveBeenCalledWith('[SUBSCRIPTION SCHEDULER] Checking for expired subscriptions...');
                expect(SystemLog.info).not.toHaveBeenCalledWith('subscriptionScheduler', 'expireSubscriptions', expect.any(String));
                expect(SystemLog.info).not.toHaveBeenCalledWith('subscriptionScheduler', 'handleFallbacks', expect.any(String));
            });

            it('should handle errors during subscription check', async () => {
                const error = new Error('Database connection failed');
                Subscription.handleExpirationWithFallback.mockRejectedValue(error);

                await hourlyCallback();

                expect(consoleSpy.error).toHaveBeenCalledWith('[SUBSCRIPTION SCHEDULER] Error checking subscriptions:', error);
                expect(SystemLog.error).toHaveBeenCalledWith('subscriptionScheduler', 'checkSubscriptions', 'Database connection failed');
            });
        });

        describe('daily maintenance', () => {
            let dailyCallback;

            beforeEach(() => {
                SubscriptionScheduler.start();
                dailyCallback = mockScheduledTasks.find(task => task.schedule === '0 2 * * *').callback;
            });

            it('should log subscription statistics successfully', async () => {
                const mockSubscriptions = [
                    { isActive: true },
                    { isActive: true },
                    { isActive: false },
                    { isActive: true },
                    { isActive: false }
                ];
                Subscription.findAll.mockResolvedValue(mockSubscriptions);

                await dailyCallback();

                expect(consoleSpy.log).toHaveBeenCalledWith('[SUBSCRIPTION SCHEDULER] Daily maintenance...');
                expect(Subscription.findAll).toHaveBeenCalled();
                expect(SystemLog.info).toHaveBeenCalledWith('subscriptionScheduler', 'dailyStats', 'Active subscriptions: 3, Expired: 2');
            });

            it('should handle empty subscription list', async () => {
                Subscription.findAll.mockResolvedValue([]);

                await dailyCallback();

                expect(SystemLog.info).toHaveBeenCalledWith('subscriptionScheduler', 'dailyStats', 'Active subscriptions: 0, Expired: 0');
            });

            it('should handle errors during daily maintenance', async () => {
                const error = new Error('Failed to fetch subscriptions');
                Subscription.findAll.mockRejectedValue(error);

                await dailyCallback();

                expect(consoleSpy.error).toHaveBeenCalledWith('[SUBSCRIPTION SCHEDULER] Error in daily maintenance:', error);
                expect(SystemLog.error).toHaveBeenCalledWith('subscriptionScheduler', 'dailyMaintenance', 'Failed to fetch subscriptions');
            });
        });
    });
});
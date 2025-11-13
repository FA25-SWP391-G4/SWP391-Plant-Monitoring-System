import * as apiIndex from './index';
import { api } from './index';

// src/api/index.test.js

// Mock all API modules
jest.mock('./authApi', () => ({
    default: { login: jest.fn(), logout: jest.fn() }
}));
jest.mock('./userApi', () => ({
    default: { getProfile: jest.fn(), updateProfile: jest.fn() }
}));
jest.mock('./plantApi', () => ({
    default: { getPlants: jest.fn(), createPlant: jest.fn() }
}));
jest.mock('./dashboardApi', () => ({
    default: { getDashboardData: jest.fn() }
}));
jest.mock('./paymentApi', () => ({
    default: { createPayment: jest.fn(), getPayments: jest.fn() }
}));
jest.mock('./aiApi', () => ({
    default: { getPrediction: jest.fn(), trainModel: jest.fn() }
}));
jest.mock('./sensorApi', () => ({
    default: { getSensorData: jest.fn() }
}));
jest.mock('./reportApi', () => ({
    default: { generateReport: jest.fn() }
}));
jest.mock('./notificationApi', () => ({
    default: { getNotifications: jest.fn() }
}));
jest.mock('./axiosClient', () => ({
    default: { get: jest.fn(), post: jest.fn() }
}));

describe('API Index Module', () => {
    describe('Named Exports', () => {
        test('should export authApi', () => {
            expect(apiIndex.authApi).toBeDefined();
            expect(typeof apiIndex.authApi).toBe('object');
        });

        test('should export userApi', () => {
            expect(apiIndex.userApi).toBeDefined();
            expect(typeof apiIndex.userApi).toBe('object');
        });

        test('should export plantApi', () => {
            expect(apiIndex.plantApi).toBeDefined();
            expect(typeof apiIndex.plantApi).toBe('object');
        });

        test('should export dashboardApi', () => {
            expect(apiIndex.dashboardApi).toBeDefined();
            expect(typeof apiIndex.dashboardApi).toBe('object');
        });

        test('should export paymentApi', () => {
            expect(apiIndex.paymentApi).toBeDefined();
            expect(typeof apiIndex.paymentApi).toBe('object');
        });

        test('should export aiApi', () => {
            expect(apiIndex.aiApi).toBeDefined();
            expect(typeof apiIndex.aiApi).toBe('object');
        });

        test('should export sensorApi', () => {
            expect(apiIndex.sensorApi).toBeDefined();
            expect(typeof apiIndex.sensorApi).toBe('object');
        });

        test('should export reportApi', () => {
            expect(apiIndex.reportApi).toBeDefined();
            expect(typeof apiIndex.reportApi).toBe('object');
        });

        test('should export notificationApi', () => {
            expect(apiIndex.notificationApi).toBeDefined();
            expect(typeof apiIndex.notificationApi).toBe('object');
        });

        test('should export axiosClient', () => {
            expect(apiIndex.axiosClient).toBeDefined();
            expect(typeof apiIndex.axiosClient).toBe('object');
        });
    });

    describe('API Object Export', () => {
        test('should export api object with all modules', () => {
            expect(api).toBeDefined();
            expect(typeof api).toBe('object');
        });

        test('api object should contain auth module', () => {
            expect(api.auth).toBeDefined();
            expect(api.auth).toBe(apiIndex.authApi);
        });

        test('api object should contain user module', () => {
            expect(api.user).toBeDefined();
            expect(api.user).toBe(apiIndex.userApi);
        });

        test('api object should contain plant module', () => {
            expect(api.plant).toBeDefined();
            expect(api.plant).toBe(apiIndex.plantApi);
        });

        test('api object should contain dashboard module', () => {
            expect(api.dashboard).toBeDefined();
            expect(api.dashboard).toBe(apiIndex.dashboardApi);
        });

        test('api object should contain payment module', () => {
            expect(api.payment).toBeDefined();
            expect(api.payment).toBe(apiIndex.paymentApi);
        });

        test('api object should contain ai module', () => {
            expect(api.ai).toBeDefined();
            expect(api.ai).toBe(apiIndex.aiApi);
        });

        test('api object should contain sensor module', () => {
            expect(api.sensor).toBeDefined();
            expect(api.sensor).toBe(apiIndex.sensorApi);
        });

        test('api object should contain report module', () => {
            expect(api.report).toBeDefined();
            expect(api.report).toBe(apiIndex.reportApi);
        });

        test('api object should contain notification module', () => {
            expect(api.notification).toBeDefined();
            expect(api.notification).toBe(apiIndex.notificationApi);
        });
    });

    describe('Default Export', () => {
        test('should export api as default', () => {
            expect(apiIndex.default).toBeDefined();
            expect(apiIndex.default).toBe(api);
        });

        test('default export should have all expected properties', () => {
            const expectedProperties = [
                'auth', 'user', 'plant', 'dashboard', 'payment',
                'ai', 'sensor', 'report', 'notification'
            ];
            
            expectedProperties.forEach(prop => {
                expect(apiIndex.default).toHaveProperty(prop);
            });
        });
    });

    describe('Module Structure Validation', () => {
        test('should have consistent structure across all API modules', () => {
            const apiModules = [
                api.auth, api.user, api.plant, api.dashboard,
                api.payment, api.ai, api.sensor, api.report, api.notification
            ];

            apiModules.forEach(module => {
                expect(module).toBeDefined();
                expect(typeof module).toBe('object');
            });
        });

        test('should not export undefined modules', () => {
            const exportedModules = Object.values(api);
            exportedModules.forEach(module => {
                expect(module).not.toBeUndefined();
                expect(module).not.toBeNull();
            });
        });
    });
});
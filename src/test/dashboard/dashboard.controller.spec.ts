import { Test, TestingModule } from '@nestjs/testing';
import { DashboardController } from '../../dashboard/dashboard.controller';
import { DashboardService } from '../../dashboard/dashboard.service';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { DashboardPreferencesDto } from '../../dashboard/dto/dashboard-preferences.dto';

// Mock the DashboardService
const mockDashboardService = {
  getDashboardData: jest.fn(),
  saveDashboardPreferences: jest.fn()
};

// Mock the guard
const mockJwtAuthGuard = { canActivate: jest.fn().mockReturnValue(true) };

describe('DashboardController', () => {
  let controller: DashboardController;
  let service: DashboardService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [DashboardController],
      providers: [
        { provide: DashboardService, useValue: mockDashboardService }
      ],
    })
      .overrideGuard(JwtAuthGuard)
      .useValue(mockJwtAuthGuard)
      .compile();

    controller = module.get<DashboardController>(DashboardController);
    service = module.get<DashboardService>(DashboardService);

    // Reset all mocks before each test
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('getDashboard', () => {
    it('should call dashboardService.getDashboardData with user ID from request', async () => {
      // Arrange
      const req = { user: { userId: 'test-user-id' } };
      const expectedResult = {
        plants: [{ id: 'plant-1', name: 'Test Plant' }],
        sensorData: [{ plantId: 'plant-1', soilMoisture: 45 }],
        notifications: [{ id: 'notif-1', message: 'Test notification' }],
        preferences: { layout: 'grid' }
      };
      mockDashboardService.getDashboardData.mockResolvedValue(expectedResult);

      // Act
      const result = await controller.getDashboard(req);

      // Assert
      expect(mockDashboardService.getDashboardData).toHaveBeenCalledWith('test-user-id');
      expect(result).toEqual(expectedResult);
    });
  });

  describe('saveDashboardPreferences', () => {
    it('should call dashboardService.saveDashboardPreferences with correct parameters', async () => {
      // Arrange
      const req = { user: { userId: 'test-user-id' } };
      const preferencesDto: DashboardPreferencesDto = {
        layout: 'grid',
        widgetsOrder: ['plants', 'notifications', 'sensors'],
        chartsEnabled: true,
        refreshRate: 60
      };
      const expectedResult = {
        success: true,
        preferences: preferencesDto
      };
      mockDashboardService.saveDashboardPreferences.mockResolvedValue(expectedResult);

      // Act
      const result = await controller.saveDashboardPreferences(req, preferencesDto);

      // Assert
      expect(mockDashboardService.saveDashboardPreferences).toHaveBeenCalledWith('test-user-id', preferencesDto);
      expect(result).toEqual(expectedResult);
    });
  });
});
import { Test, TestingModule } from '@nestjs/testing';
import { PlantController } from '../../plants/plant.controller';
import { PlantService } from '../../plants/plant.service';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { CreatePlantDto } from '../../plants/dto/create-plant.dto';
import { UpdatePlantDto } from '../../plants/dto/update-plant.dto';
import { ManualWateringDto } from '../../plants/dto/manual-watering.dto';
import { ThresholdSettingsDto } from '../../plants/dto/threshold-settings.dto';

// Mock the PlantService
const mockPlantService = {
  findAllByUser: jest.fn(),
  findById: jest.fn(),
  create: jest.fn(),
  update: jest.fn(),
  remove: jest.fn(),
  manualWatering: jest.fn(),
  createWateringSchedule: jest.fn(),
  updateWateringSchedule: jest.fn(),
  removeWateringSchedule: jest.fn(),
  toggleAutoWatering: jest.fn(),
  updateSensorThresholds: jest.fn(),
};

// Mock the guard
const mockJwtAuthGuard = { canActivate: jest.fn().mockReturnValue(true) };

describe('PlantController', () => {
  let controller: PlantController;
  let service: PlantService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [PlantController],
      providers: [
        { provide: PlantService, useValue: mockPlantService }
      ],
    })
      .overrideGuard(JwtAuthGuard)
      .useValue(mockJwtAuthGuard)
      .compile();

    controller = module.get<PlantController>(PlantController);
    service = module.get<PlantService>(PlantService);

    // Reset all mocks before each test
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('findAll', () => {
    it('should call plantService.findAllByUser with user ID from request', async () => {
      // Arrange
      const req = { user: { userId: 'test-user-id' } };
      const expectedResult = [
        { id: 'plant-1', name: 'Test Plant 1' },
        { id: 'plant-2', name: 'Test Plant 2' }
      ];
      mockPlantService.findAllByUser.mockResolvedValue(expectedResult);

      // Act
      const result = await controller.findAll(req);

      // Assert
      expect(mockPlantService.findAllByUser).toHaveBeenCalledWith('test-user-id');
      expect(result).toEqual(expectedResult);
    });
  });

  describe('findOne', () => {
    it('should call plantService.findById with plant ID', async () => {
      // Arrange
      const plantId = 'plant-1';
      const req = { user: { userId: 'test-user-id' } };
      const expectedResult = { id: 'plant-1', name: 'Test Plant 1' };
      mockPlantService.findById.mockResolvedValue(expectedResult);

      // Act
      const result = await controller.findOne(plantId, req);

      // Assert
      expect(mockPlantService.findById).toHaveBeenCalledWith(plantId);
      expect(result).toEqual(expectedResult);
    });
  });

  describe('create', () => {
    it('should call plantService.create with user ID and DTO', async () => {
      // Arrange
      const req = { user: { userId: 'test-user-id' } };
      const createPlantDto: CreatePlantDto = {
        name: 'New Plant',
        species: 'Test Species'
      };
      const expectedResult = { 
        id: 'new-plant-id', 
        name: 'New Plant',
        species: 'Test Species',
        userId: 'test-user-id'
      };
      mockPlantService.create.mockResolvedValue(expectedResult);

      // Act
      const result = await controller.create(createPlantDto, req);

      // Assert
      expect(mockPlantService.create).toHaveBeenCalledWith('test-user-id', createPlantDto);
      expect(result).toEqual(expectedResult);
    });
  });

  describe('update', () => {
    it('should call plantService.update with correct parameters', async () => {
      // Arrange
      const plantId = 'plant-1';
      const req = { user: { userId: 'test-user-id' } };
      const updatePlantDto: UpdatePlantDto = {
        name: 'Updated Plant Name'
      };
      const expectedResult = { 
        id: 'plant-1', 
        name: 'Updated Plant Name',
        userId: 'test-user-id'
      };
      mockPlantService.update.mockResolvedValue(expectedResult);

      // Act
      const result = await controller.update(plantId, updatePlantDto, req);

      // Assert
      expect(mockPlantService.update).toHaveBeenCalledWith(plantId, 'test-user-id', updatePlantDto);
      expect(result).toEqual(expectedResult);
    });
  });

  describe('remove', () => {
    it('should call plantService.remove with correct parameters', async () => {
      // Arrange
      const plantId = 'plant-1';
      const req = { user: { userId: 'test-user-id' } };
      mockPlantService.remove.mockResolvedValue(undefined);

      // Act
      const result = await controller.remove(plantId, req);

      // Assert
      expect(mockPlantService.remove).toHaveBeenCalledWith(plantId, 'test-user-id');
      expect(result).toEqual({ message: 'Plant successfully deleted' });
    });
  });

  describe('waterPlant', () => {
    it('should call plantService.manualWatering with correct parameters', async () => {
      // Arrange
      const plantId = 'plant-1';
      const req = { user: { userId: 'test-user-id' } };
      const wateringDto: ManualWateringDto = {
        waterAmount: 300,
        notes: 'Test watering'
      };
      const expectedResult = { 
        id: 'watering-1',
        plantId: 'plant-1',
        waterAmount: 300,
        notes: 'Test watering'
      };
      mockPlantService.manualWatering.mockResolvedValue(expectedResult);

      // Act
      const result = await controller.waterPlant(plantId, wateringDto, req);

      // Assert
      expect(mockPlantService.manualWatering).toHaveBeenCalledWith(plantId, 'test-user-id', wateringDto);
      expect(result).toEqual(expectedResult);
    });
  });

  describe('toggleAutoWatering', () => {
    it('should call plantService.toggleAutoWatering with correct parameters', async () => {
      // Arrange
      const plantId = 'plant-1';
      const req = { user: { userId: 'test-user-id' } };
      const body = { enabled: true };
      const expectedResult = { 
        id: 'plant-1',
        isAutoWateringEnabled: true
      };
      mockPlantService.toggleAutoWatering.mockResolvedValue(expectedResult);

      // Act
      const result = await controller.toggleAutoWatering(plantId, body, req);

      // Assert
      expect(mockPlantService.toggleAutoWatering).toHaveBeenCalledWith(plantId, 'test-user-id', true);
      expect(result).toEqual(expectedResult);
    });
  });

  describe('updateThresholds', () => {
    it('should call plantService.updateSensorThresholds with correct parameters', async () => {
      // Arrange
      const plantId = 'plant-1';
      const req = { user: { userId: 'test-user-id' } };
      const thresholds: ThresholdSettingsDto = {
        soilMoistureMin: 20,
        soilMoistureMax: 60
      };
      const expectedResult = { 
        id: 'plant-1',
        sensorThresholds: {
          soilMoistureMin: 20,
          soilMoistureMax: 60
        }
      };
      mockPlantService.updateSensorThresholds.mockResolvedValue(expectedResult);

      // Act
      const result = await controller.updateThresholds(plantId, thresholds, req);

      // Assert
      expect(mockPlantService.updateSensorThresholds).toHaveBeenCalledWith(plantId, 'test-user-id', thresholds);
      expect(result).toEqual(expectedResult);
    });
  });
});
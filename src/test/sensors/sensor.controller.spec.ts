import { Test, TestingModule } from '@nestjs/testing';
import { SensorController } from '../../sensors/sensor.controller';
import { SensorService } from '../../sensors/sensor.service';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { CreateSensorDto } from '../../sensors/dto/create-sensor.dto';
import { SensorReadingDto } from '../../sensors/dto/sensor-reading.dto';

// Mock the SensorService
const mockSensorService = {
  createSensor: jest.fn(),
  getSensorsForPlant: jest.fn(),
  recordSensorReading: jest.fn(),
  getLatestReadingsForPlant: jest.fn(),
  getSensorHistory: jest.fn(),
};

// Mock the guard
const mockJwtAuthGuard = { canActivate: jest.fn().mockReturnValue(true) };

describe('SensorController', () => {
  let controller: SensorController;
  let service: SensorService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [SensorController],
      providers: [
        { provide: SensorService, useValue: mockSensorService }
      ],
    })
      .overrideGuard(JwtAuthGuard)
      .useValue(mockJwtAuthGuard)
      .compile();

    controller = module.get<SensorController>(SensorController);
    service = module.get<SensorService>(SensorService);

    // Reset all mocks before each test
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('createSensor', () => {
    it('should call sensorService.createSensor with the provided DTO', async () => {
      // Arrange
      const createSensorDto: CreateSensorDto = {
        type: 'soil_moisture',
        plantId: 'test-plant-id',
        location: 'pot',
        model: 'SoilSensor2000'
      };
      const expectedResult = {
        id: 'new-sensor-id',
        ...createSensorDto,
        createdAt: new Date(),
        plant: { id: 'test-plant-id', name: 'Test Plant' }
      };
      mockSensorService.createSensor.mockResolvedValue(expectedResult);

      // Act
      const result = await controller.createSensor(createSensorDto);

      // Assert
      expect(mockSensorService.createSensor).toHaveBeenCalledWith(createSensorDto);
      expect(result).toEqual(expectedResult);
    });
  });

  describe('getSensorsForPlant', () => {
    it('should call sensorService.getSensorsForPlant with the plant ID', async () => {
      // Arrange
      const plantId = 'test-plant-id';
      const expectedResult = [
        { id: 'sensor-1', type: 'soil_moisture', plant: { id: plantId } },
        { id: 'sensor-2', type: 'temperature', plant: { id: plantId } }
      ];
      mockSensorService.getSensorsForPlant.mockResolvedValue(expectedResult);

      // Act
      const result = await controller.getSensorsForPlant(plantId);

      // Assert
      expect(mockSensorService.getSensorsForPlant).toHaveBeenCalledWith(plantId);
      expect(result).toEqual(expectedResult);
    });
  });

  describe('recordReading', () => {
    it('should call sensorService.recordSensorReading with sensor ID and reading DTO', async () => {
      // Arrange
      const sensorId = 'test-sensor-id';
      const readingDto: SensorReadingDto = {
        value: 42.5,
        unit: '%'
      };
      const expectedResult = {
        id: 'reading-id',
        sensorId,
        value: 42.5,
        unit: '%',
        timestamp: new Date()
      };
      mockSensorService.recordSensorReading.mockResolvedValue(expectedResult);

      // Act
      const result = await controller.recordReading(sensorId, readingDto);

      // Assert
      expect(mockSensorService.recordSensorReading).toHaveBeenCalledWith(sensorId, readingDto);
      expect(result).toEqual(expectedResult);
    });
  });

  describe('getLatestReadings', () => {
    it('should call sensorService.getLatestReadingsForPlant with plant ID', async () => {
      // Arrange
      const plantId = 'test-plant-id';
      const expectedResult = [
        { id: 'reading-1', value: 42.5, unit: '%', timestamp: new Date() },
        { id: 'reading-2', value: 22.3, unit: '°C', timestamp: new Date() }
      ];
      mockSensorService.getLatestReadingsForPlant.mockResolvedValue(expectedResult);

      // Act
      const result = await controller.getLatestReadings(plantId);

      // Assert
      expect(mockSensorService.getLatestReadingsForPlant).toHaveBeenCalledWith(plantId);
      expect(result).toEqual(expectedResult);
    });
  });

  describe('getSensorHistory', () => {
    it('should call sensorService.getSensorHistory with correct parameters', async () => {
      // Arrange
      const plantId = 'test-plant-id';
      const sensorType = 'soil_moisture';
      const startDateStr = '2023-01-01T00:00:00Z';
      const endDateStr = '2023-01-02T00:00:00Z';
      const startDate = new Date(startDateStr);
      const endDate = new Date(endDateStr);
      
      const expectedResult = [
        { id: 'reading-1', value: 40.1, timestamp: new Date(startDateStr) },
        { id: 'reading-2', value: 42.5, timestamp: new Date(endDateStr) }
      ];
      mockSensorService.getSensorHistory.mockResolvedValue(expectedResult);

      // Act
      const result = await controller.getSensorHistory(plantId, sensorType, startDateStr, endDateStr);

      // Assert
      expect(mockSensorService.getSensorHistory).toHaveBeenCalledWith(
        plantId,
        sensorType,
        expect.any(Date),
        expect.any(Date)
      );
      expect(result).toEqual(expectedResult);
    });
  });
});
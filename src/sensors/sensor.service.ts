import { Injectable } from '@nestjs/common';
import { SensorData } from '../sensors/entities/sensor-data.entity';
import { Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { CreateSensorDto } from './dto/create-sensor.dto';
import { Sensor } from './entities/sensor.entity';
import { SensorReadingDto } from './dto/sensor-reading.dto';
import { Plant } from '../plants/entities/plant.entity';

@Injectable()
export class SensorService {
  constructor(
    @InjectRepository(Sensor)
    private sensorRepository: Repository<Sensor>,
    
    @InjectRepository(SensorData)
    private sensorDataRepository: Repository<SensorData>,
    
    @InjectRepository(Plant)
    private plantRepository: Repository<Plant>,
  ) {}

  /**
   * Register a new sensor in the system
   */
  async createSensor(createSensorDto: CreateSensorDto): Promise<Sensor> {
    const plant = await this.plantRepository.findOne({ where: { id: createSensorDto.plantId } });
    
    if (!plant) {
      throw new Error('Plant not found');
    }
    
    const newSensor = this.sensorRepository.create({
      ...createSensorDto,
      plant,
    });
    
    return this.sensorRepository.save(newSensor);
  }

  /**
   * Get all sensors for a specific plant
   */
  async getSensorsForPlant(plantId: string): Promise<Sensor[]> {
    return this.sensorRepository.find({
      where: { plant: { id: plantId } },
      relations: ['plant'],
    });
  }

  /**
   * Record sensor data coming from the devices
   */
  async recordSensorReading(sensorId: string, readingDto: SensorReadingDto): Promise<SensorData> {
    const sensor = await this.sensorRepository.findOne({ where: { id: sensorId } });
    
    if (!sensor) {
      throw new Error('Sensor not found');
    }
    
    const sensorData = this.sensorDataRepository.create({
      sensor,
      ...readingDto,
      timestamp: new Date(),
    });
    
    // Save the reading to the database
    const savedData = await this.sensorDataRepository.save(sensorData);
    
    // Check thresholds and trigger notifications if needed
    await this.checkThresholds(sensor.id, readingDto);
    
    return savedData;
  }

  /**
   * Get the latest sensor readings for a plant
   */
  async getLatestReadingsForPlant(plantId: string): Promise<SensorData[]> {
    // Find all sensors for this plant
    const sensors = await this.getSensorsForPlant(plantId);
    const sensorIds = sensors.map(s => s.id);
    
    // For each sensor type, get the latest reading
    const latestReadings = [];
    
    for (const sensorId of sensorIds) {
      const latestReading = await this.sensorDataRepository.findOne({
        where: { sensor: { id: sensorId } },
        relations: ['sensor'],
        order: { timestamp: 'DESC' },
      });
      
      if (latestReading) {
        latestReadings.push(latestReading);
      }
    }
    
    return latestReadings;
  }

  /**
   * Get historical sensor data for a plant within a date range
   */
  async getSensorHistory(
    plantId: string, 
    sensorType: string, 
    startDate: Date, 
    endDate: Date
  ): Promise<SensorData[]> {
    const sensors = await this.getSensorsForPlant(plantId);
    const sensorOfType = sensors.find(s => s.type === sensorType);
    
    if (!sensorOfType) {
      throw new Error(`No ${sensorType} sensor found for this plant`);
    }
    
    return this.sensorDataRepository.find({
      where: {
        sensor: { id: sensorOfType.id },
        timestamp: {
          $gte: startDate,
          $lte: endDate,
        },
      },
      relations: ['sensor'],
      order: { timestamp: 'ASC' },
    });
  }

  /**
   * Check if sensor readings exceed thresholds and trigger actions
   * @private
   */
  private async checkThresholds(sensorId: string, readingDto: SensorReadingDto): Promise<void> {
    // Find the sensor with its associated plant
    const sensor = await this.sensorRepository.findOne({
      where: { id: sensorId },
      relations: ['plant'],
    });
    
    if (!sensor || !sensor.plant) {
      return;
    }

    const plant = sensor.plant;
    
    // Check different sensor types against plant thresholds
    switch (sensor.type) {
      case 'soil_moisture':
        if (readingDto.value < plant.sensorThresholds?.soilMoistureMin) {
          // Soil is too dry - trigger watering if auto-watering is enabled
          if (plant.isAutoWateringEnabled) {
            // Logic to trigger auto watering would go here
            console.log(`Auto-watering triggered for plant ${plant.id}`);
          }
          
          // Logic to send notification would go here
          console.log(`Notification: Soil moisture below threshold for plant ${plant.id}`);
        }
        break;
        
      case 'temperature':
        if (readingDto.value > plant.sensorThresholds?.temperatureMax) {
          // Temperature too high - send notification
          console.log(`Notification: Temperature too high for plant ${plant.id}`);
        } else if (readingDto.value < plant.sensorThresholds?.temperatureMin) {
          // Temperature too low - send notification
          console.log(`Notification: Temperature too low for plant ${plant.id}`);
        }
        break;
        
      case 'humidity':
        if (readingDto.value < plant.sensorThresholds?.humidityMin) {
          // Humidity too low - send notification
          console.log(`Notification: Humidity too low for plant ${plant.id}`);
        }
        break;
        
      case 'light':
        if (readingDto.value < plant.sensorThresholds?.lightMin) {
          // Light level too low - send notification
          console.log(`Notification: Light level too low for plant ${plant.id}`);
        }
        break;
        
      default:
        // Unknown sensor type
        break;
    }
  }
}
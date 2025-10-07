import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Plant } from './entities/plant.entity';
import { Zone } from './entities/zone.entity';
import { WateringSchedule } from './entities/watering-schedule.entity';
import { WateringHistory } from './entities/watering-history.entity';
import { SensorService } from '../sensors/sensor.service';
import { CreatePlantDto } from './dto/create-plant.dto';
import { UpdatePlantDto } from './dto/update-plant.dto';
import { ManualWateringDto } from './dto/manual-watering.dto';
import { CreateScheduleDto } from './dto/create-schedule.dto';
import { UpdateScheduleDto } from './dto/update-schedule.dto';
import { ThresholdSettingsDto } from './dto/threshold-settings.dto';

@Injectable()
export class PlantService {
  constructor(
    @InjectRepository(Plant)
    private plantRepository: Repository<Plant>,
    @InjectRepository(Zone)
    private zoneRepository: Repository<Zone>,
    @InjectRepository(WateringSchedule)
    private scheduleRepository: Repository<WateringSchedule>,
    @InjectRepository(WateringHistory)
    private historyRepository: Repository<WateringHistory>,
    private sensorService: SensorService,
  ) {}

  /**
   * Get all plants for a user
   */
  async findAllByUser(userId: string): Promise<Plant[]> {
    return this.plantRepository.find({
      where: { userId },
      relations: ['zone'],
    });
  }

  /**
   * Get a plant by ID with related data
   */
  async findById(id: string): Promise<Plant> {
    const plant = await this.plantRepository.findOne({
      where: { id },
      relations: ['zone', 'wateringSchedules'],
    });

    if (!plant) {
      throw new NotFoundException(`Plant with ID ${id} not found`);
    }

    return plant;
  }

  /**
   * Create a new plant
   */
  async create(userId: string, createPlantDto: CreatePlantDto): Promise<Plant> {
    const { zoneId, ...plantData } = createPlantDto;

    // Check if zone exists and belongs to user
    if (zoneId) {
      const zone = await this.zoneRepository.findOne({
        where: { id: zoneId, userId }
      });
      
      if (!zone) {
        throw new NotFoundException(`Zone with ID ${zoneId} not found or doesn't belong to user`);
      }
    }

    const newPlant = this.plantRepository.create({
      ...plantData,
      userId,
      zoneId,
    });

    return this.plantRepository.save(newPlant);
  }

  /**
   * Update a plant
   */
  async update(id: string, userId: string, updatePlantDto: UpdatePlantDto): Promise<Plant> {
    const plant = await this.plantRepository.findOne({
      where: { id, userId }
    });

    if (!plant) {
      throw new NotFoundException(`Plant with ID ${id} not found or doesn't belong to user`);
    }

    // Handle zone change if needed
    if (updatePlantDto.zoneId && updatePlantDto.zoneId !== plant.zoneId) {
      const zone = await this.zoneRepository.findOne({
        where: { id: updatePlantDto.zoneId, userId }
      });
      
      if (!zone) {
        throw new NotFoundException(`Zone with ID ${updatePlantDto.zoneId} not found or doesn't belong to user`);
      }
    }

    // Update plant properties
    Object.assign(plant, updatePlantDto);
    
    return this.plantRepository.save(plant);
  }

  /**
   * Delete a plant
   */
  async remove(id: string, userId: string): Promise<void> {
    const plant = await this.plantRepository.findOne({
      where: { id, userId }
    });

    if (!plant) {
      throw new NotFoundException(`Plant with ID ${id} not found or doesn't belong to user`);
    }

    await this.plantRepository.remove(plant);
  }

  /**
   * UC5: Manual Watering
   * Trigger manual watering for a plant
   */
  async manualWatering(id: string, userId: string, wateringDto: ManualWateringDto): Promise<WateringHistory> {
    const plant = await this.plantRepository.findOne({
      where: { id, userId }
    });

    if (!plant) {
      throw new NotFoundException(`Plant with ID ${id} not found or doesn't belong to user`);
    }

    // Get current sensor readings (if available)
    const sensorReadingsBefore = await this.sensorService.getCurrentReadings(id).catch(() => null);

    // Create watering history entry
    const watering = this.historyRepository.create({
      plantId: id,
      wateringType: 'manual',
      waterAmount: wateringDto.waterAmount || 250, // Default 250ml if not specified
      duration: wateringDto.duration || 10, // Default 10 seconds
      notes: wateringDto.notes,
      initiatedBy: userId,
      sensorReadings: sensorReadingsBefore ? {
        soilMoistureBefore: sensorReadingsBefore.soilMoisture,
        temperature: sensorReadingsBefore.temperature,
        humidity: sensorReadingsBefore.humidity,
        light: sensorReadingsBefore.light
      } : {}
    });

    // Save watering history
    const savedWatering = await this.historyRepository.save(watering);
    
    // Update plant's last watered timestamp
    plant.lastWateredAt = new Date();
    await this.plantRepository.save(plant);

    // Get updated sensor readings after watering (with slight delay)
    setTimeout(async () => {
      try {
        const sensorReadingsAfter = await this.sensorService.getCurrentReadings(id);
        
        // Update watering history with post-watering sensor readings
        if (sensorReadingsAfter) {
          savedWatering.sensorReadings = {
            ...savedWatering.sensorReadings,
            soilMoistureAfter: sensorReadingsAfter.soilMoisture
          };
          
          await this.historyRepository.save(savedWatering);
        }
      } catch (error) {
        // Log error but don't fail the operation
        console.error('Failed to update post-watering sensor readings:', error);
      }
    }, 30000); // Wait 30 seconds for moisture to change

    return savedWatering;
  }

  /**
   * UC6: Configure Auto-Watering Schedule
   * Create a watering schedule for a plant
   */
  async createWateringSchedule(plantId: string, userId: string, scheduleDto: CreateScheduleDto): Promise<WateringSchedule> {
    const plant = await this.plantRepository.findOne({
      where: { id: plantId, userId }
    });

    if (!plant) {
      throw new NotFoundException(`Plant with ID ${plantId} not found or doesn't belong to user`);
    }

    // Validate cron expression
    this.validateCronExpression(scheduleDto.cronExpression);

    // Calculate next run time
    const nextRun = this.calculateNextRunFromCron(scheduleDto.cronExpression);

    // Create schedule
    const schedule = this.scheduleRepository.create({
      ...scheduleDto,
      plantId,
      nextRun
    });

    return this.scheduleRepository.save(schedule);
  }

  /**
   * Update a watering schedule
   */
  async updateWateringSchedule(scheduleId: string, userId: string, updateDto: UpdateScheduleDto): Promise<WateringSchedule> {
    const schedule = await this.scheduleRepository.findOne({
      where: { id: scheduleId },
      relations: ['plant']
    });

    if (!schedule) {
      throw new NotFoundException(`Schedule with ID ${scheduleId} not found`);
    }

    // Check if schedule belongs to user's plant
    if (schedule.plant.userId !== userId) {
      throw new NotFoundException(`Schedule with ID ${scheduleId} not found or doesn't belong to user's plants`);
    }

    // Validate cron expression if provided
    if (updateDto.cronExpression) {
      this.validateCronExpression(updateDto.cronExpression);
      updateDto.nextRun = this.calculateNextRunFromCron(updateDto.cronExpression);
    }

    // Update schedule properties
    Object.assign(schedule, updateDto);
    
    return this.scheduleRepository.save(schedule);
  }

  /**
   * Delete a watering schedule
   */
  async removeWateringSchedule(scheduleId: string, userId: string): Promise<void> {
    const schedule = await this.scheduleRepository.findOne({
      where: { id: scheduleId },
      relations: ['plant']
    });

    if (!schedule) {
      throw new NotFoundException(`Schedule with ID ${scheduleId} not found`);
    }

    // Check if schedule belongs to user's plant
    if (schedule.plant.userId !== userId) {
      throw new NotFoundException(`Schedule with ID ${scheduleId} not found or doesn't belong to user's plants`);
    }

    await this.scheduleRepository.remove(schedule);
  }

  /**
   * UC7: Toggle Auto-Watering Mode
   * Enable or disable auto-watering for a plant
   */
  async toggleAutoWatering(plantId: string, userId: string, enabled: boolean): Promise<Plant> {
    const plant = await this.plantRepository.findOne({
      where: { id: plantId, userId }
    });

    if (!plant) {
      throw new NotFoundException(`Plant with ID ${plantId} not found or doesn't belong to user`);
    }

    plant.isAutoWateringEnabled = enabled;
    return this.plantRepository.save(plant);
  }

  /**
   * UC16: Configure Advanced Sensor Thresholds
   * Update sensor thresholds for a plant
   */
  async updateSensorThresholds(plantId: string, userId: string, thresholds: ThresholdSettingsDto): Promise<Plant> {
    const plant = await this.plantRepository.findOne({
      where: { id: plantId, userId }
    });

    if (!plant) {
      throw new NotFoundException(`Plant with ID ${plantId} not found or doesn't belong to user`);
    }

    // Validate thresholds
    this.validateThresholds(thresholds);

    // Update thresholds
    plant.sensorThresholds = {
      ...plant.sensorThresholds,
      ...thresholds
    };

    return this.plantRepository.save(plant);
  }

  /**
   * Helper method to validate thresholds
   */
  private validateThresholds(thresholds: ThresholdSettingsDto): void {
    // Soil moisture should be between 0-100%
    if (thresholds.soilMoistureMin !== undefined && thresholds.soilMoistureMax !== undefined) {
      if (thresholds.soilMoistureMin < 0 || thresholds.soilMoistureMin > 100) {
        throw new BadRequestException('Soil moisture minimum should be between 0 and 100');
      }
      if (thresholds.soilMoistureMax < 0 || thresholds.soilMoistureMax > 100) {
        throw new BadRequestException('Soil moisture maximum should be between 0 and 100');
      }
      if (thresholds.soilMoistureMin > thresholds.soilMoistureMax) {
        throw new BadRequestException('Soil moisture minimum cannot be greater than maximum');
      }
    }

    // Temperature thresholds
    if (thresholds.temperatureMin !== undefined && thresholds.temperatureMax !== undefined) {
      if (thresholds.temperatureMin > thresholds.temperatureMax) {
        throw new BadRequestException('Temperature minimum cannot be greater than maximum');
      }
    }

    // Humidity thresholds
    if (thresholds.humidityMin !== undefined && thresholds.humidityMax !== undefined) {
      if (thresholds.humidityMin < 0 || thresholds.humidityMin > 100) {
        throw new BadRequestException('Humidity minimum should be between 0 and 100');
      }
      if (thresholds.humidityMax < 0 || thresholds.humidityMax > 100) {
        throw new BadRequestException('Humidity maximum should be between 0 and 100');
      }
      if (thresholds.humidityMin > thresholds.humidityMax) {
        throw new BadRequestException('Humidity minimum cannot be greater than maximum');
      }
    }

    // Light thresholds
    if (thresholds.lightMin !== undefined && thresholds.lightMax !== undefined) {
      if (thresholds.lightMin < 0) {
        throw new BadRequestException('Light minimum should be greater than 0');
      }
      if (thresholds.lightMin > thresholds.lightMax) {
        throw new BadRequestException('Light minimum cannot be greater than maximum');
      }
    }
  }

  /**
   * Helper method to validate cron expression
   */
  private validateCronExpression(cronExpression: string): void {
    // Basic validation - this should be replaced with a proper cron validation library
    if (!cronExpression.match(/^(\S+\s+){4}\S+$/)) {
      throw new BadRequestException('Invalid cron expression format');
    }
  }

  /**
   * Helper method to calculate next run time from cron expression
   */
  private calculateNextRunFromCron(cronExpression: string): Date {
    // This is a placeholder - in a real app, use a cron parsing library like node-cron
    // to calculate the next run time from the cron expression
    return new Date(Date.now() + 24 * 60 * 60 * 1000); // Default to tomorrow
  }
}
import { Body, Controller, Get, Param, Post, Query, Req, UseGuards } from '@nestjs/common';
import { SensorService } from './sensor.service';
import { CreateSensorDto } from './dto/create-sensor.dto';
import { SensorReadingDto } from './dto/sensor-reading.dto';
import { ApiOperation, ApiParam, ApiQuery, ApiResponse, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { Sensor } from './entities/sensor.entity';
import { SensorData } from './entities/sensor-data.entity';

@ApiTags('sensors')
@Controller('sensors')
export class SensorController {
  constructor(private readonly sensorService: SensorService) {}

  @Post()
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Register a new sensor' })
  @ApiResponse({ status: 201, description: 'The sensor has been successfully created.', type: Sensor })
  async createSensor(@Body() createSensorDto: CreateSensorDto): Promise<Sensor> {
    return this.sensorService.createSensor(createSensorDto);
  }

  @Get('plant/:plantId')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Get all sensors for a plant' })
  @ApiParam({ name: 'plantId', description: 'ID of the plant' })
  @ApiResponse({ status: 200, description: 'Returns all sensors for the specified plant', type: [Sensor] })
  async getSensorsForPlant(@Param('plantId') plantId: string): Promise<Sensor[]> {
    return this.sensorService.getSensorsForPlant(plantId);
  }

  @Post(':sensorId/readings')
  @ApiOperation({ summary: 'Record a new sensor reading' })
  @ApiParam({ name: 'sensorId', description: 'ID of the sensor' })
  @ApiResponse({ status: 201, description: 'The reading has been successfully recorded.', type: SensorData })
  async recordReading(
    @Param('sensorId') sensorId: string,
    @Body() readingDto: SensorReadingDto
  ): Promise<SensorData> {
    return this.sensorService.recordSensorReading(sensorId, readingDto);
  }

  @Get('latest/:plantId')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Get latest sensor readings for a plant' })
  @ApiParam({ name: 'plantId', description: 'ID of the plant' })
  @ApiResponse({ status: 200, description: 'Returns the latest sensor readings for the plant', type: [SensorData] })
  async getLatestReadings(@Param('plantId') plantId: string): Promise<SensorData[]> {
    return this.sensorService.getLatestReadingsForPlant(plantId);
  }

  @Get('history/:plantId')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Get historical sensor data for a plant' })
  @ApiParam({ name: 'plantId', description: 'ID of the plant' })
  @ApiQuery({ name: 'sensorType', description: 'Type of sensor (e.g., soil_moisture, temperature)' })
  @ApiQuery({ name: 'startDate', description: 'Start date for data range (ISO format)' })
  @ApiQuery({ name: 'endDate', description: 'End date for data range (ISO format)' })
  @ApiResponse({ status: 200, description: 'Returns historical sensor data for the specified range', type: [SensorData] })
  async getSensorHistory(
    @Param('plantId') plantId: string,
    @Query('sensorType') sensorType: string,
    @Query('startDate') startDate: string,
    @Query('endDate') endDate: string,
  ): Promise<SensorData[]> {
    return this.sensorService.getSensorHistory(
      plantId,
      sensorType,
      new Date(startDate),
      new Date(endDate),
    );
  }
}
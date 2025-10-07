import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsOptional, IsNumber, IsUUID, IsEnum, ValidateNested, Min } from 'class-validator';
import { Type } from 'class-transformer';

export class SensorReadingsDto {
  @ApiProperty({
    description: 'Soil moisture percentage before watering',
    example: 25,
    required: false
  })
  @IsNumber()
  @IsOptional()
  soilMoistureBefore?: number;

  @ApiProperty({
    description: 'Soil moisture percentage after watering',
    example: 65,
    required: false
  })
  @IsNumber()
  @IsOptional()
  soilMoistureAfter?: number;

  @ApiProperty({
    description: 'Temperature in Celsius',
    example: 23.5,
    required: false
  })
  @IsNumber()
  @IsOptional()
  temperature?: number;

  @ApiProperty({
    description: 'Humidity percentage',
    example: 55,
    required: false
  })
  @IsNumber()
  @IsOptional()
  humidity?: number;

  @ApiProperty({
    description: 'Light level in lux',
    example: 1200,
    required: false
  })
  @IsNumber()
  @IsOptional()
  light?: number;
}

export class CreateWateringHistoryDto {
  @ApiProperty({
    description: 'Type of watering',
    enum: ['manual', 'automatic', 'scheduled'],
    default: 'manual'
  })
  @IsEnum(['manual', 'automatic', 'scheduled'])
  wateringType: string;

  @ApiProperty({
    description: 'Amount of water in ml',
    example: 250
  })
  @IsNumber()
  @Min(1)
  waterAmount: number;

  @ApiProperty({
    description: 'Duration of watering in seconds',
    example: 10,
    required: false
  })
  @IsNumber()
  @Min(1)
  @IsOptional()
  duration?: number;

  @ApiProperty({
    description: 'Notes about this watering',
    example: 'Plant looked dry',
    required: false
  })
  @IsString()
  @IsOptional()
  notes?: string;

  @ApiProperty({
    description: 'ID of the schedule that triggered this watering',
    example: '5f7e0c1b-3c7d-4c47-b6c2-3e3a3a3a3a3a',
    required: false
  })
  @IsUUID()
  @IsOptional()
  scheduleId?: string;

  @ApiProperty({
    description: 'ID of the user who initiated this watering, or "system" for automatic watering',
    example: '5f7e0c1b-3c7d-4c47-b6c2-3e3a3a3a3a3a',
    required: false
  })
  @IsString()
  @IsOptional()
  initiatedBy?: string;

  @ApiProperty({
    description: 'Sensor readings at the time of watering',
    required: false,
    type: SensorReadingsDto
  })
  @ValidateNested()
  @Type(() => SensorReadingsDto)
  @IsOptional()
  sensorReadings?: SensorReadingsDto;
}
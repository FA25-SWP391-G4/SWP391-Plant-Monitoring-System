import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsOptional, IsNumber, IsBoolean, ValidateNested, Min } from 'class-validator';
import { Type } from 'class-transformer';

export class SensorConditionsDto {
  @ApiProperty({
    description: 'Water when soil moisture is below this percentage',
    example: 30,
    required: false
  })
  @IsNumber()
  @Min(0)
  @IsOptional()
  soilMoistureBelow?: number;

  @ApiProperty({
    description: 'Water when temperature is above this value in Celsius',
    example: 25,
    required: false
  })
  @IsNumber()
  @IsOptional()
  temperatureAbove?: number;
}

export class CreateWateringScheduleDto {
  @ApiProperty({
    description: 'Name of the watering schedule',
    example: 'Morning Watering'
  })
  @IsString()
  name: string;

  @ApiProperty({
    description: 'Description of the schedule',
    example: 'Water plants every morning',
    required: false
  })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiProperty({
    description: 'Cron expression for the schedule timing',
    example: '0 7 * * *', // Every day at 7 AM
  })
  @IsString()
  cronExpression: string;

  @ApiProperty({
    description: 'Amount of water in ml',
    example: 250,
    default: 250,
    required: false
  })
  @IsNumber()
  @Min(1)
  @IsOptional()
  waterAmount?: number;

  @ApiProperty({
    description: 'Whether the schedule is currently active',
    example: true,
    default: true,
    required: false
  })
  @IsBoolean()
  @IsOptional()
  isActive?: boolean;

  @ApiProperty({
    description: 'Sensor conditions that must be met to trigger watering',
    required: false,
    type: SensorConditionsDto
  })
  @ValidateNested()
  @Type(() => SensorConditionsDto)
  @IsOptional()
  sensorConditions?: SensorConditionsDto;

  @ApiProperty({
    description: 'Only water when sensor conditions are met (ignore schedule)',
    example: false,
    default: false,
    required: false
  })
  @IsBoolean()
  @IsOptional()
  onlySensorTriggered?: boolean;
}
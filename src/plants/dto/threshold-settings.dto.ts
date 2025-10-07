import { ApiProperty } from '@nestjs/swagger';
import { IsNumber, IsOptional, Min, Max } from 'class-validator';

export class ThresholdSettingsDto {
  @ApiProperty({
    description: 'Minimum soil moisture percentage',
    example: 20,
    required: false
  })
  @IsNumber()
  @Min(0)
  @Max(100)
  @IsOptional()
  soilMoistureMin?: number;

  @ApiProperty({
    description: 'Maximum soil moisture percentage',
    example: 60,
    required: false
  })
  @IsNumber()
  @Min(0)
  @Max(100)
  @IsOptional()
  soilMoistureMax?: number;

  @ApiProperty({
    description: 'Minimum temperature in Celsius',
    example: 15,
    required: false
  })
  @IsNumber()
  @IsOptional()
  temperatureMin?: number;

  @ApiProperty({
    description: 'Maximum temperature in Celsius',
    example: 30,
    required: false
  })
  @IsNumber()
  @IsOptional()
  temperatureMax?: number;

  @ApiProperty({
    description: 'Minimum humidity percentage',
    example: 30,
    required: false
  })
  @IsNumber()
  @Min(0)
  @Max(100)
  @IsOptional()
  humidityMin?: number;

  @ApiProperty({
    description: 'Maximum humidity percentage',
    example: 70,
    required: false
  })
  @IsNumber()
  @Min(0)
  @Max(100)
  @IsOptional()
  humidityMax?: number;

  @ApiProperty({
    description: 'Minimum light level (lux)',
    example: 500,
    required: false
  })
  @IsNumber()
  @Min(0)
  @IsOptional()
  lightMin?: number;

  @ApiProperty({
    description: 'Maximum light level (lux)',
    example: 2000,
    required: false
  })
  @IsNumber()
  @Min(0)
  @IsOptional()
  lightMax?: number;
}
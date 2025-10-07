import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsOptional, IsBoolean, IsNumber, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

export class ZoneSettingsDto {
  @ApiProperty({
    description: 'Default auto-watering setting for new plants in this zone',
    example: false,
    required: false
  })
  @IsBoolean()
  @IsOptional()
  autoWateringDefault?: boolean;

  @ApiProperty({
    description: 'Interval between sensor readings in minutes',
    example: 30,
    required: false
  })
  @IsNumber()
  @IsOptional()
  sensorReadingsInterval?: number;

  @ApiProperty({
    description: 'Whether notifications are enabled for this zone',
    example: true,
    required: false
  })
  @IsBoolean()
  @IsOptional()
  notificationsEnabled?: boolean;
}

export class CreateZoneDto {
  @ApiProperty({
    description: 'Name of the zone',
    example: 'Living Room'
  })
  @IsString()
  name: string;

  @ApiProperty({
    description: 'Description of the zone',
    example: 'Plants in the living room area',
    required: false
  })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiProperty({
    description: 'Zone settings',
    required: false,
    type: ZoneSettingsDto
  })
  @ValidateNested()
  @Type(() => ZoneSettingsDto)
  @IsOptional()
  settings?: ZoneSettingsDto;
}
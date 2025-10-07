import { PartialType } from '@nestjs/swagger';
import { CreatePlantDto } from './create-plant.dto';
import { IsBoolean, IsOptional } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class UpdatePlantDto extends PartialType(CreatePlantDto) {
  @ApiProperty({
    description: 'Whether auto-watering is enabled',
    example: true,
    required: false
  })
  @IsBoolean()
  @IsOptional()
  isAutoWateringEnabled?: boolean;
}
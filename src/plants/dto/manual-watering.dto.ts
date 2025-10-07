import { ApiProperty } from '@nestjs/swagger';
import { IsNumber, IsOptional, IsString, Min } from 'class-validator';

export class ManualWateringDto {
  @ApiProperty({
    description: 'Amount of water in ml',
    example: 250,
    required: false,
    default: 250
  })
  @IsNumber()
  @Min(1)
  @IsOptional()
  waterAmount?: number;

  @ApiProperty({
    description: 'Duration of watering in seconds',
    example: 10,
    required: false,
    default: 10
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
}
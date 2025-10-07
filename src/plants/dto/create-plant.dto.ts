import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsOptional, IsUUID, IsNumber, IsObject, Min, Max, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

export class CreatePlantDto {
  @ApiProperty({
    description: 'Plant name',
    example: 'Peace Lily'
  })
  @IsString()
  name: string;

  @ApiProperty({
    description: 'Plant species',
    example: 'Spathiphyllum',
    required: false
  })
  @IsString()
  @IsOptional()
  species?: string;

  @ApiProperty({
    description: 'Plant description',
    example: 'My living room peace lily',
    required: false
  })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiProperty({
    description: 'URL to plant image',
    example: '/uploads/plants/peace-lily.jpg',
    required: false
  })
  @IsString()
  @IsOptional()
  imageUrl?: string;

  @ApiProperty({
    description: 'Zone ID this plant belongs to',
    example: '5f7e0c1b-3c7d-4c47-b6c2-3e3a3a3a3a3a',
    required: false
  })
  @IsUUID()
  @IsOptional()
  zoneId?: string;
}
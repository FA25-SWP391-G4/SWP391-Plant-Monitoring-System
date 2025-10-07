import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsArray, IsBoolean, IsNumber, IsOptional, IsIn } from 'class-validator';

export class DashboardPreferencesDto {
  @ApiProperty({
    description: 'Dashboard layout type',
    enum: ['grid', 'list', 'compact'],
    example: 'grid'
  })
  @IsString()
  @IsIn(['grid', 'list', 'compact'])
  layout: string;

  @ApiProperty({
    description: 'Order of widgets on dashboard',
    example: ['plants', 'notifications', 'sensors']
  })
  @IsArray()
  widgetsOrder: string[];

  @ApiProperty({
    description: 'Whether charts are enabled',
    example: true
  })
  @IsBoolean()
  chartsEnabled: boolean;

  @ApiProperty({
    description: 'Dashboard auto-refresh rate in seconds',
    example: 60
  })
  @IsNumber()
  refreshRate: number;

  @ApiProperty({
    description: 'Additional user preferences as key-value pairs',
    example: { darkMode: true, compactView: false },
    required: false
  })
  @IsOptional()
  additionalPreferences?: Record<string, any>;
}
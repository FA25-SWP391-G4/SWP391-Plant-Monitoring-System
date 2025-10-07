import { Controller, Get, Post, Put, Body, Param, UseGuards, Req } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiResponse, ApiParam } from '@nestjs/swagger';
import { DashboardService } from './dashboard.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { DashboardPreferencesDto } from './dto/dashboard-preferences.dto';

@ApiTags('dashboard')
@Controller('dashboard')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class DashboardController {
  constructor(private readonly dashboardService: DashboardService) {}

  /**
   * UC4: View Plant Monitoring Dashboard
   * Gets all dashboard data for the authenticated user
   */
  @Get()
  @ApiOperation({ summary: 'Get dashboard data for authenticated user' })
  @ApiResponse({ 
    status: 200, 
    description: 'Returns dashboard data including plants, sensor readings, and notifications' 
  })
  async getDashboard(@Req() req) {
    const userId = req.user.userId;
    return this.dashboardService.getDashboardData(userId);
  }

  /**
   * UC18: Customize Dashboard
   * Saves user preferences for dashboard layout
   */
  @Put('preferences')
  @ApiOperation({ summary: 'Save dashboard preferences' })
  @ApiResponse({ status: 200, description: 'Dashboard preferences saved' })
  async saveDashboardPreferences(
    @Req() req,
    @Body() preferencesDto: DashboardPreferencesDto
  ) {
    const userId = req.user.userId;
    return this.dashboardService.saveDashboardPreferences(userId, preferencesDto);
  }
}
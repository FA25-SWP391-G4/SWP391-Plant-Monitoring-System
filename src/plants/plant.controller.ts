import { Controller, Get, Post, Put, Patch, Delete, Body, Param, UseGuards, Req, Query } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiResponse, ApiParam } from '@nestjs/swagger';
import { PlantService } from './plant.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CreatePlantDto } from './dto/create-plant.dto';
import { UpdatePlantDto } from './dto/update-plant.dto';
import { ManualWateringDto } from './dto/manual-watering.dto';
import { ThresholdSettingsDto } from './dto/threshold-settings.dto';
import { CreateScheduleDto } from './dto/create-schedule.dto';
import { UpdateScheduleDto } from './dto/update-schedule.dto';

@ApiTags('plants')
@Controller('plants')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class PlantController {
  constructor(private readonly plantService: PlantService) {}

  @Get()
  @ApiOperation({ summary: 'Get all plants for authenticated user' })
  @ApiResponse({ status: 200, description: 'Return all plants for the user' })
  async findAll(@Req() req) {
    return this.plantService.findAllByUser(req.user.userId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get plant by ID' })
  @ApiParam({ name: 'id', description: 'Plant ID' })
  @ApiResponse({ status: 200, description: 'Return the plant' })
  @ApiResponse({ status: 404, description: 'Plant not found' })
  async findOne(@Param('id') id: string, @Req() req) {
    return this.plantService.findById(id);
  }

  @Post()
  @ApiOperation({ summary: 'Create a new plant' })
  @ApiResponse({ status: 201, description: 'The plant has been successfully created' })
  async create(@Body() createPlantDto: CreatePlantDto, @Req() req) {
    return this.plantService.create(req.user.userId, createPlantDto);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update a plant' })
  @ApiParam({ name: 'id', description: 'Plant ID' })
  @ApiResponse({ status: 200, description: 'The plant has been successfully updated' })
  @ApiResponse({ status: 404, description: 'Plant not found' })
  async update(@Param('id') id: string, @Body() updatePlantDto: UpdatePlantDto, @Req() req) {
    return this.plantService.update(id, req.user.userId, updatePlantDto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a plant' })
  @ApiParam({ name: 'id', description: 'Plant ID' })
  @ApiResponse({ status: 200, description: 'The plant has been successfully deleted' })
  @ApiResponse({ status: 404, description: 'Plant not found' })
  async remove(@Param('id') id: string, @Req() req) {
    await this.plantService.remove(id, req.user.userId);
    return { message: 'Plant successfully deleted' };
  }

  /**
   * UC5: Manual Watering
   */
  @Post(':id/water')
  @ApiOperation({ summary: 'Trigger manual watering for a plant' })
  @ApiParam({ name: 'id', description: 'Plant ID' })
  @ApiResponse({ status: 200, description: 'Plant watered successfully' })
  @ApiResponse({ status: 404, description: 'Plant not found' })
  async waterPlant(
    @Param('id') id: string,
    @Body() wateringDto: ManualWateringDto,
    @Req() req
  ) {
    return this.plantService.manualWatering(id, req.user.userId, wateringDto);
  }

  /**
   * UC6: Configure Auto-Watering Schedule
   */
  @Post(':id/schedules')
  @ApiOperation({ summary: 'Create watering schedule for a plant' })
  @ApiParam({ name: 'id', description: 'Plant ID' })
  @ApiResponse({ status: 201, description: 'Schedule created successfully' })
  async createSchedule(
    @Param('id') plantId: string,
    @Body() scheduleDto: CreateScheduleDto,
    @Req() req
  ) {
    return this.plantService.createWateringSchedule(plantId, req.user.userId, scheduleDto);
  }

  @Put('schedules/:id')
  @ApiOperation({ summary: 'Update watering schedule' })
  @ApiParam({ name: 'id', description: 'Schedule ID' })
  @ApiResponse({ status: 200, description: 'Schedule updated successfully' })
  async updateSchedule(
    @Param('id') scheduleId: string,
    @Body() updateDto: UpdateScheduleDto,
    @Req() req
  ) {
    return this.plantService.updateWateringSchedule(scheduleId, req.user.userId, updateDto);
  }

  @Delete('schedules/:id')
  @ApiOperation({ summary: 'Delete watering schedule' })
  @ApiParam({ name: 'id', description: 'Schedule ID' })
  @ApiResponse({ status: 200, description: 'Schedule deleted successfully' })
  async deleteSchedule(@Param('id') scheduleId: string, @Req() req) {
    await this.plantService.removeWateringSchedule(scheduleId, req.user.userId);
    return { message: 'Schedule deleted successfully' };
  }

  /**
   * UC7: Toggle Auto-Watering Mode
   */
  @Patch(':id/auto-watering')
  @ApiOperation({ summary: 'Toggle auto-watering mode for a plant' })
  @ApiParam({ name: 'id', description: 'Plant ID' })
  @ApiResponse({ status: 200, description: 'Auto-watering mode updated' })
  async toggleAutoWatering(
    @Param('id') id: string,
    @Body() body: { enabled: boolean },
    @Req() req
  ) {
    return this.plantService.toggleAutoWatering(id, req.user.userId, body.enabled);
  }

  /**
   * UC16: Configure Advanced Sensor Thresholds
   */
  @Put(':id/thresholds')
  @ApiOperation({ summary: 'Update sensor thresholds for a plant' })
  @ApiParam({ name: 'id', description: 'Plant ID' })
  @ApiResponse({ status: 200, description: 'Thresholds updated successfully' })
  async updateThresholds(
    @Param('id') id: string,
    @Body() thresholds: ThresholdSettingsDto,
    @Req() req
  ) {
    return this.plantService.updateSensorThresholds(id, req.user.userId, thresholds);
  }
}
import { Body, Controller, Delete, Get, Param, Post, Put, Req, UseGuards } from '@nestjs/common';
import { NotificationService } from './notification.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { ApiOperation, ApiParam, ApiResponse, ApiTags } from '@nestjs/swagger';
import { Notification } from './entities/notification.entity';

@ApiTags('notifications')
@Controller('notifications')
@UseGuards(JwtAuthGuard)
export class NotificationController {
  constructor(private readonly notificationService: NotificationService) {}

  @Get()
  @ApiOperation({ summary: 'Get all notifications for current user' })
  @ApiResponse({ status: 200, description: 'Returns all notifications for the user', type: [Notification] })
  async getNotifications(@Req() req): Promise<Notification[]> {
    return this.notificationService.getNotificationsByUser(req.user.userId);
  }

  @Get('unread')
  @ApiOperation({ summary: 'Get all unread notifications for current user' })
  @ApiResponse({ status: 200, description: 'Returns all unread notifications for the user', type: [Notification] })
  async getUnreadNotifications(@Req() req): Promise<Notification[]> {
    return this.notificationService.getUnreadNotifications(req.user.userId);
  }

  @Put(':id/read')
  @ApiOperation({ summary: 'Mark a notification as read' })
  @ApiParam({ name: 'id', description: 'Notification ID' })
  @ApiResponse({ status: 200, description: 'Notification marked as read', type: Notification })
  async markAsRead(@Param('id') id: string, @Req() req): Promise<Notification> {
    return this.notificationService.markAsRead(id, req.user.userId);
  }

  @Put('read-all')
  @ApiOperation({ summary: 'Mark all notifications as read' })
  @ApiResponse({ status: 200, description: 'All notifications marked as read' })
  async markAllAsRead(@Req() req): Promise<{ message: string }> {
    await this.notificationService.markAllAsRead(req.user.userId);
    return { message: 'All notifications marked as read' };
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a notification' })
  @ApiParam({ name: 'id', description: 'Notification ID' })
  @ApiResponse({ status: 200, description: 'Notification deleted' })
  async deleteNotification(@Param('id') id: string, @Req() req): Promise<{ message: string }> {
    await this.notificationService.deleteNotification(id, req.user.userId);
    return { message: 'Notification deleted' };
  }
}
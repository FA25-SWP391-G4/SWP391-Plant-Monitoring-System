import { Injectable } from '@nestjs/common';
import { Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { Notification } from './entities/notification.entity';
import { CreateNotificationDto } from './dto/create-notification.dto';

@Injectable()
export class NotificationService {
  constructor(
    @InjectRepository(Notification)
    private notificationRepository: Repository<Notification>,
  ) {}

  /**
   * Create a new notification for a user
   */
  async createNotification(createNotificationDto: CreateNotificationDto): Promise<Notification> {
    const notification = this.notificationRepository.create(createNotificationDto);
    return this.notificationRepository.save(notification);
  }

  /**
   * Get all notifications for a user
   */
  async getNotificationsByUser(userId: string): Promise<Notification[]> {
    return this.notificationRepository.find({
      where: { userId },
      order: { createdAt: 'DESC' },
    });
  }

  /**
   * Get unread notifications for a user
   */
  async getUnreadNotifications(userId: string): Promise<Notification[]> {
    return this.notificationRepository.find({
      where: { userId, isRead: false },
      order: { createdAt: 'DESC' },
    });
  }

  /**
   * Mark a notification as read
   */
  async markAsRead(notificationId: string, userId: string): Promise<Notification> {
    const notification = await this.notificationRepository.findOne({
      where: { id: notificationId, userId }
    });

    if (!notification) {
      throw new Error('Notification not found');
    }

    notification.isRead = true;
    return this.notificationRepository.save(notification);
  }

  /**
   * Mark all notifications as read for a user
   */
  async markAllAsRead(userId: string): Promise<void> {
    await this.notificationRepository.update(
      { userId, isRead: false },
      { isRead: true }
    );
  }

  /**
   * Delete a notification
   */
  async deleteNotification(notificationId: string, userId: string): Promise<void> {
    await this.notificationRepository.delete({ id: notificationId, userId });
  }
  
  /**
   * Create a notification about sensor threshold
   */
  async createSensorAlertNotification(
    userId: string, 
    plantId: string, 
    plantName: string,
    sensorType: string, 
    value: number, 
    threshold: number
  ): Promise<Notification> {
    let message = '';
    let type = '';
    
    switch(sensorType) {
      case 'soil_moisture':
        if (value < threshold) {
          message = `Soil moisture for ${plantName} is low (${value}%). Your plant needs water!`;
          type = 'watering_needed';
        } else {
          message = `Soil moisture for ${plantName} has returned to normal levels (${value}%).`;
          type = 'moisture_normal';
        }
        break;
        
      case 'temperature':
        if (value > threshold) {
          message = `Temperature for ${plantName} is too high (${value}°C). Consider moving it to a cooler spot.`;
          type = 'temperature_high';
        } else {
          message = `Temperature for ${plantName} is too low (${value}°C). Consider moving it to a warmer spot.`;
          type = 'temperature_low';
        }
        break;
        
      case 'humidity':
        if (value < threshold) {
          message = `Humidity for ${plantName} is too low (${value}%). Consider using a humidifier.`;
          type = 'humidity_low';
        } else {
          message = `Humidity for ${plantName} has returned to normal levels (${value}%).`;
          type = 'humidity_normal';
        }
        break;
        
      case 'light':
        if (value < threshold) {
          message = `Light level for ${plantName} is too low (${value} lux). Consider moving it to a brighter spot.`;
          type = 'light_low';
        } else {
          message = `Light level for ${plantName} has returned to normal levels (${value} lux).`;
          type = 'light_normal';
        }
        break;
    }
    
    return this.createNotification({
      userId,
      type,
      message,
      relatedEntityId: plantId,
      relatedEntityType: 'plant',
    });
  }
}
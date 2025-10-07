import { Injectable } from '@nestjs/common';
import { SensorService } from '../sensors/sensor.service';
import { NotificationService } from '../notifications/notification.service';
import { UserService } from '../users/user.service';

@Injectable()
export class DashboardService {
  constructor(
    private readonly sensorService: SensorService,
    private readonly notificationService: NotificationService,
    private readonly userService: UserService,
  ) {}

  /**
   * UC4: View Plant Monitoring Dashboard
   * Retrieves all dashboard data for the user
   * @param userId The ID of the user
   * @returns Dashboard data including sensor readings, plant status and notifications
   */
  async getDashboardData(userId: string) {
    // Get the user's plants and zones
    const userPlants = await this.getUserPlants(userId);
    
    // Get real-time sensor data for all user plants
    const sensorData = await this.getSensorDataForPlants(userPlants);
    
    // Get recent notifications for the user
    const notifications = await this.notificationService.getRecentNotifications(userId);
    
    // Get user preferences for dashboard layout
    const dashboardPreferences = await this.getUserDashboardPreferences(userId);
    
    return {
      plants: userPlants,
      sensorData,
      notifications,
      preferences: dashboardPreferences
    };
  }
  
  /**
   * Retrieves user plants with their associated zones
   * @param userId The ID of the user
   * @returns Array of plants with zones
   */
  private async getUserPlants(userId: string) {
    // This would call the plant service to get user's plants
    // For now, we'll return a mock
    return [
      {
        id: 'plant-1',
        name: 'Peace Lily',
        zoneId: 'zone-1',
        zoneName: 'Living Room',
        imageUrl: '/images/plants/peace-lily.jpg',
        healthStatus: 'good',
        lastWatered: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000), // 2 days ago
      },
      {
        id: 'plant-2',
        name: 'Snake Plant',
        zoneId: 'zone-1',
        zoneName: 'Living Room',
        imageUrl: '/images/plants/snake-plant.jpg',
        healthStatus: 'good',
        lastWatered: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), // 7 days ago
      }
    ];
  }
  
  /**
   * Retrieves sensor data for the given plants
   * @param plants Array of plant objects
   * @returns Sensor data for each plant
   */
  private async getSensorDataForPlants(plants: any[]) {
    // This would call the sensor service to get real-time sensor data
    // For now, we'll return mocked data
    return plants.map(plant => ({
      plantId: plant.id,
      soilMoisture: Math.floor(Math.random() * 100),
      temperature: 20 + Math.random() * 5,
      humidity: 30 + Math.random() * 30,
      light: 200 + Math.random() * 800,
      lastUpdated: new Date()
    }));
  }
  
  /**
   * Retrieves user dashboard preferences
   * @param userId The ID of the user
   * @returns User preferences for dashboard layout
   */
  private async getUserDashboardPreferences(userId: string) {
    // This would get the user's saved dashboard preferences
    // For now, we'll return default preferences
    return {
      layout: 'grid',
      widgetsOrder: ['plants', 'notifications', 'sensors'],
      chartsEnabled: true,
      refreshRate: 60, // seconds
    };
  }
  
  /**
   * UC18: Customize Dashboard
   * Saves user preferences for dashboard layout
   * @param userId The ID of the user
   * @param preferences Dashboard preferences object
   * @returns Updated preferences
   */
  async saveDashboardPreferences(userId: string, preferences: any) {
    // This would save the user's dashboard preferences to the database
    // For now, we'll just return the input
    return {
      success: true,
      preferences
    };
  }
}
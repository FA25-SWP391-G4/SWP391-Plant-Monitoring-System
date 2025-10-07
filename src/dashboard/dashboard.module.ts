import { Module } from '@nestjs/common';
import { DashboardController } from './dashboard.controller';
import { DashboardService } from './dashboard.service';
import { SensorModule } from '../sensors/sensor.module';
import { NotificationModule } from '../notifications/notification.module';
import { UserModule } from '../users/user.module';

@Module({
  imports: [
    SensorModule,
    NotificationModule,
    UserModule
  ],
  controllers: [DashboardController],
  providers: [DashboardService],
  exports: [DashboardService]
})
export class DashboardModule {}
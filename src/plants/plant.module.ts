import { Module } from '@nestjs/common';
import { PlantController } from './plant.controller';
import { PlantService } from './plant.service';
import { SensorModule } from '../sensors/sensor.module';
import { UserModule } from '../users/user.module';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Plant } from './entities/plant.entity';
import { Zone } from './entities/zone.entity';
import { WateringSchedule } from './entities/watering-schedule.entity';
import { WateringHistory } from './entities/watering-history.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([Plant, Zone, WateringSchedule, WateringHistory]),
    SensorModule,
    UserModule
  ],
  controllers: [PlantController],
  providers: [PlantService],
  exports: [PlantService]
})
export class PlantModule {}
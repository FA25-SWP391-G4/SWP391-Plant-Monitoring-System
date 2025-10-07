import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SensorController } from './sensor.controller';
import { SensorService } from './sensor.service';
import { Sensor } from './entities/sensor.entity';
import { SensorData } from './entities/sensor-data.entity';
import { Plant } from '../plants/entities/plant.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([Sensor, SensorData, Plant]),
  ],
  controllers: [SensorController],
  providers: [SensorService],
  exports: [SensorService],
})
export class SensorModule {}
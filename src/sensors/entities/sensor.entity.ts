import { Column, Entity, ManyToOne, OneToMany, PrimaryGeneratedColumn } from 'typeorm';
import { Plant } from '../../plants/entities/plant.entity';
import { SensorData } from './sensor-data.entity';

@Entity()
export class Sensor {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  /**
   * Type of sensor (soil_moisture, temperature, humidity, light)
   */
  @Column()
  type: string;

  /**
   * Physical location of the sensor (e.g., "pot", "grow bed")
   */
  @Column({ nullable: true })
  location: string;

  /**
   * Sensor model information
   */
  @Column({ nullable: true })
  model: string;

  /**
   * When the sensor was installed/registered
   */
  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  createdAt: Date;

  /**
   * The plant this sensor is attached to
   */
  @ManyToOne(() => Plant, plant => plant.sensors)
  plant: Plant;

  /**
   * All readings from this sensor
   */
  @OneToMany(() => SensorData, sensorData => sensorData.sensor)
  readings: SensorData[];
}
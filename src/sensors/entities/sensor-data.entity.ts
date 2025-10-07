import { Column, Entity, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import { Sensor } from './sensor.entity';

@Entity()
export class SensorData {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  /**
   * The recorded value from the sensor
   */
  @Column('float')
  value: number;

  /**
   * Units of measurement (e.g., "%", "°C", etc.)
   */
  @Column({ nullable: true })
  unit: string;

  /**
   * When the reading was recorded
   */
  @Column({ type: 'timestamp' })
  timestamp: Date;

  /**
   * Additional metadata for the reading (JSON data)
   */
  @Column({ type: 'jsonb', nullable: true })
  metadata: Record<string, any>;

  /**
   * The sensor that produced this reading
   */
  @ManyToOne(() => Sensor, sensor => sensor.readings)
  sensor: Sensor;
}
import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn, CreateDateColumn, UpdateDateColumn } from 'typeorm';
import { Plant } from './plant.entity';

@Entity('watering_schedules')
export class WateringSchedule {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => Plant, plant => plant.wateringSchedules)
  @JoinColumn({ name: 'plantId' })
  plant: Plant;

  @Column()
  plantId: string;

  @Column()
  name: string;

  @Column({ nullable: true })
  description: string;

  @Column({ type: 'varchar' })
  cronExpression: string;

  @Column({ type: 'float', default: 250 })
  waterAmount: number;

  @Column({ default: true })
  isActive: boolean;

  @Column({ nullable: true })
  lastRun: Date;

  @Column({ nullable: true })
  nextRun: Date;

  @Column({ type: 'jsonb', nullable: true })
  sensorConditions: {
    soilMoistureBelow?: number;
    temperatureAbove?: number;
  };

  @Column({ default: false })
  onlySensorTriggered: boolean;

  @Column({ type: 'int', default: 0 })
  consecutiveSkips: number;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn, CreateDateColumn } from 'typeorm';
import { Plant } from './plant.entity';

@Entity('watering_history')
export class WateringHistory {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => Plant, plant => plant.wateringHistory)
  @JoinColumn({ name: 'plantId' })
  plant: Plant;

  @Column()
  plantId: string;

  @Column({ 
    type: 'enum',
    enum: ['manual', 'automatic', 'scheduled'],
    default: 'manual'
  })
  wateringType: string;

  @Column({ type: 'float' })
  waterAmount: number;

  @Column({ type: 'jsonb', nullable: true })
  sensorReadings: {
    soilMoistureBefore?: number;
    soilMoistureAfter?: number;
    temperature?: number;
    humidity?: number;
    light?: number;
  };

  @Column({ nullable: true })
  duration: number;

  @Column({ nullable: true })
  notes: string;

  @Column({ nullable: true })
  scheduleId: string;

  @Column({ nullable: true })
  initiatedBy: string; // userId or 'system'

  @CreateDateColumn({ name: 'watered_at' })
  wateredAt: Date;
}
import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, OneToMany, JoinColumn, CreateDateColumn, UpdateDateColumn } from 'typeorm';
import { User } from '../../users/entities/user.entity';
import { Zone } from './zone.entity';
import { WateringSchedule } from './watering-schedule.entity';
import { WateringHistory } from './watering-history.entity';

@Entity('plants')
export class Plant {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  name: string;

  @Column({ nullable: true })
  species: string;

  @Column({ nullable: true })
  imageUrl: string;

  @Column({ 
    type: 'enum', 
    enum: ['good', 'warning', 'critical', 'unknown'],
    default: 'unknown'
  })
  healthStatus: string;

  @Column({ nullable: true })
  description: string;

  @Column({ default: false })
  isAutoWateringEnabled: boolean;

  @Column({ nullable: true })
  lastWateredAt: Date;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'userId' })
  user: User;

  @Column()
  userId: string;

  @ManyToOne(() => Zone, zone => zone.plants)
  @JoinColumn({ name: 'zoneId' })
  zone: Zone;

  @Column({ nullable: true })
  zoneId: string;

  @OneToMany(() => WateringSchedule, schedule => schedule.plant)
  wateringSchedules: WateringSchedule[];

  @OneToMany(() => WateringHistory, history => history.plant)
  wateringHistory: WateringHistory[];

  @Column({ type: 'jsonb', nullable: true })
  sensorThresholds: {
    soilMoistureMin?: number;
    soilMoistureMax?: number;
    temperatureMin?: number;
    temperatureMax?: number;
    humidityMin?: number;
    humidityMax?: number;
    lightMin?: number;
    lightMax?: number;
  };

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
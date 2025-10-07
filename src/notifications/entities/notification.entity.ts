import { Column, CreateDateColumn, Entity, PrimaryGeneratedColumn } from 'typeorm';

@Entity()
export class Notification {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  /**
   * The user ID this notification belongs to
   */
  @Column()
  userId: string;

  /**
   * The message content of the notification
   */
  @Column()
  message: string;

  /**
   * The type/category of notification (e.g., watering_needed, moisture_normal)
   */
  @Column()
  type: string;

  /**
   * Whether the notification has been read
   */
  @Column({ default: false })
  isRead: boolean;

  /**
   * ID of the related entity (e.g., plant ID)
   */
  @Column({ nullable: true })
  relatedEntityId: string;

  /**
   * Type of the related entity (e.g., 'plant', 'sensor')
   */
  @Column({ nullable: true })
  relatedEntityType: string;

  /**
   * When the notification was created
   */
  @CreateDateColumn()
  createdAt: Date;
}
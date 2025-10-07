import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, Index } from 'typeorm';

@Entity('token_blacklist')
@Index(['userId', 'token']) // Create a composite index for faster lookups
export class TokenBlacklist {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: 'user_id' })
  userId: number;

  @Column({ type: 'text' })
  token: string;

  @CreateDateColumn({ name: 'blacklisted_at' })
  blacklistedAt: Date;

  @Column({ name: 'expires_at' })
  expiresAt: Date;
}
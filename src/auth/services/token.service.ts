import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ConfigService } from '@nestjs/config';
import { TokenBlacklist } from '../entities/token-blacklist.entity';

@Injectable()
export class TokenService {
  constructor(
    @InjectRepository(TokenBlacklist)
    private tokenBlacklistRepository: Repository<TokenBlacklist>,
    private configService: ConfigService,
  ) {}

  /**
   * Adds a token to the blacklist
   * @param userId The user ID associated with the token
   * @param token The token to blacklist
   * @param expiresAt The expiration date of the token
   */
  async blacklistToken(userId: number, token: string, expiresAt: Date): Promise<void> {
    const blacklistedToken = this.tokenBlacklistRepository.create({
      userId,
      token,
      expiresAt,
    });

    await this.tokenBlacklistRepository.save(blacklistedToken);
  }

  /**
   * Checks if a token is blacklisted
   * @param userId The user ID associated with the token
   * @param token The token to check
   * @returns true if blacklisted, false otherwise
   */
  async isTokenBlacklisted(userId: number, token: string): Promise<boolean> {
    const count = await this.tokenBlacklistRepository.count({
      where: { userId, token },
    });

    return count > 0;
  }

  /**
   * Removes expired tokens from the blacklist
   * This should be run as a scheduled task
   */
  async removeExpiredTokens(): Promise<void> {
    const now = new Date();
    await this.tokenBlacklistRepository
      .createQueryBuilder()
      .delete()
      .where('expiresAt < :now', { now })
      .execute();
  }

  /**
   * Blacklists all tokens for a specific user
   * @param userId The user ID to blacklist all tokens for
   */
  async blacklistAllUserTokens(userId: number): Promise<void> {
    // This is a placeholder implementation
    // In a real-world scenario, you'd need to track all active tokens
    // and blacklist them individually, or implement a version-based check
    // where all tokens issued before a certain timestamp are considered invalid
  }
}
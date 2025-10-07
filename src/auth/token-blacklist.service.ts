import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ConfigService } from '@nestjs/config';
import { TokenBlacklist } from './entities/token-blacklist.entity';
import { JwtService } from '@nestjs/jwt';

@Injectable()
export class TokenBlacklistService {
  constructor(
    @InjectRepository(TokenBlacklist)
    private readonly tokenBlacklistRepository: Repository<TokenBlacklist>,
    private readonly configService: ConfigService,
    private readonly jwtService: JwtService
  ) {}

  /**
   * Add a token to the blacklist
   * @param token JWT token to blacklist
   */
  async addToBlacklist(token: string): Promise<void> {
    try {
      // Decode the token to get the expiry time
      const decoded = this.jwtService.decode(token);
      
      if (!decoded || typeof decoded !== 'object' || !decoded.exp) {
        throw new Error('Invalid token format');
      }

      // Create expiry date from token
      const expiresAt = new Date(decoded.exp * 1000);
      const userId = decoded.sub;

      // Create and save blacklisted token
      const blacklistedToken = this.tokenBlacklistRepository.create({
        userId,
        token,
        expiresAt,
      });

      await this.tokenBlacklistRepository.save(blacklistedToken);
    } catch (error) {
      console.error('Error blacklisting token:', error);
      // Still save the token with a default expiry if there's an error
      const defaultExpiry = new Date();
      defaultExpiry.setDate(defaultExpiry.getDate() + 7); // 7 days from now as fallback

      await this.tokenBlacklistRepository.save({
        token,
        expiresAt: defaultExpiry,
      });
    }
  }

  /**
   * Check if a token is in the blacklist
   * @param token JWT token to check
   */
  async isBlacklisted(token: string): Promise<boolean> {
    const result = await this.tokenBlacklistRepository.findOne({ where: { token } });
    return !!result; // true if found, false if not
  }

  /**
   * Cleanup expired tokens from the blacklist
   * Should be called periodically via a scheduled task
   */
  async cleanupExpiredTokens(): Promise<void> {
    const now = new Date();
    await this.tokenBlacklistRepository
      .createQueryBuilder()
      .delete()
      .where('expiresAt < :now', { now })
      .execute();
  }

  /**
   * Blacklist all tokens for a user
   * Note: This is a simplified implementation. In a real-world scenario,
   * you would need to track all active tokens for each user.
   * @param userId User ID whose tokens should be blacklisted
   */
  async blacklistUserTokens(userId: string): Promise<void> {
    // In a real implementation, you would have a way to track or revoke all
    // of a user's tokens. This might involve a token version field on the user record
    // or storing all active tokens.
    console.log(`Blacklisting all tokens for user ${userId}`);
  }
}
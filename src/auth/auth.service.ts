import { Injectable, UnauthorizedException, BadRequestException, NotFoundException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { UserService } from '../users/user.service';
import { MailService } from '../mail/mail.service';
import { TokenBlacklistService } from './token-blacklist.service';
import { User } from '../users/entities/user.entity';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';
import { ChangePasswordDto } from './dto/change-password.dto';
import * as bcrypt from 'bcrypt';
import { v4 as uuidv4 } from 'uuid';
import { SystemLogService } from '../system-logs/system-log.service';
import { LogLevel } from '../system-logs/enums/log-level.enum';

@Injectable()
export class AuthService {
  constructor(
    private userService: UserService,
    private jwtService: JwtService,
    private configService: ConfigService,
    private mailService: MailService,
    private tokenBlacklistService: TokenBlacklistService,
    private systemLogService: SystemLogService
  ) {}

  /**
   * Validates user credentials during login
   * @param email User email
   * @param password User password
   * @returns User object if valid
   */
  async validateUser(email: string, password: string): Promise<any> {
    const user = await this.userService.findByEmail(email);
    
    if (!user) {
      throw new UnauthorizedException('Invalid email or password');
    }
    
    const isPasswordValid = await bcrypt.compare(password, user.password);
    
    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid email or password');
    }
    
    // Remove sensitive fields
    const { password: _, passwordResetToken: __, ...result } = user;
    return result;
  }

  /**
   * Generate JWT tokens (access and refresh)
   * @param user User object
   * @returns Access and refresh tokens
   */
  async generateTokens(user: any) {
    const payload = { 
      sub: user.id,
      email: user.email,
      role: user.role
    };
    
    const accessToken = this.jwtService.sign(payload, {
      expiresIn: this.configService.get('JWT_ACCESS_EXPIRES_IN') || '15m'
    });
    
    const refreshToken = this.jwtService.sign(payload, {
      expiresIn: this.configService.get('JWT_REFRESH_EXPIRES_IN') || '7d'
    });
    
    return {
      accessToken,
      refreshToken
    };
  }

  /**
   * UC1: User Registration
   * @param registerDto Registration data
   */
  async register(registerDto: RegisterDto) {
    const { email, password, confirmPassword, fullName } = registerDto;

    // Validate passwords match
    if (password !== confirmPassword) {
      throw new BadRequestException('Passwords do not match');
    }
    
    // Check if user exists
    const existingUser = await this.userService.findByEmail(email);
    if (existingUser) {
      throw new BadRequestException('Email already in use');
    }

    // Create user
    const hashedPassword = await bcrypt.hash(password, 12);
    const newUser = await this.userService.create({
      email,
      password: hashedPassword,
      fullName,
      role: 'Regular',
      notificationPrefs: {}
    });

    // Generate verification token
    const verificationToken = uuidv4();
    await this.userService.setVerificationToken(newUser.id, verificationToken);

    // Send welcome email with verification link
    await this.mailService.sendWelcomeEmail(newUser, verificationToken);

    // Log registration
    this.systemLogService.create({
      level: LogLevel.INFO,
      message: 'User registration',
      userId: newUser.id,
      data: { email: newUser.email }
    });

    // Generate tokens
    const tokens = await this.generateTokens(newUser);

    // Return user data and tokens
    return {
      user: {
        id: newUser.id,
        email: newUser.email,
        fullName: newUser.fullName,
        role: newUser.role,
        isVerified: newUser.isVerified
      },
      ...tokens
    };
  }

  /**
   * UC2: User Login
   * @param loginDto Login credentials
   */
  async login(loginDto: LoginDto) {
    const { email, password } = loginDto;
    
    // Validate credentials
    const user = await this.validateUser(email, password);
    
    // Check if email is verified
    if (!user.isVerified && this.configService.get('REQUIRE_EMAIL_VERIFICATION') === 'true') {
      throw new UnauthorizedException('Please verify your email address before logging in');
    }
    
    // Generate tokens
    const tokens = await this.generateTokens(user);
    
    // Log successful login
    this.systemLogService.create({
      level: LogLevel.INFO,
      message: 'User login',
      userId: user.id,
      data: { email: user.email }
    });
    
    // Update last login timestamp
    await this.userService.updateLastLogin(user.id);
    
    return {
      user: {
        id: user.id,
        email: user.email,
        fullName: user.fullName,
        role: user.role,
        isVerified: user.isVerified
      },
      ...tokens
    };
  }

  /**
   * UC3: User Logout
   * @param token JWT token to blacklist
   */
  async logout(userId: string, token: string) {
    // Blacklist token
    await this.tokenBlacklistService.addToBlacklist(token);
    
    // Log logout
    this.systemLogService.create({
      level: LogLevel.INFO,
      message: 'User logout',
      userId,
    });
    
    return { success: true, message: 'Successfully logged out' };
  }

  /**
   * UC11: Forgot Password - Request password reset
   * @param email User's email address
   */
  async forgotPassword(email: string) {
    const user = await this.userService.findByEmail(email);
    
    if (!user) {
      throw new NotFoundException('User not found with this email address');
    }

    // Generate reset token (JWT with short expiration)
    const payload = { sub: user.id, email: user.email, type: 'password_reset' };
    const resetToken = this.jwtService.sign(payload, {
      expiresIn: '1h' // 1 hour expiration
    });

    // Save reset token to user record
    const resetTokenHash = await bcrypt.hash(resetToken, 10);
    const resetExpires = new Date();
    resetExpires.setHours(resetExpires.getHours() + 1);
    
    await this.userService.updatePasswordReset(user.id, resetTokenHash, resetExpires);

    // Send password reset email
    const resetUrl = `${this.configService.get('FRONTEND_URL')}/reset-password?token=${resetToken}`;
    await this.mailService.sendPasswordResetEmail(user, resetUrl);

    return { 
      success: true, 
      message: 'Password reset email sent' 
    };
  }

  /**
   * UC11: Reset Password - Change password with reset token
   * @param resetPasswordDto Reset password data
   */
  async resetPassword(resetPasswordDto: ResetPasswordDto) {
    const { token, password, confirmPassword } = resetPasswordDto;
    
    // Validate passwords match
    if (password !== confirmPassword) {
      throw new BadRequestException('Passwords do not match');
    }
    
    // Verify and decode token
    let decoded: any;
    try {
      decoded = this.jwtService.verify(token);
    } catch (error) {
      throw new UnauthorizedException('Invalid or expired reset token');
    }
    
    // Get user
    const user = await this.userService.findById(decoded.sub);
    if (!user || !user.passwordResetToken) {
      throw new UnauthorizedException('Invalid or expired reset token');
    }
    
    // Check if token is still valid
    const now = new Date();
    if (now > user.passwordResetExpires) {
      throw new UnauthorizedException('Reset token has expired');
    }
    
    // Verify token matches stored hash
    const isTokenValid = await bcrypt.compare(token, user.passwordResetToken);
    if (!isTokenValid) {
      throw new UnauthorizedException('Invalid reset token');
    }
    
    // Update password
    const hashedPassword = await bcrypt.hash(password, 12);
    await this.userService.updatePassword(user.id, hashedPassword);
    
    // Clear reset token
    await this.userService.clearPasswordReset(user.id);
    
    // Log password reset
    this.systemLogService.create({
      level: LogLevel.INFO,
      message: 'Password reset',
      userId: user.id,
    });
    
    // Blacklist any existing tokens
    await this.tokenBlacklistService.blacklistUserTokens(user.id);
    
    // Send confirmation email
    await this.mailService.sendPasswordChangedEmail(user);
    
    return { 
      success: true, 
      message: 'Password has been reset successfully' 
    };
  }

  /**
   * UC12: Change Password - Change password when logged in
   * @param userId User ID
   * @param changePasswordDto Change password data
   */
  async changePassword(userId: string, changePasswordDto: ChangePasswordDto) {
    const { currentPassword, newPassword, confirmPassword } = changePasswordDto;
    
    // Validate passwords match
    if (newPassword !== confirmPassword) {
      throw new BadRequestException('New password and confirmation do not match');
    }
    
    // Get user
    const user = await this.userService.findById(userId);
    if (!user) {
      throw new NotFoundException('User not found');
    }
    
    // Verify current password
    const isPasswordValid = await bcrypt.compare(currentPassword, user.password);
    if (!isPasswordValid) {
      throw new UnauthorizedException('Current password is incorrect');
    }
    
    // Update password
    const hashedPassword = await bcrypt.hash(newPassword, 12);
    await this.userService.updatePassword(user.id, hashedPassword);
    
    // Log password change
    this.systemLogService.create({
      level: LogLevel.INFO,
      message: 'Password changed',
      userId: user.id,
    });
    
    // Blacklist all existing tokens
    await this.tokenBlacklistService.blacklistUserTokens(user.id);
    
    // Send confirmation email
    await this.mailService.sendPasswordChangedEmail(user);
    
    return { 
      success: true, 
      message: 'Password changed successfully' 
    };
  }

  /**
   * Verify Email
   * @param token Email verification token
   */
  async verifyEmail(token: string) {
    const user = await this.userService.findByVerificationToken(token);
    
    if (!user) {
      throw new UnauthorizedException('Invalid verification token');
    }
    
    await this.userService.verifyEmail(user.id);
    
    // Log email verification
    this.systemLogService.create({
      level: LogLevel.INFO,
      message: 'Email verified',
      userId: user.id,
    });
    
    return { 
      success: true, 
      message: 'Email successfully verified' 
    };
  }

  /**
   * Refresh Access Token
   * @param refreshToken Refresh token
   */
  async refreshToken(refreshToken: string) {
    // Verify token
    let decoded: any;
    try {
      decoded = this.jwtService.verify(refreshToken);
    } catch (error) {
      throw new UnauthorizedException('Invalid or expired refresh token');
    }
    
    // Check if token is blacklisted
    const isBlacklisted = await this.tokenBlacklistService.isBlacklisted(refreshToken);
    if (isBlacklisted) {
      throw new UnauthorizedException('Token has been invalidated');
    }
    
    // Get user
    const user = await this.userService.findById(decoded.sub);
    if (!user) {
      throw new NotFoundException('User not found');
    }
    
    // Generate new tokens
    const tokens = await this.generateTokens(user);
    
    // Blacklist old refresh token
    await this.tokenBlacklistService.addToBlacklist(refreshToken);
    
    return tokens;
  }
}
import { Test, TestingModule } from '@nestjs/testing';
import { AuthController } from '../../auth/auth.controller';
import { AuthService } from '../../auth/auth.service';
import { RegisterDto } from '../../auth/dto/register.dto';
import { LoginDto } from '../../auth/dto/login.dto';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { LocalAuthGuard } from '../../auth/guards/local-auth.guard';
import { ChangePasswordDto } from '../../auth/dto/change-password.dto';
import { ForgotPasswordDto } from '../../auth/dto/forgot-password.dto';
import { ResetPasswordDto } from '../../auth/dto/reset-password.dto';

// Mock the AuthService
const mockAuthService = {
  register: jest.fn(),
  login: jest.fn(),
  logout: jest.fn(),
  forgotPassword: jest.fn(),
  resetPassword: jest.fn(),
  changePassword: jest.fn(),
  verifyEmail: jest.fn(),
  refreshToken: jest.fn()
};

// Mock the guards
const mockJwtAuthGuard = { canActivate: jest.fn().mockReturnValue(true) };
const mockLocalAuthGuard = { canActivate: jest.fn().mockReturnValue(true) };

describe('AuthController', () => {
  let controller: AuthController;
  let authService: AuthService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AuthController],
      providers: [
        { provide: AuthService, useValue: mockAuthService }
      ],
    })
      .overrideGuard(JwtAuthGuard)
      .useValue(mockJwtAuthGuard)
      .overrideGuard(LocalAuthGuard)
      .useValue(mockLocalAuthGuard)
      .compile();

    controller = module.get<AuthController>(AuthController);
    authService = module.get<AuthService>(AuthService);

    // Reset all mocks before each test
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('register', () => {
    it('should call authService.register with correct parameters', async () => {
      // Arrange
      const registerDto: RegisterDto = {
        email: 'test@example.com',
        firstName: 'Test',
        lastName: 'User',
        password: 'Password123!',
        confirmPassword: 'Password123!'
      };
      const expectedResult = {
        user: {
          id: 'test-id',
          email: 'test@example.com'
        },
        accessToken: 'test-token',
        refreshToken: 'refresh-token'
      };
      mockAuthService.register.mockResolvedValue(expectedResult);

      // Act
      const result = await controller.register(registerDto);

      // Assert
      expect(mockAuthService.register).toHaveBeenCalledWith(registerDto);
      expect(result).toEqual(expectedResult);
    });
  });

  describe('login', () => {
    it('should call authService.login with correct parameters', async () => {
      // Arrange
      const loginDto: LoginDto = {
        email: 'test@example.com',
        password: 'Password123!'
      };
      const expectedResult = {
        user: {
          id: 'test-id',
          email: 'test@example.com'
        },
        accessToken: 'test-token',
        refreshToken: 'refresh-token'
      };
      mockAuthService.login.mockResolvedValue(expectedResult);

      // Act
      const result = await controller.login(loginDto);

      // Assert
      expect(mockAuthService.login).toHaveBeenCalledWith(loginDto);
      expect(result).toEqual(expectedResult);
    });
  });

  describe('logout', () => {
    it('should call authService.logout with correct parameters', async () => {
      // Arrange
      const req = {
        user: { userId: 'test-id' },
        headers: {
          authorization: 'Bearer test-token'
        }
      };
      const expectedResult = { success: true, message: 'Successfully logged out' };
      mockAuthService.logout.mockResolvedValue(expectedResult);

      // Act
      const result = await controller.logout(req);

      // Assert
      expect(mockAuthService.logout).toHaveBeenCalledWith('test-id', 'test-token');
      expect(result).toEqual(expectedResult);
    });
  });

  describe('forgotPassword', () => {
    it('should call authService.forgotPassword with correct email', async () => {
      // Arrange
      const forgotPasswordDto: ForgotPasswordDto = {
        email: 'test@example.com'
      };
      const expectedResult = { success: true, message: 'Password reset email sent' };
      mockAuthService.forgotPassword.mockResolvedValue(expectedResult);

      // Act
      const result = await controller.forgotPassword(forgotPasswordDto);

      // Assert
      expect(mockAuthService.forgotPassword).toHaveBeenCalledWith('test@example.com');
      expect(result).toEqual(expectedResult);
    });
  });

  describe('resetPassword', () => {
    it('should call authService.resetPassword with correct parameters', async () => {
      // Arrange
      const resetPasswordDto: ResetPasswordDto = {
        token: 'reset-token',
        password: 'NewPassword123!',
        confirmPassword: 'NewPassword123!'
      };
      const expectedResult = { success: true, message: 'Password has been reset successfully' };
      mockAuthService.resetPassword.mockResolvedValue(expectedResult);

      // Act
      const result = await controller.resetPassword(resetPasswordDto);

      // Assert
      expect(mockAuthService.resetPassword).toHaveBeenCalledWith(resetPasswordDto);
      expect(result).toEqual(expectedResult);
    });
  });

  describe('changePassword', () => {
    it('should call authService.changePassword with correct parameters', async () => {
      // Arrange
      const req = {
        user: { userId: 'test-id' }
      };
      const changePasswordDto: ChangePasswordDto = {
        currentPassword: 'OldPassword123!',
        newPassword: 'NewPassword123!',
        confirmNewPassword: 'NewPassword123!'
      };
      const expectedResult = { success: true, message: 'Password changed successfully' };
      mockAuthService.changePassword.mockResolvedValue(expectedResult);

      // Act
      const result = await controller.changePassword(req, changePasswordDto);

      // Assert
      expect(mockAuthService.changePassword).toHaveBeenCalledWith('test-id', changePasswordDto);
      expect(result).toEqual(expectedResult);
    });
  });

  describe('verifyEmail', () => {
    it('should call authService.verifyEmail with correct token', async () => {
      // Arrange
      const token = 'verification-token';
      const expectedResult = { success: true, message: 'Email successfully verified' };
      mockAuthService.verifyEmail.mockResolvedValue(expectedResult);

      // Act
      const result = await controller.verifyEmail(token);

      // Assert
      expect(mockAuthService.verifyEmail).toHaveBeenCalledWith(token);
      expect(result).toEqual(expectedResult);
    });
  });

  describe('refreshToken', () => {
    it('should call authService.refreshToken with correct token', async () => {
      // Arrange
      const refreshTokenDto = { refreshToken: 'refresh-token' };
      const expectedResult = {
        accessToken: 'new-access-token',
        refreshToken: 'new-refresh-token'
      };
      mockAuthService.refreshToken.mockResolvedValue(expectedResult);

      // Act
      const result = await controller.refreshToken(refreshTokenDto);

      // Assert
      expect(mockAuthService.refreshToken).toHaveBeenCalledWith('refresh-token');
      expect(result).toEqual(expectedResult);
    });
  });
});
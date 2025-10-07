import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, MinLength, Matches } from 'class-validator';

export class ResetPasswordDto {
  @ApiProperty({
    example: 'token-from-email',
    description: 'Reset token sent via email',
  })
  @IsNotEmpty({ message: 'Reset token is required' })
  token: string;

  @ApiProperty({
    example: 'StrongPassword123!',
    description: 'User new password - min 8 chars with uppercase, lowercase, number, and special character',
  })
  @IsNotEmpty({ message: 'Password is required' })
  @MinLength(8, { message: 'Password must be at least 8 characters long' })
  @Matches(/((?=.*\d)|(?=.*\W+))(?![.\n])(?=.*[A-Z])(?=.*[a-z]).*$/, {
    message: 'Password must contain uppercase, lowercase, number or special character',
  })
  password: string;

  @ApiProperty({
    example: 'StrongPassword123!',
    description: 'Confirm new password - must match password',
  })
  @IsNotEmpty({ message: 'Confirm password is required' })
  confirmPassword: string;
}
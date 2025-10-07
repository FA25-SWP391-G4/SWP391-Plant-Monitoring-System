import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, MinLength, Matches } from 'class-validator';

export class ChangePasswordDto {
  @ApiProperty({
    example: 'CurrentPassword123!',
    description: 'Current user password',
  })
  @IsNotEmpty({ message: 'Current password is required' })
  currentPassword: string;

  @ApiProperty({
    example: 'NewStrongPassword123!',
    description: 'User new password - min 8 chars with uppercase, lowercase, number, and special character',
  })
  @IsNotEmpty({ message: 'New password is required' })
  @MinLength(8, { message: 'New password must be at least 8 characters long' })
  @Matches(/((?=.*\d)|(?=.*\W+))(?![.\n])(?=.*[A-Z])(?=.*[a-z]).*$/, {
    message: 'New password must contain uppercase, lowercase, number or special character',
  })
  newPassword: string;

  @ApiProperty({
    example: 'NewStrongPassword123!',
    description: 'Confirm new password - must match new password',
  })
  @IsNotEmpty({ message: 'Confirm new password is required' })
  confirmNewPassword: string;
}
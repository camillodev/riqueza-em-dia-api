import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class ClerkUserDataDto {
  @ApiProperty({ description: 'Unique Clerk user ID' })
  @IsString()
  @IsNotEmpty()
  clerkId: string;

  @ApiProperty({ description: 'User email address' })
  @IsEmail()
  @IsNotEmpty()
  email: string;

  @ApiProperty({ description: 'Full name of the user' })
  @IsString()
  @IsNotEmpty()
  fullName: string;

  @ApiProperty({ description: 'URL to user avatar image', required: false })
  @IsString()
  @IsOptional()
  avatarUrl?: string;
} 
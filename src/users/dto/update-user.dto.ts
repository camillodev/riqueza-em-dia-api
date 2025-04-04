import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsOptional, IsString, MaxLength } from 'class-validator';

export class UpdateUserDto {
  @ApiProperty({ description: 'Full name of the user', required: false })
  @IsString()
  @IsOptional()
  @MaxLength(255)
  fullName?: string;

  @ApiProperty({ description: 'URL to the user avatar', required: false })
  @IsString()
  @IsOptional()
  @MaxLength(1024)
  avatarUrl?: string;
} 
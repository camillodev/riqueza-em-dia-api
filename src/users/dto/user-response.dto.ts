import { ApiProperty } from '@nestjs/swagger';

export class UserResponseDto {
  @ApiProperty({ description: 'Unique identifier of the user' })
  id: string;

  @ApiProperty({ description: 'Full name of the user' })
  fullName: string;

  @ApiProperty({ description: 'Email address of the user' })
  email: string;

  @ApiProperty({ description: 'URL to the user avatar', required: false })
  avatarUrl?: string;

  @ApiProperty({ description: 'User role' })
  role: string;

  @ApiProperty({ description: 'Date when the user last logged in', required: false })
  lastLoginAt?: Date;

  constructor(user: any) {
    this.id = user.id;
    this.fullName = user.full_name;
    this.email = user.email;
    this.avatarUrl = user.avatarUrl;
    this.role = user.role;
    this.lastLoginAt = user.last_login_at;
  }
} 
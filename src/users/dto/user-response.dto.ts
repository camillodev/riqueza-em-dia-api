import { ApiProperty } from '@nestjs/swagger';
import { User } from '@prisma/client';

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

  constructor(user: any) {
    this.id = user.id;
    this.fullName = user.full_name || user.name;
    this.email = user.email;
    this.avatarUrl = user.avatar_url || user.avatarUrl;
    this.role = user.role;
  }
} 
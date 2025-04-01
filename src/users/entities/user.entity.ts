import { ApiProperty } from '@nestjs/swagger';

export class User {
  @ApiProperty({ description: 'Unique identifier of the user' })
  id: string;

  @ApiProperty({ description: 'Full name of the user' })
  name: string;

  @ApiProperty({ description: 'Email address of the user' })
  email: string;

  @ApiProperty({ description: 'URL to the user avatar', required: false })
  avatarUrl?: string;

  @ApiProperty({ description: 'Hashed password of the user', readOnly: true })
  password: string;
} 
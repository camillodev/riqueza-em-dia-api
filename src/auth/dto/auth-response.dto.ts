import { ApiProperty } from '@nestjs/swagger';
import { UserResponseDto } from '../../users/dto/user-response.dto';

export class AuthResponseDto {
  @ApiProperty({ description: 'Access token for authentication' })
  accessToken: string;

  @ApiProperty({ description: 'User information' })
  user: UserResponseDto;
} 
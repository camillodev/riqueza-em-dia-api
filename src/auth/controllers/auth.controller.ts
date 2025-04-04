import { Body, Controller, Post, UnauthorizedException, Headers } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { AuthService } from '../services/auth.service';
import { AuthResponseDto } from '../dto/auth-response.dto';

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) { }

  @Post('token')
  @ApiOperation({ summary: 'Get token for authenticated Clerk user' })
  @ApiResponse({
    status: 200,
    description: 'Token generated successfully',
    type: AuthResponseDto,
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async getToken(@Headers('clerk-user-id') clerkUserId: string): Promise<AuthResponseDto> {
    if (!clerkUserId) {
      throw new UnauthorizedException('Clerk user ID is required');
    }

    return this.authService.generateTokenFromClerkUser(clerkUserId);
  }
} 
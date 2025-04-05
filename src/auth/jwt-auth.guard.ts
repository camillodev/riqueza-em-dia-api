import { Injectable, ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ClerkAuthService } from './services/clerk-auth.service';

@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
  constructor(private clerkAuthService: ClerkAuthService) {
    super();
  }

  async canActivate(context: ExecutionContext) {
    // Get request
    const request = context.switchToHttp().getRequest();

    // Extract token from request headers
    const token = this.extractTokenFromHeader(request);
    if (!token) {
      throw new UnauthorizedException('Authentication token is missing');
    }

    try {
      // Verify token with Clerk and get user data
      const user = await this.clerkAuthService.verifyTokenAndGetUser(token);

      // Attach user to request
      request.user = user;

      return true;
    } catch (error) {
      throw new UnauthorizedException('Invalid authentication token');
    }
  }

  private extractTokenFromHeader(request: any): string | undefined {
    const [type, token] = request.headers.authorization?.split(' ') ?? [];
    return type === 'Bearer' ? token : undefined;
  }
} 
import { Injectable, ExecutionContext, UnauthorizedException, Logger } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ClerkAuthService } from './services/clerk-auth.service';
import * as jwt from 'jsonwebtoken';

@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
  private readonly logger = new Logger(JwtAuthGuard.name);

  constructor(private clerkAuthService: ClerkAuthService) {
    super();
  }

  async canActivate(context: ExecutionContext) {
    const request = context.switchToHttp().getRequest();

    // Log headers in verbose mode
    this.logger.verbose(`Request headers: ${JSON.stringify(request.headers)}`);

    // Extract token from Authorization header
    const token = this.extractTokenFromHeader(request);
    if (!token) {
      this.logger.warn('No authentication token found in request headers');
      throw new UnauthorizedException('Authentication token missing');
    }

    try {
      // Verify token and get user data
      const user = await this.clerkAuthService.verifyTokenAndGetUser(token);

      // Add user to request
      request.user = user;
      return true;
    } catch (error) {
      this.logger.error(`Authentication failed: ${error.message}`, error.stack);
      throw new UnauthorizedException('Invalid authentication token');
    }
  }

  private extractTokenFromHeader(request: any): string | undefined {
    const [type, token] = request.headers.authorization?.split(' ') ?? [];
    return type === 'Bearer' ? token : undefined;
  }
} 
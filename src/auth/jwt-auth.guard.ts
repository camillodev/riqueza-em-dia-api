import { Injectable, ExecutionContext, UnauthorizedException, Logger } from '@nestjs/common';
import { CanActivate } from '@nestjs/common';
import { ClerkAuthService } from './services/clerk-auth.service';

@Injectable()
export class JwtAuthGuard implements CanActivate {
  private readonly logger = new Logger(JwtAuthGuard.name);

  constructor(private readonly clerkAuthService: ClerkAuthService) { }

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();

    // Log headers in verbose mode
    this.logger.verbose(`Request headers: ${JSON.stringify(request.headers)}`);

    // Extract token from Authorization header
    const authHeader = request.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      this.logger.warn('No authentication token found in request headers');
      throw new UnauthorizedException('Authentication token missing');
    }

    const token = authHeader.split(' ')[1];

    try {
      // Verify token and get user data
      const user = await this.clerkAuthService.verifyTokenAndGetUser(token);

      // Add user to request object
      request.user = user;
      return true;
    } catch (error) {
      this.logger.error(`Authentication failed: ${error.message}`, error.stack);
      throw new UnauthorizedException('Invalid authentication token');
    }
  }
} 
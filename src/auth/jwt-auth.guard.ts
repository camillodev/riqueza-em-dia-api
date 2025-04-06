import { Injectable, ExecutionContext, UnauthorizedException, Logger, Inject } from '@nestjs/common';
import { CanActivate } from '@nestjs/common';
import { verifyToken } from '@clerk/backend';
import { ConfigService } from '@nestjs/config';
import { ClerkClient } from '@clerk/backend';

@Injectable()
export class JwtAuthGuard implements CanActivate {
  private readonly logger = new Logger(JwtAuthGuard.name);

  constructor(
    @Inject('ClerkClient') private readonly clerkClient: ClerkClient,
    private readonly configService: ConfigService,
  ) { }

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
      // Use Clerk's verifyToken function (recommended approach)
      const tokenVerification = await verifyToken(token, {
        secretKey: this.configService.get<string>('CLERK_SECRET_KEY'),
      });

      const userId = tokenVerification.sub;

      // Set auth object with userId (Clerk pattern)
      request.auth = { userId };

      // Get the user details from Clerk
      const user = await this.clerkClient.users.getUser(userId);

      // Add user to request object
      request.user = user;

      return true;
    } catch (error) {
      this.logger.error(`Authentication failed: ${error.message}`, error.stack);
      throw new UnauthorizedException('Invalid authentication token');
    }
  }
} 
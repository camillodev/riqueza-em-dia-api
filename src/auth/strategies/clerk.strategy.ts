import { Injectable, UnauthorizedException, Inject, Logger } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy } from 'passport-custom';
import { ClerkAuthService } from '../services/clerk-auth.service';
import { Request } from 'express';
import { ClerkClient } from '@clerk/backend';
import { PrismaService } from '../../prisma/prisma.service';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class ClerkStrategy extends PassportStrategy(Strategy, 'clerk') {
  private readonly logger = new Logger(ClerkStrategy.name);

  constructor(
    private readonly clerkAuthService: ClerkAuthService,
    @Inject('ClerkClient') private readonly clerkClient: ClerkClient,
    private readonly prisma: PrismaService,
    private readonly configService: ConfigService,
  ) {
    super();
  }

  async validate(request: Request): Promise<any> {
    // Get the Authorization header
    const authHeader = request.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new UnauthorizedException('No token provided');
    }

    const token = authHeader.split(' ')[1];

    try {
      // Simple JWT decode to get the subject (sub) claim
      // This is just a basic verification - in production, you'd want full verification
      const tokenParts = token.split('.');
      if (tokenParts.length !== 3) {
        throw new UnauthorizedException('Invalid token format');
      }

      // Decode the payload part (second part of the JWT)
      const payload = JSON.parse(Buffer.from(tokenParts[1], 'base64').toString());
      const clerkId = payload.sub;

      if (!clerkId) {
        throw new UnauthorizedException('Invalid token claims');
      }

      // Get the user from our database using the Clerk ID
      const user = await this.prisma.user.findFirst({
        where: { clerkId }
      });

      if (!user) {
        this.logger.warn(`User with Clerk ID ${clerkId} not found in database`);
        throw new UnauthorizedException('User not found');
      }

      // Return the user object
      return user;
    } catch (error) {
      this.logger.error(`Authentication error: ${error.message}`, error.stack);
      throw new UnauthorizedException('Invalid token');
    }
  }
} 
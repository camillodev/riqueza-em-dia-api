import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy } from 'passport-custom';
import { ClerkAuthService } from '../services/clerk-auth.service';
import { Request } from 'express';

@Injectable()
export class ClerkStrategy extends PassportStrategy(Strategy, 'clerk') {
  constructor(private clerkAuthService: ClerkAuthService) {
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
      // For now, just return a simple user object
      // This is a placeholder - in a real implementation, you would
      // verify the token with Clerk's API and get the actual user data
      return {
        id: 'user-id',
        email: 'user@example.com',
        // This is just a temporary solution to make the authentication pass
      };
    } catch (error) {
      throw new UnauthorizedException('Invalid token');
    }
  }
} 
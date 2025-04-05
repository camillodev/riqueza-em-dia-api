import { Injectable, Logger, UnauthorizedException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { UserResponseDto } from '../../users/dto/user-response.dto';
import { ClerkUserDataDto } from '../dto/clerk-auth.dto';
import { Prisma } from '@prisma/client';
import axios from 'axios';

@Injectable()
export class ClerkAuthService {
  private readonly logger = new Logger(ClerkAuthService.name);

  constructor(
    private readonly prisma: PrismaService,
  ) { }

  /**
   * Get or create a user based on Clerk authentication
   * This should be called after Clerk authenticates a user
   */
  async getOrCreateUser(clerkData: ClerkUserDataDto): Promise<UserResponseDto> {
    try {
      // Find user by Clerk ID if exists
      let user = await this.prisma.user.findFirst({
        where: {
          clerkId: clerkData.clerkId
        } as any,
      });

      // If user doesn't exist, create one
      if (!user) {
        // Check if email already exists
        const existingUserWithEmail = await this.prisma.user.findUnique({
          where: { email: clerkData.email },
        });

        if (existingUserWithEmail) {
          // If user with email exists but doesn't have a clerkId, link them
          user = await this.prisma.user.update({
            where: { id: existingUserWithEmail.id },
            data: {
              clerkId: clerkData.clerkId,
              avatarUrl: clerkData.avatarUrl || existingUserWithEmail.avatarUrl,
              lastLoginAt: new Date(),
            } as any,
          });
        } else {
          // Create new user
          user = await this.prisma.user.create({
            data: {
              clerkId: clerkData.clerkId,
              email: clerkData.email,
              fullName: clerkData.fullName,
              avatarUrl: clerkData.avatarUrl,
              role: 'trial',
            } as any,
          });
        }
      } else {
        // Update user info
        user = await this.prisma.user.update({
          where: { id: user.id },
          data: {
            email: clerkData.email,
            fullName: clerkData.fullName,
            avatarUrl: clerkData.avatarUrl || user.avatarUrl,
            lastLoginAt: new Date(),
          } as any,
        });
      }

      return new UserResponseDto(user);
    } catch (error) {
      this.logger.error(`Error in getOrCreateUser: ${error.message}`, error.stack);
      throw error;
    }
  }

  /**
   * Verify a JWT token with Clerk and get or create the user in our database
   * @param token JWT token from the client
   * @returns User data if the token is valid, throws Unauthorized exception otherwise
   */
  async verifyTokenAndGetUser(token: string): Promise<UserResponseDto> {
    try {
      // Get Clerk API key from environment variables
      const clerkApiKey = process.env.CLERK_API_KEY;
      if (!clerkApiKey) {
        this.logger.error('CLERK_API_KEY is not defined');
        throw new UnauthorizedException('Authentication service not properly configured');
      }

      // Verify the token with Clerk API
      const response = await axios.get('https://api.clerk.dev/v1/me', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        }
      });

      // Extract user data from Clerk's response
      const clerkUser = response.data;
      const clerkId = clerkUser.id;

      if (!clerkId) {
        throw new UnauthorizedException('Invalid token');
      }

      // Find user in our database
      let user = await this.prisma.user.findFirst({
        where: { clerkId } as any,
      });

      // If user is not found in our database but exists in Clerk
      if (!user) {
        // Extract required data from Clerk user
        const primaryEmail = clerkUser.email_addresses?.find(email => email.primary)?.email_address
          || clerkUser.email
          || `${clerkId}@placeholder.com`;

        const firstName = clerkUser.first_name || '';
        const lastName = clerkUser.last_name || '';
        const fullName = clerkUser.name || `${firstName} ${lastName}`.trim() || 'User';
        const avatarUrl = clerkUser.image_url || clerkUser.profile_image_url || null;

        // Create user data DTO
        const clerkUserData = new ClerkUserDataDto();
        clerkUserData.clerkId = clerkId;
        clerkUserData.email = primaryEmail;
        clerkUserData.fullName = fullName;
        clerkUserData.avatarUrl = avatarUrl;

        // Create the user in our database
        return await this.getOrCreateUser(clerkUserData);
      }

      return new UserResponseDto(user);
    } catch (error) {
      this.logger.error(`Error verifying token: ${error.message}`, error.stack);

      // Specific error for unauthorized
      if (error instanceof UnauthorizedException) {
        throw error;
      }

      // Generic error for any other issues
      throw new UnauthorizedException('Authentication failed');
    }
  }
} 
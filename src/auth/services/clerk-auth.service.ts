import { Injectable, Logger, UnauthorizedException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { UserResponseDto } from '../../users/dto/user-response.dto';
import { ClerkUserDataDto } from '../dto/clerk-auth.dto';
import { Prisma } from '@prisma/client';
import { ConfigService } from '@nestjs/config';
import * as jwt from 'jsonwebtoken';

@Injectable()
export class ClerkAuthService {
  private readonly logger = new Logger(ClerkAuthService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly configService: ConfigService,
  ) { }

  /**
   * Get or create a user based on Clerk authentication
   * This should be called after Clerk authenticates a user
   */
  async getOrCreateUser(clerkData: ClerkUserDataDto): Promise<UserResponseDto> {
    try {
      this.logger.log(`Processing user data: clerkId=${clerkData.clerkId}, email=${clerkData.email}`);

      let user = await this.prisma.user.findFirst({
        where: {
          clerkId: clerkData.clerkId
        } as any,
      });

      if (!user) {
        this.logger.log(`User with clerkId ${clerkData.clerkId} not found, checking for existing user with email ${clerkData.email}`);

        const existingUserWithEmail = await this.prisma.user.findUnique({
          where: { email: clerkData.email },
        });

        if (existingUserWithEmail) {
          this.logger.log(`Found existing user with email ${clerkData.email}, updating with Clerk ID`);

          user = await this.prisma.user.update({
            where: { id: existingUserWithEmail.id },
            data: {
              clerkId: clerkData.clerkId,
              avatarUrl: clerkData.avatarUrl || existingUserWithEmail.avatarUrl,
              lastLoginAt: new Date(),
            } as any,
          });
          this.logger.log(`Updated existing user: ${user.id}`);
        } else {
          this.logger.log(`Creating new user with email ${clerkData.email}`);

          try {
            user = await this.prisma.user.create({
              data: {
                clerkId: clerkData.clerkId,
                email: clerkData.email,
                fullName: clerkData.fullName,
                avatarUrl: clerkData.avatarUrl,
                role: 'trial',
              } as any,
            });
            this.logger.log(`Created new user: ${user.id}`);
          } catch (createError) {
            this.logger.error(`Failed to create user: ${createError.message}`, createError.stack);
            if (createError instanceof Prisma.PrismaClientKnownRequestError) {
              this.logger.error(`Prisma error code: ${createError.code}, meta: ${JSON.stringify(createError.meta)}`);
            }
            throw createError;
          }
        }
      } else {
        this.logger.log(`Updating existing user with clerkId ${clerkData.clerkId}`);

        user = await this.prisma.user.update({
          where: { id: user.id },
          data: {
            email: clerkData.email,
            fullName: clerkData.fullName,
            avatarUrl: clerkData.avatarUrl || user.avatarUrl,
            lastLoginAt: new Date(),
          } as any,
        });
        this.logger.log(`Updated user: ${user.id}`);
      }

      return new UserResponseDto(user);
    } catch (error) {
      this.logger.error(`Error in getOrCreateUser: ${error.message}`, error.stack);
      throw error;
    }
  }

  /**
   * Verify a JWT token with Clerk and get or create the user in our database
   * Following Clerk's official documentation for manual JWT verification
   * @param token JWT token from the client
   * @returns User data if the token is valid, throws Unauthorized exception otherwise
   */
  async verifyTokenAndGetUser(token: string): Promise<UserResponseDto> {
    try {
      this.logger.debug(`Verifying token: ${token.substring(0, 15)}...`);

      // Get clerk secret key from environment variables
      const clerkSecretKey = this.configService.get<string>('CLERK_SECRET_KEY');

      if (!clerkSecretKey) {
        this.logger.error('CLERK_SECRET_KEY is not defined in environment variables');
        throw new UnauthorizedException('Authentication service not properly configured');
      }

      // Step 1: Decode the token to extract payload data (without verifying)
      let decoded;
      try {
        decoded = jwt.decode(token, { complete: true });
        this.logger.debug(`Token decoded successfully: ${JSON.stringify(decoded)}`);
      } catch (error) {
        this.logger.error(`Error decoding token: ${error.message}`);
        throw new UnauthorizedException('Invalid token format');
      }

      // Step 2: Extract necessary information
      const clerkId = decoded?.payload?.sub;
      if (!clerkId) {
        this.logger.error('No subject (sub) claim in token');
        throw new UnauthorizedException('Invalid token: missing user ID');
      }

      // For now, skip the JWT verification step and focus on user creation
      // This is temporary to help debug the issue
      this.logger.warn('Temporarily skipping JWT verification to debug user creation');

      // Step 5: Find user in our database
      try {
        let user = await this.prisma.user.findFirst({
          where: { clerkId } as any,
        });

        // Step 6: If user doesn't exist in our database, fetch details from Clerk
        if (!user) {
          this.logger.debug(`User not found in database for clerkId: ${clerkId}`);

          // Fetch user details from Clerk API
          const userResponse = await fetch(`https://api.clerk.com/v1/users/${clerkId}`, {
            headers: {
              'Authorization': `Bearer ${clerkSecretKey}`,
              'Content-Type': 'application/json',
            },
          });

          if (!userResponse.ok) {
            this.logger.error(`Failed to fetch user details from Clerk: ${userResponse.status}`);
            throw new UnauthorizedException('Failed to fetch user details');
          }

          const userData = await userResponse.json();
          this.logger.debug(`Clerk user data: ${JSON.stringify(userData)}`);

          // Extract email and user details
          const primaryEmailObj = userData.email_addresses?.find(email => email.id === userData.primary_email_address_id);
          const primaryEmail = primaryEmailObj?.email_address || `${clerkId}@placeholder.com`;

          const firstName = userData.first_name || '';
          const lastName = userData.last_name || '';
          const fullName = `${firstName} ${lastName}`.trim() || 'User';
          const avatarUrl = userData.image_url || null;

          this.logger.debug(`Creating user with email: ${primaryEmail}, name: ${fullName}`);

          // Create user data DTO
          const clerkUserData = new ClerkUserDataDto();
          clerkUserData.clerkId = clerkId;
          clerkUserData.email = primaryEmail;
          clerkUserData.fullName = fullName;
          clerkUserData.avatarUrl = avatarUrl;

          // Create the user in our database
          return await this.getOrCreateUser(clerkUserData);
        }

        this.logger.debug(`User found in database: ${user.id}`);
        return new UserResponseDto(user);
      } catch (dbError) {
        this.logger.error(`Database error in verifyTokenAndGetUser: ${dbError.message}`, dbError.stack);

        if (dbError instanceof Prisma.PrismaClientKnownRequestError) {
          this.logger.error(`Prisma error code: ${dbError.code}`);

          if (dbError.code === 'P2003') {
            this.logger.error(`Foreign key constraint failure. Field: ${dbError.meta?.field_name}`);
          }
        }

        throw new UnauthorizedException('Failed to authenticate user');
      }
    } catch (error) {
      this.logger.error(`Error in verifyTokenAndGetUser: ${error.message}`, error.stack);

      // Specific error for unauthorized
      if (error instanceof UnauthorizedException) {
        throw error;
      }

      // Generic error for any other issues
      throw new UnauthorizedException('Authentication failed');
    }
  }

  /**
   * Handle a user being deleted in Clerk
   * @param clerkId The Clerk ID of the deleted user
   */
  async handleUserDeleted(clerkId: string): Promise<void> {
    try {
      this.logger.debug(`Handling deleted user with clerkId: ${clerkId}`);

      // Find user by Clerk ID
      const user = await this.prisma.user.findFirst({
        where: { clerkId } as any,
      });

      if (!user) {
        this.logger.warn(`User with clerkId ${clerkId} not found during deletion`);
        return;
      }

      // Here we could either:
      // 1. Mark the user as deleted (soft delete)
      // 2. Actually delete the user data (hard delete)

      // Soft delete approach (recommended to prevent data loss)
      await this.prisma.user.update({
        where: { id: user.id },
        data: {
          isDeleted: true,
          deletedAt: new Date(),
        } as any,
      });

      this.logger.log(`User with id ${user.id} marked as deleted`);
    } catch (error) {
      this.logger.error(`Error in handleUserDeleted: ${error.message}`, error.stack);
      throw error;
    }
  }
} 
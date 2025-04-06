import { Injectable, Logger, UnauthorizedException, Inject } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { UserResponseDto } from '../../users/dto/user-response.dto';
import { ClerkUserDataDto } from '../dto/clerk-auth.dto';
import { Prisma } from '@prisma/client';
import { ConfigService } from '@nestjs/config';
import { ClerkClient } from '@clerk/backend';

@Injectable()
export class ClerkAuthService {
  private readonly logger = new Logger(ClerkAuthService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly configService: ConfigService,
    @Inject('ClerkClient') private readonly clerkClient: ClerkClient,
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
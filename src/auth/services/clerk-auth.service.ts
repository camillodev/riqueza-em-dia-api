import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { UserResponseDto } from '../../users/dto/user-response.dto';
import { ClerkUserDataDto } from '../dto/clerk-auth.dto';
import { Prisma } from '@prisma/client';

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
} 
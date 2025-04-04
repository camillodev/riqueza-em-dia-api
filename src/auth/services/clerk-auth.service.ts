import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { UserResponseDto } from '../../users/dto/user-response.dto';

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
  async getOrCreateUser(
    clerkData: {
      clerkId: string;
      email: string;
      fullName: string;
      avatarUrl?: string;
    },
  ): Promise<UserResponseDto> {
    try {
      // Find user by Clerk ID if exists
      let user = await this.prisma.user.findFirst({
        where: {
          clerk_id: clerkData.clerkId
        },
      });

      // If user doesn't exist, create one
      if (!user) {
        // Check if email already exists
        const existingUserWithEmail = await this.prisma.user.findUnique({
          where: { email: clerkData.email },
        });

        if (existingUserWithEmail) {
          // If user with email exists but doesn't have a clerk_id, link them
          user = await this.prisma.user.update({
            where: { id: existingUserWithEmail.id },
            data: {
              clerk_id: clerkData.clerkId,
              avatarUrl: clerkData.avatarUrl || existingUserWithEmail.avatarUrl,
              last_login_at: new Date(),
            },
          });
        } else {
          // Create new user
          user = await this.prisma.user.create({
            data: {
              clerk_id: clerkData.clerkId,
              email: clerkData.email,
              full_name: clerkData.fullName,
              avatarUrl: clerkData.avatarUrl,
              role: 'trial',
            },
          });
        }
      } else {
        // Update user info
        user = await this.prisma.user.update({
          where: { id: user.id },
          data: {
            email: clerkData.email,
            full_name: clerkData.fullName,
            avatarUrl: clerkData.avatarUrl || user.avatarUrl,
            last_login_at: new Date(),
          },
        });
      }

      return new UserResponseDto(user);
    } catch (error) {
      this.logger.error(`Error in getOrCreateUser: ${error.message}`, error.stack);
      throw error;
    }
  }
} 
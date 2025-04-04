import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { UserResponseDto } from '../../users/dto/user-response.dto';

@Injectable()
export class ClerkAuthService {
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
    // Find user by Clerk ID
    let user = await this.prisma.user.findUnique({
      where: { clerk_id: clerkData.clerkId },
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
            avatar_url: clerkData.avatarUrl || existingUserWithEmail.avatar_url,
            // Update login time
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
            avatar_url: clerkData.avatarUrl,
          },
        });
      }
    } else {
      // Update user login time
      user = await this.prisma.user.update({
        where: { id: user.id },
        data: {
          last_login_at: new Date(),
          // Optionally update other fields that might have changed in Clerk
          email: clerkData.email,
          full_name: clerkData.fullName,
          avatar_url: clerkData.avatarUrl || user.avatar_url,
        },
      });
    }

    return new UserResponseDto(user);
  }
} 
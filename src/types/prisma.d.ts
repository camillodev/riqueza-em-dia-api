import { Prisma } from '@prisma/client';

// Extend the Prisma namespace to include our mapped field names
declare global {
  namespace PrismaTypes {
    // Add mapped fields to UserWhereInput
    interface UserWhereInput extends Prisma.UserWhereInput {
      clerkId?: string | Prisma.StringFilter<"User">;
      fullName?: string | Prisma.StringFilter<"User">;
      lastLoginAt?: Date | Prisma.DateTimeFilter<"User">;
    }

    // Add mapped fields to UserUpdateInput
    interface UserUpdateInput extends Prisma.UserUpdateInput {
      clerkId?: string;
      fullName?: string;
      lastLoginAt?: Date;
    }

    // Add mapped fields to UserCreateInput
    interface UserCreateInput extends Prisma.UserCreateInput {
      clerkId?: string;
      fullName: string;
      lastLoginAt?: Date;
    }
  }
} 
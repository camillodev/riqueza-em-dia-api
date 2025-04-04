import { Injectable, NotFoundException } from '@nestjs/common';
import { UpdateUserDto } from '../dto/update-user.dto';
import { PrismaService } from '../../prisma/prisma.service';
import { User } from '@prisma/client';

// This is a mock service. In a real application, you would use a database.
@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) { }

  async findById(id: string): Promise<User> {
    const user = await this.prisma.user.findUnique({
      where: { id },
    });

    if (!user) {
      throw new NotFoundException(`User with ID ${id} not found`);
    }

    return user;
  }

  async updateUser(id: string, updateUserDto: UpdateUserDto): Promise<User> {
    // Check if user exists
    await this.findById(id);

    // Convert DTO fields to match database schema
    const updateData: any = {};

    if (updateUserDto.fullName !== undefined) {
      updateData.full_name = updateUserDto.fullName;
    }

    if (updateUserDto.avatarUrl !== undefined) {
      updateData.avatar_url = updateUserDto.avatarUrl;
    }

    // Update user
    return this.prisma.user.update({
      where: { id },
      data: updateData,
    });
  }
} 
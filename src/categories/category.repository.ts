import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateCategoryDto, UpdateCategoryDto } from './category.schema';

@Injectable()
export class CategoryRepository {
  constructor(private prisma: PrismaService) { }

  async findAllByUserId(userId: string) {
    return this.prisma.category.findMany({
      where: { userId },
      orderBy: { name: 'asc' },
    });
  }

  async findById(id: string, userId: string) {
    return this.prisma.category.findFirst({
      where: { id, userId },
    });
  }

  async create(data: CreateCategoryDto, userId: string) {
    return this.prisma.category.create({
      data: {
        ...data,
        userId,
      },
    });
  }

  async update(id: string, data: UpdateCategoryDto, userId: string) {
    return this.prisma.category.update({
      where: { id, userId },
      data,
    });
  }

  async delete(id: string, userId: string) {
    return this.prisma.category.delete({
      where: { id, userId },
    });
  }
} 
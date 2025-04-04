import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { Account } from '@prisma/client';
import { CreateAccountDto } from '../dto/create-account.dto';
import { UpdateAccountDto } from '../dto/update-account.dto';
import { ArchiveAccountDto } from '../dto/archive-account.dto';

@Injectable()
export class AccountsService {
  constructor(private readonly prisma: PrismaService) { }

  async findAllByUserId(userId: string): Promise<Account[]> {
    return this.prisma.account.findMany({
      where: { userId },
    });
  }

  async findOneById(id: string, userId: string): Promise<Account> {
    const account = await this.prisma.account.findFirst({
      where: { id, userId },
    });

    if (!account) {
      throw new NotFoundException(`Account with ID ${id} not found`);
    }

    return account;
  }

  async create(userId: string, createAccountDto: CreateAccountDto): Promise<Account> {
    return this.prisma.account.create({
      data: {
        ...createAccountDto,
        userId,
      },
    });
  }

  async update(id: string, userId: string, updateAccountDto: UpdateAccountDto): Promise<Account> {
    // Check if account exists and belongs to user
    await this.findOneById(id, userId);

    return this.prisma.account.update({
      where: { id },
      data: updateAccountDto,
    });
  }

  async remove(id: string, userId: string): Promise<Account> {
    // Check if account exists and belongs to user
    await this.findOneById(id, userId);

    return this.prisma.account.delete({
      where: { id },
    });
  }

  async updateArchiveStatus(id: string, userId: string, archiveAccountDto: ArchiveAccountDto): Promise<Account> {
    // Check if account exists and belongs to user
    await this.findOneById(id, userId);

    return this.prisma.account.update({
      where: { id },
      data: { isArchived: archiveAccountDto.isArchived },
    });
  }
} 
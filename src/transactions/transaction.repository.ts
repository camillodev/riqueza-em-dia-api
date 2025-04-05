import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { TransactionFilter } from '../schemas/transaction.schema';
import { Prisma, Transaction } from '@prisma/client';
import { PaginationQueryParams } from '../common/dtos/pagination.dto';

@Injectable()
export class TransactionRepository {
  private readonly logger = new Logger(TransactionRepository.name);

  constructor(private readonly prisma: PrismaService) { }

  async findAll(
    userId: string,
    filter: TransactionFilter,
    pagination: PaginationQueryParams,
  ): Promise<{ transactions: Transaction[]; total: number }> {
    const { page = 1, limit = 10, sortBy = 'date', sortOrder = 'desc' } = pagination;
    const skip = (page - 1) * limit;

    // Build the where clause based on filters
    const where: Prisma.TransactionWhereInput = {
      userId,
      // Only include if filter parameter is provided
      ...(filter.type && { type: filter.type }),
      ...(filter.account && { accountId: filter.account }),
      ...(filter.category && { categoryId: filter.category }),
      ...(filter.month && {
        date: {
          gte: new Date(`${filter.month}-01`),
          lt: new Date(
            new Date(`${filter.month}-01`).getFullYear(),
            new Date(`${filter.month}-01`).getMonth() + 1,
            1,
          ),
        },
      }),
      ...(filter.search && {
        OR: [
          { description: { contains: filter.search, mode: 'insensitive' } },
        ],
      }),
    };

    // Build the orderBy object
    const orderBy: Prisma.TransactionOrderByWithRelationInput = {
      [filter.sort || sortBy]: filter.order || sortOrder,
    };

    // Execute the query with pagination
    const [transactions, total] = await Promise.all([
      this.prisma.transaction.findMany({
        where,
        skip,
        take: limit,
        orderBy,
        include: {
          category: true,
          account: true,
        },
      }),
      this.prisma.transaction.count({ where }),
    ]);

    return { transactions, total };
  }

  async findOne(id: string, userId: string): Promise<Transaction | null> {
    return this.prisma.transaction.findFirst({
      where: {
        id,
        userId,
      },
      include: {
        category: true,
        account: true,
      },
    });
  }

  async create(
    userId: string,
    data: {
      amount: number;
      description: string;
      date: Date;
      type: 'income' | 'expense';
      accountId: string;
      categoryId: string | null;
      status: 'pending' | 'completed' | 'canceled';
    }
  ): Promise<Transaction> {
    return this.prisma.transaction.create({
      data: {
        ...data,
        userId,
      },
      include: {
        category: true,
        account: true,
      },
    });
  }

  async update(
    id: string,
    userId: string,
    data: Prisma.TransactionUpdateInput,
  ): Promise<Transaction> {
    return this.prisma.transaction.update({
      where: {
        id,
        userId,
      },
      data,
      include: {
        category: true,
        account: true,
      },
    });
  }

  async delete(id: string, userId: string): Promise<Transaction> {
    return this.prisma.transaction.delete({
      where: {
        id,
        userId,
      },
      include: {
        category: true,
        account: true,
      },
    });
  }

  // Calculate monthly summary for a user
  async getMonthlySummary(userId: string, year: number, month: number) {
    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 0);

    const result = await this.prisma.$queryRaw<
      Array<{ type: string; total: number }>
    >`
      SELECT "type", SUM("amount") as total
      FROM "Transaction"
      WHERE "userId" = ${userId}
      AND "date" >= ${startDate}
      AND "date" <= ${endDate}
      GROUP BY "type"
    `;

    const income = result.find(r => r.type === 'income')?.total || 0;
    const expense = result.find(r => r.type === 'expense')?.total || 0;

    return {
      income,
      expense,
      balance: income - expense,
      month: month,
      year: year,
    };
  }
} 
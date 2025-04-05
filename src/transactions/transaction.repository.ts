import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { TransactionFilter } from './transaction.schema';
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

    try {
      // Build the where clause based on filters
      const where: Prisma.TransactionWhereInput = {
        userId,
        // Only include if filter parameter is provided
        ...(filter.type && { type: filter.type }),
        ...(filter.account && { accountId: filter.account }),
        ...(filter.category && { categoryId: filter.category }),
      };

      // Handle month and year filtering
      if (filter.month && filter.year) {
        try {
          // Ensure values are valid numbers before parsing
          if (!/^\d{4}$/.test(filter.year) || !/^(0[1-9]|1[0-2])$/.test(filter.month)) {
            this.logger.warn(`Invalid format: year=${filter.year}, month=${filter.month}`);
          } else {
            const year = parseInt(filter.year);
            const month = parseInt(filter.month);

            // Create date range for the specified month
            const startDate = new Date(year, month - 1, 1); // Month is 0-indexed in JS Date
            const endDate = new Date(year, month, 0); // Last day of month
            endDate.setHours(23, 59, 59, 999); // End of day

            where.date = {
              gte: startDate,
              lte: endDate,
            };

            this.logger.debug(`Filtering transactions for ${year}-${month}`);
          }
        } catch (error) {
          this.logger.warn(`Error processing date parameters: year=${filter.year}, month=${filter.month}, error=${error.message}`);
        }
      } else if (filter.year) {
        // If only year is provided, filter for the entire year
        try {
          // Ensure value is a valid year before parsing
          if (!/^\d{4}$/.test(filter.year)) {
            this.logger.warn(`Invalid year format: ${filter.year}`);
          } else {
            const year = parseInt(filter.year);
            const startDate = new Date(year, 0, 1); // January 1st
            const endDate = new Date(year, 11, 31, 23, 59, 59, 999); // December 31st, end of day

            where.date = {
              gte: startDate,
              lte: endDate,
            };

            this.logger.debug(`Filtering transactions for year ${year}`);
          }
        } catch (error) {
          this.logger.warn(`Error processing year parameter: ${filter.year}, error=${error.message}`);
        }
      }

      // Handle search filter
      if (filter.search) {
        where.OR = [
          { description: { contains: filter.search, mode: 'insensitive' } },
        ];
      }

      // Validate and build the orderBy object
      const sortField = filter.sort || sortBy;
      const sortDirection = filter.order || sortOrder;

      const orderBy: Prisma.TransactionOrderByWithRelationInput = {
        [sortField]: sortDirection,
      };

      this.logger.debug(`Query params: where=${JSON.stringify(where)}, orderBy=${JSON.stringify(orderBy)}, skip=${skip}, take=${limit}`);

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
    } catch (error) {
      this.logger.error(`Error in findAll: ${error.message}`, error.stack);
      throw error;
    }
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
import { Injectable, Logger } from '@nestjs/common';
import { Account } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { CacheService } from '../../common/cache/cache.service';
import { BaseRepository } from '../../common/repositories/base.repository';
import { CreateAccountDto, UpdateAccountDto } from '../schemas/account.schema';
import { PaginationQueryParams } from '../../common/dtos/pagination.dto';

@Injectable()
export class AccountRepository extends BaseRepository<
  Account,
  CreateAccountDto,
  UpdateAccountDto
> {
  protected readonly logger = new Logger(AccountRepository.name);
  protected readonly entityName = 'Account';
  protected readonly cacheNamespace = 'accounts';
  protected readonly prismaModel: any;

  constructor(
    protected readonly prisma: PrismaService,
    protected readonly cacheService: CacheService,
  ) {
    super(prisma, cacheService);
    this.prismaModel = this.prisma.account;
  }

  /**
   * Find accounts with pagination and filtering
   */
  async findAllPaginated(
    userId: string,
    filter: { isArchived?: boolean } = {},
    { page, limit, sortBy, sortOrder }: PaginationQueryParams,
  ): Promise<[Account[], number]> {
    // Build the full filter
    const where: any = { userId };

    // Add archive filter if provided
    if (filter.isArchived !== undefined) {
      where.isArchived = filter.isArchived;
    }

    // Get total count for pagination
    const total = await this.prisma.account.count({ where });

    // Get items for current page with sorting
    const items = await this.prisma.account.findMany({
      where,
      skip: (page - 1) * limit,
      take: limit,
      orderBy: sortBy ? { [sortBy]: sortOrder } : { createdAt: 'desc' },
    });

    return [items, total];
  }

  /**
   * Update the archive status of an account
   */
  async updateArchiveStatus(
    id: string,
    isArchived: boolean,
    userId: string,
  ): Promise<Account> {
    return this.update(id, { isArchived }, userId);
  }

  /**
   * Get accounts summary (total balance, total accounts)
   */
  async getAccountsSummary(userId: string): Promise<{
    totalBalance: number;
    totalAccounts: number;
    activeAccounts: number;
  }> {
    const cacheKey = `summary:${userId}`;

    // Try cache first
    const cached = await this.cacheService.get<any>(cacheKey, this.cacheNamespace);
    if (cached) {
      return cached;
    }

    // Get accounts data
    const accounts = await this.prisma.account.findMany({
      where: { userId },
      select: {
        balance: true,
        isArchived: true,
      },
    });

    // Calculate summary
    const summary = {
      totalBalance: accounts.reduce((sum, account) => sum + Number(account.balance), 0),
      totalAccounts: accounts.length,
      activeAccounts: accounts.filter(a => !a.isArchived).length,
    };

    // Cache the summary
    await this.cacheService.set(cacheKey, summary, this.cacheNamespace, 60 * 5); // 5 minutes

    return summary;
  }
} 
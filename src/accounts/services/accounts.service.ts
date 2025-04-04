import { Injectable, Logger } from '@nestjs/common';
import { Account } from '@prisma/client';
import { AccountRepository } from '../repositories/account.repository';
import { CreateAccountDto, UpdateAccountDto } from '../schemas/account.schema';
import { PaginatedResponseDto, PaginationQueryParams } from '../../common/dtos/pagination.dto';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class AccountsService {
  private readonly logger = new Logger(AccountsService.name);

  constructor(
    private readonly accountRepository: AccountRepository,
    private readonly prisma: PrismaService,
  ) { }

  /**
   * Get all accounts for a user with pagination and filtering
   */
  async findAllByUserId(
    userId: string,
    filter: { isArchived?: boolean } = {},
    paginationOptions: PaginationQueryParams,
  ): Promise<PaginatedResponseDto<Account>> {
    this.logger.debug(`Finding accounts for user: ${userId} with filter: ${JSON.stringify(filter)}`);

    const [items, total] = await this.accountRepository.findAllPaginated(
      userId,
      filter,
      paginationOptions,
    );

    return new PaginatedResponseDto<Account>(
      items,
      total,
      paginationOptions.page,
      paginationOptions.limit,
    );
  }

  /**
   * Find an account by ID
   */
  async findOneById(id: string, userId: string): Promise<Account> {
    this.logger.debug(`Finding account: ${id} for user: ${userId}`);
    return this.accountRepository.findById(id, userId);
  }

  /**
   * Create a new account
   */
  async create(userId: string, createAccountDto: CreateAccountDto): Promise<Account> {
    this.logger.debug(`Creating account for user: ${userId}`);

    // Use a database transaction to ensure data consistency
    return this.prisma.$transaction(async (tx) => {
      const account = await this.accountRepository.create(createAccountDto, userId);

      // Additional logic can be added here if needed
      // For example, creating initial transactions, updating user stats, etc.

      return account;
    });
  }

  /**
   * Update an existing account
   */
  async update(id: string, userId: string, updateAccountDto: UpdateAccountDto): Promise<Account> {
    this.logger.debug(`Updating account: ${id} for user: ${userId}`);
    return this.accountRepository.update(id, updateAccountDto, userId);
  }

  /**
   * Delete an account
   */
  async remove(id: string, userId: string): Promise<Account> {
    this.logger.debug(`Removing account: ${id} for user: ${userId}`);

    // Use a transaction to ensure data consistency
    return this.prisma.$transaction(async (tx) => {
      // Check if there are any transactions associated with this account
      const transactionCount = await this.prisma.transaction.count({
        where: { accountId: id },
      });

      if (transactionCount > 0) {
        this.logger.debug(`Account ${id} has ${transactionCount} transactions; these will be deleted`);
      // We could implement a soft delete here instead, or move transactions to an "Archived" account
      }

      return this.accountRepository.delete(id, userId);
    });
  }

  /**
   * Update account archive status
   */
  async updateArchiveStatus(id: string, userId: string, isArchived: boolean): Promise<Account> {
    this.logger.debug(`Updating archive status for account: ${id} to: ${isArchived}`);
    return this.accountRepository.updateArchiveStatus(id, isArchived, userId);
  }

  /**
   * Get account summary for dashboard
   */
  async getAccountsSummary(userId: string): Promise<{
    totalBalance: number;
    totalAccounts: number;
    activeAccounts: number;
  }> {
    this.logger.debug(`Getting accounts summary for user: ${userId}`);
    return this.accountRepository.getAccountsSummary(userId);
  }
} 
import {
  Injectable,
  Logger,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { TransactionRepository } from '../repositories/transaction.repository';
import { PaginationQueryParams } from '../../common/dtos/pagination.dto';
import {
  CreateTransactionDto,
  UpdateTransactionDto,
  TransactionFilter,
} from '../schemas/transaction.schema';
import { PrismaService } from '../../prisma/prisma.service';
import { Transaction, Prisma } from '@prisma/client';

@Injectable()
export class TransactionsService {
  private readonly logger = new Logger(TransactionsService.name);

  constructor(
    private readonly transactionRepository: TransactionRepository,
    private readonly prisma: PrismaService,
  ) { }

  async findAll(
    userId: string,
    filter: TransactionFilter,
    pagination: PaginationQueryParams,
  ) {
    try {
      const { transactions, total } = await this.transactionRepository.findAll(
        userId,
        filter,
        pagination,
      );

      // Transform to the expected response format
      return {
        transactions: transactions.map(transaction => this.formatTransaction(transaction)),
        pagination: {
          total,
          pages: Math.ceil(total / pagination.limit),
          currentPage: pagination.page,
          limit: pagination.limit,
        },
      };
    } catch (error) {
      this.logger.error(`Error finding transactions: ${error.message}`, error.stack);
      throw error;
    }
  }

  async findOne(id: string, userId: string): Promise<Transaction> {
    const transaction = await this.transactionRepository.findOne(id, userId);

    if (!transaction) {
      throw new NotFoundException(`Transaction with ID ${id} not found`);
    }

    return transaction;
  }

  async create(userId: string, createTransactionDto: CreateTransactionDto): Promise<Transaction> {
    try {
      // Verify that the account exists and belongs to the user
      const account = await this.prisma.account.findFirst({
        where: {
          id: createTransactionDto.account,
          userId,
        },
      });

      if (!account) {
        throw new ForbiddenException('Account not found or does not belong to you');
      }

      // Verify that the category exists
      const category = await this.prisma.category.findUnique({
        where: {
          id: createTransactionDto.category,
        },
      });

      if (!category) {
        throw new NotFoundException(`Category with ID ${createTransactionDto.category} not found`);
      }

      // Use a transaction to update the account balance
      return await this.prisma.$transaction(async (prisma) => {
        // Create the transaction
        const transaction = await this.transactionRepository.create(userId, {
          amount: createTransactionDto.amount,
          description: createTransactionDto.description,
          date: new Date(createTransactionDto.date),
          type: createTransactionDto.type,
          status: createTransactionDto.status,
          accountId: createTransactionDto.account,
          categoryId: createTransactionDto.category
        });

        // Update account balance
        const balanceChange = createTransactionDto.type === 'income'
          ? createTransactionDto.amount
          : -createTransactionDto.amount;

        await prisma.account.update({
          where: { id: createTransactionDto.account },
          data: {
            balance: {
              increment: balanceChange,
            },
          },
        });

        return transaction;
      });
    } catch (error) {
      this.logger.error(`Error creating transaction: ${error.message}`, error.stack);

      if (error instanceof ForbiddenException || error instanceof NotFoundException) {
        throw error;
      }

      throw new BadRequestException('Failed to create transaction');
    }
  }

  async update(
    id: string,
    userId: string,
    updateTransactionDto: UpdateTransactionDto
  ): Promise<Transaction> {
    try {
      // Find the original transaction first to compare changes
      const existingTransaction = await this.findOne(id, userId);

      // If account is changing, verify new account belongs to user
      if (updateTransactionDto.account && updateTransactionDto.account !== existingTransaction.accountId) {
        const newAccount = await this.prisma.account.findFirst({
          where: {
            id: updateTransactionDto.account,
            userId,
          },
        });

        if (!newAccount) {
          throw new ForbiddenException('Account not found or does not belong to you');
        }
      }

      // If category is changing, verify it exists
      if (updateTransactionDto.category && updateTransactionDto.category !== existingTransaction.categoryId) {
        const category = await this.prisma.category.findUnique({
          where: { id: updateTransactionDto.category },
        });

        if (!category) {
          throw new NotFoundException(`Category with ID ${updateTransactionDto.category} not found`);
        }
      }

      // Prepare update data
      const updateData: Prisma.TransactionUpdateInput = {
        ...(updateTransactionDto.amount !== undefined && { amount: updateTransactionDto.amount }),
        ...(updateTransactionDto.description && { description: updateTransactionDto.description }),
        ...(updateTransactionDto.date && { date: new Date(updateTransactionDto.date) }),
        ...(updateTransactionDto.type && { type: updateTransactionDto.type }),
        ...(updateTransactionDto.status && { status: updateTransactionDto.status }),
        ...(updateTransactionDto.account && { accountId: updateTransactionDto.account }),
        ...(updateTransactionDto.category && { categoryId: updateTransactionDto.category }),
      };

      // Use a transaction to update both the transaction and adjust account balances
      return await this.prisma.$transaction(async (prisma) => {
        // Calculate financial impact of changes
        let oldAccountAdjustment = 0;
        let newAccountAdjustment = 0;

        // If amount or type changes, we need to adjust the old amount
        if (updateTransactionDto.amount !== undefined || updateTransactionDto.type !== undefined) {
          const oldAmount = Number(existingTransaction.amount);
          const oldType = existingTransaction.type;
          const newAmount = updateTransactionDto.amount !== undefined ? Number(updateTransactionDto.amount) : oldAmount;
          const newType = updateTransactionDto.type ?? oldType;

          // Reverse the old transaction effect
          oldAccountAdjustment = oldType === 'income' ? -oldAmount : oldAmount;

          // Apply the new transaction effect
          newAccountAdjustment = newType === 'income' ? newAmount : -newAmount;
        }

        // If account is changing, adjust both old and new account balances
        if (updateTransactionDto.account && updateTransactionDto.account !== existingTransaction.accountId) {
          // Adjust old account
          await prisma.account.update({
            where: { id: existingTransaction.accountId },
            data: { balance: { increment: oldAccountAdjustment } },
          });

          // Adjust new account
          await prisma.account.update({
            where: { id: updateTransactionDto.account },
            data: { balance: { increment: newAccountAdjustment } },
          });
        } else if (oldAccountAdjustment !== 0 || newAccountAdjustment !== 0) {
          // If only amount or type changed but not account, adjust the same account
          const netAdjustment = oldAccountAdjustment + newAccountAdjustment;
          await prisma.account.update({
            where: { id: existingTransaction.accountId },
            data: { balance: { increment: netAdjustment } },
          });
        }

        // Update the transaction
        return this.transactionRepository.update(id, userId, updateData);
      });
    } catch (error) {
      this.logger.error(`Error updating transaction: ${error.message}`, error.stack);

      if (error instanceof ForbiddenException || error instanceof NotFoundException) {
        throw error;
      }

      throw new BadRequestException('Failed to update transaction');
    }
  }

  async remove(id: string, userId: string): Promise<Transaction> {
    try {
      // Find the transaction to get its details before deletion
      const transaction = await this.findOne(id, userId);

      // Use a transaction to delete the transaction and update account balance
      return await this.prisma.$transaction(async (prisma) => {
        // Delete the transaction
        const deletedTransaction = await this.transactionRepository.delete(id, userId);

        // Update the account balance by reversing the transaction effect
        const balanceAdjustment = transaction.type === 'income'
          ? -Number(transaction.amount)
          : Number(transaction.amount);

        await prisma.account.update({
          where: { id: transaction.accountId },
          data: {
            balance: {
              increment: balanceAdjustment,
            },
          },
        });

        return deletedTransaction;
      });
    } catch (error) {
      this.logger.error(`Error deleting transaction: ${error.message}`, error.stack);

      if (error instanceof NotFoundException) {
        throw error;
      }

      throw new BadRequestException('Failed to delete transaction');
    }
  }

  // Helper method to format transaction for response
  private formatTransaction(transaction: any) {
    return {
      id: transaction.id,
      amount: Number(transaction.amount),
      description: transaction.description,
      date: transaction.date.toISOString().split('T')[0], // Format as YYYY-MM-DD
      category: transaction.category?.name || 'Uncategorized',
      categoryId: transaction.categoryId,
      type: transaction.type,
      account: transaction.account?.name || 'Unknown Account',
      accountId: transaction.accountId,
      status: transaction.status,
    };
  }
} 
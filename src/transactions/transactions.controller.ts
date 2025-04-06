import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  Logger,
  HttpCode,
  HttpStatus,
  UseInterceptors,
  ParseUUIDPipe,
  BadRequestException,
  NotFoundException,
  InternalServerErrorException,
} from '@nestjs/common';
import { CacheInterceptor } from '@nestjs/cache-manager';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiParam,
  ApiResponse,
  ApiTags,
  ApiQuery,
  ApiBody,
} from '@nestjs/swagger';
import { TransactionsService } from './transactions.service';
import { ClerkAuthGuard } from '../auth/clerk-auth.guard';
import { ZodValidationPipe } from '../common/pipes/zod-validation.pipe';
import { PaginationQuerySchema, PaginationQueryParams } from '../common/dtos/pagination.dto';
import {
  createTransactionSchema,
  updateTransactionSchema,
  transactionFilterSchema,
  CreateTransactionDto,
  UpdateTransactionDto,
  TransactionFilterDto,
} from './transaction.schema';
import { Transaction } from '@prisma/client';
import { TransactionResponseDto } from './dto/transaction-response.dto';
import { CreateTransactionRequestDto } from './dto/create-transaction.dto';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { User } from '@clerk/backend';

/**
 * Controller for managing financial transactions
 */
@ApiTags('transactions')
@Controller('transactions')
  @UseGuards(ClerkAuthGuard)
@ApiBearerAuth()
export class TransactionsController {
  private readonly logger = new Logger(TransactionsController.name);

  constructor(private readonly transactionsService: TransactionsService) { }

  @Get()
  @UseInterceptors(CacheInterceptor)
  @ApiOperation({ summary: 'List transactions' })
  @ApiQuery({ name: 'page', required: false, type: Number, description: 'Page number (starts from 1)', example: 1 })
  @ApiQuery({ name: 'limit', required: false, type: Number, description: 'Number of items per page (max 100)', example: 20 })
  @ApiQuery({ name: 'year', required: false, type: String, description: 'Filter by year (YYYY format)', example: '2025' })
  @ApiQuery({ name: 'month', required: false, type: String, description: 'Filter by month (MM format, 01-12). Requires year parameter.', example: '04' })
  @ApiQuery({ name: 'type', required: false, enum: ['income', 'expense'], description: 'Filter by transaction type' })
  @ApiQuery({ name: 'category', required: false, type: String, description: 'Filter by category ID (UUID)' })
  @ApiQuery({ name: 'account', required: false, type: String, description: 'Filter by account ID (UUID)' })
  @ApiQuery({ name: 'search', required: false, type: String, description: 'Search in transaction description' })
  @ApiQuery({ name: 'sort', required: false, enum: ['date', 'amount', 'description'], description: 'Field to sort by', example: 'date' })
  @ApiQuery({ name: 'order', required: false, enum: ['asc', 'desc'], description: 'Sort direction', example: 'desc' })
  @ApiResponse({
    status: 200,
    description: 'Returns paginated list of transactions with metadata',
    schema: {
      type: 'object',
      properties: {
        transactions: {
          type: 'array',
          items: { $ref: '#/components/schemas/TransactionResponseDto' }
        },
        pagination: {
          type: 'object',
          properties: {
            total: { type: 'number', example: 45 },
            pages: { type: 'number', example: 3 },
            currentPage: { type: 'number', example: 1 },
            limit: { type: 'number', example: 20 }
          }
        }
      }
    }
  })
  @ApiResponse({
    status: 400,
    description: 'Bad Request - Invalid parameters'
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized - Authentication is required'
  })
  async findAll(
    @CurrentUser() user: User,
    @Query(new ZodValidationPipe(PaginationQuerySchema)) paginationParams: PaginationQueryParams,
    @Query(new ZodValidationPipe(transactionFilterSchema)) filterParams: TransactionFilterDto,
  ) {
    try {
      this.logger.log(`GET transactions for user ${user.id} with filters: ${JSON.stringify(filterParams)}`);

      return await this.transactionsService.findAll(
        user.id,
        filterParams,
        paginationParams,
      );
    } catch (error) {
      this.logger.error(`Error getting transactions: ${error.message}`, error.stack);
      throw error;
    }
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get transaction by ID' })
  @ApiParam({ name: 'id', type: String, format: 'uuid', description: 'Transaction ID (UUID)', example: '123e4567-e89b-12d3-a456-426614174000' })
  @ApiResponse({
    status: 200,
    description: 'Returns the requested transaction',
    type: TransactionResponseDto,
  })
  @ApiResponse({
    status: 404,
    description: 'Transaction not found'
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized - Authentication is required'
  })
  async findOne(
    @CurrentUser() user: User,
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<Transaction> {
    try {
      this.logger.log(`GET transaction ${id} for user ${user.id}`);
      const transaction = await this.transactionsService.findOne(id, user.id);

      if (!transaction) {
        throw new NotFoundException(`Transaction with ID ${id} not found`);
      }

      return transaction;
    } catch (error) {
      this.logger.error(`Error getting transaction ${id}: ${error.message}`, error.stack);
      throw error;
    }
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create transaction' })
  @ApiBody({ type: CreateTransactionRequestDto, description: 'Transaction data to create. Amount must be in cents (integer)' })
  @ApiResponse({
    status: 201,
    description: 'Transaction created successfully',
    type: TransactionResponseDto,
  })
  @ApiResponse({
    status: 400,
    description: 'Bad Request - Invalid transaction data'
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized - Authentication is required'
  })
  async create(
    @CurrentUser() user: User,
    @Body(new ZodValidationPipe(createTransactionSchema)) createTransactionDto: CreateTransactionDto,
  ): Promise<Transaction> {
    try {
      this.logger.log(`POST new transaction for user ${user.id}`);
      return await this.transactionsService.create(user.id, createTransactionDto);
    } catch (error) {
      this.logger.error(`Error creating transaction: ${error.message}`, error.stack);
      if (error.code === 'P2003') {
        throw new BadRequestException(`Invalid reference: ${error.meta?.field_name || 'Unknown field'}`);
      }
      throw error;
    }
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update transaction' })
  @ApiParam({ name: 'id', type: String, format: 'uuid', description: 'Transaction ID (UUID)', example: '123e4567-e89b-12d3-a456-426614174000' })
  @ApiBody({ type: CreateTransactionRequestDto, description: 'Transaction data to update. Only specified fields will be updated.' })
  @ApiResponse({
    status: 200,
    description: 'Transaction updated successfully',
    type: TransactionResponseDto,
  })
  @ApiResponse({
    status: 400,
    description: 'Bad Request - Invalid transaction data'
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized - Authentication is required'
  })
  @ApiResponse({
    status: 404,
    description: 'Transaction not found'
  })
  async update(
    @CurrentUser() user: User,
    @Param('id', ParseUUIDPipe) id: string,
    @Body(new ZodValidationPipe(updateTransactionSchema)) updateTransactionDto: UpdateTransactionDto,
  ): Promise<Transaction> {
    try {
      this.logger.log(`PUT update transaction ${id} for user ${user.id}`);
      const transaction = await this.transactionsService.update(id, user.id, updateTransactionDto);

      if (!transaction) {
        throw new NotFoundException(`Transaction with ID ${id} not found or does not belong to user`);
      }

      return transaction;
    } catch (error) {
      this.logger.error(`Error updating transaction ${id}: ${error.message}`, error.stack);
      if (error.code === 'P2003') {
        throw new BadRequestException(`Invalid reference: ${error.meta?.field_name || 'Unknown field'}`);
      }
      throw error;
    }
  }

  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Delete transaction' })
  @ApiParam({ name: 'id', type: String, format: 'uuid', description: 'Transaction ID (UUID)', example: '123e4567-e89b-12d3-a456-426614174000' })
  @ApiResponse({
    status: 200,
    description: 'Transaction deleted successfully',
    type: TransactionResponseDto,
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized - Authentication is required'
  })
  @ApiResponse({
    status: 404,
    description: 'Transaction not found'
  })
  async remove(
    @CurrentUser() user: User,
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<Transaction> {
    try {
      this.logger.log(`DELETE transaction ${id} for user ${user.id}`);
      const transaction = await this.transactionsService.remove(id, user.id);

      if (!transaction) {
        throw new NotFoundException(`Transaction with ID ${id} not found or does not belong to user`);
      }

      return transaction;
    } catch (error) {
      this.logger.error(`Error deleting transaction ${id}: ${error.message}`, error.stack);
      throw error;
    }
  }

  @Get('debug/query')
  @ApiOperation({ summary: 'Debug query param parsing' })
  async debugQueryParams(@CurrentUser() user: User, @Query() rawQuery: Record<string, any>) {
    try {
      this.logger.debug(`Debug query params: ${JSON.stringify(rawQuery)}`);

      const processed = await this.preprocessQueryParams(rawQuery);

      return {
        original: rawQuery,
        processed,
        userId: user.id,
      };
    } catch (error) {
      this.logger.error(`Error in debug endpoint: ${error.message}`, error.stack);
      throw new InternalServerErrorException(`Error processing query: ${error.message}`);
    }
  }

  private async preprocessQueryParams(query: Record<string, any>) {
    return { ...query, processed: true };
  }
} 
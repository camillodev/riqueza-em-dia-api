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
  Request,
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
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
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

@ApiTags('transactions')
@Controller('transactions')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class TransactionsController {
  private readonly logger = new Logger(TransactionsController.name);

  constructor(private readonly transactionsService: TransactionsService) { }

  @Get()
  @UseInterceptors(CacheInterceptor)
  @ApiOperation({ summary: 'Get all transactions with pagination and filtering' })
  @ApiQuery({ name: 'page', required: false, type: Number, description: 'Page number (starts from 1)' })
  @ApiQuery({ name: 'limit', required: false, type: Number, description: 'Page size (max 100)' })
  @ApiQuery({
    name: 'month',
    required: false,
    type: String,
    description: 'Filter by month in YYYY-MM format (e.g., 2023-05) or month number (e.g., 04) - when using month number, year parameter is required'
  })
  @ApiQuery({
    name: 'year',
    required: false,
    type: String,
    description: 'Filter by year (YYYY) - required when month is provided as a number (01-12)'
  })
  @ApiQuery({ name: 'type', required: false, enum: ['income', 'expense'], description: 'Filter by transaction type' })
  @ApiQuery({ name: 'category', required: false, type: String, description: 'Filter by category ID' })
  @ApiQuery({ name: 'account', required: false, type: String, description: 'Filter by account ID' })
  @ApiQuery({ name: 'search', required: false, type: String, description: 'Search in description' })
  @ApiQuery({ name: 'sort', required: false, enum: ['date', 'amount', 'description'], description: 'Sort field' })
  @ApiQuery({ name: 'order', required: false, enum: ['asc', 'desc'], description: 'Sort direction' })
  @ApiResponse({
    status: 200,
    description: 'Returns all transactions with pagination. Note: Amounts are in cents (integer values)',
    type: [TransactionResponseDto],
  })
  @ApiResponse({
    status: 400,
    description: 'Bad Request - when required parameters are missing, such as year when month is provided as a number'
  })
  async findAll(
    @Request() req,
    @Query(new ZodValidationPipe(PaginationQuerySchema))
    paginationParams: PaginationQueryParams,
    @Query(new ZodValidationPipe(transactionFilterSchema))
    filterParams: TransactionFilterDto,
  ) {
    try {
      this.logger.log(`GET transactions for user ${req.user.id} with filters: ${JSON.stringify(filterParams)}`);

      return await this.transactionsService.findAll(
        req.user.id,
        filterParams,
        paginationParams,
      );
    } catch (error) {
      this.logger.error(`Error getting transactions: ${error.message}`, error.stack);
      throw error;
    }
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a specific transaction' })
  @ApiParam({ name: 'id', description: 'Transaction ID' })
  @ApiResponse({
    status: 200,
    description: 'Returns a specific transaction. Note: Amount is in cents (integer value)',
    type: TransactionResponseDto,
  })
  @ApiResponse({ status: 404, description: 'Transaction not found' })
  async findOne(
    @Request() req,
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<Transaction> {
    try {
      this.logger.log(`GET transaction ${id} for user ${req.user.id}`);
      const transaction = await this.transactionsService.findOne(id, req.user.id);

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
  @ApiOperation({ summary: 'Create a new transaction' })
  @ApiBody({ type: CreateTransactionRequestDto, description: 'Transaction data. Note: Amount must be in cents (integer)' })
  @ApiResponse({
    status: 201,
    description: 'Transaction created successfully. Response amount is in cents (integer)',
    type: TransactionResponseDto,
  })
  async create(
    @Request() req,
    @Body(new ZodValidationPipe(createTransactionSchema)) createTransactionDto: CreateTransactionDto,
  ): Promise<Transaction> {
    try {
      this.logger.log(`POST new transaction for user ${req.user.id}`);
      return await this.transactionsService.create(req.user.id, createTransactionDto);
    } catch (error) {
      this.logger.error(`Error creating transaction: ${error.message}`, error.stack);
      if (error.code === 'P2003') {
        throw new BadRequestException(`Invalid reference: ${error.meta?.field_name || 'Unknown field'}`);
      }
      throw error;
    }
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update an existing transaction' })
  @ApiParam({ name: 'id', description: 'Transaction ID' })
  @ApiBody({ type: CreateTransactionRequestDto, description: 'Transaction data to update. Note: Amount must be in cents (integer)' })
  @ApiResponse({
    status: 200,
    description: 'Transaction updated successfully. Response amount is in cents (integer)',
    type: TransactionResponseDto,
  })
  @ApiResponse({ status: 404, description: 'Transaction not found' })
  async update(
    @Request() req,
    @Param('id', ParseUUIDPipe) id: string,
    @Body(new ZodValidationPipe(updateTransactionSchema)) updateTransactionDto: UpdateTransactionDto,
  ): Promise<Transaction> {
    try {
      this.logger.log(`PUT update transaction ${id} for user ${req.user.id}`);
      const transaction = await this.transactionsService.update(id, req.user.id, updateTransactionDto);

      if (!transaction) {
        throw new NotFoundException(`Transaction with ID ${id} not found`);
      }

      return transaction;
    } catch (error) {
      this.logger.error(`Error updating transaction ${id}: ${error.message}`, error.stack);
      if (error.code === 'P2025') {
        throw new NotFoundException(`Transaction with ID ${id} not found`);
      }
      throw error;
    }
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a transaction' })
  @ApiParam({ name: 'id', description: 'Transaction ID' })
  @ApiResponse({
    status: 200,
    description: 'Transaction deleted successfully',
    type: TransactionResponseDto,
  })
  @ApiResponse({ status: 404, description: 'Transaction not found' })
  async remove(
    @Request() req,
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<Transaction> {
    try {
      this.logger.log(`DELETE transaction ${id} for user ${req.user.id}`);
      const transaction = await this.transactionsService.remove(id, req.user.id);

      if (!transaction) {
        throw new NotFoundException(`Transaction with ID ${id} not found`);
      }

      return transaction;
    } catch (error) {
      this.logger.error(`Error deleting transaction ${id}: ${error.message}`, error.stack);
      if (error.code === 'P2025') {
        throw new NotFoundException(`Transaction with ID ${id} not found`);
      }
      throw error;
    }
  }
} 
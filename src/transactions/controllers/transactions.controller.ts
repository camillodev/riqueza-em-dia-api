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
} from '@nestjs/common';
import { CacheInterceptor } from '@nestjs/cache-manager';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiParam,
  ApiResponse,
  ApiTags,
  ApiQuery,
  ApiProperty,
  ApiBody,
} from '@nestjs/swagger';
import { TransactionsService } from '../services/transactions.service';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { ZodValidationPipe } from '../../common/pipes/zod-validation.pipe';
import { PaginationQuerySchema, PaginationQueryParams } from '../../common/dtos/pagination.dto';
import {
  createTransactionSchema,
  updateTransactionSchema,
  transactionFilterSchema,
  CreateTransactionDto,
  UpdateTransactionDto,
  TransactionFilterDto,
} from '../schemas/transaction.schema';
import { Transaction } from '@prisma/client';

// Example DTO for documentation
class TransactionResponseDto {
  @ApiProperty({ example: 'uuid', description: 'Transaction ID' })
  id: string;

  @ApiProperty({ example: 10050, description: 'Amount in cents (integer)' })
  amount: number;

  @ApiProperty({ example: 'Salary payment', description: 'Transaction description' })
  description: string;

  @ApiProperty({ example: '2023-05-15', description: 'Transaction date (YYYY-MM-DD)' })
  date: string;

  @ApiProperty({ example: 'Salary', description: 'Category name' })
  category: string;

  @ApiProperty({ example: 'uuid', description: 'Category ID' })
  categoryId: string;

  @ApiProperty({ example: 'income', enum: ['income', 'expense'], description: 'Transaction type' })
  type: string;

  @ApiProperty({ example: 'Nubank', description: 'Account name' })
  account: string;

  @ApiProperty({ example: 'uuid', description: 'Account ID' })
  accountId: string;

  @ApiProperty({ example: 'completed', enum: ['pending', 'completed', 'canceled'], description: 'Transaction status' })
  status: string;
}

// Example request body for documentation
class CreateTransactionRequestDto {
  @ApiProperty({ example: 10050, description: 'Amount in cents (integer)' })
  amount: number;

  @ApiProperty({ example: 'Salary payment', description: 'Transaction description' })
  description: string;

  @ApiProperty({ example: '2023-05-15', description: 'Transaction date (YYYY-MM-DD)' })
  date: string;

  @ApiProperty({ example: 'uuid', description: 'Category ID', required: false })
  category?: string;

  @ApiProperty({ example: 'income', enum: ['income', 'expense'], description: 'Transaction type' })
  type: string;

  @ApiProperty({ example: 'uuid', description: 'Account ID' })
  account: string;

  @ApiProperty({
    example: 'completed',
    enum: ['pending', 'completed', 'canceled'],
    description: 'Transaction status',
    default: 'pending',
    required: false
  })
  status?: string;
}

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
  @ApiQuery({ name: 'month', required: false, type: String, description: 'Filter by month (YYYY-MM)' })
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
  async findAll(
    @Request() req,
    @Query(new ZodValidationPipe(PaginationQuerySchema))
    paginationParams: PaginationQueryParams,
    @Query(new ZodValidationPipe(transactionFilterSchema))
    filterParams: TransactionFilterDto,
  ) {
    this.logger.log(`GET transactions for user ${req.user.id}`);
    return this.transactionsService.findAll(
      req.user.id,
      filterParams,
      paginationParams,
    );
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
    this.logger.log(`GET transaction ${id} for user ${req.user.id}`);
    return this.transactionsService.findOne(id, req.user.id);
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
    this.logger.log(`POST new transaction for user ${req.user.id}`);
    return this.transactionsService.create(req.user.id, createTransactionDto);
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
    this.logger.log(`PUT update transaction ${id} for user ${req.user.id}`);
    return this.transactionsService.update(id, req.user.id, updateTransactionDto);
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
    this.logger.log(`DELETE transaction ${id} for user ${req.user.id}`);
    return this.transactionsService.remove(id, req.user.id);
  }
} 
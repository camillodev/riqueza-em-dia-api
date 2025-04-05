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

/**
 * Controller for managing financial transactions
 */
@ApiTags('transactions')
@Controller('transactions')
@UseGuards(JwtAuthGuard)
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
    @Request() req,
    @Query(new ZodValidationPipe(PaginationQuerySchema)) paginationParams: PaginationQueryParams,
    @Query(new ZodValidationPipe(transactionFilterSchema)) filterParams: TransactionFilterDto,
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
    status: 404,
    description: 'Transaction not found'
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized - Authentication is required'
  })
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
  @ApiOperation({ summary: 'Delete transaction' })
  @ApiParam({ name: 'id', type: String, format: 'uuid', description: 'Transaction ID (UUID)', example: '123e4567-e89b-12d3-a456-426614174000' })
  @ApiResponse({
    status: 200,
    description: 'Transaction deleted successfully',
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

  @Get('debug/query-params')
  @ApiOperation({ summary: 'Debug query parameters (development only)' })
  @ApiResponse({
    status: 200,
    description: 'Returns the raw query parameters for debugging',
  })
  async debugQueryParams(@Request() req, @Query() rawQuery: Record<string, any>) {
    // Segurança: Só deve ser usado em desenvolvimento
    if (process.env.NODE_ENV === 'production') {
      throw new BadRequestException('This endpoint is not available in production mode');
    }

    try {
      this.logger.log(`DEBUG query params: ${JSON.stringify(rawQuery)}`);

      return {
        rawQueryParams: rawQuery,
        headers: req.headers,
        validatedParams: await this.preprocessQueryParams(rawQuery),
      };
    } catch (error) {
      return {
        rawQueryParams: rawQuery,
        headers: req.headers,
        error: error.message,
        stack: error.stack,
      };
    }
  }

  // Método helper para pré-processar os parâmetros da query
  private async preprocessQueryParams(query: Record<string, any>) {
    try {
      // Usar o mesmo pipe que é usado na rota principal
      const paginationParams = await new ZodValidationPipe(PaginationQuerySchema).transform(query, { type: 'query', metatype: Object });
      const filterParams = await new ZodValidationPipe(transactionFilterSchema).transform(query, { type: 'query', metatype: Object });

      return { paginationParams, filterParams };
    } catch (error) {
      if (error instanceof BadRequestException) {
        return { validationError: error.getResponse() };
      }
      return { error: error.message };
    }
  }
} 
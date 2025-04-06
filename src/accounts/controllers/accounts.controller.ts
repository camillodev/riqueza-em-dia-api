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
} from '@nestjs/common';
import { CacheInterceptor } from '@nestjs/cache-manager';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiParam,
  ApiResponse,
  ApiTags,
  ApiQuery,
} from '@nestjs/swagger';
import { AccountsService } from '../services/accounts.service';
import { ClerkAuthGuard } from '../../auth/clerk-auth.guard';
import { ZodValidationPipe } from '../../common/pipes/zod-validation.pipe';
import { PaginationQuerySchema, PaginationQueryParams } from '../../common/dtos/pagination.dto';
import {
  createAccountSchema,
  updateAccountSchema,
  archiveAccountSchema,
  accountFilterSchema,
  CreateAccountDto,
  UpdateAccountDto,
  ArchiveAccountDto,
  AccountFilterDto,
} from '../schemas/account.schema';
import { Account } from '@prisma/client';
import { CurrentUser } from '../../auth/decorators/current-user.decorator';
import { User } from '@clerk/backend';

@ApiTags('accounts')
@Controller('accounts')
  @UseGuards(ClerkAuthGuard)
@ApiBearerAuth()
export class AccountsController {
  private readonly logger = new Logger(AccountsController.name);

  constructor(private readonly accountsService: AccountsService) { }

  @Get()
  @UseInterceptors(CacheInterceptor)
  @ApiOperation({ summary: 'Get all user accounts with pagination and filtering' })
  @ApiQuery({ name: 'page', required: false, type: Number, description: 'Page number (starts from 1)' })
  @ApiQuery({ name: 'limit', required: false, type: Number, description: 'Page size (max 100)' })
  @ApiQuery({ name: 'sortBy', required: false, type: String, description: 'Sort field' })
  @ApiQuery({ name: 'sortOrder', required: false, enum: ['asc', 'desc'], description: 'Sort direction' })
  @ApiQuery({ name: 'isArchived', required: false, type: Boolean, description: 'Filter by archive status' })
  @ApiResponse({
    status: 200,
    description: 'Returns all user accounts',
  })
  async findAll(
    @CurrentUser() user: User,
    @Query(new ZodValidationPipe(PaginationQuerySchema))
    paginationParams: PaginationQueryParams,
    @Query(new ZodValidationPipe(accountFilterSchema))
    filterParams: AccountFilterDto,
  ) {
    this.logger.log(`GET accounts for user ${user.id}`);
    return this.accountsService.findAllByUserId(
      user.id,
      filterParams,
      paginationParams,
    );
  }

  @Get('summary')
  @UseInterceptors(CacheInterceptor)
  @ApiOperation({ summary: 'Get accounts summary statistics' })
  @ApiResponse({
    status: 200,
    description: 'Returns account summary data',
  })
  async getSummary(@CurrentUser() user: User) {
    this.logger.log(`GET accounts summary for user ${user.id}`);
    return this.accountsService.getAccountsSummary(user.id);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a specific bank account' })
  @ApiParam({ name: 'id', description: 'Account ID' })
  @ApiResponse({
    status: 200,
    description: 'Returns a specific account',
  })
  @ApiResponse({ status: 404, description: 'Account not found' })
  async findOne(
    @CurrentUser() user: User,
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<Account> {
    this.logger.log(`GET account ${id} for user ${user.id}`);
    return this.accountsService.findOneById(id, user.id);
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create a new bank account' })
  @ApiResponse({
    status: 201,
    description: 'Account created successfully',
  })
  async create(
    @CurrentUser() user: User,
    @Body(new ZodValidationPipe(createAccountSchema)) createAccountDto: CreateAccountDto,
  ): Promise<Account> {
    this.logger.log(`POST new account for user ${user.id}`);
    return this.accountsService.create(user.id, createAccountDto);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update an existing bank account' })
  @ApiParam({ name: 'id', description: 'Account ID' })
  @ApiResponse({
    status: 200,
    description: 'Account updated successfully',
  })
  @ApiResponse({ status: 404, description: 'Account not found' })
  async update(
    @CurrentUser() user: User,
    @Param('id', ParseUUIDPipe) id: string,
    @Body(new ZodValidationPipe(updateAccountSchema)) updateAccountDto: UpdateAccountDto,
  ): Promise<Account> {
    this.logger.log(`PUT update account ${id} for user ${user.id}`);
    return this.accountsService.update(id, user.id, updateAccountDto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a bank account' })
  @ApiParam({ name: 'id', description: 'Account ID' })
  @ApiResponse({
    status: 200,
    description: 'Account deleted successfully',
  })
  @ApiResponse({ status: 404, description: 'Account not found' })
  async remove(
    @CurrentUser() user: User,
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<Account> {
    this.logger.log(`DELETE account ${id} for user ${user.id}`);
    return this.accountsService.remove(id, user.id);
  }

  @Put(':id/archive')
  @ApiOperation({ summary: 'Archive/unarchive a bank account' })
  @ApiParam({ name: 'id', description: 'Account ID' })
  @ApiResponse({
    status: 200,
    description: 'Account archive status updated',
  })
  @ApiResponse({ status: 404, description: 'Account not found' })
  async updateArchiveStatus(
    @CurrentUser() user: User,
    @Param('id', ParseUUIDPipe) id: string,
    @Body(new ZodValidationPipe(archiveAccountSchema)) archiveAccountDto: ArchiveAccountDto,
  ): Promise<Account> {
    this.logger.log(`PUT archive status ${id} to ${archiveAccountDto.isArchived} for user ${user.id}`);
    return this.accountsService.updateArchiveStatus(
      id,
      user.id,
      archiveAccountDto.isArchived,
    );
  }
} 
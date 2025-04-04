import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  UseGuards,
  Request
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiParam,
  ApiResponse,
  ApiTags
} from '@nestjs/swagger';
import { AccountsService } from '../services/accounts.service';
import { CreateAccountDto } from '../dto/create-account.dto';
import { UpdateAccountDto } from '../dto/update-account.dto';
import { ArchiveAccountDto } from '../dto/archive-account.dto';
import { AccountResponseDto } from '../dto/account-response.dto';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';

@ApiTags('accounts')
@Controller('api/accounts')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class AccountsController {
  constructor(private readonly accountsService: AccountsService) { }

  @Get()
  @ApiOperation({ summary: 'Get all user accounts' })
  @ApiResponse({
    status: 200,
    description: 'Returns all user accounts',
    type: [AccountResponseDto],
  })
  async findAll(@Request() req): Promise<AccountResponseDto[]> {
    const accounts = await this.accountsService.findAllByUserId(req.user.id);
    return accounts.map(account => new AccountResponseDto(account));
  }

  @Post()
  @ApiOperation({ summary: 'Create a new bank account' })
  @ApiResponse({
    status: 201,
    description: 'Account created successfully',
    type: AccountResponseDto,
  })
  async create(
    @Request() req,
    @Body() createAccountDto: CreateAccountDto,
  ): Promise<AccountResponseDto> {
    const account = await this.accountsService.create(
      req.user.id,
      createAccountDto,
    );
    return new AccountResponseDto(account);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update an existing bank account' })
  @ApiParam({ name: 'id', description: 'Account ID' })
  @ApiResponse({
    status: 200,
    description: 'Account updated successfully',
    type: AccountResponseDto,
  })
  @ApiResponse({ status: 404, description: 'Account not found' })
  async update(
    @Request() req,
    @Param('id') id: string,
    @Body() updateAccountDto: UpdateAccountDto,
  ): Promise<AccountResponseDto> {
    const account = await this.accountsService.update(
      id,
      req.user.id,
      updateAccountDto,
    );
    return new AccountResponseDto(account);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a bank account' })
  @ApiParam({ name: 'id', description: 'Account ID' })
  @ApiResponse({
    status: 200,
    description: 'Account deleted successfully',
    type: AccountResponseDto,
  })
  @ApiResponse({ status: 404, description: 'Account not found' })
  async remove(
    @Request() req,
    @Param('id') id: string,
  ): Promise<AccountResponseDto> {
    const account = await this.accountsService.remove(id, req.user.id);
    return new AccountResponseDto(account);
  }

  @Put(':id/archive')
  @ApiOperation({ summary: 'Archive/unarchive a bank account' })
  @ApiParam({ name: 'id', description: 'Account ID' })
  @ApiResponse({
    status: 200,
    description: 'Account archive status updated',
    type: AccountResponseDto,
  })
  @ApiResponse({ status: 404, description: 'Account not found' })
  async updateArchiveStatus(
    @Request() req,
    @Param('id') id: string,
    @Body() archiveAccountDto: ArchiveAccountDto,
  ): Promise<AccountResponseDto> {
    const account = await this.accountsService.updateArchiveStatus(
      id,
      req.user.id,
      archiveAccountDto,
    );
    return new AccountResponseDto(account);
  }
} 
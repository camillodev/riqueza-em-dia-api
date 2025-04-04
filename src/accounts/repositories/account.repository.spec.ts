import { Test, TestingModule } from '@nestjs/testing';
import { AccountRepository } from './account.repository';
import { PrismaService } from '../../prisma/prisma.service';
import { CacheService } from '../../common/cache/cache.service';
import { Account } from '@prisma/client';
import { CreateAccountDto, UpdateAccountDto } from '../schemas/account.schema';
import { NotFoundException } from '@nestjs/common';
import { PaginationQueryParams } from '../../common/dtos/pagination.dto';

describe('AccountRepository', () => {
  let repository: AccountRepository;
  let prismaService: PrismaService;
  let cacheService: CacheService;

  const userId = 'user-id';
  const accountId = 'account-id';

  const mockAccount: Account = {
    id: accountId,
    userId,
    name: 'Test Account',
    balance: 1000 as any, // Prisma uses Decimal, using any to avoid compilation issues
    color: '#7158e2',
    isArchived: false,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const mockPrismaService = {
    account: {
      findMany: jest.fn(),
      findFirst: jest.fn(),
      findUnique: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      count: jest.fn(),
    },
    $transaction: jest.fn().mockImplementation(callback => callback(mockPrismaService)),
  };

  const mockCacheService = {
    get: jest.fn(),
    set: jest.fn(),
    delete: jest.fn(),
    clear: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AccountRepository,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
        {
          provide: CacheService,
          useValue: mockCacheService,
        },
      ],
    }).compile();

    repository = module.get<AccountRepository>(AccountRepository);
    prismaService = module.get<PrismaService>(PrismaService);
    cacheService = module.get<CacheService>(CacheService);

    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(repository).toBeDefined();
  });

  describe('findById', () => {
    it('should return an account from cache if available', async () => {
      mockCacheService.get.mockResolvedValue(mockAccount);

      const result = await repository.findById(accountId, userId);

      expect(result).toEqual(mockAccount);
      expect(mockCacheService.get).toHaveBeenCalledWith(expect.any(String), 'accounts');
      expect(mockPrismaService.account.findFirst).not.toHaveBeenCalled();
    });

    it('should fetch from database and cache the result if not in cache', async () => {
      mockCacheService.get.mockResolvedValue(null);
      mockPrismaService.account.findFirst.mockResolvedValue(mockAccount);

      const result = await repository.findById(accountId, userId);

      expect(result).toEqual(mockAccount);
      expect(mockCacheService.get).toHaveBeenCalledWith(expect.any(String), 'accounts');
      expect(mockPrismaService.account.findFirst).toHaveBeenCalledWith({
        where: { id: accountId, userId },
      });
      expect(mockCacheService.set).toHaveBeenCalledWith(
        expect.any(String),
        mockAccount,
        'accounts',
      );
    });

    it('should throw NotFoundException if account not found', async () => {
      mockCacheService.get.mockResolvedValue(null);
      mockPrismaService.account.findFirst.mockResolvedValue(null);

      await expect(repository.findById(accountId, userId)).rejects.toThrow(NotFoundException);
    });
  });

  describe('findAllPaginated', () => {
    it('should return paginated accounts with total count', async () => {
      const pagination: PaginationQueryParams = { page: 1, limit: 10, sortBy: 'name', sortOrder: 'asc' };
      mockPrismaService.account.count.mockResolvedValue(1);
      mockPrismaService.account.findMany.mockResolvedValue([mockAccount]);

      const result = await repository.findAllPaginated(userId, {}, pagination);

      expect(result).toEqual([[mockAccount], 1]);
      expect(mockPrismaService.account.count).toHaveBeenCalledWith({
        where: { userId },
      });
      expect(mockPrismaService.account.findMany).toHaveBeenCalledWith({
        where: { userId },
        skip: 0,
        take: 10,
        orderBy: { name: 'asc' },
      });
    });

    it('should apply archive filter if provided', async () => {
      const pagination: PaginationQueryParams = { page: 1, limit: 10, sortOrder: 'asc' };
      const filter = { isArchived: true };
      mockPrismaService.account.count.mockResolvedValue(1);
      mockPrismaService.account.findMany.mockResolvedValue([mockAccount]);

      await repository.findAllPaginated(userId, filter, pagination);

      expect(mockPrismaService.account.count).toHaveBeenCalledWith({
        where: { userId, isArchived: true },
      });
      expect(mockPrismaService.account.findMany).toHaveBeenCalledWith({
        where: { userId, isArchived: true },
        skip: 0,
        take: 10,
        orderBy: { createdAt: 'desc' },
      });
    });
  });

  describe('create', () => {
    it('should create an account and invalidate cache', async () => {
      const createDto: CreateAccountDto = {
        name: 'New Account',
        balance: 500,
        color: '#ff0000',
        isArchived: false,
      };

      const newAccount = { ...mockAccount, ...createDto, id: 'new-id' };
      mockPrismaService.account.create.mockResolvedValue(newAccount);

      const result = await repository.create(createDto, userId);

      expect(result).toEqual(newAccount);
      expect(mockPrismaService.account.create).toHaveBeenCalledWith({
        data: { ...createDto, userId },
      });
      expect(mockCacheService.delete).toHaveBeenCalledWith(expect.any(String), 'accounts');
    });
  });

  describe('update', () => {
    it('should update an account and invalidate cache', async () => {
      const updateDto: UpdateAccountDto = {
        name: 'Updated Account',
      };

      // Mock the findById method
      jest.spyOn(repository, 'findById').mockResolvedValue(mockAccount);

      const updatedAccount = { ...mockAccount, name: 'Updated Account' };
      mockPrismaService.account.update.mockResolvedValue(updatedAccount);

      const result = await repository.update(accountId, updateDto, userId);

      expect(result).toEqual(updatedAccount);
      expect(repository.findById).toHaveBeenCalledWith(accountId, userId);
      expect(mockPrismaService.account.update).toHaveBeenCalledWith({
        where: { id: accountId },
        data: updateDto,
      });
      expect(mockCacheService.delete).toHaveBeenCalledTimes(2); // Both entity and list cache
    });
  });

  describe('getAccountsSummary', () => {
    it('should return account summary from cache if available', async () => {
      const summary = {
        totalBalance: 1500,
        totalAccounts: 2,
        activeAccounts: 1,
      };

      mockCacheService.get.mockResolvedValue(summary);

      const result = await repository.getAccountsSummary(userId);

      expect(result).toEqual(summary);
      expect(mockCacheService.get).toHaveBeenCalledWith(expect.any(String), 'accounts');
      expect(mockPrismaService.account.findMany).not.toHaveBeenCalled();
    });

    it('should calculate and cache account summary if not in cache', async () => {
      mockCacheService.get.mockResolvedValue(null);
      mockPrismaService.account.findMany.mockResolvedValue([
        { balance: 1000, isArchived: false },
        { balance: 500, isArchived: true },
      ]);

      const result = await repository.getAccountsSummary(userId);

      expect(result).toEqual({
        totalBalance: 1500,
        totalAccounts: 2,
        activeAccounts: 1,
      });
      expect(mockCacheService.get).toHaveBeenCalledWith(expect.any(String), 'accounts');
      expect(mockPrismaService.account.findMany).toHaveBeenCalledWith({
        where: { userId },
        select: {
          balance: true,
          isArchived: true,
        },
      });
      expect(mockCacheService.set).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          totalBalance: 1500,
          totalAccounts: 2,
          activeAccounts: 1,
        }),
        'accounts',
        expect.any(Number),
      );
    });
  });
}); 
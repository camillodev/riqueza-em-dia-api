import { Test, TestingModule } from '@nestjs/testing';
import { AccountsService } from './accounts.service';
import { PrismaService } from '../../prisma/prisma.service';
import { NotFoundException } from '@nestjs/common';
import { CreateAccountDto } from '../dto/create-account.dto';
import { UpdateAccountDto } from '../dto/update-account.dto';
import { ArchiveAccountDto } from '../dto/archive-account.dto';

describe('AccountsService', () => {
  let service: AccountsService;
  let prismaService: PrismaService;

  const userId = 'user-id';
  const accountId = 'account-id';

  const mockAccount = {
    id: accountId,
    userId,
    name: 'Test Account',
    balance: 1000,
    color: '#7158e2',
    isArchived: false,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const mockPrismaService = {
    account: {
      findMany: jest.fn(),
      findFirst: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AccountsService,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
      ],
    }).compile();

    service = module.get<AccountsService>(AccountsService);
    prismaService = module.get<PrismaService>(PrismaService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('findAllByUserId', () => {
    it('should return all accounts for a user', async () => {
      mockPrismaService.account.findMany.mockResolvedValue([mockAccount]);

      const result = await service.findAllByUserId(userId);

      expect(result).toEqual([mockAccount]);
      expect(prismaService.account.findMany).toHaveBeenCalledWith({
        where: { userId },
      });
    });
  });

  describe('findOneById', () => {
    it('should return an account by id', async () => {
      mockPrismaService.account.findFirst.mockResolvedValue(mockAccount);

      const result = await service.findOneById(accountId, userId);

      expect(result).toEqual(mockAccount);
      expect(prismaService.account.findFirst).toHaveBeenCalledWith({
        where: { id: accountId, userId },
      });
    });

    it('should throw NotFoundException if account not found', async () => {
      mockPrismaService.account.findFirst.mockResolvedValue(null);

      await expect(service.findOneById(accountId, userId)).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('create', () => {
    it('should create a new account', async () => {
      const createAccountDto: CreateAccountDto = {
        name: 'New Account',
        balance: 500,
        color: '#ff0000',
        isArchived: false,
      };

      mockPrismaService.account.create.mockResolvedValue({
        id: 'new-id',
        userId,
        ...createAccountDto,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      const result = await service.create(userId, createAccountDto);

      expect(result).toHaveProperty('id');
      expect(result.name).toBe(createAccountDto.name);
      expect(prismaService.account.create).toHaveBeenCalledWith({
        data: {
          ...createAccountDto,
          userId,
        },
      });
    });
  });

  describe('update', () => {
    it('should update an account', async () => {
      const updateAccountDto: UpdateAccountDto = {
        name: 'Updated Account',
      };

      mockPrismaService.account.findFirst.mockResolvedValue(mockAccount);
      mockPrismaService.account.update.mockResolvedValue({
        ...mockAccount,
        name: 'Updated Account',
      });

      const result = await service.update(accountId, userId, updateAccountDto);

      expect(result.name).toBe('Updated Account');
      expect(prismaService.account.update).toHaveBeenCalledWith({
        where: { id: accountId },
        data: updateAccountDto,
      });
    });

    it('should throw NotFoundException if account not found', async () => {
      mockPrismaService.account.findFirst.mockResolvedValue(null);

      await expect(
        service.update(accountId, userId, { name: 'Updated Account' }),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('remove', () => {
    it('should delete an account', async () => {
      mockPrismaService.account.findFirst.mockResolvedValue(mockAccount);
      mockPrismaService.account.delete.mockResolvedValue(mockAccount);

      const result = await service.remove(accountId, userId);

      expect(result).toEqual(mockAccount);
      expect(prismaService.account.delete).toHaveBeenCalledWith({
        where: { id: accountId },
      });
    });

    it('should throw NotFoundException if account not found', async () => {
      mockPrismaService.account.findFirst.mockResolvedValue(null);

      await expect(service.remove(accountId, userId)).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('updateArchiveStatus', () => {
    it('should update archive status of an account', async () => {
      const archiveAccountDto: ArchiveAccountDto = {
        isArchived: true,
      };

      mockPrismaService.account.findFirst.mockResolvedValue(mockAccount);
      mockPrismaService.account.update.mockResolvedValue({
        ...mockAccount,
        isArchived: true,
      });

      const result = await service.updateArchiveStatus(
        accountId,
        userId,
        archiveAccountDto,
      );

      expect(result.isArchived).toBe(true);
      expect(prismaService.account.update).toHaveBeenCalledWith({
        where: { id: accountId },
        data: { isArchived: true },
      });
    });

    it('should throw NotFoundException if account not found', async () => {
      mockPrismaService.account.findFirst.mockResolvedValue(null);

      await expect(
        service.updateArchiveStatus(accountId, userId, { isArchived: true }),
      ).rejects.toThrow(NotFoundException);
    });
  });
}); 
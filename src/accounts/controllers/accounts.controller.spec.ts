import { Test, TestingModule } from '@nestjs/testing';
import { AccountsController } from './accounts.controller';
import { AccountsService } from '../services/accounts.service';
import { CreateAccountDto } from '../dto/create-account.dto';
import { UpdateAccountDto } from '../dto/update-account.dto';
import { ArchiveAccountDto } from '../dto/archive-account.dto';
import { AccountResponseDto } from '../dto/account-response.dto';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';

// Mock auth guard
class MockJwtAuthGuard {
  canActivate() {
    return true;
  }
}

describe('AccountsController', () => {
  let controller: AccountsController;
  let service: AccountsService;

  const mockAccount = {
    id: 'test-id',
    userId: 'user-id',
    name: 'Test Account',
    balance: 1000,
    color: '#7158e2',
    isArchived: false,
    createdAt: new Date(),
    updatedAt: new Date()
  };

  const mockUser = { id: 'user-id', email: 'test@example.com' };

  const mockRequest = {
    user: mockUser
  };

  const mockAccountsService = {
    findAllByUserId: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    remove: jest.fn(),
    updateArchiveStatus: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AccountsController],
      providers: [
        {
          provide: AccountsService,
          useValue: mockAccountsService,
        },
      ],
    })
      .overrideGuard(JwtAuthGuard)
      .useClass(MockJwtAuthGuard)
      .compile();

    controller = module.get<AccountsController>(AccountsController);
    service = module.get<AccountsService>(AccountsService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('findAll', () => {
    it('should return an array of accounts', async () => {
      mockAccountsService.findAllByUserId.mockResolvedValue([mockAccount]);

      const result = await controller.findAll(mockRequest);

      expect(result).toEqual([new AccountResponseDto(mockAccount)]);
      expect(service.findAllByUserId).toHaveBeenCalledWith(mockUser.id);
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

      mockAccountsService.create.mockResolvedValue({
        id: 'new-id',
        userId: mockUser.id,
        ...createAccountDto,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      const result = await controller.create(mockRequest, createAccountDto);

      expect(result).toBeInstanceOf(AccountResponseDto);
      expect(service.create).toHaveBeenCalledWith(mockUser.id, createAccountDto);
    });
  });

  describe('update', () => {
    it('should update an account', async () => {
      const updateAccountDto: UpdateAccountDto = {
        name: 'Updated Account',
      };

      mockAccountsService.update.mockResolvedValue({
        ...mockAccount,
        name: 'Updated Account',
      });

      const result = await controller.update(mockRequest, mockAccount.id, updateAccountDto);

      expect(result).toBeInstanceOf(AccountResponseDto);
      expect(service.update).toHaveBeenCalledWith(mockAccount.id, mockUser.id, updateAccountDto);
    });
  });

  describe('remove', () => {
    it('should delete an account', async () => {
      mockAccountsService.remove.mockResolvedValue(mockAccount);

      const result = await controller.remove(mockRequest, mockAccount.id);

      expect(result).toBeInstanceOf(AccountResponseDto);
      expect(service.remove).toHaveBeenCalledWith(mockAccount.id, mockUser.id);
    });
  });

  describe('updateArchiveStatus', () => {
    it('should archive an account', async () => {
      const archiveAccountDto: ArchiveAccountDto = {
        isArchived: true,
      };

      mockAccountsService.updateArchiveStatus.mockResolvedValue({
        ...mockAccount,
        isArchived: true,
      });

      const result = await controller.updateArchiveStatus(mockRequest, mockAccount.id, archiveAccountDto);

      expect(result).toBeInstanceOf(AccountResponseDto);
      expect(service.updateArchiveStatus).toHaveBeenCalledWith(mockAccount.id, mockUser.id, archiveAccountDto);
    });
  });
}); 
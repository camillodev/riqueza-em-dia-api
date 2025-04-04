import { ApiProperty } from '@nestjs/swagger';
import { Account } from '@prisma/client';

export class AccountResponseDto {
  @ApiProperty({ description: 'Account ID' })
  id: string;

  @ApiProperty({ description: 'Account name' })
  name: string;

  @ApiProperty({ description: 'Account balance' })
  balance: number;

  @ApiProperty({ description: 'Account color' })
  color: string;

  @ApiProperty({ description: 'Is account archived' })
  isArchived: boolean;

  constructor(account: Account) {
    this.id = account.id;
    this.name = account.name;
    this.balance = Number(account.balance);
    this.color = account.color;
    this.isArchived = account.isArchived;
  }
} 
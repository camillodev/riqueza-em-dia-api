import { ApiProperty } from '@nestjs/swagger';

export class TransactionResponseDto {
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
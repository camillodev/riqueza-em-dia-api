import { ApiProperty } from '@nestjs/swagger';

export class CreateTransactionRequestDto {
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
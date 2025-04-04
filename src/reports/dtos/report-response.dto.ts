import { ApiProperty } from '@nestjs/swagger';

// DTO for transaction summary in the reports
export class ReportTransactionDto {
  @ApiProperty({ example: 'uuidv4', description: 'Transaction ID' })
  id: string;

  @ApiProperty({ example: 1099, description: 'Amount in cents' })
  amount: number;

  @ApiProperty({ example: 'Salary payment', description: 'Transaction description' })
  description: string;

  @ApiProperty({ example: '2023-05-15', description: 'Transaction date (YYYY-MM-DD)' })
  date: string;

  @ApiProperty({ example: 'Salary', description: 'Category name' })
  category: string;

  @ApiProperty({ example: 'income', enum: ['income', 'expense'], description: 'Transaction type' })
  type: string;

  @ApiProperty({ example: 'Nubank', description: 'Account name' })
  account: string;
}

// DTO for summary report response
export class SummaryReportResponseDto {
  @ApiProperty({ example: 50000, description: 'Total balance in cents' })
  totalBalance: number;

  @ApiProperty({ example: 100000, description: 'Monthly income in cents' })
  monthlyIncome: number;

  @ApiProperty({ example: 50000, description: 'Monthly expense in cents' })
  monthlyExpense: number;

  @ApiProperty({ type: [ReportTransactionDto], description: 'Recent transactions' })
  recentTransactions: ReportTransactionDto[];
}

// DTO for each item in the chart data
export class ChartItemDto {
  @ApiProperty({ example: 'Salary', description: 'Name of the category or type' })
  name: string;

  @ApiProperty({ example: 10000, description: 'Value in cents' })
  value: number;

  @ApiProperty({ example: '#28a745', description: 'Color for the chart item' })
  color: string;
}

// DTO for monthly data chart item
export class MonthlyDataItemDto {
  @ApiProperty({ example: 'Jan 2023', description: 'Month name' })
  month: string;

  @ApiProperty({ example: 100000, description: 'Income amount in cents' })
  income: number;

  @ApiProperty({ example: 50000, description: 'Expense amount in cents' })
  expense: number;

  @ApiProperty({ example: 50000, description: 'Balance amount in cents' })
  balance: number;
} 
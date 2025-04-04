import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';
import { SummaryReportResponseDto, ChartItemDto, MonthlyDataItemDto } from '../../dtos/report-response.dto';

@Injectable()
export class ReportsService {
  private readonly logger = new Logger(ReportsService.name);

  constructor(private readonly prisma: PrismaService) { }

  /**
   * Gets the current month in YYYY-MM format if not provided
   */
  private getCurrentMonth(): string {
    const date = new Date();
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    return `${year}-${month}`;
  }

  /**
   * Parses the month string and returns start/end dates
   */
  private getMonthDateRange(monthStr?: string): { startDate: Date; endDate: Date } {
    const month = monthStr || this.getCurrentMonth();
    const [year, monthNum] = month.split('-').map(Number);

    const startDate = new Date(year, monthNum - 1, 1);
    const endDate = new Date(year, monthNum, 0); // Last day of the month
    endDate.setHours(23, 59, 59, 999); // End of the day

    return { startDate, endDate };
  }

  /**
   * Get summary data for financial dashboard
   */
  async getSummary(userId: string, monthStr?: string): Promise<SummaryReportResponseDto> {
    try {
      const { startDate, endDate } = this.getMonthDateRange(monthStr);

      // Get total balance (sum of all account balances)
      const accounts = await this.prisma.account.findMany({
        where: { userId, isArchived: false },
        select: { balance: true },
      });

      const totalBalance = accounts.reduce(
        (sum, account) => sum + Number(account.balance),
        0
      );

      // Get monthly income and expense totals
      const monthlyTotals = await this.prisma.transaction.groupBy({
        by: ['type'],
        where: {
          userId,
          date: {
            gte: startDate,
            lte: endDate,
          },
          status: 'completed', // Only count completed transactions
        },
        _sum: {
          amount: true,
        },
      });

      const monthlyIncome = Number(
        monthlyTotals.find(t => t.type === 'income')?._sum.amount || 0
      );

      const monthlyExpense = Number(
        monthlyTotals.find(t => t.type === 'expense')?._sum.amount || 0
      );

      // Get recent transactions
      const recentTransactions = await this.prisma.transaction.findMany({
        where: { userId },
        orderBy: { date: 'desc' },
        take: 5,
        include: {
          category: true,
          account: true,
        },
      });

      // Format transactions for response
      const formattedTransactions = recentTransactions.map(tx => ({
        id: tx.id,
        amount: Number(tx.amount),
        description: tx.description,
        date: tx.date.toISOString().split('T')[0],
        category: tx.category?.name || 'Uncategorized',
        type: tx.type,
        account: tx.account.name,
      }));

      return {
        totalBalance,
        monthlyIncome,
        monthlyExpense,
        recentTransactions: formattedTransactions,
      };
    } catch (error) {
      this.logger.error(`Error getting financial summary: ${error.message}`, error.stack);
      throw error;
    }
  }

  /**
   * Get income vs expense chart data
   */
  async getIncomeVsExpense(userId: string, monthStr?: string): Promise<ChartItemDto[]> {
    try {
      const { startDate, endDate } = this.getMonthDateRange(monthStr);

      // Group by transaction type and sum amounts
      const results = await this.prisma.transaction.groupBy({
        by: ['type'],
        where: {
          userId,
          date: {
            gte: startDate,
            lte: endDate,
          },
          status: 'completed', // Only count completed transactions
        },
        _sum: {
          amount: true,
        },
      });

      // Prepare chart data with colors
      return [
        {
          name: 'Receitas',
          value: Number(results.find(r => r.type === 'income')?._sum.amount || 0),
          color: '#28a745', // Green
        },
        {
          name: 'Despesas',
          value: Number(results.find(r => r.type === 'expense')?._sum.amount || 0),
          color: '#dc3545', // Red
        },
      ];
    } catch (error) {
      this.logger.error(`Error getting income vs expense data: ${error.message}`, error.stack);
      throw error;
    }
  }

  /**
   * Get spending or income by category chart data
   */
  async getByCategory(
    userId: string,
    type: 'income' | 'expense',
    monthStr?: string
  ): Promise<ChartItemDto[]> {
    try {
      const { startDate, endDate } = this.getMonthDateRange(monthStr);

      // Get all transactions of the specified type in the date range
      // grouped by category
      const transactionsByCategory = await this.prisma.transaction.groupBy({
        by: ['categoryId'],
        where: {
          userId,
          type,
          date: {
            gte: startDate,
            lte: endDate,
          },
          status: 'completed', // Only count completed transactions
        },
        _sum: {
          amount: true,
        },
      });

      // Get category info for each group
      const categoryIds = transactionsByCategory
        .map(t => t.categoryId)
        .filter(id => id !== null) as string[];

      const categories = await this.prisma.category.findMany({
        where: {
          id: {
            in: categoryIds,
          },
        },
      });

      // Create chart data with category names and colors
      return transactionsByCategory.map(t => {
        const category = categories.find(c => c.id === t.categoryId);
        return {
          name: category?.name || 'Uncategorized',
          value: Number(t._sum.amount || 0),
          color: category?.color || '#6c757d', // Default color for uncategorized
        };
      }).sort((a, b) => b.value - a.value); // Sort by value descending
    } catch (error) {
      this.logger.error(`Error getting category data: ${error.message}`, error.stack);
      throw error;
    }
  }

  /**
   * Get monthly data for time-series chart
   */
  async getMonthlyData(userId: string, monthStr?: string, days?: number): Promise<MonthlyDataItemDto[]> {
    try {
      // Get the last 6 months by default
      const endMonth = monthStr ? new Date(`${monthStr}-01`) : new Date();

      // Create array of months to analyze (last 6 months)
      const months: string[] = [];
      for (let i = 0; i < 6; i++) {
        const date = new Date(endMonth);
        date.setMonth(date.getMonth() - i);
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        months.push(`${year}-${month}`);
      }

      // Get data for each month
      const result = await Promise.all(
        months.map(async (monthString) => {
          const { startDate, endDate } = this.getMonthDateRange(monthString);

          // Get income and expense totals for the month
          const totals = await this.prisma.transaction.groupBy({
            by: ['type'],
            where: {
              userId,
              date: {
                gte: startDate,
                lte: endDate,
              },
              status: 'completed', // Only count completed transactions
            },
            _sum: {
              amount: true,
            },
          });

          const income = Number(
            totals.find(t => t.type === 'income')?._sum.amount || 0
          );

          const expense = Number(
            totals.find(t => t.type === 'expense')?._sum.amount || 0
          );

          // Format the month name (Jan 2023)
          const monthDate = new Date(monthString + '-01');
          const monthName = monthDate.toLocaleDateString('en-US', {
            month: 'short',
            year: 'numeric',
          });

          return {
            month: monthName,
            income,
            expense,
            balance: income - expense,
          };
        })
      );

      // Return in chronological order (oldest first)
      return result.reverse();
    } catch (error) {
      this.logger.error(`Error getting monthly data: ${error.message}`, error.stack);
      throw error;
    }
  }
}

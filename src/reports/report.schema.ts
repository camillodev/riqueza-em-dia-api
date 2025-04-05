import { z } from 'zod';
import { createZodDto } from 'nestjs-zod';

// Schema for summary report query
export const summaryReportSchema = z.object({
  month: z.string().regex(/^\d{4}-\d{2}$/, 'Month must be in YYYY-MM format').optional(),
});

// Schema for income vs expense chart query
export const incomeVsExpenseSchema = z.object({
  month: z.string().regex(/^\d{4}-\d{2}$/, 'Month must be in YYYY-MM format').optional(),
});

// Schema for category chart query
export const byCategorySchema = z.object({
  month: z.string().regex(/^\d{4}-\d{2}$/, 'Month must be in YYYY-MM format').optional(),
  type: z.enum(['income', 'expense'], {
    errorMap: () => ({ message: 'Type must be either income or expense' })
  }),
});

// Schema for monthly data chart query
export const monthlyDataSchema = z.object({
  month: z.string().regex(/^\d{4}-\d{2}$/, 'Month must be in YYYY-MM format').optional(),
  days: z.coerce.number().int().positive().optional(),
});

// DTO classes for the controller
export class SummaryReportDto extends createZodDto(summaryReportSchema) { }
export class IncomeVsExpenseDto extends createZodDto(incomeVsExpenseSchema) { }
export class ByCategoryDto extends createZodDto(byCategorySchema) { }
export class MonthlyDataDto extends createZodDto(monthlyDataSchema) { } 
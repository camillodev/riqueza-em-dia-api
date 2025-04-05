import { z } from 'zod';
import { createZodDto } from 'nestjs-zod';

// Base schema for transactions
const transactionBaseSchema = z.object({
  amount: z.number().int('Amount must be provided in cents as an integer').positive('Amount must be a positive number'),
  description: z.string().min(3, 'Description must be at least 3 characters').max(255, 'Description too long'),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be in YYYY-MM-DD format'),
  category: z.string().uuid('Category must be a valid UUID').optional().nullable(),
  type: z.enum(['income', 'expense'], {
    errorMap: () => ({ message: 'Type must be either income or expense' })
  }),
  account: z.string().uuid('Account must be a valid UUID'),
  status: z.enum(['pending', 'completed', 'canceled'], {
    errorMap: () => ({ message: 'Status must be pending, completed, or canceled' })
  }).default('pending'),
});

// Schema for creating a new transaction
export const createTransactionSchema = transactionBaseSchema;

// Schema for updating a transaction
export const updateTransactionSchema = transactionBaseSchema.partial();

// Schema for filtering transactions
export const transactionFilterSchema = z.object({
  // Filter by month (MM format)
  month: z.preprocess(
    (val) => val === '' ? undefined : val,
    z.string().regex(/^(0[1-9]|1[0-2])$/, 'Month must be in MM format (01-12)').optional()
  ),

  // Filter by year (YYYY format)
  year: z.preprocess(
    (val) => val === '' ? undefined : val,
    z.string().regex(/^\d{4}$/, 'Year must be in YYYY format').optional()
  ),

  type: z.preprocess(
    (val) => val === '' ? undefined : val,
    z.enum(['income', 'expense']).optional()
  ),

  category: z.preprocess(
    (val) => val === '' ? undefined : val,
    z.string().uuid('Category must be a valid UUID').optional()
  ),

  account: z.preprocess(
    (val) => val === '' ? undefined : val,
    z.string().uuid('Account must be a valid UUID').optional()
  ),

  search: z.preprocess(
    (val) => val === '' ? undefined : val,
    z.string().optional()
  ),

  sort: z.preprocess(
    (val) => val === '' ? 'date' : val,
    z.enum(['date', 'amount', 'description']).optional().default('date')
  ),

  order: z.preprocess(
    (val) => val === '' ? 'desc' : val,
    z.enum(['asc', 'desc']).optional().default('desc')
  ),
}).superRefine((data, ctx) => {
  // Validate that year is provided if month is provided
  if (data.month && !data.year) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: "When month is provided, the year parameter is required",
      path: ['month']
    });
    return z.NEVER;
  }
});

// DTO classes for the controller
export class CreateTransactionDto extends createZodDto(createTransactionSchema) { }
export class UpdateTransactionDto extends createZodDto(updateTransactionSchema) { }
export class TransactionFilterDto extends createZodDto(transactionFilterSchema) { }

// Types for internal use
export type TransactionFilter = z.infer<typeof transactionFilterSchema>; 
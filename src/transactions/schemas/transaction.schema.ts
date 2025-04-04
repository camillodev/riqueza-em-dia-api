import { z } from 'zod';
import { createZodDto } from 'nestjs-zod';

// Base schema for transactions
const transactionBaseSchema = z.object({
  amount: z.number().int('Amount must be provided in cents as an integer').positive('Amount must be a positive number'),
  description: z.string().min(3, 'Description must be at least 3 characters').max(255, 'Description too long'),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be in YYYY-MM-DD format'),
  category: z.string().uuid('Category must be a valid UUID').optional(),
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
  month: z.string().regex(/^\d{4}-\d{2}$/, 'Month must be in YYYY-MM format').optional(),
  type: z.enum(['income', 'expense']).optional(),
  category: z.string().uuid('Category must be a valid UUID').optional(),
  account: z.string().uuid('Account must be a valid UUID').optional(),
  search: z.string().optional(),
  sort: z.enum(['date', 'amount', 'description']).optional().default('date'),
  order: z.enum(['asc', 'desc']).optional().default('desc'),
});

// DTO classes for the controller
export class CreateTransactionDto extends createZodDto(createTransactionSchema) { }
export class UpdateTransactionDto extends createZodDto(updateTransactionSchema) { }
export class TransactionFilterDto extends createZodDto(transactionFilterSchema) { }

// Types for internal use
export type TransactionFilter = z.infer<typeof transactionFilterSchema>; 
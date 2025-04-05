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
  // Flexible month parameter - handles both YYYY-MM format and single month (01-12)
  month: z.union([
    // When used as a YYYY-MM format (combined)
    z.string().regex(/^\d{4}-\d{2}$/, 'Month must be in YYYY-MM format'),
    // When used as single month (01-12)
    z.string().regex(/^(0[1-9]|1[0-2])$/, 'Month must be in format 01-12'),
    // Empty string
    z.literal('')
  ]).optional().transform(val => {
    if (!val || val === '') return undefined;
    // If it's already in YYYY-MM format, return as is
    if (/^\d{4}-\d{2}$/.test(val)) return val;
    // Single month will be handled in the schema transform
    return val;
  }),

  // Support individual year parameter
  year: z.string().regex(/^\d{4}$/, 'Year must be in YYYY format').optional()
    .or(z.literal('')).transform(val => val === '' ? undefined : val),

  type: z.enum(['income', 'expense']).optional()
    .or(z.literal('')).transform(val => val === '' ? undefined : val),
  category: z.string().uuid('Category must be a valid UUID').optional()
    .or(z.literal('')).transform(val => val === '' ? undefined : val),
  account: z.string().uuid('Account must be a valid UUID').optional()
    .or(z.literal('')).transform(val => val === '' ? undefined : val),
  search: z.string().optional()
    .or(z.literal('')).transform(val => val === '' ? undefined : val),
  sort: z.enum(['date', 'amount', 'description']).optional().default('date'),
  order: z.enum(['asc', 'desc']).optional().default('desc'),
}).superRefine((data, ctx) => {
  // Validate that year is provided if month is in single-month format
  if (data.month && /^(0[1-9]|1[0-2])$/.test(data.month) && !data.year) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: "When month is provided as a number (01-12), the year parameter is required",
      path: ['month']
    });
    return z.NEVER;
  }
}).transform(data => {
  // Create a copy of the data
  const result = { ...data } as Record<string, any>;

  // If individual month was passed and year is present, combine them
  if (result.month && /^(0[1-9]|1[0-2])$/.test(result.month) && result.year) {
    // Create the proper YYYY-MM format
    result.month = `${result.year}-${result.month}`;
  }

  // Clean up
  delete result.year;

  // Remove undefined values
  return Object.entries(result).reduce((acc, [key, value]) => {
    if (value !== undefined) {
      acc[key] = value;
    }
    return acc;
  }, {} as Record<string, any>);
});

// DTO classes for the controller
export class CreateTransactionDto extends createZodDto(createTransactionSchema) { }
export class UpdateTransactionDto extends createZodDto(updateTransactionSchema) { }
export class TransactionFilterDto extends createZodDto(transactionFilterSchema) { }

// Types for internal use
export type TransactionFilter = z.infer<typeof transactionFilterSchema>; 
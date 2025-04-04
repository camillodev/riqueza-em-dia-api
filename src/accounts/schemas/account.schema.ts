import { z } from 'zod';
import { createZodDto } from 'nestjs-zod';
import { extendApi } from '@anatine/zod-openapi';

// Base schema for all account operations
const accountBaseSchema = z.object({
  name: extendApi(z.string().min(1).max(100), {
    description: 'Account name',
    example: 'Nubank',
  }),
  balance: extendApi(z.number().nonnegative(), {
    description: 'Account balance',
    example: 1000,
  }),
  color: extendApi(z.string().regex(/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/), {
    description: 'Account color in hexadecimal format',
    example: '#7158e2',
    format: 'hex-color',
  }),
  isArchived: extendApi(z.boolean().default(false), {
    description: 'Is the account archived',
    example: false,
  }),
});

// Schema for creating a new account
export const createAccountSchema = accountBaseSchema;

// Schema for updating an account (all fields optional)
export const updateAccountSchema = accountBaseSchema.partial();

// Schema for archiving/unarchiving an account
export const archiveAccountSchema = z.object({
  isArchived: extendApi(z.boolean(), {
    description: 'Is the account archived',
    example: true,
  }),
});

// Schema for filter accounts
export const accountFilterSchema = z.object({
  isArchived: extendApi(z.boolean().optional(), {
    description: 'Filter by archive status',
    example: false,
  }),
});

// Schema for account ID parameter
export const accountIdSchema = z.object({
  id: extendApi(z.string().uuid(), {
    description: 'Account ID',
    example: '123e4567-e89b-12d3-a456-426614174000',
  }),
});

// Create DTO classes for OpenAPI
export class CreateAccountDto extends createZodDto(createAccountSchema) { }
export class UpdateAccountDto extends createZodDto(updateAccountSchema) { }
export class ArchiveAccountDto extends createZodDto(archiveAccountSchema) { }
export class AccountFilterDto extends createZodDto(accountFilterSchema) { }
export class AccountIdDto extends createZodDto(accountIdSchema) { } 
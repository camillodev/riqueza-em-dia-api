import { ApiProperty } from '@nestjs/swagger';
import { z } from 'zod';

/**
 * Zod schema for pagination query parameters
 */
export const PaginationQuerySchema = z.object({
  page: z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(1).max(100).default(10),
  sortBy: z.string().optional(),
  sortOrder: z.enum(['asc', 'desc']).optional().default('asc'),
});

export type PaginationQueryParams = z.infer<typeof PaginationQuerySchema>;

/**
 * The paginated response structure
 */
export class PaginatedResponseDto<T> {
  @ApiProperty({ description: 'The items for the current page' })
  items: T[];

  @ApiProperty({ description: 'The total number of items' })
  total: number;

  @ApiProperty({ description: 'The current page' })
  page: number;

  @ApiProperty({ description: 'The number of items per page' })
  limit: number;

  @ApiProperty({ description: 'The total number of pages' })
  totalPages: number;

  @ApiProperty({ description: 'If there is a next page' })
  hasNext: boolean;

  @ApiProperty({ description: 'If there is a previous page' })
  hasPrevious: boolean;

  constructor(items: T[], total: number, page: number, limit: number) {
    this.items = items;
    this.total = total;
    this.page = page;
    this.limit = limit;
    this.totalPages = Math.ceil(total / limit);
    this.hasNext = page < this.totalPages;
    this.hasPrevious = page > 1;
  }
} 
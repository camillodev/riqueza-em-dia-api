import { Logger, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CacheService } from '../cache/cache.service';

/**
 * Base repository for standardizing database operations
 */
export abstract class BaseRepository<T, CreateDto, UpdateDto> {
  protected abstract readonly logger: Logger;
  protected abstract readonly entityName: string;
  protected abstract readonly cacheNamespace: string;
  protected abstract readonly prismaModel: any;

  constructor(
    protected readonly prisma: PrismaService,
    protected readonly cacheService?: CacheService,
  ) { }

  /**
   * Create cache key for an entity
   */
  protected createCacheKey(id: string): string {
    return `${this.entityName}:${id}`;
  }

  /**
   * Find all entities that match given criteria
   */
  async findAll(filter: Record<string, any> = {}, cacheOptions?: { ttl?: number }): Promise<T[]> {
    const cacheKey = `findAll:${JSON.stringify(filter)}`;

    // Try to get from cache first
    if (this.cacheService) {
      const cached = await this.cacheService.get<T[]>(cacheKey, this.cacheNamespace);
      if (cached) {
        return cached;
      }
    }

    // Not in cache, get from database
    const result = await this.prismaModel.findMany({ where: filter });

    // Store in cache
    if (this.cacheService) {
      await this.cacheService.set(
        cacheKey,
        result,
        this.cacheNamespace,
        cacheOptions?.ttl,
      );
    }

    return result;
  }

  /**
   * Find a single entity by ID
   */
  async findById(id: string, userId?: string): Promise<T> {
    const cacheKey = this.createCacheKey(id);

    // Try to get from cache first
    if (this.cacheService) {
      const cached = await this.cacheService.get<T>(cacheKey, this.cacheNamespace);
      if (cached) {
        return cached;
      }
    }

    // Build where clause
    const where: Record<string, any> = { id };
    if (userId) {
      where.userId = userId;
    }

    // Get from database
    const entity = await this.prismaModel.findFirst({ where });

    if (!entity) {
      throw new NotFoundException(`${this.entityName} with ID ${id} not found`);
    }

    // Store in cache
    if (this.cacheService) {
      await this.cacheService.set(cacheKey, entity, this.cacheNamespace);
    }

    return entity;
  }

  /**
   * Create a new entity
   */
  async create(data: CreateDto, userId?: string): Promise<T> {
    // Add user ID to data if provided
    const createData: any = { ...data };
    if (userId) {
      createData.userId = userId;
    }

    // Create in database
    const entity = await this.prismaModel.create({
      data: createData,
    });

    // Invalidate any list caches
    if (this.cacheService) {
      await this.cacheService.delete(`findAll:*`, this.cacheNamespace);
    }

    return entity;
  }

  /**
   * Update an entity
   */
  async update(id: string, data: UpdateDto, userId?: string): Promise<T> {
    // Ensure entity exists
    await this.findById(id, userId);

    // Update in database
    const updated = await this.prismaModel.update({
      where: { id },
      data,
    });

    // Invalidate caches
    if (this.cacheService) {
      await this.cacheService.delete(this.createCacheKey(id), this.cacheNamespace);
      await this.cacheService.delete(`findAll:*`, this.cacheNamespace);
    }

    return updated;
  }

  /**
   * Delete an entity
   */
  async delete(id: string, userId?: string): Promise<T> {
    // Ensure entity exists and user has access
    await this.findById(id, userId);

    // Delete from database
    const deleted = await this.prismaModel.delete({
      where: { id },
    });

    // Invalidate caches
    if (this.cacheService) {
      await this.cacheService.delete(this.createCacheKey(id), this.cacheNamespace);
      await this.cacheService.delete(`findAll:*`, this.cacheNamespace);
    }

    return deleted;
  }
} 
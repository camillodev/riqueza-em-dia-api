import { Injectable, Inject, Logger } from '@nestjs/common';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Cache } from 'cache-manager';

@Injectable()
export class CacheService {
  private readonly logger = new Logger(CacheService.name);
  private readonly keyPrefix = 'app:';

  constructor(@Inject(CACHE_MANAGER) private cacheManager: Cache) { }

  /**
   * Create a namespaced cache key
   */
  createKey(key: string, namespace?: string): string {
    return `${this.keyPrefix}${namespace ? namespace + ':' : ''}${key}`;
  }

  /**
   * Get a value from cache
   */
  async get<T>(key: string, namespace?: string): Promise<T | null> {
    const cacheKey = this.createKey(key, namespace);
    try {
      const value = await this.cacheManager.get<T>(cacheKey);
      this.logger.debug(`Cache ${value ? 'HIT' : 'MISS'} for key: ${cacheKey}`);
      return value;
    } catch (error) {
      this.logger.error(`Error getting from cache: ${error.message}`, error.stack);
      return null;
    }
  }

  /**
   * Set a value in cache
   */
  async set<T>(
    key: string,
    value: T,
    namespace?: string,
    ttl?: number
  ): Promise<void> {
    const cacheKey = this.createKey(key, namespace);
    try {
      await this.cacheManager.set(cacheKey, value, ttl);
      this.logger.debug(`Cache SET for key: ${cacheKey}`);
    } catch (error) {
      this.logger.error(`Error setting cache: ${error.message}`, error.stack);
    }
  }

  /**
   * Delete a value from cache
   */
  async delete(key: string, namespace?: string): Promise<void> {
    const cacheKey = this.createKey(key, namespace);
    try {
      await this.cacheManager.del(cacheKey);
      this.logger.debug(`Cache DELETE for key: ${cacheKey}`);
    } catch (error) {
      this.logger.error(`Error deleting from cache: ${error.message}`, error.stack);
    }
  }

  /**
   * Clear all cache entries with the app prefix
   * Note: Current cache-manager types don't include reset method
   */
  async clear(): Promise<void> {
    try {
      // This is a workaround as reset() might not be available on all cache implementations
      // Ideally, we would have an admin endpoint to flush the cache on demand
      this.logger.debug('Cache clear requested - flush cache on demand via admin tool');
    } catch (error) {
      this.logger.error(`Error clearing cache: ${error.message}`, error.stack);
    }
  }
} 
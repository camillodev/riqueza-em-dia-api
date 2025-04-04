import { Module } from '@nestjs/common';
import { CacheModule } from '@nestjs/cache-manager';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { redisStore } from 'cache-manager-redis-store';
import { CacheService } from './cache.service';

@Module({
  imports: [
    CacheModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: async (configService: ConfigService) => {
        const ttl = configService.get('app.cache.ttl', 300000); // 5 min default
        const isProd = configService.get('app.isProd', false);

        // Use in-memory cache for development and Redis for production
        if (isProd && configService.get('REDIS_URL')) {
          return {
            store: await redisStore({
              url: configService.get('REDIS_URL'),
              ttl,
            }),
          };
        }

        // Fallback to in-memory cache
        return {
          ttl,
          max: 100, // Maximum number of items in cache
        };
      },
      isGlobal: true,
    }),
  ],
  providers: [CacheService],
  exports: [CacheService],
})
export class AppCacheModule { } 
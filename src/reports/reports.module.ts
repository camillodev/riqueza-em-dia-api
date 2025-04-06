import { Module } from '@nestjs/common';
import { ReportsController } from './reports.controller';
import { ReportsService } from './reports.service';
import { PrismaModule } from '../prisma/prisma.module';
import { CacheModule } from '@nestjs/cache-manager';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [
    PrismaModule,
    AuthModule,
    CacheModule.register({
      ttl: 60 * 5, // Cache for 5 minutes
      max: 100,    // Maximum number of items in cache
    }),
  ],
  controllers: [ReportsController],
  providers: [ReportsService],
})
export class ReportsModule { }

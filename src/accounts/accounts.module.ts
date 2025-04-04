import { Module, MiddlewareConsumer, RequestMethod } from '@nestjs/common';
import { AccountsController } from './controllers/accounts.controller';
import { AccountsService } from './services/accounts.service';
import { AccountRepository } from './repositories/account.repository';
import { PrismaModule } from '../prisma/prisma.module';
import { CommonModule } from '../common/common.module';
import { SecurityMiddleware } from '../common/middleware/security.middleware';

@Module({
  imports: [
    PrismaModule,
    CommonModule,
  ],
  controllers: [AccountsController],
  providers: [
    AccountsService,
    AccountRepository,
  ],
  exports: [AccountsService],
})
export class AccountsModule {
  configure(consumer: MiddlewareConsumer) {
    // Apply security middleware to all account routes
    consumer
      .apply(SecurityMiddleware)
      .forRoutes({ path: 'api/accounts*', method: RequestMethod.ALL });
  }
} 
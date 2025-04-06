import { Module, MiddlewareConsumer } from '@nestjs/common';
import { TransactionsController } from './transactions.controller';
import { TransactionsService } from './transactions.service';
import { TransactionRepository } from './transaction.repository';
import { PrismaModule } from '../prisma/prisma.module';
import { CommonModule } from '../common/common.module';
import { SecurityMiddleware } from '../common/middleware/security.middleware';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [
    PrismaModule,
    CommonModule,
    AuthModule,
  ],
  controllers: [TransactionsController],
  providers: [
    TransactionsService,
    TransactionRepository,
  ],
  exports: [TransactionsService],
})
export class TransactionsModule {
  configure(consumer: MiddlewareConsumer) {
    // Apply security middleware to all transaction routes
    consumer
      .apply(SecurityMiddleware)
      .forRoutes(TransactionsController);
  }
} 
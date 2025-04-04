import { Module, MiddlewareConsumer } from '@nestjs/common';
import { TransactionsController } from './controllers/transactions.controller';
import { TransactionsService } from './services/transactions.service';
import { TransactionRepository } from './repositories/transaction.repository';
import { PrismaModule } from '../prisma/prisma.module';
import { CommonModule } from '../common/common.module';
import { SecurityMiddleware } from '../common/middleware/security.middleware';

@Module({
  imports: [
    PrismaModule,
    CommonModule,
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
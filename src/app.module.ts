import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { UsersModule } from './users/users.module';
import { AuthModule } from './auth/auth.module';
import { PrismaModule } from './prisma/prisma.module';
import { AccountsModule } from './accounts/accounts.module';
import { CommonModule } from './common/common.module';
import { TransactionsModule } from './transactions/transactions.module';

@Module({
  imports: [
    CommonModule,
    PrismaModule,
    UsersModule,
    AuthModule,
    AccountsModule,
    TransactionsModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule { }

import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { PrismaModule } from '../prisma/prisma.module';
import { ClerkAuthService } from './services/clerk-auth.service';
import { ClerkWebhookController } from './clerk-webhook.controller';
import { ClerkAuthGuard } from './clerk-auth.guard';
import { ClerkStrategy } from './strategies/clerk.strategy';
import { PassportModule } from '@nestjs/passport';
import { ClerkModule } from './providers/clerk.module';

@Module({
  imports: [
    PrismaModule,
    ConfigModule,
    PassportModule.register({ defaultStrategy: 'clerk' }),
    ClerkModule,
  ],
  controllers: [
    ClerkWebhookController,
  ],
  providers: [
    ClerkAuthService,
    ClerkAuthGuard,
    ClerkStrategy,
  ],
  exports: [
    ClerkAuthService,
    ClerkAuthGuard,
  ],
})
export class AuthModule { } 
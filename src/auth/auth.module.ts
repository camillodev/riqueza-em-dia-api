import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { PrismaModule } from '../prisma/prisma.module';
import { ClerkAuthService } from './services/clerk-auth.service';
import { ClerkWebhookController } from './clerk-webhook.controller';
import { ClerkAuthGuard } from './clerk-auth.guard';

@Module({
  imports: [
    PrismaModule,
    ConfigModule,
  ],
  controllers: [
    ClerkWebhookController,
  ],
  providers: [
    ClerkAuthService,
    ClerkAuthGuard,
  ],
  exports: [
    ClerkAuthService,
    ClerkAuthGuard,
  ],
})
export class AuthModule { } 
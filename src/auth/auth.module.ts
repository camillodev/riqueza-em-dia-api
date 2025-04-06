import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { PrismaModule } from '../prisma/prisma.module';
import { ClerkAuthService } from './services/clerk-auth.service';
import { ClerkWebhookController } from './clerk-webhook.controller';
import { JwtAuthGuard } from './jwt-auth.guard';
import { PassportModule } from '@nestjs/passport';
import { ClerkStrategy } from './clerk.strategy';
import { ClerkAuthGuard } from './clerk-auth.guard';

@Module({
  imports: [
    PrismaModule,
    ConfigModule,
    PassportModule,
  ],
  controllers: [
    ClerkWebhookController,
  ],
  providers: [
    ClerkAuthService,
    JwtAuthGuard,
    ClerkStrategy,
    ClerkAuthGuard,
  ],
  exports: [
    ClerkAuthService,
    JwtAuthGuard,
    PassportModule,
    ClerkAuthGuard,
  ],
})
export class AuthModule { } 
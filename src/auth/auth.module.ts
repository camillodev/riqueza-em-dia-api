import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { PrismaModule } from '../prisma/prisma.module';
import { ClerkAuthService } from './services/clerk-auth.service';
import { ClerkWebhookController } from './clerk-webhook.controller';

@Module({
  imports: [
    PrismaModule,
    ConfigModule,
  ],
  controllers: [ClerkWebhookController],
  providers: [ClerkAuthService],
  exports: [ClerkAuthService],
})
export class AuthModule { } 
import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { JwtStrategy } from './strategies/jwt.strategy';
import { PrismaModule } from '../prisma/prisma.module';
import { ClerkAuthService } from './services/clerk-auth.service';
import { ClerkWebhookController } from './controllers/clerk-webhook.controller';

@Module({
  imports: [
    PassportModule,
    PrismaModule,
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: async (configService: ConfigService) => ({
        secret: configService.get<string>('JWT_SECRET') || 'supersecret',
        signOptions: { expiresIn: '7d' },
      }),
    }),
  ],
  controllers: [ClerkWebhookController],
  providers: [ClerkAuthService, JwtStrategy],
  exports: [JwtModule, ClerkAuthService],
})
export class AuthModule { } 
import { Global, Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ClerkClientProvider } from './clerk-client.provider';

@Global()
@Module({
  imports: [ConfigModule],
  providers: [ClerkClientProvider],
  exports: [ClerkClientProvider],
})
export class ClerkModule { } 
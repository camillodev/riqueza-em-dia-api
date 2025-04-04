import { Injectable, Logger } from '@nestjs/common';
import { ThrottlerGuard } from '@nestjs/throttler';

@Injectable()
export class CustomThrottlerGuard extends ThrottlerGuard {
  private readonly logger = new Logger(CustomThrottlerGuard.name);

  protected override async getTracker(req: Record<string, any>): Promise<string> {
    // Use a combination of IP and user ID (if available) as the rate limit key
    const userId = req.user?.id || 'anonymous';
    const ip = req.ip || 'unknown';
    const tracker = `${ip}-${userId}`;

    this.logger.debug(`Rate limit tracker: ${tracker}`);
    return tracker;
  }

  protected override errorMessage: string = 'Too many requests, please try again later.';
} 
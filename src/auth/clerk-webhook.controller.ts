import { Controller, Post, Headers, Body, UnauthorizedException, Logger, RawBodyRequest, Req } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ClerkAuthService } from './services/clerk-auth.service';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import * as crypto from 'crypto';
import { Request } from 'express';
import { ClerkUserDataDto } from './dto/clerk-auth.dto';

@ApiTags('auth')
@Controller('webhooks/clerk')
export class ClerkWebhookController {
  private readonly logger = new Logger(ClerkWebhookController.name);

  constructor(
    private readonly clerkAuthService: ClerkAuthService,
    private readonly configService: ConfigService,
  ) { }

  @Post()
  @ApiOperation({ summary: 'Handle Clerk webhook events' })
  @ApiResponse({ status: 200, description: 'Event processed successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized webhook call' })
  async handleWebhook(
    @Headers('svix-id') svixId: string,
    @Headers('svix-timestamp') svixTimestamp: string,
    @Headers('svix-signature') svixSignature: string,
    @Body() payload: any,
    @Req() request: RawBodyRequest<Request>,
  ) {
    // Verify webhook signature
    const webhookSecret = this.configService.get<string>('CLERK_WEBHOOK_SECRET');

    // Only verify signature in production
    if (process.env.NODE_ENV === 'production') {
      if (!webhookSecret) {
        this.logger.error('CLERK_WEBHOOK_SECRET is not defined');
        throw new UnauthorizedException('Webhook secret not configured');
      }

      if (!svixId || !svixTimestamp || !svixSignature) {
        this.logger.warn('Missing Svix headers');
        throw new UnauthorizedException('Missing verification headers');
      }

      const rawBody = request.rawBody;
      if (!rawBody) {
        this.logger.warn('Request rawBody is missing');
        throw new UnauthorizedException('Invalid request format');
      }

      if (!this.verifyWebhookSignature(svixId, svixTimestamp, svixSignature, rawBody.toString(), webhookSecret)) {
        this.logger.warn('Invalid webhook signature');
        throw new UnauthorizedException('Invalid webhook signature');
      }
    }

    try {
      const { type, data } = payload;
      this.logger.log(`Processing Clerk webhook event: ${type}`);

      // Handle user.created or user.updated events
      if (type === 'user.created' || type === 'user.updated') {
        const { id, email_addresses, first_name, last_name, image_url } = data;

        const primaryEmail = email_addresses.find(email => email.primary)?.email_address;
        if (!primaryEmail) {
          this.logger.warn(`User ${id} has no primary email address`);
          return { success: false, message: 'No primary email address found' };
        }

        // Create user data DTO
        const clerkUserData = new ClerkUserDataDto();
        clerkUserData.clerkId = id;
        clerkUserData.email = primaryEmail;
        clerkUserData.fullName = `${first_name} ${last_name}`.trim();
        clerkUserData.avatarUrl = image_url;

        // Get or create user in our database
        await this.clerkAuthService.getOrCreateUser(clerkUserData);

        this.logger.log(`Successfully processed ${type} event for user ${id}`);
        return { success: true };
      }

      return { success: true, message: `Event ${type} received but not processed` };
    } catch (error) {
      this.logger.error(`Error processing webhook: ${error.message}`, error.stack);
      return { success: false, error: error.message };
    }
  }

  private verifyWebhookSignature(svixId: string, svixTimestamp: string, svixSignature: string, payload: string, secret: string): boolean {
    try {
      // Expected signature format is: timestamp.signatures (multiple comma-separated signatures)
      const signatureParts = svixSignature.split(',');
      const signatures = signatureParts.map(sig => sig.trim());

      // Create the message to verify
      const message = `${svixId}.${svixTimestamp}.${payload}`;

      // Decode webhook secret
      const secretBytes = Buffer.from(secret, 'base64');

      // Check any of the signatures match
      for (const signature of signatures) {
        const digest = crypto
          .createHmac('sha256', secretBytes)
          .update(message)
          .digest('base64');

        if (crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(digest))) {
          return true;
        }
      }

      return false;
    } catch (error) {
      this.logger.error(`Error verifying webhook signature: ${error.message}`, error.stack);
      return false;
    }
  }
} 
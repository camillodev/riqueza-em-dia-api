import { Controller, Post, Headers, Body, UnauthorizedException, Logger, RawBodyRequest, Req } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ClerkAuthService } from './services/clerk-auth.service';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import * as crypto from 'crypto';
import { Request } from 'express';
import { ClerkUserDataDto } from './dto/clerk-auth.dto';
import { Public } from './decorators/public.decorator';

@ApiTags('auth')
@Controller('webhooks/clerk')
export class ClerkWebhookController {
  private readonly logger = new Logger(ClerkWebhookController.name);

  constructor(
    private readonly clerkAuthService: ClerkAuthService,
    private readonly configService: ConfigService,
  ) { }

  @Post()
  @Public()
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
    await this.verifyWebhookRequest(svixId, svixTimestamp, svixSignature, request);

    try {
      const { type, data } = payload;
      this.logger.log(`Processing Clerk webhook event: ${type}`);

      if (type === 'user.created' || type === 'user.updated') {
        const { id, email_addresses, first_name, last_name, image_url, profile_image_url, primary_email_address_id } = data;

        this.logger.log(`Processing webhook data - User ID: ${id}`);
        this.logger.log(`Email addresses raw data: ${JSON.stringify(email_addresses)}`);
        this.logger.log(`Primary email ID: ${primary_email_address_id}`);

        // Try to find the primary email by ID first
        let primaryEmail = null;

        if (primary_email_address_id && email_addresses) {
          const primaryEmailObj = email_addresses.find(email => email.id === primary_email_address_id);
          if (primaryEmailObj) {
            primaryEmail = primaryEmailObj.email_address;
            this.logger.log(`Found primary email by ID: ${primaryEmail}`);
          }
        }

        // Fallback to first email or finding one marked as primary
        if (!primaryEmail && email_addresses && email_addresses.length > 0) {
          // Try to find email marked as primary
          const firstPrimaryEmail = email_addresses.find(email => email.primary === true || email.verification?.status === 'verified');

          if (firstPrimaryEmail) {
            primaryEmail = firstPrimaryEmail.email_address;
            this.logger.log(`Found primary email by 'primary' flag: ${primaryEmail}`);
          } else {
            // Just use the first email
            primaryEmail = email_addresses[0].email_address;
            this.logger.log(`Using first email as fallback: ${primaryEmail}`);
          }
        }

        if (!primaryEmail) {
          this.logger.warn(`User ${id} has no email address`);
          return { success: false, message: 'No email address found' };
        }

        const clerkUserData = new ClerkUserDataDto();
        clerkUserData.clerkId = id;
        clerkUserData.email = primaryEmail;
        clerkUserData.fullName = `${first_name || ''} ${last_name || ''}`.trim();
        clerkUserData.avatarUrl = profile_image_url || image_url;

        this.logger.log(`Attempting to create/update user with data: ${JSON.stringify(clerkUserData)}`);
        try {
          await this.clerkAuthService.getOrCreateUser(clerkUserData);
          this.logger.log(`Successfully processed ${type} event for user ${id}`);
          return { success: true };
        } catch (error) {
          this.logger.error(`Error creating/updating user: ${error.message}`, error.stack);
          return { success: false, error: error.message };
        }
      }

      if (type === 'user.deleted') {
        const { id } = data;

        // Find and mark user as deleted in our database
        await this.clerkAuthService.handleUserDeleted(id);

        this.logger.log(`Successfully processed user.deleted event for user ${id}`);
        return { success: true };
      }

      return { success: true, message: `Event ${type} received but not processed` };
    } catch (error) {
      this.logger.error(`Error processing webhook: ${error.message}`, error.stack);
      return { success: false, error: error.message };
    }
  }

  /**
   * Verify that the webhook request is legitimate and came from Clerk
   */
  private async verifyWebhookRequest(
    svixId: string,
    svixTimestamp: string,
    svixSignature: string,
    request: RawBodyRequest<Request>
  ): Promise<void> {
    // Check if we're in development mode
    const isDevelopment = process.env.NODE_ENV !== 'production';

    this.logger.log(`Verifying webhook in ${isDevelopment ? 'development' : 'production'} mode`);

    // In development, we may skip signature verification
    if (isDevelopment && process.env.SKIP_WEBHOOK_VERIFICATION === 'true') {
      this.logger.warn('Skipping webhook signature verification in development mode');
      return;
    }

    const webhookSecret = this.configService.get<string>('CLERK_WEBHOOK_SECRET');

    if (!webhookSecret) {
      this.logger.error('CLERK_WEBHOOK_SECRET is not defined');
      throw new UnauthorizedException('Webhook secret not configured');
    }

    if (!svixId || !svixTimestamp || !svixSignature) {
      this.logger.warn(`Missing Svix headers: ID=${!!svixId}, Timestamp=${!!svixTimestamp}, Signature=${!!svixSignature}`);

      // Be more lenient in development mode
      if (isDevelopment) {
        this.logger.warn('Continuing despite missing headers in development mode');
        return;
      }

      throw new UnauthorizedException('Missing verification headers');
    }

    const rawBody = request.rawBody;
    if (!rawBody) {
      this.logger.warn('Request rawBody is missing');

      // Be more lenient in development mode
      if (isDevelopment) {
        this.logger.warn('Continuing despite missing raw body in development mode');
        return;
      }

      throw new UnauthorizedException('Invalid request format');
    }

    // In development mode, we can be more lenient with signature verification
    if (isDevelopment) {
      try {
        const verified = this.verifyWebhookSignature(svixId, svixTimestamp, svixSignature, rawBody.toString(), webhookSecret);
        if (!verified) {
          this.logger.warn('Invalid webhook signature in development mode, but continuing anyway');
        } else {
          this.logger.log('Webhook signature verified successfully');
        }
        return;
      } catch (error) {
        this.logger.warn(`Webhook verification error in development mode: ${error.message}`);
        return;
      }
    }

    // In production, we must strictly verify the signature
    if (!this.verifyWebhookSignature(svixId, svixTimestamp, svixSignature, rawBody.toString(), webhookSecret)) {
      this.logger.warn('Invalid webhook signature');
      throw new UnauthorizedException('Invalid webhook signature');
    }

    this.logger.log('Webhook verification successful');
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
import { Controller, Post, Headers, Body, UnauthorizedException, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ClerkAuthService } from '../services/clerk-auth.service';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';

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
  ) {
    // Verify webhook signature (in a real implementation)
    // const webhookSecret = this.configService.get<string>('CLERK_WEBHOOK_SECRET');
    // if (!webhookSecret || !this.verifyWebhookSignature(svixId, svixTimestamp, svixSignature, payload, webhookSecret)) {
    //   throw new UnauthorizedException('Invalid webhook signature');
    // }

    try {
      const { type, data } = payload;

      // Handle user.created or user.updated events
      if (type === 'user.created' || type === 'user.updated') {
        const { id, email_addresses, first_name, last_name, image_url } = data;

        const primaryEmail = email_addresses.find(email => email.primary)?.email_address;
        if (!primaryEmail) {
          this.logger.warn(`User ${id} has no primary email address`);
          return { success: false, message: 'No primary email address found' };
        }

        // Get or create user in our database
        await this.clerkAuthService.getOrCreateUser({
          clerkId: id,
          email: primaryEmail,
          fullName: `${first_name} ${last_name}`.trim(),
          avatarUrl: image_url,
        });

        return { success: true };
      }

      return { success: true, message: `Event ${type} received but not processed` };
    } catch (error) {
      this.logger.error(`Error processing webhook: ${error.message}`, error.stack);
      return { success: false, error: error.message };
    }
  }

  // In a real implementation, you would add signature verification
  // private verifyWebhookSignature(svixId: string, svixTimestamp: string, svixSignature: string, payload: any, secret: string): boolean {
  //   // Implement Svix signature verification
  //   return true;
  // }
} 
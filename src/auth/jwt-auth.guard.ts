import { Injectable, ExecutionContext } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
  // Override canActivate to allow all requests without authentication
  canActivate(context: ExecutionContext) {
    // Get request
    const request = context.switchToHttp().getRequest();

    // Set a default user for all requests
    request.user = {
      id: 'default-user-id',
      email: 'default@example.com',
      role: 'trial',
      clerkId: 'default-clerk-id'
    };

    // Always return true to allow all requests
    return true;
  }
} 
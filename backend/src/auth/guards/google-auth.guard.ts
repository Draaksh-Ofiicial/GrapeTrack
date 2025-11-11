import { Injectable } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

/**
 * Google OAuth Guard
 * Protects routes that initiate Google OAuth flow
 * Uses Passport's Google strategy
 */
@Injectable()
export class GoogleAuthGuard extends AuthGuard('google') {
  getAuthenticateOptions() {
    return {
      scope: ['profile', 'email'],
    };
  }
}

import { Injectable } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

/**
 * LocalAuthGuard - Validates email/password via LocalStrategy
 *
 * Usage:
 *   @Post('auth/login')
 *   @UseGuards(LocalAuthGuard)
 *   login(@CurrentUser() user: ValidatedUser) {
 *     // LocalStrategy validates email/password
 *     // user object is set on request if valid
 *   }
 */
@Injectable()
export class LocalAuthGuard extends AuthGuard('local') {}

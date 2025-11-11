import { Injectable } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

/**
 * JwtAuthGuard - Validates JWT token from httpOnly cookies
 *
 * This guard uses the JWT strategy to authenticate users.
 * The strategy extracts the token from httpOnly cookies and validates it.
 *
 * Usage:
 *   @UseGuards(JwtAuthGuard)
 *   @Get('profile')
 *   getProfile(@CurrentUser() user: AuthenticatedUser) {
 *     // Only authenticated users can access
 *   }
 */
@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {}

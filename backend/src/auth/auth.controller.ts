import {
  Controller,
  Post,
  Get,
  UseGuards,
  Body,
  Res,
  HttpCode,
  Req,
  UnauthorizedException,
} from '@nestjs/common';
import type { Response, Request } from 'express';
import { AuthService } from './auth.service';
import { LocalAuthGuard, JwtAuthGuard, GoogleAuthGuard } from './guards';
import { CurrentUser } from './decorators';
import type { AuthenticatedUser } from './strategies/jwt.strategy';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { SelectOrganizationDto } from './dto/select-organization.dto';
import { ForgotPasswordDto } from './dto/forgot-password.dto';
import {
  ResetPasswordDto,
  VerifyResetTokenDto,
} from './dto/reset-password.dto';
import { AcceptInvitationDto } from './dto/accept-invitation.dto';
import type { ValidatedUser } from './auth.service';

@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  /**
   * POST /auth/register
   * Register a new user with email and password
   * Returns access and refresh tokens in httpOnly cookies
   */
  @Post('register')
  async register(
    @Body() dto: RegisterDto,
    @Res({ passthrough: true }) res: Response,
  ) {
    const user = await this.authService.register(
      dto.email,
      dto.password,
      dto.firstName,
      dto.lastName,
    );

    const { access_token, refresh_token } = await this.authService.login({
      id: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
    });

    // Set access token in httpOnly cookie (15 minutes)
    res.cookie('access_token', access_token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax', // Use 'lax' to allow cookies in cross-site requests
      maxAge: 15 * 60 * 1000,
    });

    // Set refresh token in httpOnly cookie (7 days)
    res.cookie('refresh_token', refresh_token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax', // Use 'lax' to allow cookies in cross-site requests
      maxAge: 7 * 24 * 60 * 60 * 1000,
      // Remove path restriction so cookie is available for all API calls
    });

    return {
      message: 'User registered successfully',
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
      },
    };
  }

  /**
   * POST /auth/login
   * Login with email and password
   * Uses LocalStrategy to validate credentials
   * Returns access and refresh tokens in httpOnly cookies
   */
  @Post('login')
  @UseGuards(LocalAuthGuard)
  @HttpCode(200)
  async login(
    @CurrentUser() user: ValidatedUser,
    @Body() dto: LoginDto,
    @Res({ passthrough: true }) res: Response,
  ) {
    const { access_token, refresh_token } = await this.authService.login(user);

    // Determine token expiry based on rememberMe
    const accessTokenMaxAge = 15 * 60 * 1000; // 15 minutes (always short)
    const refreshTokenMaxAge = dto.rememberMe
      ? 30 * 24 * 60 * 60 * 1000 // 30 days if remember me
      : 7 * 24 * 60 * 60 * 1000; // 7 days default

    // Set access token in httpOnly cookie (15 minutes)
    res.cookie('access_token', access_token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax', // Use 'lax' to allow cookies in cross-site requests
      maxAge: accessTokenMaxAge,
    });

    // Set refresh token in httpOnly cookie (7 days or 30 days)
    res.cookie('refresh_token', refresh_token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax', // Use 'lax' to allow cookies in cross-site requests
      maxAge: refreshTokenMaxAge,
      // Remove path restriction so cookie is available for all API calls
    });

    return {
      message: 'Login successful',
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
      },
    };
  }

  /**
   * POST /auth/refresh
   * Refresh access token using refresh token from cookie
   * Returns new access token in httpOnly cookie
   */
  @Post('refresh')
  @HttpCode(200)
  async refresh(
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ) {
    const refresh_token = req.cookies['refresh_token'] as string | undefined;

    if (!refresh_token) {
      throw new UnauthorizedException('Refresh token not found in cookies');
    }

    const result = await this.authService.refreshAccessToken(refresh_token);
    const { access_token } = result;

    // Set new access token in httpOnly cookie (15 minutes)
    res.cookie('access_token', access_token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 15 * 60 * 1000,
    });

    return {
      message: 'Access token refreshed successfully',
    };
  }

  /**
   * POST /auth/logout
   * Logout user by revoking all refresh tokens
   * Clears access and refresh token cookies
   */
  @Post('logout')
  @UseGuards(JwtAuthGuard)
  @HttpCode(200)
  async logout(
    @CurrentUser() user: ValidatedUser,
    @Res({ passthrough: true }) res: Response,
  ) {
    // Revoke all refresh tokens for this user
    await this.authService.revokeAllUserTokens(user.id);

    // Clear cookies with proper options
    res.clearCookie('access_token', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
    });
    res.clearCookie('refresh_token', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
    });

    return {
      message: 'Logout successful',
    };
  }

  /**
   * GET /auth/me
   * Get current user info with all their organizations and permissions for active org
   * Protected route - requires valid JWT
   */
  @Get('me')
  @UseGuards(JwtAuthGuard)
  async getCurrentUser(@CurrentUser() user: AuthenticatedUser) {
    // Get user data with organizations (without permissions from DB since we have them from JWT)
    const userData = await this.authService.getCurrentUser(user.id);

    // Add permissions from JWT context if organization is selected
    const permissions =
      user.currentOrganization?.role.permissions.map((slug) => ({
        id: '', // We don't have the ID from JWT, but frontend doesn't use it
        name: slug,
        slug,
        category: 'system', // Default category
      })) || [];

    return {
      user: {
        ...userData,
        permissions,
      },
    };
  }

  /**
   * GET /auth/organizations
   * List all organizations the current user belongs to
   * Protected route - requires valid JWT
   */
  @Get('organizations')
  @UseGuards(JwtAuthGuard)
  async getUserOrganizations(@CurrentUser() user: ValidatedUser) {
    const userData = await this.authService.getCurrentUser(user.id);

    return {
      organizations: userData.organizations,
    };
  }

  /**
   * GET /auth/profile
   * Get comprehensive user profile information
   * Includes user details and all organization memberships with roles
   * Protected route - requires valid JWT
   */
  @Get('profile')
  @UseGuards(JwtAuthGuard)
  async getUserProfile(@CurrentUser() user: ValidatedUser) {
    const userData = await this.authService.getCurrentUser(user.id);

    return {
      user: {
        id: userData.id,
        email: userData.email,
        firstName: userData.firstName,
        lastName: userData.lastName,
        avatar: userData.avatar,
        createdAt: userData.createdAt,
        updatedAt: userData.updatedAt,
      },
      organizations: userData.organizations,
    };
  }

  /**
   * POST /auth/select-organization
   * Select/switch to a specific organization
   * Issues new access token with organization context
   * Protected route - requires valid JWT
   */
  @Post('select-organization')
  @UseGuards(JwtAuthGuard)
  @HttpCode(200)
  async selectOrganization(
    @CurrentUser() user: ValidatedUser,
    @Body() dto: SelectOrganizationDto,
    @Res({ passthrough: true }) res: Response,
  ) {
    const result = await this.authService.selectOrganization(
      user.id,
      dto.organizationId,
    );

    // Set new access token with organization context in httpOnly cookie
    res.cookie('access_token', result.access_token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 15 * 60 * 1000, // 15 minutes
    });

    return {
      message: 'Organization selected successfully',
      organization: result.organization,
    };
  }

  /**
   * POST /auth/switch-org
   * Switch to a specific organization
   * Issues new access token with organization context
   * Protected route - requires valid JWT
   */
  @Post('switch-org')
  @UseGuards(JwtAuthGuard)
  @HttpCode(200)
  async switchOrganization(
    @CurrentUser() user: ValidatedUser,
    @Body() dto: SelectOrganizationDto,
    @Res({ passthrough: true }) res: Response,
  ) {
    const result = await this.authService.selectOrganization(
      user.id,
      dto.organizationId,
    );

    // Set new access token with organization context in httpOnly cookie
    res.cookie('access_token', result.access_token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 15 * 60 * 1000, // 15 minutes
    });

    return {
      message: 'Organization switched successfully',
      organization: result.organization,
    };
  }

  /**
   * GET /auth/google
   * Initiate Google OAuth 2.0 authentication flow
   * Redirects user to Google login page
   * No authentication required
   */
  @Get('google')
  @UseGuards(GoogleAuthGuard)
  googleAuth() {
    // Guard handles redirect to Google
  }

  /**
   * GET /auth/google/callback
   * Handle Google OAuth 2.0 callback
   * Google redirects here after user approves
   * Returns access and refresh tokens in httpOnly cookies
   */
  @Get('google/callback')
  @UseGuards(GoogleAuthGuard)
  async googleAuthCallback(
    @CurrentUser() user: ValidatedUser,
    @Res({ passthrough: true }) res: Response,
  ) {
    const { access_token, refresh_token } = await this.authService.login(user);

    // Set access token in httpOnly cookie (15 minutes)
    res.cookie('access_token', access_token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 15 * 60 * 1000,
    });

    // Set refresh token in httpOnly cookie (7 days)
    res.cookie('refresh_token', refresh_token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    // Redirect to frontend with success
    // Frontend can check for cookies and redirect to org selection
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
    return res.redirect(`${frontendUrl}/auth/org-selection`);
  }

  /**
   * POST /auth/forgot-password
   * Send password reset email to user
   */
  @Post('forgot-password')
  @HttpCode(200)
  async forgotPassword(@Body() dto: ForgotPasswordDto) {
    await this.authService.generatePasswordResetToken(dto.email);
    return {
      message:
        'If an account with that email exists, a password reset link has been sent.',
    };
  }

  /**
   * POST /auth/verify-reset-token
   * Verify if a password reset token is valid
   */
  @Post('verify-reset-token')
  @HttpCode(200)
  async verifyResetToken(@Body() dto: VerifyResetTokenDto) {
    const isValid = await this.authService.verifyPasswordResetToken(dto.token);

    if (!isValid) {
      throw new UnauthorizedException('Invalid or expired reset token');
    }

    return { message: 'Token is valid' };
  }

  /**
   * POST /auth/reset-password
   * Reset user password using reset token
   */
  @Post('reset-password')
  @HttpCode(200)
  async resetPassword(@Body() dto: ResetPasswordDto) {
    await this.authService.resetPassword(dto.token, dto.newPassword);
    return { message: 'Password has been reset successfully' };
  }

  /**
   * POST /auth/accept-invitation
   * Accept an organization invitation
   * Creates user account if they don't exist, adds them to organization
   */
  @Post('accept-invitation')
  @HttpCode(200)
  async acceptInvitation(
    @Body() dto: AcceptInvitationDto,
    @Res({ passthrough: true }) res: Response,
  ) {
    const result = await this.authService.acceptInvitation(dto);

    // If user was created and logged in, set cookies
    if (result.user && result.tokens) {
      const { access_token, refresh_token } = result.tokens;

      // Set access token in httpOnly cookie (15 minutes)
      res.cookie('access_token', access_token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 15 * 60 * 1000,
      });

      // Set refresh token in httpOnly cookie (7 days)
      res.cookie('refresh_token', refresh_token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 7 * 24 * 60 * 60 * 1000,
      });
    }

    return result;
  }
}

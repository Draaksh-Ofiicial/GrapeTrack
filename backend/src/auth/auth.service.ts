import {
  Injectable,
  Inject,
  ConflictException,
  BadRequestException,
  UnauthorizedException,
  NotFoundException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { type Database, DATABASE } from '../database/database.module';
import {
  users,
  refreshTokens,
  userOrganizations,
  organizations,
  roles,
  passwordResetTokens,
  permissions,
  rolePermissions,
} from '../database/schema';
import { eq, and, isNull } from 'drizzle-orm';
import * as bcrypt from 'bcrypt';
import * as crypto from 'crypto';
import type { JwtPayload } from './strategies/jwt.strategy';
import { UsersService } from '../users/users.service';
import { AcceptInvitationDto } from './dto/accept-invitation.dto';

export interface ValidatedUser {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  avatar?: string;
}

@Injectable()
export class AuthService {
  constructor(
    @Inject(DATABASE) private readonly db: Database,
    private jwtService: JwtService,
    private usersService: UsersService,
  ) {}

  /**
   * Hash password using bcrypt
   */
  async hashPassword(password: string): Promise<string> {
    const saltRounds = 10;
    return bcrypt.hash(password, saltRounds);
  }

  /**
   * Validate password against hash
   */
  async validatePassword(
    password: string,
    passwordHash: string,
  ): Promise<boolean> {
    return bcrypt.compare(password, passwordHash);
  }

  /**
   * Generate JWT access token with user and organization context
   * Expires in 15 minutes
   */
  generateAccessToken(
    userId: string,
    orgId?: string,
    roleInOrg?: string,
  ): string {
    const payload: JwtPayload = {
      sub: userId,
      orgId,
      roleInOrg,
    };
    return this.jwtService.sign(payload, {
      expiresIn: '15m',
    });
  }

  /**
   * Generate refresh token (raw token before hashing)
   * Returns a 64-character hex string
   */
  private generateRefreshTokenString(): string {
    return crypto.randomBytes(32).toString('hex');
  }

  /**
   * Hash refresh token using sha256
   */
  private hashRefreshToken(token: string): string {
    return crypto.createHash('sha256').update(token).digest('hex');
  }

  /**
   * Create and store a refresh token in the database
   * Returns the unhashed token (to be sent to client)
   */
  async createRefreshToken(userId: string): Promise<string> {
    const tokenString = this.generateRefreshTokenString();
    const hashedToken = this.hashRefreshToken(tokenString);

    // 7 days expiration
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

    await this.db.insert(refreshTokens).values({
      userId,
      token: hashedToken,
      expiresAt,
    });

    // Return unhashed token to client
    return tokenString;
  }

  /**
   * Validate a refresh token
   * Returns userId if valid, throws if invalid
   */
  async validateRefreshToken(token: string): Promise<string> {
    const hashedToken = this.hashRefreshToken(token);

    const [refreshToken] = await this.db
      .select()
      .from(refreshTokens)
      .where(eq(refreshTokens.token, hashedToken))
      .limit(1);

    if (!refreshToken) {
      throw new UnauthorizedException('Invalid refresh token');
    }

    if (refreshToken.isRevoked) {
      throw new UnauthorizedException('Refresh token has been revoked');
    }

    if (new Date() > refreshToken.expiresAt) {
      throw new UnauthorizedException('Refresh token has expired');
    }

    return refreshToken.userId;
  }

  /**
   * Revoke a refresh token
   */
  async revokeRefreshToken(token: string): Promise<void> {
    const hashedToken = this.hashRefreshToken(token);

    await this.db
      .update(refreshTokens)
      .set({ isRevoked: true })
      .where(eq(refreshTokens.token, hashedToken));
  }

  /**
   * Revoke all refresh tokens for a user (used on logout)
   */
  async revokeAllUserTokens(userId: string): Promise<void> {
    await this.db
      .update(refreshTokens)
      .set({ isRevoked: true })
      .where(eq(refreshTokens.userId, userId));
  }

  /**
   * Register a new user
   */
  async register(
    email: string,
    password: string,
    firstName: string,
    lastName: string,
  ) {
    // Check if user already exists
    const [existingUser] = await this.db
      .select()
      .from(users)
      .where(eq(users.email, email.toLowerCase()))
      .limit(1);

    if (existingUser) {
      throw new ConflictException('User with this email already exists');
    }

    // Hash password
    const passwordHash = await this.hashPassword(password);

    // Create user
    const [newUser] = await this.db
      .insert(users)
      .values({
        email: email.toLowerCase(),
        password: passwordHash,
        firstName,
        lastName,
      })
      .returning();

    return {
      id: newUser.id,
      email: newUser.email,
      firstName: newUser.firstName,
      lastName: newUser.lastName,
    };
  }

  /**
   * Login user - returns access token and refresh token
   * Should be called after LocalStrategy validates credentials
   */
  async login(
    user: ValidatedUser,
  ): Promise<{ access_token: string; refresh_token: string }> {
    if (!user || !user.id) {
      throw new BadRequestException('Invalid user');
    }

    const access_token = this.generateAccessToken(user.id);
    const refresh_token = await this.createRefreshToken(user.id);

    return { access_token, refresh_token };
  }

  /**
   * Refresh access token using refresh token
   * Validates refresh token and returns new access token with org/role context
   */
  async refreshAccessToken(
    refreshToken: string,
  ): Promise<{ access_token: string }> {
    const userId = await this.validateRefreshToken(refreshToken);

    // Fetch user to verify active status
    const [user] = await this.db
      .select()
      .from(users)
      .where(eq(users.id, userId))
      .limit(1);

    if (!user || !user.isActive) {
      throw new UnauthorizedException('User is inactive');
    }

    // Fetch user's most recently selected organization (first one if none selected)
    const [userOrg] = await this.db
      .select({
        organizationId: organizations.id,
        roleId: userOrganizations.roleId,
        roleName: roles.name,
      })
      .from(userOrganizations)
      .innerJoin(
        organizations,
        eq(userOrganizations.organizationId, organizations.id),
      )
      .innerJoin(roles, eq(userOrganizations.roleId, roles.id))
      .where(
        and(
          eq(userOrganizations.userId, userId),
          eq(userOrganizations.status, 'active'),
        ),
      )
      .limit(1);

    // If user has an organization, include it in the token
    let access_token: string;
    if (userOrg) {
      access_token = this.generateAccessToken(
        userId,
        userOrg.organizationId,
        userOrg.roleName,
      );
    } else {
      // No organization context available
      access_token = this.generateAccessToken(userId);
    }

    return { access_token };
  }

  /**
   * Get current user info with all their organizations
   */
  async getCurrentUser(userId: string, activeOrgId?: string) {
    const [user] = await this.db
      .select()
      .from(users)
      .where(eq(users.id, userId))
      .limit(1);

    if (!user) {
      throw new NotFoundException('User not found');
    }

    // Fetch all organizations the user belongs to
    const userOrgs = await this.db
      .select({
        organizationId: organizations.id,
        name: organizations.name,
        slug: organizations.slug,
        logo: organizations.logo,
        plan: organizations.plan,
        createdBy: organizations.createdBy,
        roleId: userOrganizations.roleId,
        roleName: roles.name,
        status: userOrganizations.status,
        joinedAt: userOrganizations.joinedAt,
      })
      .from(userOrganizations)
      .innerJoin(
        organizations,
        eq(userOrganizations.organizationId, organizations.id),
      )
      .leftJoin(roles, eq(userOrganizations.roleId, roles.id))
      .where(eq(userOrganizations.userId, userId));

    // Extract permissions for the active organization (if provided)
    let userPermissions: Array<{
      id: string;
      name: string;
      slug: string;
      category: string;
    }> = [];

    if (activeOrgId) {
      // Find the user's role in the active organization
      const activeOrg = userOrgs.find(
        (org) => org.organizationId === activeOrgId,
      );

      if (activeOrg && activeOrg.roleId) {
        // Fetch permissions for this role
        const rolePerms = await this.db
          .select({
            permissionId: permissions.id,
            permissionName: permissions.name,
            permissionSlug: permissions.slug,
            category: permissions.category,
          })
          .from(rolePermissions)
          .innerJoin(
            permissions,
            eq(rolePermissions.permissionId, permissions.id),
          )
          .where(eq(rolePermissions.roleId, activeOrg.roleId))
          .orderBy(permissions.category, permissions.name);

        userPermissions = rolePerms.map((p) => ({
          id: p.permissionId,
          name: p.permissionName,
          slug: p.permissionSlug,
          category: p.category,
        }));
      }
    }

    return {
      id: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      avatar: user.avatar,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
      organizations: userOrgs,
      ...(activeOrgId && { permissions: userPermissions }),
    };
  }

  /**
   * Select/switch to an organization
   * Returns new access token with organization context
   */
  async selectOrganization(userId: string, organizationId: string) {
    // Verify user exists
    const [user] = await this.db
      .select()
      .from(users)
      .where(eq(users.id, userId))
      .limit(1);

    if (!user) {
      throw new NotFoundException('User not found');
    }

    // Verify user is a member of this organization
    const [userOrg] = await this.db
      .select()
      .from(userOrganizations)
      .where(
        and(
          eq(userOrganizations.userId, userId),
          eq(userOrganizations.organizationId, organizationId),
        ),
      )
      .limit(1);

    if (!userOrg) {
      throw new BadRequestException(
        'User is not a member of this organization',
      );
    }

    // Verify user's membership is active
    if (userOrg.status !== 'active') {
      throw new BadRequestException('User membership is not active');
    }

    // Fetch role information
    const [role] = await this.db
      .select()
      .from(roles)
      .where(eq(roles.id, userOrg.roleId))
      .limit(1);

    if (!role) {
      throw new NotFoundException('Role not found');
    }

    // Generate new access token with organization context
    const access_token = this.generateAccessToken(
      userId,
      organizationId,
      role.name,
    );

    return {
      access_token,
      organization: {
        id: organizationId,
        roleId: role.id,
        roleName: role.name,
      },
    };
  }

  /**
   * Generate password reset token for user
   */
  async generatePasswordResetToken(email: string): Promise<void> {
    // Check if user exists
    const existingUser = await this.db
      .select()
      .from(users)
      .where(eq(users.email, email))
      .limit(1);

    if (existingUser.length === 0) {
      // Don't reveal if user exists or not for security
      return;
    }

    const user = existingUser[0];

    // Generate secure random token
    const token = crypto.randomBytes(32).toString('hex');
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hour from now

    // Delete any existing unused tokens for this user
    await this.db
      .delete(passwordResetTokens)
      .where(
        and(
          eq(passwordResetTokens.userId, user.id),
          isNull(passwordResetTokens.usedAt),
        ),
      );

    // Store the reset token
    await this.db.insert(passwordResetTokens).values({
      userId: user.id,
      token,
      expiresAt,
    });

    // TODO: Send email with reset link
    // This would typically send an email with a link like:
    // https://yourdomain.com/auth/reset-password?token=${token}
    console.log(`Password reset token for ${email}: ${token}`);
    console.log(
      `Reset link: ${process.env.FRONTEND_URL}/auth/reset-password?token=${token}`,
    );
  }

  /**
   * Verify password reset token
   */
  async verifyPasswordResetToken(token: string): Promise<boolean> {
    const resetToken = await this.db
      .select()
      .from(passwordResetTokens)
      .where(
        and(
          eq(passwordResetTokens.token, token),
          isNull(passwordResetTokens.usedAt),
        ),
      )
      .limit(1);

    if (resetToken.length === 0) {
      return false;
    }

    const tokenData = resetToken[0];

    // Check if token has expired
    if (new Date() > tokenData.expiresAt) {
      return false;
    }

    return true;
  }

  /**
   * Reset password using reset token
   */
  async resetPassword(token: string, newPassword: string): Promise<void> {
    const resetToken = await this.db
      .select()
      .from(passwordResetTokens)
      .where(
        and(
          eq(passwordResetTokens.token, token),
          isNull(passwordResetTokens.usedAt),
        ),
      )
      .limit(1);

    if (resetToken.length === 0) {
      throw new BadRequestException('Invalid or expired reset token');
    }

    const tokenData = resetToken[0];

    // Check if token has expired
    if (new Date() > tokenData.expiresAt) {
      throw new BadRequestException('Reset token has expired');
    }

    // Hash the new password
    const hashedPassword = await this.hashPassword(newPassword);

    // Update the user's password
    await this.db
      .update(users)
      .set({
        password: hashedPassword,
        updatedAt: new Date(),
      })
      .where(eq(users.id, tokenData.userId));

    // Mark token as used
    await this.db
      .update(passwordResetTokens)
      .set({
        usedAt: new Date(),
        updatedAt: new Date(),
      })
      .where(eq(passwordResetTokens.id, tokenData.id));

    // Delete all refresh tokens for this user to force re-login
    await this.db
      .delete(refreshTokens)
      .where(eq(refreshTokens.userId, tokenData.userId));
  }

  /**
   * Accept an organization invitation
   * Creates user account if they don't exist and adds them to the organization
   */
  async acceptInvitation(dto: AcceptInvitationDto): Promise<{
    message: string;
    user?: ValidatedUser;
    tokens?: { access_token: string; refresh_token: string };
    organization?: { id: string; name: string };
  }> {
    // Accept the invitation and get the result
    const result = await this.usersService.acceptInvitation(dto.token);

    // Check if user already exists
    const [existingUser] = await this.db
      .select()
      .from(users)
      .where(eq(users.email, result.invitation.email))
      .limit(1);

    let user: ValidatedUser;
    let tokens: { access_token: string; refresh_token: string } | undefined;

    if (existingUser) {
      // User exists, just log them in
      user = {
        id: existingUser.id,
        email: existingUser.email,
        firstName: existingUser.firstName,
        lastName: existingUser.lastName,
        avatar: existingUser.avatar || undefined,
      };
      tokens = await this.login(user);
    } else {
      // User doesn't exist, create account
      if (!dto.password || !dto.firstName || !dto.lastName) {
        throw new BadRequestException(
          'Password, first name, and last name are required for new users',
        );
      }

      // Create the user account
      const newUser = await this.register(
        result.invitation.email,
        dto.password,
        dto.firstName,
        dto.lastName,
      );

      user = {
        id: newUser.id,
        email: newUser.email,
        firstName: newUser.firstName,
        lastName: newUser.lastName,
        avatar: undefined,
      };

      // Add new user to the organization
      await this.db.insert(userOrganizations).values({
        userId: newUser.id,
        organizationId: result.invitation.organizationId,
        roleId: result.invitation.roleId,
        joinedAt: new Date(),
      });

      // Generate tokens for the new user
      tokens = await this.login(user);
    }

    // Get organization details
    const [organization] = await this.db
      .select({
        id: organizations.id,
        name: organizations.name,
      })
      .from(organizations)
      .where(eq(organizations.id, result.invitation.organizationId))
      .limit(1);

    return {
      message: 'Invitation accepted successfully',
      user,
      tokens,
      organization,
    };
  }
}

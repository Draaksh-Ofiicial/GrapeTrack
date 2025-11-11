/* eslint-disable prettier/prettier */
import {
  Injectable,
  NotFoundException,
  ConflictException,
  Inject,
  BadRequestException,
} from '@nestjs/common';
import { eq, and, isNull, sql } from 'drizzle-orm';
import { type Database, DATABASE } from '../database/database.module';
import {
  users,
  userInvitations,
  userOrganizations,
  organizations,
  roles,
  type User,
  type UserInvitation,
} from '../database/schema';
import { NotificationsService } from '../notifications/notifications.service';

export interface CreateUserDto {
  email: string;
  password?: string;
  firstName: string;
  lastName: string;
  avatar?: string;
  phone?: string;
  googleId?: string;
  oauthProvider?: string;
}

export interface UpdateUserDto {
  firstName?: string;
  lastName?: string;
  avatar?: string;
  phone?: string;
  isActive?: boolean;
  emailVerified?: boolean;
}

@Injectable()
export class UsersService {
  constructor(
    @Inject(DATABASE) private readonly db: Database,
    private readonly notificationsService: NotificationsService,
  ) {}

  async create(dto: CreateUserDto): Promise<User> {
    // Check if email already exists
    const existing = await this.db
      .select()
      .from(users)
      .where(eq(users.email, dto.email))
      .limit(1);

    if (existing.length > 0) {
      throw new ConflictException('Email already exists');
    }

    const [user] = await this.db
      .insert(users)
      .values({
        email: dto.email,
        password: dto.password,
        firstName: dto.firstName,
        lastName: dto.lastName,
        avatar: dto.avatar,
        phone: dto.phone,
        googleId: dto.googleId,
        oauthProvider: dto.oauthProvider,
      })
      .returning();

    return user;
  }

  async findAll(): Promise<User[]> {
    return this.db.select().from(users);
  }

  async findOne(id: string): Promise<User> {
    const [user] = await this.db
      .select()
      .from(users)
      .where(eq(users.id, id))
      .limit(1);

    if (!user) {
      throw new NotFoundException('User not found');
    }

    return user;
  }

  async findByEmail(email: string): Promise<User | null> {
    const [user] = await this.db
      .select()
      .from(users)
      .where(eq(users.email, email))
      .limit(1);

    return user || null;
  }

  async update(id: string, dto: UpdateUserDto): Promise<User> {
    await this.findOne(id);

    const [updated] = await this.db
      .update(users)
      .set({
        ...dto,
        updatedAt: new Date(),
      })
      .where(eq(users.id, id))
      .returning();

    return updated;
  }

  async remove(id: string): Promise<void> {
    await this.findOne(id);

    // Soft delete
    await this.db
      .update(users)
      .set({
        deletedAt: new Date(),
        isActive: false,
      })
      .where(eq(users.id, id));
  }

  async updateLastLogin(id: string): Promise<void> {
    await this.db
      .update(users)
      .set({
        lastLoginAt: new Date(),
      })
      .where(eq(users.id, id));
  }

  /**
   * Get all organizations a user belongs to with their roles
   */
  async getUserOrganizations(userId: string) {
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

    return userOrgs;
  }

  /**
   * Send an invitation to a user to join an organization
   */
  async inviteUserToOrganization(
    organizationId: string,
    email: string,
    invitedBy: string,
    token: string,
    expiresAt: Date,
    roleId: string,
  ): Promise<UserInvitation> {
    // Check if user already belongs to the organization
    const existingUser = await this.db
      .select()
      .from(users)
      .where(eq(users.email, email))
      .limit(1);

    if (existingUser.length > 0) {
      // Check if they're already a member of the organization
      const [existingMembership] = await this.db
        .select()
        .from(userOrganizations)
        .where(
          and(
            eq(userOrganizations.userId, existingUser[0].id),
            eq(userOrganizations.organizationId, organizationId),
          ),
        )
        .limit(1);

      if (existingMembership) {
        throw new ConflictException(
          'User is already a member of this organization',
        );
      }

      // Check if they have a pending invitation
      const [pendingInvitation] = await this.db
        .select()
        .from(userInvitations)
        .where(
          and(
            eq(userInvitations.organizationId, organizationId),
            eq(userInvitations.email, email),
            isNull(userInvitations.acceptedAt),
            isNull(userInvitations.rejectedAt),
          ),
        )
        .limit(1);

      if (pendingInvitation) {
        throw new ConflictException(
          'User already has a pending invitation to this organization',
        );
      }
    }

    // Create invitation record
    const [invitation] = await this.db
      .insert(userInvitations)
      .values({
        organizationId,
        email,
        invitedBy,
        roleId,
        token,
        expiresAt,
      })
      .returning();

    return invitation;
  }

  /**
   * Get invitation by token
   */
  async getInvitationByToken(token: string): Promise<UserInvitation | null> {
    const [invitation] = await this.db
      .select()
      .from(userInvitations)
      .where(eq(userInvitations.token, token))
      .limit(1);

    return invitation || null;
  }

  /**
   * Accept an invitation and add user to organization
   */
  async acceptInvitation(
    token: string,
  ): Promise<{
    success: boolean;
    message: string;
    invitation: UserInvitation;
  }> {
    const invitation = await this.getInvitationByToken(token);

    if (!invitation) {
      throw new NotFoundException('Invitation not found or already used');
    }

    if (invitation.acceptedAt) {
      throw new BadRequestException('Invitation has already been accepted');
    }

    if (invitation.rejectedAt) {
      throw new BadRequestException('Invitation has been rejected');
    }

    if (new Date() > invitation.expiresAt) {
      throw new BadRequestException('Invitation has expired');
    }

    // Check if user already exists
    const [existingUser] = await this.db
      .select()
      .from(users)
      .where(eq(users.email, invitation.email))
      .limit(1);

    // If user exists, add them to the organization
    if (existingUser) {
      // Check if user is already a member of the organization
      const [existingMembership] = await this.db
        .select()
        .from(userOrganizations)
        .where(
          and(
            eq(userOrganizations.userId, existingUser.id),
            eq(userOrganizations.organizationId, invitation.organizationId),
          ),
        )
        .limit(1);

      if (existingMembership) {
        throw new ConflictException(
          'User is already a member of this organization',
        );
      }

      // Add existing user to organization
      await this.db.insert(userOrganizations).values({
        userId: existingUser.id,
        organizationId: invitation.organizationId,
        roleId: invitation.roleId,
        joinedAt: new Date(),
      });
    }

    // Mark invitation as accepted
    await this.db
      .update(userInvitations)
      .set({ acceptedAt: new Date() })
      .where(eq(userInvitations.token, token));

    return {
      success: true,
      message: 'Invitation accepted successfully',
      invitation,
    };
  }

  /**
   * Reject an invitation
   */
  async rejectInvitation(
    token: string,
    reason?: string,
  ): Promise<{ success: boolean; message: string }> {
    const invitation = await this.getInvitationByToken(token);

    if (!invitation) {
      throw new NotFoundException('Invitation not found');
    }

    if (invitation.acceptedAt || invitation.rejectedAt) {
      throw new BadRequestException('Invitation has already been processed');
    }

    // Mark invitation as rejected
    await this.db
      .update(userInvitations)
      .set({
        rejectedAt: new Date(),
        reason: reason || null,
      })
      .where(eq(userInvitations.token, token));

    return {
      success: true,
      message: 'Invitation rejected',
    };
  }

  /**
   * Get all pending invitations for an organization
   */
  async getPendingInvitations(organizationId: string) {
    const invitations = await this.db
      .select({
        id: userInvitations.id,
        email: userInvitations.email,
        organizationId: userInvitations.organizationId,
        roleName: roles.name,
        invitedAt: userInvitations.createdAt,
        expiresAt: userInvitations.expiresAt,
        invitedBy: userInvitations.invitedBy,
        inviterName: sql`CONCAT(${users.firstName}, ' ', ${users.lastName})`,
      })
      .from(userInvitations)
      .leftJoin(roles, eq(userInvitations.roleId, roles.id))
      .leftJoin(users, eq(userInvitations.invitedBy, users.id))
      .where(
        and(
          eq(userInvitations.organizationId, organizationId),
          isNull(userInvitations.acceptedAt),
          isNull(userInvitations.rejectedAt),
        ),
      );

    return invitations;
  }

  /**
   * Resend an invitation email
   */
  async resendInvitation(invitationId: string): Promise<{ message: string }> {
    const [invitation] = await this.db
      .select({
        id: userInvitations.id,
        email: userInvitations.email,
        organizationId: userInvitations.organizationId,
        invitedBy: userInvitations.invitedBy,
        acceptedAt: userInvitations.acceptedAt,
        rejectedAt: userInvitations.rejectedAt,
        organizationName: organizations.name,
        inviterName: sql`CONCAT(${users.firstName}, ' ', ${users.lastName})`,
      })
      .from(userInvitations)
      .innerJoin(organizations, eq(userInvitations.organizationId, organizations.id))
      .innerJoin(users, eq(userInvitations.invitedBy, users.id))
      .where(eq(userInvitations.id, invitationId))
      .limit(1);

    if (!invitation) {
      throw new NotFoundException('Invitation not found');
    }

    if (invitation.acceptedAt || invitation.rejectedAt) {
      throw new BadRequestException(
        'Cannot resend an invitation that has already been processed',
      );
    }

    // Generate new token and expiry
    const { token, expiresAt } = this.notificationsService.generateInviteToken();

    // Update invitation with new token
    await this.db
      .update(userInvitations)
      .set({
        token,
        expiresAt,
      })
      .where(eq(userInvitations.id, invitationId));

    // Send invitation email
    await this.notificationsService.sendInvitationEmail(
      invitation.email,
      token,
      invitation.organizationName,
      invitation.inviterName as string,
    );

    return {
      message: `Invitation resent to ${invitation.email}`,
    };
  }

  /**
   * Revoke an invitation
   */
  async revokeInvitation(invitationId: string): Promise<{ message: string }> {
    const [invitation] = await this.db
      .select()
      .from(userInvitations)
      .where(eq(userInvitations.id, invitationId))
      .limit(1);

    if (!invitation) {
      throw new NotFoundException('Invitation not found');
    }

    if (invitation.acceptedAt || invitation.rejectedAt) {
      throw new BadRequestException(
        'Cannot revoke an invitation that has already been processed',
      );
    }

    // Mark invitation as rejected
    await this.db
      .update(userInvitations)
      .set({
        rejectedAt: new Date(),
      })
      .where(eq(userInvitations.id, invitationId));

    return {
      message: 'Invitation revoked successfully',
    };
  }
}

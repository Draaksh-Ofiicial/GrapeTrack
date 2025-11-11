import {
  Injectable,
  BadRequestException,
  Inject,
  NotFoundException,
} from '@nestjs/common';
import { eq } from 'drizzle-orm';
import { type Database, DATABASE } from '../database/database.module';
import { organizations, users } from '../database/schema';
import { UsersService } from '../users/users.service';
import { NotificationsService } from '../notifications/notifications.service';

@Injectable()
export class OrganizationInvitesService {
  constructor(
    @Inject(DATABASE) private readonly db: Database,
    private readonly usersService: UsersService,
    private readonly notificationsService: NotificationsService,
  ) {}

  /**
   * Invite a user to join an organization
   */
  async inviteUserToOrganization(
    organizationId: string,
    email: string,
    invitedBy: string,
    roleId: string,
  ): Promise<{ message: string; invitationToken: string }> {
    // Verify organization exists
    const [org] = await this.db
      .select()
      .from(organizations)
      .where(eq(organizations.id, organizationId))
      .limit(1);

    if (!org) {
      throw new NotFoundException('Organization not found');
    }

    // Verify inviter exists and is admin of the organization
    const [inviter] = await this.db
      .select()
      .from(users)
      .where(eq(users.id, invitedBy))
      .limit(1);

    if (!inviter) {
      throw new NotFoundException('Inviting user not found');
    }

    // Check if email is the same as inviter's email
    if (email === inviter.email) {
      throw new BadRequestException('Cannot invite yourself');
    }

    // Generate invitation token
    const { token, expiresAt } =
      this.notificationsService.generateInviteToken();

    // Create invitation in database
    await this.usersService.inviteUserToOrganization(
      organizationId,
      email,
      invitedBy,
      token,
      expiresAt,
      roleId,
    );

    // Send invitation email
    const inviterFullName = `${inviter.firstName} ${inviter.lastName}`;
    await this.notificationsService.sendInvitationEmail(
      email,
      token,
      org.name,
      inviterFullName,
    );

    return {
      message: `Invitation sent to ${email}`,
      invitationToken: token,
    };
  }

  /**
   * Get all pending invitations for an organization
   */
  async getPendingInvitations(organizationId: string) {
    return await this.usersService.getPendingInvitations(organizationId);
  }

  /**
   * Resend an invitation email
   */
  async resendInvitation(invitationId: string) {
    return await this.usersService.resendInvitation(invitationId);
  }

  /**
   * Revoke an invitation
   */
  async revokeInvitation(invitationId: string) {
    return await this.usersService.revokeInvitation(invitationId);
  }
}

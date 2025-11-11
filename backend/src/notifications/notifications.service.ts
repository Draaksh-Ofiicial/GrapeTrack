import { Injectable, BadRequestException, Inject } from '@nestjs/common';
import { MailerService } from '@nestjs-modules/mailer';
import * as crypto from 'crypto';
import { eq, and } from 'drizzle-orm';
import { type Database, DATABASE } from '../database/database.module';
import {
  users,
  notificationPreferences,
  type NewNotificationPreferences,
} from '../database/schema';
import { loadTemplate, renderTemplate } from './template.util';
import { UpdateNotificationPreferencesDto } from './dto/update-notification-preferences.dto';

@Injectable()
export class NotificationsService {
  constructor(
    private readonly mailerService: MailerService,
    @Inject(DATABASE) private readonly db: Database,
  ) {}

  /**
   * Send organization invitation email to a new user
   * Generates a one-time token that expires in 7 days
   */
  async sendInvitationEmail(
    email: string,
    inviteToken: string,
    organizationName: string,
    senderName: string,
  ): Promise<void> {
    const inviteLink = `${process.env.FRONTEND_URL}/auth/join-organization?token=${inviteToken}`;

    try {
      const template = loadTemplate('organization-invite.hbs');
      const htmlContent = renderTemplate(template, {
        senderName,
        organizationName,
        inviteLink,
        inviteLinkCode: inviteLink,
        expiryDays: 7,
      });

      // TODO: Update the "from" address to a no-reply email
      await this.mailerService.sendMail({
        from: process.env.MAIL_FROM || '"GrapeTrack" <noreply@grapetrack.com>',
        to: email,
        subject: `${senderName} invited you to join ${organizationName} on GrapeTrack`,
        html: htmlContent,
      });
    } catch (error) {
      console.error('Failed to send invitation email:', error);
      throw new BadRequestException(
        'Failed to send organization invitation email',
      );
    }
  }

  /**
   * Send welcome email to a new organization member
   */
  async sendWelcomeEmail(
    email: string,
    firstName: string,
    organizationName: string,
  ): Promise<void> {
    const dashboardLink = `${process.env.FRONTEND_URL}/dashboard`;

    try {
      const template = loadTemplate('organization-welcome.hbs');
      const htmlContent = renderTemplate(template, {
        firstName,
        organizationName,
        dashboardLink,
        dashboardLinkCode: dashboardLink,
      });

      // TODO: Update the "from" address to a no-reply email
      await this.mailerService.sendMail({
        from: process.env.MAIL_FROM || '"GrapeTrack" <noreply@grapetrack.com>',
        to: email,
        subject: `Welcome to ${organizationName} on GrapeTrack!`,
        html: htmlContent,
      });
    } catch (error) {
      console.error('Failed to send welcome email:', error);
      throw new BadRequestException('Failed to send welcome email');
    }
  }

  /**
   * Send organization deletion confirmation email
   */
  async sendOrganizationDeletionConfirmation(
    organization: { id: string; name: string; slug: string },
    userId: string,
    token: string,
  ): Promise<void> {
    // Get user email from database
    const [user] = await this.db
      .select({ email: users.email })
      .from(users)
      .where(eq(users.id, userId))
      .limit(1);

    if (!user) {
      throw new BadRequestException('User not found');
    }

    const userEmail = user.email;
    const confirmLink = `${process.env.FRONTEND_URL}/organizations/${organization.slug}/delete/confirm?token=${token}`;

    try {
      const template = loadTemplate('organization-delete-confirm.hbs');
      const htmlContent = renderTemplate(template, {
        organizationName: organization.name,
        confirmLink,
        expiryHours: 24,
      });

      // TODO: Update the "from" address to a no-reply email
      await this.mailerService.sendMail({
        from: process.env.MAIL_FROM || '"GrapeTrack" <noreply@grapetrack.com>',
        to: userEmail,
        subject: `Confirm deletion of ${organization.name} organization`,
        html: htmlContent,
      });
    } catch (error) {
      console.error(
        'Failed to send organization deletion confirmation email:',
        error,
      );
      throw new BadRequestException('Failed to send confirmation email');
    }
  }

  /**
   * Send task assignment email notification
   */
  async sendTaskAssignedEmail(
    assigneeEmail: string,
    assigneeName: string,
    taskTitle: string,
    taskDescription: string,
    assignedByName: string,
    dueDate?: Date,
    taskLink?: string,
  ): Promise<void> {
    const dashboardLink =
      taskLink || `${process.env.FRONTEND_URL}/dashboard/tasks`;

    try {
      const template = loadTemplate('task-assigned.hbs');
      const htmlContent = renderTemplate(template, {
        assigneeName,
        taskTitle,
        taskDescription,
        assignedByName,
        dueDate: dueDate ? new Date(dueDate).toLocaleDateString() : 'Not set',
        dashboardLink,
      });

      await this.mailerService.sendMail({
        from: process.env.MAIL_FROM || '"GrapeTrack" <noreply@grapetrack.com>',
        to: assigneeEmail,
        subject: `New task assigned: ${taskTitle}`,
        html: htmlContent,
      });
    } catch (error) {
      console.error('Failed to send task assigned email:', error);
      throw new BadRequestException('Failed to send task assigned email');
    }
  }

  /**
   * Send task completion email notification
   */
  async sendTaskCompletedEmail(
    creatorEmail: string,
    creatorName: string,
    taskTitle: string,
    completedByName: string,
    taskLink?: string,
  ): Promise<void> {
    const dashboardLink =
      taskLink || `${process.env.FRONTEND_URL}/dashboard/tasks`;

    try {
      const template = loadTemplate('task-completed.hbs');
      const htmlContent = renderTemplate(template, {
        creatorName,
        taskTitle,
        completedByName,
        dashboardLink,
      });

      await this.mailerService.sendMail({
        from: process.env.MAIL_FROM || '"GrapeTrack" <noreply@grapetrack.com>',
        to: creatorEmail,
        subject: `Task completed: ${taskTitle}`,
        html: htmlContent,
      });
    } catch (error) {
      console.error('Failed to send task completed email:', error);
      throw new BadRequestException('Failed to send task completed email');
    }
  }

  /**
   * Send deadline reminder email for upcoming task due dates
   */
  async sendDeadlineReminderEmail(
    recipientEmail: string,
    recipientName: string,
    tasks: Array<{
      title: string;
      dueDate: Date;
      assignedTo: string;
    }>,
  ): Promise<void> {
    const dashboardLink = `${process.env.FRONTEND_URL}/dashboard/tasks`;

    try {
      const template = loadTemplate('deadline-reminder.hbs');
      const htmlContent = renderTemplate(template, {
        recipientName,
        tasks: tasks.map((task) => ({
          ...task,
          dueDate: new Date(task.dueDate).toLocaleDateString(),
        })),
        dashboardLink,
      });

      await this.mailerService.sendMail({
        from: process.env.MAIL_FROM || '"GrapeTrack" <noreply@grapetrack.com>',
        to: recipientEmail,
        subject: 'Reminder: Your upcoming task deadlines',
        html: htmlContent,
      });
    } catch (error) {
      console.error('Failed to send deadline reminder email:', error);
      throw new BadRequestException('Failed to send deadline reminder email');
    }
  }

  /**
   * Generate a one-time invite token for email invitations
   * Token expires in 7 days
   */
  generateInviteToken(): { token: string; expiresAt: Date } {
    const token = crypto.randomBytes(32).toString('hex');
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7); // 7 days expiry

    return { token, expiresAt };
  }

  /**
   * Get notification preferences for a user in an organization
   * Creates default preferences if they don't exist
   */
  async getPreferences(userId: string, organizationId: string) {
    let [prefs] = await this.db
      .select()
      .from(notificationPreferences)
      .where(
        and(
          eq(notificationPreferences.userId, userId),
          eq(notificationPreferences.organizationId, organizationId),
        ),
      )
      .limit(1);

    // Create default preferences if they don't exist
    if (!prefs) {
      const newPrefs: NewNotificationPreferences = {
        userId,
        organizationId,
        taskAssignedEmail: true,
        taskCompletedEmail: true,
        deadlineReminderEmail: true,
      };

      [prefs] = await this.db
        .insert(notificationPreferences)
        .values(newPrefs)
        .returning();
    }

    return prefs;
  }

  /**
   * Update notification preferences for a user in an organization
   */
  async updatePreferences(
    userId: string,
    organizationId: string,
    dto: UpdateNotificationPreferencesDto,
  ) {
    const updateData: Record<string, unknown> = {
      updatedAt: new Date(),
    };

    if (dto.taskAssignedEmail !== undefined) {
      updateData.taskAssignedEmail = dto.taskAssignedEmail;
    }
    if (dto.taskCompletedEmail !== undefined) {
      updateData.taskCompletedEmail = dto.taskCompletedEmail;
    }
    if (dto.deadlineReminderEmail !== undefined) {
      updateData.deadlineReminderEmail = dto.deadlineReminderEmail;
    }

    // First ensure preferences exist
    await this.getPreferences(userId, organizationId);

    const [updated] = await this.db
      .update(notificationPreferences)
      .set(updateData)
      .where(
        and(
          eq(notificationPreferences.userId, userId),
          eq(notificationPreferences.organizationId, organizationId),
        ),
      )
      .returning();

    return updated;
  }
}

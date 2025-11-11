import { Injectable, Inject } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { eq, and, lte, gt, ne } from 'drizzle-orm';
import { type Database, DATABASE } from '../database/database.module';
import { tasks, users } from '../database/schema';
import { NotificationsService } from '../notifications/notifications.service';

@Injectable()
export class SchedulerService {
  constructor(
    @Inject(DATABASE) private readonly db: Database,
    private readonly notificationsService: NotificationsService,
  ) {}

  /**
   * Send deadline reminder emails for tasks due within next 24 hours
   * Runs every day at 9:00 AM
   */
  @Cron(CronExpression.EVERY_DAY_AT_9AM)
  async sendDeadlineReminders(): Promise<void> {
    try {
      const now = new Date();
      const tomorrow = new Date(now);
      tomorrow.setDate(tomorrow.getDate() + 1);

      // Find all tasks due within next 24 hours that are not completed
      const upcomingTasks = await this.db
        .select()
        .from(tasks)
        .where(
          and(
            lte(tasks.dueDate, tomorrow),
            gt(tasks.dueDate, now),
            ne(tasks.status, 'done'),
          ),
        );

      // Group tasks by assignee and organization
      const tasksByUser = new Map<
        string,
        { org: string; tasks: typeof upcomingTasks }
      >();

      for (const task of upcomingTasks) {
        if (task.assignedTo && task.assignedTo.length > 0) {
          for (const userId of task.assignedTo) {
            const key = `${userId}:${task.organizationId}`;
            if (!tasksByUser.has(key)) {
              tasksByUser.set(key, {
                org: task.organizationId,
                tasks: [],
              });
            }
            tasksByUser.get(key)?.tasks.push(task);
          }
        }
      }

      // Send emails to each user with their upcoming tasks
      for (const [key, data] of tasksByUser.entries()) {
        const [userId] = key.split(':');

        try {
          const [user] = await this.db
            .select({ email: users.email, firstName: users.firstName })
            .from(users)
            .where(eq(users.id, userId))
            .limit(1);

          if (user) {
            const taskList = data.tasks.map((task) => ({
              title: task.title,
              dueDate: task.dueDate || new Date(),
              assignedTo: user.firstName,
            }));

            await this.notificationsService.sendDeadlineReminderEmail(
              user.email,
              user.firstName,
              taskList,
            );
          }
        } catch (error) {
          console.error(
            `Failed to send deadline reminder to user ${userId}:`,
            error,
          );
          // Continue with next user even if one fails
        }
      }

      console.log('Deadline reminder emails sent successfully');
    } catch (error) {
      console.error('Failed to send deadline reminders:', error);
    }
  }
}

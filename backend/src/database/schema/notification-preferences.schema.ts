import { pgTable, uuid, boolean, timestamp } from 'drizzle-orm/pg-core';
import { users } from './users.schema';
import { organizations } from './organizations.schema';

export const notificationPreferences = pgTable('notification_preferences', {
  id: uuid().primaryKey().defaultRandom(),
  userId: uuid()
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  organizationId: uuid()
    .notNull()
    .references(() => organizations.id, { onDelete: 'cascade' }),
  taskAssignedEmail: boolean().notNull().default(true),
  taskCompletedEmail: boolean().notNull().default(true),
  deadlineReminderEmail: boolean().notNull().default(true),
  createdAt: timestamp().defaultNow().notNull(),
  updatedAt: timestamp()
    .defaultNow()
    .notNull()
    .$onUpdateFn(() => new Date()),
});

export type NotificationPreferences =
  typeof notificationPreferences.$inferSelect;
export type NewNotificationPreferences =
  typeof notificationPreferences.$inferInsert;

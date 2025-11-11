import {
  pgTable,
  uuid,
  varchar,
  text,
  timestamp,
  jsonb,
} from 'drizzle-orm/pg-core';
import { organizations } from './organizations.schema';
import { users } from './users.schema';
import { tasks } from './tasks.schema';

export const taskActivity = pgTable('task_activity', {
  id: uuid('id').primaryKey().defaultRandom(),

  // Organization scoping (multi-tenancy)
  organizationId: uuid('organization_id')
    .notNull()
    .references(() => organizations.id, { onDelete: 'cascade' }),

  // Task reference
  taskId: uuid('task_id')
    .notNull()
    .references(() => tasks.id, { onDelete: 'cascade' }),

  // User who performed the action
  userId: uuid('user_id')
    .notNull()
    .references(() => users.id, { onDelete: 'restrict' }),

  // Action details
  action: varchar('action', { length: 50 }).notNull(), // 'created', 'updated', 'assigned', 'status_changed', 'completed', 'deleted'

  // Change tracking
  field: varchar('field', { length: 50 }), // 'status', 'priority', 'assignedTo', 'title', 'description', etc.
  oldValue: text('old_value'),
  newValue: text('new_value'),

  // Additional context
  metadata: jsonb('metadata'), // Additional context like previous assignee, deadline changes, etc.

  // Timestamp
  createdAt: timestamp('created_at').notNull().defaultNow(),
});

export type TaskActivity = typeof taskActivity.$inferSelect;
export type NewTaskActivity = typeof taskActivity.$inferInsert;

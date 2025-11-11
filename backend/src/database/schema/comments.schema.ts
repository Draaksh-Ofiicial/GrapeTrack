import { pgTable, uuid, text, timestamp } from 'drizzle-orm/pg-core';
import { organizations } from './organizations.schema';
import { users } from './users.schema';
import { tasks } from './tasks.schema';

export const comments = pgTable('comments', {
  id: uuid('id').primaryKey().defaultRandom(),

  // Organization scoping (multi-tenancy)
  organizationId: uuid('organization_id')
    .notNull()
    .references(() => organizations.id, { onDelete: 'cascade' }),

  // Task reference
  taskId: uuid('task_id')
    .notNull()
    .references(() => tasks.id, { onDelete: 'cascade' }),

  // User who created the comment
  userId: uuid('user_id')
    .notNull()
    .references(() => users.id, { onDelete: 'restrict' }),

  // Comment content
  content: text('content').notNull(),

  // Timestamps
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
});

export type Comment = typeof comments.$inferSelect;
export type NewComment = typeof comments.$inferInsert;

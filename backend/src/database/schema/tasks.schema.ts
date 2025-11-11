import {
  pgTable,
  uuid,
  varchar,
  text,
  timestamp,
  integer,
  jsonb,
} from 'drizzle-orm/pg-core';
import { organizations } from './organizations.schema';
import { users } from './users.schema';

export const tasks = pgTable('tasks', {
  id: uuid('id').primaryKey().defaultRandom(),

  // Organization scoping (multi-tenancy)
  organizationId: uuid('organization_id')
    .notNull()
    .references(() => organizations.id, { onDelete: 'cascade' }),

  // Task details
  title: varchar('title', { length: 255 }).notNull(),
  description: text('description'),

  // Status and priority
  status: varchar('status', { length: 20 }).notNull().default('todo'), // 'todo', 'in_progress', 'done', 'cancelled'
  priority: varchar('priority', { length: 20 }).notNull().default('medium'), // 'low', 'medium', 'high', 'urgent'

  // Assignment
  assignedTo: jsonb('assigned_to').$type<string[]>().default([]),
  assignedBy: uuid('assigned_by').references(() => users.id, {
    onDelete: 'set null',
  }),

  // Ownership
  createdBy: uuid('created_by')
    .notNull()
    .references(() => users.id, { onDelete: 'restrict' }),

  // Dates
  dueDate: timestamp('due_date'),
  completedAt: timestamp('completed_at'),

  // Completion notes (rich text)
  completionNotes: text('completion_notes'),

  // Metadata
  tags: text('tags'), // JSON array of tag strings
  estimatedHours: integer('estimated_hours'),

  // Timestamps
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
});

export type Task = typeof tasks.$inferSelect;
export type NewTask = typeof tasks.$inferInsert;

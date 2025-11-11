import {
  pgTable,
  uuid,
  varchar,
  text,
  timestamp,
  boolean,
} from 'drizzle-orm/pg-core';

export const permissions = pgTable('permissions', {
  id: uuid('id').primaryKey().defaultRandom(),

  // Permission details
  name: varchar('name', { length: 100 }).notNull(), // e.g., 'Create Tasks'
  slug: varchar('slug', { length: 100 }).notNull().unique(), // e.g., 'tasks.create'
  description: text('description'),
  category: varchar('category', { length: 50 }).notNull(), // e.g., 'tasks', 'users', 'organizations'

  // System permissions can't be deleted
  isSystemPermission: boolean('is_system_permission').notNull().default(false),

  // Timestamps
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
});

export type Permission = typeof permissions.$inferSelect;
export type NewPermission = typeof permissions.$inferInsert;

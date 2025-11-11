import {
  pgTable,
  uuid,
  varchar,
  text,
  timestamp,
  boolean,
} from 'drizzle-orm/pg-core';
import { organizations } from './organizations.schema';

export const roles = pgTable('roles', {
  id: uuid('id').primaryKey().defaultRandom(),
  organizationId: uuid('organization_id')
    .notNull()
    .references(() => organizations.id, { onDelete: 'cascade' }),

  // Role details
  name: varchar('name', { length: 100 }).notNull(),
  slug: varchar('slug', { length: 100 }).notNull(), // e.g., 'admin', 'team-lead', 'designer'
  description: text('description'),
  color: varchar('color', { length: 20 }), // Hex color for UI

  // Hierarchy and settings
  level: varchar('level', { length: 20 }).notNull(), // 'high', 'medium', 'low' for hierarchy
  isSystemRole: boolean('is_system_role').notNull().default(false), // Can't be deleted if true
  isActive: boolean('is_active').notNull().default(true),

  // Timestamps
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
});

export type Role = typeof roles.$inferSelect;
export type NewRole = typeof roles.$inferInsert;

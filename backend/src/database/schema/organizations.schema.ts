import {
  pgTable,
  uuid,
  varchar,
  text,
  timestamp,
  boolean,
} from 'drizzle-orm/pg-core';
import { users } from './users.schema';

export const organizations = pgTable('organizations', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: varchar('name', { length: 255 }).notNull(),
  slug: varchar('slug', { length: 255 }).notNull().unique(),
  description: text('description'),
  logo: varchar('logo', { length: 500 }),
  website: varchar('website', { length: 500 }),

  // Ownership
  createdBy: uuid('created_by')
    .notNull()
    .references(() => users.id, { onDelete: 'restrict' }),

  // Subscription & billing
  plan: varchar('plan', { length: 50 }).notNull().default('free'), // free, professional, enterprise
  maxUsers: varchar('max_users', { length: 20 }).default('5'), // '5', '50', 'unlimited'

  // Settings
  settings: text('settings'), // JSON stringified settings

  // Status
  isActive: boolean('is_active').notNull().default(true),

  // Timestamps
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
  deletedAt: timestamp('deleted_at'), // Soft delete support
});

export type Organization = typeof organizations.$inferSelect;
export type NewOrganization = typeof organizations.$inferInsert;

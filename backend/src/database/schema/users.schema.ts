import {
  pgTable,
  uuid,
  varchar,
  timestamp,
  boolean,
} from 'drizzle-orm/pg-core';

export const users = pgTable('users', {
  id: uuid('id').primaryKey().defaultRandom(),
  email: varchar('email', { length: 255 }).notNull().unique(),
  password: varchar('password', { length: 255 }), // Nullable for OAuth users
  firstName: varchar('first_name', { length: 100 }).notNull(),
  lastName: varchar('last_name', { length: 100 }).notNull(),
  avatar: varchar('avatar', { length: 500 }),
  phone: varchar('phone', { length: 20 }),

  // OAuth fields
  googleId: varchar('google_id', { length: 255 }).unique(),
  oauthProvider: varchar('oauth_provider', { length: 50 }), // 'google', 'github', etc.

  // Account status
  isActive: boolean('is_active').notNull().default(true),
  emailVerified: boolean('email_verified').notNull().default(false),
  emailVerifiedAt: timestamp('email_verified_at'),

  // Security
  lastLoginAt: timestamp('last_login_at'),
  passwordChangedAt: timestamp('password_changed_at'),

  // Timestamps
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
  deletedAt: timestamp('deleted_at'), // Soft delete support
});

export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;

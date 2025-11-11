import { pgTable, uuid, varchar, timestamp } from 'drizzle-orm/pg-core';
import { users } from './users.schema';

export const passwordResetTokens = pgTable('password_reset_tokens', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  token: varchar('token', { length: 255 }).notNull().unique(),
  expiresAt: timestamp('expires_at').notNull(),
  usedAt: timestamp('used_at'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export type PasswordResetToken = typeof passwordResetTokens.$inferSelect;
export type InsertPasswordResetToken = typeof passwordResetTokens.$inferInsert;

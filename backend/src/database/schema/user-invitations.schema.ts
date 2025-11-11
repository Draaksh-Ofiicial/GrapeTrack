import { pgTable, uuid, varchar, timestamp, text } from 'drizzle-orm/pg-core';
import { organizations } from './organizations.schema';
import { users } from './users.schema';
import { roles } from './roles.schema';

export const userInvitations = pgTable('user_invitations', {
  id: uuid('id').primaryKey().defaultRandom(),
  organizationId: uuid('organization_id')
    .notNull()
    .references(() => organizations.id, { onDelete: 'cascade' }),
  invitedBy: uuid('invited_by')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  roleId: uuid('role_id')
    .notNull()
    .references(() => roles.id, { onDelete: 'cascade' }),
  email: varchar('email', { length: 255 }).notNull(),
  token: varchar('token', { length: 255 }).notNull().unique(),
  expiresAt: timestamp('expires_at').notNull(),
  acceptedAt: timestamp('accepted_at'),
  rejectedAt: timestamp('rejected_at'),
  reason: text('reason'), // For rejection reason
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export type UserInvitation = typeof userInvitations.$inferSelect;
export type InsertUserInvitation = typeof userInvitations.$inferInsert;

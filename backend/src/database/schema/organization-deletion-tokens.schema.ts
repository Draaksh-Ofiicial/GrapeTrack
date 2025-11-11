import { pgTable, uuid, varchar, timestamp } from 'drizzle-orm/pg-core';
import { organizations } from './organizations.schema';
import { users } from './users.schema';

export const organizationDeletionTokens = pgTable(
  'organization_deletion_tokens',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    organizationId: uuid('organization_id')
      .notNull()
      .references(() => organizations.id, { onDelete: 'cascade' }),
    userId: uuid('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    token: varchar('token', { length: 255 }).notNull().unique(),
    expiresAt: timestamp('expires_at').notNull(),
    usedAt: timestamp('used_at'),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
  },
);

export type OrganizationDeletionToken =
  typeof organizationDeletionTokens.$inferSelect;
export type InsertOrganizationDeletionToken =
  typeof organizationDeletionTokens.$inferInsert;

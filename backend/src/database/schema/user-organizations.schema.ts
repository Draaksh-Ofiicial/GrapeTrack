import {
  pgTable,
  uuid,
  varchar,
  timestamp,
  primaryKey,
} from 'drizzle-orm/pg-core';
import { users } from './users.schema';
import { organizations } from './organizations.schema';
import { roles } from './roles.schema';

export const userOrganizations = pgTable(
  'user_organizations',
  {
    userId: uuid('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    organizationId: uuid('organization_id')
      .notNull()
      .references(() => organizations.id, { onDelete: 'cascade' }),

    // Role in this organization (dynamic reference to roles table)
    roleId: uuid('role_id')
      .notNull()
      .references(() => roles.id, { onDelete: 'restrict' }), // Can't delete role if users have it

    // Membership status
    status: varchar('status', { length: 20 }).notNull().default('active'), // 'active', 'suspended'

    // When the user joined this organization
    joinedAt: timestamp('joined_at').defaultNow(),

    // Timestamps
    createdAt: timestamp('created_at').notNull().defaultNow(),
    updatedAt: timestamp('updated_at').notNull().defaultNow(),
  },
  (table) => ({
    pk: primaryKey({ columns: [table.userId, table.organizationId] }),
  }),
);

export type UserOrganization = typeof userOrganizations.$inferSelect;
export type NewUserOrganization = typeof userOrganizations.$inferInsert;

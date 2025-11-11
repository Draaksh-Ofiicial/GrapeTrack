import { pgTable, uuid, timestamp, primaryKey } from 'drizzle-orm/pg-core';
import { roles } from './roles.schema';
import { permissions } from './permissions.schema';

export const rolePermissions = pgTable(
  'role_permissions',
  {
    roleId: uuid('role_id')
      .notNull()
      .references(() => roles.id, { onDelete: 'cascade' }),
    permissionId: uuid('permission_id')
      .notNull()
      .references(() => permissions.id, { onDelete: 'cascade' }),

    // Timestamps
    assignedAt: timestamp('assigned_at').notNull().defaultNow(),
  },
  (table) => ({
    pk: primaryKey({ columns: [table.roleId, table.permissionId] }),
  }),
);

export type RolePermission = typeof rolePermissions.$inferSelect;
export type NewRolePermission = typeof rolePermissions.$inferInsert;

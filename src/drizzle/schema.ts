import {
    pgTable,
    text,
    varchar,
    timestamp,
    boolean,
    uuid,
    jsonb,
    PgColumn,
} from "drizzle-orm/pg-core";
import type { InferInsertModel, InferSelectModel } from 'drizzle-orm';

// Roles table: canonical list of allowed role names. `name` is the PK so users
// can reference a textual role without joining numeric ids.
export const roles = pgTable("roles", {
    name: varchar("name", { length: 100 }).primaryKey(),
    description: text("description"),
    created_at: timestamp("created_at").notNull().defaultNow(),
});

// Users table: core auth data and reference to role name for single-role-per-user.
export const users = pgTable("users", {
    id: uuid("id").primaryKey(),
    name: varchar("name", { length: 255 }).notNull(),
    email: varchar("email", { length: 255 }).notNull().unique(),
    phone: varchar("phone", { length: 20 }),
    address: varchar("address", { length: 255 }),
    avatar: text("avatar"),
    password: text("password").notNull(),
    usertype: varchar("usertype", { length: 100 }).notNull().references((): PgColumn => roles.name, { onDelete: "restrict" }),
    is_prime: boolean("is_prime").default(false).notNull(),
    email_notification: boolean("email_notification").default(true).notNull(),
    created_at: timestamp("created_at").notNull().defaultNow(),
    created_by: uuid("created_by").references((): PgColumn => users.id, { onDelete: "set null" }),
    updated_at: timestamp("updated_at").notNull().defaultNow(),
    updated_by: uuid("updated_by").references((): PgColumn => users.id, { onDelete: "set null" }),
    is_deleted: boolean("is_deleted").default(false).notNull(),
    is_verified: boolean("is_verified").default(false).notNull(),
    verification_token: text("verification_token"),
    reset_token: text("reset_token"),
    reset_token_expiry: timestamp("reset_token_expiry"),
});

// Invitations: admin invite flow, store intended role name to map to users.usertype
export const invitations = pgTable("invitations", {
    id: uuid("id").primaryKey(),
    email: varchar("email", { length: 255 }).notNull(),
    token: varchar("token", { length: 255 }).notNull().unique(),
    invited_by: uuid("invited_by").references((): PgColumn => users.id, { onDelete: "set null" }),
    role: varchar("role", { length: 100 }),
    expires_at: timestamp("expires_at"),
    accepted: boolean("accepted").default(false).notNull(),
    accepted_at: timestamp("accepted_at"),
    created_at: timestamp("created_at").notNull().defaultNow(),
});

// OAuth external accounts (compatible with NextAuth style)
export const oauth_accounts = pgTable("oauth_accounts", {
    id: uuid("id").primaryKey(),
    user_id: uuid("user_id").notNull().references((): PgColumn => users.id, { onDelete: "cascade" }),
    provider: varchar("provider", { length: 100 }).notNull(),
    provider_account_id: varchar("provider_account_id", { length: 255 }).notNull(),
    access_token: text("access_token"),
    refresh_token: text("refresh_token"),
    expires_at: timestamp("expires_at"),
    token_type: varchar("token_type", { length: 50 }),
    scope: text("scope"),
    id_token: text("id_token"),
    created_at: timestamp("created_at").notNull().defaultNow(),
});

// Sessions table for server-side session tracking and invalidation
// Sessions table was removed: session handling is intended to be JWT-based by default.

// Profiles: public profile info separated from sensitive auth fields
export const user_profiles = pgTable("user_profiles", {
    user_id: uuid("user_id").primaryKey().references((): PgColumn => users.id, { onDelete: "cascade" }),
    display_name: varchar("display_name", { length: 255 }),
    bio: text("bio"),
    locale: varchar("locale", { length: 20 }),
    timezone: varchar("timezone", { length: 64 }),
    social: jsonb("social"),
    metadata: jsonb("metadata"),
    created_at: timestamp("created_at").notNull().defaultNow(),
    updated_at: timestamp("updated_at").notNull().defaultNow(),
});

// Settings/preferences per user
export const user_settings = pgTable("user_settings", {
    user_id: uuid("user_id").primaryKey().references((): PgColumn => users.id, { onDelete: "cascade" }),
    preferences: jsonb("preferences").$type<Record<string, unknown> | null>(),
    email_notifications: boolean("email_notifications").default(true).notNull(),
    push_notifications: boolean("push_notifications").default(false).notNull(),
    created_at: timestamp("created_at").notNull().defaultNow(),
    updated_at: timestamp("updated_at").notNull().defaultNow(),
});

// Activity log / audit trail for user actions
export const activity_logs = pgTable("activity_logs", {
    id: uuid("id").primaryKey(),
    user_id: uuid("user_id").references((): PgColumn => users.id, { onDelete: "set null" }),
    action: varchar("action", { length: 200 }).notNull(),
    resource_type: varchar("resource_type", { length: 100 }),
    resource_id: uuid("resource_id"),
    details: jsonb("details"),
    ip_address: varchar("ip_address", { length: 45 }),
    user_agent: text("user_agent"),
    created_at: timestamp("created_at").notNull().defaultNow(),
});

type rolesInterface = InferSelectModel<typeof roles>;
type rolesInterfaceInsert = InferInsertModel<typeof roles>;

type usersInterface = InferSelectModel<typeof users>;
type usersInterfaceInsert = InferInsertModel<typeof users>;

type invitationsInterface = InferSelectModel<typeof invitations>;
type invitationsInterfaceInsert = InferInsertModel<typeof invitations>;

type activityLogsInterface = InferSelectModel<typeof activity_logs>;
type activityLogsInterfaceInsert = InferInsertModel<typeof activity_logs>;

// sessions table removed; no sessionsInterface types

type userProfilesInterface = InferSelectModel<typeof user_profiles>;
type userProfilesInterfaceInsert = InferInsertModel<typeof user_profiles>;

type userSettingsInterface = InferSelectModel<typeof user_settings>;
type userSettingsInterfaceInsert = InferInsertModel<typeof user_settings>;

type oauthAccountsInterface = InferSelectModel<typeof oauth_accounts>;
type oauthAccountsInterfaceInsert = InferInsertModel<typeof oauth_accounts>;

export type { rolesInterface, usersInterface, invitationsInterface, activityLogsInterface, userProfilesInterface, userSettingsInterface, oauthAccountsInterface, rolesInterfaceInsert, usersInterfaceInsert, invitationsInterfaceInsert, activityLogsInterfaceInsert, userProfilesInterfaceInsert, userSettingsInterfaceInsert, oauthAccountsInterfaceInsert };
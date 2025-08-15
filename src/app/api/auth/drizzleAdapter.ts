import type {
    Adapter,
    AdapterUser,
    VerificationToken,
    AdapterSession,
} from 'next-auth/adapters';
import db from '@/config/database';
import { users, oauth_accounts } from '@/drizzle/schema';
import type { usersInterfaceInsert, oauthAccountsInterfaceInsert } from '@/drizzle/schema';
import { eq, and } from 'drizzle-orm';
import { randomUUID } from 'crypto';

// Helper mappers: convert DB rows to NextAuth adapter shapes
// ...existing code...

// Minimal Drizzle adapter implementing required methods for sessions and oauth accounts.
const drizzleAdapter = (): Adapter => {
    return {
        async createUser(user: AdapterUser): Promise<AdapterUser> {
            const id = (user.id as string) ?? randomUUID();
            const now = new Date();
            const row: usersInterfaceInsert = {
                id,
                name: (user.name as string) ?? '',
                email: (user.email as string) ?? '',
                password: '',
                usertype: 'user',
                created_at: now,
                updated_at: now,
            } as unknown as usersInterfaceInsert;

            await db.insert(users).values([row] as usersInterfaceInsert[]).execute();
            const created = await db.select().from(users).where(eq(users.id, id)).execute();
            return created[0] as unknown as AdapterUser;
        },

        async getUser(id: string): Promise<AdapterUser | null> {
            const rows = await db.select().from(users).where(eq(users.id, id)).execute();
            return (rows && rows.length > 0) ? (rows[0] as unknown as AdapterUser) : null;
        },

        async getUserByEmail(email: string): Promise<AdapterUser | null> {
            const rows = await db.select().from(users).where(eq(users.email, email)).execute();
            return (rows && rows.length > 0) ? (rows[0] as unknown as AdapterUser) : null;
        },

        async getUserByAccount({ provider, providerAccountId }: { provider: string; providerAccountId: string; }): Promise<AdapterUser | null> {
            const rows = await db.select().from(oauth_accounts).where(eq(oauth_accounts.provider, provider)).execute();
            const match = rows.find(r => String((r as Record<string, unknown>)['provider_account_id']) === String(providerAccountId));
            if (!match) return null;
            const userRows = await db.select().from(users).where(eq(users.id, match.user_id)).execute();
            return (userRows && userRows.length > 0) ? (userRows[0] as unknown as AdapterUser) : null;
        },

        async updateUser(user: Partial<AdapterUser> & { id: string }): Promise<AdapterUser> {
            const now = new Date();
            const data = { ...(user as Record<string, unknown>), updated_at: now } as unknown as Partial<usersInterfaceInsert>;
            await db.update(users).set(data).where(eq(users.id, user.id)).execute();
            const rows = await db.select().from(users).where(eq(users.id, user.id)).execute();
            return rows[0] as unknown as AdapterUser;
        },

        async deleteUser(userId: string): Promise<void> {
            await db.delete(users).where(eq(users.id, userId)).execute();
        },

        // OAuth account linking
        async linkAccount(account: {
            userId: string;
            provider: string;
            providerAccountId: string;
            access_token?: string | null;
            refresh_token?: string | null;
            id_token?: string | null;
            token_type?: string | null;
            scope?: string | null;
        }): Promise<void> {
            const row: oauthAccountsInterfaceInsert = {
                id: randomUUID(),
                user_id: account.userId,
                provider: account.provider,
                provider_account_id: account.providerAccountId,
                access_token: account.access_token ?? null,
                refresh_token: account.refresh_token ?? null,
                id_token: account.id_token ?? null,
                token_type: account.token_type ?? null,
                scope: account.scope ?? null,
                created_at: new Date(),
            } as unknown as oauthAccountsInterfaceInsert;
            await db.insert(oauth_accounts).values([row] as oauthAccountsInterfaceInsert[]).execute();
        },

        async unlinkAccount({ provider, providerAccountId }: { provider: string; providerAccountId: string; }): Promise<void> {
            await db.delete(oauth_accounts).where(and(eq(oauth_accounts.provider, provider), eq(oauth_accounts.provider_account_id, providerAccountId))).execute();
        },

        // Sessions
            // Sessions table removed; adapter will not persist sessions to DB.
            // When using JWT strategy, NextAuth will not call these DB session methods.
            async createSession({ sessionToken, userId, expires }: { sessionToken: string; userId: string; expires: Date | null | undefined; }): Promise<AdapterSession> {
                return {
                    sessionToken,
                    userId,
                    expires: expires ?? null,
                } as AdapterSession;
            },

            async getSessionAndUser(sessionToken: string): Promise<{ session: AdapterSession; user: AdapterUser } | null> {
                // No DB-backed sessions; return null so NextAuth falls back to JWT/session callbacks.
                void sessionToken;
                return null;
            },

            async updateSession(session: Partial<AdapterSession> & Pick<AdapterSession, 'sessionToken'>): Promise<AdapterSession | null> {
                // No DB-backed sessions to update.
                return {
                    sessionToken: session.sessionToken,
                    userId: session.userId ?? '',
                    expires: session.expires ?? null,
                } as AdapterSession;
            },

            async deleteSession(sessionToken: string): Promise<void> {
                // No DB-backed sessions to delete. noop.
                void sessionToken;
            },

        // Verification tokens (optional, used for email sign-in); implement minimal storage in sessions table if needed
        async createVerificationToken(token: VerificationToken): Promise<VerificationToken | null> {
            // TODO: implemented: return null so NextAuth uses default
            void token;
            return null;
        },

        async useVerificationToken(identifier_token: { identifier: string; token: string; }): Promise<VerificationToken | null> {
            void identifier_token;
            return null;
        },
    };
};

export default drizzleAdapter;

import { AuthOptions } from 'next-auth';
import GitHubProvider from 'next-auth/providers/github';
import GoogleProvider from 'next-auth/providers/google';
import CredentialsProvider from "next-auth/providers/credentials";
import db from '@/config/database';
import drizzleAdapter from '../drizzleAdapter';
import { users, oauth_accounts, usersInterface, activity_logs, user_profiles, user_settings } from '@/drizzle/schema';
import { randomUUID } from 'crypto';
import { eq } from 'drizzle-orm';
import bcrypt from 'bcryptjs';


declare module 'next-auth' {
    interface Session {
        user: usersInterface;
    }
}

// Remove sensitive fields from user objects before placing them into JWT/session
function stripSensitive<T extends Record<string, unknown>>(u: T): Omit<T, 'password' | 'reset_token' | 'reset_token_expiry' | 'verification_token'> {
    const copy = { ...(u as Record<string, unknown>) } as Record<string, unknown>;
    delete copy['password'];
    delete copy['reset_token'];
    delete copy['reset_token_expiry'];
    delete copy['verification_token'];
    return copy as Omit<T, 'password' | 'reset_token' | 'reset_token_expiry' | 'verification_token'>;
}

const authOptions: AuthOptions = {
    adapter: drizzleAdapter(),
    pages: {
        signIn: '/login',
        error: '/login',
    },
    providers: [
        CredentialsProvider({
            name: "Credentials",
            credentials: {
                email: { label: "Email", type: "email" },
                password: { label: "Password", type: "password" },
            },
            async authorize(credentials) {
                const { email, password } = credentials as { email: string; password: string };

                // Find user in NeonDB (Postgres)
                const userResult = await db.select().from(users).where(eq(users.email, email)).execute();
                if (userResult.length === 0) {
                    throw new Error('No account found for this email');
                }

                const dbUser = userResult[0] as unknown as usersInterface & { password: string };
                const isPasswordValid = await bcrypt.compare(password, dbUser.password);
                if (!isPasswordValid) {
                    throw new Error('Invalid email or password');
                }

                // Strip sensitive fields before returning user for session/jwt
                return stripSensitive(dbUser) as usersInterface;
            },
        }),
        GitHubProvider({
            clientId: process.env.GITHUB_CLIENT_ID!,
            clientSecret: process.env.GITHUB_CLIENT_SECRET!,
        }),
        GoogleProvider({
            clientId: process.env.GOOGLE_CLIENT_ID!,
            clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
        }),
    ],
    session: {
        strategy: 'jwt',
        maxAge: 30 * 24 * 60 * 60, // 30 days
    },
    secret: process.env.NEXTAUTH_SECRET,
    callbacks: {
        async signIn({ user, account, profile }) {
            // Only allow OAuth sign-ins if the user already exists in our DB (registered user).
            // For credentials provider, allow as usual.
            if (account && account.provider !== 'credentials') {
                const email = (user as unknown as Record<string, unknown>)?.email || (profile as unknown as Record<string, unknown>)?.email;
                if (!email) return false;
                const found = await db.select().from(users).where(eq(users.email, String(email))).execute();
                // Allow only if a matching DB user exists
                if (found.length === 0) return false;

                // Link oauth_accounts if not already linked
                try {
                    const byProvider = await db.select().from(oauth_accounts).where(eq(oauth_accounts.provider, account.provider)).execute();
                    const existing = byProvider.find((r: { provider_account_id: string }) => String(r.provider_account_id) === String(account.providerAccountId));
                    if (!existing) {
                        await db.insert(oauth_accounts).values({
                            id: randomUUID(),
                            user_id: found[0].id,
                            provider: account.provider,
                            provider_account_id: account.providerAccountId,
                            access_token: account.access_token ?? null,
                            refresh_token: account.refresh_token ?? null,
                            id_token: typeof (account as { id_token?: string }).id_token === 'string' ? (account as { id_token?: string }).id_token : null,
                            token_type: account.token_type ?? null,
                            scope: account.scope ?? null,
                            created_at: new Date(),
                        }).execute();
                    }
                } catch {
                    // ignore linking failures (shouldn't block sign-in)
                }

                return true;
            }
            return true;
        },
        async redirect({ url, baseUrl }) {
            return url.startsWith(baseUrl) ? url : baseUrl;
        },
        async session({ session, token }) {
            // Defensive session handling: only treat token.user.id as our DB UUID if it looks like one.
            const tokenUser = token.user as unknown as Record<string, unknown> | undefined;
            const id = tokenUser?.id;
            const looksLikeUUID = typeof id === 'string' && id.length === 36 && id.includes('-');

            if (looksLikeUUID) {
                // Load full merged profile data for DB users
                try {
                    const userId = id as string;
                    
                    // Get user data
                    const [u] = await db.select().from(users).where(eq(users.id, userId)).execute();
                    if (!u) return session;

                    // Get profile and settings data
                    const [profile] = await db.select().from(user_profiles).where(eq(user_profiles.user_id, userId)).execute();
                    const [settings] = await db.select().from(user_settings).where(eq(user_settings.user_id, userId)).execute();

                    // Create merged session user with all frequently needed data
                    const mergedUser = {
                        id: u.id,
                        name: u.name,
                        email: u.email,
                        avatar: u.avatar ?? null,
                        phone: u.phone ?? null,
                        address: u.address ?? null,
                        usertype: u.usertype ?? null,
                        is_prime: u.is_prime ?? false,
                        email_notification: u.email_notification ?? true,
                        is_verified: u.is_verified ?? false,
                        created_at: u.created_at ?? null,
                        updated_at: u.updated_at ?? null,
                        // Profile data
                        display_name: profile?.display_name ?? null,
                        bio: profile?.bio ?? null,
                        locale: profile?.locale ?? null,
                        timezone: profile?.timezone ?? null,
                        social: profile?.social ?? null,
                        metadata: profile?.metadata ?? null,
                        // Settings data
                        preferences: settings?.preferences ?? null,
                        push_notifications: settings?.push_notifications ?? false,
                    };

                    session.user = mergedUser as unknown as usersInterface;
                    
                } catch (error) {
                    console.error('Error loading merged profile in session:', error);
                    // Fallback to basic user data from token
                    session.user = stripSensitive(tokenUser as Record<string, unknown>) as unknown as usersInterface;
                }

                return session;
            }

            // If the token contains a provider id (not a DB UUID), don't propagate that id into session.user
            // to avoid downstream DB lookups using provider ids.
            if (tokenUser) {
                const copy = { ...tokenUser } as Record<string, unknown>;
                if (copy.id) delete copy.id;
                session.user = copy as unknown as usersInterface;
            }

            return session;
        },
        async jwt({ token, user }) {
            if (user) {
                const maybeUser = user as unknown as Record<string, unknown>;
                const email = (maybeUser.email as string) || '';
                if (email) {
                    const found = await db.select().from(users).where(eq(users.email, email)).execute();
                    if (found.length > 0) {
                        token.user = stripSensitive(found[0] as unknown as Record<string, unknown>) as usersInterface;
                        return token;
                    }
                }

                // fallback to provider profile (non-DB)
                token.user = stripSensitive(maybeUser) as usersInterface;
            }
            return token;
        },
    },
    events: {
        async signIn({ user, account, isNewUser }) {
            // Record sign-in activity. We store provider and whether the user was new in details.
            try {
                const userId = (user as unknown as Record<string, unknown>)?.id as string | undefined;
                const payload: Record<string, unknown> = {
                    id: randomUUID(),
                    user_id: userId ?? null,
                    action: 'sign_in',
                    resource_type: 'auth',
                    details: JSON.stringify({ provider: account?.provider ?? null, isNewUser: Boolean(isNewUser) }),
                    ip_address: null,
                    user_agent: null,
                    created_at: new Date(),
                };
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                await (db as any).insert(activity_logs).values(payload as any).execute();
            } catch {
                // swallow logging errors to avoid blocking sign-in
            }
        },

        async session({ session, token }) {
            // Defensive: only try to load DB user when session.user.id looks like our UUID PK.
            const id = session?.user?.id;
            if (!id || typeof id !== 'string') return;

            // crude UUID check: length 36 and contains hyphens
            const looksLikeUUID = id.length === 36 && id.includes('-');
            if (!looksLikeUUID) return;

            try {
                const user = await db.select().from(users).where(eq(users.id, session.user.id)).execute();
                if (user.length === 0) return;
                const usersInterface = user[0] as Record<string, unknown>;
                token.user = { ...(token.user || {}), ...stripSensitive(usersInterface) } as usersInterface;
                session.user = token.user as usersInterface;
            } catch {
                // ignore DB lookup errors in events.session to avoid crashing the session flow
                return;
            }
        }
    }
};

export { authOptions };
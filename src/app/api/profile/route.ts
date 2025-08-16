import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/api/auth/[...nextauth]/authOptions';
import type { AuthOptions } from 'next-auth';
import db from '@/config/database';
import { users, user_profiles, user_settings } from '@/drizzle/schema';
import type { userProfilesInterfaceInsert, userSettingsInterfaceInsert } from '@/drizzle/schema';
import { eq } from 'drizzle-orm';

async function loadMergedProfile(id: string) {
  const [u] = await db.select().from(users).where(eq(users.id, id)).execute();
  const [profile] = await db.select().from(user_profiles).where(eq(user_profiles.user_id, id)).execute();
  const [settings] = await db.select().from(user_settings).where(eq(user_settings.user_id, id)).execute();

  if (!u) return null;

  return {
    id: u.id,
    name: u.name,
    email: u.email,
    avatar: u.avatar ?? null,
    phone: u.phone ?? null,
    address: u.address ?? null,
    usertype: u.usertype ?? null,
    is_prime: u.is_prime ?? false,
    email_notification: u.email_notification ?? true,
    created_at: u.created_at ?? null,
    profile: profile ?? null,
    settings: settings ?? null,
  };
}

export async function GET() {
  try {
    const session = await getServerSession(authOptions as unknown as AuthOptions);
    const sess = session as unknown as Record<string, unknown> | null;
    const sessUser = sess?.['user'] as Record<string, unknown> | undefined;
    if (!sessUser || !sessUser.id) {
      return NextResponse.json({ success: false, error: 'Not authenticated' }, { status: 401 });
    }

    const id = String(sessUser.id);
    const merged = await loadMergedProfile(id);
    if (!merged) return NextResponse.json({ success: false, error: 'User not found' }, { status: 404 });
    return NextResponse.json({ success: true, data: merged });
  } catch (error) {
    console.error('profile GET error', error);
    return NextResponse.json({ success: false, error: (error as Error).message || String(error) }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    const session = await getServerSession(authOptions as unknown as AuthOptions);
    const sess = session as unknown as Record<string, unknown> | null;
    const sessUser = sess?.['user'] as Record<string, unknown> | undefined;
    if (!sessUser || !sessUser.id) {
      return NextResponse.json({ success: false, error: 'Not authenticated' }, { status: 401 });
    }

    const id = String(sessUser.id);
    const bodyRaw = await request.json().catch(() => ({} as unknown));

    type ProfileUpdate = {
      phone?: string;
      address?: string;
      avatar?: string;
      display_name?: string;
      bio?: string;
      locale?: string;
      timezone?: string;
      preferences?: Record<string, unknown> | null;
      metadata?: Record<string, unknown> | null;
    };

    const body = bodyRaw as ProfileUpdate;

    // Update users table for phone/address/avatar
    const userUpdate: Partial<{ phone: string; address: string; avatar: string }> = {};
    if (typeof body.phone !== 'undefined') userUpdate.phone = body.phone;
    if (typeof body.address !== 'undefined') userUpdate.address = body.address;
    if (typeof body.avatar !== 'undefined') userUpdate.avatar = body.avatar;

    if (Object.keys(userUpdate).length > 0) {
      await db.update(users).set(userUpdate).where(eq(users.id, id)).execute();
    }

    // Upsert profile (user_profiles)
    if (typeof body.display_name !== 'undefined' || typeof body.bio !== 'undefined' || typeof body.locale !== 'undefined' || typeof body.timezone !== 'undefined') {
      const existing = await db.select().from(user_profiles).where(eq(user_profiles.user_id, id)).execute();
      const vals: Partial<{ user_id: string; display_name?: string; bio?: string; locale?: string; timezone?: string }> = { user_id: id };
      if (typeof body.display_name !== 'undefined') vals.display_name = body.display_name;
      if (typeof body.bio !== 'undefined') vals.bio = body.bio;
      if (typeof body.locale !== 'undefined') vals.locale = body.locale;
      if (typeof body.timezone !== 'undefined') vals.timezone = body.timezone;

      if (existing.length === 0) {
        await db.insert(user_profiles).values(vals as userProfilesInterfaceInsert).execute();
      } else {
        await db.update(user_profiles).set(vals).where(eq(user_profiles.user_id, id)).execute();
      }
    }

    // Upsert settings (user_settings)
    if (typeof body.preferences !== 'undefined') {
      const existing = await db.select().from(user_settings).where(eq(user_settings.user_id, id)).execute();

      // Extract common boolean flags from the provided preferences object so we can
      // keep dedicated columns (email_notifications, push_notifications) in sync.
      const prefsObj = body.preferences as Record<string, unknown> | null;
      const email_notifications = prefsObj && typeof prefsObj['emailNotifications'] !== 'undefined'
        ? Boolean(prefsObj['emailNotifications'])
        : undefined;
      const push_notifications = prefsObj && typeof prefsObj['pushNotifications'] !== 'undefined'
        ? Boolean(prefsObj['pushNotifications'])
        : undefined;

      const baseVals: Partial<{ user_id: string; preferences: Record<string, unknown> | null; email_notifications?: boolean; push_notifications?: boolean }> = {
        user_id: id,
        preferences: prefsObj ?? null,
      };

      // Set explicit flags only when provided to avoid overwriting defaults unintentionally
      if (typeof email_notifications !== 'undefined') baseVals.email_notifications = email_notifications;
      if (typeof push_notifications !== 'undefined') baseVals.push_notifications = push_notifications;

      if (existing.length === 0) {
        // Insert with whatever fields we have
        await db.insert(user_settings).values(baseVals as userSettingsInterfaceInsert).execute();
      } else {
        // Update provided fields
        const updateVals: Record<string, unknown> = { preferences: baseVals.preferences };
        if (typeof baseVals.email_notifications !== 'undefined') updateVals.email_notifications = baseVals.email_notifications;
        if (typeof baseVals.push_notifications !== 'undefined') updateVals.push_notifications = baseVals.push_notifications;
        await db.update(user_settings).set(updateVals).where(eq(user_settings.user_id, id)).execute();
      }
    }

    // Upsert metadata into user_profiles.metadata (used for skills and other profile metadata)
    if (typeof body.metadata !== 'undefined') {
      const existingProfile = await db.select().from(user_profiles).where(eq(user_profiles.user_id, id)).execute();
      const metaVals: Partial<{ user_id: string; metadata: Record<string, unknown> | null }> = { user_id: id, metadata: body.metadata ?? null };
      if (existingProfile.length === 0) {
        // Create a minimal profile row if none exists
        await db.insert(user_profiles).values(metaVals as userProfilesInterfaceInsert).execute();
      } else {
        await db.update(user_profiles).set({ metadata: metaVals.metadata }).where(eq(user_profiles.user_id, id)).execute();
      }
    }

    const merged = await loadMergedProfile(id);
    return NextResponse.json({ success: true, data: merged });
  } catch (error) {
    console.error('profile PUT error', error);
    return NextResponse.json({ success: false, error: (error as Error).message || String(error) }, { status: 500 });
  }
}

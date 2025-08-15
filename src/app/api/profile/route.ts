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
      const vals: Partial<{ user_id: string; preferences: Record<string, unknown> | null }> = { user_id: id, preferences: body.preferences ?? null };
      if (existing.length === 0) {
        await db.insert(user_settings).values(vals as userSettingsInterfaceInsert).execute();
      } else {
        await db.update(user_settings).set(vals).where(eq(user_settings.user_id, id)).execute();
      }
    }

    const merged = await loadMergedProfile(id);
    return NextResponse.json({ success: true, data: merged });
  } catch (error) {
    console.error('profile PUT error', error);
    return NextResponse.json({ success: false, error: (error as Error).message || String(error) }, { status: 500 });
  }
}

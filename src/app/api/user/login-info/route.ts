import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/api/auth/[...nextauth]/authOptions';
import type { AuthOptions } from 'next-auth';
import db from '@/config/database';
import { users } from '@/drizzle/schema';
import { eq } from 'drizzle-orm';

export async function GET() {
  try {
    const session = await getServerSession(authOptions as unknown as AuthOptions);
    const sess = session as unknown as Record<string, unknown> | null;
    if (!sess || !(sess['user'])) {
      return NextResponse.json({ status: 'success', data: null });
    }

    const maybeId = (sess['user'] as unknown as Record<string, unknown>)?.id;
    if (typeof maybeId === 'string' && maybeId.length === 36 && maybeId.includes('-')) {
      const result = await db.select().from(users).where(eq(users.id, maybeId)).execute();
      if (result.length === 0) {
        return NextResponse.json({ status: 'success', data: sess['user'] });
      }
      return NextResponse.json({ status: 'success', data: result[0] });
    }

    return NextResponse.json({ status: 'success', data: sess['user'] });
  } catch (error) {
    console.error('login-info error:', error);
    return NextResponse.json(
      { status: 'error', message: 'Failed to load user info', error: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}

import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/api/auth/[...nextauth]/authOptions';

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    
    return NextResponse.json({
      status: 'success',
      session: session
        ? {
            user: {
              id: session.user?.id,
              name: session.user?.name,
              email: session.user?.email,
              avatar: (session.user as any)?.avatar ?? null,
            },
          }
        : null,
    });
  } catch (error) {
    console.error('Session check error:', error);
    return NextResponse.json(
      { 
        status: 'error', 
        message: 'Session check failed',
        error: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

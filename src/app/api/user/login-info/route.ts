import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get user with login history
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      include: {
        loginHistory: {
          orderBy: { loginAt: 'desc' },
          take: 10, // Last 10 logins
        },
      },
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Get login statistics
    const loginStats = await prisma.loginHistory.groupBy({
      by: ['provider'],
      where: { userId: session.user.id },
      _count: {
        provider: true,
      },
    });

    // Get monthly login counts
    const monthlyLogins = await prisma.loginHistory.findMany({
      where: {
        userId: session.user.id,
        loginAt: {
          gte: new Date(new Date().setMonth(new Date().getMonth() - 12)), // Last 12 months
        },
      },
      select: {
        loginAt: true,
        provider: true,
      },
    });

    return NextResponse.json({
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        image: user.image,
        createdAt: user.createdAt,
        lastLoginAt: user.lastLoginAt,
        loginCount: user.loginCount,
      },
      recentLogins: user.loginHistory,
      loginStats,
      monthlyLogins,
    });
  } catch (error) {
    console.error('Error fetching user login info:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

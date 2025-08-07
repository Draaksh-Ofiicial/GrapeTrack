import { prisma } from './prisma';

interface LoginAttemptData {
  userId: string;
  provider: string;
  success: boolean;
  ipAddress?: string;
  userAgent?: string;
}

export async function recordLoginAttempt(data: LoginAttemptData) {
  try {
    await prisma.loginHistory.create({
      data: {
        userId: data.userId,
        provider: data.provider,
        success: data.success,
        ipAddress: data.ipAddress,
        userAgent: data.userAgent,
        loginAt: new Date(),
      },
    });
  } catch (error) {
    console.error('Error recording login attempt:', error);
  }
}

export async function updateUserLoginInfo(userId: string) {
  try {
    await prisma.user.update({
      where: { id: userId },
      data: {
        lastLoginAt: new Date(),
        loginCount: {
          increment: 1,
        },
      },
    });
  } catch (error) {
    console.error('Error updating user login info:', error);
  }
}

export async function getUserLoginStats(userId: string) {
  try {
    // First check if user exists
    const userExists = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true }
    });

    if (!userExists) {
      console.log(`User ${userId} not found`);
      return null;
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        name: true,
        email: true,
        image: true,
        lastLoginAt: true,
        loginCount: true,
        createdAt: true,
      },
    });

    const recentLogins = await prisma.loginHistory.findMany({
      where: { userId },
      orderBy: { loginAt: 'desc' },
      take: 5,
      select: {
        id: true,
        loginAt: true,
        provider: true,
        ipAddress: true,
        success: true,
      },
    });

    return {
      user,
      recentLogins,
    };
  } catch (error) {
    console.error('Error getting user login stats:', error);
    return null;
  }
}

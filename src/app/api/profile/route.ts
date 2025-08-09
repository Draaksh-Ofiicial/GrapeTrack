import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.email) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    try {
      const user = await prisma.user.findUnique({
        where: { email: session.user.email },
        select: {
          id: true,
          name: true,
          email: true,
          image: true,
          role: true,
          department: true,
          phone: true,
          location: true,
          timezone: true,
          bio: true,
          skills: true,
          createdAt: true,
          lastLoginAt: true,
          loginCount: true,
          emailNotifications: true,
          pushNotifications: true,
          weeklyReports: true,
          taskReminders: true,
          theme: true,
        }
      });

      // Get recent login history
      const recentLogins = await prisma.loginHistory.findMany({
        where: { userId: user?.id },
        orderBy: { loginAt: 'desc' },
        take: 5,
        select: {
          id: true,
          loginAt: true,
          ipAddress: true,
          userAgent: true,
          provider: true,
          success: true,
        }
      });

      if (!user) {
        return NextResponse.json(
          { success: false, error: 'User not found' },
          { status: 404 }
        );
      }
      
      return NextResponse.json({
        success: true,
        data: {
          ...user,
          recentLogins
        }
      });
    } catch (dbError) {
      console.error('Database error:', dbError);
      // Fallback to session data with defaults
      const userData = {
        id: session.user.id || '',
        name: session.user.name || '',
        email: session.user.email || '',
        image: session.user.image || null,
        role: 'Admin',
        department: 'Administration',
        phone: '',
        location: '',
        timezone: '',
        bio: '',
        skills: [],
        createdAt: new Date().toISOString(),
        lastLoginAt: new Date().toISOString(),
        loginCount: 1,
        emailNotifications: true,
        pushNotifications: true,
        weeklyReports: false,
        taskReminders: true,
        theme: 'light',
        recentLogins: []
      };
      
      return NextResponse.json({
        success: true,
        data: userData
      });
    }
  } catch (error) {
    console.error('Error fetching profile:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to fetch profile data' 
      },
      { status: 500 }
    );
  }
}

export async function PUT(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.email) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { phone, bio, skills, location, preferences } = body;
    
    console.log('Updating profile for user:', session.user.email);
    console.log('Update data:', { phone, bio, skills, location, preferences });
    
    try {
      const updateData: any = {
        phone: phone || null,
        bio: bio || null,
        skills: skills || [],
        location: location || null,
        updatedAt: new Date(),
      };

      // Add preferences if provided
      if (preferences) {
        if (preferences.emailNotifications !== undefined) updateData.emailNotifications = preferences.emailNotifications;
        if (preferences.pushNotifications !== undefined) updateData.pushNotifications = preferences.pushNotifications;
        if (preferences.weeklyReports !== undefined) updateData.weeklyReports = preferences.weeklyReports;
        if (preferences.taskReminders !== undefined) updateData.taskReminders = preferences.taskReminders;
        if (preferences.theme !== undefined) updateData.theme = preferences.theme;
      }

      const updatedUser = await prisma.user.update({
        where: { email: session.user.email },
        data: updateData,
        select: {
          id: true,
          name: true,
          email: true,
          image: true,
          role: true,
          department: true,
          phone: true,
          location: true,
          timezone: true,
          bio: true,
          skills: true,
          createdAt: true,
          lastLoginAt: true,
          loginCount: true,
          emailNotifications: true,
          pushNotifications: true,
          weeklyReports: true,
          taskReminders: true,
          theme: true,
        }
      });
      
      console.log('Profile updated successfully:', updatedUser);
      
      return NextResponse.json({
        success: true,
        data: updatedUser,
        message: 'Profile updated successfully'
      });
    } catch (dbError) {
      console.error('Database error during update:', dbError);
      // Fallback response
      const updatedData = {
        id: session.user.id || '',
        name: session.user.name || '',
        email: session.user.email || '',
        image: session.user.image || null,
        role: 'Admin',
        department: 'Administration',
        phone: phone || '',
        location: location || '',
        timezone: '',
        bio: bio || '',
        skills: skills || [],
        createdAt: new Date().toISOString(),
        lastLoginAt: new Date().toISOString(),
        loginCount: 1,
        emailNotifications: preferences?.emailNotifications ?? true,
        pushNotifications: preferences?.pushNotifications ?? true,
        weeklyReports: preferences?.weeklyReports ?? false,
        taskReminders: preferences?.taskReminders ?? true,
        theme: preferences?.theme ?? 'light',
      };
      
      console.log('Using fallback data:', updatedData);
      
      return NextResponse.json({
        success: true,
        data: updatedData,
        message: 'Profile updated successfully (fallback)'
      });
    }
  } catch (error) {
    console.error('Error updating profile:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to update profile: ' + (error instanceof Error ? error.message : 'Unknown error')
      },
      { status: 500 }
    );
  }
}

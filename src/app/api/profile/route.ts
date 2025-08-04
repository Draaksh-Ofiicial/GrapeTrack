import { NextResponse } from 'next/server';

// Demo profile data
const demoProfile = {
  id: 1,
  name: 'Alex Johnson',
  email: 'alex.johnson@company.com',
  role: 'Senior Project Manager',
  department: 'Product Development',
  avatar: null, // Will use initials
  phone: '+1 (555) 123-4567',
  location: 'San Francisco, CA',
  timezone: 'PST (GMT-8)',
  joinedDate: '2023-01-15',
  bio: 'Experienced project manager with a passion for delivering high-quality products on time. I love working with cross-functional teams and solving complex problems.',
  skills: [
    'Project Management',
    'Agile/Scrum',
    'Team Leadership',
    'Strategic Planning',
    'Product Development',
    'Stakeholder Management'
  ],
  stats: {
    projectsCompleted: 24,
    totalTasks: 156,
    teamMembers: 12,
    successRate: 94
  },
  preferences: {
    emailNotifications: true,
    pushNotifications: false,
    weeklyReports: true,
    taskReminders: true,
    theme: 'light'
  },
  recentActivity: [
    {
      id: 1,
      action: 'Completed task',
      description: 'Review marketing campaign proposal',
      timestamp: '2024-01-20T10:30:00Z'
    },
    {
      id: 2,
      action: 'Created project',
      description: 'Q2 Product Launch Initiative',
      timestamp: '2024-01-19T15:45:00Z'
    },
    {
      id: 3,
      action: 'Updated profile',
      description: 'Added new skills to profile',
      timestamp: '2024-01-18T09:15:00Z'
    }
  ]
};

export async function GET() {
  try {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 500));
    
    return NextResponse.json({
      success: true,
      data: demoProfile
    });
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
    const body = await request.json();
    
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 800));
    
    // In a real application, you would update the database here
    // For demo purposes, we'll just return the updated profile
    const updatedProfile = {
      ...demoProfile,
      ...body,
      // Preserve certain fields that shouldn't be updated via this endpoint
      id: demoProfile.id,
      joinedDate: demoProfile.joinedDate,
      stats: demoProfile.stats
    };
    
    return NextResponse.json({
      success: true,
      data: updatedProfile,
      message: 'Profile updated successfully'
    });
  } catch (error) {
    console.error('Error updating profile:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to update profile' 
      },
      { status: 500 }
    );
  }
}

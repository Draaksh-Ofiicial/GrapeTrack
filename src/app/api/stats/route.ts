import { NextResponse } from 'next/server';

export interface DashboardStats {
  hoursThisWeek: number;
  eventsThisMonth: number;
  projectsInProgress: number;
  totalTasks: number;
  completedTasks: number;
  pendingTasks: number;
}

// Demo stats data
const demoStats: DashboardStats = {
  hoursThisWeek: 32,
  eventsThisMonth: 18,
  projectsInProgress: 5,
  totalTasks: 24,
  completedTasks: 9,
  pendingTasks: 15
};

export async function GET() {
  try {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 50));
    
    return NextResponse.json({
      success: true,
      data: demoStats
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: 'Failed to fetch stats' },
      { status: 500 }
    );
  }
}

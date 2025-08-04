import { NextResponse } from 'next/server';

export interface Project {
  id: number;
  name: string;
  color: string;
  description?: string;
  status: 'Active' | 'Completed' | 'On Hold';
  createdAt: string;
  taskCount: number;
  completedTasks: number;
}

// Demo data
const demoProjects: Project[] = [
  {
    id: 1,
    name: 'Event planning',
    color: 'bg-pink-400',
    description: 'Planning and organizing the annual company conference',
    status: 'Active',
    createdAt: '2024-01-01T00:00:00Z',
    taskCount: 5,
    completedTasks: 1
  },
  {
    id: 2,
    name: 'Discussions',
    color: 'bg-green-400',
    description: 'Team communication and collaboration initiatives',
    status: 'Active',
    createdAt: '2024-01-05T00:00:00Z',
    taskCount: 3,
    completedTasks: 1
  },
  {
    id: 3,
    name: 'Product Development',
    color: 'bg-blue-400',
    description: 'Development of new product features and enhancements',
    status: 'Active',
    createdAt: '2024-01-10T00:00:00Z',
    taskCount: 0,
    completedTasks: 0
  },
  {
    id: 4,
    name: 'Marketing Campaign',
    color: 'bg-purple-400',
    description: 'Q1 marketing campaign for product launch',
    status: 'On Hold',
    createdAt: '2024-01-12T00:00:00Z',
    taskCount: 0,
    completedTasks: 0
  },
  {
    id: 5,
    name: 'Website Redesign',
    color: 'bg-orange-400',
    description: 'Complete redesign of company website',
    status: 'Completed',
    createdAt: '2023-12-01T00:00:00Z',
    taskCount: 8,
    completedTasks: 8
  }
];

export async function GET() {
  try {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 100));
    
    return NextResponse.json({
      success: true,
      data: demoProjects,
      total: demoProjects.length
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: 'Failed to fetch projects' },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const newProject: Project = {
      id: Math.max(...demoProjects.map(p => p.id)) + 1,
      name: body.name,
      color: body.color || 'bg-gray-400',
      description: body.description,
      status: body.status || 'Active',
      createdAt: new Date().toISOString(),
      taskCount: 0,
      completedTasks: 0
    };
    
    demoProjects.push(newProject);
    
    return NextResponse.json({
      success: true,
      data: newProject
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: 'Failed to create project' },
      { status: 500 }
    );
  }
}

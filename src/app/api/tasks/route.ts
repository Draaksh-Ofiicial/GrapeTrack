import { NextResponse } from 'next/server';

export interface Task {
  id: number;
  name: string;
  assignedPeople: string[];
  status: 'To Do' | 'In Progress' | 'Done';
  projectId: number;
  createdAt: string;
  dueDate?: string;
}

// Demo data
const demoTasks: Task[] = [
  {
    id: 1,
    name: 'Design event invitation cards',
    assignedPeople: ['Alex Johnson', 'Sarah Davis'],
    status: 'In Progress',
    projectId: 1,
    createdAt: '2024-01-15T10:00:00Z',
    dueDate: '2024-02-01T17:00:00Z'
  },
  {
    id: 2,
    name: 'Book venue for annual conference',
    assignedPeople: ['Mike Wilson', 'Emma Brown'],
    status: 'To Do',
    projectId: 1,
    createdAt: '2024-01-16T09:30:00Z',
    dueDate: '2024-01-25T12:00:00Z'
  },
  {
    id: 3,
    name: 'Create catering menu options',
    assignedPeople: ['Lisa Chen'],
    status: 'Done',
    projectId: 1,
    createdAt: '2024-01-10T14:00:00Z'
  },
  {
    id: 4,
    name: 'Setup team discussion channel',
    assignedPeople: ['Alex Johnson', 'Tom Anderson'],
    status: 'Done',
    projectId: 2,
    createdAt: '2024-01-12T11:00:00Z'
  },
  {
    id: 5,
    name: 'Organize weekly standup meetings',
    assignedPeople: ['Sarah Davis', 'Mike Wilson', 'Emma Brown'],
    status: 'In Progress',
    projectId: 2,
    createdAt: '2024-01-14T16:00:00Z',
    dueDate: '2024-02-15T10:00:00Z'
  },
  {
    id: 6,
    name: 'Document project requirements',
    assignedPeople: ['Tom Anderson'],
    status: 'To Do',
    projectId: 2,
    createdAt: '2024-01-17T08:00:00Z',
    dueDate: '2024-01-30T17:00:00Z'
  },
  {
    id: 7,
    name: 'Review and approve budget proposal',
    assignedPeople: ['Alex Johnson', 'Lisa Chen'],
    status: 'In Progress',
    projectId: 1,
    createdAt: '2024-01-18T13:00:00Z',
    dueDate: '2024-01-28T15:00:00Z'
  },
  {
    id: 8,
    name: 'Prepare quarterly presentation',
    assignedPeople: ['Sarah Davis'],
    status: 'To Do',
    projectId: 2,
    createdAt: '2024-01-19T10:30:00Z',
    dueDate: '2024-02-05T14:00:00Z'
  }
];

export async function GET() {
  try {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 100));
    
    return NextResponse.json({
      success: true,
      data: demoTasks,
      total: demoTasks.length
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: 'Failed to fetch tasks' },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const newTask: Task = {
      id: Math.max(...demoTasks.map(t => t.id)) + 1,
      name: body.name,
      assignedPeople: body.assignedPeople || [],
      status: body.status || 'To Do',
      projectId: body.projectId,
      createdAt: new Date().toISOString(),
      dueDate: body.dueDate
    };
    
    // Do not mutate demoTasks; just return the new task for demo purposes
    
    return NextResponse.json({
      success: true,
      data: newTask
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: 'Failed to create task' },
      { status: 500 }
    );
  }
}

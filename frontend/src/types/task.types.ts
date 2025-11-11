// Task types
export type TaskStatus = 'todo' | 'in_progress' | 'done' | 'cancelled';
export type TaskPriority = 'low' | 'medium' | 'high' | 'urgent';

export interface Task {
  id: string;
  organizationId: string;
  title: string;
  description?: string | null;
  status: TaskStatus;
  priority: TaskPriority;
  assignedTo?: string[] | null; // Array of user IDs
  assignedBy?: string | null;
  createdBy: string;
  dueDate?: Date | null;
  completedAt?: Date | null;
  completionNotes?: string | null; // Rich text completion notes
  tags?: string | null;
  estimatedHours?: number | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateTaskDto {
  title: string;
  description?: string;
  status?: TaskStatus;
  priority?: TaskPriority;
  assignedTo?: string[]; // Array of user IDs
  dueDate?: string;
  estimatedHours?: number;
  tags?: string;
}

export interface UpdateTaskDto {
  title?: string;
  description?: string;
  status?: TaskStatus;
  priority?: TaskPriority;
  assignedTo?: string[]; // Array of user IDs
  dueDate?: string;
  estimatedHours?: number;
  tags?: string;
}

export interface TaskFiltersDto {
  status?: TaskStatus;
  priority?: TaskPriority;
  assignedTo?: string;
  createdBy?: string;
  dueDateFrom?: string;
  dueDateTo?: string;
  search?: string;
  limit?: number;
  offset?: number;
}

export interface AssignTaskDto {
  assignedTo: string[]; // Array of user IDs for multi-assignment
}

export interface UpdateTaskStatusDto {
  status: TaskStatus;
  completionNotes?: string;
}

// Task Activity types
export interface TaskActivity {
  id: string;
  organizationId: string;
  taskId: string;
  userId: string;
  action: string; // 'created', 'updated', 'assigned', 'status_changed', 'completed', 'deleted'
  field?: string | null; // 'status', 'priority', 'assignedTo', 'title', 'description', etc.
  oldValue?: string | null;
  newValue?: string | null;
  metadata?: Record<string, unknown>; // Additional context
  createdAt: Date;
}

export interface CreateCommentDto {
  content: string;
}

export interface Comment {
  id: string;
  organizationId: string;
  taskId: string;
  userId: string;
  content: string;
  createdAt: Date;
  updatedAt: Date;
}

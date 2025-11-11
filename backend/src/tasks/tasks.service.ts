import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  Inject,
} from '@nestjs/common';
import { eq, and, like, gte, lte, desc, inArray } from 'drizzle-orm';
import { type Database, DATABASE } from '../database/database.module';
import {
  tasks,
  taskActivity,
  users,
  type Task,
  type NewTask,
  type NewTaskActivity,
} from '../database/schema';
import {
  CreateTaskDto,
  UpdateTaskDto,
  TaskFiltersDto,
  AssignTaskDto,
  UpdateTaskStatusDto,
  TaskStatus,
} from './dto';
import { NotificationsService } from '../notifications/notifications.service';

@Injectable()
export class TasksService {
  constructor(
    @Inject(DATABASE) private readonly db: Database,
    private readonly notificationsService: NotificationsService,
  ) {}

  async create(
    dto: CreateTaskDto,
    organizationId: string,
    userId: string,
  ): Promise<Task> {
    const newTask: NewTask = {
      title: dto.title,
      description: dto.description || null,
      organizationId,
      createdBy: userId,
      status: dto.status || TaskStatus.TODO,
      priority: dto.priority || 'medium',
      assignedTo: dto.assignedTo || [],
      dueDate: dto.dueDate ? new Date(dto.dueDate) : null,
      estimatedHours: dto.estimatedHours || null,
      tags: dto.tags || null,
    };

    const [task] = await this.db.insert(tasks).values(newTask).returning();

    // Log activity
    await this.logActivity({
      organizationId,
      taskId: task.id,
      userId,
      action: 'created',
    });

    return task;
  }

  async findAll(
    organizationId: string,
    filters: TaskFiltersDto = {},
  ): Promise<Task[]> {
    const conditions = [eq(tasks.organizationId, organizationId)];

    if (filters.status) {
      conditions.push(eq(tasks.status, filters.status));
    }

    if (filters.priority) {
      conditions.push(eq(tasks.priority, filters.priority));
    }

    if (filters.createdBy) {
      conditions.push(eq(tasks.createdBy, filters.createdBy));
    }

    if (filters.dueDateFrom) {
      conditions.push(gte(tasks.dueDate, new Date(filters.dueDateFrom)));
    }

    if (filters.dueDateTo) {
      conditions.push(lte(tasks.dueDate, new Date(filters.dueDateTo)));
    }

    if (filters.search) {
      // TODO: Improve search to include description field (nullable column handling)
      conditions.push(like(tasks.title, `%${filters.search}%`));
    }

    return this.db
      .select()
      .from(tasks)
      .where(and(...conditions))
      .orderBy(desc(tasks.createdAt))
      .limit(filters.limit || 20)
      .offset(filters.offset || 0);
  }

  async findOne(id: string, organizationId: string): Promise<Task> {
    const [task] = await this.db
      .select()
      .from(tasks)
      .where(and(eq(tasks.id, id), eq(tasks.organizationId, organizationId)))
      .limit(1);

    if (!task) {
      throw new NotFoundException('Task not found');
    }

    return task;
  }

  async update(
    id: string,
    dto: UpdateTaskDto,
    organizationId: string,
    userId: string,
  ): Promise<Task> {
    const existingTask = await this.findOne(id, organizationId);

    // Only task owner can edit task details
    if (existingTask.createdBy !== userId) {
      throw new ForbiddenException('Only the task owner can edit task details');
    }

    const updateData: Partial<NewTask> = {
      updatedAt: new Date(),
    };

    // Map fields explicitly to ensure correct types for NewTask
    if (dto.title !== undefined) {
      updateData.title = dto.title;
    }
    if (dto.description !== undefined) {
      updateData.description = dto.description ?? null;
    }
    if (dto.status !== undefined) {
      updateData.status = dto.status;
    }
    if (dto.priority !== undefined) {
      updateData.priority = dto.priority;
    }
    if (dto.assignedTo !== undefined) {
      updateData.assignedTo = dto.assignedTo || [];
    }
    if (dto.estimatedHours !== undefined) {
      updateData.estimatedHours = dto.estimatedHours;
    }
    if (dto.tags !== undefined) {
      updateData.tags = dto.tags ?? null;
    }

    // Convert dueDate string to Date if provided
    if (dto.dueDate !== undefined) {
      updateData.dueDate = dto.dueDate ? new Date(dto.dueDate) : null;
    }

    const [updatedTask] = await this.db
      .update(tasks)
      .set(updateData)
      .where(and(eq(tasks.id, id), eq(tasks.organizationId, organizationId)))
      .returning();

    // Log activity for each changed field
    await this.logFieldChanges(
      existingTask,
      updatedTask,
      organizationId,
      userId,
    );

    return updatedTask;
  }

  async assign(
    id: string,
    dto: AssignTaskDto,
    organizationId: string,
    userId: string,
  ): Promise<Task> {
    const existingTask = await this.findOne(id, organizationId);

    // Only task owner can assign tasks
    if (existingTask.createdBy !== userId) {
      throw new ForbiddenException('Only the task owner can assign tasks');
    }

    const [updatedTask] = await this.db
      .update(tasks)
      .set({
        assignedTo: dto.assignedTo,
        assignedBy: userId,
        updatedAt: new Date(),
      })
      .where(and(eq(tasks.id, id), eq(tasks.organizationId, organizationId)))
      .returning();

    // Log assignment activity
    await this.logActivity({
      organizationId,
      taskId: id,
      userId,
      action: 'assigned',
      field: 'assignedTo',
      oldValue: existingTask.assignedTo,
      newValue: dto.assignedTo,
    });

    // Send task assigned notification emails to newly assigned users
    try {
      // Get assigner details
      const [assigner] = await this.db
        .select({ firstName: users.firstName, lastName: users.lastName })
        .from(users)
        .where(eq(users.id, userId))
        .limit(1);

      const assignerName = assigner
        ? `${assigner.firstName} ${assigner.lastName}`.trim()
        : 'A team member';

      // Get newly assigned users' details
      const newlyAssignedUserIds = dto.assignedTo || [];
      const previouslyAssignedUserIds = existingTask.assignedTo || [];
      const addedUserIds = newlyAssignedUserIds.filter(
        (id) => !previouslyAssignedUserIds.includes(id),
      );

      if (addedUserIds.length > 0) {
        const assignedUsers = await this.db
          .select({
            id: users.id,
            email: users.email,
            firstName: users.firstName,
          })
          .from(users)
          .where(inArray(users.id, addedUserIds));

        for (const assignedUser of assignedUsers) {
          await this.notificationsService.sendTaskAssignedEmail(
            assignedUser.email,
            assignedUser.firstName,
            updatedTask.title,
            updatedTask.description || '',
            assignerName,
            updatedTask.dueDate || undefined,
          );
        }
      }
    } catch (error) {
      console.error('Failed to send task assigned notification:', error);
      // Don't throw - email failure shouldn't block task assignment
    }

    return updatedTask;
  }

  async updateStatus(
    id: string,
    dto: UpdateTaskStatusDto,
    organizationId: string,
    userId: string,
  ): Promise<Task> {
    const existingTask = await this.findOne(id, organizationId);

    // Task owner or assigned users can update task status
    const isOwner = existingTask.createdBy === userId;
    const isAssigned =
      existingTask.assignedTo && existingTask.assignedTo.includes(userId);

    if (!isOwner && !isAssigned) {
      throw new ForbiddenException(
        'Only the task owner or assigned users can update task status',
      );
    }

    const updateData: Partial<NewTask> = {
      status: dto.status,
      updatedAt: new Date(),
    };

    // If completionNotes is provided, store it
    if (dto.completionNotes !== undefined) {
      updateData.completionNotes = dto.completionNotes;
    }

    // If marking as done, set completedAt
    if (dto.status === TaskStatus.DONE && existingTask.status !== 'done') {
      updateData.completedAt = new Date();
    } else if (
      dto.status !== TaskStatus.DONE &&
      existingTask.status === 'done'
    ) {
      updateData.completedAt = null;
    }

    const [updatedTask] = await this.db
      .update(tasks)
      .set(updateData)
      .where(and(eq(tasks.id, id), eq(tasks.organizationId, organizationId)))
      .returning();

    // Log status change activity
    await this.logActivity({
      organizationId,
      taskId: id,
      userId,
      action: dto.status === TaskStatus.DONE ? 'completed' : 'status_changed',
      field: 'status',
      oldValue: existingTask.status,
      newValue: dto.status,
    });

    // Send task completed notification if task was marked as done
    if (dto.status === TaskStatus.DONE && existingTask.status !== 'done') {
      try {
        // Get the person who completed the task
        const [completedBy] = await this.db
          .select({ firstName: users.firstName, lastName: users.lastName })
          .from(users)
          .where(eq(users.id, userId))
          .limit(1);

        const completedByName = completedBy
          ? `${completedBy.firstName} ${completedBy.lastName}`.trim()
          : 'A team member';

        // Get the task creator's details
        const [taskCreator] = await this.db
          .select({ email: users.email, firstName: users.firstName })
          .from(users)
          .where(eq(users.id, existingTask.createdBy))
          .limit(1);

        if (taskCreator) {
          await this.notificationsService.sendTaskCompletedEmail(
            taskCreator.email,
            taskCreator.firstName,
            updatedTask.title,
            completedByName,
          );
        }
      } catch (error) {
        console.error('Failed to send task completed notification:', error);
        // Don't throw - email failure shouldn't block status update
      }
    }

    return updatedTask;
  }

  async remove(
    id: string,
    organizationId: string,
    userId: string,
  ): Promise<void> {
    const existingTask = await this.findOne(id, organizationId);

    // Only task owner can delete tasks
    if (existingTask.createdBy !== userId) {
      throw new ForbiddenException('Only the task owner can delete tasks');
    }

    await this.db
      .delete(tasks)
      .where(and(eq(tasks.id, id), eq(tasks.organizationId, organizationId)));

    // Log deletion activity
    await this.logActivity({
      organizationId,
      taskId: id,
      userId,
      action: 'deleted',
    });
  }

  async getActivity(taskId: string, organizationId: string): Promise<any[]> {
    return this.db
      .select()
      .from(taskActivity)
      .where(
        and(
          eq(taskActivity.taskId, taskId),
          eq(taskActivity.organizationId, organizationId),
        ),
      )
      .orderBy(desc(taskActivity.createdAt))
      .limit(50); // Limit to last 50 activities
  }

  private async logActivity(activity: {
    organizationId: string;
    taskId: string;
    userId: string;
    action: string;
    field?: string;
    oldValue?: any;
    newValue?: any;
    metadata?: any;
  }): Promise<void> {
    const newActivity: NewTaskActivity = {
      organizationId: activity.organizationId,
      taskId: activity.taskId,
      userId: activity.userId,
      action: activity.action,
      field: activity.field,
      oldValue: activity.oldValue ? String(activity.oldValue) : null,
      newValue: activity.newValue ? String(activity.newValue) : null,
      metadata: activity.metadata,
    };

    await this.db.insert(taskActivity).values(newActivity);
  }

  private async logFieldChanges(
    oldTask: Task,
    newTask: Task,
    organizationId: string,
    userId: string,
  ): Promise<void> {
    const fieldsToCheck: (keyof Task)[] = [
      'title',
      'description',
      'status',
      'priority',
      'dueDate',
      'assignedTo',
    ];

    for (const field of fieldsToCheck) {
      if (oldTask[field] !== newTask[field]) {
        await this.logActivity({
          organizationId,
          taskId: oldTask.id,
          userId,
          action: 'updated',
          field,
          oldValue: oldTask[field],
          newValue: newTask[field],
        });
      }
    }
  }
}

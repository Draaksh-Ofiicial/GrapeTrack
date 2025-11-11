import { useState } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import type { CreateTaskDto, UpdateTaskDto, Task } from '@/types/task.types';
import { AssignUsersSelect } from './AssignUsersSelect';
import { useCreateTask, useUpdateTask } from '../apis/api';
import { useAuthUser } from '@/store/authStore';
import { useUserPermissions } from '@/hooks/usePermissions';

interface TaskFormProps {
  orgId: string;
  taskId?: string;
  task?: Task;
  initialData?: CreateTaskDto | UpdateTaskDto;
  onSuccess?: () => void;
  isEditing?: boolean;
}

export const TaskForm = ({
  orgId,
  taskId,
  task,
  initialData,
  onSuccess,
  isEditing = false,
}: TaskFormProps) => {
  const currentUser = useAuthUser();
  const userPermissions = useUserPermissions();

  // Check if user can edit this task
  const canEditTask = !isEditing || (currentUser && task && task.createdBy === currentUser.id && userPermissions.includes('tasks.update'));
  const canAssignUsers = !isEditing || (currentUser && task && task.createdBy === currentUser.id && userPermissions.includes('tasks.update'));
  const {
    register,
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<CreateTaskDto>({
    defaultValues: initialData || {
      title: '',
      description: '',
      status: 'todo',
      priority: 'medium',
      dueDate: '',
      estimatedHours: undefined,
      assignedTo: [],
    },
  });

  const [error, setError] = useState<string | null>(null);

  const createTaskMutation = useCreateTask(orgId);
  const updateTaskMutation = useUpdateTask(orgId);

  const isLoading = isEditing
    ? updateTaskMutation.isPending
    : createTaskMutation.isPending;

  // Show error if user cannot edit this task
  if (isEditing && !canEditTask) {
    return (
      <Alert variant="destructive">
        <AlertDescription>
          You don't have permission to edit this task. Only the task owner can edit task details.
        </AlertDescription>
      </Alert>
    );
  }

  const onSubmit = async (data: CreateTaskDto) => {
    try {
      setError(null);
      if (isEditing && taskId) {
        await updateTaskMutation.mutateAsync({
          id: taskId,
          data: data as UpdateTaskDto,
        });
      } else {
        await createTaskMutation.mutateAsync(data);
      }
      onSuccess?.();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save task');
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      {error && (
        <Alert className="border-red-500/50 bg-red-50 dark:bg-red-950">
          <AlertDescription className="text-red-700 dark:text-red-200">{error}</AlertDescription>
        </Alert>
      )}

      {/* Title */}
      <div>
        <Label htmlFor="title" className="block text-sm font-medium text-foreground mb-2">
          Title <span className="text-red-500">*</span>
        </Label>
        <Input
          id="title"
          {...register('title', { required: 'Title is required' })}
          type="text"
          placeholder="Enter task title"
          maxLength={255}
        />
        {errors.title && (
          <span className="text-sm text-red-600 dark:text-red-400 mt-1 block">{errors.title.message}</span>
        )}
      </div>

      {/* Description */}
      <div>
        <Label htmlFor="description" className="block text-sm font-medium text-foreground mb-2">
          Description
        </Label>
        <Textarea
          id="description"
          {...register('description')}
          placeholder="Enter task description (optional)"
          rows={4}
        />
      </div>

      {/* Status and Priority */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="status" className="block text-sm font-medium text-foreground mb-2">
            Status
          </Label>
          <Controller
            name="status"
            control={control}
            render={({ field }) => (
              <Select value={field.value} onValueChange={field.onChange}>
                <SelectTrigger id="status">
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todo">To Do</SelectItem>
                  <SelectItem value="in_progress">In Progress</SelectItem>
                  <SelectItem value="done">Done</SelectItem>
                  <SelectItem value="cancelled">Cancelled</SelectItem>
                </SelectContent>
              </Select>
            )}
          />
        </div>

        <div>
          <Label htmlFor="priority" className="block text-sm font-medium text-foreground mb-2">
            Priority
          </Label>
          <Controller
            name="priority"
            control={control}
            render={({ field }) => (
              <Select value={field.value} onValueChange={field.onChange}>
                <SelectTrigger id="priority">
                  <SelectValue placeholder="Select priority" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="low">Low</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="high">High</SelectItem>
                  <SelectItem value="urgent">Urgent</SelectItem>
                </SelectContent>
              </Select>
            )}
          />
        </div>
      </div>

      {/* Due Date and Estimated Hours */}
      <div className="space-y-4">
        <div className="relative z-50">
          <Label htmlFor="due-date" className="block text-sm font-medium text-foreground mb-2">
            Due Date & Time
          </Label>
          <Controller
            name="dueDate"
            control={control}
            render={({ field }) => {
              // Parse the ISO string to get date and time separately
              const dateObj = field.value ? new Date(field.value) : null;
              const dateStr = dateObj ? dateObj.toISOString().split('T')[0] : '';
              const timeStr = dateObj ? dateObj.toTimeString().slice(0, 5) : '';

              return (
                <div className="flex gap-2">
                  <Input
                    id="due-date"
                    type="date"
                    value={dateStr}
                    onChange={(e) => {
                      if (e.target.value) {
                        const time = timeStr || '00:00';
                        const [hours, minutes] = time.split(':');
                        const newDate = new Date(e.target.value);
                        newDate.setHours(parseInt(hours), parseInt(minutes));
                        field.onChange(newDate.toISOString());
                      } else {
                        field.onChange('');
                      }
                    }}
                  />
                  <Input
                    id="due-time"
                    type="time"
                    value={timeStr}
                    onChange={(e) => {
                      if (dateStr && e.target.value) {
                        const [hours, minutes] = e.target.value.split(':');
                        const newDate = new Date(dateStr);
                        newDate.setHours(parseInt(hours), parseInt(minutes));
                        field.onChange(newDate.toISOString());
                      } else if (dateStr) {
                        const newDate = new Date(dateStr);
                        newDate.setHours(0, 0);
                        field.onChange(newDate.toISOString());
                      }
                    }}
                  />
                </div>
              );
            }}
          />
        </div>

        <div>
          <Label htmlFor="estimated-hours" className="block text-sm font-medium text-foreground mb-2">
            Estimated Hours
          </Label>
          <Input
            id="estimated-hours"
            {...register('estimatedHours', {
              valueAsNumber: true,
              min: { value: 1, message: 'Must be at least 1 hour' },
            })}
            type="number"
            min="1"
            placeholder="Hours"
          />
          {errors.estimatedHours && (
            <span className="text-sm text-red-600 dark:text-red-400 mt-1 block">{errors.estimatedHours.message}</span>
          )}
        </div>
      </div>

      {/* Assign Users - Only show if user can assign */}
      {canAssignUsers && (
        <Controller
          name="assignedTo"
          control={control}
          render={({ field }) => (
            <AssignUsersSelect
              orgId={orgId}
              selectedUserIds={field.value || []}
              onSelectionChange={field.onChange}
            />
          )}
        />
      )}

      {!canAssignUsers && isEditing && (
        <div className="text-sm text-muted-foreground p-3 rounded-md bg-muted border border-input">
          <strong className="text-foreground">Assigned to:</strong> {task?.assignedTo?.length || 0} user(s)
          <br />
          <em>Only the task owner can modify assignments</em>
        </div>
      )}

      <div className="flex gap-2 justify-end pt-2">
        <Button type="submit" disabled={isLoading} size="lg">
          {isLoading ? 'Saving...' : isEditing ? 'Update Task' : 'Create Task'}
        </Button>
      </div>
    </form>
  );
};

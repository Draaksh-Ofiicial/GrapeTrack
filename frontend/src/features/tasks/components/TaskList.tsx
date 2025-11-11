import { useState } from "react";
import {
  Card,
  CardContent,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Placeholder from '@tiptap/extension-placeholder';
import { Bold, Italic, Strikethrough, List, ListOrdered, Quote, Code } from 'lucide-react';
import type { Task, TaskStatus, TaskPriority } from "@/types/task.types";
import { useTasks, useUpdateTaskStatus, useDeleteTask } from "../apis/api";
import { useOrganizationMembers } from "@/features/organizations/hooks/useOrganizations";
import { useAuthUser } from "@/store/authStore";
import { useUserPermissions } from "@/hooks/usePermissions";
import { toast } from 'sonner';

// Add Tiptap styles
import './tiptap-styles.css';

interface TaskListProps {
  orgId: string;
  statusFilter?: TaskStatus;
  priorityFilter?: TaskPriority;
  assigneeFilter?: string;
  onTaskClick?: (task: Task) => void;
  onEditClick?: (task: Task) => void;
}

const priorityColors: Record<TaskPriority, string> = {
  low: 'bg-blue-100 text-blue-800',
  medium: 'bg-yellow-100 text-yellow-800',
  high: 'bg-orange-100 text-orange-800',
  urgent: 'bg-red-100 text-red-800',
};

const statusLabels: Record<TaskStatus, string> = {
  todo: 'To Do',
  in_progress: 'In Progress',
  done: 'Done',
  cancelled: 'Cancelled',
};

const statusHierarchy: Record<TaskStatus, number> = {
  todo: 0,
  in_progress: 1,
  done: 2,
  cancelled: 3, // Special case - only owner can set
};

export const TaskList = ({
  orgId,
  statusFilter,
  priorityFilter,
  assigneeFilter,
  onTaskClick,
  onEditClick,
}: TaskListProps) => {
  // Completion dialog state
  const [completionDialog, setCompletionDialog] = useState<{
    isOpen: boolean;
    task: Task | null;
    completionNotes: string;
  }>({
    isOpen: false,
    task: null,
    completionNotes: "",
  });

  // Tiptap editor for completion notes
  const completionEditor = useEditor({
    extensions: [
      StarterKit,
      Placeholder.configure({
        placeholder: 'Describe what was accomplished, any challenges faced, or notes for future reference...',
      }),
    ],
    content: completionDialog.completionNotes,
    onUpdate: ({ editor }) => {
      setCompletionDialog(prev => ({
        ...prev,
        completionNotes: editor.getHTML(),
      }));
    },
    editorProps: {
      attributes: {
        class: 'prose prose-sm sm:prose-base lg:prose-lg xl:prose-2xl mx-auto focus:outline-none min-h-[100px] p-4',
      },
    },
  });

  const { data: members = [] } = useOrganizationMembers(orgId);
  const currentUser = useAuthUser();
  const userPermissions = useUserPermissions();

  const filters = {
    status: statusFilter,
    priority: priorityFilter,
    assignedTo: assigneeFilter,
  };

  const { data: tasks, isLoading, isError, error: queryError } = useTasks(orgId, filters);
  const updateStatusMutation = useUpdateTaskStatus(orgId);
  const deleteTaskMutation = useDeleteTask(orgId);

  if (isError) {
    return (
      <Alert className="border-red-500 bg-red-50">
        <AlertDescription className="text-red-700">
          Failed to load tasks: {queryError?.message || 'Unknown error'}
        </AlertDescription>
      </Alert>
    );
  }

  if (isLoading) {
    return (
      <div className="flex justify-center items-center py-8">
        <div className="text-gray-500">Loading tasks...</div>
      </div>
    );
  }

  if (!tasks?.data || tasks.data.length === 0) {
    return (
      <Card>
        <CardContent className="py-8">
          <div className="text-center text-gray-500">No tasks found</div>
        </CardContent>
      </Card>
    );
  }

  const handleStatusChange = async (task: Task, newStatus: TaskStatus) => {
    // Check if user is assigned to this task
    const isAssigned = currentUser && task.assignedTo?.includes(currentUser.id);
    const isOwner = currentUser && task.createdBy === currentUser.id;

    // Define status hierarchy (lower to higher)
    const statusHierarchy: Record<TaskStatus, number> = {
      todo: 0,
      in_progress: 1,
      done: 2,
      cancelled: 3, // Special case - only owner can set
    };

    const currentLevel = statusHierarchy[task.status];
    const newLevel = statusHierarchy[newStatus];

    // Rules:
    // 1. Only assigned users can change status
    // 2. Assigned users can only upgrade status (move to higher level)
    // 3. Only owners can downgrade status or set to cancelled
    // 4. Owners can do anything

    if (!isAssigned && !isOwner) {
      toast.error('Only assigned users or the task owner can change status');
      return;
    }

    if (isAssigned && !isOwner) {
      // Assigned user (not owner) can only upgrade status
      if (newLevel <= currentLevel) {
        toast.error('You can only upgrade task status. Only the task owner can downgrade status.');
        return;
      }
      // Special case: assigned users cannot set to cancelled
      if (newStatus === 'cancelled') {
        toast.error('Only the task owner can cancel this task.');
        return;
      }
    }

    // If marking as done, show completion dialog
    if (newStatus === 'done') {
      setCompletionDialog({
        isOpen: true,
        task,
        completionNotes: "",
      });
      // Reset editor content
      completionEditor?.commands.setContent('');
      return;
    }

    // If we get here, the change is allowed
    try {
      await updateStatusMutation.mutateAsync({
        id: task.id,
        data: { status: newStatus },
      });
    } catch (err) {
      const errorMessage = err && typeof err === 'object' && 'response' in err
        ? (err as { response?: { data?: { message?: string } } })?.response?.data?.message
        : err instanceof Error ? err.message : 'Failed to update status';
      toast.error(errorMessage);
    }
  };

  const handleDelete = async (taskId: string) => {
    if (!confirm('Are you sure you want to delete this task?')) {
      return;
    }

    try {
      await deleteTaskMutation.mutateAsync(taskId);
    } catch (err) {
      const errorMessage = err && typeof err === 'object' && 'response' in err
        ? (err as { response?: { data?: { message?: string } } })?.response?.data?.message
        : err instanceof Error ? err.message : 'Failed to delete task';
      toast.error(errorMessage);
    }
  };

  const handleCompleteTask = async () => {
    // Check if there's actual content (strip HTML tags and check for meaningful text)
    const textContent = completionDialog.completionNotes.replace(/<[^>]*>/g, '').trim();
    if (!completionDialog.task || !textContent) {
      return;
    }

    try {
      await updateStatusMutation.mutateAsync({
        id: completionDialog.task.id,
        data: { 
          status: 'done',
          completionNotes: completionDialog.completionNotes.trim()
        },
      });
      setCompletionDialog({ isOpen: false, task: null, completionNotes: "" });
    } catch (err) {
      const errorMessage = err && typeof err === 'object' && 'response' in err
        ? (err as { response?: { data?: { message?: string } } })?.response?.data?.message
        : err instanceof Error ? err.message : 'Failed to complete task';
      toast.error(errorMessage);
    }
  };

  const handleCancelCompletion = () => {
    setCompletionDialog({ isOpen: false, task: null, completionNotes: "" });
    completionEditor?.commands.setContent('');
  };

  return (
    <div className="space-y-3">
      {tasks.data.map((task: Task) => (
        <Card key={task.id} className="hover:shadow-md transition-shadow">
          <CardContent>
            <div className="flex items-start justify-between gap-4">
              <div
                className="flex-1 cursor-pointer"
                onClick={() => onTaskClick?.(task)}
              >
                <div className="flex items-center gap-2 mb-2">
                  <h3 className="font-semibold text-lg text-gray-900">
                    {task.title}
                  </h3>
                  <span
                    className={`text-xs px-2 py-1 rounded font-medium ${priorityColors[task.priority]}`}
                  >
                    {task.priority.charAt(0).toUpperCase() + task.priority.slice(1)}
                  </span>
                </div>

                {task.description && (
                  <p className="text-sm text-gray-600 mb-3 line-clamp-2">
                    {task.description}
                  </p>
                )}

                {/* Assigned Users */}
                {task.assignedTo && task.assignedTo.length > 0 && (
                  <div className="flex items-center gap-2 mb-3">
                    <span className="text-xs font-medium text-gray-600">Assigned to:</span>
                    <div className="flex gap-1">
                      {task.assignedTo.map((userId) => {
                        const user = members.find(m => m.userId === userId);
                        return (
                          <div key={userId} title={user ? `${user.firstName} ${user.lastName}` : 'Unknown User'}>
                            <Avatar className="h-6 w-6">
                              <AvatarImage src={user?.avatar} />
                              <AvatarFallback className="text-xs">
                                {user ? `${user.firstName?.[0]}${user.lastName?.[0]}` : '?'}
                              </AvatarFallback>
                            </Avatar>
                          </div>
                        );
                      })}
                    </div>
                    <Badge variant="secondary" className="text-xs ml-2">
                      {task.assignedTo.length} assigned
                    </Badge>
                  </div>
                )}

                <div className="flex items-center gap-4 text-sm text-gray-500">
                  {task.dueDate && (
                    <span>
                      Due: {new Date(task.dueDate).toLocaleDateString()}
                    </span>
                  )}
                  {task.estimatedHours && (
                    <span>{task.estimatedHours}h estimated</span>
                  )}
                </div>
              </div>

              <div className="flex flex-col gap-2">
                <select
                  value={task.status}
                  onChange={(e) =>
                    handleStatusChange(task, e.target.value as TaskStatus)
                  }
                  disabled={updateStatusMutation.isPending}
                  className="px-3 py-1 text-sm border border-gray-300 rounded-md bg-white hover:bg-gray-50 disabled:opacity-50"
                  title={
                    !currentUser
                      ? "Please log in to change status"
                      : !task.assignedTo?.includes(currentUser.id) && task.createdBy !== currentUser.id
                        ? "Only assigned users or the task owner can change status"
                        : currentUser && task.assignedTo?.includes(currentUser.id) && task.createdBy !== currentUser.id
                          ? "You can only upgrade status. Contact the task owner to downgrade."
                          : "You can change the status"
                  }
                >
                  {Object.entries(statusLabels).map(([value, label]) => {
                    const statusValue = value as TaskStatus;
                    const isAssigned = currentUser && task.assignedTo?.includes(currentUser.id);
                    const isOwner = currentUser && task.createdBy === currentUser.id;

                    if (isAssigned && !isOwner) {
                      // Assigned user (not owner) can only upgrade status
                      const currentLevel = statusHierarchy[task.status];
                      const optionLevel = statusHierarchy[statusValue];

                      if (optionLevel < currentLevel) {
                        return;
                      } else if (statusValue === 'cancelled') {
                        return;
                      }
                    }

                    return (
                      <option
                        key={value}
                        value={value}
                      >
                        {label}
                      </option>
                    );
                  })}
                </select>

                <div className="flex gap-2">
                  {currentUser && task.createdBy === currentUser.id && userPermissions.includes('tasks.update') && (
                    <Button
                      onClick={() => onEditClick?.(task)}
                      className="text-sm px-2 py-1 h-auto"
                      variant="outline"
                    >
                      Edit
                    </Button>
                  )}
                  {currentUser && task.createdBy === currentUser.id && userPermissions.includes('tasks.delete') && (
                    <Button
                      onClick={() => handleDelete(task.id)}
                      disabled={deleteTaskMutation.isPending}
                      className="text-sm px-2 py-1 h-auto"
                      variant="destructive"
                    >
                      Delete
                    </Button>
                  )}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}

      {/* Completion Dialog */}
      <Dialog open={completionDialog.isOpen} onOpenChange={(open) => !open && handleCancelCompletion()}>
        <DialogContent className="sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>Complete Task</DialogTitle>
            <DialogDescription>
              Please provide completion notes for "{completionDialog.task?.title}".
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="completion-notes">Completion Notes *</Label>
              <div className="min-h-[120px] border border-gray-300 rounded-md overflow-hidden">
                <div className="border-b border-gray-300 bg-gray-50 px-3 py-2 flex gap-1">
                  <Button
                    onClick={() => completionEditor?.chain().focus().toggleBold().run()}
                    className={`h-8 w-8 p-0 ${completionEditor?.isActive('bold') ? 'bg-gray-200' : ''}`}
                    variant="ghost"
                    size="sm"
                    type="button"
                  >
                    <Bold className="h-4 w-4" />
                  </Button>
                  <Button
                    onClick={() => completionEditor?.chain().focus().toggleItalic().run()}
                    className={`h-8 w-8 p-0 ${completionEditor?.isActive('italic') ? 'bg-gray-200' : ''}`}
                    variant="ghost"
                    size="sm"
                    type="button"
                  >
                    <Italic className="h-4 w-4" />
                  </Button>
                  <Button
                    onClick={() => completionEditor?.chain().focus().toggleStrike().run()}
                    className={`h-8 w-8 p-0 ${completionEditor?.isActive('strike') ? 'bg-gray-200' : ''}`}
                    variant="ghost"
                    size="sm"
                    type="button"
                  >
                    <Strikethrough className="h-4 w-4" />
                  </Button>
                  <div className="w-px h-6 bg-gray-300 mx-1"></div>
                  <Button
                    onClick={() => completionEditor?.chain().focus().toggleBulletList().run()}
                    className={`h-8 w-8 p-0 ${completionEditor?.isActive('bulletList') ? 'bg-gray-200' : ''}`}
                    variant="ghost"
                    size="sm"
                    type="button"
                  >
                    <List className="h-4 w-4" />
                  </Button>
                  <Button
                    onClick={() => completionEditor?.chain().focus().toggleOrderedList().run()}
                    className={`h-8 w-8 p-0 ${completionEditor?.isActive('orderedList') ? 'bg-gray-200' : ''}`}
                    variant="ghost"
                    size="sm"
                    type="button"
                  >
                    <ListOrdered className="h-4 w-4" />
                  </Button>
                  <Button
                    onClick={() => completionEditor?.chain().focus().toggleBlockquote().run()}
                    className={`h-8 w-8 p-0 ${completionEditor?.isActive('blockquote') ? 'bg-gray-200' : ''}`}
                    variant="ghost"
                    size="sm"
                    type="button"
                  >
                    <Quote className="h-4 w-4" />
                  </Button>
                  <Button
                    onClick={() => completionEditor?.chain().focus().toggleCodeBlock().run()}
                    className={`h-8 w-8 p-0 ${completionEditor?.isActive('codeBlock') ? 'bg-gray-200' : ''}`}
                    variant="ghost"
                    size="sm"
                    type="button"
                  >
                    <Code className="h-4 w-4" />
                  </Button>
                </div>
                <EditorContent
                  editor={completionEditor}
                  className="prose prose-sm max-w-none [&_.ProseMirror]:min-h-[100px] [&_.ProseMirror]:p-4 [&_.ProseMirror]:focus:outline-none [&_.ProseMirror_p]:margin-0 [&_.ProseMirror_h1]:margin-0 [&_.ProseMirror_h2]:margin-0 [&_.ProseMirror_h3]:margin-0"
                />
              </div>
              <p className="text-xs text-gray-500">
                Use rich formatting to document your completion details, challenges, and any important notes.
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={handleCancelCompletion}
            >
              Cancel
            </Button>
            <Button
              type="button"
              onClick={handleCompleteTask}
              disabled={!completionDialog.completionNotes.replace(/<[^>]*>/g, '').trim() || updateStatusMutation.isPending}
            >
              {updateStatusMutation.isPending ? "Completing..." : "Complete Task"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

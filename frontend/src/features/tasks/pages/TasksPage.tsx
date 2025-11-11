import { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useActiveOrganization } from '@/store/authStore';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Textarea } from '@/components/ui/textarea';
import { motion, AnimatePresence } from 'framer-motion';
import type { Task, TaskStatus, TaskPriority } from '@/types/task.types';
import { TaskForm } from '../components/TaskForm';
import { TaskList } from '../components/TaskList';
import { TaskFilters } from '../components/TaskFilters';
import { useOrganizationMembers } from '@/features/organizations/hooks/useOrganizations';
import { useTaskActivity, useTaskComments, useAddComment } from '../apis/api';
import { useUserPermissions } from '@/hooks/usePermissions';

// Dialog component for task creation or editing
const CreateTaskDialog = ({ 
  isOpen, 
  onClose, 
  orgId,
  onSuccess,
  task,
  isEditing = false
}: { 
  isOpen: boolean; 
  onClose: () => void; 
  orgId: string;
  onSuccess: () => void;
  task?: Task;
  isEditing?: boolean;
}) => {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{isEditing ? 'Edit Task' : 'Create New Task'}</DialogTitle>
          <DialogDescription>
            {isEditing ? 'Update task details' : 'Add a new task to your organization'}
          </DialogDescription>
        </DialogHeader>
        
        <TaskForm
          orgId={orgId}
          taskId={task?.id}
          task={task}
          isEditing={isEditing}
          initialData={isEditing && task ? {
            title: task.title,
            description: task.description || '',
            status: task.status,
            priority: task.priority,
            dueDate: task.dueDate ? (task.dueDate instanceof Date ? task.dueDate.toISOString() : task.dueDate as string) : '',
            estimatedHours: task.estimatedHours || undefined,
            assignedTo: task.assignedTo || [],
          } : undefined}
          onSuccess={() => {
            onSuccess();
            onClose();
          }}
        />
      </DialogContent>
    </Dialog>
  );
};

export const TasksPage = () => {
  const { user } = useAuth();
  const activeOrganization = useActiveOrganization();
  const [statusFilter, setStatusFilter] = useState<TaskStatus | undefined>();
  const [priorityFilter, setPriorityFilter] = useState<TaskPriority | undefined>();
  const [searchQuery, setSearchQuery] = useState('');
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [commentText, setCommentText] = useState('');

  const { data: members = [] } = useOrganizationMembers(activeOrganization?.id || '');
  const { data: taskActivity = [] } = useTaskActivity(activeOrganization?.id || '', selectedTask?.id || '');
  const { data: taskComments = [] } = useTaskComments(activeOrganization?.id || '', selectedTask?.id || '');
  const addCommentMutation = useAddComment(activeOrganization?.id || '', selectedTask?.id || '');
  const userPermissions = useUserPermissions();
  const STATUS: Record<TaskStatus, string> = {
    todo: 'To Do',
    in_progress: 'In Progress',
    done: 'Done',
    cancelled: 'Cancelled',
  };

  if (!user || !activeOrganization) {
    return (
      <Card className="border-red-500/30 bg-red-50 dark:bg-red-950">
        <CardContent className="pt-6">
          <p className="text-red-900 dark:text-red-100">Please select an organization to view tasks.</p>
        </CardContent>
      </Card>
    );
  }

  const orgId = activeOrganization.id;

  return (
    <div className="space-y-6 pb-10">
      {/* Header Section with Better Visual Hierarchy */}
      <div className="relative">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between"
        >
          <div className="space-y-2">
            <h1 className="text-4xl font-bold text-foreground">Tasks</h1>
            <p className="text-muted-foreground">Manage and track your organization's tasks efficiently</p>
          </div>
          {userPermissions.includes('tasks.create') && (
            <motion.div
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <Button
                onClick={() => setShowCreateForm(true)}
                size="lg"
                className="gap-2 bg-primary hover:bg-primary/90 text-primary-foreground shadow-lg hover:shadow-xl transition-shadow"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                Create New Task
              </Button>
            </motion.div>
          )}
        </motion.div>
      </div>

      {/* Main Content Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        {/* Sidebar Filters - Left Side */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.1, duration: 0.3 }}
          className="lg:col-span-1"
        >
          <div className="sticky top-6">
            <TaskFilters
              statusFilter={statusFilter}
              priorityFilter={priorityFilter}
              searchQuery={searchQuery}
              onStatusChange={setStatusFilter}
              onPriorityChange={setPriorityFilter}
              onSearchChange={setSearchQuery}
            />
          </div>
        </motion.div>

        {/* Tasks List - Main Content */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.1, duration: 0.3 }}
          className="lg:col-span-4"
        >
          <TaskList
            orgId={orgId}
            statusFilter={statusFilter}
            priorityFilter={priorityFilter}
            onTaskClick={setSelectedTask}
            onEditClick={(task) => {
              setEditingTask(task);
            }}
          />
        </motion.div>
      </div>

      {/* Task Detail Offcanvas */}
      <AnimatePresence>
        {selectedTask && (
          <Sheet open={true} onOpenChange={() => setSelectedTask(null)}>
            <SheetContent
              side="right"
              className="w-full h-full p-0 border-l bg-background shadow-2xl"
              style={{ maxWidth: '600px' }}
            >
              <div className="p-6 h-full overflow-y-auto">
                <SheetHeader>
                  <SheetTitle className="text-foreground">Task Details</SheetTitle>
                </SheetHeader>
                {selectedTask && (
                  <div className="space-y-6 mt-6">
                    {/* Task Header */}
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.1, duration: 0.3 }}
                    >
                      <div className="flex items-center gap-2 mb-2">
                        <h2 className="text-2xl font-bold text-foreground">{selectedTask.title}</h2>
                        <Badge variant="secondary" className="text-xs">
                          {selectedTask.priority.charAt(0).toUpperCase() + selectedTask.priority.slice(1)}
                        </Badge>
                        <Badge variant="outline" className="text-xs">
                          {selectedTask.status === 'todo' ? 'To Do' :
                            selectedTask.status === 'in_progress' ? 'In Progress' :
                              selectedTask.status === 'done' ? 'Done' : 'Cancelled'}
                        </Badge>
                      </div>
                    </motion.div>

                    {/* Description */}
                    {selectedTask.description && (
                      <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.15, duration: 0.3 }}
                      >
                        <h3 className="text-sm font-medium text-foreground mb-2">Description</h3>
                        <p className="text-muted-foreground whitespace-pre-wrap">{selectedTask.description}</p>
                      </motion.div>
                    )}

                    {/* Assigned Users */}
                    {selectedTask.assignedTo && selectedTask.assignedTo.length > 0 && (
                      <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.2, duration: 0.3 }}
                      >
                        <h3 className="text-sm font-medium text-foreground mb-2">Assigned to</h3>
                        <div className="flex flex-wrap gap-2">
                          {selectedTask.assignedTo.map((userId) => {
                            const member = members.find(m => m.userId === userId);
                            return (
                              <div key={userId} className="flex items-center gap-2 p-2 rounded-lg bg-muted">
                                <Avatar className="h-6 w-6">
                                  <AvatarImage src={member?.avatar} />
                                  <AvatarFallback className="text-xs">
                                    {member ? `${member.firstName?.[0]}${member.lastName?.[0]}` : '?'}
                                  </AvatarFallback>
                                </Avatar>
                                <span className="text-sm text-foreground">
                                  {member ? `${member.firstName} ${member.lastName}` : 'Unknown User'}
                                </span>
                              </div>
                            );
                          })}
                        </div>
                      </motion.div>
                    )}

                    {/* Task Metadata */}
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.25, duration: 0.3 }}
                      className="grid grid-cols-2 gap-4 text-sm p-4 bg-muted rounded-lg"
                    >
                      {selectedTask.dueDate && (
                        <div>
                          <span className="font-medium text-foreground">Due Date</span>
                          <p className="text-muted-foreground text-xs mt-1">{new Date(selectedTask.dueDate).toLocaleDateString()}</p>
                        </div>
                      )}
                      {selectedTask.estimatedHours && (
                        <div>
                          <span className="font-medium text-foreground">Est. Hours</span>
                          <p className="text-muted-foreground text-xs mt-1">{selectedTask.estimatedHours}h</p>
                        </div>
                      )}
                      <div>
                        <span className="font-medium text-foreground">Created</span>
                        <p className="text-muted-foreground text-xs mt-1">{new Date(selectedTask.createdAt).toLocaleDateString()}</p>
                      </div>
                      {selectedTask.updatedAt && (
                        <div>
                          <span className="font-medium text-foreground">Updated</span>
                          <p className="text-muted-foreground text-xs mt-1">{new Date(selectedTask.updatedAt).toLocaleDateString()}</p>
                        </div>
                      )}
                    </motion.div>

                    {/* Tags */}
                    {selectedTask.tags && (() => {
                      try {
                        const parsedTags = JSON.parse(selectedTask.tags);
                        return Array.isArray(parsedTags) && parsedTags.length > 0 ? (
                          <motion.div
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.3, duration: 0.3 }}
                          >
                            <h3 className="text-sm font-medium text-foreground mb-2">Tags</h3>
                            <div className="flex flex-wrap gap-2">
                              {parsedTags.map((tag: string, index: number) => (
                                <Badge key={index} variant="secondary" className="text-xs">
                                  {tag}
                                </Badge>
                              ))}
                            </div>
                          </motion.div>
                        ) : null;
                      } catch {
                        return null;
                      }
                    })()}

                    {/* Action Buttons */}
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.35, duration: 0.3 }}
                      className="flex gap-2 pt-4 border-t"
                    >
                      {user && selectedTask.createdBy === user.id && userPermissions.includes('tasks.update') && (
                        <Button
                          onClick={() => {
                            setEditingTask(selectedTask);
                            setSelectedTask(null);
                          }}
                          variant="outline"
                        >
                          Edit Task
                        </Button>
                      )}
                      {user && selectedTask.createdBy === user.id && userPermissions.includes('tasks.delete') && (
                        <Button
                          onClick={() => {
                            if (confirm('Are you sure you want to delete this task?')) {
                              // Handle delete - will be implemented with mutation
                            }
                          }}
                          variant="destructive"
                        >
                          Delete Task
                        </Button>
                      )}
                    </motion.div>

                    {/* Comments Section */}
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.4, duration: 0.3 }}
                      className="pt-4 border-t"
                    >
                      <h3 className="text-sm font-medium text-foreground mb-3">Comments</h3>

                      {/* Add Comment */}
                      <div className="space-y-3 mb-4">
                        <Textarea
                          placeholder="Add a comment..."
                          value={commentText}
                          onChange={(e) => setCommentText(e.target.value)}
                          className="min-h-20"
                        />
                        <Button
                          onClick={() => {
                            if (commentText.trim()) {
                              addCommentMutation.mutate({ content: commentText.trim() });
                              setCommentText('');
                            }
                          }}
                          disabled={!commentText.trim() || addCommentMutation.isPending}
                          size="sm"
                        >
                          {addCommentMutation.isPending ? 'Adding...' : 'Add Comment'}
                        </Button>
                      </div>

                      {/* Existing Comments */}
                      <div className="space-y-3">
                        {taskComments.map((comment) => {
                          const commentUser = members.find(m => m.userId === comment.userId);
                          return (
                            <div key={comment.id} className="flex gap-3 p-3 bg-muted rounded-lg">
                              <Avatar className="h-8 w-8 shrink-0">
                                <AvatarImage src={commentUser?.avatar} />
                                <AvatarFallback className="text-xs">
                                  {commentUser ? `${commentUser.firstName?.[0]}${commentUser.lastName?.[0]}` : '?'}
                                </AvatarFallback>
                              </Avatar>
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 mb-1">
                                  <span className="text-sm font-medium text-foreground truncate">
                                    {commentUser ? `${commentUser.firstName} ${commentUser.lastName}` : 'Unknown User'}
                                  </span>
                                  <span className="text-xs text-muted-foreground shrink-0">
                                    {new Date(comment.createdAt).toLocaleDateString()}
                                  </span>
                                </div>
                                <p className="text-sm text-muted-foreground wrap-break-word">{comment.content}</p>
                              </div>
                            </div>
                          );
                        })}
                        {taskComments.length === 0 && (
                          <p className="text-sm text-muted-foreground text-center py-4">No comments yet</p>
                        )}
                      </div>
                    </motion.div>

                    {/* Task Activity Section */}
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.45, duration: 0.3 }}
                      className="pt-4 border-t"
                    >
                      <h3 className="text-sm font-medium text-foreground mb-3">Activity</h3>
                      <div className="space-y-3">
                        {taskActivity.map((activity) => {
                          const activityUser = members.find(m => m.userId === activity.userId);
                          return (
                            <div key={activity.id} className="flex gap-3 p-3 bg-muted rounded-lg">
                              <Avatar className="h-8 w-8 shrink-0">
                                <AvatarImage src={activityUser?.avatar} />
                                <AvatarFallback className="text-xs">
                                  {activityUser ? `${activityUser.firstName?.[0]}${activityUser.lastName?.[0]}` : '?'}
                                </AvatarFallback>
                              </Avatar>
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 mb-1">
                                  <span className="text-sm font-medium text-foreground truncate">
                                    {activityUser ? `${activityUser.firstName} ${activityUser.lastName}` : 'Unknown User'}
                                  </span>
                                  <span className="text-xs text-muted-foreground shrink-0">
                                    {new Date(activity.createdAt).toLocaleDateString()}
                                  </span>
                                </div>
                                <p className="text-sm text-muted-foreground">
                                  {activity.action === 'created' && 'Created this task'}
                                  {activity.action === 'status_changed' && `Changed status from ${STATUS[activity.oldValue as TaskStatus] ?? activity.oldValue} to ${STATUS[activity.newValue as TaskStatus] ?? activity.newValue}`}
                                  {activity.action === 'updated' && activity.field && `Updated ${activity.field}`}
                                  {activity.action === 'assigned' && 'Assigned task'}
                                  {activity.action === 'completed' && 'Marked task as completed'}
                                  {activity.action === 'deleted' && 'Deleted task'}
                                </p>
                              </div>
                            </div>
                          );
                        })}
                        {taskActivity.length === 0 && (
                          <p className="text-sm text-muted-foreground text-center py-4">No activity yet</p>
                        )}
                      </div>
                    </motion.div>
                  </div>
                )}
              </div>
            </SheetContent>
          </Sheet>
        )}
      </AnimatePresence>

      {/* Create Task Dialog */}
      <CreateTaskDialog
        isOpen={showCreateForm || !!editingTask}
        onClose={() => {
          setShowCreateForm(false);
          setEditingTask(null);
        }}
        orgId={orgId}
        onSuccess={() => {
          // Refresh tasks list if needed
        }}
        task={editingTask || undefined}
        isEditing={!!editingTask}
      />
    </div>
  );
};

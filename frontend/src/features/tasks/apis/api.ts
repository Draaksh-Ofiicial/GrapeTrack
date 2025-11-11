import apiClient from '@/lib/api/apiClient';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import type {
  Task,
  CreateTaskDto,
  UpdateTaskDto,
  TaskFiltersDto,
  AssignTaskDto,
  UpdateTaskStatusDto,
  TaskActivity,
  Comment,
  CreateCommentDto,
} from '@/types/task.types';

// API service for tasks
export const tasksApi = {
  getAll: (orgId: string, filters?: TaskFiltersDto) =>
    apiClient.get<Task[]>(`/organizations/${orgId}/tasks`, { params: filters }),

  getById: (orgId: string, id: string) =>
    apiClient.get<Task>(`/organizations/${orgId}/tasks/${id}`),

  create: (orgId: string, data: CreateTaskDto) =>
    apiClient.post<Task>(`/organizations/${orgId}/tasks`, data),

  update: (orgId: string, id: string, data: UpdateTaskDto) =>
    apiClient.patch<Task>(`/organizations/${orgId}/tasks/${id}`, data),

  assign: (orgId: string, id: string, data: AssignTaskDto) =>
    apiClient.patch<Task>(`/organizations/${orgId}/tasks/${id}/assign`, data),

  updateStatus: (orgId: string, id: string, data: UpdateTaskStatusDto) =>
    apiClient.patch<Task>(`/organizations/${orgId}/tasks/${id}/status`, data),

  delete: (orgId: string, id: string) =>
    apiClient.delete(`/organizations/${orgId}/tasks/${id}`),

  // Task Activity (placeholder - backend not implemented yet)
  getActivity: (orgId: string, taskId: string) =>
    apiClient.get<TaskActivity[]>(`/organizations/${orgId}/tasks/${taskId}/activity`),

  // Comments (placeholder - backend not implemented yet)
  getComments: (orgId: string, taskId: string) =>
    apiClient.get<Comment[]>(`/organizations/${orgId}/tasks/${taskId}/comments`),

  addComment: (orgId: string, taskId: string, data: CreateCommentDto) =>
    apiClient.post<Comment>(`/organizations/${orgId}/tasks/${taskId}/comments`, data),
};

// Query hooks
export const useTasks = (orgId: string, filters?: TaskFiltersDto) => {
  return useQuery({
    queryKey: ['tasks', orgId, filters],
    queryFn: () => tasksApi.getAll(orgId, filters),
    enabled: !!orgId,
  });
};

export const useTask = (orgId: string, taskId: string) => {
  return useQuery({
    queryKey: ['task', orgId, taskId],
    queryFn: () => tasksApi.getById(orgId, taskId),
    enabled: !!orgId && !!taskId,
  });
};

// Mutation hooks
export const useCreateTask = (orgId: string) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateTaskDto) => tasksApi.create(orgId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks', orgId] });
    },
  });
};

export const useUpdateTask = (orgId: string) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateTaskDto }) =>
      tasksApi.update(orgId, id, data),
    onSuccess: (response) => {
      queryClient.invalidateQueries({ queryKey: ['tasks', orgId] });
      queryClient.setQueryData(['task', orgId, response.data.id], response.data);
    },
  });
};

export const useAssignTask = (orgId: string) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: AssignTaskDto }) =>
      tasksApi.assign(orgId, id, data),
    onSuccess: (response) => {
      queryClient.invalidateQueries({ queryKey: ['tasks', orgId] });
      queryClient.setQueryData(['task', orgId, response.data.id], response.data);
    },
  });
};

export const useUpdateTaskStatus = (orgId: string) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateTaskStatusDto }) =>
      tasksApi.updateStatus(orgId, id, data),
    onSuccess: (response) => {
      queryClient.invalidateQueries({ queryKey: ['tasks', orgId] });
      queryClient.setQueryData(['task', orgId, response.data.id], response.data);
    },
  });
};

export const useDeleteTask = (orgId: string) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => tasksApi.delete(orgId, id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks', orgId] });
    },
  });
};

// Task Activity hooks
export const useTaskActivity = (orgId: string, taskId: string) => {
  return useQuery({
    queryKey: ['task-activity', orgId, taskId],
    queryFn: async () => {
      const response = await apiClient.get<TaskActivity[]>(
        `/organizations/${orgId}/tasks/${taskId}/activity`
      );
      return response.data;
    },
    enabled: !!orgId && !!taskId,
  });
};

// Comments hooks
export const useTaskComments = (orgId: string, taskId: string) => {
  return useQuery({
    queryKey: ['task-comments', orgId, taskId],
    queryFn: async () => {
      const response = await apiClient.get<Comment[]>(
        `/organizations/${orgId}/tasks/${taskId}/comments`
      );
      return response.data;
    },
    enabled: !!orgId && !!taskId,
  });
};

export const useAddComment = (orgId: string, taskId: string) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: CreateCommentDto) => {
      const response = await apiClient.post<Comment>(
        `/organizations/${orgId}/tasks/${taskId}/comments`,
        data
      );
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['task-comments', orgId, taskId] });
    },
  });
};

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import type { CreateRoleDto, UpdateRoleDto } from '../api/rolesApi';
import rolesApi from '../api/rolesApi';
import { useAuth } from '@/hooks/useAuth';

/**
 * Hook to fetch all roles with permissions for an organization
 */
export const useRoles = (orgId: string) => {
  const query = useQuery({
    queryKey: ['roles', orgId],
    queryFn: async () => {
      const response = await rolesApi.getAllRoles(orgId);
      return response.data;
    },
    enabled: !!orgId,
  });

  return {
    ...query,
    data: query.data, // Data is already extracted
  };
};

/**
 * Hook to fetch single role with permissions
 */
export const useRole = (orgId: string, roleId: string) => {
  const query = useQuery({
    queryKey: ['role', orgId, roleId],
    queryFn: async () => {
      const response = await rolesApi.getRole(orgId, roleId);
      return response.data;
    },
    enabled: !!orgId && !!roleId,
  });

  return {
    ...query,
    data: query.data, // Data is already extracted
  };
};

/**
 * Hook to fetch all available permissions for organization
 */
/**
 * Hook to fetch all available permissions (global, not org-specific)
 * Permissions are system-wide, not organization-scoped
 */
export const usePermissions = (orgId: string) => {
  const query = useQuery({
    queryKey: ['permissions'], // No orgId in key - permissions are global
    queryFn: async () => {
      const response = await rolesApi.getPermissions(orgId); // Still pass orgId for routing/guard
      return response.data.permissions;
    },
    enabled: !!orgId,
    staleTime: 5 * 60 * 1000, // 5 minutes cache
  });

  return {
    ...query,
    data: query.data, // Data is already extracted
  };
};

/**
 * Hook to create new role
 */
export const useCreateRole = (orgId: string) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateRoleDto) => rolesApi.createRole(orgId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['roles', orgId] });
    },
  });
};

/**
 * Hook to update role
 */
export const useUpdateRole = (orgId: string) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ roleId, data }: { roleId: string; data: UpdateRoleDto }) =>
      rolesApi.updateRole(orgId, roleId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['roles', orgId] });
    },
  });
};

/**
 * Hook to delete role
 */
export const useDeleteRole = (orgId: string) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (roleId: string) => rolesApi.deleteRole(orgId, roleId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['roles', orgId] });
    },
  });
};

/**
 * Hook to assign permissions to role
 */
export const useAssignPermissions = (orgId: string) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      roleId,
      permissionIds,
    }: {
      roleId: string;
      permissionIds: string[];
    }) => rolesApi.assignPermissions(orgId, roleId, permissionIds),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['roles', orgId] });
    },
  });
};

/**
 * Hook to remove permission from role
 */
export const useRemovePermission = (orgId: string) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      roleId,
      permissionId,
    }: {
      roleId: string;
      permissionId: string;
    }) => rolesApi.removePermission(orgId, roleId, permissionId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['roles', orgId] });
    },
  });
};

/**
 * Hook to fetch global system permissions (not org-specific)
 * Permissions are system-wide and cached globally without orgId
 */
export const useGlobalPermissions = () => {
  const { activeOrganization } = useAuth();
  const orgId = activeOrganization?.id;

  const query = useQuery({
    queryKey: ['permissions'], // Global cache key - no orgId
    queryFn: () => {
      if (!orgId) return Promise.reject(new Error('No organization context'));
      return rolesApi.getPermissions(orgId);
    },
    enabled: !!orgId,
    staleTime: 10 * 60 * 1000, // 10 minutes - permissions rarely change
  });

  return {
    ...query,
    data: query.data?.data,
  };
};

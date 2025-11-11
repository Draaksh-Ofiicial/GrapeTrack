import apiClient from '@/lib/api/apiClient';

export interface Permission {
    id: string;
    name: string;
    slug: string;
    category: string;
}

export interface Role {
    id: string;
    name: string;
    slug: string;
    description?: string;
    color?: string;
    level?: string;
    isSystemRole: boolean;
    organizationId: string;
    permissions?: Permission[];
}

export interface CreateRoleDto {
    name: string;
    slug: string;
    description?: string;
    color?: string;
    level?: string;
}

export interface UpdateRoleDto {
    name?: string;
    slug?: string;
    description?: string;
    color?: string;
    level?: string;
}

const rolesApi = {
    /**
     * Get all roles with permissions for organization
     */
    getAllRoles: (orgId: string) =>
        apiClient.get<Role[]>(`/organizations/${orgId}/roles`),

    /**
     * Get single role with permissions
     */
    getRole: (orgId: string, roleId: string) =>
        apiClient.get<Role>(`/organizations/${orgId}/roles/${roleId}`),

    /**
     * Create new custom role
     */
    createRole: (orgId: string, data: CreateRoleDto) =>
        apiClient.post<Role>(`/organizations/${orgId}/roles`, data),

    /**
     * Update custom role
     */
    updateRole: (orgId: string, roleId: string, data: UpdateRoleDto) =>
        apiClient.patch<Role>(`/organizations/${orgId}/roles/${roleId}`, data),

    /**
     * Delete custom role
     */
    deleteRole: (orgId: string, roleId: string) =>
        apiClient.delete(`/organizations/${orgId}/roles/${roleId}`),

    /**
     * Assign permissions to role (replaces all existing permissions)
     */
    assignPermissions: (orgId: string, roleId: string, permissionIds: string[]) =>
        apiClient.post(`/organizations/${orgId}/roles/${roleId}/permissions`, {
            permissionIds,
        }),

    /**
     * Remove single permission from role
     */
    removePermission: (
        orgId: string,
        roleId: string,
        permissionId: string
    ) =>
        apiClient.delete(
            `/organizations/${orgId}/roles/${roleId}/permissions/${permissionId}`
        ),
    /**
     * Get all available permissions (system-wide, not org-specific)
     * Note: Permissions are global but endpoint requires org context for auth/routing
     */
    getPermissions: (orgId: string) =>
        apiClient.get<{ permissions: Permission[] }>(`/organizations/${orgId}/permissions`),
};

export default rolesApi;

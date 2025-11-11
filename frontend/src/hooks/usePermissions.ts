import { useAuthUser, useActiveOrganization } from '../store/authStore';

/**
 * Hook to get all permissions for the current user in the active organization
 * Uses permissions from the /me endpoint response (already included in user object)
 * 
 * @returns Array of permission slugs (e.g., ["tasks.view", "tasks.create", "team.view"])
 */
export const useUserPermissions = (): string[] => {
  const user = useAuthUser();
  
  if (!user || !user.permissions) {
    return [];
  }
  
  // Extract permission slugs from the permissions array
  return user.permissions.map(p => p.slug);
};

/**
 * Hook to check if user has a specific permission
 * @param permission - Permission to check (e.g., "tasks.create")
 * @returns boolean indicating if user has the permission
 */
export const useHasPermission = (permission: string): boolean => {
  const permissions = useUserPermissions();
  return permissions.includes(permission);
};

/**
 * Hook to check if user has any of the specified permissions
 * @param permissions - Array of permissions to check
 * @returns boolean indicating if user has any of the permissions
 */
export const useHasAnyPermission = (permissions: string[]): boolean => {
  const userPerms = useUserPermissions();
  return permissions.some(perm => userPerms.includes(perm));
};

/**
 * Hook to check if user has all of the specified permissions
 * @param permissions - Array of permissions to check
 * @returns boolean indicating if user has all permissions
 */
export const useHasAllPermissions = (permissions: string[]): boolean => {
  const userPerms = useUserPermissions();
  return permissions.every(perm => userPerms.includes(perm));
};

/**
 * Hook to get current user's role in active organization
 * @returns current user role or null
 */
export const useUserRole = (): string | null => {
  const user = useAuthUser();
  const activeOrg = useActiveOrganization();

  if (!user || !activeOrg) {
    return null;
  }

  const userOrgRole = user.organizations.find(
    (org) => org.organizationId === activeOrg.id
  );

  return userOrgRole?.roleName.toLocaleLowerCase() || null;
};

/**
 * Hook to check if user is admin in current organization
 * (checks for admin permission)
 */
export const useIsAdmin = (): boolean => {
  return useHasPermission('organization.manage');
};

/**
 * Hook to check if user can manage team
 */
export const useCanManageTeam = (): boolean => {
  return useHasPermission('team.manage_roles');
};

/**
 * Hook to check if user can create tasks
 */
export const useCanCreateTasks = (): boolean => {
  return useHasPermission('tasks.create');
};

/**
 * Hook to check if user can view all tasks
 */
export const useCanViewAllTasks = (): boolean => {
  return useHasPermission('tasks.view_all');
};
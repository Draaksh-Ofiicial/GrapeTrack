import { rolePermissions, Permission } from './permissions';

export function roleHasPermission(role: string | undefined | null, permission: Permission): boolean {
  if (!role) return false;
  const perms = rolePermissions[role];
  if (!perms) return false;
  if (perms === '*') return true;
  return (perms as Permission[]).includes(permission);
}

export function getPermissionsForRole(role: string | undefined | null): Permission[] {
  if (!role) return [];
  const perms = rolePermissions[role];
  if (!perms) return [];
  if (perms === '*') return [];
  return perms as Permission[];
}

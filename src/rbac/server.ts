import { eq } from 'drizzle-orm';
import db from '@/config/database';
import { roles, permissions, role_permissions } from '@/drizzle/schema';
import type { permissionsInterface } from '@/drizzle/schema';

// Cache for role permissions to avoid frequent DB queries
const rolePermissionsCache = new Map<string, Set<string>>();
const cacheExpiry = new Map<string, number>();
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

/**
 * Clear the cache for a specific role or all roles
 */
export function clearPermissionCache(roleName?: string) {
  if (roleName) {
    rolePermissionsCache.delete(roleName);
    cacheExpiry.delete(roleName);
  } else {
    rolePermissionsCache.clear();
    cacheExpiry.clear();
  }
}

/**
 * Fetch permissions for a role from the database
 */
async function fetchRolePermissions(roleName: string): Promise<Set<string>> {
  try {
    const rolePerms = await db
      .select({
        permission_name: role_permissions.permission_name
      })
      .from(role_permissions)
      .where(eq(role_permissions.role_name, roleName))
      .execute();

    return new Set(rolePerms.map(rp => rp.permission_name));
  } catch (error) {
    console.error(`Error fetching permissions for role ${roleName}:`, error);
    return new Set();
  }
}

/**
 * Get permissions for a role with caching
 */
async function getRolePermissions(roleName: string): Promise<Set<string>> {
  const now = Date.now();
  const expiry = cacheExpiry.get(roleName);
  
  // Check if cache is valid
  if (expiry && now < expiry && rolePermissionsCache.has(roleName)) {
    return rolePermissionsCache.get(roleName)!;
  }

  // Fetch from database
  const permissions = await fetchRolePermissions(roleName);
  
  // Update cache
  rolePermissionsCache.set(roleName, permissions);
  cacheExpiry.set(roleName, now + CACHE_TTL);
  
  return permissions;
}

/**
 * Check if a role has a specific permission
 */
export async function roleHasPermission(role: string | undefined | null, permission: string): Promise<boolean> {
  if (!role) return false;

  try {
    const permissions = await getRolePermissions(role);
    
    // Check for wildcard permission (admin access)
    if (permissions.has('*') || permissions.has('admin.access')) {
      return true;
    }
    
    return permissions.has(permission);
  } catch (error) {
    console.error(`Error checking permission ${permission} for role ${role}:`, error);
    return false;
  }
}

/**
 * Get all permissions for a role
 */
export async function getPermissionsForRole(role: string | undefined | null): Promise<string[]> {
  if (!role) return [];

  try {
    const permissions = await getRolePermissions(role);
    return Array.from(permissions);
  } catch (error) {
    console.error(`Error getting permissions for role ${role}:`, error);
    return [];
  }
}

/**
 * Check if a role exists in the database
 */
export async function isRoleKnown(role?: string | null): Promise<boolean> {
  if (!role) return false;

  try {
    const result = await db
      .select({ name: roles.name })
      .from(roles)
      .where(eq(roles.name, role))
      .limit(1)
      .execute();

    return result.length > 0;
  } catch (error) {
    console.error(`Error checking if role ${role} exists:`, error);
    return false;
  }
}

/**
 * Get all available permissions from the database
 */
export async function getAllPermissions(): Promise<permissionsInterface[]> {
  try {
    return await db.select().from(permissions).execute();
  } catch (error) {
    console.error('Error fetching all permissions:', error);
    return [];
  }
}

/**
 * Add a permission to a role
 */
export async function addPermissionToRole(roleName: string, permissionName: string): Promise<boolean> {
  try {
    await db.insert(role_permissions).values({
      role_name: roleName,
      permission_name: permissionName
    }).execute();

    // Clear cache for this role
    clearPermissionCache(roleName);
    
    return true;
  } catch (error) {
    console.error(`Error adding permission ${permissionName} to role ${roleName}:`, error);
    return false;
  }
}

/**
 * Remove a permission from a role
 */
export async function removePermissionFromRole(roleName: string, permissionName: string): Promise<boolean> {
  try {
    await db
      .delete(role_permissions)
      .where(
        eq(role_permissions.role_name, roleName) && 
        eq(role_permissions.permission_name, permissionName)
      )
      .execute();

    // Clear cache for this role
    clearPermissionCache(roleName);
    
    return true;
  } catch (error) {
    console.error(`Error removing permission ${permissionName} from role ${roleName}:`, error);
    return false;
  }
}

"use client";

import React from 'react';

// Client-side RBAC utilities that work with fetched permissions
// These functions don't access the database directly

/**
 * Check if a list of permissions includes a specific permission
 */
export function permissionsInclude(permissions: string[], requiredPermission: string): boolean {
  // Check for wildcard permission
  if (permissions.includes('*')) {
    return true;
  }
  
  // Check for admin access (also acts as wildcard)
  if (permissions.includes('admin.access')) {
    return true;
  }
  
  // Check for specific permission
  return permissions.includes(requiredPermission);
}

/**
 * Check if user has permission based on their permissions array
 */
export function hasPermission(userPermissions: string[], requiredPermission: string): boolean {
  if (!userPermissions || userPermissions.length === 0) {
    return false;
  }
  
  return permissionsInclude(userPermissions, requiredPermission);
}

/**
 * Check if user has any of the required permissions
 */
export function hasAnyPermission(userPermissions: string[], requiredPermissions: string[]): boolean {
  if (!userPermissions || userPermissions.length === 0) {
    return false;
  }
  
  return requiredPermissions.some(permission => 
    permissionsInclude(userPermissions, permission)
  );
}

/**
 * Check if user has all of the required permissions
 */
export function hasAllPermissions(userPermissions: string[], requiredPermissions: string[]): boolean {
  if (!userPermissions || userPermissions.length === 0) {
    return false;
  }
  
  return requiredPermissions.every(permission => 
    permissionsInclude(userPermissions, permission)
  );
}

/**
 * Filter permissions by resource (e.g., 'projects', 'tasks')
 */
export function getPermissionsByResource(permissions: string[], resource: string): string[] {
  return permissions.filter(permission => {
    if (permission === '*') return true;
    if (permission === 'admin.access') return true;
    return permission.startsWith(`${resource}.`);
  });
}

/**
 * Get available actions for a resource based on permissions
 */
export function getActionsForResource(permissions: string[], resource: string): string[] {
  const resourcePermissions = getPermissionsByResource(permissions, resource);
  
  if (resourcePermissions.includes('*') || resourcePermissions.includes('admin.access')) {
    return ['read', 'write', 'delete', 'manage'];
  }
  
  return resourcePermissions
    .filter(permission => permission.startsWith(`${resource}.`))
    .map(permission => permission.split('.')[1])
    .filter(Boolean);
}

/**
 * Check if user can perform an action on a resource
 */
export function canPerformAction(userPermissions: string[], resource: string, action: string): boolean {
  const requiredPermission = `${resource}.${action}`;
  return hasPermission(userPermissions, requiredPermission);
}

// Higher-order component for permission-based rendering
export interface WithPermissionProps {
  userPermissions: string[];
  requiredPermission?: string;
  requiredPermissions?: string[];
  requireAll?: boolean;
  fallback?: React.ReactNode;
  children: React.ReactNode;
}

export function WithPermission({
  userPermissions,
  requiredPermission,
  requiredPermissions,
  requireAll = false,
  fallback = null,
  children
}: WithPermissionProps): React.ReactElement {
  let hasAccess = false;

  if (requiredPermission) {
    hasAccess = hasPermission(userPermissions, requiredPermission);
  } else if (requiredPermissions) {
    hasAccess = requireAll 
      ? hasAllPermissions(userPermissions, requiredPermissions)
      : hasAnyPermission(userPermissions, requiredPermissions);
  }

  return React.createElement(React.Fragment, {}, hasAccess ? children : fallback);
}

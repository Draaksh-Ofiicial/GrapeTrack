"use client";

import { useState, useEffect } from 'react';

export function usePermissions(userRole?: string | null) {
  const [permissions, setPermissions] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchPermissions() {
      if (!userRole) {
        setPermissions([]);
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        const response = await fetch(`/api/rbac/permissions?role=${userRole}`);
        
        if (!response.ok) {
          throw new Error('Failed to fetch permissions');
        }

        const data = await response.json();
        setPermissions(data.permissions || []);
        setError(null);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unknown error');
        setPermissions([]);
      } finally {
        setLoading(false);
      }
    }

    fetchPermissions();
  }, [userRole]);

  const hasPermission = async (permission: string): Promise<boolean> => {
    if (!userRole) return false;
    
    try {
      const response = await fetch(`/api/rbac/permissions?role=${userRole}`);
      if (!response.ok) return false;
      
      const data = await response.json();
      const rolePermissions = data.permissions || [];
      
      return rolePermissions.includes(permission) || rolePermissions.includes('*');
    } catch {
      return false;
    }
  };

  const checkPermission = (permission: string): boolean => {
    return permissions.includes(permission) || permissions.includes('*');
  };

  return {
    permissions,
    loading,
    error,
    hasPermission,
    checkPermission,
  };
}

export function usePermissionCheck(userRole?: string | null, requiredPermission?: string) {
  const [hasAccess, setHasAccess] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function checkAccess() {
      if (!userRole || !requiredPermission) {
        setHasAccess(false);
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        const response = await fetch(`/api/rbac/permissions?role=${userRole}`);
        
        if (!response.ok) {
          setHasAccess(false);
          return;
        }

        const data = await response.json();
        const rolePermissions = data.permissions || [];
        const access = rolePermissions.includes(requiredPermission) || rolePermissions.includes('*');
        
        setHasAccess(access);
      } catch (error) {
        console.error('Error checking permission:', error);
        setHasAccess(false);
      } finally {
        setLoading(false);
      }
    }

    checkAccess();
  }, [userRole, requiredPermission]);

  return { hasAccess, loading };
}

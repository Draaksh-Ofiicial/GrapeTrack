import React from 'react';
import { useAuthUser } from '../store/authStore';

interface ProtectedComponentProps {
  roles: string[];
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

/**
 * Component that conditionally renders children based on user role
 * @param roles - Array of allowed roles
 * @param children - Content to render if user has permission
 * @param fallback - Content to render if user doesn't have permission
 */
export const ProtectedComponent: React.FC<ProtectedComponentProps> = ({
  roles,
  children,
  fallback = null,
}) => {
  const user = useAuthUser();
  
  // If no user, don't render anything
  if (!user) {
    return <>{fallback}</>;
  }

  // Check if user has any of the required roles in their current organization
  const hasPermission = user.organizations.some(org => 
    roles.includes(org.roleName)
  );

  if (hasPermission) {
    return <>{children}</>;
  }

  return <>{fallback}</>;
};

export default ProtectedComponent;
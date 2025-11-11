import { Navigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';

interface ProtectedRouteProps {
  children: React.ReactNode;
  allowedRoles?: string[];
  requireOrgSelection?: boolean;
}

/**
 * ProtectedRoute Component
 * Checks authentication and authorization before rendering children
 */
export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({
  children,
  allowedRoles = [],
  requireOrgSelection = true,
}) => {
  const { isAuthenticated, user, activeOrganization, isLoading } = useAuth();

  // Show loading while checking auth status
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  // Redirect to login if not authenticated
  if (!isAuthenticated || !user) {
    return <Navigate to="/auth/login" replace />;
  }

  // Check if organization selection is required
  if (requireOrgSelection && !activeOrganization) {
    return <Navigate to="/auth/select-organization" replace />;
  }

  // Check role-based access if roles are specified
  if (allowedRoles.length > 0 && activeOrganization) {
    const userRole = activeOrganization.roleName;
    if (!allowedRoles.includes(userRole)) {
      return <Navigate to="/unauthorized" replace />;
    }
  }

  // All checks passed, render children
  return <>{children}</>;
};

export default ProtectedRoute;
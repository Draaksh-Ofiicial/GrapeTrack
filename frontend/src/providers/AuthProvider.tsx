import { useEffect, useRef } from 'react';
import { useAuth } from '../hooks/useAuth';

/**
 * Auth Provider Component
 * Initializes authentication state when the app loads
 * This should wrap your entire app or router
 */
interface AuthProviderProps {
  children: React.ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const { initializeAuth, isLoading } = useAuth();
  const hasInitialized = useRef(false);

  useEffect(() => {
    // Initialize auth state on app startup only once
    if (!hasInitialized.current) {
      hasInitialized.current = true;
      initializeAuth();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Empty dependency array to run only once

  // Show loading spinner only while auth is initializing
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return <>{children}</>;
};

export default AuthProvider;
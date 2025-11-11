import { useCallback } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { authApi } from '../features/auth/api/authApi';
import type { AuthUser } from '../types/auth.types';
import {
  useAuthStore,
  useIsAuthenticated,
  useAuthUser,
  useActiveOrganization,
  useHasSelectedOrganization,
  useAuthLoading,
  useAuthInitializing,
  useAuthError,
  useAuthLogin,
  useAuthLogout,
  useAuthSelectOrganization,
  useAuthClearOrganization,
  useAuthSetError,
  useAuthClearError,
  useAuthSetTokenStatus,
  useHasValidTokens,
  useTokenExpiresAt,
  useLastTokenRefresh,
  mapUserOrgToActiveOrg,
} from '../store/authStore';

// Error type for API responses
interface ApiErrorResponse {
  response?: {
    data?: {
      message?: string;
    };
  };
}

// Helper function to check if error has API response structure
const isApiError = (error: unknown): error is ApiErrorResponse => {
  return typeof error === 'object' && error !== null && 'response' in error;
};

// Helper function to extract error message
const getErrorMessage = (error: unknown, fallback: string): string => {
  if (isApiError(error)) {
    return error.response?.data?.message || fallback;
  }
  if (error instanceof Error) {
    return error.message;
  }
  return fallback;
};

/**
 * Custom hook for authentication operations
 * Combines Zustand store with TanStack Query mutations
 */
export const useAuth = () => {
  const queryClient = useQueryClient();

  // Individual action hooks to prevent infinite loops
  const loginAction = useAuthLogin();
  const logoutAction = useAuthLogout();
  const selectOrganizationAction = useAuthSelectOrganization();
  const clearOrganizationAction = useAuthClearOrganization();
  const setErrorAction = useAuthSetError();
  const clearErrorAction = useAuthClearError();
  const setTokenStatusAction = useAuthSetTokenStatus();

  // Auth state from store
  const isAuthenticated = useIsAuthenticated();
  const user = useAuthUser();
  const activeOrganization = useActiveOrganization();
  const hasSelectedOrganization = useHasSelectedOrganization();
  const isLoading = useAuthLoading();
  const isInitializing = useAuthInitializing();
  const error = useAuthError();

  // Token state from store
  const hasValidTokens = useHasValidTokens();
  const tokenExpiresAt = useTokenExpiresAt();
  const lastTokenRefresh = useLastTokenRefresh();

  /**
   * Login mutation
   */
  const loginMutation = useMutation({
    mutationFn: authApi.login,
    onSuccess: async (response) => {
      // After successful login, fetch complete user data including organizations
      try {
        const userResponse = await authApi.me();
        const userData = userResponse.data.user;

        // Create AuthUser object with complete data from /me endpoint
        const authUser: AuthUser = {
          ...userData,
          organizations: userData.organizations || [],
        };

        loginAction(authUser);

        // Since tokens are httpOnly cookies, we mark as having valid tokens
        setTokenStatusAction(true, new Date(Date.now() + 15 * 60 * 1000).toISOString()); // 15 minutes

        // Invalidate any cached queries
        queryClient.invalidateQueries({ queryKey: ['auth'] });
      } catch (meError) {
        console.error('Failed to fetch user data after login:', meError);
        // Fallback to login response data if /me fails
        const userData = response.data.user;
        const authUser: AuthUser = {
          ...userData,
          organizations: [], // Empty organizations as fallback
        };

        loginAction(authUser);
        setTokenStatusAction(true, new Date(Date.now() + 15 * 60 * 1000).toISOString());
        queryClient.invalidateQueries({ queryKey: ['auth'] });
      }
    },
    onError: (error: unknown) => {
      setErrorAction(getErrorMessage(error, 'Login failed'));
    },
  });

  /**
   * Register mutation
   */
  const registerMutation = useMutation({
    mutationFn: authApi.register,
    onSuccess: async (response) => {
      // After successful registration, fetch complete user data including organizations
      try {
        const userResponse = await authApi.me();
        const userData = userResponse.data.user;

        // Create AuthUser object with complete data from /me endpoint
        const authUser: AuthUser = {
          ...userData,
          organizations: userData.organizations || [],
        };

        loginAction(authUser);

        // Since tokens are httpOnly cookies, we mark as having valid tokens
        setTokenStatusAction(true, new Date(Date.now() + 15 * 60 * 1000).toISOString()); // 15 minutes

        queryClient.invalidateQueries({ queryKey: ['auth'] });
      } catch (meError) {
        console.error('Failed to fetch user data after registration:', meError);
        // Fallback to register response data if /me fails
        const userData = response.data.user;
        const authUser: AuthUser = {
          ...userData,
          organizations: [], // Empty organizations as fallback
        };

        loginAction(authUser);
        setTokenStatusAction(true, new Date(Date.now() + 15 * 60 * 1000).toISOString());
        queryClient.invalidateQueries({ queryKey: ['auth'] });
      }
    },
    onError: (error: unknown) => {
      setErrorAction(getErrorMessage(error, 'Registration failed'));
    },
  });

  /**
   * Logout mutation
   */
  const logoutMutation = useMutation({
    mutationFn: authApi.logout,
    onSuccess: () => {
      logoutAction();
      queryClient.clear(); // Clear all cached data
    },
    onError: () => {
      // Even if API call fails, clear local state
      logoutAction();
      queryClient.clear();
    },
  });

  /**
   * Select organization mutation
   */
  const selectOrganizationMutation = useMutation({
    mutationFn: authApi.selectOrganization,
    onSuccess: async (_, variables) => {
      // Refresh user data to get updated role/permissions for new organization context
      try {
        const userResponse = await authApi.me();
        const updatedUserData = userResponse.data.user;

        // Update user data in store with refreshed organization information
        const authUser: AuthUser = {
          id: updatedUserData.id,
          email: updatedUserData.email,
          firstName: updatedUserData.firstName,
          lastName: updatedUserData.lastName,
          avatar: updatedUserData.avatar,
          organizations: updatedUserData.organizations,
          permissions: updatedUserData.permissions,
        };

        // Update user data in store
        loginAction(authUser);

        // Find the selected organization from updated user data
        const userOrg = authUser.organizations.find(
          org => org.organizationId === variables.organizationId
        );

        if (userOrg) {
          const activeOrg = mapUserOrgToActiveOrg(userOrg);
          selectOrganizationAction(activeOrg);
        }
      } catch (error) {
        console.error('Failed to refresh user data after organization selection:', error);
        // Still try to update active organization from existing user data as fallback
        const userOrg = user?.organizations.find(
          org => org.organizationId === variables.organizationId
        );

        if (userOrg) {
          const activeOrg = mapUserOrgToActiveOrg(userOrg);
          selectOrganizationAction(activeOrg);
        }
      }

      // Invalidate queries that depend on organization context
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
      queryClient.invalidateQueries({ queryKey: ['auth'] });
    },
    onError: (error: unknown) => {
      setErrorAction(getErrorMessage(error, 'Failed to select organization'));
    },
  });

  /**
   * Query for user organizations
   */
  const organizationsQuery = useQuery({
    queryKey: ['auth', 'organizations'],
    queryFn: async () => {
      const data = await authApi.getOrganizations();
      return data;
    },
    enabled: isAuthenticated,
  });

  /**
   * Initialize auth on app startup
   */
  const initializeAuth = useCallback(async () => {
    // Call initialize directly from store to avoid dependency issues
    await useAuthStore.getState().initialize();
  }, []); // Empty deps array to prevent infinite loop

  /**
   * Login with email and password
   */
  const login = useCallback((email: string, password: string, rememberMe: boolean = false) => {
    clearErrorAction();
    loginMutation.mutate({ email, password, rememberMe });
  }, [clearErrorAction, loginMutation]);

  /**
   * Register new user
   */
  const register = useCallback((data: {
    email: string;
    password: string;
    firstName: string;
    lastName: string;
  }) => {
    clearErrorAction();
    registerMutation.mutate(data);
  }, [clearErrorAction, registerMutation]);

  /**
   * Logout user
   */
  const logout = useCallback(() => {
    logoutMutation.mutate();
  }, [logoutMutation]);

  /**
   * Select an organization
   */
  const selectOrganization = useCallback((organizationId: string) => {
    clearErrorAction();
    selectOrganizationMutation.mutate({ organizationId });
  }, [clearErrorAction, selectOrganizationMutation]);

  /**
   * Switch to Google OAuth
   */
  const loginWithGoogle = useCallback(() => {
    authApi.googleAuth();
  }, []);

  /**
   * Clear organization selection
   */
  const clearOrganization = useCallback(() => {
    clearOrganizationAction();
  }, [clearOrganizationAction]);

  /**
   * Refresh user data from API
   */
  const refreshUser = useCallback(async () => {
    try {
      await useAuthStore.getState().refreshUser();
    } catch (error) {
      console.error('Failed to refresh user data:', error);
    }
  }, []);

  return {
    // State
    isAuthenticated,
    user,
    activeOrganization,
    hasSelectedOrganization,
    isLoading: isLoading || loginMutation.isPending || registerMutation.isPending,
    isInitializing,
    error,
    organizations: organizationsQuery.data?.data.organizations,

    // Token state
    hasValidTokens,
    tokenExpiresAt,
    lastTokenRefresh,

    // Actions
    login,
    register,
    logout,
    selectOrganization,
    loginWithGoogle,
    clearOrganization,
    refreshUser,
    initializeAuth,

    // Mutation states
    isLoggingIn: loginMutation.isPending,
    isRegistering: registerMutation.isPending,
    isLoggingOut: logoutMutation.isPending,
    isSelectingOrganization: selectOrganizationMutation.isPending,
  };
};

/**
 * Hook to check if user has specific permission
 */
export const useHasPermission = (permission: string) => {
  const activeOrganization = useActiveOrganization();

  // This would need to be implemented based on your permission system
  // For now, return true for admin role
  // TODO: Implement actual permission checking using the permission parameter
  console.log('Checking permission:', permission); // Temporary to use the parameter
  return activeOrganization?.roleName === 'admin';
};

/**
 * Hook to get current user's role in active organization
 */
export const useUserRole = () => {
  const activeOrganization = useActiveOrganization();
  return activeOrganization?.roleName || null;
};

export default useAuth;
import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import authApi from '../lib/api/authApi';
import type {
    AuthStore,
    AuthUser,
    ActiveOrganization,
    UserOrganization,
} from '../types/auth.types';

/**
 * Initial auth state
 */
const initialState = {
    isAuthenticated: false,
    isLoading: false,
    user: null,
    activeOrganization: null,
    hasSelectedOrganization: false,
    hasValidTokens: false,
    tokenExpiresAt: null,
    lastTokenRefresh: null,
    error: null,
    isInitializing: false, // Flag to prevent concurrent initialization
};

/**
 * Zustand auth store with persistence
 * Manages authentication state, user data, and organization context
 */
export const useAuthStore = create<AuthStore>()(
    persist(
        (set, get) => ({
            // State
            ...initialState,

            // Actions
            login: (user: AuthUser, tokenExpiresAt?: string) => {
                set({
                    isAuthenticated: true,
                    user,
                    hasValidTokens: true,
                    tokenExpiresAt: tokenExpiresAt || null,
                    lastTokenRefresh: new Date().toISOString(),
                    error: null,
                    isLoading: false,
                });
            },

            logout: async () => {
                try {
                    // Call logout API to revoke refresh tokens
                    await authApi.logout();
                } catch (error) {
                    console.error('Logout API call failed:', error);
                    // Continue with local logout even if API fails
                } finally {
                    // Clear all auth state including token status
                    set({
                        ...initialState,
                    });

                    // Clear welcome message flag
                    sessionStorage.removeItem('hasShownWelcome');
                }
            },

            selectOrganization: (organization: ActiveOrganization) => {
                set({
                    activeOrganization: organization,
                    hasSelectedOrganization: true,
                    error: null,
                });
            },

            clearOrganization: () => {
                set({
                    activeOrganization: null,
                    hasSelectedOrganization: false,
                });
            },

            setUser: (user: AuthUser) => {
                set({ user });
            },

            updateUser: (updates) => {
                const { user } = get();
                if (user) {
                    set({
                        user: { ...user, ...updates },
                    });
                }
            },

            refreshUser: async (): Promise<void> => {
                try {
                    const response = await authApi.me();
                    set({
                        user: response.data.user,
                        error: null,
                    });
                } catch (error) {
                    console.error('Failed to refresh user data:', error);
                    // Don't set error state here as it might be a temporary issue
                }
            },

            // Token management methods (for httpOnly cookies)
            setTokenStatus: (hasValidTokens: boolean, expiresAt?: string) => {
                set({
                    hasValidTokens,
                    tokenExpiresAt: expiresAt || null,
                    lastTokenRefresh: hasValidTokens ? new Date().toISOString() : null,
                });
            },

            refreshTokens: async (): Promise<boolean> => {
                try {
                    const response = await authApi.refresh();
                    set({
                        hasValidTokens: true,
                        tokenExpiresAt: response.expiresAt || null,
                        lastTokenRefresh: new Date().toISOString(),
                        error: null,
                    });
                    return true;
                } catch (error) {
                    console.error('Token refresh failed:', error);
                    set({
                        hasValidTokens: false,
                        tokenExpiresAt: null,
                        lastTokenRefresh: null,
                    });
                    return false;
                }
            },

            clearTokens: () => {
                set({
                    hasValidTokens: false,
                    tokenExpiresAt: null,
                    lastTokenRefresh: null,
                });
            },

            setLoading: (loading: boolean) => {
                set({ isLoading: loading });
            },

            setError: (error: string | null) => {
                set({ error });
            },

            clearError: () => {
                set({ error: null });
            },

            reset: () => {
                set({ ...initialState });
            },

            /**
             * Initialize auth state on app startup
             * Attempts to get current user if tokens exist
             */
            initialize: async (): Promise<void> => {
                const { isInitializing } = get();

                // Prevent multiple concurrent initialization attempts
                if (isInitializing) {
                    return;
                }

                set({ isInitializing: true, isLoading: true, error: null });

                try {
                    // Try to get current user (will work if valid access token exists)
                    // The API client will automatically refresh the token if needed
                    const response = await authApi.me();

                    set({
                        isAuthenticated: true,
                        user: response.data.user,
                        hasValidTokens: true,
                        lastTokenRefresh: new Date().toISOString(),
                        isLoading: false,
                        isInitializing: false,
                        error: null,
                    });

                    // If user has an active organization stored, re-select it to get proper permissions
                    const { activeOrganization } = get();
                    if (activeOrganization && response.data.user.organizations) {
                        const orgExists = response.data.user.organizations.find(
                            org => org.organizationId === activeOrganization.id
                        );
                        if (orgExists) {
                            // Re-select the organization to get fresh permissions
                            try {
                                await authApi.selectOrganization({ organizationId: activeOrganization.id });
                                // Refresh user data again to get permissions
                                const updatedResponse = await authApi.me();
                                set({ user: updatedResponse.data.user });
                            } catch (selectError) {
                                console.error('Failed to re-select organization:', selectError);
                                // Clear the active organization if selection fails
                                set({
                                    activeOrganization: null,
                                    hasSelectedOrganization: false,
                                });
                            }
                        } else {
                            // Stored organization no longer exists for user
                            set({
                                activeOrganization: null,
                                hasSelectedOrganization: false,
                            });
                        }
                    }
                } catch (error: unknown) {
                    // If initialization fails, the interceptor already tried to refresh
                    // So we can assume the user needs to login
                    console.error('Auth initialization failed:', error);
                    
                    // Don't clear everything - preserve some state for the select-organization page
                    // Check if we have user data in localStorage that we can use temporarily
                    const persistedState = localStorage.getItem('auth-storage');
                    if (persistedState) {
                        try {
                            const parsed = JSON.parse(persistedState);
                            // If we have persisted user data, keep them authenticated
                            // but mark tokens as invalid so they know to re-authenticate
                            if (parsed.state?.user) {
                                set({
                                    isAuthenticated: true,
                                    user: parsed.state.user,
                                    hasValidTokens: false,
                                    isLoading: false,
                                    isInitializing: false,
                                    error: null,
                                });
                                return;
                            }
                        } catch (parseError) {
                            console.error('Failed to parse persisted state:', parseError);
                        }
                    }

                    // No valid persisted state - clear everything
                    set({
                        ...initialState,
                        isLoading: false,
                        isInitializing: false,
                    });
                }
            },
        }),
        {
            name: 'auth-storage', // localStorage key
            storage: createJSONStorage(() => localStorage),

            // Only persist certain fields (not loading states or errors)
            partialize: (state) => ({
                isAuthenticated: state.isAuthenticated,
                user: state.user,
                activeOrganization: state.activeOrganization,
                hasSelectedOrganization: state.hasSelectedOrganization,
                hasValidTokens: state.hasValidTokens,
                tokenExpiresAt: state.tokenExpiresAt,
                lastTokenRefresh: state.lastTokenRefresh,
            }),

            // Rehydrate the store when the app loads
            onRehydrateStorage: () => (state) => {
                if (state) {
                    // Reset loading and error states on rehydration
                    state.isLoading = false;
                    state.error = null;
                }
            },
        }
    )
);

/**
 * Helper hooks for specific auth state
 */

// Get current user
export const useAuthUser = () => useAuthStore((state) => state.user);

// Get authentication status
export const useIsAuthenticated = () => useAuthStore((state) => state.isAuthenticated);

// Get loading state
export const useAuthLoading = () => useAuthStore((state) => state.isLoading);

// Get initialization state
export const useAuthInitializing = () => useAuthStore((state) => state.isInitializing);

// Get error state
export const useAuthError = () => useAuthStore((state) => state.error);

// Get active organization
export const useActiveOrganization = () => useAuthStore((state) => state.activeOrganization);

// Check if user has selected an organization
export const useHasSelectedOrganization = () => useAuthStore((state) => state.hasSelectedOrganization);

// Get token status
export const useHasValidTokens = () => useAuthStore((state) => state.hasValidTokens);

// Get token expiration
export const useTokenExpiresAt = () => useAuthStore((state) => state.tokenExpiresAt);

// Get last token refresh time
export const useLastTokenRefresh = () => useAuthStore((state) => state.lastTokenRefresh);

// Individual action selectors to prevent infinite loops
export const useAuthLogin = () => useAuthStore((state) => state.login);
export const useAuthLogout = () => useAuthStore((state) => state.logout);
export const useAuthSelectOrganization = () => useAuthStore((state) => state.selectOrganization);
export const useAuthClearOrganization = () => useAuthStore((state) => state.clearOrganization);
export const useAuthSetError = () => useAuthStore((state) => state.setError);
export const useAuthClearError = () => useAuthStore((state) => state.clearError);
export const useAuthSetUser = () => useAuthStore((state) => state.setUser);
export const useAuthRefreshUser = () => useAuthStore((state) => state.refreshUser);

// Token management action selectors
export const useAuthSetTokenStatus = () => useAuthStore((state) => state.setTokenStatus);
export const useAuthRefreshTokens = () => useAuthStore((state) => state.refreshTokens);
export const useAuthClearTokens = () => useAuthStore((state) => state.clearTokens);

// Get auth actions - simplified to prevent infinite loops
// WARNING: This can cause infinite loops - use individual selectors above instead
export const useAuthActions = () => useAuthStore((state) => ({
    login: state.login,
    logout: state.logout,
    selectOrganization: state.selectOrganization,
    clearOrganization: state.clearOrganization,
    setUser: state.setUser,
    updateUser: state.updateUser,
    setTokenStatus: state.setTokenStatus,
    refreshTokens: state.refreshTokens,
    clearTokens: state.clearTokens,
    setLoading: state.setLoading,
    setError: state.setError,
    clearError: state.clearError,
    reset: state.reset,
    initialize: state.initialize,
}));

/**
 * Utility function to map UserOrganization to ActiveOrganization
 */
export const mapUserOrgToActiveOrg = (userOrg: UserOrganization): ActiveOrganization => ({
    id: userOrg.organizationId,
    name: userOrg.name,
    slug: userOrg.slug,
    logo: userOrg.logo,
    roleId: userOrg.roleId,
    roleName: userOrg.roleName,
    createdBy: userOrg.createdBy,
});

export default useAuthStore;
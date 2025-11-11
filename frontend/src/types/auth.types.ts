/**
 * User object returned from authentication endpoints
 */
export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  avatar?: string;
}

/**
 * Organization data with user's role in that organization
 */
export interface UserOrganization {
  organizationId: string;
  name: string;
  slug: string;
  logo?: string;
  plan: string;
  roleId: string;
  roleName: string;
  status: 'active' | 'inactive' | 'pending';
  joinedAt: string;
  createdBy: string;
}

/**
 * Permission object
 */
export interface Permission {
  id: string;
  name: string;
  slug: string;
  category: string;
}

/**
 * Current user with all their organizations
 */
export interface AuthUser {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  avatar?: string;
  organizations: UserOrganization[];
  permissions?: Permission[];
}

/**
 * Profile user data with timestamps
 */
export interface ProfileUser {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  avatar?: string;
  createdAt: string;
  updatedAt: string;
  createdBy: string;
}

/**
 * Profile response with user details and organizations
 */
export interface ProfileResponse {
  user: ProfileUser;
  organizations: UserOrganization[];
}

/**
 * Currently selected organization context
 */
export interface ActiveOrganization {
  id: string;
  name: string;
  slug: string;
  logo?: string;
  roleId: string;
  roleName: string;
  createdBy: string;
}

/**
 * Auth state interface
 */
export interface AuthState {
  // Authentication status
  isAuthenticated: boolean;
  isLoading: boolean;
  isInitializing: boolean; // Flag to prevent concurrent initialization
  
  // User data
  user: AuthUser | null;
  
  // Organization context
  activeOrganization: ActiveOrganization | null;
  hasSelectedOrganization: boolean;
  
  // Token status (tokens stored in httpOnly cookies)
  hasValidTokens: boolean;
  tokenExpiresAt: string | null;
  lastTokenRefresh: string | null;
  
  // Error handling
  error: string | null;
}

/**
 * Auth actions interface
 */
export interface AuthActions {
  // Login/logout actions
  login: (user: AuthUser, tokenExpiresAt?: string) => void;
  logout: () => Promise<void>;
  
  // Organization selection
  selectOrganization: (organization: ActiveOrganization) => void;
  clearOrganization: () => void;
  
  // User data management
  setUser: (user: AuthUser) => void;
  updateUser: (updates: Partial<User>) => void;
  refreshUser: () => Promise<void>;
  
  // Token management (for httpOnly cookies)
  setTokenStatus: (hasValidTokens: boolean, expiresAt?: string) => void;
  refreshTokens: () => Promise<boolean>;
  clearTokens: () => void;
  
  // Loading and error states
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  clearError: () => void;
  
  // Utility methods
  reset: () => void;
  initialize: () => Promise<void>;
}

/**
 * Complete auth store interface
 */
export type AuthStore = AuthState & AuthActions;

/**
 * API Response types for auth endpoints
 */
export interface LoginResponse {
  message: string;
  user: User;
  expiresAt?: string; // When the access token expires
}

export interface RegisterResponse {
  message: string;
  user: User;
  expiresAt?: string; // When the access token expires
}

export interface MeResponse {
  user: AuthUser;
}

export interface OrganizationsResponse {
  organizations: UserOrganization[];
}

export interface SelectOrganizationResponse {
  message: string;
  organization: {
    id: string;
    roleId: string;
    roleName: string;
  };
  expiresAt?: string; // New token expiration after org switch
}

export interface RefreshResponse {
  message: string;
  expiresAt?: string; // When the new access token expires
}

export interface LogoutResponse {
  message: string;
}
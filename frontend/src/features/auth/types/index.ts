import type { Permission } from "@/types/auth.types";

// Authentication API Response Types
export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  avatar?: string;
}

export interface Organization {
  id: string;
  name: string;
  slug: string;
  description?: string;
  createdAt: string;
  updatedAt: string;
}

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

// API Response Types
export interface LoginResponse {
  message: string;
  user: User;
}

export interface RegisterResponse {
  message: string;
  user: User;
}

export interface RefreshResponse {
  message: string;
}

export interface LogoutResponse {
  message: string;
}

export interface MeResponse {
  user: User & {
    organizations: UserOrganization[];
    permissions?: Permission[];
  };
}

export interface OrganizationsResponse {
  organizations: UserOrganization[];
}

// Request DTOs
export interface LoginRequest {
  email: string;
  password: string;
  rememberMe?: boolean;
}

export interface RegisterRequest {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  organizationName?: string;
}

export interface SelectOrganizationRequest {
  organizationId: string;
}

export interface SelectOrganizationResponse {
  message: string;
  organization: {
    id: string;
    roleId: string;
    roleName: string;
  };
}

// Google OAuth Response
export interface GoogleOAuthResponse {
  message: string;
  user: User;
  organizations: UserOrganization[];
}

// JWT Payload (for frontend reference only - not used directly)
export interface JwtPayload {
  sub: string; // user id
  email: string;
  organizationId?: string;
  role?: string;
}

// Auth State Types
export interface AuthState {
  user: User | null;
  currentOrganization: Organization | null;
  userOrganizations: UserOrganization[];
  isAuthenticated: boolean;
  isLoading: boolean;
  tokenExpiresAt: number | null;
}

// Auth Action Types
export interface AuthActions {
  login: (user: User) => void;
  logout: () => void;
  selectOrganization: (orgId: string, userOrgs: UserOrganization[]) => void;
  setUser: (user: User) => void;
  setUserOrganizations: (userOrgs: UserOrganization[]) => void;
  setLoading: (loading: boolean) => void;
  setTokenExpiresAt: (expiresAt: number | null) => void;
  clearTokenExpiration: () => void;
}

// Hook Return Types
export interface UseAuthReturn extends AuthState {
  // Mutations
  loginMutation: {
    mutate: (data: LoginRequest) => void;
    isPending: boolean;
    error: Error | null;
  };
  registerMutation: {
    mutate: (data: RegisterRequest) => void;
    isPending: boolean;
    error: Error | null;
  };
  logoutMutation: {
    mutate: () => void;
    isPending: boolean;
    error: Error | null;
  };
  selectOrgMutation: {
    mutate: (data: SelectOrganizationRequest) => void;
    isPending: boolean;
    error: Error | null;
  };
  
  // Queries
  meQuery: {
    data: MeResponse | undefined;
    isLoading: boolean;
    error: Error | null;
    refetch: () => void;
  };
  
  // Actions
  actions: AuthActions;
  
  // Utilities
  isTokenExpired: boolean;
  timeUntilExpiry: number | null;
}
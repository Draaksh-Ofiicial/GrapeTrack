import apiClient from './apiClient';
import type {
  LoginResponse,
  RegisterResponse,
  MeResponse,
  OrganizationsResponse,
  SelectOrganizationResponse,
  RefreshResponse,
  LogoutResponse,
  ProfileResponse,
} from '../../types/auth.types';

/**
 * Authentication API service
 * All auth-related API calls using the configured axios client
 */
export const authApi = {
  /**
   * Register a new user
   */
  register: async (data: {
    email: string;
    password: string;
    firstName: string;
    lastName: string;
  }) => {
    const response = await apiClient.post<RegisterResponse>('/auth/register', data);
    return response.data;
  },

  /**
   * Login with email and password
   */
  login: async (data: { email: string; password: string; rememberMe?: boolean }) => {
    const response = await apiClient.post<LoginResponse>('/auth/login', data);
    return response.data;
  },

  /**
   * Logout user and revoke refresh tokens
   */
  logout: async () => {
    const response = await apiClient.post<LogoutResponse>('/auth/logout');
    return response.data;
  },

  /**
   * Refresh access token using httpOnly refresh token cookie
   */
  refresh: async () => {
    const response = await apiClient.post<RefreshResponse>('/auth/refresh');
    return response.data;
  },

  /**
   * Get current user data with all organizations
   */
  me: async () => {
    const response = await apiClient.get<MeResponse>('/auth/me');
    return response.data;
  },

  /**
   * Get list of user's organizations
   */
  organizations: async () => {
    const response = await apiClient.get<OrganizationsResponse>('/auth/organizations');
    return response.data;
  },

  /**
   * Get list of user's organizations (alias for compatibility)
   */
  getOrganizations: async () => {
    const response = await apiClient.get<OrganizationsResponse>('/auth/organizations');
    return response.data;
  },

  /**
   * Select/switch to a specific organization
   */
  selectOrganization: async (organizationId: string) => {
    const response = await apiClient.post<SelectOrganizationResponse>(
      '/auth/select-organization',
      { organizationId }
    );
    return response.data;
  },

  /**
   * Initiate Google OAuth flow
   * This will redirect to Google login page
   */
  googleAuth: () => {
    const baseUrl = import.meta.env.VITE_API_URL || '/api';
    window.location.href = `${baseUrl}/auth/google`;
  },

  /**
   * Get comprehensive user profile information
   */
  profile: async () => {
    const response = await apiClient.get<ProfileResponse>('/auth/profile');
    return response.data;
  },
};

export default authApi;
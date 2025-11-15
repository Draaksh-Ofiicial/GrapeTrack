import apiClient from '@/lib/api/apiClient';
import type {
  LoginRequest,
  LoginResponse,
  RegisterRequest,
  RegisterResponse,
  RefreshResponse,
  LogoutResponse,
  MeResponse,
  OrganizationsResponse,
  SelectOrganizationRequest,
  SelectOrganizationResponse,
  GoogleOAuthResponse,
} from '../types';

export const authApi = {
  // Email/Password Authentication
  login: (data: LoginRequest) =>
    apiClient.post<LoginResponse>('/auth/login', data),

  register: (data: RegisterRequest) =>
    apiClient.post<RegisterResponse>('/auth/register', data),

  logout: () =>
    apiClient.post<LogoutResponse>('/auth/logout'),

  refresh: () =>
    apiClient.post<RefreshResponse>('/auth/refresh'),

  // User Information
  me: () =>
    apiClient.get<MeResponse>('/auth/me'),

  // Organization Management
  getOrganizations: () =>
    apiClient.get<OrganizationsResponse>('/auth/organizations'),

  selectOrganization: (data: SelectOrganizationRequest) =>
    apiClient.post<SelectOrganizationResponse>('/auth/select-organization', data),

  // Google OAuth
  googleAuth: () =>
    apiClient.get('/auth/google'),

  googleCallback: (code: string) =>
    apiClient.get<GoogleOAuthResponse>(`/auth/google/callback?code=${code}`),
};

export default authApi;
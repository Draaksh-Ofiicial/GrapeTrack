import apiClient from '@/lib/api/apiClient';

export interface Organization {
  id: string;
  name: string;
  slug: string;
  description?: string;
  logo?: string;
  website?: string;
  plan: string;
  maxUsers: string;
  createdBy: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface OrganizationWithRole extends Organization {
  userRole: {
    id: string;
    name: string;
    slug: string;
  };
}

export interface OrganizationMember {
  userId: string;
  email: string;
  firstName: string;
  lastName: string;
  avatar?: string;
  roleId: string;
  roleName: string;
  status: string;
  joinedAt?: string;
  invitedAt?: string;
}

export interface CreateOrganizationDto {
  name: string;
  slug: string;
  description?: string;
  logo?: string;
  website?: string;
  plan?: string;
  maxUsers?: string;
}

export interface InviteMemberDto {
  email: string;
  roleId: string;
}

export interface GenerateSlugDto {
  name: string;
}

export interface GenerateSlugResponse {
  slug: string;
  isAvailable: boolean;
}

export const organizationsApi = {
  // Organization CRUD
  getAll: () => apiClient.get<Organization[]>('/organizations'),

  getById: (id: string) =>
    apiClient.get<OrganizationWithRole>(`/organizations/${id}`),

  getBySlug: (slug: string) =>
    apiClient.get<Organization>(`/organizations/slug/${slug}`),

  create: (data: CreateOrganizationDto) =>
    apiClient.post<Organization>('/organizations', data),

  generateSlug: (data: GenerateSlugDto) =>
    apiClient.post<GenerateSlugResponse>('/organizations/generate-slug', data),

  update: (id: string, data: Partial<CreateOrganizationDto>) =>
    apiClient.patch<Organization>(`/organizations/${id}`, data),

  delete: (id: string) => apiClient.delete(`/organizations/${id}`),

  // Organization deletion
  initiateDelete: (id: string, dto: { organizationId: string }) =>
    apiClient.post(`/organizations/${id}/delete/initiate`, dto),

  confirmDelete: (id: string, dto: { token: string }) =>
    apiClient.post(`/organizations/${id}/delete/confirm`, {'organizationId': id, ...dto}),

  // Member management
  getMembers: (orgId: string) =>
    apiClient.get<OrganizationMember[]>(`/organizations/${orgId}/members`),

  inviteMember: (orgId: string, data: InviteMemberDto) =>
    apiClient.post(`/organizations/${orgId}/invite`, data),

  removeMember: (orgId: string, userId: string) =>
    apiClient.delete(`/organizations/${orgId}/members/${userId}`),

  updateMemberRole: (orgId: string, userId: string, roleId: string) =>
    apiClient.patch(`/organizations/${orgId}/members/${userId}/role`, {
      roleId,
    }),

  updateMemberStatus: (orgId: string, userId: string, status: string) =>
    apiClient.patch(`/organizations/${orgId}/members/${userId}/status`, {
      status,
    }),

  getMemberRole: (orgId: string, userId: string) =>
    apiClient.get(`/organizations/${orgId}/members/${userId}/role`),
};

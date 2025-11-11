import apiClient from '@/lib/api/apiClient';

export interface OrganizationMember {
  userId: string;
  email: string;
  firstName: string;
  lastName: string;
  avatar?: string;
  roleId: string;
  roleName: string;
  roleSlug: string;
  status: string;
  joinedAt: string;
}

export const usersApi = {
  getOrganizationMembers: async (organizationId: string): Promise<OrganizationMember[]> => {
    const response = await apiClient.get<OrganizationMember[]>(`/organizations/${organizationId}/members`);
    return response.data;
  },
};
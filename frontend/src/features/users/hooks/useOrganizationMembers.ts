import { useQuery } from '@tanstack/react-query';
import { usersApi, type OrganizationMember } from '../api/usersApi';

export const useOrganizationMembers = (organizationId: string) => {
  return useQuery<OrganizationMember[]>({
    queryKey: ['organization-members', organizationId],
    queryFn: () => usersApi.getOrganizationMembers(organizationId),
    enabled: !!organizationId,
  });
};
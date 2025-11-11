import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/hooks/useAuth';
import { invitationsApi } from '@/features/organizations/api/invitationsApi';

/**
 * Hook to get the count of pending invitations for the current organization
 * Used for displaying badge count in the sidebar
 */
export const usePendingInvitationsCount = () => {
  const { activeOrganization } = useAuth();
  const orgId = activeOrganization?.id;

  const { data: response } = useQuery({
    queryKey: ['pending-invitations', orgId],
    queryFn: () => invitationsApi.getPending(orgId || ''),
    enabled: !!orgId,
  });

  const invitations = response?.data || [];
  return invitations.length;
};

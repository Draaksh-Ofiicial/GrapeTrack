import { useQuery } from '@tanstack/react-query';
import apiClient from '@/lib/api/apiClient';

export interface PendingInvitation {
  id: string;
  email: string;
  organizationId: string;
  roleName: string;
  invitedAt: string;
  expiresAt: string;
  invitedBy: string;
  inviterName: string;
}

export const invitationsApi = {
  getPending: (orgId: string) =>
    apiClient.get<PendingInvitation[]>(`/organizations/${orgId}/invitations/pending`),

  resendInvitation: (orgId: string, invitationId: string) =>
    apiClient.post(`/organizations/${orgId}/invitations/${invitationId}/resend`, {}),

  revokeInvitation: (orgId: string, invitationId: string) =>
    apiClient.delete(`/organizations/${orgId}/invitations/${invitationId}`),
};

export const usePendingInvitations = (orgId: string) => {
  return useQuery({
    queryKey: ['pending-invitations', orgId],
    queryFn: () => invitationsApi.getPending(orgId),
  });
};

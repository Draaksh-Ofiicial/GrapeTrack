import { useState } from 'react';
import { motion } from 'framer-motion';
import { useAuth } from '@/hooks/useAuth';
import { usePendingInvitations } from '@/features/organizations/api/invitationsApi';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Mail, Trash2, RotateCcw, Calendar } from 'lucide-react';
import { toast } from 'sonner';
import apiClient from '@/lib/api/apiClient';

export default function InvitationsPage() {
  const { activeOrganization } = useAuth();
  const [isDeleting, setIsDeleting] = useState<string | null>(null);
  const [isResending, setIsResending] = useState<string | null>(null);

  const orgId = activeOrganization?.id;
  const { data: response, isLoading, refetch } = usePendingInvitations(orgId || '');
  const invitations = response?.data || [];

  if (!orgId) {
    return (
      <div className="space-y-4">
        <Alert variant="destructive">
          <AlertDescription>Organization context not found. Please select an organization.</AlertDescription>
        </Alert>
      </div>
    );
  }

  const handleResendInvitation = async (invitationId: string, email: string) => {
    setIsResending(invitationId);
    try {
      await apiClient.post(`/organizations/${orgId}/invitations/${invitationId}/resend`, {});
      toast.success(`Invitation resent to ${email}`);
      refetch();
    } catch (error) {
      toast.error('Failed to resend invitation');
      console.error(error);
    } finally {
      setIsResending(null);
    }
  };

  const handleRevokeInvitation = async (invitationId: string, email: string) => {
    if (!confirm(`Are you sure you want to revoke the invitation for ${email}?`)) {
      return;
    }

    setIsDeleting(invitationId);
    try {
      await apiClient.delete(`/organizations/${orgId}/invitations/${invitationId}`);
      toast.success(`Invitation revoked for ${email}`);
      refetch();
    } catch (error) {
      toast.error('Failed to revoke invitation');
      console.error(error);
    } finally {
      setIsDeleting(null);
    }
  };

  return (
    <div className="space-y-6 pb-10">
      {/* Header Section */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        <h1 className="text-4xl font-bold text-foreground">Pending Invitations</h1>
        <p className="text-muted-foreground mt-1">
          Manage team member invitations and track their status
        </p>
      </motion.div>

      {/* Content */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1, duration: 0.3 }}
      >

      {isLoading ? (
        <div className="flex justify-center items-center py-12">
          <div className="text-gray-500">Loading invitations...</div>
        </div>
      ) : !invitations || invitations.length === 0 ? (
        <Card>
          <CardContent className="pt-6">
            <div className="text-center py-8">
              <Mail className="mx-auto h-12 w-12 text-gray-400 mb-4" />
              <p className="text-gray-600">No pending invitations</p>
              <p className="text-sm text-gray-500 mt-1">All team members have accepted their invitations</p>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {invitations.map((invitation, index) => {
            const isExpired = new Date(invitation.expiresAt) < new Date();
            const daysUntilExpiry = Math.ceil(
              (new Date(invitation.expiresAt).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)
            );

            return (
              <motion.div
                key={invitation.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1, duration: 0.3 }}
              >
                <Card key={invitation.id} className={isExpired ? 'opacity-60' : ''}>
                <CardContent>
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-3">
                        <Mail className="h-5 w-5 text-blue-500" />
                        <div>
                          <p className="font-medium">{invitation.email}</p>
                          <p className="text-sm text-gray-600">Role: {invitation.roleName}</p>
                        </div>
                      </div>

                      <div className="mt-4 grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <p className="text-gray-600">Invited by</p>
                          <p className="font-medium">{invitation.inviterName}</p>
                        </div>
                        <div>
                          <p className="text-gray-600 flex items-center gap-1">
                            <Calendar className="h-4 w-4" />
                            Invited on {new Date(invitation.invitedAt).toLocaleDateString()}
                          </p>
                        </div>
                      </div>

                      <div className="mt-3">
                        {isExpired ? (
                          <div className="text-xs bg-red-100 text-red-700 px-2 py-1 rounded w-fit">
                            Expired on {new Date(invitation.expiresAt).toLocaleDateString()}
                          </div>
                        ) : (
                          <div className="text-xs bg-yellow-100 text-yellow-700 px-2 py-1 rounded w-fit">
                            Expires in {daysUntilExpiry} days
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="flex gap-2 flex-col">
                      <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleResendInvitation(invitation.id, invitation.email)}
                          disabled={isResending === invitation.id || isExpired}
                          className="flex items-center gap-2"
                        >
                          <RotateCcw className="h-4 w-4" />
                          {isResending === invitation.id ? 'Resending...' : 'Resend'}
                        </Button>
                      </motion.div>
                      <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() => handleRevokeInvitation(invitation.id, invitation.email)}
                          disabled={isDeleting === invitation.id}
                          className="flex items-center gap-2"
                        >
                          <Trash2 className="h-4 w-4" />
                          {isDeleting === invitation.id ? 'Revoking...' : 'Revoke'}
                        </Button>
                      </motion.div>
                    </div>
                  </div>
                </CardContent>
              </Card>
              </motion.div>
            );
          })}
        </div>
      )}
    </motion.div>
    </div>
  );
}

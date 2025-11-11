import { useState } from 'react';
import { motion } from 'framer-motion';
import { useOrganizationMembers } from '../hooks/useOrganizationMembers';
import { useAuth } from '@/hooks/useAuth';
import { useRoles } from '@/features/organizations/hooks/useRoles';
import { useInviteMember, useUpdateMemberRole, useRemoveMember } from '@/features/organizations/hooks/useOrganizations';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Users, Mail, Calendar, Shield, UserPlus, Trash2 } from 'lucide-react';
import InviteUserModal from '../components/InviteUserModal';
import { toast } from 'sonner';

export default function UsersPage() {
  const { activeOrganization } = useAuth();
  const [isInviteModalOpen, setIsInviteModalOpen] = useState(false);

  const { data: members, isLoading, error } = useOrganizationMembers(activeOrganization?.id || '');
  const { data: roles } = useRoles(activeOrganization?.id || '');
  const inviteMember = useInviteMember(activeOrganization?.id || '');
  const updateMemberRole = useUpdateMemberRole(activeOrganization?.id || '');
  const removeMember = useRemoveMember(activeOrganization?.id || '');

  const isAdmin = activeOrganization?.roleName === 'Admin';

  if (!activeOrganization) {
    return (
      <div className="text-center py-8">
        <p className="text-gray-500">No organization selected</p>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Team Members</h1>
          <p className="text-gray-600">Manage your organization's team members</p>
        </div>
        <div className="animate-pulse">
          {[...Array(3)].map((_, i) => (
            <Card key={i} className="mb-4">
              <CardContent className="p-6">
                <div className="flex items-center space-x-4">
                  <div className="h-12 w-12 bg-gray-200 rounded-full"></div>
                  <div className="flex-1 space-y-2">
                    <div className="h-4 bg-gray-200 rounded w-1/4"></div>
                    <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Team Members</h1>
          <p className="text-gray-600">Manage your organization's team members</p>
        </div>
        <Card>
          <CardContent className="p-6">
            <p className="text-red-600">Failed to load team members. Please try again.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <motion.div className="space-y-6 pb-10">
      {/* Header Section with Better Visual Hierarchy */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between"
      >
        <div className="space-y-2">
          <h1 className="text-4xl font-bold text-foreground">Team Members</h1>
          <p className="text-muted-foreground">Manage your organization's team members</p>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Users className="h-4 w-4" />
            {members?.length || 0} members
          </div>
          {isAdmin && (
            <motion.div
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <Button onClick={() => setIsInviteModalOpen(true)}>
                <UserPlus className="h-4 w-4 mr-2" />
                Invite User
              </Button>
            </motion.div>
          )}
        </div>
      </motion.div>

      {/* Members Grid */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1, duration: 0.3 }}
        className="grid gap-4"
      >
        {members?.map((member) => (
          <Card key={member.userId} className="hover:shadow-md transition-shadow">
            <CardContent>
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <Avatar className="h-12 w-12">
                    <AvatarImage src={member.avatar} />
                    <AvatarFallback>
                      {member.firstName?.[0]}{member.lastName?.[0]}
                    </AvatarFallback>
                  </Avatar>

                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-medium text-gray-900">
                        {member.firstName} {member.lastName}
                      </h3>
                      {member.status === 'active' ? (
                        <Badge variant="default" className="text-xs">
                          Active
                        </Badge>
                      ) : (
                        <Badge variant="secondary" className="text-xs">
                          {member.status}
                        </Badge>
                      )}
                    </div>

                    <div className="flex items-center gap-4 text-sm text-gray-500">
                      <div className="flex items-center gap-1">
                        <Mail className="h-3 w-3" />
                        {member.email}
                      </div>
                      <div className="flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        Joined {new Date(member.joinedAt).toLocaleDateString()}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  {isAdmin && member.userId !== activeOrganization.createdBy && (
                    <>
                      <div className="flex items-center gap-2">
                        <Shield className="h-3 w-3 text-gray-400" />
                        <Select
                          value={member.roleId}
                          onValueChange={(roleId) => {
                            updateMemberRole.mutate({
                              userId: member.userId,
                              roleId,
                            });
                          }}
                          disabled={updateMemberRole.isPending}
                          key={`role-${member.userId}-${member.roleId}`} // Force re-render when roleId changes
                        >
                          <SelectTrigger className="w-32 h-8">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {roles?.map((role) => (
                              <SelectItem key={role.id} value={role.id}>
                                {role.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => {
                          if (confirm(`Are you sure you want to remove ${member.firstName} ${member.lastName} from the organization?`)) {
                            removeMember.mutate(member.userId);
                          }
                        }}
                        disabled={removeMember.isPending}
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </>
                  )}
                  {!isAdmin && (
                    <Badge variant="outline" className="flex items-center gap-1">
                      <Shield className="h-3 w-3" />
                      {member.roleName}
                    </Badge>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}

        {(!members || members.length === 0) && (
          <Card>
            <CardContent className="p-6 text-center">
              <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No team members yet</h3>
              <p className="text-gray-500 mb-4">Invite team members to start collaborating on tasks.</p>
              {isAdmin && (
                <Button onClick={() => setIsInviteModalOpen(true)}>
                  <UserPlus className="h-4 w-4 mr-2" />
                  Invite First Member
                </Button>
              )}
            </CardContent>
          </Card>
        )}
      </motion.div>

      {/* Invite User Modal */}
      <InviteUserModal
        isOpen={isInviteModalOpen}
        isLoading={inviteMember.isPending}
        onClose={() => setIsInviteModalOpen(false)}
        onSubmit={(data) => {
          inviteMember.mutate(data, {
            onSuccess: () => {
              setIsInviteModalOpen(false);
            },
            onError(error: unknown) {
              toast.error((error as { response?: { data?: { message?: string } } })?.response?.data?.message || (error as Error).message || 'Failed to invite user');
            },
          });
        }}
        orgId={activeOrganization.id}
      />
    </motion.div>
  );
}
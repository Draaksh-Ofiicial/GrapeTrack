import { useState } from 'react';
import { motion } from 'framer-motion';
import { useAuth } from '@/hooks/useAuth';
import {
  useRoles,
  usePermissions,
  useCreateRole,
  useUpdateRole,
  useDeleteRole,
  useAssignPermissions,
} from '@/features/organizations/hooks/useRoles';
import { Alert, AlertDescription } from '@/components/ui/alert';
import RolesTab from '../components/RolesTab';
import PermissionsTab from '../components/PermissionsTab';
import { Button } from '@/components/ui/button';

export default function RolesPermissionsPage() {
  const { activeOrganization } = useAuth();
  const [activeTab, setActiveTab] = useState<'roles' | 'permissions'>('roles');

  // Get current organization from user
  const currentOrg = activeOrganization;
  const orgId = currentOrg?.id;

  // Check if user is admin (only admins can manage roles)
  const isAdmin = currentOrg?.roleName === 'Admin';

  // Fetch data
  // Note: Roles are organization-specific, but Permissions are global/system-wide
  const { data: roles, isLoading: rolesLoading, error: rolesError } = useRoles(
    orgId || ''
  );
  const {
    data: permissions,
    isLoading: permissionsLoading,
    error: permissionsError,
  } = usePermissions(orgId || ''); // Permissions are global but endpoint requires org context

  // Mutations
  const createRole = useCreateRole(orgId || '');
  const updateRole = useUpdateRole(orgId || '');
  const deleteRole = useDeleteRole(orgId || '');
  const assignPermissions = useAssignPermissions(orgId || '');

  if (!orgId) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Alert variant="destructive">
          <AlertDescription>Organization not found</AlertDescription>
        </Alert>
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Alert variant="destructive">
          <AlertDescription>
            You do not have permission to manage roles and permissions
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-10">
      {/* Header Section */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        <h1 className="text-4xl font-bold tracking-tight text-foreground">Roles & Permissions</h1>
        <p className="text-muted-foreground mt-2">
          Manage organization roles and permissions
        </p>
      </motion.div>

      {/* Error Alerts */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1, duration: 0.3 }}
      >
        {rolesError && (
          <Alert variant="destructive">
            <AlertDescription>
              Failed to load roles. Please try again.
            </AlertDescription>
          </Alert>
        )}

        {permissionsError && (
          <Alert variant="destructive">
            <AlertDescription>
              Failed to load permissions. Please try again.
            </AlertDescription>
          </Alert>
        )}
      </motion.div>

      {/* Tabs */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2, duration: 0.3 }}
        className="border-b border-gray-200 pb-3"
      >
        <div className="flex space-x-8">
          <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
            <Button
              onClick={() => setActiveTab('roles')}
              variant={'ghost'}
              className={`rounded-b-none py-4 border-b-2 font-medium text-sm ${activeTab === 'roles' ? 'border-blue-500 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
            >
              Roles
            </Button>
          </motion.div>
          <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
            <Button
              onClick={() => setActiveTab('permissions')}
              variant={'ghost'}
              className={`rounded-b-none py-4 border-b-2 font-medium text-sm ${activeTab === 'permissions' ? 'border-blue-500 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
            >
              Permissions Matrix
            </Button>
          </motion.div>
        </div>
      </motion.div>

      {/* Tab Content */}
      {activeTab === 'roles' && (
        <RolesTab
          roles={roles || []}
          isLoading={rolesLoading}
          permissions={permissions || []}
          onCreateRole={(data) => {
            // Extract permissionIds if present and handle via separate mutation
            const { permissionIds, ...roleData } = data;
            createRole.mutate(roleData, {
              onSuccess: (response) => {
                // If permissions were selected, assign them to the newly created role
                if (permissionIds && permissionIds.length > 0 && response.data?.id) {
                  assignPermissions.mutate({
                    roleId: response.data.id,
                    permissionIds,
                  });
                }
              },
            });
          }}
          onUpdateRole={updateRole.mutate}
          onDeleteRole={deleteRole.mutate}
          isCreating={createRole.isPending}
          isUpdating={updateRole.isPending}
          isDeleting={deleteRole.isPending}
        />
      )}

      {activeTab === 'permissions' && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3, duration: 0.3 }}
        >
          <PermissionsTab
            roles={roles || []}
            permissions={permissions || []}
            isLoading={permissionsLoading || rolesLoading}
            onAssignPermissions={assignPermissions.mutate}
            isUpdating={assignPermissions.isPending}
          />
        </motion.div>
      )}
    </div>
  );
}

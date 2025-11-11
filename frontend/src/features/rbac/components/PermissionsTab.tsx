import { motion } from 'framer-motion';
import type { Role, Permission } from '@/features/organizations/api/rolesApi';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface PermissionsTabProps {
  roles: Role[];
  permissions: Permission[];
  isLoading: boolean;
  onAssignPermissions: (data: {
    roleId: string;
    permissionIds: string[];
  }) => void;
  isUpdating: boolean;
}

export default function PermissionsTab({
  roles,
  permissions,
  isLoading,
  onAssignPermissions,
  isUpdating,
}: PermissionsTabProps) {
  const customRoles = roles.filter((role) => !role.isSystemRole);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <p className="text-gray-500">Loading permissions...</p>
      </div>
    );
  }

  if (permissions.length === 0) {
    return (
      <Alert>
        <AlertDescription>
          No permissions available for this organization.
        </AlertDescription>
      </Alert>
    );
  }

  // Group permissions by category
  const permissionsByCategory = permissions.reduce(
    (acc, perm) => {
      const category = perm.category || 'Other';
      if (!acc[category]) {
        acc[category] = [];
      }
      acc[category].push(perm);
      return acc;
    },
    {} as Record<string, Permission[]>
  );

  return (
    <div className="space-y-6">
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        <h3 className="text-lg font-semibold mb-4">Permission Matrix</h3>
        <p className="text-sm text-gray-600 mb-6">
          Click to toggle permissions for each custom role
        </p>
      </motion.div>

      {customRoles.length === 0 ? (
        <Alert>
          <AlertDescription>
            No custom roles available. Create a custom role to assign permissions.
          </AlertDescription>
        </Alert>
      ) : (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1, duration: 0.3 }}
          className="overflow-x-auto"
        >
          <table className="w-full border-collapse">
            <thead>
              <tr className="border-b border-gray-200">
                <th className="px-4 py-3 text-left font-semibold text-gray-700 sticky left-0 bg-white z-10 min-w-48">
                  Permission
                </th>
                {customRoles.map((role) => (
                  <th
                    key={role.id}
                    className="px-4 py-3 text-center font-semibold text-gray-700 whitespace-nowrap"
                  >
                    <div className="text-sm">{role.name}</div>
                    <div className="text-xs text-gray-500">
                      ({role.permissions?.length || 0})
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {Object.entries(permissionsByCategory).map(([, perms]) =>
                perms.map((perm, index) => (
                  <motion.tr
                    key={perm.id}
                    className="border-b border-gray-100 hover:bg-gray-50"
                    initial={{ opacity: 0, x: -20 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.2, delay: 0.1 * index }}
                    viewport={{ once: true, amount: 0.1 }} // optional config
                  >
                    <td className="px-4 py-3 font-medium text-gray-700 sticky left-0 bg-white z-10">
                      <div>
                        <div className="text-sm">{perm.name}</div>
                        <div className="text-xs text-gray-500">{perm.slug}</div>
                      </div>
                    </td>
                    {customRoles.map((role) => {
                      const hasPermission = role.permissions?.some(
                        (p) => p.id === perm.id
                      );

                      return (
                        <td
                          key={`${role.id}-${perm.id}`}
                          className="px-4 py-3 text-center"
                        >
                          <motion.input
                            type="checkbox"
                            checked={hasPermission || false}
                            onChange={(e) => {
                              const currentPerms =
                                role.permissions?.map((p) => p.id) || [];
                              let newPerms: string[];

                              if (e.target.checked) {
                                newPerms = [...currentPerms, perm.id];
                              } else {
                                newPerms = currentPerms.filter(
                                  (id) => id !== perm.id
                                );
                              }

                              if (newPerms.length === 0) {
                                alert('Role must have at least 1 permission');
                                return;
                              }

                              onAssignPermissions({
                                roleId: role.id,
                                permissionIds: newPerms,
                              });
                            }}
                            disabled={isUpdating}
                            className="w-4 h-4 cursor-pointer"
                            whileHover={{ scale: 1.1 }}
                            whileTap={{ scale: 0.9 }}
                          />
                        </td>
                      );
                    })}
                  </motion.tr>
                ))
              )}
            </tbody>
          </table>
        </motion.div>
      )}
    </div>
  );
}

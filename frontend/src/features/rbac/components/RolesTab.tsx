import { useState } from 'react';
import { motion } from 'framer-motion';
import type { Role, CreateRoleDto, UpdateRoleDto, Permission } from '@/features/organizations/api/rolesApi';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import CreateRoleModal from '@/features/organizations/components/CreateRoleModal';
import EditRoleModal from '@/features/organizations/components/EditRoleModal';

interface RolesTabProps {
    roles: Role[];
    isLoading: boolean;
    onCreateRole: (data: CreateRoleDto & { permissionIds?: string[] }) => void;
    onUpdateRole: (data: { roleId: string; data: UpdateRoleDto }) => void;
    onDeleteRole: (roleId: string) => void;
    isCreating: boolean;
    isUpdating: boolean;
    isDeleting: boolean;
    permissions?: Permission[];
}

export default function RolesTab({
    roles,
    isLoading,
    onCreateRole,
    onUpdateRole,
    onDeleteRole,
    isCreating,
    isUpdating,
    isDeleting,
    permissions = [],
}: RolesTabProps) {
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [selectedRole, setSelectedRole] = useState<Role | null>(null);

    const handleEditClick = (role: Role) => {
        setSelectedRole(role);
        setIsEditModalOpen(true);
    };

    const handleDeleteClick = (roleId: string) => {
        if (
            confirm(
                'Are you sure you want to delete this role? Users with this role will be affected.'
            )
        ) {
            onDeleteRole(roleId);
        }
    };

    const customRoles = roles.filter((role) => !role.isSystemRole);

    if (isLoading) {
        return (
            <div className="flex items-center justify-center py-12">
                <p className="text-gray-500">Loading roles...</p>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Create Role Button */}
            <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
                className="flex justify-between"
            >
                <div>
                    <h3 className="text-lg font-semibold">Roles</h3>
                </div>
                <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                    <Button onClick={() => setIsCreateModalOpen(true)}>
                        + Create Role
                    </Button>
                </motion.div>
            </motion.div>

            {/* Custom Roles Section */}
            <div>
                {customRoles.length === 0 ? (
                    <Alert>
                        <AlertDescription>
                            No custom roles yet. Create one to get started.
                        </AlertDescription>
                    </Alert>
                ) : (
                    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                        {customRoles.map((role, index) => (
                            <motion.div
                                key={role.id}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: index * 0.1, duration: 0.3 }}
                            >
                                <Card>
                                    <CardHeader>
                                        <CardTitle className="text-base">{role.name}</CardTitle>
                                    </CardHeader>
                                    <CardContent>
                                        <p className="text-sm text-gray-600 mb-4">
                                            {role.description || 'No description'}
                                        </p>
                                        <div className="mb-4">
                                            <p className="text-xs font-semibold text-gray-500 mb-2">
                                                Permissions ({role.permissions?.length || 0})
                                            </p>
                                            <div className="flex flex-wrap gap-1">
                                                {role.permissions?.slice(0, 3).map((perm) => (
                                                    <span
                                                        key={perm.id}
                                                        className="text-xs px-2 py-1 bg-blue-100 text-blue-700 rounded"
                                                    >
                                                        {perm.name}
                                                    </span>
                                                ))}
                                                {(role.permissions?.length || 0) > 3 && (
                                                    <span className="text-xs px-2 py-1 bg-gray-100 text-gray-600 rounded">
                                                        +{(role.permissions?.length || 0) - 3} more
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                        <div className="flex gap-2">
                                            <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                                                <Button
                                                    variant="secondary"
                                                    size="sm"
                                                    onClick={() => handleEditClick(role)}
                                                    disabled={isUpdating}
                                                >
                                                    Edit
                                                </Button>
                                            </motion.div>
                                            <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                                                <Button
                                                    variant="destructive"
                                                    size="sm"
                                                    onClick={() => handleDeleteClick(role.id)}
                                                    disabled={isDeleting}
                                                >
                                                    Delete
                                                </Button>
                                            </motion.div>
                                        </div>
                                    </CardContent>
                                </Card>
                            </motion.div>
                        ))}
                    </div>
                )}
            </div>

            {/* Modals */}
            {isCreateModalOpen && (
                <CreateRoleModal
                    isOpen={isCreateModalOpen}
                    isLoading={isCreating}
                    onClose={() => setIsCreateModalOpen(false)}
                    permissions={permissions}
                    onSubmit={(data) => {
                        onCreateRole(data);
                        setIsCreateModalOpen(false);
                    }}
                />
            )}

            {isEditModalOpen && selectedRole && (
                <EditRoleModal
                    role={selectedRole}
                    isOpen={isEditModalOpen}
                    isLoading={isUpdating}
                    onClose={() => {
                        setIsEditModalOpen(false);
                        setSelectedRole(null);
                    }}
                    onSubmit={(data: UpdateRoleDto) => {
                        onUpdateRole({ roleId: selectedRole.id, data });
                        setIsEditModalOpen(false);
                        setSelectedRole(null);
                    }}
                />
            )}
        </div>
    );
}

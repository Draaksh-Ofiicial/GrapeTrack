import { useState } from 'react';
import { motion } from 'framer-motion';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Users, Settings, Shield, Trash2, AlertTriangle, Loader2 } from 'lucide-react';
import { Link } from 'react-router-dom';
import { toast } from 'sonner';
import apiClient from '@/lib/api/apiClient';

export default function OrganizationSettingsPage() {
    const { activeOrganization, user, refreshUser } = useAuth();
    const [confirmationText, setConfirmationText] = useState('');
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
    const queryClient = useQueryClient();

    const initiateDeleteMutation = useMutation({
        mutationFn: async (data: { organizationId: string; confirmationText: string }) => {
            const response = await apiClient.post(`/organizations/${data.organizationId}/delete/initiate`, {
                confirmationText: data.confirmationText,
                organizationId: data.organizationId,
            });
            return response.data;
        },
        onSuccess: () => {
            toast.success('Organization deletion initiated. Please check your email to confirm.');
            setShowDeleteConfirm(false);
            setConfirmationText('');
            queryClient.invalidateQueries({ queryKey: ['profile'] });
            refreshUser(); // Refresh auth store
        },
        onError: (error: unknown) => {
            console.error('Failed to initiate deletion:', error);

            // Handle axios error response from apiClient
            const axiosError = error as { response?: { data?: Record<string, unknown> } };
            if (axiosError.response?.data) {
                const errorData = axiosError.response.data;

                // Handle validation errors structure
                if (errorData?.field && errorData?.errors && Array.isArray(errorData.errors)) {
                    const errorMessage = `${String(errorData.field)}: ${errorData.errors.join(', ')}`;
                    toast.error(errorMessage);
                } else if (errorData?.message && typeof errorData.message === 'string') {
                    toast.error(errorData.message);
                } else {
                    toast.error('Validation failed. Please check your input.');
                }
            } else if (error instanceof Error) {
                toast.error(error.message);
            } else {
                toast.error('Failed to initiate deletion. Please try again.');
            }
        },
    });

    if (!activeOrganization) {
        return (
            <div className="text-center py-8">
                <p className="text-gray-500">No organization selected</p>
            </div>
        );
    }

    const isAdmin = user?.organizations.find(org => org.organizationId === activeOrganization.id)?.roleName === 'Admin';

    const handleDeleteOrganization = () => {
        setShowDeleteConfirm(true);
    };

    return (
        <div className="space-y-6">
            {/* Header Section */}
            <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
            >
                <h1 className="text-2xl font-bold text-gray-900">Organization Settings</h1>
                <p className="text-gray-600">Manage your organization's details and preferences</p>
            </motion.div>

            {/* Organization Overview */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1, duration: 0.3 }}
            >
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <motion.div
                                animate={{ rotate: [0, 360] }}
                                transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
                            >
                                <Settings className="h-5 w-5" />
                            </motion.div>
                            Organization Details
                        </CardTitle>
                        <CardDescription>
                            Basic information about your organization
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <motion.div
                                initial={{ opacity: 0, x: -20 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: 0.2, duration: 0.3 }}
                            >
                                <label className="text-sm font-medium text-gray-700">Name</label>
                                <p className="text-gray-900">{activeOrganization.name}</p>
                            </motion.div>
                            <motion.div
                                initial={{ opacity: 0, x: -20 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: 0.3, duration: 0.3 }}
                            >
                                <label className="text-sm font-medium text-gray-700">Slug</label>
                                <p className="text-gray-900">{activeOrganization.slug}</p>
                            </motion.div>
                            <motion.div
                                initial={{ opacity: 0, x: -20 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: 0.4, duration: 0.3 }}
                            >
                                <label className="text-sm font-medium text-gray-700 me-2">Your Role</label>
                                <motion.div
                                    animate={activeOrganization.roleName === 'Admin' ? { scale: [1, 1.05, 1] } : {}}
                                    transition={{ duration: 2, repeat: Infinity, repeatDelay: 3 }}
                                >
                                    <Badge variant={activeOrganization.roleName === 'Admin' ? 'default' : 'secondary'}>
                                        {activeOrganization.roleName}
                                    </Badge>
                                </motion.div>
                            </motion.div>
                        </div>
                    </CardContent>
                </Card>
            </motion.div>

            {/* Team Management */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2, duration: 0.3 }}
            >
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <motion.div
                                animate={{ x: [0, 3, 0] }}
                                transition={{ duration: 2, repeat: Infinity, repeatDelay: 4 }}
                            >
                                <Users className="h-5 w-5" />
                            </motion.div>
                            Team Management
                        </CardTitle>
                        <CardDescription>
                            Manage team members and their roles
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-gray-600">
                                    Invite new members and manage existing team roles
                                </p>
                            </div>
                            <motion.div
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                            >
                                <Button variant="outline">
                                    Manage Team
                                </Button>
                            </motion.div>
                        </div>
                    </CardContent>
                </Card>
            </motion.div>

            {/* Roles & Permissions */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3, duration: 0.3 }}
            >
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <motion.div
                                animate={{ rotate: [0, 10, -10, 0] }}
                                transition={{ duration: 2, repeat: Infinity, repeatDelay: 5 }}
                            >
                                <Shield className="h-5 w-5" />
                            </motion.div>
                            Roles & Permissions
                        </CardTitle>
                        <CardDescription>
                            Configure roles and their associated permissions
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-gray-600">
                                    Define custom roles and assign permissions to control access
                                </p>
                            </div>
                            <Link to={'roles-permissions'}>
                                <motion.div
                                    whileHover={{ scale: 1.05 }}
                                    whileTap={{ scale: 0.95 }}
                                >
                                    <Button variant="outline">
                                        Configure Roles
                                    </Button>
                                </motion.div>
                            </Link>
                        </div>
                    </CardContent>
                </Card>
            </motion.div>

            {/* Danger Zone */}
            {isAdmin && (
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.4, duration: 0.3 }}
                >
                    <Card className="border-red-200">
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2 text-red-600">
                                <motion.div
                                    animate={{ rotate: [0, -5, 5, 0] }}
                                    transition={{ duration: 1.5, repeat: Infinity, repeatDelay: 6 }}
                                >
                                    <Trash2 className="h-5 w-5" />
                                </motion.div>
                                Danger Zone
                            </CardTitle>
                            <CardDescription>
                                Irreversible and destructive actions
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="flex items-center justify-between">
                                <div>
                                    <h4 className="text-sm font-medium text-gray-900">Delete Organization</h4>
                                    <p className="text-sm text-gray-600">
                                        Permanently delete this organization and all associated data
                                    </p>
                                </div>
                                <motion.div
                                    whileHover={{ scale: 1.05 }}
                                    whileTap={{ scale: 0.95 }}
                                >
                                    <Button
                                        variant="destructive"
                                        onClick={handleDeleteOrganization}
                                        disabled={initiateDeleteMutation.isPending}
                                    >
                                        {initiateDeleteMutation.isPending ? (
                                            <motion.div
                                                animate={{ rotate: 360 }}
                                                transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                                                className="flex items-center gap-2"
                                            >
                                                <Loader2 className="h-4 w-4 animate-spin" />
                                                Initiating...
                                            </motion.div>
                                        ) : (
                                            'Delete Organization'
                                        )}
                                    </Button>
                                </motion.div>
                            </div>
                        </CardContent>
                    </Card>
                </motion.div>
            )}

            {/* Delete Confirmation Dialog */}
            <Dialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
                <DialogContent>
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9, rotate: -5 }}
                        animate={{ opacity: 1, scale: 1, rotate: 0 }}
                        transition={{ duration: 0.3, type: "spring", stiffness: 300 }}
                    >
                        <DialogHeader>
                            <DialogTitle className="flex items-center gap-3 text-destructive">
                                <motion.div
                                    animate={{ rotate: [0, -10, 10, 0] }}
                                    transition={{ duration: 1, repeat: Infinity, repeatDelay: 3 }}
                                >
                                    <AlertTriangle className="h-6 w-6" />
                                </motion.div>
                                Delete Organization: {activeOrganization.name}
                            </DialogTitle>
                            <DialogDescription>
                                This action cannot be undone. This will permanently delete the organization
                                "{activeOrganization.name}" and all associated data including tasks, roles, and member relationships.
                            </DialogDescription>
                        </DialogHeader>

                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.1, duration: 0.3 }}
                            className="space-y-4"
                        >
                            <motion.div
                                animate={{ x: [0, -5, 5, 0] }}
                                transition={{ duration: 2, repeat: Infinity, repeatDelay: 5 }}
                            >
                                <Alert variant="destructive">
                                    <AlertDescription>
                                        To confirm deletion, type: <strong>delete my {activeOrganization.name} organization</strong>
                                    </AlertDescription>
                                </Alert>
                            </motion.div>

                            <div className="space-y-2">
                                <Label htmlFor="confirmation">Confirmation Text</Label>
                                <Input
                                    id="confirmation"
                                    value={confirmationText}
                                    onChange={(e) => setConfirmationText(e.target.value)}
                                    placeholder={`delete my ${activeOrganization.name} organization`}
                                />
                            </div>
                        </motion.div>

                        <DialogFooter>
                            <motion.div
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                            >
                                <Button
                                    variant="outline"
                                    onClick={() => {
                                        setShowDeleteConfirm(false);
                                        setConfirmationText('');
                                    }}
                                >
                                    Cancel
                                </Button>
                            </motion.div>
                            <motion.div
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                            >
                                <Button
                                    variant="destructive"
                                    onClick={() => {
                                        if (confirmationText === `delete my ${activeOrganization.name} organization`) {
                                            initiateDeleteMutation.mutate({
                                                organizationId: activeOrganization.id,
                                                confirmationText,
                                            });
                                        } else {
                                            toast.error('Confirmation text does not match. Please type exactly as shown.');
                                        }
                                    }}
                                    disabled={initiateDeleteMutation.isPending}
                                >
                                    {initiateDeleteMutation.isPending ? (
                                        <motion.div
                                            animate={{ rotate: 360 }}
                                            transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                                            className="flex items-center gap-2"
                                        >
                                            <Loader2 className="h-4 w-4 animate-spin" />
                                            Initiating...
                                        </motion.div>
                                    ) : (
                                        'Initiate Deletion'
                                    )}
                                </Button>
                            </motion.div>
                        </DialogFooter>

                        <motion.p
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ delay: 0.3, duration: 0.3 }}
                            className="text-sm text-muted-foreground mt-4"
                        >
                            After initiating deletion, you will receive an email with a confirmation link.
                            The deletion will only proceed after you click the link in the email.
                        </motion.p>
                    </motion.div>
                </DialogContent>
            </Dialog>
        </div>
    );
}
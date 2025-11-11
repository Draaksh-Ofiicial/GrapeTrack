import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { authApi } from '@/lib/api/authApi';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
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
import type { ProfileResponse, UserOrganization } from '@/types/auth.types';
import { Calendar, Mail, User, Building, Trash2, AlertTriangle, Plus, Loader2 } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';
import apiClient from '@/lib/api/apiClient';
import { useAuth } from '@/hooks/useAuth';
import { CreateOrganizationForm } from '@/features/organizations/components/CreateOrganizationForm';

export default function ProfilePage() {
    const [deleteOrg, setDeleteOrg] = useState<UserOrganization | null>(null);
    const [confirmationText, setConfirmationText] = useState('');
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
    const [showCreateOrg, setShowCreateOrg] = useState(false);

    const { activeOrganization, refreshUser } = useAuth();
    const queryClient = useQueryClient();

    const { data, isLoading, error } = useQuery({
        queryKey: ['profile'],
        queryFn: authApi.profile,
    });

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
            setDeleteOrg(null);
            setConfirmationText('');
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

    if (isLoading) {
        return (
            <div className="container mx-auto py-8">
                <div className="max-w-4xl mx-auto space-y-6">
                    {/* Profile Header Loading */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.3 }}
                    >
                        <Card>
                            <CardHeader>
                                <motion.div
                                    animate={{ rotate: 360 }}
                                    transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                                    className="flex items-center gap-3"
                                >
                                    <Loader2 className="h-6 w-6 animate-spin" />
                                    <CardTitle className="animate-pulse bg-gray-200 h-6 w-32 rounded"></CardTitle>
                                </motion.div>
                            </CardHeader>
                            <CardContent>
                                <div className="flex items-start gap-6">
                                    <motion.div
                                        animate={{ scale: [1, 1.1, 1] }}
                                        transition={{ duration: 1.5, repeat: Infinity }}
                                        className="h-20 w-20 bg-gray-200 rounded-full animate-pulse"
                                    ></motion.div>

                                    <div className="flex-1 space-y-4">
                                        <div>
                                            <motion.div
                                                animate={{ opacity: [0.5, 1, 0.5] }}
                                                transition={{ duration: 1.5, repeat: Infinity }}
                                                className="h-8 bg-gray-200 rounded w-48 animate-pulse mb-2"
                                            ></motion.div>
                                            <motion.div
                                                animate={{ opacity: [0.5, 1, 0.5] }}
                                                transition={{ duration: 1.5, repeat: Infinity, delay: 0.2 }}
                                                className="h-4 bg-gray-200 rounded w-64 animate-pulse"
                                            ></motion.div>
                                        </div>

                                        <motion.div
                                            animate={{ opacity: [0.5, 1, 0.5] }}
                                            transition={{ duration: 1.5, repeat: Infinity, delay: 0.4 }}
                                            className="flex items-center gap-4"
                                        >
                                            <div className="h-4 bg-gray-200 rounded w-32 animate-pulse"></div>
                                            <div className="h-4 bg-gray-200 rounded w-40 animate-pulse"></div>
                                        </motion.div>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    </motion.div>

                    {/* Organizations Loading */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.2, duration: 0.3 }}
                    >
                        <Card>
                            <CardHeader>
                                <motion.div
                                    animate={{ rotate: 360 }}
                                    transition={{ duration: 2, repeat: Infinity, ease: "linear", delay: 0.5 }}
                                    className="flex items-center gap-3"
                                >
                                    <Loader2 className="h-6 w-6 animate-spin" />
                                    <CardTitle className="animate-pulse bg-gray-200 h-6 w-48 rounded"></CardTitle>
                                </motion.div>
                            </CardHeader>
                            <CardContent>
                                <div className="space-y-4">
                                    {[1, 2, 3].map((i) => (
                                        <motion.div
                                            key={i}
                                            animate={{ opacity: [0.5, 1, 0.5] }}
                                            transition={{ duration: 1.5, repeat: Infinity, delay: i * 0.2 }}
                                            className="flex items-center justify-between p-4 border rounded-lg animate-pulse"
                                        >
                                            <div className="flex items-center gap-3">
                                                <div className="h-10 w-10 bg-gray-200 rounded-full"></div>
                                                <div>
                                                    <div className="h-4 bg-gray-200 rounded w-32 mb-2"></div>
                                                    <div className="h-3 bg-gray-200 rounded w-24"></div>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <div className="h-6 bg-gray-200 rounded w-16"></div>
                                                <div className="h-6 bg-gray-200 rounded w-12"></div>
                                            </div>
                                        </motion.div>
                                    ))}
                                </div>
                            </CardContent>
                        </Card>
                    </motion.div>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="container mx-auto py-8">
                <div className="max-w-4xl mx-auto">
                    <Alert variant="destructive">
                        <AlertDescription>
                            Failed to load profile information. Please try again.
                        </AlertDescription>
                    </Alert>
                </div>
            </div>
        );
    }

    const profileData = data as ProfileResponse;
    const { user, organizations } = profileData || {};

    return (
        <div className='flex flex-col space-y-4'>
            {/* Profile Header */}
            <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
            >
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-3">
                            <motion.div
                                animate={{ rotate: [0, 10, -10, 0] }}
                                transition={{ duration: 2, repeat: Infinity, repeatDelay: 3 }}
                            >
                                <User className="h-6 w-6" />
                            </motion.div>
                            Profile Information
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="flex items-start gap-6">
                            <motion.div
                                whileHover={{ scale: 1.05 }}
                                transition={{ type: "spring", stiffness: 300 }}
                            >
                                <Avatar className="h-20 w-20">
                                    <AvatarImage src={user?.avatar || undefined} />
                                    <AvatarFallback className="text-lg">
                                        {user?.firstName?.[0]}{user?.lastName?.[0]}
                                    </AvatarFallback>
                                </Avatar>
                            </motion.div>

                            <div className="flex-1 space-y-4">
                                <motion.div
                                    initial={{ opacity: 0, x: -20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    transition={{ delay: 0.1, duration: 0.3 }}
                                >
                                    <h2 className="text-2xl font-bold">
                                        {user?.firstName} {user?.lastName}
                                    </h2>
                                    <div className="flex items-center gap-2 text-muted-foreground mt-1">
                                        <motion.div
                                            animate={{ rotate: [0, 5, -5, 0] }}
                                            transition={{ duration: 3, repeat: Infinity, repeatDelay: 5 }}
                                        >
                                            <Mail className="h-4 w-4" />
                                        </motion.div>
                                        {user?.email}
                                    </div>
                                </motion.div>

                                <motion.div
                                    initial={{ opacity: 0, x: -20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    transition={{ delay: 0.2, duration: 0.3 }}
                                    className="flex items-center gap-4 text-sm text-muted-foreground"
                                >
                                    <div className="flex items-center gap-1">
                                        <motion.div
                                            animate={{ scale: [1, 1.1, 1] }}
                                            transition={{ duration: 2, repeat: Infinity, repeatDelay: 4 }}
                                        >
                                            <Calendar className="h-4 w-4" />
                                        </motion.div>
                                        Joined {user?.createdAt ? new Date(user.createdAt).toLocaleDateString('en-US', { month: 'short', year: 'numeric' }) : 'Unknown'}
                                    </div>
                                    <div>
                                        Last updated {user?.updatedAt ? new Date(user.updatedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : 'Unknown'}
                                    </div>
                                </motion.div>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </motion.div>

            {/* Organizations */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2, duration: 0.3 }}
            >
                <Card>
                    <CardHeader>
                        <div className="flex items-center justify-between">
                            <CardTitle className="flex items-center gap-3">
                                <motion.div
                                    animate={{ x: [0, 3, 0] }}
                                    transition={{ duration: 2, repeat: Infinity, repeatDelay: 4 }}
                                >
                                    <Building className="h-6 w-6" />
                                </motion.div>
                                Organization Memberships
                            </CardTitle>
                            <motion.div
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                            >
                                <Button
                                    onClick={() => setShowCreateOrg(true)}
                                    className="flex items-center gap-2"
                                >
                                    <motion.div
                                        animate={{ rotate: [0, 180, 360] }}
                                        transition={{ duration: 2, repeat: Infinity, repeatDelay: 6 }}
                                    >
                                        <Plus className="h-4 w-4" />
                                    </motion.div>
                                    Create Organization
                                </Button>
                            </motion.div>
                        </div>
                    </CardHeader>
                    <CardContent>
                        {organizations && organizations.length > 0 ? (
                            <div className="space-y-4">
                                {organizations.map((org, index) => (
                                    <motion.div
                                        key={org.organizationId}
                                        initial={{ opacity: 0, x: -20 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        transition={{ delay: index * 0.1 + 0.3, duration: 0.3 }}
                                        whileHover={{ scale: 1.02 }}
                                        className={`flex items-center justify-between p-4 border rounded-lg cursor-pointer transition-colors ${
                                            org.organizationId === activeOrganization?.id ? 'ring-2 ring-blue-500 bg-blue-50' : 'hover:bg-gray-50'
                                        }`}
                                    >
                                        <div className="flex items-center gap-3">
                                            <motion.div
                                                whileHover={{ rotate: 5 }}
                                                transition={{ type: "spring", stiffness: 300 }}
                                            >
                                                <Avatar className="h-10 w-10">
                                                    <AvatarImage src={org.logo || undefined} />
                                                    <AvatarFallback>
                                                        {org.name?.[0]?.toUpperCase()}
                                                    </AvatarFallback>
                                                </Avatar>
                                            </motion.div>

                                            <div>
                                                <div className="flex items-center gap-2">
                                                    <h3 className="font-medium">{org.name}</h3>
                                                    {org.organizationId === activeOrganization?.id && (
                                                        <motion.div
                                                            animate={{ scale: [1, 1.1, 1] }}
                                                            transition={{ duration: 2, repeat: Infinity, repeatDelay: 3 }}
                                                        >
                                                            <Badge variant="default" className="text-xs">
                                                                Current
                                                            </Badge>
                                                        </motion.div>
                                                    )}
                                                </div>
                                                <p className="text-sm text-muted-foreground">
                                                    {org.slug} • {org.plan} plan
                                                </p>
                                            </div>
                                        </div>

                                        <div className="flex items-center gap-2">
                                            <motion.div
                                                animate={org.status === 'active' ? { scale: [1, 1.05, 1] } : {}}
                                                transition={{ duration: 2, repeat: Infinity, repeatDelay: 4 }}
                                            >
                                                <Badge variant={org.status === 'active' ? 'default' : 'secondary'}>
                                                    {org.status}
                                                </Badge>
                                            </motion.div>
                                            {org.roleName && (
                                                <Badge variant="outline">
                                                    {org.roleName}
                                                </Badge>
                                            )}
                                            {org.roleName === 'Admin' && org.organizationId !== activeOrganization?.id && (
                                                <motion.div
                                                    whileHover={{ scale: 1.1, rotate: 10 }}
                                                    whileTap={{ scale: 0.9 }}
                                                >
                                                    <Button
                                                        variant="destructive"
                                                        size="sm"
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            setDeleteOrg(org);
                                                            setShowDeleteConfirm(true);
                                                        }}
                                                    >
                                                        <motion.div
                                                            animate={{ rotate: [0, -10, 10, 0] }}
                                                            transition={{ duration: 1, repeat: Infinity, repeatDelay: 8 }}
                                                        >
                                                            <Trash2 className="h-4 w-4" />
                                                        </motion.div>
                                                    </Button>
                                                </motion.div>
                                            )}
                                        </div>
                                    </motion.div>
                                ))}
                            </div>
                        ) : (
                            <motion.p
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                transition={{ delay: 0.5, duration: 0.3 }}
                                className="text-muted-foreground"
                            >
                                No organization memberships found.
                            </motion.p>
                        )}
                    </CardContent>
                </Card>
            </motion.div>

            {/* Create Organization Dialog */}
            <Dialog open={showCreateOrg} onOpenChange={setShowCreateOrg}>
                <DialogContent className="max-w-2xl">
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ duration: 0.2 }}
                    >
                        <DialogHeader>
                            <DialogTitle className="flex items-center gap-3">
                                <motion.div
                                    animate={{ rotate: [0, 360] }}
                                    transition={{ duration: 1, ease: "easeInOut" }}
                                >
                                    <Plus className="h-6 w-6" />
                                </motion.div>
                                Create New Organization
                            </DialogTitle>
                            <DialogDescription>
                                Create a new organization to manage your team's tasks and projects.
                            </DialogDescription>
                        </DialogHeader>

                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.1, duration: 0.3 }}
                        >
                            <CreateOrganizationForm
                                onSuccess={() => {
                                    setShowCreateOrg(false);
                                    queryClient.invalidateQueries({ queryKey: ['profile'] });
                                    refreshUser(); // Refresh auth store to update navbar
                                    toast.success('Organization created successfully!');
                                }}
                            />
                        </motion.div>
                    </motion.div>
                </DialogContent>
            </Dialog>

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
                                Delete Organization: {deleteOrg?.name}
                            </DialogTitle>
                            <DialogDescription>
                                This action cannot be undone. This will permanently delete the organization
                                "{deleteOrg?.name}" and all associated data including tasks, roles, and member relationships.
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
                                        To confirm deletion, type: <strong>delete my {deleteOrg?.name} organization</strong>
                                    </AlertDescription>
                                </Alert>
                            </motion.div>

                            <div className="space-y-2">
                                <Label htmlFor="confirmation">Confirmation Text</Label>
                                <Input
                                    id="confirmation"
                                    value={confirmationText}
                                    onChange={(e) => setConfirmationText(e.target.value)}
                                    placeholder={`delete my ${deleteOrg?.name} organization`}
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
                                        setDeleteOrg(null);
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
                                        if (deleteOrg && confirmationText === `delete my ${deleteOrg.name} organization`) {
                                            initiateDeleteMutation.mutate({
                                                organizationId: deleteOrg.organizationId,
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
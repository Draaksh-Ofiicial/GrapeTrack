import { useState, useEffect } from 'react';
import { useParams, useSearchParams, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, AlertTriangle, CheckCircle, XCircle } from 'lucide-react';
import { toast } from 'sonner';
import { useQueryClient } from '@tanstack/react-query';
import { organizationsApi } from '@/features/organizations/api/organizationsApi';
import useAuth from '@/hooks/useAuth';

interface ConfirmDeleteState {
    status: 'loading' | 'confirming' | 'success' | 'error';
    message?: string;
    orgId?: string;
}

export default function OrganizationDeleteConfirmPage() {
    const { orgSlug } = useParams<{ orgSlug: string }>();
    const { user, refreshUser } = useAuth();
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    const queryClient = useQueryClient();
    const token = searchParams.get('token');

    const [state, setState] = useState<ConfirmDeleteState>({
        status: 'confirming',
    });

    useEffect(() => {
        if (!token) {
            setState({
                status: 'error',
                message: 'Invalid confirmation link. No token provided.',
            });
            return;
        }

        // Validate token format (basic check)
        if (token.length !== 64) {
            setState({
                status: 'error',
                message: 'Invalid confirmation token.',
            });
            return;
        }

        if (state.status !== 'success') {
            const org = user?.organizations.find(org => org.slug === orgSlug);
            if (!org) {
                setState({
                    status: 'error',
                    message: 'Organization not found.',
                });
                return;
            }

            setState({ status: 'confirming', orgId: org.organizationId });
        }
    }, [orgSlug, state.status, token, user?.organizations]);

    const handleConfirmDeletion = async () => {
        if (!token || !state.orgId) return;

        setState({ status: 'loading' });

        try {
            await organizationsApi.confirmDelete(state.orgId, { token });

            setState({
                status: 'success',
                message: 'Organization has been successfully deleted.',
            });

            // Invalidate queries and refresh auth store
            queryClient.invalidateQueries({ queryKey: ['organizations'] });
            queryClient.invalidateQueries({ queryKey: ['profile'] });
            await refreshUser();

            toast.success('Organization deleted successfully');

            // Redirect to organization selection after a delay
            setTimeout(() => {
                navigate('/auth/select-organization');
            }, 3000);

        } catch (error: unknown) {
            console.error('Failed to delete organization:', error);

            let errorMessage = 'An unknown error occurred';

            if (error && typeof error === 'object' && 'response' in error) {
                const axiosError = error as { response?: { data?: { message?: string; errors?: Array<{ field: string; errors: string[] }> } } };
                if (axiosError.response?.data?.message) {
                    errorMessage = axiosError.response.data.message;
                } else if (axiosError.response?.data?.errors) {
                    // Handle validation errors
                    const validationErrors = axiosError.response.data.errors;
                    if (Array.isArray(validationErrors)) {
                        errorMessage = validationErrors.map((err) =>
                            `${err.field}: ${err.errors.join(', ')}`
                        ).join('; ');
                    }
                }
            } else if (error instanceof Error) {
                errorMessage = error.message;
            }

            setState({
                status: 'error',
                message: errorMessage,
            });
            toast.error(`Failed to delete organization: ${errorMessage}`);
        }
    };

    const handleCancel = () => {
        navigate(`/${orgSlug}/dashboard`);
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50">
            <Card className="w-full max-w-md">
                {state.status === 'loading' ? (
                    <CardContent className="pt-6">
                        <div className="flex flex-col items-center space-y-4">
                            <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
                            <p className="text-center text-gray-600">Deleting organization...</p>
                        </div>
                    </CardContent>
                ) : (
                    <>
                        <CardHeader>
                            <div className="flex items-center space-x-2">
                                {state.status === 'error' && <XCircle className="h-6 w-6 text-red-600" />}
                                {state.status === 'success' && <CheckCircle className="h-6 w-6 text-green-600" />}
                                {state.status === 'confirming' && <AlertTriangle className="h-6 w-6 text-orange-600" />}

                                <CardTitle className={
                                    state.status === 'error' ? 'text-red-600' :
                                        state.status === 'success' ? 'text-green-600' :
                                            'text-gray-900'
                                }>
                                    {state.status === 'error' && 'Confirmation Failed'}
                                    {state.status === 'success' && 'Organization Deleted'}
                                    {state.status === 'confirming' && 'Confirm Organization Deletion'}
                                </CardTitle>
                            </div>

                            {state.status === 'confirming' && (
                                <CardDescription>
                                    You are about to permanently delete the organization <strong>{orgSlug}</strong>.
                                    This action cannot be undone.
                                </CardDescription>
                            )}
                        </CardHeader>

                        <CardContent>
                            {state.status === 'error' && (
                                <Alert variant="destructive">
                                    <AlertTriangle className="h-4 w-4" />
                                    <AlertDescription>{state.message}</AlertDescription>
                                </Alert>
                            )}

                            {state.status === 'success' && (
                                <Alert>
                                    <CheckCircle className="h-4 w-4" />
                                    <AlertDescription>{state.message}</AlertDescription>
                                </Alert>
                            )}

                            {state.status === 'confirming' && (
                                <Alert variant="destructive">
                                    <AlertTriangle className="h-4 w-4" />
                                    <AlertDescription>
                                        <strong>Warning:</strong> This will permanently delete all data associated with this organization,
                                        including tasks, users, and settings. All team members will lose access.
                                    </AlertDescription>
                                </Alert>
                            )}

                            <div className="mt-6 flex justify-center">
                                {state.status === 'error' && (
                                    <Button onClick={() => navigate('/auth/select-organization')}>
                                        Go to Organizations
                                    </Button>
                                )}

                                {state.status === 'success' && (
                                    <p className="text-sm text-gray-600">Redirecting to organization selection...</p>
                                )}

                                {state.status === 'confirming' && (
                                    <div className="flex space-x-4 w-full">
                                        <Button
                                            variant="outline"
                                            onClick={handleCancel}
                                            className="flex-1"
                                        >
                                            Cancel
                                        </Button>
                                        <Button
                                            variant="destructive"
                                            onClick={handleConfirmDeletion}
                                            className="flex-1"
                                        >
                                            Delete Organization
                                        </Button>
                                    </div>
                                )}
                            </div>
                        </CardContent>
                    </>
                )}
            </Card>
        </div>
    );
}
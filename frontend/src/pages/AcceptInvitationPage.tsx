import { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useAuth } from '@/hooks/useAuth';
import apiClient from '@/lib/api/apiClient';
import { toast } from 'sonner';

interface AcceptInvitationResponse {
  message: string;
  user?: {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
  };
  organization?: {
    id: string;
    name: string;
  };
}

interface InvitationInfo {
  organizationName?: string;
  senderName?: string;
  email?: string;
}

export default function AcceptInvitationPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { isAuthenticated, refreshUser } = useAuth();

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [invitationInfo] = useState<InvitationInfo | null>(null);
  const [isExistingUser, setIsExistingUser] = useState(isAuthenticated);

  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    password: '',
    confirmPassword: '',
  });

  const token = searchParams.get('token');

  useEffect(() => {
    if (!token) {
      setError('Invalid invitation link. No token provided.');
      return;
    }

    // If user is already authenticated, they can accept with just the token
    if (isAuthenticated) {
      setIsExistingUser(true);
      // Optionally fetch invitation details
    }
  }, [token, isAuthenticated]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) return;

    if (!isExistingUser && (!formData.firstName || !formData.lastName || !formData.password)) {
      setError('All fields are required for new users.');
      return;
    }

    if (!isExistingUser && formData.password !== formData.confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const payload = isExistingUser
        ? { token }
        : {
            token,
            firstName: formData.firstName,
            lastName: formData.lastName,
            password: formData.password,
          };

      const response = await apiClient.post<AcceptInvitationResponse>(
        '/auth/accept-invitation',
        payload
      );

      // Show success toast
      toast.success('Invitation accepted! Redirecting...');

      // Refresh user data to get updated organizations
      await refreshUser();

      // Redirect to dashboard or organization page
      const orgId = response.data.organization?.id;
      setTimeout(() => {
        if (orgId) {
          navigate('/dashboard');
        } else {
          navigate('/auth/select-organization');
        }
      }, 1000);
    } catch (err) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError('Failed to accept invitation. Please try again.');
      }
      toast.error('Failed to accept invitation');
    } finally {
      setIsLoading(false);
    }
  };

  if (error && error.includes('Invalid')) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle className="text-center text-red-600">Invitation Error</CardTitle>
          </CardHeader>
          <CardContent>
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
            <Button
              onClick={() => navigate('/')}
              className="w-full mt-4"
            >
              Go Home
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="text-center">
            {isExistingUser ? 'Accept Invitation' : 'Create Your Account'}
          </CardTitle>
          <p className="text-center text-sm text-gray-600 mt-2">
            {invitationInfo?.organizationName 
              ? `Join ${invitationInfo.organizationName}` 
              : 'Complete your account to join the organization'}
          </p>
        </CardHeader>
        <CardContent>
          {error && !error.includes('Invalid') && (
            <Alert variant="destructive" className="mb-4">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {!isExistingUser && (
              <>
                <div className="space-y-2">
                  <Label htmlFor="firstName">First Name *</Label>
                  <Input
                    id="firstName"
                    type="text"
                    value={formData.firstName}
                    onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                    placeholder="John"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="lastName">Last Name *</Label>
                  <Input
                    id="lastName"
                    type="text"
                    value={formData.lastName}
                    onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                    placeholder="Doe"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="password">Password *</Label>
                  <Input
                    id="password"
                    type="password"
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    placeholder="At least 6 characters"
                    minLength={6}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="confirmPassword">Confirm Password *</Label>
                  <Input
                    id="confirmPassword"
                    type="password"
                    value={formData.confirmPassword}
                    onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                    placeholder="Confirm your password"
                    minLength={6}
                    required
                  />
                </div>
              </>
            )}

            <Button
              type="submit"
              className="w-full"
              disabled={isLoading}
            >
              {isLoading
                ? 'Accepting Invitation...'
                : isExistingUser
                  ? 'Accept Invitation'
                  : 'Create Account & Accept Invitation'
              }
            </Button>
          </form>

          {!isExistingUser && (
            <p className="text-xs text-gray-500 text-center mt-4">
              By creating an account, you agree to our Terms of Service
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
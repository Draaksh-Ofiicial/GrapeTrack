import { useState, useEffect } from 'react';
import { useAuth } from '../../../hooks/useAuth';
import { useUserRole } from '../../../hooks/usePermissions';
import { Alert, AlertDescription } from '../../../components/ui/alert';
import { Button } from '../../../components/ui/button';
import { Card, CardContent } from '../../../components/ui/card';

export const DashboardPage = () => {
  const { user, activeOrganization } = useAuth();
  const userRole = useUserRole();
  const [showWelcome, setShowWelcome] = useState(false);

  // Check if this is a fresh login (show welcome message)
  useEffect(() => {
    const hasShownWelcome = sessionStorage.getItem('hasShownWelcome');
    if (!hasShownWelcome && user) {
      setShowWelcome(true);
      sessionStorage.setItem('hasShownWelcome', 'true');
    }
  }, [user]);

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-xl font-semibold text-gray-900">Loading...</h2>
        </div>
      </div>
    );
  }

  return (
    <>
      {/* Welcome notification */}
      {showWelcome && (
        <Alert className="max-w-7xl w-full mb-4" variant={'success'}>
          <AlertDescription className="flex items-start">
            <div className="flex-1">
              <p className="text-sm">
                🎉 Welcome to GrapeTrack, {user.firstName}! You've successfully logged in.
                {activeOrganization && (
                  <span> You're now working in <strong>{activeOrganization.name}</strong> as a <strong className="capitalize">{userRole}</strong>.</span>
                )}
              </p>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowWelcome(false)}
              className="ml-4 h-6 w-6 p-0"
            >
              <span className="sr-only">Dismiss</span>
              <svg className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
              </svg>
            </Button>
          </AlertDescription>
        </Alert>
      )}

      {/* Welcome header */}
      <div className="px-4 pb-4 sm:px-0">
        <Card>
          <CardContent>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">
              Welcome back, {user.firstName}!
            </h1>

            {activeOrganization ? (
              <div className="space-y-4">
                <div>
                  <p className="text-sm text-gray-600">
                    You're currently working in{' '}
                    <span className="font-semibold text-indigo-600">
                      {activeOrganization.name}
                    </span>
                    {' '}as a{' '}
                    <span className="font-semibold text-green-600 capitalize">
                      {userRole}
                    </span>
                  </p>
                </div>

                {/* Role-specific content */}
                {userRole === 'admin' && (
                  <Alert>
                    <AlertDescription>
                      <h3 className="text-lg font-medium mb-2">Admin Dashboard</h3>
                      <p>As an admin, you have full access to manage users, tasks, and organization settings.</p>
                    </AlertDescription>
                  </Alert>
                )}

                {userRole === 'teamLead' && (
                  <Alert>
                    <AlertDescription>
                      <h3 className="text-lg font-medium mb-2">Team Lead Dashboard</h3>
                      <p>As a team lead, you can create and assign tasks, and manage your team members.</p>
                    </AlertDescription>
                  </Alert>
                )}

                {userRole === 'member' && (
                  <Alert>
                    <AlertDescription>
                      <h3 className="text-lg font-medium mb-2">Member Dashboard</h3>
                      <p>View and update your assigned tasks, and collaborate with your team.</p>
                    </AlertDescription>
                  </Alert>
                )}

                {userRole === 'viewer' && (
                  <Alert>
                    <AlertDescription>
                      <h3 className="text-lg font-medium mb-2">Viewer Dashboard</h3>
                      <p>You have read-only access to view tasks and progress.</p>
                    </AlertDescription>
                  </Alert>
                )}
              </div>
            ) : (
              <Alert>
                <AlertDescription>
                  <h3 className="text-lg font-medium mb-2">No Organization Selected</h3>
                  <p className="mb-3">Please select an organization to get started.</p>
                  {user.organizations.length > 0 && (
                    <Button
                      onClick={() => window.location.href = '/auth/select-organization'}
                      variant="secondary"
                    >
                      Select Organization
                    </Button>
                  )}
                </AlertDescription>
              </Alert>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Quick stats */}
      <div className="px-4 sm:px-0">
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
          <Card>
            <CardContent>
              <div className="flex items-center">
                <div className="shrink-0">
                  <div className="w-8 h-8 bg-primary rounded-md flex items-center justify-center">
                    <span className="text-primary-foreground text-sm font-medium">T</span>
                  </div>
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-muted-foreground truncate">
                      My Tasks
                    </dt>
                    <dd className="text-lg font-medium text-foreground">
                      Coming Soon
                    </dd>
                  </dl>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent>
              <div className="flex items-center">
                <div className="shrink-0">
                  <div className="w-8 h-8 bg-secondary rounded-md flex items-center justify-center">
                    <span className="text-secondary-foreground text-sm font-medium">P</span>
                  </div>
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-muted-foreground truncate">
                      Projects
                    </dt>
                    <dd className="text-lg font-medium text-foreground">
                      Coming Soon
                    </dd>
                  </dl>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent>
              <div className="flex items-center">
                <div className="shrink-0">
                  <div className="w-8 h-8 bg-primary rounded-md flex items-center justify-center">
                    <span className="text-primary-foreground text-sm font-medium">N</span>
                  </div>
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-muted-foreground truncate">
                      Notifications
                    </dt>
                    <dd className="text-lg font-medium text-foreground">
                      Coming Soon
                    </dd>
                  </dl>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </>
  );
};

export default DashboardPage;
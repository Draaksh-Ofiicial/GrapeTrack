import { useState, useEffect } from 'react';
import { useAuth } from '../../../hooks/useAuth';
import { Navigate } from 'react-router-dom';
import { useActiveOrganization } from '../../../store/authStore';
import { CreateOrganizationForm } from '../../organizations/components/CreateOrganizationForm';
import { Button } from '../../../components/ui/button';
import { Card, CardContent } from '../../../components/ui/card';
import { Alert, AlertDescription } from '../../../components/ui/alert';
import { useAuthRefreshUser } from '../../../store/authStore';

export const SelectOrganizationPage = () => {
  const [showCreateForm, setShowCreateForm] = useState(false);
  const refreshUser = useAuthRefreshUser();
  const activeOrg = useActiveOrganization();
  const {
    user,
    isAuthenticated,
    hasSelectedOrganization,
    selectOrganization,
    isSelectingOrganization,
    logout,
    error
  } = useAuth();

  // If user has no organizations, show create form
  useEffect(() => {
    if (user && user.organizations.length === 0) {
      setShowCreateForm(true);
    }
  }, [user]);

  // Redirect to login if not authenticated
  if (!isAuthenticated || !user) {
    return <Navigate to="/auth/login" replace />;
  }

  // Redirect if organization already selected
  if (hasSelectedOrganization && activeOrg) {
    return <Navigate to={`/${activeOrg.slug}/dashboard`} replace />;
  }

  const handleSelectOrganization = (organizationId: string) => {
    selectOrganization(organizationId);
  };

  const handleLogout = () => {
    logout();
  };

  return (
    <div className="min-h-screen bg-linear-to-br from-slate-50 via-blue-50 to-indigo-50 flex items-center justify-center p-6">
      <div className="w-full max-w-lg space-y-8">
        {/* Header */}
        <div className="text-center space-y-2">
          <h1 className="text-2xl font-semibold text-slate-900">
            {showCreateForm ? 'Create Organization' : 'Welcome back, ' + user.firstName + '!'}
          </h1>
          <p className="text-slate-600 text-sm">
            {showCreateForm ? 'Set up your workspace' : 'Select your organization'}
          </p>
        </div>

        {/* Error Message */}
        {error && (
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {/* Main Content */}
        {showCreateForm ? (
          <div className="space-y-6">
            <CreateOrganizationForm onSuccess={async () => {
              await refreshUser();
              setShowCreateForm(false);
            }} />
            <div className="text-center">
              <Button
                onClick={() => setShowCreateForm(false)}
                variant="ghost"
                size="sm"
                className="flex items-center justify-center gap-2 mx-auto"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
                Back to organizations
              </Button>
            </div>
          </div>
        ) : (
          <div className="space-y-3">
            {/* Organization Cards */}
            {user.organizations.map((org) => (
              <Card
                key={org.organizationId}
                className="group bg-white/80 backdrop-blur-sm border-white/20 hover:shadow-lg hover:bg-white/90 transition-all duration-300 cursor-pointer"
                onClick={() => !isSelectingOrganization && org.status === 'active' && handleSelectOrganization(org.organizationId)}
              >
                <CardContent>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="w-11 h-11 bg-linear-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center shadow-sm">
                        <span className="text-white font-semibold text-sm">
                          {org.name.charAt(0).toUpperCase()}
                        </span>
                      </div>
                      <div>
                        <h3 className="font-medium text-slate-900 group-hover:text-slate-800 transition-colors">
                          {org.name}
                        </h3>
                        <p className="text-xs text-slate-500 capitalize">
                          {org.roleName}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center">
                      <Button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleSelectOrganization(org.organizationId);
                        }}
                        disabled={isSelectingOrganization || org.status !== 'active'}
                        variant="default"
                        size="sm"
                        className="shadow-sm hover:shadow-md"
                      >
                        {isSelectingOrganization ? (
                          <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                        ) : (
                          'Select'
                        )}
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}

            {/* Empty State */}
            {user.organizations.length === 0 && (
              <div className="text-center py-16 space-y-6">
                <div className="w-20 h-20 bg-slate-100 rounded-2xl flex items-center justify-center mx-auto">
                  <svg className="w-10 h-10 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-4m-5 0H3m2 0h3M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                  </svg>
                </div>
                <div className="space-y-2">
                  <h3 className="text-lg font-medium text-slate-900">No organizations yet</h3>
                  <p className="text-slate-500 text-sm max-w-xs mx-auto">
                    Create your first workspace to get started with task management
                  </p>
                </div>
                <Button
                  onClick={() => setShowCreateForm(true)}
                  className="shadow-sm hover:shadow-lg"
                >
                  Create Organization
                </Button>
              </div>
            )}

            {/* Create New Organization (when has orgs) */}
            {user.organizations.length > 0 && (
              <div className="text-center pt-6">
                <Button
                  onClick={() => setShowCreateForm(true)}
                  variant="ghost"
                  size="sm"
                  className="flex items-center justify-center gap-2 mx-auto"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                  Create new organization
                </Button>
              </div>
            )}
          </div>
        )}

        {/* Footer */}
        <div className="text-center pt-8">
          <Button
            onClick={handleLogout}
            variant="ghost"
            size="sm"
            className="text-slate-500 hover:text-slate-700"
          >
            Sign out
          </Button>
        </div>
      </div>
    </div>
  );
};

export default SelectOrganizationPage;
import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { useAuthUser, useActiveOrganization } from '../store/authStore';
import { ChevronDownIcon, LogOutIcon, UserIcon } from 'lucide-react';
import { Button } from './ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';

const DashboardNavbar: React.FC = () => {
  const navigate = useNavigate();
  const { orgSlug } = useParams<{ orgSlug: string }>();
  const { logout, isLoggingOut, selectOrganization, isSelectingOrganization } = useAuth();
  const user = useAuthUser();
  const activeOrg = useActiveOrganization();
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  // Navigate to new organization dashboard when activeOrg changes
  useEffect(() => {
    if (activeOrg && activeOrg.slug !== orgSlug) {
      // Get the current path to preserve the page (dashboard/profile)
      const currentPath = window.location.pathname;
      const pathParts = currentPath.split('/');
      const currentPage = pathParts.length > 2 ? pathParts[2] : 'dashboard'; // default to dashboard

      navigate(`/${activeOrg.slug}/${currentPage}`, { replace: true });
    }
  }, [activeOrg, orgSlug, navigate]);

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const toggleDropdown = () => {
    setIsDropdownOpen(!isDropdownOpen);
  };

  if (!user) {
    return null;
  }

  return (
    <nav className="bg-white shadow-sm border-b border-gray-200">
      <div className="mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          {/* Logo and main nav */}
          <div className="flex items-center">
            <Link to={`/${orgSlug}/dashboard`} className="flex items-center">
              <div className="shrink-0">
                <span className="text-2xl font-bold text-primary">GrapeTrack</span>
              </div>
            </Link>
          </div>

          {/* Right side - User menu */}
          <div className="flex items-center space-x-4">
            {/* Organization info */}
            {activeOrg && (
              <div className="ml-8 flex items-center text-sm text-muted-foreground">
                {user.organizations.length > 1 ? (
                  <Select
                    value={activeOrg.id}
                    onValueChange={(value) => {
                      if (value !== activeOrg.id) {
                        selectOrganization(value);
                      }
                    }}
                    disabled={isSelectingOrganization}
                  >
                    <SelectTrigger className="group relative w-auto h-auto border-none bg-transparent px-3 py-1.5 text-sm font-medium text-muted-foreground hover:text-foreground focus:ring-0 transition-all hover:bg-accent/50 rounded-md focus-visible:ring-0 min-h-12">
                      <div className="flex items-center gap-2">
                        <SelectValue />
                      </div>
                    </SelectTrigger>
                    <SelectContent className="min-w-[200px]">
                      {user.organizations.map((org) => (
                        <SelectItem
                          key={org.organizationId}
                          value={org.organizationId}
                          className="cursor-pointer"
                        >
                          <div className="flex items-center gap-3">
                            {
                              org.logo ? (
                                <img
                                  src={org.logo}
                                  alt={org.name}
                                  className="w-8 h-8 rounded-full object-cover"
                                />
                              ) : (
                                <div className="w-8 h-8 rounded-full bg-linear-to-br from-primary/20 to-primary/40 flex items-center justify-center text-xs font-bold text-primary">
                                  {org.name.charAt(0).toUpperCase()}
                                </div>
                              )
                            }
                            <div className="flex flex-col">
                              <span className="font-medium">{org.name}</span>
                            </div>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                ) : (
                  <div className="flex items-center gap-2 px-3 py-1.5">
                    <div className="w-6 h-6 rounded-full bg-linear-to-br from-primary/20 to-primary/40 flex items-center justify-center text-[10px] font-bold text-primary">
                      {activeOrg.name.charAt(0).toUpperCase()}
                    </div>
                    <span className="font-medium text-sm">{activeOrg.name}</span>
                  </div>
                )}
              </div>
            )}
            <div className="relative">
              <Button
                onClick={toggleDropdown}
                variant="ghost"
                className="flex items-center space-x-3 px-3 py-2 rounded-md min-h-12"
              >
                <div className="flex items-center space-x-3">
                  <div className="shrink-0">
                    <div className="h-8 w-8 bg-primary rounded-full flex items-center justify-center">
                      <UserIcon className="h-5 w-5 text-primary-foreground" />
                    </div>
                  </div>
                  <div className="hidden md:block text-left">
                    <p className="text-sm font-medium">
                      {user.firstName} {user.lastName}
                    </p>
                    <p className="text-xs text-muted-foreground">{user.email}</p>
                  </div>
                  <ChevronDownIcon className="h-4 w-4" />
                </div>
              </Button>

              {/* Dropdown menu */}
              {isDropdownOpen && (
                <div className="origin-top-right absolute right-0 mt-2 w-56 rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5 z-50">
                  <div className="py-1">
                    {/* User info */}
                    <div className="px-4 py-2 border-b border-gray-200">
                      <p className="text-sm font-medium text-gray-900">
                        {user.firstName} {user.lastName}
                      </p>
                      <p className="text-xs text-gray-500">{user.email}</p>
                      {activeOrg && (
                        <p className="text-xs text-primary mt-1">
                          {activeOrg.roleName} at {activeOrg.name}
                        </p>
                      )}
                    </div>

                    {/* Profile link */}
                    <Button
                      asChild
                      variant="ghost"
                      className="w-full justify-start px-4 py-2 h-auto"
                    >
                      <Link
                        to={`/${orgSlug}/profile`}
                        onClick={() => setIsDropdownOpen(false)}
                      >
                        <UserIcon className="h-4 w-4 mr-3" />
                        Profile Settings
                      </Link>
                    </Button>

                    {/* Logout */}
                    <Button
                      onClick={() => {
                        setIsDropdownOpen(false);
                        handleLogout();
                      }}
                      disabled={isLoggingOut}
                      variant="ghost"
                      className="w-full justify-start px-4 py-2 h-auto"
                    >
                      <LogOutIcon className="h-4 w-4 mr-3" />
                      {isLoggingOut ? 'Signing out...' : 'Sign out'}
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Click outside to close dropdown */}
      {isDropdownOpen && (
        <div
          className="fixed inset-0 z-40"
          onClick={() => setIsDropdownOpen(false)}
        />
      )}
    </nav>
  );
};

export default DashboardNavbar;
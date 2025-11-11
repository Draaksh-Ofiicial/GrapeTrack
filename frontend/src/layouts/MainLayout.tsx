import { Outlet, useParams, Navigate } from 'react-router-dom';
import { useAuthUser } from '../store/authStore';
import DashboardNavbar from '../components/DashboardNavbar';
import { Sidebar } from '../components/Sidebar';

export default function MainLayout() {
  const { orgSlug } = useParams<{ orgSlug: string }>();
  const user = useAuthUser();

  // Validate that the orgSlug is valid for this user
  if (!orgSlug || !user) {
    return <Navigate to="/auth/select-organization" replace />;
  }

  const validOrganization = user.organizations.find(
    (org) => org.slug === orgSlug
  );

  // If organization slug is not valid for this user, redirect to 404
  if (!validOrganization) {
    return <Navigate to="/unauthorized" replace />;
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <DashboardNavbar />
      <div className="flex flex-1">
        <Sidebar />
        <main className="flex-1 py-6 sm:px-6 lg:px-8 overflow-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
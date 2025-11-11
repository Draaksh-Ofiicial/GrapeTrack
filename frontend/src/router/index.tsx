import { createBrowserRouter, RouterProvider, Navigate } from 'react-router-dom';
import { LoginPage, RegisterPage, SelectOrganizationPage } from '../features/auth/pages';
import ForgotPasswordPage from '../features/auth/pages/ForgotPasswordPage';
import ResetPasswordPage from '../features/auth/pages/ResetPasswordPage';
import { DashboardPage } from '../features/dashboard/pages/DashboardPage';
import { TasksPage } from '../features/tasks/pages/TasksPage';
import NotFoundPage from '../pages/NotFoundPage';
import ProfilePage from '../features/users/pages/ProfilePage';
import RolesPermissionsPage from '../features/rbac/pages/RolesPermissionsPage';
import OrganizationDeleteConfirmPage from '../pages/OrganizationDeleteConfirmPage';
import OrganizationSettingsPage from '../pages/OrganizationSettingsPage';
import AcceptInvitationPage from '../pages/AcceptInvitationPage';
import { UnauthorizedPage } from '../pages/UnauthorizedPage';
import InvitationsPage from '../features/organizations/pages/InvitationsPage';
import { ProtectedRoute } from '../components/ProtectedRoute';
import MainLayout from '../layouts/MainLayout';
import AuthLayout from '../layouts/AuthLayout';
import Navbar from '../components/landing/Navbar';
import Hero from '../components/landing/Hero';
import Features from '../components/landing/Features';
import Pricing from '../components/landing/Pricing';
import Testimonials from '../components/landing/Testimonials';
import CTA from '../components/landing/CTA';
import Footer from '../components/landing/Footer';
import { Toaster } from 'sonner';
import UsersPage from '../features/users/pages/UsersPage';

const LandingPage = () => (
    <div className="min-h-screen">
        <Navbar />
        <Hero />
        <Features />
        <Pricing />
        <Testimonials />
        <CTA />
        <Footer />
    </div>
);

const router = createBrowserRouter([
    // Public landing page
    {
        path: '/',
        element: <LandingPage />,
    },

    // Auth routes with AuthLayout
    {
        path: '/auth',
        element: <AuthLayout />,
        children: [
            {
                path: 'login',
                element: <LoginPage />,
            },
            {
                path: 'register',
                element: <RegisterPage />,
            },
            {
                path: 'forgot-password',
                element: <ForgotPasswordPage />,
            },
            {
                path: 'reset-password',
                element: <ResetPasswordPage />,
            },
            {
                path: 'select-organization',
                element: <SelectOrganizationPage />,
            },
            {
                path: 'join-organization',
                element: <AcceptInvitationPage />,
            },
        ],
    },

    // Organization deletion confirmation (public route, no auth required)
    {
        path: '/organizations/:orgSlug/delete/confirm',
        element: <OrganizationDeleteConfirmPage />,
    },

    // Unauthorized page (public route, no auth required)
    {
        path: '/unauthorized',
        element: <UnauthorizedPage />,
    },

    // Invitation acceptance (public route, no auth required)
    {
        path: '/accept-invitation',
        element: <AcceptInvitationPage />,
    },

    // Main app routes with MainLayout
    {
        path: '/:orgSlug',
        element: <MainLayout />,
        children: [
            {
                path: 'dashboard',
                element: (
                    <ProtectedRoute>
                        <DashboardPage />
                    </ProtectedRoute>
                ),
            },
            {
                path: 'profile',
                element: (
                    <ProtectedRoute>
                        <ProfilePage />
                    </ProtectedRoute>
                ),
            },
            {
                path: 'settings',
                element: (
                    <ProtectedRoute>
                        <OrganizationSettingsPage />
                    </ProtectedRoute>
                ),
            },
            {
                path: 'settings/roles-permissions',
                element: (
                    <ProtectedRoute allowedRoles={['Admin']}>
                        <RolesPermissionsPage />
                    </ProtectedRoute>
                ),
            },
            {
                path: 'users',
                element: (
                    <ProtectedRoute>
                        <UsersPage />
                    </ProtectedRoute>
                ),
            },
            {
                path: 'team/invitations',
                element: (
                    <ProtectedRoute>
                        <InvitationsPage />
                    </ProtectedRoute>
                ),
            },
            {
                path: 'tasks',
                element: (
                    <ProtectedRoute>
                        <TasksPage />
                    </ProtectedRoute>
                ),
            },
        ],
    },

    // Redirect old routes without org slug to organization selection
    {
        path: '/dashboard',
        element: <Navigate to="/auth/select-organization" replace />,
    },
    {
        path: '/profile',
        element: <Navigate to="/auth/select-organization" replace />,
    },    
    
    // Catch all - show 404 page
    {
        path: '*',
        element: <NotFoundPage />,
    },
]);

export default function AppRouter() {
    return (
        <>
            <RouterProvider router={router} />
            <Toaster position="top-right" richColors />
        </>
    );
}
import type { MenuItem, SidebarConfig } from '../types/sidebar.types';
import {
    LayoutDashboard,
    ListTodo,
    Users,
    Settings,
    Shield,
} from 'lucide-react';

/**
 * Base sidebar menu configuration structure
 * This defines the menu hierarchy with permission-based access control
 * Menu items are shown/hidden based on the user's actual permissions in the current organization
 * 
 * Permission examples:
 * - tasks.view, tasks.create, tasks.edit, tasks.delete
 * - team.view, team.manage
 * - reports.view
 * - organization.manage
 */
export const sidebarConfig: SidebarConfig = {
    items: [
        {
            id: 'dashboard',
            label: 'Dashboard',
            path: 'dashboard',
            icon: LayoutDashboard,
            requiredPermissions: [], // Visible to all
        },
        {
            id: 'tasks',
            label: 'Tasks',
            path: 'tasks',
            icon: ListTodo,
            requiredPermissions: ['tasks.view'], // Requires view permission
        },
        {
            id: 'team',
            label: 'Team',
            icon: Users,
            requiredPermissions: ['team.view'],
            children: [
                {
                    id: 'team-members',
                    label: 'Members',
                    path: 'users',
                    requiredPermissions: ['team.view'],
                },
                {
                    id: 'team-invitations',
                    label: 'Invitations',
                    path: 'team/invitations',
                    requiredPermissions: ['team.invite'],
                    badge: 0,
                },
                {
                    id: 'org-roles-permissions',
                    label: 'Roles & Permissions',
                    path: 'settings/roles-permissions',
                    requiredPermissions: ['roles.manage'],
                },
            ],
        },
        /*
        {
            id: 'communications',
            label: 'Communications',
            icon: MessageSquare,
            requiredPermissions: [], // Visible to all by default
            children: [
                {
                    id: 'notifications',
                    label: 'Notifications',
                    path: 'notifications',
                    requiredPermissions: [],
                    badge: 5,
                },
                {
                    id: 'comments',
                    label: 'Comments',
                    path: 'comments',
                    requiredPermissions: ['tasks.comment'],
                },
            ],
        },
        {
            id: 'reports',
            label: 'Reports & Analytics',
            icon: BarChart3,
            requiredPermissions: ['reports.view'],
            children: [
                {
                    id: 'reports-overview',
                    label: 'Overview',
                    path: 'reports/overview',
                    requiredPermissions: ['reports.view'],
                },
                {
                    id: 'reports-tasks',
                    label: 'Task Performance',
                    path: 'reports/tasks',
                    requiredPermissions: ['reports.view', 'tasks.view_all'],
                },
                {
                    id: 'reports-team',
                    label: 'Team Performance',
                    path: 'reports/team',
                    requiredPermissions: ['reports.view_team'],
                },
            ],
        },*/
        {
            id: 'organization',
            label: 'Organization',
            icon: Shield,
            requiredPermissions: ['organizations.manage'],
            children: [
                {
                    id: 'org-settings',
                    label: 'Settings',
                    path: 'settings',
                    requiredPermissions: ['organizations.manage'],
                },/*
                {
                    id: 'org-billing',
                    label: 'Billing',
                    path: 'billing',
                    requiredPermissions: ['organizations.manage_billing'],
                },
                {
                    id: 'org-security',
                    label: 'Security',
                    path: 'security',
                    requiredPermissions: ['organizations.manage_security'],
                },*/
            ],
        },
        {
            id: 'settings',
            label: 'Settings',
            path: 'profile',
            icon: Settings,
            requiredPermissions: [], // Visible to all by default
        },
    ],
};

/**
 * Filter menu items based on user's actual permissions in the organization
 * Permissions come from the user's role in the current organization
 * 
 * Since permissions are organization-specific and assigned to roles dynamically,
 * we do a simple permission check: user permission must match requiredPermissions
 * 
 * @param items - Menu items to filter
 * @param userPermissions - Array of user's permissions in current organization (e.g., ["tasks.view", "tasks.create"])
 * @returns Filtered menu items based on user's permissions
 */
export const filterMenuByPermissions = (items: MenuItem[], userPermissions: string[]): MenuItem[] => {
    return items
        .filter((item) => {
            // If no permissions are required, show the item
            if (!item.requiredPermissions || item.requiredPermissions.length === 0) {
                return true;
            }
            // Check if user has ALL required permissions for this item
            return item.requiredPermissions.every(permission =>
                userPermissions.includes(permission)
            );
        })
        .map((item) => ({
            ...item,
            // Recursively filter children based on permissions
            children: item.children
                ? filterMenuByPermissions(item.children, userPermissions)
                : undefined,
        }))
        // Remove items that have no children and are parent items (no path)
        .filter((item) => {
            if (!item.path && item.children?.length === 0) {
                return false;
            }
            return true;
        });
};

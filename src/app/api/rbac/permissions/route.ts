import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/api/auth/[...nextauth]/authOptions';
import type { AuthOptions } from 'next-auth';
import { roleHasPermission, getAllPermissions, getPermissionsForRole, addPermissionToRole, removePermissionFromRole } from '@/rbac/server';
import { usersInterface } from '@/drizzle/schema';

// GET /api/rbac/permissions - Get all permissions or permissions for a specific role
export async function GET(request: Request) {
    try {
        const session = await getServerSession(authOptions as AuthOptions);
        
        if (!session?.user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const user = session.user as usersInterface;
        const hasAdminAccess = await roleHasPermission(user.usertype, 'admin.access');
        
        if (!hasAdminAccess) {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
        }

        const { searchParams } = new URL(request.url);
        const role = searchParams.get('role');

        if (role) {
            // Get permissions for specific role
            const permissions = await getPermissionsForRole(role);
            return NextResponse.json({ 
                role,
                permissions,
                count: permissions.length 
            });
        } else {
            // Get all available permissions
            const permissions = await getAllPermissions();
            return NextResponse.json({ 
                permissions,
                count: permissions.length 
            });
        }

    } catch (error) {
        console.error('Error fetching permissions:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}

// POST /api/rbac/permissions - Add permission to role
export async function POST(request: Request) {
    try {
        const session = await getServerSession(authOptions as AuthOptions);
        
        if (!session?.user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const user = session.user as usersInterface;
        const hasAdminAccess = await roleHasPermission(user.usertype, 'admin.access');
        
        if (!hasAdminAccess) {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
        }

        const body = await request.json();
        const { role, permission } = body;

        if (!role || !permission) {
            return NextResponse.json(
                { error: 'Role and permission are required' },
                { status: 400 }
            );
        }

        const success = await addPermissionToRole(role, permission);
        
        if (success) {
            return NextResponse.json({ 
                message: `Permission ${permission} added to role ${role}`,
                role,
                permission 
            });
        } else {
            return NextResponse.json(
                { error: 'Failed to add permission to role' },
                { status: 500 }
            );
        }

    } catch (error) {
        console.error('Error adding permission to role:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}

// DELETE /api/rbac/permissions - Remove permission from role
export async function DELETE(request: Request) {
    try {
        const session = await getServerSession(authOptions as AuthOptions);
        
        if (!session?.user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const user = session.user as usersInterface;
        const hasAdminAccess = await roleHasPermission(user.usertype, 'admin.access');
        
        if (!hasAdminAccess) {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
        }

        const { searchParams } = new URL(request.url);
        const role = searchParams.get('role');
        const permission = searchParams.get('permission');

        if (!role || !permission) {
            return NextResponse.json(
                { error: 'Role and permission parameters are required' },
                { status: 400 }
            );
        }

        const success = await removePermissionFromRole(role, permission);
        
        if (success) {
            return NextResponse.json({ 
                message: `Permission ${permission} removed from role ${role}`,
                role,
                permission 
            });
        } else {
            return NextResponse.json(
                { error: 'Failed to remove permission from role' },
                { status: 500 }
            );
        }

    } catch (error) {
        console.error('Error removing permission from role:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}

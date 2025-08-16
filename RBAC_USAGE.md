# Server-Side RBAC System Usage Guide

## Overview

The RBAC system has been updated to use database-driven permissions instead of static role mappings. This provides more flexibility and allows for dynamic permission management.

## Key Changes

### Database Schema
- `permissions` table: Stores all available permissions
- `role_permissions` table: Maps roles to permissions
- Composite primary key on (role_name, permission_name) for role_permissions

### API Functions

#### Server-Side Functions (async)
```typescript
import { roleHasPermission, getPermissionsForRole, addPermissionToRole } from '@/rbac/server';

// Check if a role has a specific permission
const hasAccess = await roleHasPermission('admin', 'projects.write');

// Get all permissions for a role
const permissions = await getPermissionsForRole('manager');

// Add a permission to a role
await addPermissionToRole('user', 'tasks.write');
```

#### Client-Side Functions (synchronous, for fetched permissions)
```typescript
import { hasPermission, WithPermission } from '@/rbac/client';

// Check permission from fetched permissions array
const canEdit = hasPermission(userPermissions, 'projects.write');

// Conditional rendering component
<WithPermission 
  userPermissions={userPermissions} 
  requiredPermission="admin.access"
  fallback={<div>Access denied</div>}
>
  <AdminPanel />
</WithPermission>
```

### React Hooks
```typescript
import { usePermissions, usePermissionCheck } from '@/hooks/usePermissions';

// Get all permissions for current user's role
const { permissions, loading, checkPermission } = usePermissions(user?.usertype);

// Check specific permission
const { hasAccess, loading } = usePermissionCheck(user?.usertype, 'projects.write');
```

## Usage Examples

### 1. Protecting API Routes
```typescript
// In API routes
import { getServerSession } from 'next-auth/next';
import { roleHasPermission } from '@/rbac/server';

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  const userRole = session?.user?.usertype;
  
  const canWrite = await roleHasPermission(userRole, 'projects.write');
  if (!canWrite) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }
  
  // Handle the request...
}
```

### 2. Conditional UI Rendering
```typescript
// In React components
import { usePermissions } from '@/hooks/usePermissions';
import { WithPermission } from '@/rbac/client';

function ProjectPage() {
  const { user } = useCurrentUser();
  const { permissions, checkPermission } = usePermissions(user?.usertype);

  return (
    <div>
      <h1>Projects</h1>
      
      {checkPermission('projects.write') && (
        <button>Create Project</button>
      )}
      
      <WithPermission 
        userPermissions={permissions}
        requiredPermission="projects.write"
      >
        <EditProjectForm />
      </WithPermission>
    </div>
  );
}
```

### 3. Middleware Protection
```typescript
// Updated middleware automatically uses the new async roleHasPermission
export async function middleware(req: NextRequest) {
  // This now fetches permissions from database
  const allowed = await roleHasPermission(role, 'admin.access');
}
```

## Permission Management API

### Get Permissions
```bash
# Get all available permissions
GET /api/rbac/permissions

# Get permissions for a specific role
GET /api/rbac/permissions?role=manager
```

### Add Permission to Role
```bash
POST /api/rbac/permissions
Content-Type: application/json

{
  "role": "user",
  "permission": "tasks.write"
}
```

### Remove Permission from Role
```bash
DELETE /api/rbac/permissions?role=user&permission=tasks.write
```

## Seeding Commands

```bash
# Seed admin user (existing)
npm run seed:admin

# Seed permissions and role mappings
npm run seed:permissions

# Seed everything
npm run seed:all
```

## Migration Notes

1. **Async Functions**: All permission checking functions are now async
2. **Caching**: Server-side functions use 5-minute caching to reduce database queries
3. **Wildcard Permission**: Admin role gets '*' permission for full access
4. **Error Handling**: Functions return `false` on database errors for security

## Performance Considerations

- Permissions are cached for 5 minutes to reduce database load
- Use `clearPermissionCache()` when modifying permissions
- Client-side functions work with fetched permission arrays for fast UI updates
- Consider role-based route prefetching based on user permissions

## Security Notes

- All permission functions return `false` on errors (fail-safe)
- Database constraints ensure referential integrity
- Middleware protection is async and database-backed
- Admin role with '*' permission bypasses all permission checks

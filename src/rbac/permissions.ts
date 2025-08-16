// Central list of permissions - these should match what's in the database
export type Permission =
  | 'projects.read'
  | 'projects.write'
  | 'tasks.read'
  | 'tasks.write'
  | 'documents.read'
  | 'documents.write'
  | 'receipts.read'
  | 'receipts.write'
  | 'users.manage'
  | 'admin.access'
  | '*'; // Wildcard permission for full access

export const ALL_PERMISSIONS: Permission[] = [
  'projects.read',
  'projects.write',
  'tasks.read',
  'tasks.write',
  'documents.read',
  'documents.write',
  'receipts.read',
  'receipts.write',
  'users.manage',
  'admin.access',
];

// Default permissions for role creation - these can be used when creating new roles
export const DEFAULT_ROLE_PERMISSIONS: Record<string, Permission[]> = {
  admin: ['*'], // Admin gets wildcard permission
  manager: [
    'projects.read',
    'projects.write',
    'tasks.read',
    'tasks.write',
    'documents.read',
    'receipts.read',
  ],
  user: ['projects.read', 'tasks.read', 'documents.read', 'receipts.read'],
  guest: ['projects.read'],
};

/**
 * Helper function to get default permissions for a role
 * Useful when seeding the database or creating new roles
 */
export function getDefaultPermissionsForRole(roleName: string): Permission[] {
  return DEFAULT_ROLE_PERMISSIONS[roleName] || [];
}

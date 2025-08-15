// Central list of permissions and role -> permissions mapping
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
  | 'admin.access';

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

export const rolePermissions: Record<string, Permission[] | '*'> = {
  admin: '*', // full access
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

export const isRoleKnown = (role?: string | null) => !!role && Object.prototype.hasOwnProperty.call(rolePermissions, role);

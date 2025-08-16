import dotenv from 'dotenv';
import postgres from 'postgres';

dotenv.config();

const DATABASE_URL = process.env.DATABASE_URL;
if (!DATABASE_URL) {
    console.error('DATABASE_URL is not set. Aborting seeder.');
    process.exit(1);
}

const sql = postgres(DATABASE_URL, { prepare: false });

const DEFAULT_ROLE_PERMISSIONS = {
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

export const ALL_PERMISSIONS = [
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

async function seedPermissions() {
    try {
        console.log('Seeding permissions...');

        // Insert all permissions
        for (const permission of [...ALL_PERMISSIONS, '*']) {
            const [resource, action] = permission === '*' ? ['*', '*'] : permission.split('.');
            
            await sql`
                INSERT INTO permissions (name, description, resource, action, created_at) 
                VALUES (
                    ${permission}, 
                    ${permission === '*' ? 'Wildcard permission for full access' : `Permission to ${action} ${resource}`},
                    ${resource},
                    ${action},
                    now()
                ) 
                ON CONFLICT (name) DO NOTHING
            `;
        }

        console.log('Permissions seeded successfully');

        // Seed role-permission mappings
        console.log('Seeding role-permission mappings...');
        
        for (const [roleName, permissions] of Object.entries(DEFAULT_ROLE_PERMISSIONS)) {
            // Ensure role exists (should be created by seed-admin.mjs)
            await sql`
                INSERT INTO roles (name, description, created_at) 
                VALUES (${roleName}, ${`${roleName.charAt(0).toUpperCase() + roleName.slice(1)} role`}, now()) 
                ON CONFLICT (name) DO NOTHING
            `;

            // Add permissions to role
            for (const permission of permissions) {
                await sql`
                    INSERT INTO role_permissions (role_name, permission_name, created_at) 
                    VALUES (${roleName}, ${permission}, now()) 
                    ON CONFLICT (role_name, permission_name) DO NOTHING
                `;
            }
        }

        console.log('Role-permission mappings seeded successfully');

    } catch (error) {
        console.error('Error seeding permissions:', error);
        throw error;
    }
}

async function run() {
    try {
        await seedPermissions();
        console.log('✅ All permissions and role mappings seeded successfully');
    } catch (error) {
        console.error('❌ Error during seeding:', error);
        process.exit(1);
    } finally {
        await sql.end();
    }
}

run();

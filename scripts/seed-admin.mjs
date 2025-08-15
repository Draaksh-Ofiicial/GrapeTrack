import dotenv from 'dotenv';
import postgres from 'postgres';
import bcrypt from 'bcryptjs';
import { randomUUID } from 'crypto';

dotenv.config();

const DATABASE_URL = process.env.DATABASE_URL;
if (!DATABASE_URL) {
    console.error('DATABASE_URL is not set. Aborting seeder.');
    process.exit(1);
}

const sql = postgres(DATABASE_URL, { prepare: false });

const adminEmail = process.env.SEED_ADMIN_EMAIL || 'admin@example.com';
const adminPassword = process.env.SEED_ADMIN_PASSWORD || 'ChangeMe123!';

async function run() {
    try {
        console.log('Seeding admin role and user...');

        // insert role if not exists
        await sql`INSERT INTO roles (name, description, created_at) VALUES (${'admin'}, ${'Administrator role'}, now()) ON CONFLICT (name) DO NOTHING`;
        console.log('Ensured admin role');

        // check user by email
        const rows = await sql`SELECT id FROM users WHERE email = ${adminEmail}`;
        if (rows.length > 0) {
            console.log('Admin user already exists:', adminEmail);
            return;
        }

        const hashed = await bcrypt.hash(adminPassword, 10);
        const id = randomUUID();

        await sql`INSERT INTO users (id, name, email, password, usertype, created_at, updated_at) VALUES (${id}, ${'Admin'}, ${adminEmail}, ${hashed}, ${'admin'}, now(), now())`;
        console.log('Inserted admin user:', adminEmail);
    } catch (err) {
        console.error('Seeder error', err);
        process.exitCode = 1;
    } finally {
        await sql.end({ timeout: 5 });
    }
}

run();

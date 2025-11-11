import postgres from 'postgres';
import { drizzle } from 'drizzle-orm/postgres-js';

const connectionString = process.env.DATABASE_URL!;

// For migrations only - used by drizzle CLI
export const migrationClient = postgres(connectionString, { max: 1 });

// Type for the database instance (exported from database.module.ts via factory)
export type Database = ReturnType<typeof drizzle>;

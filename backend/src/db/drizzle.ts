import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import dotenv from 'dotenv';
import * as schema from './schema';

dotenv.config();

const databaseUrl = process.env.DATABASE_URL;

if (!databaseUrl) {
    throw new Error('Missing DATABASE_URL in environment variables');
}

// Connection for queries (pooled)
const client = postgres(databaseUrl, { prepare: false });

// Drizzle instance with schema
export const db = drizzle(client, { schema });

export { schema };

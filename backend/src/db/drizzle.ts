import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import dotenv from 'dotenv';
import * as schema from './schema';

dotenv.config();

const databaseUrl = process.env.DATABASE_URL;

if (!databaseUrl) {
    throw new Error('Missing DATABASE_URL in environment variables');
}

// Secure pooled connection
const isProduction = process.env.NODE_ENV === 'production';
const client = postgres(databaseUrl, {
    prepare: true,
    ssl: isProduction ? 'require' : false,
    max: 10,
    idle_timeout: 30,
    connect_timeout: 10,
});

// Drizzle instance with schema
export const db = drizzle(client, { schema });

export { schema };

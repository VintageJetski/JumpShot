import { Pool } from 'pg';
import { drizzle } from 'drizzle-orm/node-postgres';
import * as schema from "@shared/schema";

// Use Supabase PostgreSQL connection string from environment variables
export const pool = new Pool({ 
  connectionString: process.env.SUPABASE_URL || process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

export const db = drizzle(pool, { schema });

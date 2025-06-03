import { Pool } from 'pg';
import { drizzle } from 'drizzle-orm/node-postgres';
import * as schema from "@shared/schema";

// Use Supabase PostgreSQL connection string
const SUPABASE_CONNECTION_STRING = 'postgresql://postgres:7847T8RtFanS6RUC@db.rrtfmkpqembrnieogqmk.supabase.co:5432/postgres';

export const pool = new Pool({ 
  connectionString: process.env.SUPABASE_URL || SUPABASE_CONNECTION_STRING,
  ssl: { rejectUnauthorized: false }
});

export const db = drizzle(pool, { schema });

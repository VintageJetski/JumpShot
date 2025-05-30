import { createClient } from '@supabase/supabase-js';
import { Pool } from 'pg';

// Dual-path connection as specified in PRD
// RPC / Row-level-secure queries
export const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_ANON_KEY!
);

// Heavy ingest or migrations - using direct Postgres connection
export const sql = new Pool({ 
  connectionString: process.env.DATABASE_URL!
});

// Test database connection
export async function testSupabaseConnection(): Promise<boolean> {
  try {
    const { data, error } = await supabase.from('events').select('event_id').limit(1);
    return !error;
  } catch (error) {
    console.error('Supabase connection test failed:', error);
    return false;
  }
}

// Test direct Postgres connection
export async function testPostgresConnection(): Promise<boolean> {
  try {
    const result = await sql.query('SELECT NOW() as time');
    return !!result.rows[0];
  } catch (error) {
    console.error('Postgres connection test failed:', error);
    return false;
  }
}
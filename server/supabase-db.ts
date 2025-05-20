import { Pool } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-serverless';
import * as schema from '../shared/schema.db';
import ws from 'ws';

// Configure Neon for serverless environment
import { neonConfig } from '@neondatabase/serverless';
neonConfig.webSocketConstructor = ws;

// Create a connection pool using the database URL from environment variables
export const supaPool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

// Initialize Drizzle with the Supabase pool and our schema
export const supaDb = drizzle(supaPool, { schema });

// For testing the connection
export async function testSupabaseConnection(): Promise<boolean> {
  try {
    // Attempt to query a simple statement to verify connection
    const result = await supaPool.query('SELECT NOW()');
    console.log('Supabase connection successful:', result.rows[0]);
    return true;
  } catch (error) {
    console.error('Supabase connection failed:', error);
    return false;
  }
}
import { Pool, neonConfig } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-serverless';
import ws from 'ws';

// Configure the WebSocket constructor for Neon
neonConfig.webSocketConstructor = ws;

// Check for database URL
if (!process.env.DATABASE_URL) {
  console.warn('DATABASE_URL is not set. Database features will not work.');
}

// Create database pool
export const pool = new Pool({ 
  connectionString: process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5432/postgres'
});

// Create database instance
export const db = drizzle({ client: pool });

/**
 * Test the database connection
 */
export async function testDatabaseConnection(): Promise<boolean> {
  try {
    const result = await db.execute('SELECT 1 as test');
    return result.rows.length > 0;
  } catch (error) {
    console.error('Database connection error:', error);
    return false;
  }
}
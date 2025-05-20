import { Pool, neonConfig } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-serverless';
import ws from 'ws';

neonConfig.webSocketConstructor = ws;

/**
 * Database connection pool for Supabase PostgreSQL
 * Uses the DATABASE_URL environment variable from the Supabase connection string
 */
export const pool = new Pool({ connectionString: process.env.DATABASE_URL });
export const db = drizzle(pool);

/**
 * Test the database connection
 * @returns true if connection is successful, false otherwise
 */
export async function testDatabaseConnection(): Promise<boolean> {
  try {
    const result = await db.execute('SELECT 1 as test');
    return result.rows.length > 0 && 'test' in result.rows[0];
  } catch (error) {
    console.error('Database connection test failed:', error);
    return false;
  }
}

/**
 * Get available events from the database
 * @returns Array of event objects with eventId and eventName
 */
export async function getAvailableEvents(): Promise<{eventId: number; eventName: string}[]> {
  try {
    const result = await db.execute(`
      SELECT DISTINCT id as "eventId", event_name as "eventName"
      FROM events
      ORDER BY id
    `);
    
    return result.rows as {eventId: number; eventName: string}[];
  } catch (error) {
    console.error('Error fetching events:', error);
    return [];
  }
}

/**
 * Get list of tables in the database
 * @returns Array of table names
 */
export async function listTables(): Promise<string[]> {
  try {
    const result = await db.execute(`
      SELECT tablename
      FROM pg_catalog.pg_tables
      WHERE schemaname = 'public'
      ORDER BY tablename
    `);
    
    return (result.rows as {tablename: string}[]).map(row => row.tablename);
  } catch (error) {
    console.error('Error listing tables:', error);
    return [];
  }
}

/**
 * Get the count of rows in a table
 * @param tableName The name of the table to count rows from
 * @returns Number of rows in the table
 */
export async function countTableRows(tableName: string): Promise<number> {
  try {
    const result = await db.execute(`SELECT COUNT(*) as count FROM ${tableName}`);
    return parseInt((result.rows[0] as {count: string}).count, 10);
  } catch (error) {
    console.error(`Error counting rows in ${tableName}:`, error);
    return 0;
  }
}

/**
 * Get count of distinct values in a column
 * @param tableName The name of the table
 * @param columnName The name of the column
 * @returns Number of distinct values in the column
 */
export async function countDistinctValues(tableName: string, columnName: string): Promise<number> {
  try {
    const result = await db.execute(
      `SELECT COUNT(DISTINCT ${columnName}) as count FROM ${tableName}`
    );
    return parseInt((result.rows[0] as {count: string}).count, 10);
  } catch (error) {
    console.error(`Error counting distinct values in ${tableName}.${columnName}:`, error);
    return 0;
  }
}
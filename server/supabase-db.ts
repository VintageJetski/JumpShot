import { Pool, neonConfig } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-serverless';
import { eq } from 'drizzle-orm';
import ws from 'ws';
import * as schema from './db-schema';

// Configure for serverless environment
neonConfig.webSocketConstructor = ws;

// Supabase connection string (transaction pooler URI for better performance)
const SUPABASE_CONNECTION_STRING = 'postgresql://postgres.rrtfmkpqembrnieogqmk:7847T8RtFanS6RUC@aws-0-sa-east-1.pooler.supabase.com:6543/postgres';

// Create pool with connection string
const pool = new Pool({ 
  connectionString: SUPABASE_CONNECTION_STRING
});

// Create and export database connection with schema
export const db = drizzle({ client: pool, schema });

// Create a helper function to check database connection
export async function testDatabaseConnection(): Promise<boolean> {
  try {
    // Try a simple query to verify connection
    const result = await pool.query('SELECT NOW() as time');
    return !!result.rows[0];
  } catch (error) {
    console.error('Database connection test failed:', error);
    return false;
  }
}

/**
 * Function to check for available events in the database
 * @returns Array of event IDs and names
 */
export async function getAvailableEvents(): Promise<{ eventId: number; eventName: string }[]> {
  try {
    const events = await db.select().from(schema.events);
    return events;
  } catch (error) {
    console.error('Error getting available events:', error);
    return [];
  }
}

/**
 * Function to check if an event exists in the database
 * @param eventId Event ID to check
 * @returns boolean indicating if event exists
 */
export async function checkEventExists(eventId: number): Promise<boolean> {
  try {
    const events = await db.select().from(schema.events).where(
      eq(schema.events.eventId, eventId)
    );
    return events.length > 0;
  } catch (error) {
    console.error(`Error checking if event ${eventId} exists:`, error);
    return false;
  }
}

/**
 * Function to get count of players in an event
 * @param eventId Event ID to check
 * @returns number of players in the event
 */
export async function getPlayerCountForEvent(eventId: number): Promise<number> {
  try {
    const result = await pool.query(
      'SELECT COUNT(DISTINCT steam_id) as player_count FROM player_match_summary WHERE event_id = $1',
      [eventId]
    );
    return parseInt(result.rows[0].player_count || '0', 10);
  } catch (error) {
    console.error(`Error getting player count for event ${eventId}:`, error);
    return 0;
  }
}

// Export a function to close the pool when needed
export async function closeConnection() {
  await pool.end();
}
import { Pool } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-serverless';
import * as schema from './db-schema';
import { eq } from 'drizzle-orm';
import ws from 'ws';

// Configure Neon for serverless environment
import { neonConfig } from '@neondatabase/serverless';
neonConfig.webSocketConstructor = ws;

async function verifyDatabaseConnection() {
  console.log('Verifying connection to Supabase database tables...');
  
  // Make sure we have a database URL
  if (!process.env.DATABASE_URL) {
    console.error('No DATABASE_URL environment variable found');
    console.error('Please provide a valid Supabase DATABASE_URL');
    return false;
  }
  
  // Create a database pool
  const pool = new Pool({ connectionString: process.env.DATABASE_URL });
  
  try {
    // Create Drizzle ORM instance
    const db = drizzle(pool, { schema });
    
    // Check events table
    console.log('\nChecking events table:');
    try {
      const events = await db.select().from(schema.events);
      console.log(`Found ${events.length} events:`);
      for (const event of events) {
        console.log(`- Event ID ${event.eventId}: ${event.eventName}`);
      }
    } catch (error: any) {
      console.error('Error querying events table:', error.message);
    }
    
    // Check teams table
    console.log('\nChecking teams table:');
    try {
      const teams = await db.select().from(schema.teams);
      console.log(`Found ${teams.length} teams:`);
      for (const team of teams.slice(0, 5)) {
        console.log(`- ${team.teamClanName}`);
      }
      if (teams.length > 5) {
        console.log(`  ...and ${teams.length - 5} more teams`);
      }
    } catch (error: any) {
      console.error('Error querying teams table:', error.message);
    }
    
    // Check players table
    console.log('\nChecking players table:');
    try {
      const players = await db.select().from(schema.players);
      console.log(`Found ${players.length} players:`);
      for (const player of players.slice(0, 5)) {
        console.log(`- ${player.userName || 'Unknown'} (ID: ${player.steamId})`);
      }
      if (players.length > 5) {
        console.log(`  ...and ${players.length - 5} more players`);
      }
    } catch (error: any) {
      console.error('Error querying players table:', error.message);
    }
    
    // Check if multiple events exist and players in different events
    console.log('\nChecking multi-event data:');
    try {
      const events = await db.select().from(schema.events);
      
      if (events.length > 1) {
        console.log(`Found ${events.length} events, checking player data across events...`);
        
        for (const event of events) {
          const playerCount = await db.select({
            count: db.fn.count(schema.playerMatchSummary.steamId)
          })
          .from(schema.playerMatchSummary)
          .where(eq(schema.playerMatchSummary.eventId, event.eventId));
          
          console.log(`- Event ${event.eventId} (${event.eventName}): ${playerCount[0]?.count || 0} players`);
          
          // Sample player data from this event
          const playerSummaries = await db.select()
            .from(schema.playerMatchSummary)
            .where(eq(schema.playerMatchSummary.eventId, event.eventId))
            .limit(2);
          
          if (playerSummaries.length > 0) {
            console.log(`  Sample players in this event:`);
            
            for (const summary of playerSummaries) {
              const player = await db.select()
                .from(schema.players)
                .where(eq(schema.players.steamId, summary.steamId))
                .limit(1);
              
              if (player.length > 0) {
                console.log(`  - ${player[0].userName || 'Unknown'} (ID: ${summary.steamId})`);
                
                // Check for stats
                const killStats = await db.select()
                  .from(schema.killStats)
                  .where(
                    eq(schema.killStats.steamId, summary.steamId) && 
                    eq(schema.killStats.eventId, event.eventId)
                  )
                  .limit(1);
                
                if (killStats.length > 0) {
                  console.log(`    * Has kill stats: ${killStats[0].kills || 0} kills`);
                } else {
                  console.log(`    * No kill stats found for this event`);
                }
              }
            }
          }
        }
      } else if (events.length === 1) {
        console.log(`Only one event found: ${events[0].eventName}`);
      } else {
        console.log('No events found in the database');
      }
    } catch (error: any) {
      console.error('Error checking multi-event data:', error.message);
    }
    
    console.log('\nVerification complete');
    return true;
  } catch (error: any) {
    console.error('Database verification failed:', error.message);
    return false;
  } finally {
    await pool.end();
  }
}

// Run the verification
verifyDatabaseConnection()
  .then(() => {
    console.log('Database verification completed');
    process.exit(0);
  })
  .catch(err => {
    console.error('Error during verification:', err);
    process.exit(1);
  });
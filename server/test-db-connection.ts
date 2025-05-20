import { Pool } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-serverless';
import * as schema from '../shared/schema.db';
import ws from 'ws';
import { eq } from 'drizzle-orm';

// Configure Neon for serverless environment
import { neonConfig } from '@neondatabase/serverless';
neonConfig.webSocketConstructor = ws;

async function testDatabaseConnection() {
  console.log('Testing database connection...');
  
  // Make sure we have a database URL
  if (!process.env.DATABASE_URL) {
    console.error('No DATABASE_URL environment variable found');
    return false;
  }
  
  // Create a database pool
  const pool = new Pool({ connectionString: process.env.DATABASE_URL });
  
  try {
    // Test basic connection
    const result = await pool.query('SELECT NOW() as time');
    console.log(`Database connection successful. Server time: ${result.rows[0].time}`);
    
    // Create Drizzle ORM instance
    const db = drizzle(pool, { schema });
    
    // Check available events
    console.log('\nChecking events table:');
    const events = await db.select().from(schema.supaEvents);
    
    if (events.length === 0) {
      console.log('No events found in the database');
    } else {
      console.log(`Found ${events.length} events:`);
      for (const event of events) {
        console.log(`- Event ID ${event.eventId}: ${event.eventName}`);
        
        // Check player statistics for this event
        try {
          const playerSummaries = await db.select()
            .from(schema.supaPlayerMatchSummary)
            .where(eq(schema.supaPlayerMatchSummary.eventId, event.eventId))
            .limit(5);
          
          console.log(`  * Found ${playerSummaries.length} player summaries (showing first 5)`);
          
          // Check for player details
          for (const summary of playerSummaries) {
            const player = await db.select()
              .from(schema.supaPlayers)
              .where(eq(schema.supaPlayers.steamId, summary.steamId))
              .limit(1);
            
            if (player.length > 0) {
              console.log(`    - Player: ${player[0].userName || 'Unknown'} (Steam ID: ${summary.steamId})`);
              
              // Try to get kill stats
              const killStats = await db.select()
                .from(schema.supaKillStats)
                .where(eq(schema.supaKillStats.steamId, summary.steamId))
                .limit(1);
              
              if (killStats.length > 0) {
                console.log(`      * Kills: ${killStats[0].kills || 0}`);
              } else {
                console.log(`      * No kill stats found`);
              }
            }
          }
        } catch (error) {
          console.error(`  * Error fetching player data for event ${event.eventId}:`, error);
        }
      }
    }
    
    // Test querying rounds
    console.log('\nChecking rounds table:');
    try {
      const roundCount = await pool.query('SELECT COUNT(*) FROM rounds');
      console.log(`Found ${roundCount.rows[0].count} rounds`);
      
      if (parseInt(roundCount.rows[0].count) > 0) {
        const sampleRounds = await db.select()
          .from(schema.supaRounds)
          .limit(2);
        
        console.log('Sample rounds:');
        for (const round of sampleRounds) {
          console.log(`- Round ${round.roundNum} (${round.winner} won)`);
          console.log(`  * Teams: ${round.ctTeamClanName} (CT) vs ${round.tTeamClanName} (T)`);
        }
      }
    } catch (error) {
      console.error('Error querying rounds table:', error);
    }
    
    console.log('\nTest complete');
    return true;
  } catch (error) {
    console.error('Database connection test failed:', error);
    return false;
  } finally {
    await pool.end();
  }
}

// Run the test
testDatabaseConnection()
  .then(() => {
    console.log('Database connection test completed');
    process.exit(0);
  })
  .catch(err => {
    console.error('Error running database test:', err);
    process.exit(1);
  });
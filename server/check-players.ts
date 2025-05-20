import { db } from './supabase-db';
import { players, playerMatchSummary } from './db-schema';
import { eq, inArray } from 'drizzle-orm';

async function checkPlayerData() {
  try {
    console.log('Checking player data in Supabase...');
    
    // Get all event IDs
    const result = await db.execute(
      'SELECT DISTINCT event_id FROM player_match_summary ORDER BY event_id'
    );
    
    const eventIds = (result.rows as { event_id: number }[]).map(e => e.event_id);
    console.log(`Found ${eventIds.length} events: ${eventIds.join(', ')}`);
    
    for (const eventId of eventIds) {
      console.log(`\nChecking event ID: ${eventId}`);
      
      // Get all players in this event
      const playerSummaries = await db.select()
        .from(playerMatchSummary)
        .where(eq(playerMatchSummary.eventId, eventId));
        
      console.log(`Found ${playerSummaries.length} player match entries for event ${eventId}`);
      
      // Get unique steam IDs
      const steamIds = Array.from(new Set(playerSummaries.map(p => p.steamId)));
      console.log(`Found ${steamIds.length} unique players in event ${eventId}`);
      
      // Get all player info
      const playerInfos = await db.select()
        .from(players);
        
      console.log(`Found ${playerInfos.length} total players in 'players' table`);
      
      // Get players that are in this event
      const matchingPlayers = playerInfos.filter(p => 
        steamIds.includes(p.steamId)
      );
      
      console.log(`Found ${matchingPlayers.length} players with basic info in event ${eventId}:`);
      for (const player of matchingPlayers) {
        console.log(`- ${player.userName} (Steam ID: ${player.steamId})`);
      }
      
      // Check if steam IDs exist in players table
      const missingPlayers = steamIds.filter(id => 
        !playerInfos.some(p => p.steamId === id)
      );
      
      console.log(`\n${missingPlayers.length} players do not have entries in the 'players' table`);
      
      // Show sample of missing players
      if (missingPlayers.length > 0) {
        console.log('Sample of missing steam IDs:');
        for (let i = 0; i < Math.min(5, missingPlayers.length); i++) {
          console.log(`- ${missingPlayers[i]}`);
        }
      }
    }
    
  } catch (error) {
    console.error('Error checking player data:', error);
  }
}

// Run the check
checkPlayerData()
  .then(() => {
    console.log('\nCheck completed successfully');
    process.exit(0);
  })
  .catch(error => {
    console.error('Error during check:', error);
    process.exit(1);
  });
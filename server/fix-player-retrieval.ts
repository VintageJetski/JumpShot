import { db } from './supabase-db';
import { players, playerMatchSummary } from './db-schema';
import { eq, inArray } from 'drizzle-orm';

async function investigatePlayerRetrieval() {
  try {
    console.log('Investigating player data retrieval issues...');
    
    // Get all event IDs
    const result = await db.execute(
      'SELECT DISTINCT event_id FROM player_match_summary ORDER BY event_id'
    );
    
    const eventIds = (result.rows as { event_id: number }[]).map(e => e.event_id);
    console.log(`Found ${eventIds.length} events: ${eventIds.join(', ')}`);
    
    const eventId = eventIds[0]; // Focus on first event
    
    // Get all steam IDs in this event
    const steamIdResult = await db.execute(
      `SELECT DISTINCT steam_id FROM player_match_summary WHERE event_id = ${eventId}`
    );
    
    const steamIds = (steamIdResult.rows as { steam_id: string }[]).map(p => p.steam_id);
    console.log(`Found ${steamIds.length} unique players in event ${eventId}`);
    
    // Show sample steam IDs
    console.log('Sample steam IDs from player_match_summary:');
    for (let i = 0; i < Math.min(5, steamIds.length); i++) {
      console.log(`- ${steamIds[i]} (${typeof steamIds[i]})`);
    }
    
    // Get all players
    const allPlayers = await db.select().from(players);
    console.log(`Total players in players table: ${allPlayers.length}`);
    
    // Show sample players
    console.log('Sample players from players table:');
    for (let i = 0; i < Math.min(5, allPlayers.length); i++) {
      console.log(`- ${allPlayers[i].userName} (Steam ID: ${allPlayers[i].steamId}, type: ${typeof allPlayers[i].steamId})`);
    }
    
    // Check steam ID matches
    const matchedCount = steamIds.filter(id => 
      allPlayers.some(p => p.steamId === id)
    ).length;
    
    console.log(`\nMatched ${matchedCount} steam IDs between player_match_summary and players tables`);
    
    // Test direct filter
    const directQuery = await db.select()
      .from(players)
      .where(inArray(players.steamId, steamIds.slice(0, 5)));
      
    console.log(`\nDirect query with first 5 steam IDs returned ${directQuery.length} players:`);
    directQuery.forEach(p => console.log(`- ${p.userName} (${p.steamId})`));
    
    // Check type conversions
    console.log('\nTesting type conversion scenarios:');
    
    // Check exact matches in original data types
    const exactMatches = [];
    for (const id of steamIds.slice(0, 5)) {
      const matchingPlayers = allPlayers.filter(p => p.steamId === id);
      if (matchingPlayers.length > 0) {
        exactMatches.push({ steamId: id, players: matchingPlayers });
      }
    }
    
    console.log(`Found ${exactMatches.length} exact matches:`);
    exactMatches.forEach(match => {
      console.log(`- Steam ID: ${match.steamId}`);
      match.players.forEach(p => console.log(`  * ${p.userName}`));
    });
    
  } catch (error) {
    console.error('Error investigating player data:', error);
  }
}

// Run the investigation
investigatePlayerRetrieval()
  .then(() => {
    console.log('\nInvestigation completed');
    process.exit(0);
  })
  .catch(error => {
    console.error('Error during investigation:', error);
    process.exit(1);
  });
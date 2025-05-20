import { db } from './supabase-db';
import { players, playerMatchSummary } from './db-schema';
import { eq } from 'drizzle-orm';

/**
 * Get a normalized version of the Steam ID for comparison
 * This function removes last 2 digits which might vary between tables
 */
function getNormalizedSteamId(id: string | number): string {
  return String(id).substring(0, 15);
}

async function testDirectMatch() {
  try {
    console.log('Testing direct match between players and player_match_summary...');
    
    // Get all players from the players table
    const allPlayers = await db.select().from(players);
    console.log(`Found ${allPlayers.length} players in the players table`);
    
    // Create a map of normalized steam IDs to player info
    const playerMap = new Map<string, any>();
    for (const player of allPlayers) {
      const normalizedId = getNormalizedSteamId(player.steamId);
      playerMap.set(normalizedId, player);
    }
    
    // Get all summaries for event 1
    const result = await db.execute(
      `SELECT DISTINCT steam_id FROM player_match_summary WHERE event_id = 1`
    );
    
    const steamIds = (result.rows as { steam_id: string }[]).map(p => p.steam_id);
    console.log(`Found ${steamIds.length} unique steam IDs in event 1`);
    
    // Check how many we can match
    let matchCount = 0;
    let unmatchedIds: string[] = [];
    
    for (const id of steamIds) {
      const normalizedId = getNormalizedSteamId(id);
      if (playerMap.has(normalizedId)) {
        matchCount++;
      } else {
        unmatchedIds.push(id);
      }
    }
    
    console.log(`\nMatched ${matchCount} out of ${steamIds.length} steam IDs`);
    console.log(`Unmatched: ${unmatchedIds.length}`);
    
    // Print some examples of matched pairs
    console.log('\nExample matches:');
    let exampleCount = 0;
    for (const id of steamIds) {
      const normalizedId = getNormalizedSteamId(id);
      const player = playerMap.get(normalizedId);
      
      if (player && exampleCount < 10) {
        console.log(`- Summary ID: ${id}, Player ID: ${player.steamId}, Name: ${player.userName}`);
        console.log(`  Normalized IDs - Summary: ${normalizedId}, Player: ${getNormalizedSteamId(player.steamId)}`);
        exampleCount++;
      }
    }
    
    // Print some examples of unmatched IDs
    if (unmatchedIds.length > 0) {
      console.log('\nExample unmatched IDs:');
      for (let i = 0; i < Math.min(5, unmatchedIds.length); i++) {
        console.log(`- ${unmatchedIds[i]}`);
      }
    }
    
    // Test if there are any players in the players table that don't have a normalized match
    const playerNormalizedIds = new Set(Array.from(playerMap.keys()));
    const summaryNormalizedIds = new Set(steamIds.map(id => getNormalizedSteamId(id)));
    
    const playersWithoutMatch = allPlayers.filter(player => 
      !summaryNormalizedIds.has(getNormalizedSteamId(player.steamId))
    );
    
    console.log(`\nPlayers without a match in event 1: ${playersWithoutMatch.length}`);
    if (playersWithoutMatch.length > 0) {
      console.log('Examples:');
      for (let i = 0; i < Math.min(5, playersWithoutMatch.length); i++) {
        console.log(`- ${playersWithoutMatch[i].userName} (ID: ${playersWithoutMatch[i].steamId})`);
      }
    }
    
  } catch (error) {
    console.error('Error testing direct match:', error);
  }
}

// Run the test
testDirectMatch()
  .then(() => {
    console.log('\nTest completed successfully');
    process.exit(0);
  })
  .catch(error => {
    console.error('Error running test:', error);
    process.exit(1);
  });
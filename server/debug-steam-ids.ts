import { db } from './supabase-db';
import { players, playerMatchSummary } from './db-schema';

function getSteamIdKey(id: string | number): string {
  // Convert to string and keep only digits
  const digitOnly = String(id).replace(/\D/g, '');
  // Trim to first 10 digits for robust matching
  return digitOnly.substring(0, 10);
}

async function debugSteamIds() {
  try {
    console.log('Debugging steam ID differences between tables...');
    
    // Get all steam IDs from player_match_summary for first event
    const eventId = 1;
    const matchSummaries = await db.select({ 
      steamId: playerMatchSummary.steamId,
      teamName: playerMatchSummary.teamClanName
    })
    .from(playerMatchSummary)
    .where(db.sql`${playerMatchSummary.eventId} = ${eventId}`);
    
    // Get unique steam IDs and organize by team
    const uniqueSteamIds = new Set<string>();
    const teamPlayers = new Map<string, Set<string>>();
    
    for (const summary of matchSummaries) {
      uniqueSteamIds.add(summary.steamId);
      
      if (!teamPlayers.has(summary.teamName)) {
        teamPlayers.set(summary.teamName, new Set<string>());
      }
      teamPlayers.get(summary.teamName)!.add(summary.steamId);
    }
    
    console.log(`Found ${uniqueSteamIds.size} unique steam IDs in player_match_summary`);
    
    // Get all players
    const allPlayers = await db.select({
      id: players.id,
      userName: players.userName,
      steamId: players.steamId
    })
    .from(players);
    
    console.log(`Found ${allPlayers.length} players in players table`);
    
    // Create maps for better lookups
    const playerByExactSteamId = new Map<string, any>();
    const playerByNormalizedSteamId = new Map<string, any>();
    
    for (const player of allPlayers) {
      playerByExactSteamId.set(String(player.steamId), player);
      playerByNormalizedSteamId.set(getSteamIdKey(player.steamId), player);
    }
    
    // Test lookup with various normalization approaches
    console.log('\nTesting various matching approaches:');
    
    // Count matches for each approach
    let exactMatches = 0;
    let normalizedMatches = 0;
    const unmatched = new Set<string>();
    
    // Keep example steam IDs for debugging
    const exampleMatches: { summary: string, player: string, name: string }[] = [];
    
    for (const summaryId of uniqueSteamIds) {
      // Try exact match
      if (playerByExactSteamId.has(summaryId)) {
        exactMatches++;
        if (exampleMatches.length < 3) {
          exampleMatches.push({
            summary: summaryId,
            player: String(playerByExactSteamId.get(summaryId).steamId),
            name: playerByExactSteamId.get(summaryId).userName
          });
        }
        continue;
      }
      
      // Try normalized match
      const normalizedId = getSteamIdKey(summaryId);
      if (playerByNormalizedSteamId.has(normalizedId)) {
        normalizedMatches++;
        if (exampleMatches.length < 6) {
          exampleMatches.push({
            summary: summaryId,
            player: String(playerByNormalizedSteamId.get(normalizedId).steamId),
            name: playerByNormalizedSteamId.get(normalizedId).userName
          });
        }
        continue;
      }
      
      // Add to unmatched
      unmatched.add(summaryId);
    }
    
    console.log(`Exact matches: ${exactMatches}`);
    console.log(`Normalized matches: ${normalizedMatches}`);
    console.log(`Unmatched: ${unmatched.size}`);
    
    console.log('\nExample matches:');
    for (const example of exampleMatches) {
      console.log(`Summary ID: ${example.summary}, Player ID: ${example.player}, Name: ${example.name}`);
    }
    
    console.log('\nUnmatched IDs sample:');
    const unmatchedArray = Array.from(unmatched);
    for (let i = 0; i < Math.min(5, unmatchedArray.length); i++) {
      console.log(`- ${unmatchedArray[i]}`);
    }
    
    // Show team roster for the first team as an example
    const teamNames = Array.from(teamPlayers.keys());
    if (teamNames.length > 0) {
      const firstTeam = teamNames[0];
      const teamRoster = teamPlayers.get(firstTeam)!;
      
      console.log(`\nRoster for team ${firstTeam}:`);
      for (const steamId of teamRoster) {
        const normalizedId = getSteamIdKey(steamId);
        const player = playerByExactSteamId.get(steamId) || playerByNormalizedSteamId.get(normalizedId);
        
        if (player) {
          console.log(`- ${player.userName} (ID: ${steamId})`);
        } else {
          console.log(`- Unknown player (ID: ${steamId})`);
        }
      }
    }
    
  } catch (error) {
    console.error('Error debugging steam IDs:', error);
  }
}

// Run the debug
debugSteamIds()
  .then(() => {
    console.log('\nDebug completed');
    process.exit(0);
  })
  .catch(error => {
    console.error('Error during debug:', error);
    process.exit(1);
  });
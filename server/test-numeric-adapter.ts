import { testDatabaseConnection } from './supabase-db';
import { SupabaseAdapter } from './supabase-adapter-new';
import { PlayerRawStats } from '../shared/schema';

/**
 * Test the updated numeric-based adapter
 */
async function testNumericAdapter() {
  console.log('Testing numeric-based adapter...');
  
  // Test connection
  const isConnected = await testDatabaseConnection();
  console.log(`Database connection: ${isConnected ? 'Success ✅' : 'Failed ❌'}`);
  
  if (!isConnected) {
    console.log('Cannot proceed with tests - no database connection');
    return;
  }
  
  // Create adapter
  const adapter = new SupabaseAdapter();
  
  // Get event IDs
  const eventIds = await adapter.getEventIds();
  console.log(`Found ${eventIds.length} events: ${eventIds.join(', ')}`);
  
  // Test with first event
  const eventId = eventIds[0];
  console.log(`\nTesting with event ID ${eventId}...`);
  
  // Get teams
  console.log('Getting teams...');
  const teams = await adapter.getTeamsForEvent(eventId);
  console.log(`Found ${teams.length} teams`);
  
  // Get players
  console.log('\nGetting players...');
  const players = await adapter.getPlayersForEvent(eventId);
  console.log(`Found ${players.length} players`);
  
  // Count players by team
  const playersByTeam = new Map<string, PlayerRawStats[]>();
  
  for (const player of players) {
    const teamName = player.team || 'Unknown';
    if (!playersByTeam.has(teamName)) {
      playersByTeam.set(teamName, []);
    }
    playersByTeam.get(teamName)!.push(player);
  }
  
  // Show player distribution
  console.log('\nPlayer distribution by team:');
  for (const [teamName, teamPlayers] of playersByTeam.entries()) {
    console.log(`- ${teamName}: ${teamPlayers.length} players`);
    
    // Show sample players
    for (let i = 0; i < Math.min(3, teamPlayers.length); i++) {
      const player = teamPlayers[i];
      console.log(`  * ${player.name} (ADR: ${player.adr?.toFixed(1)}, K/D: ${(player.kills / Math.max(player.deaths || 1, 1)).toFixed(2)})`);
    }
    
    if (teamPlayers.length > 3) {
      console.log(`  * ... and ${teamPlayers.length - 3} more players`);
    }
  }
  
  // Verify stats availability
  console.log('\nVerifying detailed stats availability:');
  let playersWithKillStats = 0;
  let playersWithGeneralStats = 0;
  let playersWithUtilityStats = 0;
  
  for (const player of players) {
    if (player.hsKills !== undefined && player.hsKills > 0) playersWithKillStats++;
    if (player.kast !== undefined && player.kast > 0) playersWithGeneralStats++;
    if (player.utilityDamage !== undefined && player.utilityDamage > 0) playersWithUtilityStats++;
  }
  
  console.log(`Players with kill stats: ${playersWithKillStats}/${players.length}`);
  console.log(`Players with general stats: ${playersWithGeneralStats}/${players.length}`);
  console.log(`Players with utility stats: ${playersWithUtilityStats}/${players.length}`);
  
  // Show sample player with all stats
  if (players.length > 0) {
    console.log('\nSample player with complete stats:');
    const samplePlayer = players.find(p => 
      p.hsKills !== undefined && p.kast !== undefined && p.utilityDamage !== undefined
    ) || players[0];
    
    console.log(`Player: ${samplePlayer.name} (Team: ${samplePlayer.team})`);
    console.log('Kill stats:');
    console.log(`- Kills: ${samplePlayer.kills}`);
    console.log(`- Headshot kills: ${samplePlayer.hsKills}`);
    console.log(`- Multi kills: ${samplePlayer.multiKills}`);
    
    console.log('General stats:');
    console.log(`- ADR: ${samplePlayer.adr}`);
    console.log(`- KAST: ${samplePlayer.kast}`);
    console.log(`- Impact: ${samplePlayer.impact}`);
    
    console.log('Utility stats:');
    console.log(`- Utility damage: ${samplePlayer.utilityDamage}`);
    console.log(`- Flash assists: ${samplePlayer.flashAssists}`);
  }
  
  // Test if players from event 1 can be retrieved properly by the adapter
  if (eventIds.length > 1) {
    const secondEventId = eventIds[1];
    console.log(`\nVerifying retrieval from second event (ID: ${secondEventId})...`);
    
    const secondEventPlayers = await adapter.getPlayersForEvent(secondEventId);
    console.log(`Found ${secondEventPlayers.length} players in event ${secondEventId}`);
    
    // Check for players in both events
    const playersInBothEvents = players.filter(p1 => 
      secondEventPlayers.some(p2 => p1.name === p2.name)
    );
    
    console.log(`Players appearing in both events: ${playersInBothEvents.length}`);
    if (playersInBothEvents.length > 0) {
      console.log('Sample players in both events:');
      for (let i = 0; i < Math.min(5, playersInBothEvents.length); i++) {
        console.log(`- ${playersInBothEvents[i].name} (Team in event 1: ${playersInBothEvents[i].team})`);
      }
    }
  }
}

// Run the test
testNumericAdapter()
  .then(() => {
    console.log('\nTest completed successfully');
    process.exit(0);
  })
  .catch(error => {
    console.error('Error running test:', error);
    process.exit(1);
  });
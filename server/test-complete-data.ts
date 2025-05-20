import { testDatabaseConnection } from './supabase-db';
import { SupabaseAdapter } from './supabase-adapter-new';

async function testCompleteDataRetrieval() {
  console.log('Testing complete data retrieval from Supabase...');
  
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
  
  if (eventIds.length === 0) {
    console.log('No events found, cannot proceed with tests');
    return;
  }
  
  // Test first event
  const firstEvent = eventIds[0];
  console.log(`\n===== Testing event ID: ${firstEvent} =====`);
  
  // Get teams
  console.log('\nGetting teams...');
  const teams = await adapter.getTeamsForEvent(firstEvent);
  console.log(`Found ${teams.length} teams:`);
  for (let i = 0; i < Math.min(5, teams.length); i++) {
    console.log(`- ${teams[i].name} (${teams[i].players} players)`);
  }
  if (teams.length > 5) {
    console.log(`... and ${teams.length - 5} more teams`);
  }
  
  // Get players
  console.log('\nGetting players...');
  const players = await adapter.getPlayersForEvent(firstEvent);
  console.log(`Found ${players.length} players`);
  
  // Organize players by team
  const playersByTeam = new Map<string, any[]>();
  for (const player of players) {
    if (!playersByTeam.has(player.team)) {
      playersByTeam.set(player.team, []);
    }
    playersByTeam.get(player.team)!.push(player);
  }
  
  // Show player distribution by team
  console.log('\nPlayer distribution by team:');
  for (const [teamName, teamPlayers] of playersByTeam.entries()) {
    console.log(`- ${teamName}: ${teamPlayers.length} players`);
    // Show first 2 players as examples
    for (let i = 0; i < Math.min(2, teamPlayers.length); i++) {
      const player = teamPlayers[i];
      console.log(`  * ${player.name} (K/D: ${(player.kills/Math.max(1, player.deaths)).toFixed(2)}, ADR: ${player.adr.toFixed(1)})`);
    }
    if (teamPlayers.length > 2) {
      console.log(`  * ... and ${teamPlayers.length - 2} more players`);
    }
  }
  
  // Check if we have a second event
  if (eventIds.length > 1) {
    const secondEvent = eventIds[1];
    console.log(`\n===== Testing event ID: ${secondEvent} =====`);
    
    // Get teams for second event
    console.log('\nGetting teams...');
    const teams2 = await adapter.getTeamsForEvent(secondEvent);
    console.log(`Found ${teams2.length} teams`);
    
    // Get players for second event
    console.log('\nGetting players...');
    const players2 = await adapter.getPlayersForEvent(secondEvent);
    console.log(`Found ${players2.length} players`);
    
    // Get player in both events
    const playersInBothEvents = players.filter(p1 => 
      players2.some(p2 => p1.name === p2.name)
    );
    
    console.log(`\nFound ${playersInBothEvents.length} players who participated in both events`);
    if (playersInBothEvents.length > 0) {
      console.log('Sample players in both events:');
      for (let i = 0; i < Math.min(5, playersInBothEvents.length); i++) {
        console.log(`- ${playersInBothEvents[i].name} (Team: ${playersInBothEvents[i].team})`);
      }
    }
  }
}

// Run the test
testCompleteDataRetrieval()
  .then(() => {
    console.log('\nTest completed successfully');
    process.exit(0);
  })
  .catch(error => {
    console.error('Error running test:', error);
    process.exit(1);
  });
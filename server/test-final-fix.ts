import { SupabaseAdapter } from './final-supabase-adapter';
import { testDatabaseConnection, getAvailableEvents } from './supabase-db';

async function testTeamNameFix() {
  console.log('Testing final Supabase adapter with team name fix...');
  
  // Test database connection
  const isConnected = await testDatabaseConnection();
  console.log(`Database connection: ${isConnected ? 'Success ✅' : 'Failed ❌'}`);
  
  if (!isConnected) {
    console.log('Cannot proceed with tests - database connection failed');
    return;
  }
  
  // Get available events
  const events = await getAvailableEvents();
  console.log(`Found ${events.length} events: ${events.map(e => `${e.eventId}: ${e.eventName}`).join(', ')}`);
  
  if (events.length === 0) {
    console.log('No events found, cannot proceed with tests');
    return;
  }
  
  // Create adapter instance
  const adapter = new SupabaseAdapter();
  
  // Test each event
  for (const event of events) {
    console.log(`\n--- Testing Event: ${event.eventName} (ID: ${event.eventId}) ---`);
    
    // Test team retrieval
    console.log('\nRetrieving team data...');
    const teams = await adapter.getTeamsForEvent(event.eventId);
    
    console.log(`Found ${teams.length} teams in event ${event.eventId}:`);
    teams.forEach(team => {
      console.log(`- ${team.name}: ${team.players} players`);
    });
    
    // Test player retrieval
    console.log('\nRetrieving player data...');
    const players = await adapter.getPlayersForEvent(event.eventId);
    
    console.log(`Found ${players.length} players in event ${event.eventId}`);
    
    if (players.length > 0) {
      // Count how many players have team names
      const playersWithTeamNames = players.filter(p => p.teamName && p.teamName.length > 0);
      console.log(`Players with team names: ${playersWithTeamNames.length}/${players.length}`);
      
      // Show sample players from different teams
      console.log('\nSample players from different teams:');
      
      // Get one player from each team
      const teamPlayers = new Map<string, any>();
      for (const player of players) {
        if (player.teamName && !teamPlayers.has(player.teamName)) {
          teamPlayers.set(player.teamName, player);
        }
      }
      
      // Print sample player information
      for (const [teamName, player] of teamPlayers.entries()) {
        console.log(`- ${player.playerName} (${teamName})`);
      }
    }
  }
  
  console.log('\nTest completed.');
}

// Run the test
testTeamNameFix()
  .then(() => {
    console.log('All tests completed');
    process.exit(0);
  })
  .catch((error) => {
    console.error('Error running tests:', error);
    process.exit(1);
  });
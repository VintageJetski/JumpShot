import { SupabaseAdapter } from './supabase-working-adapter';
import { testDatabaseConnection, getAvailableEvents } from './supabase-db';

async function testWorkingAdapter() {
  console.log('Testing improved Supabase adapter...');
  
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
    const startTeamTime = Date.now();
    const teams = await adapter.getTeamsForEvent(event.eventId);
    const endTeamTime = Date.now();
    
    console.log(`Found ${teams.length} teams in ${endTeamTime - startTeamTime}ms`);
    
    if (teams.length > 0) {
      console.log('Sample team data:');
      console.log(teams[0]);
    }
    
    // Test player retrieval
    console.log('\nRetrieving player data...');
    const startPlayerTime = Date.now();
    const players = await adapter.getPlayersForEvent(event.eventId);
    const endPlayerTime = Date.now();
    
    console.log(`Found ${players.length} players in ${endPlayerTime - startPlayerTime}ms`);
    
    if (players.length > 0) {
      console.log('Sample player data:');
      console.log(players[0]);
      
      // Calculate average stats for players in this event
      const avgKills = players.reduce((sum, p) => sum + p.kills, 0) / players.length;
      const avgDeaths = players.reduce((sum, p) => sum + p.deaths, 0) / players.length;
      
      console.log(`\nAverage stats for this event:`);
      console.log(`- Kills: ${avgKills.toFixed(2)}`);
      console.log(`- Deaths: ${avgDeaths.toFixed(2)}`);
      
      // Check team distribution
      const teamCounts = new Map<number, number>();
      for (const player of players) {
        if (player.team_id > 0) {
          teamCounts.set(player.team_id, (teamCounts.get(player.team_id) || 0) + 1);
        }
      }
      
      console.log(`\nTeam distribution (${teamCounts.size} teams):`);
      for (const [teamId, count] of teamCounts.entries()) {
        const teamName = teams.find(t => t.name === (teams.find(team => team.name.includes(teamId.toString()))?.name))?.name || 'Unknown';
        console.log(`- Team ${teamId} (${teamName}): ${count} players`);
      }
    }
  }
  
  console.log('\nTest completed.');
}

// Run the test
testWorkingAdapter()
  .then(() => {
    console.log('All tests completed');
    process.exit(0);
  })
  .catch((error) => {
    console.error('Error running tests:', error);
    process.exit(1);
  });
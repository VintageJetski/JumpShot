import { testDatabaseConnection, getAvailableEvents } from './supabase-db';
import { SupabaseAdapter } from './supabase-adapter-new';

async function testSupabaseIntegration() {
  console.log('Testing Supabase integration...');
  
  // Test connection
  const isConnected = await testDatabaseConnection();
  console.log(`Database connection: ${isConnected ? 'Success ✅' : 'Failed ❌'}`);
  
  if (!isConnected) {
    console.log('Cannot proceed with tests - no database connection');
    return;
  }
  
  // Get available events
  const events = await getAvailableEvents();
  console.log(`Found ${events.length} events:`, events.map(e => `${e.eventId}: ${e.eventName}`).join(', '));
  
  if (events.length === 0) {
    console.log('No events found, cannot proceed with tests');
    return;
  }
  
  // Create adapter
  const adapter = new SupabaseAdapter();
  
  // Test first event
  const firstEvent = events[0];
  console.log(`\nTesting event ${firstEvent.eventName} (ID: ${firstEvent.eventId})...`);
  
  // Get players for first event
  console.log('Getting players...');
  const startTime = Date.now();
  const players = await adapter.getPlayersForEvent(firstEvent.eventId);
  const endTime = Date.now();
  
  console.log(`Found ${players.length} players in ${endTime - startTime}ms`);
  
  // Show sample player data
  if (players.length > 0) {
    console.log('\nSample player data:');
    console.log(players[0]);
  }
  
  // Get teams for first event
  console.log('\nGetting teams...');
  const teamsStartTime = Date.now();
  const teams = await adapter.getTeamsForEvent(firstEvent.eventId);
  const teamsEndTime = Date.now();
  
  console.log(`Found ${teams.length} teams in ${teamsEndTime - teamsStartTime}ms`);
  
  // Show sample team data
  if (teams.length > 0) {
    console.log('\nSample team data:');
    console.log(teams[0]);
  }
  
  // If there are multiple events, test the second one too
  if (events.length > 1) {
    const secondEvent = events[1];
    console.log(`\nTesting event ${secondEvent.eventName} (ID: ${secondEvent.eventId})...`);
    
    // Get player count for second event
    console.log('Getting players...');
    const startTime2 = Date.now();
    const players2 = await adapter.getPlayersForEvent(secondEvent.eventId);
    const endTime2 = Date.now();
    
    console.log(`Found ${players2.length} players in ${endTime2 - startTime2}ms`);
    
    // Get team count for second event
    console.log('\nGetting teams...');
    const teamsStartTime2 = Date.now();
    const teams2 = await adapter.getTeamsForEvent(secondEvent.eventId);
    const teamsEndTime2 = Date.now();
    
    console.log(`Found ${teams2.length} teams in ${teamsEndTime2 - teamsStartTime2}ms`);
  }
  
  console.log('\nTest completed.');
}

// Run the test
testSupabaseIntegration()
  .then(() => {
    console.log('All tests completed');
    process.exit(0);
  })
  .catch((error) => {
    console.error('Error running tests:', error);
    process.exit(1);
  });
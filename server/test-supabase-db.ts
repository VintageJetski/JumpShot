import { checkConnection, getEvents, getPlayersWithPIV, getTeamsWithTIR } from './supabase-adapter';

/**
 * Test the connection to Supabase and retrieve data
 */
async function testSupabaseDatabase() {
  console.log('Testing Supabase database connection and data retrieval...');
  
  try {
    // Check database connection
    const isConnected = await checkConnection();
    console.log(`Database connection: ${isConnected ? '✅ CONNECTED' : '❌ FAILED'}`);
    
    if (!isConnected) {
      console.log('Cannot continue tests without database connection');
      return;
    }
    
    // Test events
    console.log('\n--- EVENTS ---');
    try {
      console.log('Fetching available events from Supabase...');
      const events = await getEvents();
      console.log(`Found ${events.length} events:`);
      events.forEach(event => {
        console.log(`  Event ID: ${event.id}, Name: ${event.name}`);
      });
    } catch (error) {
      console.log('Error retrieving events:', error);
    }
    
    // Test players
    console.log('\n--- PLAYERS (Event 1) ---');
    try {
      console.log('Fetching players with PIV for event 1 from Supabase...');
      const players = await getPlayersWithPIV(1);
      console.log(`Found ${players.length} players`);
      
      if (players.length > 0) {
        // Show sample data
        const sample = players[0];
        console.log('\nSample player data:');
        console.log(`  Name: ${sample.name}`);
        console.log(`  Team: ${sample.team}`);
        console.log(`  Role: ${sample.role}`);
        console.log(`  PIV: ${sample.piv}`);
        console.log(`  Is IGL: ${sample.isIGL ? 'Yes' : 'No'}`);
      }
    } catch (error) {
      console.log('Error retrieving players:', error);
    }
    
    // Test teams
    console.log('\n--- TEAMS (Event 1) ---');
    try {
      console.log('Fetching teams with TIR for event 1 from Supabase...');
      const teams = await getTeamsWithTIR(1);
      console.log(`Found ${teams.length} teams`);
      
      if (teams.length > 0) {
        // Show sample data
        const sample = teams[0];
        console.log('\nSample team data:');
        console.log(`  Name: ${sample.name}`);
        console.log(`  TIR: ${sample.tir}`);
        console.log(`  Top Player: ${sample.topPlayer?.name || 'None'}`);
        console.log(`  Player Count: ${sample.players.length}`);
      }
    } catch (error) {
      console.log('Error retrieving teams:', error);
    }
    
  } catch (error) {
    console.error('Error during Supabase database tests:', error);
  }
  
  console.log('\nSupabase database tests completed');
}

testSupabaseDatabase();
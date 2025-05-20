import { testConnection, getEvents, getPlayersWithPIV, getTeamsWithTIR } from './supabase-database';

async function testSupabaseDatabase() {
  console.log('Testing Supabase database connection and data retrieval...');
  
  // Test connection
  const connected = await testConnection();
  console.log(`Database connection: ${connected ? '✅ CONNECTED' : '❌ FAILED'}`);
  
  if (!connected) {
    console.error('Cannot proceed with tests, database connection failed');
    return;
  }
  
  // Test getting events
  try {
    console.log('\n--- EVENTS ---');
    const events = await getEvents();
    console.log(`Found ${events.length} events:`);
    events.forEach(event => {
      console.log(`  Event ID: ${event.id}, Name: ${event.name}`);
    });
  } catch (error) {
    console.error('Error retrieving events:', error);
  }
  
  // Test getting players for event 1
  try {
    console.log('\n--- PLAYERS (Event 1) ---');
    const players = await getPlayersWithPIV(1);
    console.log(`Found ${players.length} players for event 1`);
    
    // Show first 5 players
    console.log('Top 5 players by PIV:');
    players.slice(0, 5).forEach(player => {
      console.log(`  ${player.name} (${player.team}) - PIV: ${player.piv.toFixed(2)}, Role: ${player.tRole}/${player.ctRole}, IGL: ${player.isIGL}`);
    });
  } catch (error) {
    console.error('Error retrieving players:', error);
  }
  
  // Test getting teams for event 1
  try {
    console.log('\n--- TEAMS (Event 1) ---');
    const teams = await getTeamsWithTIR(1);
    console.log(`Found ${teams.length} teams for event 1`);
    
    // Show all teams
    console.log('Teams by TIR:');
    teams.forEach(team => {
      console.log(`  ${team.name} - TIR: ${team.tir.toFixed(2)}, W/L: ${team.wins}/${team.losses}`);
      console.log(`    Top player: ${team.topPlayers[0]?.name || 'N/A'}`);
    });
  } catch (error) {
    console.error('Error retrieving teams:', error);
  }
}

// Run the tests
testSupabaseDatabase()
  .then(() => console.log('\nSupabase database tests completed'))
  .catch(error => console.error('Error during database tests:', error));
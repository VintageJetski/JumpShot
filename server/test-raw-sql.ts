import { RawSQLAdapter } from './raw-sql-adapter';
import { testDatabaseConnection } from './supabase-db';

async function testRawSqlAdapter() {
  console.log('Testing raw SQL adapter approach...');
  
  // Verify database connection
  const isConnected = await testDatabaseConnection();
  console.log(`Database connection: ${isConnected ? 'Success ✅' : 'Failed ❌'}`);
  
  if (!isConnected) {
    console.log('Cannot proceed with tests - no database connection');
    return;
  }
  
  // Create adapter
  const adapter = new RawSQLAdapter();
  
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
  
  // Get teams for first event
  console.log('\nGetting teams...');
  const teams = await adapter.getTeamsForEvent(firstEvent);
  console.log(`Found ${teams.length} teams:`);
  for (let i = 0; i < Math.min(5, teams.length); i++) {
    console.log(`- ${teams[i].name} (${teams[i].players} players)`);
  }
  if (teams.length > 5) {
    console.log(`... and ${teams.length - 5} more teams`);
  }
  
  // Get players for first event
  console.log('\nGetting players using raw SQL...');
  const startTime = Date.now();
  const players = await adapter.getPlayersForEvent(firstEvent);
  const endTime = Date.now();
  console.log(`Found ${players.length} players in ${endTime - startTime}ms`);
  
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
    // Show first 2 players per team as examples
    for (let i = 0; i < Math.min(2, teamPlayers.length); i++) {
      const player = teamPlayers[i];
      console.log(`  * ${player.name} (K/D: ${player.kd?.toFixed(2) || '0.00'}, ADR: ${player.adr?.toFixed(1) || '0.0'})`);
    }
    
    if (teamPlayers.length > 2) {
      console.log(`  * ... and ${teamPlayers.length - 2} more players`);
    }
  }
  
  // Show stats for a sample player
  if (players.length > 0) {
    const samplePlayer = players[0];
    console.log('\nSample player details:');
    console.log(`Name: ${samplePlayer.name}`);
    console.log(`Team: ${samplePlayer.team}`);
    console.log(`Roles: CT=${samplePlayer.ct_role}, T=${samplePlayer.t_role}`);
    console.log('Stats:');
    console.log(`- Kills: ${samplePlayer.kills}`);
    console.log(`- Deaths: ${samplePlayer.deaths}`);
    console.log(`- K/D: ${samplePlayer.kd?.toFixed(2) || 'N/A'}`);
    console.log(`- ADR: ${samplePlayer.adr?.toFixed(1) || 'N/A'}`);
    console.log(`- KAST: ${samplePlayer.kast?.toFixed(1) || 'N/A'}%`);
    console.log(`- Opening kills: ${samplePlayer.openingKills}`);
    console.log(`- AWP kills: ${samplePlayer.awp_kills}`);
    console.log(`- Utility damage: ${samplePlayer.utilityDamage?.toFixed(1) || 'N/A'}`);
  }
  
  // Test second event if available
  if (eventIds.length > 1) {
    const secondEvent = eventIds[1];
    console.log(`\n===== Testing event ID: ${secondEvent} =====`);
    
    // Get players for second event
    console.log('\nGetting players for second event...');
    const startTime2 = Date.now();
    const players2 = await adapter.getPlayersForEvent(secondEvent);
    const endTime2 = Date.now();
    console.log(`Found ${players2.length} players in ${endTime2 - startTime2}ms`);
    
    // Get players in both events
    const playersInBothEvents = players.filter(p1 => 
      players2.some(p2 => p1.name === p2.name)
    );
    
    console.log(`\nPlayers appearing in both events: ${playersInBothEvents.length}`);
    if (playersInBothEvents.length > 0) {
      console.log('Sample players in both events:');
      for (let i = 0; i < Math.min(5, playersInBothEvents.length); i++) {
        console.log(`- ${playersInBothEvents[i].name} (Team in event 1: ${playersInBothEvents[i].team})`);
      }
    }
  }
}

// Run the test
testRawSqlAdapter()
  .then(() => {
    console.log('\nTest completed successfully');
    process.exit(0);
  })
  .catch(error => {
    console.error('Error running test:', error);
    process.exit(1);
  });
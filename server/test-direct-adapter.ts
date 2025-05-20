import { DirectSupabaseAdapter } from './direct-supabase-adapter';

/**
 * Tests the direct Supabase adapter with the real database structure
 */
async function testDirectAdapter() {
  console.log('Testing direct Supabase adapter...');
  
  const adapter = new DirectSupabaseAdapter();
  
  // Test connection
  const connected = await adapter.checkConnection();
  console.log(`Database connection: ${connected ? 'Success ✅' : 'Failed ❌'}`);
  
  if (!connected) {
    console.error('Cannot continue testing without database connection');
    return;
  }
  
  // Test getting players with PIV
  console.log('\nTesting getPlayersWithPIV:');
  const players = await adapter.getPlayersWithPIV();
  console.log(`Found ${players.length} players with PIV values`);
  
  if (players.length > 0) {
    // Display sample player data
    console.log('\nSample player data:');
    for (let i = 0; i < Math.min(3, players.length); i++) {
      const player = players[i];
      console.log(`- ${player.name} (Team: ${player.teamName})`);
      console.log(`  Role: ${player.role}, IGL: ${player.isIGL ? 'Yes' : 'No'}`);
      console.log(`  PIV: ${player.piv.toFixed(4)}, K/D: ${player.kd.toFixed(2)}`);
      console.log(`  Metrics: ${JSON.stringify(player.metrics)}`);
    }
  }
  
  // Test getting teams with TIR
  console.log('\nTesting getTeamsWithTIR:');
  const teams = await adapter.getTeamsWithTIR();
  console.log(`Found ${teams.length} teams with TIR values`);
  
  if (teams.length > 0) {
    // Display sample team data
    console.log('\nSample team data:');
    for (let i = 0; i < Math.min(3, teams.length); i++) {
      const team = teams[i];
      console.log(`- ${team.name}`);
      console.log(`  TIR: ${team.tir.toFixed(2)}, Avg PIV: ${team.averagePIV.toFixed(4)}`);
      console.log(`  Players: ${team.players.length}`);
      console.log(`  Role Distribution: ${JSON.stringify(team.roleDistribution)}`);
      console.log(`  Strengths: ${team.strengths.join(', ')}`);
      console.log(`  Weaknesses: ${team.weaknesses.join(', ')}`);
    }
  }
}

// Run the test
testDirectAdapter()
  .then(() => console.log('\nTest completed successfully'))
  .catch(error => console.error('\nTest failed:', error));
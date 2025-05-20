import { supabaseStorage } from './simplified-supabase-storage';

/**
 * Test script to verify our simplified Supabase integration
 */
async function testSimplifiedIntegration() {
  console.log('Testing simplified Supabase integration...');
  
  // Step 1: Check Supabase connection
  console.log('\n--- Step 1: Testing Supabase Connection ---');
  const isConnected = await supabaseStorage.checkConnection();
  console.log(`Supabase connection: ${isConnected ? 'Success ✅' : 'Failed ❌'}`);
  
  // Step 2: Get players with PIV
  console.log('\n--- Step 2: Getting Players with PIV ---');
  const players = await supabaseStorage.getPlayersWithPIV();
  console.log(`Retrieved ${players.length} players with PIV calculations`);
  
  if (players.length > 0) {
    console.log('\nSample player data (top 3):');
    players.slice(0, 3).forEach(player => {
      console.log(`- ${player.id} (${player.teamName}): PIV = ${player.piv.toFixed(3)}`);
      console.log(`  Role: ${player.primaryRole}, Is IGL: ${player.isIGL}`);
      console.log(`  PIV Components: RCS = ${player.pivComponents.rcs.toFixed(3)}, ICF = ${player.pivComponents.icf.toFixed(3)}, SC = ${player.pivComponents.sc.toFixed(3)}`);
    });
  }
  
  // Step 3: Get teams with TIR
  console.log('\n--- Step 3: Getting Teams with TIR ---');
  const teams = await supabaseStorage.getTeamsWithTIR();
  console.log(`Retrieved ${teams.length} teams with TIR calculations`);
  
  if (teams.length > 0) {
    console.log('\nSample team data (top 3):');
    teams.slice(0, 3).forEach(team => {
      console.log(`- ${team.name}: TIR = ${team.tir.toFixed(3)}, Players: ${team.players.length}`);
      console.log(`  Strengths: ${team.strengths.join(', ')}`);
      console.log(`  Weaknesses: ${team.weaknesses.join(', ')}`);
      console.log(`  Role Distribution: ${JSON.stringify(team.roleDistribution)}`);
    });
  }
  
  console.log('\nIntegration test completed!');
}

// Run the test
testSimplifiedIntegration()
  .then(() => {
    console.log('Test finished successfully.');
    process.exit(0);
  })
  .catch(error => {
    console.error('Error during test:', error);
    process.exit(1);
  });
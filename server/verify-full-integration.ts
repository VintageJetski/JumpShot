import { supabaseStorage } from './supabase-storage';
import { dataRefreshManager } from './dataRefreshManager';

/**
 * Test script to verify the full integration of Supabase with our application
 */
async function verifyFullIntegration() {
  console.log('Verifying full Supabase integration...');
  
  // Step 1: Check Supabase connection
  console.log('\n--- Step 1: Testing Supabase Connection ---');
  const isConnected = await dataRefreshManager.checkSupabaseConnection();
  console.log(`Supabase connection: ${isConnected ? 'Success ✅' : 'Failed ❌'}`);
  
  if (!isConnected) {
    console.log('Cannot proceed with tests - database connection failed');
    console.log('Make sure the DATABASE_URL environment variable is correctly set with your Supabase connection string');
    return;
  }
  
  // Step 2: Get available events
  console.log('\n--- Step 2: Retrieving Available Events ---');
  const events = await supabaseStorage.getEvents();
  console.log(`Found ${events.length} events: ${events.map(e => `${e.id}: ${e.name}`).join(', ')}`);
  
  if (events.length === 0) {
    console.log('No events found, cannot proceed with tests');
    return;
  }
  
  // Step 3: Get players with PIV for each event
  console.log('\n--- Step 3: Testing Player Data Retrieval with PIV ---');
  for (const event of events) {
    console.log(`\nTesting Event: ${event.name} (ID: ${event.id})`);
    
    const players = await supabaseStorage.getPlayersWithPIV(event.id);
    console.log(`Found ${players.length} players with PIV calculations`);
    
    if (players.length > 0) {
      // Show sample players
      console.log('Sample players (first 3):');
      players.slice(0, 3).forEach(player => {
        console.log(`- ${player.id}: PIV = ${player.piv.toFixed(3)}, Role = ${player.primaryRole}, Team = ${player.teamName}`);
      });
      
      // PIV distribution
      const pivValues = players.map(p => p.piv);
      const avgPIV = pivValues.reduce((sum, val) => sum + val, 0) / pivValues.length;
      const minPIV = Math.min(...pivValues);
      const maxPIV = Math.max(...pivValues);
      console.log(`PIV Distribution - Average: ${avgPIV.toFixed(3)}, Min: ${minPIV.toFixed(3)}, Max: ${maxPIV.toFixed(3)}`);
    }
  }
  
  // Step 4: Get teams with TIR for each event
  console.log('\n--- Step 4: Testing Team Data Retrieval with TIR ---');
  for (const event of events) {
    console.log(`\nTesting Event: ${event.name} (ID: ${event.id})`);
    
    const teams = await supabaseStorage.getTeamsWithTIR(event.id);
    console.log(`Found ${teams.length} teams with TIR calculations`);
    
    if (teams.length > 0) {
      // Show team information
      console.log('Team Information:');
      teams.forEach(team => {
        console.log(`- ${team.name}: TIR = ${team.tir.toFixed(3)}, Players = ${team.players.length}`);
        console.log(`  Strengths: ${team.strengths.join(', ')}`);
        console.log(`  Weaknesses: ${team.weaknesses.join(', ')}`);
      });
    }
  }
  
  // Step 5: Test data refresh
  console.log('\n--- Step 5: Testing Data Refresh ---');
  console.log('Initiating data refresh...');
  await dataRefreshManager.refreshData();
  const lastRefresh = dataRefreshManager.getLastRefreshTime();
  console.log(`Data refresh completed at: ${lastRefresh?.toISOString()}`);
  
  console.log('\nVerification completed!');
  if (isConnected) {
    console.log('✅ Supabase integration successful - Now using Supabase as the primary data source');
    console.log('The system will automatically fall back to CSV data if Supabase becomes unavailable');
  } else {
    console.log('❌ Supabase integration failed - System will use CSV data as fallback');
  }
}

// Run the verification
verifyFullIntegration()
  .then(() => {
    console.log('Verification process completed.');
    process.exit(0);
  })
  .catch(error => {
    console.error('Error during verification:', error);
    process.exit(1);
  });
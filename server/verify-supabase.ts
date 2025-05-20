import { SupabaseStorage } from './supabase-storage';
import { testDatabaseConnection, getAvailableEvents } from './supabase-db';

/**
 * Script to verify Supabase connection and test data retrieval
 */
async function verifySupabaseIntegration() {
  console.log('Verifying Supabase integration...');
  
  // Test database connection
  console.log('Testing database connection...');
  const isConnected = await testDatabaseConnection();
  
  if (!isConnected) {
    console.error('❌ Failed to connect to Supabase database');
    console.log('Please check your connection string and make sure the database is accessible');
    return;
  }
  
  console.log('✅ Successfully connected to Supabase database');
  
  // Check available events
  console.log('\nChecking available events...');
  const events = await getAvailableEvents();
  
  if (!events || events.length === 0) {
    console.error('❌ No events found in the database');
    return;
  }
  
  console.log(`✅ Found ${events.length} events:`);
  events.forEach(event => {
    console.log(`   - ID: ${event.eventId}, Name: ${event.eventName}`);
  });
  
  // Initialize storage
  console.log('\nInitializing SupabaseStorage...');
  const storage = new SupabaseStorage();
  await storage.initialize();
  
  if (!storage.isSupabaseConnected()) {
    console.error('❌ SupabaseStorage failed to initialize properly');
    return;
  }
  
  console.log('✅ SupabaseStorage initialized successfully');
  
  // Test fetching player data for each event
  console.log('\nTesting player data retrieval...');
  
  for (const event of events) {
    console.log(`\nFetching player data for event: ${event.eventName} (ID: ${event.eventId})`);
    
    try {
      const playerStats = await storage.getPlayerStatsForEvent(event.eventId);
      
      if (!playerStats || playerStats.length === 0) {
        console.log(`❌ No player data found for event ${event.eventName}`);
        continue;
      }
      
      console.log(`✅ Successfully retrieved ${playerStats.length} players for event ${event.eventName}`);
      console.log('   Sample players:');
      
      // Show sample of 5 players
      const sampleSize = Math.min(5, playerStats.length);
      for (let i = 0; i < sampleSize; i++) {
        const player = playerStats[i];
        console.log(`   - ${player.name} (Team: ${player.team || 'Unknown'})`);
        console.log(`     KD: ${player.kd.toFixed(2)}, ADR: ${player.adr.toFixed(2)}, KAST: ${(player.kast * 100).toFixed(2)}%`);
      }
      
      // Test PIV calculation
      console.log(`\nTesting PIV calculation for event: ${event.eventName} (ID: ${event.eventId})`);
      const playersWithPIV = await storage.getPlayerStatsWithPIV(event.eventId);
      
      if (!playersWithPIV || playersWithPIV.length === 0) {
        console.log(`❌ Failed to calculate PIV for event ${event.eventName}`);
        continue;
      }
      
      console.log(`✅ Successfully calculated PIV for ${playersWithPIV.length} players`);
      console.log('   Top 5 players by PIV:');
      
      // Show top 5 players by PIV
      const topPlayers = [...playersWithPIV].sort((a, b) => b.piv - a.piv).slice(0, 5);
      for (const player of topPlayers) {
        console.log(`   - ${player.stats.name} (PIV: ${player.piv.toFixed(2)}, Role: ${player.primaryRole})`);
      }
      
      // Test team data
      console.log(`\nTesting team data for event: ${event.eventName} (ID: ${event.eventId})`);
      const teamsWithTIR = await storage.getTeamStatsWithTIR(event.eventId);
      
      if (!teamsWithTIR || teamsWithTIR.length === 0) {
        console.log(`❌ No team data found for event ${event.eventName}`);
        continue;
      }
      
      console.log(`✅ Successfully retrieved ${teamsWithTIR.length} teams for event ${event.eventName}`);
      console.log('   Teams sorted by TIR:');
      
      // Show all teams sorted by TIR
      for (const team of teamsWithTIR) {
        console.log(`   - ${team.name} (TIR: ${team.tir.toFixed(2)}, Avg PIV: ${team.avgPIV.toFixed(2)}, Players: ${team.players.length})`);
      }
    } catch (error) {
      console.error(`❌ Error processing event ${event.eventName}:`, error);
    }
  }
  
  console.log('\nVerification complete!');
}

// Run the verification
verifySupabaseIntegration()
  .then(() => {
    process.exit(0);
  })
  .catch(error => {
    console.error('Verification failed with error:', error);
    process.exit(1);
  });
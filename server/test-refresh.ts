import { dataRefreshManager } from './dataRefreshManager';

/**
 * Test the data refresh functionality with pure Supabase data
 */
async function testDataRefresh() {
  console.log('=== Testing Data Refresh with Pure Supabase Data ===');
  console.log('');
  
  try {
    // Test the refresh functionality
    console.log('1. Testing data refresh...');
    await dataRefreshManager.refreshData();
    
    console.log('');
    console.log('2. Checking refresh status...');
    const lastRefresh = dataRefreshManager.getLastRefreshTime();
    const isSupabaseAvailable = dataRefreshManager.isSupabaseAvailable();
    
    console.log(`   - Last refresh: ${lastRefresh ? lastRefresh.toISOString() : 'Never'}`);
    console.log(`   - Supabase available: ${isSupabaseAvailable}`);
    
    console.log('');
    console.log('3. Testing storage access...');
    const storage = dataRefreshManager.getStorage();
    const events = storage.getEvents();
    
    console.log(`   - Found ${events.length} events:`);
    for (const event of events) {
      console.log(`     * Event ${event.id}: ${event.name}`);
      
      try {
        const players = await storage.getPlayerStatsForEvent(event.id);
        const teams = await storage.getTeamStatsForEvent(event.id);
        console.log(`       - ${players.length} players, ${teams.length} teams`);
      } catch (error) {
        console.log(`       - Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    }
    
    console.log('');
    console.log('✓ Data refresh test completed successfully!');
    
  } catch (error) {
    console.error('');
    console.error('✗ Data refresh test failed:');
    console.error(`  Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    
    if (error instanceof Error && error.stack) {
      console.error('  Stack trace:');
      console.error(error.stack);
    }
  }
}

// Run the test
testDataRefresh().then(() => {
  console.log('');
  console.log('=== Test Complete ===');
}).catch(console.error);
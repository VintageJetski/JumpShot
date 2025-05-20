import { supaDb } from './supabase-db';
import { supaEvents, supaPlayerMatchSummary } from '@shared/schema';
import { SupabaseAdapter } from './supabase-adapter';

/**
 * Test script to verify we can access multiple events in Supabase
 */
async function testMultipleEvents() {
  try {
    console.log('Testing Supabase multi-event retrieval');
    
    // Get all events
    const events = await supaDb.select().from(supaEvents);
    console.log(`\nFound ${events.length} events in the database:`);
    for (const event of events) {
      console.log(`- Event ID ${event.eventId}: ${event.eventName}`);
      
      // Count players in this event
      const playerSummaries = await supaDb.select()
        .from(supaPlayerMatchSummary)
        .where(supaPlayerMatchSummary.eventId === event.eventId);
      
      console.log(`  * Contains ${playerSummaries.length} player summaries`);
      
      // Sample 2 players from this event
      if (playerSummaries.length > 0) {
        console.log('  * Sample players:');
        for (let i = 0; i < Math.min(2, playerSummaries.length); i++) {
          const playerSummary = playerSummaries[i];
          
          // Get player data with our adapter
          const playerData = await SupabaseAdapter.fetchPlayerData(playerSummary.steamId);
          if (playerData && playerData.player) {
            console.log(`    - ${playerData.player.userName} (Team: ${playerData.teamInfo?.teamClanName || 'Unknown'})`);
          }
        }
      }
    }
    
    // Check if we have player data in multiple events
    if (events.length > 1) {
      console.log('\nChecking for players in multiple events:');
      
      // Get all player IDs
      const allPlayers = await supaDb.select().from(supaPlayerMatchSummary);
      
      // Group by player ID
      const playerEventMap = new Map<number, Set<number>>();
      
      for (const summary of allPlayers) {
        if (!playerEventMap.has(summary.steamId)) {
          playerEventMap.set(summary.steamId, new Set());
        }
        playerEventMap.get(summary.steamId)?.add(summary.eventId);
      }
      
      // Find players in multiple events
      let multiEventPlayers = 0;
      for (const [steamId, eventIds] of playerEventMap.entries()) {
        if (eventIds.size > 1) {
          multiEventPlayers++;
          
          const playerData = await SupabaseAdapter.fetchPlayerData(steamId);
          if (playerData && playerData.player) {
            console.log(`- ${playerData.player.userName} appears in ${eventIds.size} events:`);
            for (const eventId of eventIds) {
              const event = events.find(e => e.eventId === eventId);
              if (event) {
                console.log(`  * ${event.eventName}`);
              }
            }
          }
          
          // Limit to 3 examples
          if (multiEventPlayers >= 3) break;
        }
      }
      
      if (multiEventPlayers === 0) {
        console.log('No players found in multiple events');
      }
    }
    
    console.log('\nTest completed successfully');
  } catch (error) {
    console.error('Error during test:', error);
  }
}

// Run the test
testMultipleEvents();
import { supaDb } from './supabase-db';
import { supaEvents, supaPlayers, supaTeams, supaPlayerMatchSummary } from '@shared/schema';
import { SupabaseAdapter } from './supabase-adapter';
import { Pool } from '@neondatabase/serverless';

/**
 * Test script to verify Supabase connection and data retrieval
 */
async function testSupabaseConnection() {
  try {
    console.log('Testing Supabase connection...');
    
    // Check connection with simple query
    const result = await supaDb.select({ now: 'NOW()' }).execute();
    console.log('Connection successful:', result[0]?.now);
    
    // Query all events
    console.log('\nFetching events...');
    const events = await supaDb.select().from(supaEvents);
    console.log(`Found ${events.length} events:`);
    events.forEach(event => {
      console.log(`- ${event.id}: ${event.name} (${event.startDate} to ${event.endDate})`);
    });
    
    // Query teams
    console.log('\nFetching teams...');
    const teams = await supaDb.select().from(supaTeams);
    console.log(`Found ${teams.length} teams`);
    console.log('Sample teams:');
    teams.slice(0, 5).forEach(team => {
      console.log(`- ${team.id}: ${team.teamClanName}`);
    });
    
    // Query players
    console.log('\nFetching players...');
    const players = await supaDb.select().from(supaPlayers);
    console.log(`Found ${players.length} players`);
    console.log('Sample players:');
    players.slice(0, 5).forEach(player => {
      console.log(`- ${player.steamId}: ${player.userName}`);
    });
    
    // Test adapter to fetch complete player data
    console.log('\nTesting adapter with a sample player...');
    if (players.length > 0) {
      const samplePlayer = players[0];
      console.log(`Fetching complete data for player: ${samplePlayer.userName} (${samplePlayer.steamId})`);
      
      const playerData = await SupabaseAdapter.fetchPlayerData(samplePlayer.steamId);
      console.log('Player data retrieved:', playerData ? 'Success' : 'Failed');
      
      if (playerData) {
        console.log('Player information:');
        console.log(`- Name: ${playerData.player.userName}`);
        console.log(`- Team: ${playerData.teamInfo?.teamClanName || 'Unknown'}`);
        console.log(`- Stats available: ${Boolean(playerData.killStats)}`);
        
        // Map to application format
        const mappedStats = SupabaseAdapter.mapToPlayerRawStats(playerData);
        console.log('\nMapped to application format:');
        console.log(`- Name: ${mappedStats.userName}`);
        console.log(`- Team: ${mappedStats.teamName}`);
        console.log(`- K/D: ${mappedStats.kd}`);
        console.log(`- Kills: ${mappedStats.kills}`);
      }
    }
    
    // Optionally test querying data from both events
    if (events.length > 1) {
      console.log('\nComparing data between events...');
      
      for (const event of events) {
        const playerCount = await supaDb.select({ count: 'count(*)' })
          .from(supaPlayers)
          .innerJoin(
            'player_match_summary', 
            `player_match_summary.steam_id = players.steam_id AND player_match_summary.event_id = ${event.id}`
          );
        
        console.log(`Event ${event.id} (${event.name}): ${playerCount[0]?.count || 0} players`);
      }
    }
    
    console.log('\nTest completed successfully');
  } catch (error) {
    console.error('Error during test:', error);
  }
}

// Run the test
testSupabaseConnection();
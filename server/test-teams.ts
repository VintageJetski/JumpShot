import { db } from './supabase-db';
import { SupabaseAdapter } from './supabase-adapter-new';

async function testTeamDataRetrieval() {
  console.log('Testing team data retrieval from Supabase...');
  
  try {
    // Test direct SQL query first to identify teams
    const eventId = 1; // Testing with IEM_Katowice_2025
    
    console.log(`Getting team IDs for event ${eventId} directly...`);
    const query = `SELECT DISTINCT team_id FROM player_match_summary WHERE event_id = ${eventId} AND team_id IS NOT NULL`;
    const result = await db.execute(query);
    
    const teamIds = (result.rows as { team_id: number }[]).map(t => t.team_id);
    console.log(`Found ${teamIds.length} team IDs: ${teamIds.join(', ')}`);
    
    // Get team names
    if (teamIds.length > 0) {
      console.log(`Getting team names for team IDs...`);
      const teamNamesQuery = `SELECT * FROM teams WHERE id IN (${teamIds.join(',')})`;
      const teamsResult = await db.execute(teamNamesQuery);
      
      console.log(`Found ${teamsResult.rows.length} teams:`);
      for (const team of teamsResult.rows) {
        console.log(`- ID: ${team.id}, Name: ${team.team_clan_name}`);
      }
    }
    
    // Now test adapter
    console.log('\nTesting the adapter getTeamsForEvent method:');
    const adapter = new SupabaseAdapter();
    const teams = await adapter.getTeamsForEvent(eventId);
    
    console.log(`Adapter returned ${teams.length} teams:`);
    for (const team of teams) {
      console.log(`- Name: ${team.name}, Players: ${team.players}`);
    }
    
    // Test second event
    const eventId2 = 2; // PGL_Bucharest_2025
    console.log(`\nTesting with event ${eventId2} (PGL_Bucharest_2025):`);
    const teams2 = await adapter.getTeamsForEvent(eventId2);
    
    console.log(`Adapter returned ${teams2.length} teams for event ${eventId2}:`);
    for (const team of teams2) {
      console.log(`- Name: ${team.name}, Players: ${team.players}`);
    }
    
  } catch (error) {
    console.error('Error testing team data:', error);
  }
}

// Run the test
testTeamDataRetrieval()
  .then(() => {
    console.log('\nTest completed successfully');
    process.exit(0);
  })
  .catch(error => {
    console.error('Error running test:', error);
    process.exit(1);
  });
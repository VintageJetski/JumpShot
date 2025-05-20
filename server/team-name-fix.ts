import { db } from './supabase-db';

/**
 * This script examines the relationship between team IDs and team names
 * to understand why our mapping is showing most teams as "3DMAX"
 */
async function investigateTeamNames() {
  console.log('Investigating team name mapping issues...');
  
  try {
    // First, get all team information from the teams table
    const teamsQuery = `SELECT id, team_clan_name FROM teams ORDER BY id`;
    const teamsResult = await db.execute(teamsQuery);
    const teams = teamsResult.rows as { id: number, team_clan_name: string }[];
    
    console.log(`\nFound ${teams.length} teams in the teams table:`);
    teams.forEach(team => {
      console.log(`ID: ${team.id}, Name: ${team.team_clan_name}`);
    });
    
    // For event 1, get all team IDs used by players
    console.log('\nTeam IDs used in event 1:');
    const event1Query = `
      SELECT DISTINCT team_id, COUNT(*) as player_count
      FROM player_match_summary
      WHERE event_id = 1
      GROUP BY team_id
      ORDER BY team_id
    `;
    
    const event1Result = await db.execute(event1Query);
    const event1Teams = event1Result.rows as { team_id: number, player_count: string }[];
    
    for (const team of event1Teams) {
      const teamName = teams.find(t => t.id === team.team_id)?.team_clan_name || 'Unknown';
      console.log(`Team ID: ${team.team_id}, Team Name: ${teamName}, Players: ${team.player_count}`);
    }
    
    // For event 2, get all team IDs used by players
    console.log('\nTeam IDs used in event 2:');
    const event2Query = `
      SELECT DISTINCT team_id, COUNT(*) as player_count
      FROM player_match_summary
      WHERE event_id = 2
      GROUP BY team_id
      ORDER BY team_id
    `;
    
    const event2Result = await db.execute(event2Query);
    const event2Teams = event2Result.rows as { team_id: number, player_count: string }[];
    
    for (const team of event2Teams) {
      const teamName = teams.find(t => t.id === team.team_id)?.team_clan_name || 'Unknown';
      console.log(`Team ID: ${team.team_id}, Team Name: ${teamName}, Players: ${team.player_count}`);
    }
    
    // Now let's check if the team IDs in our player data match with teams table
    console.log('\nChecking for team ID mismatches:');
    
    const allTeamIds = new Set([...event1Teams, ...event2Teams].map(t => t.team_id));
    const teamTableIds = new Set(teams.map(t => t.id));
    
    // IDs in player data that don't have a team name
    const missingTeamIds = [...allTeamIds].filter(id => !teamTableIds.has(id));
    if (missingTeamIds.length > 0) {
      console.log(`Found ${missingTeamIds.length} team IDs in player data without matching team names:`);
      console.log(missingTeamIds.join(', '));
    } else {
      console.log('All team IDs in player data have matching team names in the teams table.');
    }
    
    // Get one player from each team to verify the team assignments
    console.log('\nSample player from each team in event 1:');
    for (const team of event1Teams) {
      const playerQuery = `
        SELECT p.steam_id, p.user_name, pms.team_id
        FROM player_match_summary pms
        JOIN players p ON pms.steam_id = p.steam_id
        WHERE pms.event_id = 1 AND pms.team_id = ${team.team_id}
        LIMIT 1
      `;
      
      const playerResult = await db.execute(playerQuery);
      if (playerResult.rows && playerResult.rows.length > 0) {
        const player = playerResult.rows[0] as { steam_id: string, user_name: string, team_id: number };
        const teamName = teams.find(t => t.id === player.team_id)?.team_clan_name || 'Unknown';
        console.log(`Player: ${player.user_name}, Team ID: ${player.team_id}, Team Name: ${teamName}`);
      }
    }
  } catch (error) {
    console.error('Error investigating team names:', error);
  }
}

// Run the investigation
investigateTeamNames()
  .then(() => {
    console.log('Investigation completed.');
    process.exit(0);
  })
  .catch(error => {
    console.error('Error during investigation:', error);
    process.exit(1);
  });
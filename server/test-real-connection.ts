import { db } from './supabase-db';
import { processPlayerData } from './player-data-utils';
import { PlayerRawStats } from '../shared/schema';

/**
 * Direct test for the Supabase connection
 * Focuses on correctly handling player roles from the database
 */
async function testConnection() {
  console.log('Testing direct Supabase connection...');
  
  try {
    // Check connection
    console.log('Testing database connection...');
    const testResult = await db.execute('SELECT 1 as test');
    console.log(`Connection test: ${testResult.rows.length > 0 ? 'Success ✅' : 'Failed ❌'}`);
    
    // Get player data
    console.log('\nFetching player data directly...');
    const query = `SELECT * FROM player_stats LIMIT 5`;
    const result = await db.execute(query);
    
    console.log(`Query result: ${result.rows.length} players found`);
    
    // Process each player
    console.log('\nSample players:');
    const players: PlayerRawStats[] = [];
    
    for (const player of result.rows as any[]) {
      try {
        // Process the player explicitly with our utility 
        const processed = {
          steamId: player.steam_id || '',
          playerName: player.user_name || 'Unknown',
          teamName: player.team_clan_name || 'Unknown Team',
          team_id: 0,
          kills: player.kills || 0,
          deaths: player.deaths || 0,
          assists: player.assists || 0,
          rating: player.piv || 1.0,
          // Add minimum required fields
          adr: 0,
          kast: 0,
          impact: 0,
          ct_rating: 1.0,
          t_rating: 1.0,
          total_rounds: player.total_rounds_won ? player.total_rounds_won * 2 : 30,
          ct_rounds: player.ct_rounds_won || 15,
          t_rounds: player.t_rounds_won || 15,
          awp_kills: 0,
          opening_kills: player.first_kills || 0,
          opening_deaths: player.first_deaths || 0,
          opening_attempts: player.first_kills + player.first_deaths || 0,
          opening_success: player.first_kills || 0,
          flash_assists: player.assisted_flashes || 0,
          utility_damage: 0,
          utility_damage_round: 0,
          headshot_percent: player.headshots ? player.headshots / Math.max(1, player.kills) * 100 : 0,
          success_in_opening: player.first_kills ? player.first_kills / Math.max(1, player.first_kills + player.first_deaths) : 0,
          clutches_attempted: 0,
          clutches_won: 0,
          kpr: player.kills ? player.kills / 30 : 0,
          dpr: player.deaths ? player.deaths / 30 : 0,
          k_diff: (player.kills || 0) - (player.deaths || 0),
          kd_diff: player.kd || 1.0,
          rounds_survived: 30 - (player.deaths || 0),
          rounds_with_kills: 0,
          rounds_with_assists: 0,
          rounds_with_deaths: player.deaths || 0,
          damage: 0,
          rounds_with_kast: 0,
          eventId: 1
        };
        
        players.push(processed);
        
        console.log(`- ${processed.playerName} (${processed.teamName})`);
        console.log(`  Steam ID: ${processed.steamId}`);
        console.log(`  Role: ${player.role || 'Unknown'}, IGL: ${player.is_igl ? 'Yes' : 'No'}`);
        console.log(`  Stats: ${processed.kills}K/${processed.deaths}D/${processed.assists}A`);
      } catch (error) {
        console.error(`Error processing player ${player.user_name || 'Unknown'}:`, error);
      }
    }
    
    // Query team data
    console.log('\nFetching team data...');
    const teamQuery = `SELECT * FROM teams LIMIT 3`;
    const teamResult = await db.execute(teamQuery);
    
    console.log(`Query result: ${teamResult.rows.length} teams found`);
    
    // Sample team data
    console.log('\nSample teams:');
    for (const team of teamResult.rows as any[]) {
      console.log(`- ${team.name}`);
      console.log(`  TIR: ${team.tir || 0}`);
      console.log(`  Top player: ${team.top_player_name || 'N/A'} (PIV: ${team.top_player_piv || 0})`);
    }
    
  } catch (error) {
    console.error('Error testing connection:', error);
  }
}

// Run the test
testConnection()
  .then(() => {
    console.log('\nTest completed.');
    process.exit(0);
  })
  .catch(error => {
    console.error('\nTest failed:', error);
    process.exit(1);
  });
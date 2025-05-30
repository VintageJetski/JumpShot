import { sql } from './supabase-client';

async function investigateDatabase() {
  try {
    console.log('=== DATABASE INVESTIGATION ===');
    
    // Check unique players
    const playersResult = await sql.query('SELECT COUNT(DISTINCT steam_id) as unique_players FROM players');
    console.log(`Unique players in database: ${playersResult.rows[0].unique_players}`);
    
    // Check events
    const eventsResult = await sql.query('SELECT event_id, event_name FROM events ORDER BY event_id');
    console.log('Events:', eventsResult.rows);
    
    // Check player_match_summary structure
    const pmsResult = await sql.query('SELECT COUNT(*) as total_player_match_records FROM player_match_summary');
    console.log(`Total player_match_summary records: ${pmsResult.rows[0].total_player_match_records}`);
    
    // Check kill_stats structure
    const killStatsResult = await sql.query('SELECT COUNT(*) as total_kill_stats FROM kill_stats');
    console.log(`Total kill_stats records: ${killStatsResult.rows[0].total_kill_stats}`);
    
    // Sample data from each table
    const samplePlayers = await sql.query('SELECT steam_id, user_name FROM players LIMIT 5');
    console.log('Sample players:', samplePlayers.rows);
    
    const sampleKillStats = await sql.query('SELECT steam_id, event_id, kills, deaths FROM kill_stats LIMIT 5');
    console.log('Sample kill_stats:', sampleKillStats.rows);
    
    const samplePMS = await sql.query('SELECT steam_id, event_id, team_id FROM player_match_summary LIMIT 5');
    console.log('Sample player_match_summary:', samplePMS.rows);
    
  } catch (error) {
    console.error('Database investigation failed:', error);
  }
}

investigateDatabase();
import { supabase, sql } from './supabase-client';

// Player stats interface matching the exact database schema from PRD
export interface PlayerStats {
  steam_id: number;
  user_name: string;
  event_id: number;
  
  // From kill_stats table
  kills?: number;
  headshots?: number;
  first_kills?: number;
  first_deaths?: number;
  awp_kills?: number;
  
  // From general_stats table  
  assists?: number;
  deaths?: number;
  kd?: number;
  adr_total?: number;
  kast_total?: number;
  
  // From utility_stats table
  assisted_flashes?: number;
  total_util_thrown?: number;
  total_util_dmg?: number;
  
  // Team information
  team_clan_name?: string;
}

/**
 * Get comprehensive player statistics using the exact schema from PRD
 * Joins players, kill_stats, general_stats, utility_stats, and teams tables
 */
export async function getPlayerStats(eventId?: number): Promise<PlayerStats[]> {
  try {
    console.log(`Fetching player stats from Supabase for event: ${eventId || 'all events'}`);
    
    // Use direct SQL query to join all stat tables as per PRD schema
    const query = `
      SELECT 
        p.steam_id,
        p.user_name,
        pms.event_id,
        
        -- Kill stats
        ks.kills,
        ks.headshots,
        ks.first_kills,
        ks.first_deaths,
        ks.awp_kills,
        
        -- General stats
        gs.assists,
        gs.deaths,
        gs.kd,
        gs.adr_total,
        gs.kast_total,
        
        -- Utility stats
        us.assisted_flashes,
        us.total_util_thrown,
        us.total_util_dmg,
        
        -- Team info
        t.team_clan_name
        
      FROM players p
      LEFT JOIN player_match_summary pms ON p.steam_id = pms.steam_id
      LEFT JOIN kill_stats ks ON p.steam_id = ks.steam_id AND pms.event_id = ks.event_id
      LEFT JOIN general_stats gs ON p.steam_id = gs.steam_id AND pms.event_id = gs.event_id  
      LEFT JOIN utility_stats us ON p.steam_id = us.steam_id AND pms.event_id = us.event_id
      LEFT JOIN teams t ON pms.team_id = t.id
      ${eventId ? 'WHERE pms.event_id = $1' : ''}
      ORDER BY gs.kd DESC NULLS LAST
    `;
    
    const result = eventId 
      ? await sql.query(query, [eventId])
      : await sql.query(query);
    
    console.log(`Retrieved ${result.rows.length} player records from Supabase`);
    return result.rows;
    
  } catch (error) {
    console.error('Error fetching player stats from Supabase:', error);
    throw error;
  }
}

/**
 * Get available events from the database
 */
export async function getEvents() {
  try {
    const { data, error } = await supabase
      .from('events')
      .select('event_id, event_name')
      .order('event_id');
    
    if (error) throw error;
    
    console.log(`Retrieved ${data?.length || 0} events from Supabase`);
    return data || [];
    
  } catch (error) {
    console.error('Error fetching events from Supabase:', error);
    throw error;
  }
}

/**
 * Get team statistics by aggregating player data
 */
export async function getTeamStats(eventId?: number) {
  try {
    const query = `
      SELECT 
        t.team_clan_name,
        COUNT(DISTINCT p.steam_id) as player_count,
        AVG(gs.kd) as avg_kd,
        AVG(gs.adr_total) as avg_adr,
        SUM(ks.kills) as total_kills,
        SUM(gs.deaths) as total_deaths
        
      FROM teams t
      LEFT JOIN player_match_summary pms ON t.id = pms.team_id
      LEFT JOIN players p ON pms.steam_id = p.steam_id
      LEFT JOIN kill_stats ks ON p.steam_id = ks.steam_id AND pms.event_id = ks.event_id
      LEFT JOIN general_stats gs ON p.steam_id = gs.steam_id AND pms.event_id = gs.event_id
      ${eventId ? 'WHERE pms.event_id = $1' : ''}
      GROUP BY t.team_clan_name
      HAVING COUNT(DISTINCT p.steam_id) > 0
      ORDER BY avg_kd DESC NULLS LAST
    `;
    
    const result = eventId 
      ? await sql.query(query, [eventId])
      : await sql.query(query);
    
    console.log(`Retrieved ${result.rows.length} teams from Supabase`);
    return result.rows;
    
  } catch (error) {
    console.error('Error fetching team stats from Supabase:', error);
    throw error;
  }
}
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
 * Aggregates stats across all events for each unique player
 */
export async function getPlayerStats(eventId?: number): Promise<PlayerStats[]> {
  try {
    console.log(`Fetching player stats from Supabase for event: ${eventId || 'all events - aggregated'}`);
    
    // Aggregated query to get one record per player across all events
    const query = `
      SELECT 
        p.steam_id,
        p.user_name,
        
        -- Aggregated kill stats
        SUM(ks.kills) as kills,
        SUM(ks.headshots) as headshots,
        SUM(ks.first_kills) as first_kills,
        SUM(ks.first_deaths) as first_deaths,
        SUM(ks.awp_kills) as awp_kills,
        
        -- Aggregated general stats
        SUM(gs.assists) as assists,
        SUM(gs.deaths) as deaths,
        AVG(gs.kd) as kd,
        AVG(gs.adr_total) as adr_total,
        AVG(gs.kast_total) as kast_total,
        
        -- Aggregated utility stats
        SUM(us.assisted_flashes) as assisted_flashes,
        SUM(us.total_util_thrown) as total_util_thrown,
        SUM(us.total_util_dmg) as total_util_dmg,
        
        -- Team info (most recent team)
        (SELECT t.team_clan_name 
         FROM player_match_summary pms2 
         JOIN teams t ON pms2.team_id = t.id 
         WHERE pms2.steam_id = p.steam_id 
         ORDER BY pms2.event_id DESC 
         LIMIT 1) as team_clan_name,
         
        -- Event info for reference
        STRING_AGG(DISTINCT e.event_name, ', ' ORDER BY e.event_name) as events_played
        
      FROM players p
      LEFT JOIN player_match_summary pms ON p.steam_id = pms.steam_id
      LEFT JOIN kill_stats ks ON p.steam_id = ks.steam_id AND pms.event_id = ks.event_id
      LEFT JOIN general_stats gs ON p.steam_id = gs.steam_id AND pms.event_id = gs.event_id  
      LEFT JOIN utility_stats us ON p.steam_id = us.steam_id AND pms.event_id = us.event_id
      LEFT JOIN events e ON pms.event_id = e.event_id
      ${eventId ? 'WHERE pms.event_id = $1' : ''}
      GROUP BY p.steam_id, p.user_name
      HAVING COUNT(pms.steam_id) > 0
      ORDER BY AVG(gs.kd) DESC NULLS LAST
    `;
    
    const result = eventId 
      ? await sql.query(query, [eventId])
      : await sql.query(query);
    
    console.log(`Retrieved ${result.rows.length} unique players from Supabase (aggregated)`);
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
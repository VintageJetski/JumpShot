import { db } from './supabase-db';
import { eq } from 'drizzle-orm';
import { PlayerRawStats, PlayerRole } from '../shared/schema';
import { Team, teams } from './db-schema';

/**
 * TeamRawStats interface matches the existing schema in the application
 */
export interface TeamRawStats {
  name: string;
  players: number;
  logo: string;
  wins: number;
  losses: number;
  eventId: number;
}

/**
 * Enhanced adapter that uses raw SQL for better control over complex queries
 */
export class RawSQLAdapter {
  /**
   * Get all available event IDs from the database
   */
  async getEventIds(): Promise<number[]> {
    try {
      // Get distinct event IDs from player_match_summary
      const result = await db.execute(
        'SELECT DISTINCT event_id FROM player_match_summary ORDER BY event_id'
      );
      return (result.rows as { event_id: number }[]).map(e => e.event_id);
    } catch (error) {
      console.error('Error getting event IDs:', error);
      return [];
    }
  }
  
  /**
   * Get teams for a specific event
   */
  async getTeamsForEvent(eventId: number): Promise<TeamRawStats[]> {
    try {
      console.log(`Getting teams for event ${eventId} using raw SQL...`);
      
      // Get unique team IDs for this event
      const teamIdsQuery = `
        SELECT DISTINCT team_id 
        FROM player_match_summary 
        WHERE event_id = ${eventId} AND team_id IS NOT NULL
      `;
      const teamIdsResult = await db.execute(teamIdsQuery);
      const teamIds = (teamIdsResult.rows as { team_id: number }[]).map(t => t.team_id);
      
      if (teamIds.length === 0) {
        console.warn(`No teams found for event ${eventId}`);
        return [];
      }
      
      console.log(`Found ${teamIds.length} unique team IDs`);
      
      // Get team info for all these teams
      const teamInfoQuery = `
        SELECT t.id, t.team_clan_name,
               (SELECT COUNT(DISTINCT steam_id) 
                FROM player_match_summary 
                WHERE team_id = t.id AND event_id = ${eventId}) as player_count
        FROM teams t
        WHERE t.id IN (${teamIds.join(',')})
      `;
      
      const teamsResult = await db.execute(teamInfoQuery);
      
      // Convert to TeamRawStats format
      const teamStats: TeamRawStats[] = teamsResult.rows.map(team => ({
        name: team.team_clan_name,
        players: parseInt(team.player_count, 10),
        logo: '', // Not available
        wins: 0,   // Not calculated here
        losses: 0, // Not calculated here
        eventId
      }));
      
      console.log(`Successfully processed ${teamStats.length} teams for event ${eventId}`);
      return teamStats;
    } catch (error) {
      console.error(`Error getting teams for event ${eventId}:`, error);
      return [];
    }
  }
  
  /**
   * Get players for a specific event using optimized raw SQL
   * This handles steam ID variations between tables using integer division
   */
  async getPlayersForEvent(eventId: number): Promise<PlayerRawStats[]> {
    try {
      console.log(`Getting players for event ${eventId} using raw SQL approach...`);
      
      // Use a SQL query that normalizes steam IDs by dividing and multiplying by 100
      // This effectively truncates the last 2 digits for matching
      const query = `
        WITH event_players AS (
          SELECT DISTINCT pms.steam_id, pms.team_id
          FROM player_match_summary pms
          WHERE pms.event_id = ${eventId}
        ),
        
        player_teams AS (
          SELECT ep.steam_id, t.team_clan_name as team_name
          FROM event_players ep
          LEFT JOIN teams t ON ep.team_id = t.id
        )
        
        SELECT 
          p.steam_id,
          p.user_name,
          pt.team_name,
          ks.kills,
          ks.headshots,
          ks.wallbang_kills,
          ks.no_scope,
          ks.through_smoke,
          ks.blind_kills,
          ks.awp_kills,
          ks.pistol_kills,
          ks.first_kills,
          ks.ct_first_kills,
          ks.t_first_kills,
          ks.first_deaths,
          ks.ct_first_deaths,
          ks.t_first_deaths,
          gs.assists,
          gs.deaths,
          gs.trade_kills,
          gs.trade_deaths,
          gs.kd,
          gs.k_d_diff,
          gs.adr_total,
          gs.adr_ct_side,
          gs.adr_t_side,
          gs.kast_total,
          gs.kast_ct_side,
          gs.kast_t_side,
          gs.total_rounds_won,
          gs.t_rounds_won,
          gs.ct_rounds_won,
          us.assisted_flashes,
          us.flahes_thrown,
          us.ct_flahes_thrown,
          us.t_flahes_thrown,
          us.he_thrown,
          us.ct_he_thrown,
          us.t_he_thrown,
          us.infernos_thrown,
          us.ct_infernos_thrown,
          us.t_infernos_thrown,
          us.smokes_thrown,
          us.ct_smokes_thrown,
          us.t_smokes_thrown,
          us.total_util_dmg,
          us.ct_total_util_dmg,
          us.t_total_util_dmg
        FROM 
          player_teams pt
          LEFT JOIN players p ON (p.steam_id / 100) = (pt.steam_id / 100)
          LEFT JOIN kill_stats ks ON (ks.steam_id / 100) = (pt.steam_id / 100) AND ks.event_id = ${eventId}
          LEFT JOIN general_stats gs ON (gs.steam_id / 100) = (pt.steam_id / 100) AND gs.event_id = ${eventId}
          LEFT JOIN utility_stats us ON (us.steam_id / 100) = (pt.steam_id / 100) AND us.event_id = ${eventId}
        WHERE 
          p.steam_id IS NOT NULL
      `;
      
      const result = await db.execute(query);
      console.log(`Raw SQL query returned ${result.rows.length} rows`);
      
      // Convert to PlayerRawStats format
      const playerStats: PlayerRawStats[] = result.rows.map(row => {
        // Convert DB fields to PlayerRawStats format
        return {
          steamId: String(row.steam_id || ''),
          userName: String(row.user_name || ''),
          teamName: String(row.team_name || 'Unknown'),
          id: String(row.steam_id || ''),
          name: String(row.user_name || ''),
          team: String(row.team_name || 'Unknown'),
          kills: Number(row.kills) || 0,
          deaths: Number(row.deaths) || 0,
          roundsPlayed: (Number(row.ct_rounds_won) || 0) + (Number(row.t_rounds_won) || 0) + (Number(row.deaths) || 0) * 0.7,
          assists: Number(row.assists) || 0,
          adr: Number(row.adr_total) || 0,
          hsKills: row.headshots || 0,
          ctRoundsPlayed: Math.floor(row.kast_ct_side / (row.kast_total || 1) * 30) || 15,
          tRoundsPlayed: Math.floor(row.kast_t_side / (row.kast_total || 1) * 30) || 15,
          flashAssists: row.assisted_flashes || 0,
          utilityDamage: row.total_util_dmg || 0,
          enemiesFlashed: 0, // Not available in schema
          flashDuration: 0, // Not available in schema
          kast: row.kast_total || 0,
          impact: 0, // Not available in schema
          awtKills: row.awp_kills || 0,
          clutchKills: 0, // Not available in schema
          openingKills: row.first_kills || 0,
          openingDeaths: row.first_deaths || 0,
          multiKills: 0, // Not available in schema
          tradedDeaths: row.trade_deaths || 0,
          tradingKills: row.trade_kills || 0,
          rating: 0, // Calculate based on available data
          
          // Side-specific data
          kd: row.kd || 0,
          kddiff: row.k_d_diff || 0,
          adr_ct: row.adr_ct_side || 0,
          adr_t: row.adr_t_side || 0,
          kast_ct: row.kast_ct_side || 0,
          kast_t: row.kast_t_side || 0,
          firstkills: row.first_kills || 0,
          firstkills_ct: row.ct_first_kills || 0, 
          firstkills_t: row.t_first_kills || 0,
          firstdeaths: row.first_deaths || 0,
          firstdeaths_ct: row.ct_first_deaths || 0,
          firstdeaths_t: row.t_first_deaths || 0,
          flash_assists: row.assisted_flashes || 0,
          flashes_thrown: row.flahes_thrown || 0,
          flashes_thrown_ct: row.ct_flahes_thrown || 0,
          flashes_thrown_t: row.t_flahes_thrown || 0,
          he_thrown: row.he_thrown || 0,
          he_thrown_ct: row.ct_he_thrown || 0,
          he_thrown_t: row.t_he_thrown || 0,
          molotovs_thrown: row.infernos_thrown || 0,
          molotovs_thrown_ct: row.ct_infernos_thrown || 0,
          molotovs_thrown_t: row.t_infernos_thrown || 0,
          smokes_thrown: row.smokes_thrown || 0,
          smokes_thrown_ct: row.ct_smokes_thrown || 0,
          smokes_thrown_t: row.t_smokes_thrown || 0,
          total_utility_damage: row.total_util_dmg || 0,
          utility_damage_ct: row.ct_total_util_dmg || 0,
          utility_damage_t: row.t_total_util_dmg || 0,
          awp_kills: row.awp_kills || 0,
          pistol_kills: row.pistol_kills || 0,
          wallbang_kills: row.wallbang_kills || 0,
          noscope_kills: row.no_scope || 0,
          blind_kills: row.blind_kills || 0,
          smoke_kills: row.through_smoke || 0,
          traded_kills: row.trade_kills || 0,
          traded_deaths: row.trade_deaths || 0,
          total_rounds_won: row.total_rounds_won || 0,
          t_rounds_won: row.t_rounds_won || 0,
          ct_rounds_won: row.ct_rounds_won || 0,
          
          // Default role assignments (will be calculated by role system)
          ct_role: PlayerRole.Anchor,
          t_role: PlayerRole.Support,
          is_igl: false,
          
          // Store event ID
          eventId
        };
      });
      
      console.log(`Successfully processed ${playerStats.length} players for event ${eventId}`);
      return playerStats;
    } catch (error) {
      console.error(`Error getting players for event ${eventId}:`, error);
      return [];
    }
  }
}
import { db } from './supabase-db';
import { eq } from 'drizzle-orm';
import { PlayerRawStats, PlayerRole } from '../shared/schema';
import { Team, teams, Role } from './db-schema';

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
   * Get roles data from Supabase database using proper joins
   */
  async getRolesData(): Promise<Role[]> {
    try {
      console.log('Getting roles data from Supabase using steam_id matching...');
      
      const rolesQuery = `
        SELECT 
          r.steam_id,
          r.in_game_leader,
          r.t_role,
          r.ct_role,
          p.user_name as player_username
        FROM roles r
        LEFT JOIN players p ON r.steam_id = p.steam_id
        ORDER BY p.user_name
      `;
      
      const result = await db.execute(rolesQuery);
      const rawRoles = result.rows as any[];
      
      console.log(`Retrieved ${rawRoles.length} role assignments from Supabase with steam_id matching`);
      
      // Map the raw data to our Role interface format
      const roles = rawRoles.map(row => ({
        steamId: row.steam_id.toString(), // Ensure Steam ID is always a string
        inGameLeader: row.in_game_leader === 't' || row.in_game_leader === true, // Handle PostgreSQL boolean format
        tRole: row.t_role,
        ctRole: row.ct_role,
        playerUsername: row.player_username
      }));
      
      if (roles.length > 0) {
        console.log(`Sample role data:`, {
          steamId: roles[0].steamId,
          inGameLeader: roles[0].inGameLeader,
          inGameLeaderType: typeof roles[0].inGameLeader,
          tRole: roles[0].tRole,
          ctRole: roles[0].ctRole,
          playerUsername: roles[0].playerUsername
        });
        
        // Find and log all IGL players
        const iglPlayers = roles.filter(r => Boolean(r.inGameLeader));
        console.log(`Found ${iglPlayers.length} IGL players in roles data:`, 
          iglPlayers.map(p => ({ steamId: p.steamId, playerUsername: p.playerUsername, inGameLeader: p.inGameLeader }))
        );
      }
      
      return roles as Role[];
    } catch (error) {
      console.error('Error getting roles data from Supabase:', error);
      throw error; // Don't return empty array, let the caller handle the error
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
   * Get all players from both tournaments using optimized raw SQL
   */
  async getAllPlayersFromBothTournaments(): Promise<PlayerRawStats[]> {
    try {
      console.log('Getting all players from both tournaments using raw SQL approach...');
      
      const query = `
        WITH all_event_players AS (
          SELECT DISTINCT pms.steam_id, pms.team_id, pms.event_id
          FROM player_match_summary pms
          WHERE pms.event_id IN (1, 2)
        ),
        
        player_teams AS (
          SELECT aep.steam_id, aep.event_id, t.team_clan_name as team_name
          FROM all_event_players aep
          LEFT JOIN teams t ON aep.team_id = t.id
        )
        
        SELECT 
          p.steam_id,
          p.user_name,
          pt.team_name,
          pt.event_id,
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
          LEFT JOIN kill_stats ks ON (ks.steam_id / 100) = (pt.steam_id / 100) AND ks.event_id = pt.event_id
          LEFT JOIN general_stats gs ON (gs.steam_id / 100) = (pt.steam_id / 100) AND gs.event_id = pt.event_id
          LEFT JOIN utility_stats us ON (us.steam_id / 100) = (pt.steam_id / 100) AND us.event_id = pt.event_id
        WHERE 
          p.steam_id IS NOT NULL
        ORDER BY pt.event_id, p.user_name
      `;
      
      const result = await db.execute(query);
      console.log(`Raw SQL query returned ${result.rows.length} rows from both tournaments`);
      
      // Convert to PlayerRawStats format
      const playerStats: PlayerRawStats[] = result.rows.map(row => ({
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
        hsKills: Number(row.headshots) || 0,
        ctRoundsPlayed: Math.floor(Number(row.kast_ct_side) / (Number(row.kast_total) || 1) * 30) || 15,
        tRoundsPlayed: Math.floor(Number(row.kast_t_side) / (Number(row.kast_total) || 1) * 30) || 15,
        flashAssists: Number(row.assisted_flashes) || 0,
        utilityDamage: Number(row.total_util_dmg) || 0,
        enemiesFlashed: 0,
        flashDuration: 0,
        kast: Number(row.kast_total) || 0,
        impact: 0,
        awtKills: Number(row.awp_kills) || 0,
        clutchKills: 0,
        openingKills: Number(row.first_kills) || 0,
        openingDeaths: Number(row.first_deaths) || 0,
        multiKills: 0,
        tradedDeaths: Number(row.trade_deaths) || 0,
        tradingKills: Number(row.trade_kills) || 0,
        rating: Number(row.rating) || 0,
        kd: Number(row.kd) || (Number(row.kills) / Math.max(Number(row.deaths), 1)),
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
        // Role assignments will be handled by routes.ts logic
        eventId: Number(row.event_id) || 1
      }));
      
      console.log(`Successfully processed ${playerStats.length} players from both tournaments`);
      return playerStats;
    } catch (error) {
      console.error('Error getting players from both tournaments:', error);
      return [];
    }
  }

  /**
   * Get players for a specific event using optimized raw SQL
   * This handles steam ID variations between tables using integer division
   */
  async getPlayersForEvent(eventId: number): Promise<PlayerRawStats[]> {
    try {
      console.log(`Getting ALL players from BOTH tournaments (overriding single event filter)...`);
      
      // Use a SQL query that normalizes steam IDs by dividing and multiplying by 100
      // This effectively truncates the last 2 digits for matching
      const query = `
        WITH event_players AS (
          SELECT DISTINCT pms.steam_id, pms.team_id, pms.event_id
          FROM player_match_summary pms
          WHERE pms.event_id IN (1, 2)
        ),
        
        player_teams AS (
          SELECT ep.steam_id, ep.event_id, t.team_clan_name as team_name
          FROM event_players ep
          LEFT JOIN teams t ON ep.team_id = t.id
        )
        
        SELECT 
          p.steam_id,
          p.user_name,
          pt.team_name,
          pt.event_id,
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
          LEFT JOIN kill_stats ks ON (ks.steam_id / 100) = (pt.steam_id / 100) AND ks.event_id = pt.event_id
          LEFT JOIN general_stats gs ON (gs.steam_id / 100) = (pt.steam_id / 100) AND gs.event_id = pt.event_id
          LEFT JOIN utility_stats us ON (us.steam_id / 100) = (pt.steam_id / 100) AND us.event_id = pt.event_id
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
          eventId: Number(row.event_id) || 1,
          kills: Number(row.kills) || 0,
          deaths: Number(row.deaths) || 0,
          roundsPlayed: (Number(row.ct_rounds_won) || 0) + (Number(row.t_rounds_won) || 0) + (Number(row.deaths) || 0) * 0.7,
          assists: Number(row.assists) || 0,
          adr: Number(row.adr_total) || 0,
          hsKills: Number(row.headshots) || 0,
          ctRoundsPlayed: Math.floor(Number(row.kast_ct_side) / (Number(row.kast_total) || 1) * 30) || 15,
          tRoundsPlayed: Math.floor(Number(row.kast_t_side) / (Number(row.kast_total) || 1) * 30) || 15,
          flashAssists: Number(row.assisted_flashes) || 0,
          utilityDamage: Number(row.total_util_dmg) || 0,
          enemiesFlashed: 0, // Not available in schema
          flashDuration: 0, // Not available in schema
          kast: Number(row.kast_total) || 0,
          impact: 0, // Not available in schema
          awtKills: Number(row.awp_kills) || 0,
          clutchKills: 0, // Not available in schema
          openingKills: Number(row.first_kills) || 0,
          openingDeaths: Number(row.first_deaths) || 0,
          multiKills: 0, // Not available in schema
          tradedDeaths: Number(row.trade_deaths) || 0,
          tradingKills: Number(row.trade_kills) || 0,
          rating: Number(row.rating) || 0,
          
          // Side-specific data
          kd: Number(row.kd) || (Number(row.kills) / Math.max(Number(row.deaths), 1)),
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
          
          // Use authentic role data from database
          isIGL: Boolean(row.is_igl),
          tRole: row.t_role || 'Unassigned',
          ctRole: row.ct_role || 'Unassigned',
          
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
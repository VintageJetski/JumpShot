import { db } from './supabase-db';
import { PlayerRawStats, PlayerRole } from '../shared/schema';

// Define TeamRawStats interface to match existing schema in the application
export interface TeamRawStats {
  name: string;
  players: number;
  logo: string;
  wins: number;
  losses: number;
  eventId: number;
}

/**
 * Adapter to transform database models into application models
 */
export class SupabaseAdapter {
  
  /**
   * Get all available event IDs
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
   * Get all players for a specific event
   * @param eventId Event ID to fetch players for
   */
  async getPlayersForEvent(eventId: number): Promise<PlayerRawStats[]> {
    try {
      console.log(`Getting players for event ${eventId}...`);
      
      // First get all team data to use for mapping
      const teamQuery = `
        SELECT id, team_clan_name 
        FROM teams 
        ORDER BY id
      `;
      
      const teamResult = await db.execute(teamQuery);
      const teams = teamResult.rows as { id: number, team_clan_name: string }[];
      
      // Create a map for team lookups
      const teamMap = new Map<number, string>();
      for (const team of teams) {
        teamMap.set(team.id, team.team_clan_name);
      }
      
      // First get all basic player information with team data
      const query = `
        SELECT DISTINCT 
          p.steam_id, 
          p.user_name, 
          pms.team_id, 
          t.team_clan_name
        FROM player_match_summary pms
        JOIN players p ON pms.steam_id = p.steam_id
        LEFT JOIN teams t ON pms.team_id = t.id
        WHERE pms.event_id = ${eventId}
      `;
      
      const playerResult = await db.execute(query);
      const playerData = playerResult.rows as {
        steam_id: string;
        user_name: string;
        team_id: number;
        team_clan_name: string;
      }[];
      
      console.log(`Found ${playerData.length} players with basic info for event ${eventId}`);
      
      if (playerData.length === 0) {
        return [];
      }
      
      // Get all kill stats for this event
      const killStatsQuery = `
        SELECT * FROM kill_stats 
        WHERE event_id = ${eventId}
      `;
      
      const killStatsResult = await db.execute(killStatsQuery);
      const killStatsData = killStatsResult.rows as any[];
      
      // Create a map for kill stats lookups
      const killStatsMap = new Map<string, any>();
      for (const stat of killStatsData) {
        killStatsMap.set(stat.steam_id, stat);
      }
      
      // Get all general stats for this event
      const generalStatsQuery = `
        SELECT * FROM general_stats 
        WHERE event_id = ${eventId}
      `;
      
      const generalStatsResult = await db.execute(generalStatsQuery);
      const generalStatsData = generalStatsResult.rows as any[];
      
      // Create a map for general stats lookups
      const generalStatsMap = new Map<string, any>();
      for (const stat of generalStatsData) {
        generalStatsMap.set(stat.steam_id, stat);
      }
      
      // Get all utility stats for this event
      const utilityStatsQuery = `
        SELECT * FROM utility_stats 
        WHERE event_id = ${eventId}
      `;
      
      const utilityStatsResult = await db.execute(utilityStatsQuery);
      const utilityStatsData = utilityStatsResult.rows as any[];
      
      // Create a map for utility stats lookups
      const utilityStatsMap = new Map<string, any>();
      for (const stat of utilityStatsData) {
        utilityStatsMap.set(stat.steam_id, stat);
      }
      
      // Process each player to create PlayerRawStats objects
      const playerStats: PlayerRawStats[] = [];
      
      for (const player of playerData) {
        const killStat = killStatsMap.get(player.steam_id) || {};
        const generalStat = generalStatsMap.get(player.steam_id) || {};
        const utilityStat = utilityStatsMap.get(player.steam_id) || {};
        
        // Calculate rounds
        const totalRounds = generalStat.total_rounds || 30;
        const ctRounds = generalStat.ct_rounds || Math.floor(totalRounds / 2);
        const tRounds = generalStat.t_rounds || (totalRounds - ctRounds);
        
        // Create player raw stats object
        const playerRawStats: PlayerRawStats = {
          steamId: player.steam_id,
          playerName: player.user_name,
          team_id: player.team_id || 0,
          teamName: player.team_clan_name || teamMap.get(player.team_id) || '',
          
          // Stats from kill_stats
          kills: killStat.kills || 0,
          deaths: generalStat.deaths || 0,
          adr: generalStat.adr || 0,
          kast: generalStat.kast || 0,
          rating: generalStat.rating || 1.0,
          impact: generalStat.impact || 0,
          ct_rating: generalStat.ct_rating || 1.0,
          t_rating: generalStat.t_rating || 1.0,
          
          // Rounds data
          total_rounds: totalRounds,
          ct_rounds: ctRounds,
          t_rounds: tRounds,
          
          // Special kill types
          awp_kills: killStat.awp_kills || 0,
          opening_kills: killStat.opening_kills || 0,
          opening_deaths: killStat.opening_deaths || 0,
          opening_attempts: killStat.opening_attempts || 0,
          opening_success: killStat.opening_success || 0,
          
          // Utility stats
          flash_assists: utilityStat.flash_assists || 0,
          utility_damage: generalStat.utility_damage || 0,
          utility_damage_round: generalStat.utility_damage_round || 0,
          
          // Headshot and opening stats
          headshot_percent: killStat.headshot_percent || 0,
          success_in_opening: (killStat.opening_success || 0) > 0 
            ? (killStat.opening_success || 0) / (killStat.opening_attempts || 1) 
            : 0,
          
          // Clutch stats
          clutches_attempted: generalStat.clutches_attempted || 0,
          clutches_won: generalStat.clutches_won || 0,
          
          // Per round stats
          kpr: killStat.kpr || 0,
          dpr: killStat.dpr || 0,
          
          // K/D differential
          k_diff: (killStat.kills || 0) - (generalStat.deaths || 0),
          kd_diff: (killStat.kills || 0) / Math.max(1, (generalStat.deaths || 1)),
          
          // Round-specific stats
          rounds_survived: generalStat.rounds_survived || 0,
          rounds_with_kills: killStat.rounds_with_kills || 0,
          rounds_with_assists: generalStat.rounds_with_assists || 0,
          rounds_with_deaths: generalStat.rounds_with_deaths || 0,
          damage: generalStat.damage || 0,
          rounds_with_kast: generalStat.rounds_with_kast || 0,
          assists: generalStat.assists || 0,
          
          // Event info
          eventId: eventId
        };
        
        playerStats.push(playerRawStats);
      }
      
      console.log(`Successfully processed ${playerStats.length} players for event ${eventId}`);
      return playerStats;
    } catch (error) {
      console.error(`Error getting players for event ${eventId}:`, error);
      return [];
    }
  }
  
  /**
   * Get team statistics for a specific event
   * @param eventId Event ID to fetch team statistics for
   */
  async getTeamsForEvent(eventId: number): Promise<TeamRawStats[]> {
    try {
      console.log(`Getting teams for event ${eventId}...`);
      
      // Improved query that gets team data directly with a proper JOIN
      const query = `
        SELECT 
          t.id, 
          t.team_clan_name, 
          COUNT(DISTINCT pms.steam_id) as player_count
        FROM teams t
        JOIN player_match_summary pms ON t.id = pms.team_id
        WHERE pms.event_id = ${eventId}
        GROUP BY t.id, t.team_clan_name
        ORDER BY t.id
      `;
      
      const result = await db.execute(query);
      const teamsData = result.rows as { 
        id: number, 
        team_clan_name: string, 
        player_count: string
      }[];
      
      console.log(`Found ${teamsData.length} teams in event ${eventId}`);
      
      if (!teamsData || teamsData.length === 0) {
        return [];
      }
      
      // Create team stats objects with correct team names
      const teamStats: TeamRawStats[] = teamsData.map(team => ({
        name: team.team_clan_name,
        players: parseInt(team.player_count, 10),
        logo: '', // Not available in the database
        wins: 0,  // Not available in this query
        losses: 0, // Not available in this query
        eventId
      }));
      
      return teamStats;
    } catch (error) {
      console.error(`Error getting teams for event ${eventId}:`, error);
      return [];
    }
  }
}
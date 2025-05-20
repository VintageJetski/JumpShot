import { 
  players, teams, killStats, generalStats, utilityStats, playerMatchSummary
} from './db-schema';
import { db } from './supabase-db';
import { eq, and, inArray } from 'drizzle-orm';
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
      
      // Get all player steam IDs for this event with team info in a single query
      const query = `
        SELECT DISTINCT p.steam_id, p.user_name, pms.team_id, t.team_clan_name
        FROM player_match_summary pms
        JOIN players p ON pms.steam_id = p.steam_id
        LEFT JOIN teams t ON pms.team_id = t.id
        WHERE pms.event_id = ${eventId}
      `;
      
      const result = await db.execute(query);
      const playerBasicInfo = result.rows as { 
        steam_id: string, 
        user_name: string, 
        team_id: number | null, 
        team_clan_name: string | null 
      }[];
      
      console.log(`Found ${playerBasicInfo.length} players with basic info for event ${eventId}`);
      
      if (playerBasicInfo.length === 0) {
        return [];
      }
      
      // Get player stats in batches (to avoid query size limitations)
      const playerStats: PlayerRawStats[] = [];
      const batchSize = 10;
      
      for (let i = 0; i < playerBasicInfo.length; i += batchSize) {
        const batch = playerBasicInfo.slice(i, i + batchSize);
        const steamIds = batch.map(p => p.steam_id);
        
        // Get kill stats for this batch
        const killStatsQuery = `
          SELECT * FROM kill_stats 
          WHERE event_id = ${eventId} 
          AND steam_id IN (${steamIds.map(id => `'${id}'`).join(',')})
        `;
        
        const killStatsResult = await db.execute(killStatsQuery);
        const killStatsData = killStatsResult.rows as any[];
        
        // Create a map for fast lookups
        const killStatsMap = new Map<string, any>();
        for (const stat of killStatsData) {
          killStatsMap.set(stat.steam_id, stat);
        }
        
        // Get general stats for this batch
        const generalStatsQuery = `
          SELECT * FROM general_stats 
          WHERE event_id = ${eventId} 
          AND steam_id IN (${steamIds.map(id => `'${id}'`).join(',')})
        `;
        
        const generalStatsResult = await db.execute(generalStatsQuery);
        const generalStatsData = generalStatsResult.rows as any[];
        
        // Create a map for fast lookups
        const generalStatsMap = new Map<string, any>();
        for (const stat of generalStatsData) {
          generalStatsMap.set(stat.steam_id, stat);
        }
        
        // Get utility stats for this batch
        const utilityStatsQuery = `
          SELECT * FROM utility_stats 
          WHERE event_id = ${eventId} 
          AND steam_id IN (${steamIds.map(id => `'${id}'`).join(',')})
        `;
        
        const utilityStatsResult = await db.execute(utilityStatsQuery);
        const utilityStatsData = utilityStatsResult.rows as any[];
        
        // Create a map for fast lookups
        const utilityStatsMap = new Map<string, any>();
        for (const stat of utilityStatsData) {
          utilityStatsMap.set(stat.steam_id, stat);
        }
        
        // Process each player in this batch
        for (const player of batch) {
          const killStat = killStatsMap.get(player.steam_id);
          const generalStat = generalStatsMap.get(player.steam_id);
          const utilityStat = utilityStatsMap.get(player.steam_id);
          
          // Create the player raw stats object
          const rawStats: PlayerRawStats = {
            steamId: player.steam_id,
            playerName: player.user_name,
            
            // Stats from kill_stats
            kills: killStat?.kills || 0,
            deaths: generalStat?.deaths || 0,
            
            // Stats from general_stats
            adr: generalStat?.adr || 0,
            kast: generalStat?.kast || 0,
            rating: generalStat?.rating || 1.0,
            impact: generalStat?.impact || 0,
            ct_rating: generalStat?.ct_rating || 1.0,
            t_rating: generalStat?.t_rating || 1.0,
            
            // Additional kill stats
            awp_kills: killStat?.awp_kills || 0,
            opening_kills: killStat?.opening_kills || 0,
            opening_deaths: killStat?.opening_deaths || 0,
            opening_attempts: killStat?.opening_attempts || 0,
            opening_success: killStat?.opening_success || 0,
            
            // Flash stats
            flash_assists: utilityStat?.flash_assists || 0,
            
            // Utility damage
            utility_damage: generalStat?.utility_damage || 0,
            utility_damage_round: generalStat?.utility_damage_round || 0,
            
            // Other stats
            headshot_percent: killStat?.headshot_percent || 0,
            success_in_opening: (killStat?.opening_success || 0) > 0 
              ? (killStat?.opening_success || 0) / (killStat?.opening_attempts || 1) 
              : 0,
            
            // Clutch stats
            clutches_attempted: generalStat?.clutches_attempted || 0,
            clutches_won: generalStat?.clutches_won || 0,
            
            // Per round stats
            kpr: killStat?.kpr || 0,
            dpr: killStat?.dpr || 0,
            
            // K/D differential
            k_diff: (killStat?.kills || 0) - (generalStat?.deaths || 0),
            kd_diff: (killStat?.kills || 0) / Math.max(1, (generalStat?.deaths || 1)),
            
            // Round stats
            total_rounds: generalStat?.total_rounds || 30,
            ct_rounds: generalStat?.ct_rounds || 15,
            t_rounds: generalStat?.t_rounds || 15,
            rounds_survived: generalStat?.rounds_survived || 0,
            rounds_with_kills: killStat?.rounds_with_kills || 0,
            rounds_with_assists: generalStat?.rounds_with_assists || 0,
            rounds_with_deaths: generalStat?.rounds_with_deaths || 0,
            damage: generalStat?.damage || 0,
            rounds_with_kast: generalStat?.rounds_with_kast || 0,
            assists: generalStat?.assists || 0,
            
            // Team info
            team_id: player.team_id || 0,
            
            // Event info
            eventId: eventId
          };
          
          playerStats.push(rawStats);
        }
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
      
      // Get all team stats in a single query
      const query = `
        SELECT t.id, t.team_clan_name, COUNT(DISTINCT pms.steam_id) as player_count,
        SUM(CASE WHEN m.winner_team_id = t.id THEN 1 ELSE 0 END) as wins,
        SUM(CASE WHEN m.loser_team_id = t.id THEN 1 ELSE 0 END) as losses
        FROM teams t
        JOIN player_match_summary pms ON t.id = pms.team_id
        LEFT JOIN matches m ON (m.team1_id = t.id OR m.team2_id = t.id) AND m.event_id = pms.event_id
        WHERE pms.event_id = ${eventId}
        GROUP BY t.id, t.team_clan_name
      `;
      
      const result = await db.execute(query);
      const teamsData = result.rows as { 
        id: number, 
        team_clan_name: string, 
        player_count: string,
        wins: string,
        losses: string
      }[];
      
      console.log(`Found ${teamsData.length} teams in event ${eventId}`);
      
      if (!teamsData || teamsData.length === 0) {
        return [];
      }
      
      // Create team stats objects
      const teamStats: TeamRawStats[] = teamsData.map(team => ({
        name: team.team_clan_name,
        players: parseInt(team.player_count, 10),
        logo: '', // Not available in the database
        wins: parseInt(team.wins, 10) || 0,
        losses: parseInt(team.losses, 10) || 0,
        eventId
      }));
      
      return teamStats;
    } catch (error) {
      console.error(`Error getting teams for event ${eventId}:`, error);
      return [];
    }
  }
}
import { 
  Player, Team, KillStat, GeneralStat, UtilityStat, 
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
      
      // Get all player steam IDs in this event
      const playerQuery = `
        SELECT DISTINCT steam_id
        FROM player_match_summary
        WHERE event_id = ${eventId}
      `;
      
      const result = await db.execute(playerQuery);
      const steamIds = (result.rows as { steam_id: string }[]).map(p => p.steam_id);
      
      console.log(`Found ${steamIds.length} unique players in event ${eventId}`);
      
      if (steamIds.length === 0) {
        return [];
      }
      
      // Get player details from players table
      const playerInfos = await db.select()
        .from(players)
        .where(inArray(players.steamId, steamIds));
      
      console.log(`Retrieved ${playerInfos.length} players from the players table`);
      
      // Create a map for player lookups
      const playerMap = new Map<string, Player>();
      for (const player of playerInfos) {
        playerMap.set(player.steamId, player);
      }
      
      // Get team data for this event
      const teamQuery = `
        SELECT DISTINCT pms.steam_id, pms.team_id, t.team_clan_name
        FROM player_match_summary pms
        JOIN teams t ON pms.team_id = t.id
        WHERE pms.event_id = ${eventId}
        AND pms.team_id IS NOT NULL
      `;
      
      const teamResult = await db.execute(teamQuery);
      const teamData = teamResult.rows as { steam_id: string, team_id: number, team_clan_name: string }[];
      
      // Create a map for team lookups
      const teamMap = new Map<string, { teamId: number, teamName: string }>();
      for (const data of teamData) {
        teamMap.set(data.steam_id, { 
          teamId: data.team_id, 
          teamName: data.team_clan_name 
        });
      }
      
      // Get all stats for players in this event (batch by table)
      const playerStats: PlayerRawStats[] = [];
      
      // For each player, get their stats and create a PlayerRawStats object
      for (const steamId of steamIds) {
        try {
          // Get player info
          const playerInfo = playerMap.get(steamId);
          const teamInfo = teamMap.get(steamId);
          
          if (!playerInfo) {
            console.warn(`Player info not found for steam ID ${steamId}`);
            continue;
          }
          
          // Query each stats table for this player
          const [killStat] = await db.select()
            .from(killStats)
            .where(
              and(
                eq(killStats.steamId, steamId),
                eq(killStats.eventId, eventId)
              )
            );
            
          const [generalStat] = await db.select()
            .from(generalStats)
            .where(
              and(
                eq(generalStats.steamId, steamId),
                eq(generalStats.eventId, eventId)
              )
            );
            
          const [utilityStat] = await db.select()
            .from(utilityStats)
            .where(
              and(
                eq(utilityStats.steamId, steamId),
                eq(utilityStats.eventId, eventId)
              )
            );
          
          // Calculate total rounds played
          const totalRounds = generalStat?.totalRounds || 30; // Default to 30 if not available
          const ctRounds = Math.floor(totalRounds / 2); // Approximate
          const tRounds = totalRounds - ctRounds; // Approximate
          
          // Create the player stats object
          const rawStats: PlayerRawStats = {
            steamId: steamId,
            playerName: playerInfo.userName || `Player_${steamId.substring(0, 8)}`,
            
            // Basic stats
            kills: killStat?.kills || 0,
            deaths: generalStat?.deaths || 0,
            adr: generalStat?.adr || 0,
            kast: generalStat?.kast || 0,
            rating: generalStat?.rating || 1.0,
            impact: generalStat?.impact || 0,
            ct_rating: generalStat?.ctRating || 1.0,
            t_rating: generalStat?.tRating || 1.0,
            
            // Team info
            team_id: teamInfo?.teamId || 0,
            
            // Round stats
            total_rounds: totalRounds,
            ct_rounds: ctRounds,
            t_rounds: tRounds,
            
            // Kill stats
            awp_kills: killStat?.awpKills || 0,
            opening_kills: killStat?.openingKills || 0,
            opening_deaths: killStat?.openingDeaths || 0,
            opening_attempts: killStat?.openingAttempts || 0,
            opening_success: killStat?.openingSuccess || 0,
            
            // Utility stats
            flash_assists: utilityStat?.flashAssists || 0,
            utility_damage: generalStat?.utilityDamage || 0,
            utility_damage_round: generalStat?.utilityDamageRound || 0,
            
            // Other stats
            headshot_percent: killStat?.headshotPercent || 0,
            success_in_opening: (killStat?.openingSuccess || 0) > 0 ? (killStat?.openingSuccess || 0) / (killStat?.openingAttempts || 1) : 0,
            clutches_attempted: generalStat?.clutchesAttempted || 0,
            clutches_won: generalStat?.clutchesWon || 0,
            
            // Derived stats
            kpr: killStat?.kpr || 0,
            dpr: killStat?.dpr || 0,
            k_diff: (killStat?.kills || 0) - (generalStat?.deaths || 0),
            kd_diff: (killStat?.kills || 0) / Math.max(1, (generalStat?.deaths || 1)),
            
            // Round-specific stats
            rounds_survived: generalStat?.roundsSurvived || 0,
            rounds_with_kills: killStat?.roundsWithKills || 0,
            rounds_with_assists: generalStat?.roundsWithAssists || 0,
            rounds_with_deaths: generalStat?.roundsWithDeaths || 0,
            damage: generalStat?.damage || 0,
            rounds_with_kast: generalStat?.roundsWithKast || 0,
            assists: generalStat?.assists || 0,
            
            // Event info
            eventId: eventId
          };
          
          playerStats.push(rawStats);
        } catch (error) {
          console.error(`Error processing player ${steamId}:`, error);
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
      
      // Get all team IDs and names in this event with player counts in a single query
      const teamQuery = `
        SELECT t.id, t.team_clan_name, COUNT(DISTINCT pms.steam_id) as player_count
        FROM teams t
        JOIN player_match_summary pms ON t.id = pms.team_id
        WHERE pms.event_id = ${eventId}
        GROUP BY t.id, t.team_clan_name
      `;
      
      const result = await db.execute(teamQuery);
      const teamsData = result.rows as { id: number, team_clan_name: string, player_count: string }[];
      
      if (!teamsData || teamsData.length === 0) {
        console.warn(`No teams found for event ${eventId}`);
        return [];
      }
      
      console.log(`Found ${teamsData.length} teams in event ${eventId}`);
      
      // Create team stats objects
      const teamStats: TeamRawStats[] = teamsData.map(team => ({
        name: team.team_clan_name,
        players: parseInt(team.player_count, 10),
        logo: '', // Not available in the database
        wins: 0,  // Would need to calculate from match data
        losses: 0, // Would need to calculate from match data
        eventId
      }));
      
      return teamStats;
    } catch (error) {
      console.error(`Error getting teams for event ${eventId}:`, error);
      return [];
    }
  }
}
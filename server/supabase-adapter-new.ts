import { 
  Player, Team, KillStat, GeneralStat, UtilityStat, 
  players, teams, killStats, generalStats, utilityStats, playerMatchSummary
} from './db-schema';
import { db } from './supabase-db';
import { eq, and, inArray } from 'drizzle-orm';
import { PlayerRawStats, PlayerRole } from '../shared/schema';

/**
 * Normalizes steam IDs to handle format differences between tables
 * This trims the last 1-2 digits that might vary across tables
 */
function normalizeSteamId(steamId: string | number): string {
  // Convert to string if it's a number
  const idString = String(steamId);
  
  // Trim the last 1-2 digits for fuzzy matching
  // Most Steam IDs are 17 digits, so we'll keep the first 15
  return idString.substring(0, 15);
}

/**
 * Checks if two steam IDs match after normalization
 */
function steamIdMatches(id1: string | number, id2: string | number): boolean {
  // Try exact match first
  if (String(id1) === String(id2)) {
    return true;
  }
  
  // Fall back to normalized comparison
  return normalizeSteamId(id1) === normalizeSteamId(id2);
}

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
      const events = await db.select().from(players);
      if (!events || events.length === 0) {
        throw new Error('No events found in database');
      }
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
   * Get all players for a specific event using batch processing
   * @param eventId Event ID to fetch players for
   */
  async getPlayersForEvent(eventId: number): Promise<PlayerRawStats[]> {
    try {
      console.log(`Getting players for event ${eventId} with batch processing...`);
      
      // Get all player IDs in this event from player_match_summary
      const playerSummaries = await db.select()
        .from(playerMatchSummary)
        .where(eq(playerMatchSummary.eventId, eventId));
      
      if (!playerSummaries || playerSummaries.length === 0) {
        console.warn(`No players found for event ${eventId}`);
        return [];
      }

      // Get unique Steam IDs for all players in this event
      const steamIds = Array.from(new Set(playerSummaries.map(p => p.steamId)));
      console.log(`Found ${steamIds.length} unique players in event ${eventId}`);
      
      // Get all player info in a single query
      const playerInfos = await db.select()
        .from(players)
        .where(inArray(players.steamId, steamIds));
      
      console.log(`Found ${playerInfos.length} players with basic info out of ${steamIds.length} players in event`);
      
      // Create a map of normalized steam ID to player info for quick lookups
      const playerInfoMap = new Map<string, Player>();
      for (const player of playerInfos) {
        // Store with both exact ID and normalized ID for reliable lookup
        playerInfoMap.set(String(player.steamId), player);
        playerInfoMap.set(normalizeSteamId(player.steamId), player);
      }
      
      // Get all kill stats for this event (without steam ID filtering to avoid type issues)
      const playerKillStatsArray = await db.select()
        .from(killStats)
        .where(eq(killStats.eventId, eventId));
      
      // Create a map of normalized steam ID to kill stats
      const killStatsMap = new Map<string, KillStat>();
      for (const stats of playerKillStatsArray) {
        // Store with both exact ID and normalized ID for reliable lookup
        killStatsMap.set(String(stats.steamId), stats);
        killStatsMap.set(normalizeSteamId(stats.steamId), stats);
      }
      
      // Get all general stats for this event
      const playerGeneralStatsArray = await db.select()
        .from(generalStats)
        .where(eq(generalStats.eventId, eventId));
      
      // Create a map of normalized steam ID to general stats
      const generalStatsMap = new Map<string, GeneralStat>();
      for (const stats of playerGeneralStatsArray) {
        // Store with both exact ID and normalized ID for reliable lookup
        generalStatsMap.set(String(stats.steamId), stats);
        generalStatsMap.set(normalizeSteamId(stats.steamId), stats);
      }
      
      // Get all utility stats for this event
      const playerUtilityStatsArray = await db.select()
        .from(utilityStats)
        .where(eq(utilityStats.eventId, eventId));
      
      // Create a map of normalized steam ID to utility stats
      const utilityStatsMap = new Map<string, UtilityStat>();
      for (const stats of playerUtilityStatsArray) {
        // Store with both exact ID and normalized ID for reliable lookup
        utilityStatsMap.set(String(stats.steamId), stats);
        utilityStatsMap.set(normalizeSteamId(stats.steamId), stats);
      }
      
      // Get all team IDs for each player
      // We need to associate each player with their most frequent team
      const teamMap = new Map<number, Map<number, number>>(); // steamId -> (teamId -> count)
      
      for (const summary of playerSummaries) {
        if (!summary.teamId) continue;
        
        if (!teamMap.has(summary.steamId)) {
          teamMap.set(summary.steamId, new Map<number, number>());
        }
        
        const countMap = teamMap.get(summary.steamId)!;
        countMap.set(summary.teamId, (countMap.get(summary.teamId) || 0) + 1);
      }
      
      // Get all unique team IDs used in this event
      const allTeamIds = new Set<number>();
      for (const countMap of teamMap.values()) {
        for (const teamId of countMap.keys()) {
          allTeamIds.add(teamId);
        }
      }
      
      // Get all team info in a single query
      const teamInfoArray = await db.select()
        .from(teams)
        .where(inArray(teams.id, Array.from(allTeamIds)));
      
      // Create a map of team ID to team info
      const teamInfoMap = new Map<number, Team>();
      for (const team of teamInfoArray) {
        teamInfoMap.set(team.id, team);
      }
      
      // Find most frequent team for each player
      const playerTeamMap = new Map<number, Team>();
      
      for (const [steamId, countMap] of teamMap.entries()) {
        let mostFrequentTeamId = 0;
        let maxCount = 0;
        
        for (const [teamId, count] of countMap.entries()) {
          if (count > maxCount) {
            maxCount = count;
            mostFrequentTeamId = teamId;
          }
        }
        
        if (mostFrequentTeamId && teamInfoMap.has(mostFrequentTeamId)) {
          playerTeamMap.set(steamId, teamInfoMap.get(mostFrequentTeamId)!);
        }
      }
      
      // Now construct player stats for each valid player
      const playerStats: PlayerRawStats[] = [];
      
      // Process players with valid information
      for (const steamId of steamIds) {
        try {
          // Try lookup with exact match, then with normalized ID
          let playerInfo = playerInfoMap.get(steamId);
          if (!playerInfo) {
            // Try with normalized ID
            const normalizedId = normalizeSteamId(steamId);
            playerInfo = playerInfoMap.get(normalizedId);
            
            if (playerInfo) {
              console.log(`Found player using normalized ID for ${steamId} (normalized to ${normalizedId})`);
            }
          }
          
          if (!playerInfo) {
            console.log(`Skipping player with steam ID ${steamId} - no basic info found after normalization`);
            continue;
          }
          
          // Try lookup for stats in the same way - exact then normalized
          const normalizedId = normalizeSteamId(steamId);
          
          // Get kill stats
          let playerKillStats = killStatsMap.get(steamId);
          if (!playerKillStats) {
            playerKillStats = killStatsMap.get(normalizedId);
          }
          
          // Get general stats
          let playerGeneralStats = generalStatsMap.get(steamId);
          if (!playerGeneralStats) {
            playerGeneralStats = generalStatsMap.get(normalizedId);
          }
          
          // Get utility stats
          let playerUtilityStats = utilityStatsMap.get(steamId);
          if (!playerUtilityStats) {
            playerUtilityStats = utilityStatsMap.get(normalizedId);
          }
          
          // Team info will use numeric ID match since team IDs are consistent
          const numericSteamId = parseInt(steamId, 10);
          const teamInfo = playerTeamMap.get(numericSteamId);
          
          // Create player stats object with all available data
          const rawStats: PlayerRawStats = {
            name: playerInfo.userName,
            team: teamInfo?.teamClanName || 'Unknown',
            
            // Kill stats
            kills: playerKillStats?.kills || 0,
            deaths: playerGeneralStats?.deaths || 0,
            assists: playerGeneralStats?.assists || 0,
            
            kd: playerGeneralStats?.kd || 0,
            kddiff: playerGeneralStats?.kDDiff || 0,
            
            adr: playerGeneralStats?.adrTotal || 0,
            adr_ct: playerGeneralStats?.adrCtSide || 0,
            adr_t: playerGeneralStats?.adrTSide || 0,
            
            kast: playerGeneralStats?.kastTotal || 0,
            kast_ct: playerGeneralStats?.kastCtSide || 0,
            kast_t: playerGeneralStats?.kastTSide || 0,
            
            hs: playerKillStats?.headshots || 0,
            
            // First kill/death stats
            firstkills: playerKillStats?.firstKills || 0,
            firstkills_ct: playerKillStats?.ctFirstKills || 0,
            firstkills_t: playerKillStats?.tFirstKills || 0,
            
            firstdeaths: playerKillStats?.firstDeaths || 0,
            firstdeaths_ct: playerKillStats?.ctFirstDeaths || 0,
            firstdeaths_t: playerKillStats?.tFirstDeaths || 0,
            
            // Utility stats
            flash_assists: playerUtilityStats?.assistedFlashes || 0,
            flashes_thrown: playerUtilityStats?.flahesThrown || 0,
            flashes_thrown_ct: playerUtilityStats?.ctFlahesThrown || 0,
            flashes_thrown_t: playerUtilityStats?.tFlahesThrown || 0,
            
            he_thrown: playerUtilityStats?.heThrown || 0,
            he_thrown_ct: playerUtilityStats?.ctHeThrown || 0,
            he_thrown_t: playerUtilityStats?.tHeThrown || 0,
            
            molotovs_thrown: playerUtilityStats?.infernosThrown || 0,
            molotovs_thrown_ct: playerUtilityStats?.ctInfernosThrown || 0,
            molotovs_thrown_t: playerUtilityStats?.tInfernosThrown || 0,
            
            smokes_thrown: playerUtilityStats?.smokesThrown || 0,
            smokes_thrown_ct: playerUtilityStats?.ctSmokesThrown || 0,
            smokes_thrown_t: playerUtilityStats?.tSmokesThrown || 0,
            
            total_utility_damage: playerUtilityStats?.totalUtilDmg || 0,
            utility_damage_ct: playerUtilityStats?.ctTotalUtilDmg || 0,
            utility_damage_t: playerUtilityStats?.tTotalUtilDmg || 0,
            
            // Special kill types
            awp_kills: playerKillStats?.awpKills || 0,
            pistol_kills: playerKillStats?.pistolKills || 0,
            wallbang_kills: playerKillStats?.wallbangKills || 0,
            noscope_kills: playerKillStats?.noScope || 0,
            blind_kills: playerKillStats?.blindKills || 0,
            smoke_kills: playerKillStats?.throughSmoke || 0,
            
            // Trading stats
            traded_kills: playerGeneralStats?.tradeKills || 0,
            traded_deaths: playerGeneralStats?.tradeDeaths || 0,
            
            // Round wins
            total_rounds_won: playerGeneralStats?.totalRoundsWon || 0,
            t_rounds_won: playerGeneralStats?.tRoundsWon || 0,
            ct_rounds_won: playerGeneralStats?.ctRoundsWon || 0,
            
            // Inferred metrics based on existing data
            ctSideRoundsPlayed: this.calculateCtRoundsPlayed(playerGeneralStats),
            tSideRoundsPlayed: this.calculateTRoundsPlayed(playerGeneralStats),
            
            // Will be assigned later by the role processing system
            ct_role: PlayerRole.Anchor,  // Default, will be assigned by role system
            t_role: PlayerRole.Support,  // Default, will be assigned by role system
            is_igl: false,  // Default, will be assigned by role system
            
            // Store event ID for multi-event handling
            eventId
          };
          
          playerStats.push(rawStats);
        } catch (error) {
          console.error(`Error processing player ${steamId}:`, error);
        }
      }
      
      console.log(`Successfully processed ${playerStats.length} out of ${steamIds.length} players for event ${eventId}`);
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
      
      // Get all teams in this event directly from the database with a simple query
      // This avoids parameter binding issues with prepared statements
      const query = `SELECT DISTINCT team_id FROM player_match_summary WHERE event_id = ${eventId} AND team_id IS NOT NULL`;
      const result = await db.execute(query);
      
      const teamIds = (result.rows as { team_id: number }[]).map(t => t.team_id);
      
      if (!teamIds || teamIds.length === 0) {
        console.warn(`No teams found for event ${eventId}`);
        return [];
      }
      
      console.log(`Found ${teamIds.length} unique teams for event ${eventId}`);
      
      // Get team details for all teams at once
      const teamInfoArray = await db.select()
        .from(teams)
        .where(inArray(teams.id, teamIds));
      
      console.log(`Retrieved ${teamInfoArray.length} teams from the teams table`);
      
      const teamStats: TeamRawStats[] = [];
      
      // For each team, count players and create TeamRawStats object
      for (const team of teamInfoArray) {
        try {
          // Count players in this team for this event directly with a simple query
          // This avoids parameter binding issues with prepared statements
          const countQuery = `SELECT COUNT(DISTINCT steam_id) as player_count FROM player_match_summary WHERE team_id = ${team.id} AND event_id = ${eventId}`;
          const playerCount = await db.execute(countQuery);
          
          const count = parseInt(playerCount.rows[0]?.player_count || '0', 10);
          
          // Create team stats object
          const rawTeamStats: TeamRawStats = {
            name: team.teamClanName,
            players: count,
            logo: '', // Not available in the database
            wins: 0,  // Will be calculated from match data if needed
            losses: 0, // Will be calculated from match data if needed
            eventId
          };
          
          teamStats.push(rawTeamStats);
          console.log(`Processed team: ${team.teamClanName} with ${count} players`);
        } catch (error) {
          console.error(`Error processing team ${team.id}:`, error);
        }
      }
      
      console.log(`Successfully processed ${teamStats.length} teams for event ${eventId}`);
      return teamStats;
    } catch (error) {
      console.error(`Error getting teams for event ${eventId}:`, error);
      return [];
    }
  }
  
  /**
   * Helper method to estimate CT side rounds played
   */
  private calculateCtRoundsPlayed(generalStats?: GeneralStat): number {
    if (!generalStats) return 0;
    
    // If KAST values are available, use them to estimate rounds played
    if (generalStats.kastCtSide && generalStats.kastTotal) {
      return Math.floor((generalStats.kastCtSide / generalStats.kastTotal) * 30);
    }
    
    // If ADR values are available, use them as backup
    if (generalStats.adrCtSide && generalStats.adrTotal) {
      return Math.floor((generalStats.adrCtSide / generalStats.adrTotal) * 30);
    }
    
    // Fallback to 15 rounds (half of standard match)
    return 15;
  }
  
  /**
   * Helper method to estimate T side rounds played
   */
  private calculateTRoundsPlayed(generalStats?: GeneralStat): number {
    if (!generalStats) return 0;
    
    // If KAST values are available, use them to estimate rounds played
    if (generalStats.kastTSide && generalStats.kastTotal) {
      return Math.floor((generalStats.kastTSide / generalStats.kastTotal) * 30);
    }
    
    // If ADR values are available, use them as backup
    if (generalStats.adrTSide && generalStats.adrTotal) {
      return Math.floor((generalStats.adrTSide / generalStats.adrTotal) * 30);
    }
    
    // Fallback to 15 rounds (half of standard match)
    return 15;
  }
}
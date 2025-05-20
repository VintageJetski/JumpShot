import { 
  Player, Team, KillStat, GeneralStat, UtilityStat, 
  players, teams, killStats, generalStats, utilityStats, playerMatchSummary
} from './db-schema';
import { db } from './supabase-db';
import { eq, and } from 'drizzle-orm';
import { PlayerRawStats, PlayerRole, TeamRawStats } from '../shared/schema';

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
   * Get all players for a specific event
   * @param eventId Event ID to fetch players for
   */
  async getPlayersForEvent(eventId: number): Promise<PlayerRawStats[]> {
    try {
      // Get all player IDs in this event from player_match_summary
      const playerSummaries = await db.select()
        .from(playerMatchSummary)
        .where(eq(playerMatchSummary.eventId, eventId));
      
      if (!playerSummaries || playerSummaries.length === 0) {
        console.warn(`No players found for event ${eventId}`);
        return [];
      }

      const steamIds = [...new Set(playerSummaries.map(p => p.steamId))];
      
      // For each player, get their details and stats
      const playerStats: PlayerRawStats[] = [];
      
      for (const steamId of steamIds) {
        try {
          // Get basic player info
          const [playerInfo] = await db.select()
            .from(players)
            .where(eq(players.steamId, steamId));
          
          if (!playerInfo) {
            console.warn(`Player with steam ID ${steamId} not found`);
            continue;
          }
          
          // Get kill stats
          const [playerKillStats] = await db.select()
            .from(killStats)
            .where(and(
              eq(killStats.steamId, steamId),
              eq(killStats.eventId, eventId)
            ));
          
          // Get general stats
          const [playerGeneralStats] = await db.select()
            .from(generalStats)
            .where(and(
              eq(generalStats.steamId, steamId),
              eq(generalStats.eventId, eventId)
            ));
          
          // Get utility stats
          const [playerUtilityStats] = await db.select()
            .from(utilityStats)
            .where(and(
              eq(utilityStats.steamId, steamId),
              eq(utilityStats.eventId, eventId)
            ));
          
          // Get team info
          const teamMatches = await db.select()
            .from(playerMatchSummary)
            .where(and(
              eq(playerMatchSummary.steamId, steamId),
              eq(playerMatchSummary.eventId, eventId)
            ));
          
          // Get the most frequent team ID for this player
          const teamCounts = new Map<number, number>();
          for (const match of teamMatches) {
            if (match.teamId) {
              teamCounts.set(match.teamId, (teamCounts.get(match.teamId) || 0) + 1);
            }
          }
          
          let mostFrequentTeamId = 0;
          let maxCount = 0;
          
          for (const [teamId, count] of teamCounts.entries()) {
            if (count > maxCount) {
              maxCount = count;
              mostFrequentTeamId = teamId;
            }
          }
          
          let teamInfo: Team | undefined;
          
          if (mostFrequentTeamId) {
            const [team] = await db.select()
              .from(teams)
              .where(eq(teams.id, mostFrequentTeamId));
            
            teamInfo = team;
          }
          
          // Transform to PlayerRawStats
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
      // Get all teams in this event from player_match_summary
      const result = await db.execute(
        'SELECT DISTINCT team_id FROM player_match_summary WHERE event_id = $1',
        [eventId]
      );
      
      const teamIds = (result.rows as { team_id: number }[]).map(t => t.team_id);
      
      if (!teamIds || teamIds.length === 0) {
        console.warn(`No teams found for event ${eventId}`);
        return [];
      }
      
      const teamStats: TeamRawStats[] = [];
      
      for (const teamId of teamIds) {
        try {
          // Get team info
          const [teamInfo] = await db.select()
            .from(teams)
            .where(eq(teams.id, teamId));
          
          if (!teamInfo) {
            console.warn(`Team with ID ${teamId} not found`);
            continue;
          }
          
          // Get players in this team for this event
          const playerSummaries = await db.select()
            .from(playerMatchSummary)
            .where(and(
              eq(playerMatchSummary.teamId, teamId),
              eq(playerMatchSummary.eventId, eventId)
            ));
          
          const playerSteamIds = [...new Set(playerSummaries.map(p => p.steamId))];
          
          // Create team stats object
          const rawTeamStats: TeamRawStats = {
            name: teamInfo.teamClanName,
            players: playerSteamIds.length,
            logo: '', // Not available in the database
            wins: 0,  // Will be calculated from match data if needed
            losses: 0, // Will be calculated from match data if needed
            eventId
          };
          
          teamStats.push(rawTeamStats);
        } catch (error) {
          console.error(`Error processing team ${teamId}:`, error);
        }
      }
      
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
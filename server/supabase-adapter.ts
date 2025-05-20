import {
  PlayerRawStats,
  PlayerRole,
  PlayerWithPIV,
  SupaGeneralStats,
  SupaKillStats,
  SupaPlayer,
  SupaPlayerData,
  SupaTeam,
  SupaUtilityStats,
  TeamWithTIR,
  // Import schema tables directly
  supaPlayers,
  supaPlayerMatchSummary,
  supaKillStats,
  supaGeneralStats,
  supaUtilityStats,
  supaTeams
} from '@shared/schema';
import { supaDb } from './supabase-db';
import { and, eq } from 'drizzle-orm';

/**
 * Adapter for transforming Supabase data to application models
 */
export class SupabaseAdapter {
  
  /**
   * Transform Supabase player data into the application's PlayerRawStats format
   */
  static mapToPlayerRawStats(playerData: SupaPlayerData): PlayerRawStats {
    const { player, killStats, generalStats, utilityStats, teamInfo } = playerData;
    
    // Default values for optional fields
    const defaultKillStats: Partial<SupaKillStats> = {
      kills: 0,
      headshots: 0,
      wallbangKills: 0,
      noScope: 0,
      throughSmoke: 0,
      blindKills: 0,
      victimBlindKills: 0,
      firstKills: 0,
      ctFirstKills: 0,
      tFirstKills: 0,
      firstDeaths: 0,
      ctFirstDeaths: 0,
      tFirstDeaths: 0,
    };
    
    const defaultGeneralStats: Partial<SupaGeneralStats> = {
      assists: 0,
      deaths: 0,
      kd: 0,
      totalRoundsWon: 0,
      tRoundsWon: 0,
      ctRoundsWon: 0,
    };
    
    const defaultUtilityStats: Partial<SupaUtilityStats> = {
      assistedFlashes: 0,
      flahesThrown: 0,
      ctFlahesThrown: 0,
      tFlahesThrown: 0,
      flahesTownInPistolRound: 0,
      heThrown: 0,
      ctHeThrown: 0,
      tHeThrown: 0,
      heThrownInPistolRound: 0,
      infernosThrown: 0,
      ctInfernosThrown: 0,
      tInfernosThrown: 0,
      infernosThrownInPistolRound: 0,
      smokesThrown: 0,
      ctSmokesThrown: 0,
      tSmokesThrown: 0,
      smokesThrownInPistolRound: 0,
      totalUtilThrown: 0,
    };
    
    // Combine data with defaults
    const ks = { ...defaultKillStats, ...killStats };
    const gs = { ...defaultGeneralStats, ...generalStats };
    const us = { ...defaultUtilityStats, ...utilityStats };
    
    return {
      steamId: player.steamId.toString(),
      userName: player.userName || "Unknown Player",
      teamName: teamInfo?.teamClanName || "Unknown Team",
      
      // Kill stats
      kills: ks.kills || 0,
      headshots: ks.headshots || 0,
      wallbangKills: ks.wallbangKills || 0,
      noScope: ks.noScope || 0,
      throughSmoke: ks.throughSmoke || 0,
      blindKills: ks.blindKills || 0,
      victimBlindKills: ks.victimBlindKills || 0,
      firstKills: ks.firstKills || 0,
      ctFirstKills: ks.ctFirstKills || 0,
      tFirstKills: ks.tFirstKills || 0,
      firstDeaths: ks.firstDeaths || 0,
      ctFirstDeaths: ks.ctFirstDeaths || 0,
      tFirstDeaths: ks.tFirstDeaths || 0,
      
      // General stats
      assists: gs.assists || 0,
      deaths: gs.deaths || 0,
      kd: gs.kd || 0,
      totalRoundsWon: gs.totalRoundsWon || 0,
      tRoundsWon: gs.tRoundsWon || 0,
      ctRoundsWon: gs.ctRoundsWon || 0,
      
      // Utility stats
      assistedFlashes: us.assistedFlashes || 0,
      flashesThrown: us.flahesThrown || 0, // Note: fixing typo from DB schema
      ctFlashesThrown: us.ctFlahesThrown || 0,
      tFlashesThrown: us.tFlahesThrown || 0,
      flashesThrownInPistolRound: us.flahesTownInPistolRound || 0,
      heThrown: us.heThrown || 0,
      ctHeThrown: us.ctHeThrown || 0,
      tHeThrown: us.tHeThrown || 0,
      heThrownInPistolRound: us.heThrownInPistolRound || 0,
      infernosThrown: us.infernosThrown || 0,
      ctInfernosThrown: us.ctInfernosThrown || 0,
      tInfernosThrown: us.tInfernosThrown || 0,
      infernosThrownInPistolRound: us.infernosThrownInPistolRound || 0,
      smokesThrown: us.smokesThrown || 0,
      ctSmokesThrown: us.ctSmokesThrown || 0,
      tSmokesThrown: us.tSmokesThrown || 0,
      smokesThrownInPistolRound: us.smokesThrownInPistolRound || 0,
      totalUtilityThrown: us.totalUtilThrown || 0,
    };
  }
  
  /**
   * Fetch player data from Supabase based on steam ID
   */
  static async fetchPlayerData(steamId: string | number): Promise<SupaPlayerData | null> {
    // Ensure steam ID is a number
    const steamIdNum = typeof steamId === 'string' ? parseInt(steamId, 10) : steamId;
    
    try {
      // Fetch player record
      const players = await supaDb.select().from(supaPlayers).where(eq(supaPlayers.steamId, steamIdNum));
      const player = players.length > 0 ? players[0] : null;
      
      if (!player) {
        console.error(`Player with steam ID ${steamIdNum} not found`);
        return null;
      }
      
      // Fetch most recent event ID for this player
      const playerMatchSummaries = await supaDb.select()
        .from(supaPlayerMatchSummary)
        .where(eq(supaPlayerMatchSummary.steamId, steamIdNum))
        .orderBy(supaPlayerMatchSummary.eventId);
      
      const playerMatchSummary = playerMatchSummaries.length > 0 ? playerMatchSummaries[0] : null;
      
      if (!playerMatchSummary) {
        console.error(`No match summary found for player ${steamIdNum}`);
        return { player };
      }
      
      // Now fetch stats using the event ID
      const [killStats] = await supaDb.select()
        .from(supaKillStats)
        .where(and(
          eq(supaKillStats.steamId, steamIdNum),
          eq(supaKillStats.eventId, playerMatchSummary.eventId)
        ));
      
      const [generalStats] = await supaDb.select()
        .from(supaGeneralStats)
        .where(and(
          eq(supaGeneralStats.steamId, steamIdNum),
          eq(supaGeneralStats.eventId, playerMatchSummary.eventId)
        ));
      
      const [utilityStats] = await supaDb.select()
        .from(supaUtilityStats)
        .where(and(
          eq(supaUtilityStats.steamId, steamIdNum),
          eq(supaUtilityStats.eventId, playerMatchSummary.eventId)
        ));
      
      // Fetch team info if team ID is available
      let teamInfo = undefined;
      if (playerMatchSummary.teamId) {
        const teams = await supaDb.select()
          .from(supaTeams)
          .where(eq(supaTeams.id, playerMatchSummary.teamId));
        
        teamInfo = teams.length > 0 ? teams[0] : undefined;
      }
      
      return {
        player,
        killStats: killStats || undefined,
        generalStats: generalStats || undefined,
        utilityStats: utilityStats || undefined,
        teamInfo: teamInfo || undefined
      };
    } catch (error) {
      console.error(`Error fetching player data for ${steamIdNum}:`, error);
      return null;
    }
  }
  
  /**
   * Fetch all players with their associated stats
   */
  static async fetchAllPlayersData(): Promise<SupaPlayerData[]> {
    try {
      // Get all players
      const players = await supaDb.select().from(supaPlayers);
      
      // Fetch detailed data for each player
      const playerDataPromises = players.map(player => 
        this.fetchPlayerData(player.steamId)
      );
      
      const results = await Promise.all(playerDataPromises);
      return results.filter(Boolean) as SupaPlayerData[];
    } catch (error) {
      console.error('Error fetching all players data:', error);
      return [];
    }
  }
  
  /**
   * Fetch all teams with their info
   */
  static async fetchAllTeams(): Promise<SupaTeam[]> {
    try {
      return await supaDb.select().from(supaTeams);
    } catch (error) {
      console.error('Error fetching teams:', error);
      return [];
    }
  }
}
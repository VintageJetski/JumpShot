import { supabase, fetchWithCache, refreshCache, clearCache } from './supabase';
import { Player, Team, Match, Round, PlayerStats } from '../shared/database.types';
import { PlayerRawStats, PlayerRoleInfo } from './types';
import { PlayerRole } from '../shared/schema';
import { validatePlayerStats, validateTeam, logDataIntegrityIssue } from './data-validator';

/**
 * Data service for retrieving data from Supabase
 */
export class SupabaseDataService {
  /**
   * Fetch all players with caching
   */
  async getAllPlayers(forceRefresh = false): Promise<Player[]> {
    const cacheKey = 'all_players';
    const fetchFn = async () => {
      const { data, error } = await supabase
        .from('players')
        .select('*');
      
      if (error) {
        console.error('Error fetching players:', error);
        throw new Error(`Failed to fetch players: ${error.message}`);
      }
      
      return data || [];
    };
    
    return fetchWithCache(cacheKey, fetchFn, forceRefresh);
  }
  
  /**
   * Fetch all teams with caching
   */
  async getAllTeams(forceRefresh = false): Promise<Team[]> {
    const cacheKey = 'all_teams';
    const fetchFn = async () => {
      const { data, error } = await supabase
        .from('teams')
        .select('*');
      
      if (error) {
        console.error('Error fetching teams:', error);
        throw new Error(`Failed to fetch teams: ${error.message}`);
      }
      
      return data || [];
    };
    
    return fetchWithCache(cacheKey, fetchFn, forceRefresh);
  }
  
  /**
   * Fetch all matches with caching
   */
  async getAllMatches(forceRefresh = false): Promise<Match[]> {
    const cacheKey = 'all_matches';
    const fetchFn = async () => {
      const { data, error } = await supabase
        .from('matches')
        .select('*');
      
      if (error) {
        console.error('Error fetching matches:', error);
        throw new Error(`Failed to fetch matches: ${error.message}`);
      }
      
      return data || [];
    };
    
    return fetchWithCache(cacheKey, fetchFn, forceRefresh);
  }
  
  /**
   * Fetch rounds by match ID
   */
  async getRoundsByMatchId(matchId: string): Promise<Round[]> {
    const cacheKey = `rounds_match_${matchId}`;
    const fetchFn = async () => {
      const { data, error } = await supabase
        .from('rounds')
        .select('*')
        .eq('matchId', matchId);
      
      if (error) {
        console.error(`Error fetching rounds for match ${matchId}:`, error);
        throw new Error(`Failed to fetch rounds: ${error.message}`);
      }
      
      return data || [];
    };
    
    return fetchWithCache(cacheKey, fetchFn);
  }
  
  /**
   * Fetch player stats by match ID
   */
  async getPlayerStatsByMatchId(matchId: string): Promise<PlayerStats[]> {
    const cacheKey = `player_stats_match_${matchId}`;
    const fetchFn = async () => {
      const { data, error } = await supabase
        .from('player_stats')
        .select('*')
        .eq('matchId', matchId);
      
      if (error) {
        console.error(`Error fetching player stats for match ${matchId}:`, error);
        throw new Error(`Failed to fetch player stats: ${error.message}`);
      }
      
      return data || [];
    };
    
    return fetchWithCache(cacheKey, fetchFn);
  }
  
  /**
   * Fetch a player by ID
   */
  async getPlayerById(playerId: string): Promise<Player | null> {
    const cacheKey = `player_${playerId}`;
    const fetchFn = async () => {
      const { data, error } = await supabase
        .from('players')
        .select('*')
        .eq('id', playerId)
        .single();
      
      if (error) {
        if (error.code === 'PGRST116') {
          // No rows returned
          return null;
        }
        console.error(`Error fetching player ${playerId}:`, error);
        throw new Error(`Failed to fetch player: ${error.message}`);
      }
      
      return data;
    };
    
    return fetchWithCache(cacheKey, fetchFn);
  }
  
  /**
   * Convert players data from Supabase to the format used by our application
   * Applies validation and ensures data integrity
   */
  convertPlayersToRawStats(players: Player[]): PlayerRawStats[] {
    if (!players || !Array.isArray(players)) {
      console.warn('[DATA INTEGRITY] No valid players array received from Supabase');
      return [];
    }
    
    const validatedPlayers: PlayerRawStats[] = [];
    
    for (const player of players) {
      try {
        // Use the validator to ensure data integrity with proper defaults
        const validatedPlayer = validatePlayerStats({
          id: player.id,
          name: player.name,
          team: player.team || '',
          ctRole: player.ctRole,
          tRole: player.tRole,
          isIGL: player.isIGL || false,
          hs: player.averageHS || 0,
          adr: 0, // Using default since Supabase schema might differ
          kpr: player.averageKills || 0,
          dpr: player.averageDeaths || 0,
          kd: player.kdr || 0,
          impact: 0, // Using default since Supabase schema might differ
          kast: 0, // Using default since Supabase schema might differ
          flashAssists: player.flashAssists || 0,
          utilityDamage: player.utilityDamagePerRound || 0,
          openingKills: player.openingKillRate || 0,
          openingDeaths: player.firstDeathRate || 0,
          clutchesWon: player.clutchWinRate || 0,
          tradingSuccess: player.tradingSuccessRate || 0,
          consistencyScore: player.consistencyScore || 0,
          pivValue: player.piv || 0,
          
          // Include defaults for other required fields
          steamId: player.id,
          userName: player.name,
          teamName: player.team || '',
          damage: 0,
          kills: 0, 
          deaths: 0,
          assists: 0,
          killAssists: 0,
          incendiaryDamage: 0,
          molotovDamage: 0,
          heDamage: 0,
          entrySuccess: 0,
          entryAttempts: 0,
          multiKills: 0,
          oneVXs: 0,
          oneVXAttempts: 0,
          HSPercent: player.averageHS || 0,
          flashesThrown: 0,
          smkThrown: 0,
          heThrown: 0,
          molliesThrown: 0,
          roundsPlayed: 0, // Using defaults for compatibility
          mapsPlayed: 0,  // Using defaults for compatibility
          firstKills: 0,  // Using defaults for compatibility
          firstDeaths: 0, // Using defaults for compatibility
          tradedDeaths: 0,
          tradedKills: 0,
          survivedRounds: 0,
          rounds_ct: 0,
          rounds_t: 0,
          kills_t: 0,
          deaths_t: 0,
          adr_t: 0,
          kast_t: 0,
          kills_ct: 0,
          deaths_ct: 0,
          adr_ct: 0,
          kast_ct: 0,
          wallbangKills: 0,
          assistedFlashes: player.flashAssists || 0,
          noScope: 0,
          throughSmoke: 0
        });
        
        validatedPlayers.push(validatedPlayer);
      } catch (err) {
        const error = err as Error;
        logDataIntegrityIssue('Supabase', 'Player', player.id, `Data validation failed: ${error.message}`);
      }
    }
    
    return validatedPlayers;
  }
  
  /**
   * Map role string from database to PlayerRole enum
   */
  private mapRoleStringToEnum(roleStr: string | null): PlayerRole {
    if (!roleStr) return PlayerRole.Support;
    
    switch (roleStr.toLowerCase()) {
      case 'awp':
      case 'awper':
        return PlayerRole.AWP;
      case 'entry':
      case 'spacetaker':
        return PlayerRole.Spacetaker;
      case 'igl':
        return PlayerRole.IGL;
      case 'lurker':
        return PlayerRole.Lurker;
      case 'anchor':
        return PlayerRole.Anchor;
      case 'rotator':
        return PlayerRole.Rotator;
      case 'support':
      default:
        return PlayerRole.Support;
    }
  }
  
  /**
   * Refresh all cached data
   */
  async refreshAllData(): Promise<void> {
    await Promise.all([
      this.getAllPlayers(true),
      this.getAllTeams(true),
      this.getAllMatches(true)
    ]);
    console.log('All data refreshed from Supabase');
  }
  
  /**
   * Clear all cached data
   */
  clearAllCaches(): void {
    clearCache();
  }
}

// Export a singleton instance
export const supabaseDataService = new SupabaseDataService();
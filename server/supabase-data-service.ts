import { supabase, fetchWithCache, refreshCache, clearCache } from './supabase';
import { Player, Team, Match, Round, PlayerStats } from '../shared/database.types';
import { PlayerRawStats, PlayerRoleInfo } from './types';
import { PlayerRole } from '../shared/schema';

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
   */
  convertPlayersToRawStats(players: Player[]): PlayerRawStats[] {
    return players.map(player => ({
      id: player.id,
      name: player.name,
      team: player.team || '',
      ctRole: this.mapRoleStringToEnum(player.ctRole),
      tRole: this.mapRoleStringToEnum(player.tRole),
      isIGL: player.isIGL || false,
      hs: player.averageHS || 0,
      adr: 0, // Need to calculate from player_stats
      kpr: player.averageKills || 0,
      dpr: player.averageDeaths || 0,
      kd: player.kdr || 0,
      impact: 0, // Need to calculate
      kast: 0, // Need to calculate from player_stats
      flashAssists: player.flashAssists || 0,
      utilityDamage: player.utilityDamagePerRound || 0,
      openingKills: player.openingKillRate || 0,
      openingDeaths: player.firstDeathRate || 0,
      clutchesWon: player.clutchWinRate || 0,
      tradingSuccess: player.tradingSuccessRate || 0,
      consistencyScore: player.consistencyScore || 0,
      pivValue: player.piv || 0,
      // Add additional stats as needed
    }));
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
import { cleanSupabaseAdapter } from './clean-supabase-adapter';
import { PlayerWithPIV, TeamWithTIR } from '@shared/types';

/**
 * Clean service for Supabase data that includes caching by event
 */
export class CleanSupabaseService {
  private static instance: CleanSupabaseService;
  private cachedEvents: { id: number; name: string }[] | null = null;
  private cachedPlayersByEvent: Map<number, PlayerWithPIV[]> = new Map();
  private cachedTeamsByEvent: Map<number, TeamWithTIR[]> = new Map();
  private lastRefreshTime: Date | null = null;
  private refreshPromise: Promise<void> | null = null;
  private _isSupabaseAvailable = false;
  
  private constructor() {}
  
  /**
   * Get the singleton instance
   */
  public static getInstance(): CleanSupabaseService {
    if (!CleanSupabaseService.instance) {
      CleanSupabaseService.instance = new CleanSupabaseService();
    }
    return CleanSupabaseService.instance;
  }

  /**
   * Check if Supabase connection is available
   */
  public async checkConnection(): Promise<boolean> {
    try {
      this._isSupabaseAvailable = await cleanSupabaseAdapter.checkConnection();
      console.log(`Supabase connection: ${this._isSupabaseAvailable ? 'Available' : 'Unavailable'}`);
      return this._isSupabaseAvailable;
    } catch (error) {
      console.error('Error checking Supabase connection:', error);
      this._isSupabaseAvailable = false;
      return false;
    }
  }

  /**
   * Check if Supabase is available
   */
  public isSupabaseAvailable(): boolean {
    return this._isSupabaseAvailable;
  }

  /**
   * Refresh all data from Supabase
   */
  public async refreshData(): Promise<void> {
    // If a refresh is already in progress, return the existing promise
    if (this.refreshPromise) {
      return this.refreshPromise;
    }

    this.refreshPromise = this._refreshData();
    
    try {
      await this.refreshPromise;
    } finally {
      this.refreshPromise = null;
    }
  }

  /**
   * Get all available events
   */
  public async getEvents(): Promise<{ id: number, name: string }[]> {
    // If no cached events or first time, fetch fresh data
    if (!this.cachedEvents) {
      try {
        const events = await cleanSupabaseAdapter.getEvents();
        this.cachedEvents = events;
        return events;
      } catch (error) {
        console.error('Error getting events:', error);
        return [];
      }
    }
    
    return this.cachedEvents;
  }

  /**
   * Internal refresh method
   */
  private async _refreshData(): Promise<void> {
    console.log('Refreshing data from Supabase...');
    
    try {
      // Check connection first
      const isConnected = await this.checkConnection();
      if (!isConnected) {
        console.error('Cannot refresh data: Supabase not available');
        return;
      }

      // Get all events (just for reference)
      const events = await cleanSupabaseAdapter.getEvents();
      this.cachedEvents = events;
      
      // Get all player data (amalgamated across events)
      const players = await cleanSupabaseAdapter.getPlayersWithPIV();
      
      // Get all team data (amalgamated across events)
      const teams = await cleanSupabaseAdapter.getTeamsWithTIR();
      
      // Store in a special "amalgamated" key
      const amalgamatedEventId = 0; // Special ID for amalgamated data
      this.cachedPlayersByEvent.set(amalgamatedEventId, players);
      this.cachedTeamsByEvent.set(amalgamatedEventId, teams);
      
      console.log(`Loaded ${players.length} players and ${teams.length} teams from Supabase`);
      
      this.lastRefreshTime = new Date();
    } catch (error) {
      console.error('Error refreshing data:', error);
    }
  }

  /**
   * Get players with PIV values - amalgamated across all events
   */
  public async getPlayersWithPIV(): Promise<PlayerWithPIV[]> {
    // If no cached data or first time, fetch fresh data
    if (this.cachedPlayersByEvent.size === 0) {
      await this.refreshData();
    }
    
    // Create a map to combine players by their unique ID
    const playerMap = new Map<string, PlayerWithPIV>();
    
    // Process each event's players
    for (const players of this.cachedPlayersByEvent.values()) {
      for (const player of players) {
        if (!playerMap.has(player.id)) {
          // First time seeing this player - add them to the map
          playerMap.set(player.id, {...player});
        } else {
          // Player already exists - combine their stats
          const existingPlayer = playerMap.get(player.id)!;
          
          // Combine raw stats
          if (existingPlayer.rawStats && player.rawStats) {
            // Sum numerical stats
            for (const key in player.rawStats) {
              if (typeof player.rawStats[key] === 'number') {
                existingPlayer.rawStats[key] = (existingPlayer.rawStats[key] || 0) + player.rawStats[key];
              }
            }
          }
          
          // Recalculate derived metrics based on combined raw stats
          if (existingPlayer.rawStats) {
            // Recalculate averages like K/D ratio
            if (existingPlayer.rawStats.kills !== undefined && existingPlayer.rawStats.deaths !== undefined) {
              existingPlayer.kd = existingPlayer.rawStats.deaths > 0 
                ? existingPlayer.rawStats.kills / existingPlayer.rawStats.deaths 
                : existingPlayer.rawStats.kills;
            }
            
            // Update PIV - weighted average based on rounds played
            const existingRounds = existingPlayer.rawStats.roundsPlayed || 0;
            const currentRounds = player.rawStats?.roundsPlayed || 0;
            const totalRounds = existingRounds + currentRounds;
            
            if (totalRounds > 0) {
              // Calculate weighted average of PIV based on rounds played
              existingPlayer.piv = (
                (existingPlayer.piv * existingRounds) + 
                (player.piv * currentRounds)
              ) / totalRounds;
              
              // Same for side-specific PIV
              if (existingPlayer.ctPIV !== undefined && player.ctPIV !== undefined) {
                existingPlayer.ctPIV = (
                  (existingPlayer.ctPIV * existingRounds) + 
                  (player.ctPIV * currentRounds)
                ) / totalRounds;
              }
              
              if (existingPlayer.tPIV !== undefined && player.tPIV !== undefined) {
                existingPlayer.tPIV = (
                  (existingPlayer.tPIV * existingRounds) + 
                  (player.tPIV * currentRounds)
                ) / totalRounds;
              }
            }
          }
        }
      }
    }
    
    // Convert the map back to an array
    return Array.from(playerMap.values());
  }

  /**
   * Get teams with TIR values - amalgamated across all events
   */
  public async getTeamsWithTIR(): Promise<TeamWithTIR[]> {
    // If no cached data or first time, fetch fresh data
    if (this.cachedTeamsByEvent.size === 0) {
      await this.refreshData();
    }
    
    // Create a map to combine teams by their unique ID
    const teamMap = new Map<string, TeamWithTIR>();
    
    // Process each event's teams
    for (const teams of this.cachedTeamsByEvent.values()) {
      for (const team of teams) {
        if (!teamMap.has(team.id)) {
          // First time seeing this team - add it to the map
          teamMap.set(team.id, {...team});
        } else {
          // Team already exists - combine their stats
          const existingTeam = teamMap.get(team.id)!;
          
          // Combine match statistics
          existingTeam.wins = (existingTeam.wins || 0) + (team.wins || 0);
          existingTeam.losses = (existingTeam.losses || 0) + (team.losses || 0);
          
          // Average the TIR (team impact rating) - weighted by number of matches
          const existingMatches = (existingTeam.wins || 0) + (existingTeam.losses || 0);
          const currentMatches = (team.wins || 0) + (team.losses || 0);
          const totalMatches = existingMatches + currentMatches;
          
          if (totalMatches > 0 && existingTeam.tir !== undefined && team.tir !== undefined) {
            // Weighted average for TIR based on number of matches
            existingTeam.tir = (
              (existingTeam.tir * existingMatches) + 
              (team.tir * currentMatches)
            ) / totalMatches;
          }
          
          // Combine players from both teams (we'll rely on player amalgamation to handle duplicates)
          if (team.players && team.players.length > 0) {
            if (!existingTeam.players) {
              existingTeam.players = [];
            }
            
            // Merge in any players that don't already exist in the team
            const existingPlayerIds = new Set(existingTeam.players.map(p => p.id));
            for (const player of team.players) {
              if (!existingPlayerIds.has(player.id)) {
                existingTeam.players.push(player);
              }
            }
          }
        }
      }
    }
    
    // Convert the map back to an array
    return Array.from(teamMap.values());
  }

  /**
   * Get the last refresh time
   */
  public getLastRefreshTime(): Date | null {
    return this.lastRefreshTime;
  }

  /**
   * Clear all cached data
   */
  public clearCache(): void {
    this.cachedEvents = null;
    this.cachedPlayersByEvent.clear();
    this.cachedTeamsByEvent.clear();
  }
}

// Export singleton instance
export const cleanSupabaseService = CleanSupabaseService.getInstance();
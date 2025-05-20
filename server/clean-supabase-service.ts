import { PlayerWithPIV, TeamWithTIR } from '@shared/types';
import { cleanSupabaseAdapter } from './clean-supabase-adapter';

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
    // If already refreshing, return the existing promise
    if (this.refreshPromise) {
      return this.refreshPromise;
    }

    try {
      // Set up the refresh promise
      this.refreshPromise = this._refreshData();
      await this.refreshPromise;
      this.lastRefreshTime = new Date();
    } catch (error) {
      console.error('Error refreshing data:', error);
    } finally {
      this.refreshPromise = null;
    }
  }

  /**
   * Get all available events
   */
  public async getEvents(): Promise<{ id: number, name: string }[]> {
    if (!this.cachedEvents) {
      try {
        this.cachedEvents = await cleanSupabaseAdapter.getEvents();
      } catch (error) {
        console.error('Error getting events:', error);
        return [];
      }
    }
    return this.cachedEvents || [];
  }

  /**
   * Internal refresh method
   */
  private async _refreshData(): Promise<void> {
    try {
      // First check if Supabase is available
      const isAvailable = await this.checkConnection();
      if (!isAvailable) {
        console.error('Supabase is not available for refreshing data');
        return;
      }

      // Clear caches
      this.cachedEvents = null;
      this.cachedPlayersByEvent.clear();
      this.cachedTeamsByEvent.clear();

      // Get events
      const events = await this.getEvents();
      console.log(`Refreshing data for ${events.length} events`);

      // For each event, cache players and teams
      for (const event of events) {
        const players = await cleanSupabaseAdapter.getPlayersWithPIV();
        this.cachedPlayersByEvent.set(event.id, players);

        const teams = await cleanSupabaseAdapter.getTeamsWithTIR();
        this.cachedTeamsByEvent.set(event.id, teams);
      }

      console.log('Data refresh completed successfully');
    } catch (error) {
      console.error('Error in data refresh:', error);
      throw error;
    }
  }

  /**
   * Get players with PIV values - amalgamated across all events
   */
  public async getPlayersWithPIV(): Promise<PlayerWithPIV[]> {
    // If no cached data, refresh
    if (this.cachedPlayersByEvent.size === 0) {
      await this.refreshData();
    }

    // Amalgamate players across all events
    const allPlayers: PlayerWithPIV[] = [];
    const playerMap = new Map<string, PlayerWithPIV>();

    // Get all events' players and merge them
    Array.from(this.cachedPlayersByEvent.entries()).forEach(([_, players]) => {
      players.forEach(player => {
        // Use the player ID as a unique key
        const playerId = player.id;
        
        if (!playerMap.has(playerId)) {
          // First time seeing this player
          playerMap.set(playerId, { ...player });
        } else {
          // We've seen this player before, merge stats
          // For a real application, you would implement a more sophisticated
          // merging strategy that combines stats across events
          const existingPlayer = playerMap.get(playerId)!;
          
          // Simple averaging of PIV and rating
          existingPlayer.piv = (existingPlayer.piv + player.piv) / 2;
          existingPlayer.rating = (existingPlayer.rating + player.rating) / 2;
          
          // Merge metrics by adding them
          existingPlayer.metrics.kills += player.metrics.kills;
          existingPlayer.metrics.deaths += player.metrics.deaths;
          existingPlayer.metrics.assists += player.metrics.assists;
          
          // Recalculate KD
          existingPlayer.kd = existingPlayer.metrics.deaths > 0 ? 
            existingPlayer.metrics.kills / existingPlayer.metrics.deaths : 
            existingPlayer.metrics.kills;
          
          // Update the metrics KD
          existingPlayer.metrics.kd = existingPlayer.kd;
        }
      });
    });

    // Convert the map back to an array
    return Array.from(playerMap.values());
  }

  /**
   * Get teams with TIR values - amalgamated across all events
   */
  public async getTeamsWithTIR(): Promise<TeamWithTIR[]> {
    // If no cached data, refresh
    if (this.cachedTeamsByEvent.size === 0) {
      await this.refreshData();
    }

    // Amalgamate teams across all events
    const teamMap = new Map<string, TeamWithTIR>();

    // Get all events' teams and merge them
    Array.from(this.cachedTeamsByEvent.entries()).forEach(([_, teams]) => {
      teams.forEach(team => {
        // Use the team name as a unique key
        const teamName = team.name;
        
        if (!teamMap.has(teamName)) {
          // First time seeing this team
          teamMap.set(teamName, { ...team });
        } else {
          // We've seen this team before, merge stats
          // For a real application, you would implement a more sophisticated
          // merging strategy that combines team stats across events
          const existingTeam = teamMap.get(teamName)!;
          
          // Simple averaging of TIR and other metrics
          existingTeam.tir = (existingTeam.tir + team.tir) / 2;
          existingTeam.avgPIV = (existingTeam.avgPIV + team.avgPIV) / 2;
          existingTeam.synergy = (existingTeam.synergy + team.synergy) / 2;
          
          // Combine player lists
          // This is a simplified approach - in reality you would need to
          // deduplicate players and merge their stats
          existingTeam.players = [...existingTeam.players, ...team.players];
          
          // Recalculate top players based on merged player list
          existingTeam.topPlayers = [...existingTeam.players]
            .sort((a, b) => (b.piv || 0) - (a.piv || 0))
            .slice(0, 5);
          
          // Update top player 
          if (existingTeam.topPlayers.length > 0) {
            existingTeam.topPlayer = {
              name: existingTeam.topPlayers[0].name,
              piv: existingTeam.topPlayers[0].piv || 0
            };
          }
        }
      });
    });

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

export const cleanSupabaseService = CleanSupabaseService.getInstance();
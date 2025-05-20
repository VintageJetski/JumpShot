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

      // Get all events
      const events = await cleanSupabaseAdapter.getEvents();
      this.cachedEvents = events;
      
      // For each event, get players and teams
      for (const event of events) {
        // Get fresh player data for this event
        const players = await cleanSupabaseAdapter.getPlayersWithPIV(event.id);
        
        // Get fresh team data for this event
        const teams = await cleanSupabaseAdapter.getTeamsWithTIR(event.id);
        
        // Update cache for this event
        this.cachedPlayersByEvent.set(event.id, players);
        this.cachedTeamsByEvent.set(event.id, teams);
        
        console.log(`Refreshed ${players.length} players and ${teams.length} teams for event ${event.name} (ID: ${event.id})`);
      }
      
      this.lastRefreshTime = new Date();
    } catch (error) {
      console.error('Error refreshing data:', error);
    }
  }

  /**
   * Get players with PIV values
   * @param eventId Optional event ID to filter by (undefined returns players from all events)
   */
  public async getPlayersWithPIV(eventId?: number): Promise<PlayerWithPIV[]> {
    // If no cached data or first time, fetch fresh data
    if (this.cachedPlayersByEvent.size === 0) {
      await this.refreshData();
    }
    
    // If specific event requested, return just those players
    if (eventId !== undefined) {
      return this.cachedPlayersByEvent.get(eventId) || [];
    }
    
    // Otherwise return all players from all events
    const allPlayers: PlayerWithPIV[] = [];
    for (const players of this.cachedPlayersByEvent.values()) {
      allPlayers.push(...players);
    }
    
    return allPlayers;
  }

  /**
   * Get teams with TIR values
   * @param eventId Optional event ID to filter by (undefined returns teams from all events)
   */
  public async getTeamsWithTIR(eventId?: number): Promise<TeamWithTIR[]> {
    // If no cached data or first time, fetch fresh data
    if (this.cachedTeamsByEvent.size === 0) {
      await this.refreshData();
    }
    
    // If specific event requested, return just those teams
    if (eventId !== undefined) {
      return this.cachedTeamsByEvent.get(eventId) || [];
    }
    
    // Otherwise return all teams from all events
    const allTeams: TeamWithTIR[] = [];
    for (const teams of this.cachedTeamsByEvent.values()) {
      allTeams.push(...teams);
    }
    
    return allTeams;
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
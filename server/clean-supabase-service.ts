import { cleanSupabaseAdapter } from './clean-supabase-adapter';
import { PlayerWithPIV, TeamWithTIR } from '@shared/types';

/**
 * Clean service for Supabase data that includes caching
 */
export class CleanSupabaseService {
  private static instance: CleanSupabaseService;
  private cachedPlayers: PlayerWithPIV[] | null = null;
  private cachedTeams: TeamWithTIR[] | null = null;
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

      // Get fresh player data
      const players = await cleanSupabaseAdapter.getPlayersWithPIV();
      
      // Get fresh team data (which also includes updated player associations)
      const teams = await cleanSupabaseAdapter.getTeamsWithTIR();
      
      // Update cache
      this.cachedPlayers = players;
      this.cachedTeams = teams;
      this.lastRefreshTime = new Date();
      
      console.log(`Refreshed ${players.length} players and ${teams.length} teams`);
    } catch (error) {
      console.error('Error refreshing data:', error);
    }
  }

  /**
   * Get players with PIV values
   */
  public async getPlayersWithPIV(): Promise<PlayerWithPIV[]> {
    // If no cached data or first time, fetch fresh data
    if (!this.cachedPlayers) {
      await this.refreshData();
    }
    
    return this.cachedPlayers || [];
  }

  /**
   * Get teams with TIR values
   */
  public async getTeamsWithTIR(): Promise<TeamWithTIR[]> {
    // If no cached data or first time, fetch fresh data
    if (!this.cachedTeams) {
      await this.refreshData();
    }
    
    return this.cachedTeams || [];
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
    this.cachedPlayers = null;
    this.cachedTeams = null;
  }
}

// Export singleton instance
export const cleanSupabaseService = CleanSupabaseService.getInstance();
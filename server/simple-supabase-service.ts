import { PlayerWithPIV, TeamWithTIR } from '@shared/types';
import { simpleSupabaseAdapter } from './simple-supabase-adapter';

/**
 * Service class for managing data from Supabase
 */
export class SimpleSupabaseService {
  private static instance: SimpleSupabaseService;
  private cachedPlayers: PlayerWithPIV[] | null = null;
  private cachedTeams: TeamWithTIR[] | null = null;
  private lastRefreshTime: Date | null = null;
  private refreshPromise: Promise<void> | null = null;
  private _isSupabaseAvailable = false;

  private constructor() {}

  /**
   * Get singleton instance
   */
  public static getInstance(): SimpleSupabaseService {
    if (!SimpleSupabaseService.instance) {
      SimpleSupabaseService.instance = new SimpleSupabaseService();
    }
    return SimpleSupabaseService.instance;
  }

  /**
   * Check if Supabase connection is available
   */
  public async checkConnection(): Promise<boolean> {
    try {
      this._isSupabaseAvailable = await simpleSupabaseAdapter.checkConnection();
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
    // If there's already a refresh in progress, return that promise
    if (this.refreshPromise) {
      return this.refreshPromise;
    }

    // Create and store the refresh promise
    this.refreshPromise = this._refreshData();

    try {
      await this.refreshPromise;
    } finally {
      // Clear the refresh promise when done
      this.refreshPromise = null;
    }
  }

  /**
   * Get all available events
   */
  public async getEvents(): Promise<{ id: number, name: string }[]> {
    if (!this._isSupabaseAvailable) {
      await this.checkConnection();
    }

    try {
      return await simpleSupabaseAdapter.getEvents();
    } catch (error) {
      console.error('Error getting events:', error);
      return [];
    }
  }

  /**
   * Internal refresh method
   */
  private async _refreshData(): Promise<void> {
    console.log('Refreshing data from Supabase...');
    
    try {
      // Check connection
      const isConnected = await this.checkConnection();
      console.log(`Supabase connection: ${isConnected ? 'Available' : 'Unavailable'}`);
      
      if (!isConnected) {
        return;
      }
      
      // Get players with PIV
      const players = await simpleSupabaseAdapter.getPlayersWithPIV();
      this.cachedPlayers = players;
      
      // Get teams with TIR
      const teams = await simpleSupabaseAdapter.getTeamsWithTIR();
      this.cachedTeams = teams;
      
      // Update last refresh time
      this.lastRefreshTime = new Date();
      
      console.log(`Loaded ${players.length} players and ${teams.length} teams from Supabase`);
    } catch (error) {
      console.error('Error refreshing data from Supabase:', error);
      throw error;
    }
  }

  /**
   * Get players with PIV values
   */
  public async getPlayersWithPIV(): Promise<PlayerWithPIV[]> {
    if (!this.cachedPlayers) {
      await this.refreshData();
    }
    return this.cachedPlayers || [];
  }

  /**
   * Get teams with TIR values
   */
  public async getTeamsWithTIR(): Promise<TeamWithTIR[]> {
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

export const simpleSupabaseService = SimpleSupabaseService.getInstance();
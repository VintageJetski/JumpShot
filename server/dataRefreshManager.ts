import { SupabaseStorage } from './supabase-storage';

/**
 * Class to manage scheduled data refreshes from Supabase
 */
export class DataRefreshManager {
  private static instance: DataRefreshManager;
  private refreshInterval: NodeJS.Timeout | null = null;
  private refreshIntervalMs = 24 * 60 * 60 * 1000; // 24 hours
  private isRefreshing = false;
  private lastRefreshTime: Date | null = null;
  private _isSupabaseAvailable = false;
  private storage: SupabaseStorage;

  private constructor() {
    this.storage = new SupabaseStorage();
  }

  /**
   * Get the singleton instance of the refresh manager
   */
  public static getInstance(): DataRefreshManager {
    if (!DataRefreshManager.instance) {
      DataRefreshManager.instance = new DataRefreshManager();
    }
    return DataRefreshManager.instance;
  }

  /**
   * Start the data refresh scheduler
   */
  public async start(): Promise<void> {
    console.log('Starting data refresh manager...');
    
    // Check if Supabase is available
    await this.checkSupabaseConnection();
    
    // Do an initial refresh
    await this.refreshData();

    // Set up the refresh interval
    if (this.refreshInterval) {
      clearInterval(this.refreshInterval);
    }
    
    this.refreshInterval = setInterval(async () => {
      await this.refreshData();
    }, this.refreshIntervalMs);
    
    console.log(`Data refresh scheduler started with interval of ${this.refreshIntervalMs / (60 * 60 * 1000)} hours`);
  }

  /**
   * Stop the data refresh scheduler
   */
  public stop(): void {
    if (this.refreshInterval) {
      clearInterval(this.refreshInterval);
      this.refreshInterval = null;
      console.log('Data refresh scheduler stopped');
    }
  }
  
  /**
   * Test if Supabase connection is available
   */
  public async checkSupabaseConnection(): Promise<boolean> {
    try {
      this._isSupabaseAvailable = await this.storage.checkConnection();
      console.log(`Supabase connection check: ${this._isSupabaseAvailable ? 'Available' : 'Unavailable'}`);
      return this._isSupabaseAvailable;
    } catch (error) {
      console.error('Error checking Supabase connection:', error);
      this._isSupabaseAvailable = false;
      return false;
    }
  }
  
  /**
   * Refresh data from Supabase or fallback sources
   */
  public async refreshData(): Promise<void> {
    if (this.isRefreshing) {
      console.log('Data refresh already in progress, skipping...');
      return;
    }
    
    this.isRefreshing = true;
    console.log('Starting data refresh...');
    
    try {
      // Check Supabase connection
      await this.checkSupabaseConnection();
      
      if (this._isSupabaseAvailable) {
        console.log('Refreshing data from Supabase...');
        
        // Get available events
        const events = await this.storage.getEvents();
        console.log(`Found ${events.length} events: ${events.map(e => e.name).join(', ')}`);
        
        // Clear any cached data
        for (const event of events) {
          console.log(`Refreshing data for event ${event.name} (ID: ${event.id})...`);
          
          // Get fresh data
          const players = await this.storage.getPlayersWithPIV(event.id);
          const teams = await this.storage.getTeamsWithTIR(event.id);
          
          console.log(`Refreshed ${players.length} players and ${teams.length} teams for event ${event.id}`);
        }
        
        console.log('Data refresh completed successfully');
      } else {
        console.log('Supabase not available, falling back to CSV data...');
        // Get data for default event (1)
        const players = await this.storage.getPlayersWithPIV(1);
        const teams = await this.storage.getTeamsWithTIR(1);
        
        console.log(`Loaded ${players.length} players and ${teams.length} teams from CSV`);
      }
      
      this.lastRefreshTime = new Date();
    } catch (error) {
      console.error('Error during data refresh:', error);
    } finally {
      this.isRefreshing = false;
    }
  }
  
  /**
   * Get the last refresh time
   */
  public getLastRefreshTime(): Date | null {
    return this.lastRefreshTime;
  }
  
  /**
   * Check if Supabase is available
   */
  public isSupabaseAvailable(): boolean {
    return this._isSupabaseAvailable;
  }
  
  /**
   * Set the refresh interval (in milliseconds)
   */
  public setRefreshInterval(intervalMs: number): void {
    this.refreshIntervalMs = intervalMs;
    
    // Restart the interval with the new time
    if (this.refreshInterval) {
      this.stop();
      this.start();
    }
  }
  
  /**
   * Get the current storage instance
   */
  public getStorage(): SupabaseStorage {
    return this.storage;
  }
}

export const dataRefreshManager = DataRefreshManager.getInstance();
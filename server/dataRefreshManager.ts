import { SupabaseStorage } from './supabase-storage';
import { testDatabaseConnection } from './supabase-db';

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
    
    // Test Supabase connection initially
    await this.checkSupabaseConnection();
    
    // Initialize storage
    await this.storage.initialize();
    
    // Perform initial refresh
    await this.refreshData();
    
    // Set up regular refresh interval
    if (this.refreshInterval) {
      clearInterval(this.refreshInterval);
    }
    
    this.refreshInterval = setInterval(async () => {
      await this.refreshData();
    }, this.refreshIntervalMs);
    
    console.log(`Data refresh scheduler started with ${this.refreshIntervalMs / (1000 * 60 * 60)} hour interval`);
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
      const isConnected = await testDatabaseConnection();
      this._isSupabaseAvailable = isConnected;
      
      if (isConnected) {
        console.log('Supabase connection is available');
      } else {
        console.warn('Supabase connection is not available');
      }
      
      return isConnected;
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
      console.log('Data refresh already in progress, skipping');
      return;
    }
    
    this.isRefreshing = true;
    
    try {
      console.log('Starting data refresh...');
      
      // Check connection
      const isConnected = await this.checkSupabaseConnection();
      
      if (!isConnected) {
        console.warn('Supabase connection not available, using CSV fallback data');
        // Continue with fallback mechanisms in the storage class
      }
      
      // Force storage to refresh by re-initializing
      await this.storage.initialize();
      
      // Get all available events
      const events = this.storage.getEvents();
      
      console.log(`Found ${events.length} events: ${events.map(e => e.name).join(', ')}`);
      
      // Warm up the cache for each event
      for (const event of events) {
        console.log(`Refreshing data for event ${event.name} (ID: ${event.id})...`);
        
        // This will populate the internal caches
        await this.storage.getPlayerStatsForEvent(event.id);
        await this.storage.getTeamStatsForEvent(event.id);
        await this.storage.getPlayerStatsWithPIV(event.id);
        await this.storage.getTeamStatsWithTIR(event.id);
      }
      
      this.lastRefreshTime = new Date();
      console.log(`Data refresh completed at ${this.lastRefreshTime.toISOString()}`);
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
    if (intervalMs < 60000) { // Minimum 1 minute
      intervalMs = 60000;
    }
    
    this.refreshIntervalMs = intervalMs;
    
    if (this.refreshInterval) {
      // Restart interval with new time
      this.stop();
      this.refreshInterval = setInterval(async () => {
        await this.refreshData();
      }, this.refreshIntervalMs);
    }
    
    console.log(`Refresh interval set to ${this.refreshIntervalMs / (1000 * 60)} minutes`);
  }
  
  /**
   * Get the current storage instance
   */
  public getStorage(): SupabaseStorage {
    return this.storage;
  }
}

export const dataRefreshManager = DataRefreshManager.getInstance();
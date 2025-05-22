import { SupabaseStorage } from './supabase-storage';
import { testDatabaseConnection } from './supabase-db';
import { RawSQLAdapter } from './raw-sql-adapter';

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
  private rawSQLAdapter: RawSQLAdapter;

  private constructor() {
    this.storage = new SupabaseStorage();
    this.rawSQLAdapter = new RawSQLAdapter();
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
   * Refresh data from Supabase using raw SQL adapter
   */
  public async refreshData(): Promise<void> {
    if (this.isRefreshing) {
      console.log('Data refresh already in progress, skipping');
      return;
    }
    
    this.isRefreshing = true;
    
    try {
      console.log('Starting data refresh using raw SQL adapter...');
      
      // Check connection using raw SQL adapter
      const isConnected = await this.rawSQLAdapter.testConnection();
      this._isSupabaseAvailable = isConnected;
      
      if (!isConnected) {
        console.warn('Supabase connection not available via raw SQL adapter, using CSV fallback data');
        // Force storage to refresh by re-initializing with CSV fallback
        await this.storage.initialize();
        
        // Get events from CSV fallback
        const events = this.storage.getEvents();
        console.log(`Found ${events.length} events from CSV fallback: ${events.map(e => e.name).join(', ')}`);
        
        this.lastRefreshTime = new Date();
        console.log(`Data refresh completed with CSV fallback at ${this.lastRefreshTime.toISOString()}`);
        return;
      }
      
      // Use raw SQL adapter to get fresh data from Supabase
      console.log('Fetching fresh data from Supabase using raw SQL adapter...');
      
      // Get events from raw SQL
      const events = await this.rawSQLAdapter.getEvents();
      console.log(`Found ${events.length} events from Supabase: ${events.map(e => e.name).join(', ')}`);
      
      // Warm up the cache for each event using raw SQL data
      for (const event of events) {
        console.log(`Refreshing data for event ${event.name} (ID: ${event.id})...`);
        
        // Get players for this event using raw SQL adapter
        const players = await this.rawSQLAdapter.getPlayersForEvent(event.id);
        console.log(`  - Retrieved ${players.length} players for ${event.name}`);
        
        // Get teams for this event using raw SQL adapter
        const teams = await this.rawSQLAdapter.getTeamsForEvent(event.id);
        console.log(`  - Retrieved ${teams.length} teams for ${event.name}`);
        
        // Update storage with fresh Supabase data
        this.storage.updateEventData(event.id, {
          players,
          teams,
          event
        });
      }
      
      this.lastRefreshTime = new Date();
      console.log(`Data refresh completed successfully using raw SQL adapter at ${this.lastRefreshTime.toISOString()}`);
    } catch (error) {
      console.error('Error during data refresh with raw SQL adapter:', error);
      console.log('Falling back to CSV data...');
      
      // Fallback to CSV data if Supabase fails
      try {
        await this.storage.initialize();
        const events = this.storage.getEvents();
        console.log(`Fallback successful: Found ${events.length} events from CSV`);
      } catch (fallbackError) {
        console.error('Fallback to CSV data also failed:', fallbackError);
      }
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
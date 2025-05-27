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
      
      // Check connection using database test function
      const isConnected = await testDatabaseConnection();
      this._isSupabaseAvailable = isConnected;
      
      if (!isConnected) {
        console.error('Supabase connection not available - cannot refresh data without database connection');
        throw new Error('Database connection required for data refresh');
      }
      
      // Use raw SQL adapter to get fresh data from Supabase
      console.log('Fetching fresh data from Supabase using raw SQL adapter...');
      
      // Get event IDs from raw SQL
      const eventIds = await this.rawSQLAdapter.getEventIds();
      console.log(`Found ${eventIds.length} events from Supabase: ${eventIds.join(', ')}`);
      
      // Warm up the cache for each event using raw SQL data
      for (const eventId of eventIds) {
        const eventName = eventId === 1 ? 'IEM_Katowice_2025' : eventId === 2 ? 'PGL_Bucharest_2025' : `Event_${eventId}`;
        console.log(`Refreshing data for event ${eventName} (ID: ${eventId})...`);
        
        // Get players for this event using raw SQL adapter
        const players = await this.rawSQLAdapter.getPlayersForEvent(eventId);
        console.log(`  - Retrieved ${players.length} players for ${eventName}`);
        
        // Get teams for this event using raw SQL adapter
        const teams = await this.rawSQLAdapter.getTeamsForEvent(eventId);
        console.log(`  - Retrieved ${teams.length} teams for ${eventName}`);
        
        // Update storage with fresh Supabase data
        this.storage.updateEventData(eventId, {
          players,
          teams,
          event: { id: eventId, name: eventName }
        });
      }
      
      this.lastRefreshTime = new Date();
      console.log(`Data refresh completed successfully using raw SQL adapter at ${this.lastRefreshTime.toISOString()}`);
    } catch (error) {
      console.error('Error during data refresh with raw SQL adapter:', error);
      // No CSV fallback - throw the error to indicate failure
      throw error;
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

  /**
   * Get the raw SQL adapter for direct database queries
   */
  public getRawSQLAdapter(): RawSQLAdapter {
    return this.rawSQLAdapter;
  }
}

export const dataRefreshManager = DataRefreshManager.getInstance();
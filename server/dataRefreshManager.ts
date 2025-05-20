import { supabaseStorage } from './supabase-storage';
import { testSupabaseConnection } from './supabase-db';

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
  
  private constructor() {
    // Private constructor to enforce singleton
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
    
    // Test Supabase connection
    await this.checkSupabaseConnection();
    
    // Perform initial refresh
    await this.refreshData();
    
    // Schedule regular refreshes
    this.refreshInterval = setInterval(() => {
      this.refreshData().catch(error => {
        console.error('Error during scheduled data refresh:', error);
      });
    }, this.refreshIntervalMs);
    
    console.log(`Data refresh manager started. Next refresh in ${this.refreshIntervalMs / (1000 * 60 * 60)} hours.`);
  }
  
  /**
   * Stop the data refresh scheduler
   */
  public stop(): void {
    if (this.refreshInterval) {
      clearInterval(this.refreshInterval);
      this.refreshInterval = null;
      console.log('Data refresh manager stopped.');
    }
  }
  
  /**
   * Test if Supabase connection is available
   */
  public async checkSupabaseConnection(): Promise<boolean> {
    try {
      this._isSupabaseAvailable = await testSupabaseConnection();
      
      if (this._isSupabaseAvailable) {
        console.log('Supabase connection is available.');
      } else {
        console.warn('Supabase connection is NOT available. Using fallback data sources.');
      }
      
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
    // Prevent concurrent refreshes
    if (this.isRefreshing) {
      console.log('Data refresh already in progress, skipping.');
      return;
    }
    
    try {
      this.isRefreshing = true;
      console.log('Starting data refresh...');
      
      // Check if Supabase is available
      if (!this._isSupabaseAvailable) {
        await this.checkSupabaseConnection();
      }
      
      // Refresh data through the storage interface
      await supabaseStorage.refreshData();
      
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
      console.warn(`Refresh interval too short (${intervalMs}ms). Setting to minimum 1 minute.`);
      intervalMs = 60000;
    }
    
    this.refreshIntervalMs = intervalMs;
    
    // Restart the interval timer if it's already running
    if (this.refreshInterval) {
      this.stop();
      this.refreshInterval = setInterval(() => {
        this.refreshData().catch(error => {
          console.error('Error during scheduled data refresh:', error);
        });
      }, this.refreshIntervalMs);
    }
    
    console.log(`Refresh interval set to ${this.refreshIntervalMs / (1000 * 60)} minutes.`);
  }
}

// Export singleton instance
export const dataRefreshManager = DataRefreshManager.getInstance();
import { SupabaseAdapter } from './supabase-adapter';
import { loadNewPlayerStats } from './newDataParser';
import { processPlayerStatsWithRoles } from './newPlayerAnalytics';
import { loadPlayerRoles } from './roleParser';
import { PlayerWithPIV, PlayerRawStats } from '@shared/schema';
import { testSupabaseConnection } from './supabase-db';

/**
 * Hybrid data loader that prioritizes Supabase but falls back to CSV
 */
export class HybridDataLoader {
  
  /**
   * Load player data from CSV (Supabase integration disabled per user request)
   */
  static async loadPlayerData(): Promise<PlayerWithPIV[]> {
    console.log('Loading data from CSV files (Supabase disabled)...');
    
    // Use CSV processing directly
    return await this.loadFromCSV();
  }
  
  /**
   * Load data from CSV files (original method)
   */
  static async loadFromCSV(): Promise<PlayerWithPIV[]> {
    console.log('Loading data from CSV files...');
    
    try {
      // Load raw player stats from CSV
      const rawPlayerStats = await loadNewPlayerStats();
      
      // Load player roles from CSV
      const roleMap = await loadPlayerRoles();
      
      // Process player stats with roles and calculate PIV
      const playersWithPIV = processPlayerStatsWithRoles(rawPlayerStats, roleMap);
      
      console.log(`Successfully processed ${playersWithPIV.length} players from CSV`);
      return playersWithPIV;
    } catch (error) {
      console.error('Error loading from CSV:', error);
      return [];
    }
  }
  
  /**
   * Check if Supabase has data
   */
  static async hasSupabaseData(): Promise<boolean> {
    try {
      const supaPlayerData = await SupabaseAdapter.fetchAllPlayersData();
      return supaPlayerData.length > 0;
    } catch (error) {
      return false;
    }
  }
}
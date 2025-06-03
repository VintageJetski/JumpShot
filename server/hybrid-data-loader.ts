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
   * Load player data from Supabase first, then CSV as fallback
   */
  static async loadPlayerData(): Promise<PlayerWithPIV[]> {
    console.log('Attempting to load data from Supabase...');
    
    // Test Supabase connection first
    const supabaseConnected = await testSupabaseConnection();
    
    if (supabaseConnected) {
      try {
        // Try to load data from Supabase
        const supaPlayerData = await SupabaseAdapter.fetchAllPlayersData();
        
        if (supaPlayerData.length > 0) {
          console.log(`Found ${supaPlayerData.length} players in Supabase`);
          
          // Convert Supabase data to PlayerRawStats format
          const rawStats: PlayerRawStats[] = supaPlayerData.map(playerData => 
            SupabaseAdapter.mapToPlayerRawStats(playerData)
          );
          
          // Load roles from CSV (we still need this for role assignments)
          const roleMap = await loadPlayerRoles();
          
          // Process with PIV calculations
          const playersWithPIV = processPlayerStatsWithRoles(rawStats, roleMap);
          
          console.log(`Successfully processed ${playersWithPIV.length} players from Supabase`);
          return playersWithPIV;
        } else {
          console.log('No players found in Supabase, falling back to CSV...');
        }
      } catch (error) {
        console.error('Error loading from Supabase, falling back to CSV:', error);
      }
    } else {
      console.log('Supabase connection failed, using CSV data...');
    }
    
    // Fallback to CSV processing
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
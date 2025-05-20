import { PlayerRawStats, PlayerWithPIV, TeamWithTIR } from '../shared/schema';
import { parseCSVData, loadPlayerData } from './csvParser';
import { parsePlayerStatsCSV, loadNewPlayerStats } from './newDataParser';
import * as fs from 'fs';
import * as path from 'path';
import { DirectSupabaseAdapter } from './direct-supabase-adapter';

/**
 * DirectSupabaseStorage class that fetches data directly from Supabase database
 * with CSV fallback if database connection fails
 */
export class DirectSupabaseStorage {
  private adapter: DirectSupabaseAdapter;
  private cachedPlayerData: Map<number, PlayerWithPIV[]> = new Map();
  private cachedTeamData: Map<number, TeamWithTIR[]> = new Map();
  private lastRefreshTime: Date | null = null;
  private supabaseAvailable: boolean = false;
  
  constructor() {
    this.adapter = new DirectSupabaseAdapter();
    this.checkConnection();
  }
  
  /**
   * Check if Supabase database connection is available
   */
  public async checkConnection(): Promise<boolean> {
    try {
      this.supabaseAvailable = await this.adapter.checkConnection();
      console.log(`Supabase connection: ${this.supabaseAvailable ? 'Available' : 'Unavailable'}`);
      
      if (this.supabaseAvailable) {
        this.lastRefreshTime = new Date();
      }
      
      return this.supabaseAvailable;
    } catch (error) {
      console.error('Error checking Supabase connection:', error);
      this.supabaseAvailable = false;
      return false;
    }
  }
  
  /**
   * Clear all cached data to force refresh on next request
   */
  public clearCache(): void {
    this.cachedPlayerData.clear();
    this.cachedTeamData.clear();
    console.log('Cache cleared');
  }
  
  /**
   * Get all available events
   */
  public async getEvents(): Promise<{ id: number; name: string }[]> {
    if (!this.supabaseAvailable) {
      await this.checkConnection();
    }
    
    if (this.supabaseAvailable) {
      try {
        return await this.adapter.getEvents();
      } catch (error) {
        console.error('Error getting events from Supabase:', error);
      }
    }
    
    // Fallback to default events if Supabase is unavailable
    return [
      { id: 1, name: 'IEM_Katowice_2025' }
    ];
  }
  
  /**
   * Get players with PIV values for a specific event
   */
  public async getPlayersWithPIV(eventId: number = 1): Promise<PlayerWithPIV[]> {
    if (!this.supabaseAvailable) {
      await this.checkConnection();
    }
    
    // Use cached data if available
    if (this.cachedPlayerData.has(eventId)) {
      return this.cachedPlayerData.get(eventId)!;
    }
    
    let playersWithPIV: PlayerWithPIV[] = [];
    
    if (this.supabaseAvailable) {
      try {
        console.log('Fetching players with PIV from Supabase...');
        playersWithPIV = await this.adapter.getPlayersWithPIV(eventId);
        
        if (playersWithPIV.length > 0) {
          // Cache the data
          this.cachedPlayerData.set(eventId, playersWithPIV);
          return playersWithPIV;
        }
      } catch (error) {
        console.error('Error getting players from Supabase:', error);
      }
    }
    
    // If Supabase is unavailable or returns no data, fall back to CSV
    console.log('Falling back to CSV data for players...');
    playersWithPIV = await this.loadPlayersFromCSV();
    
    // Cache the fallback data
    this.cachedPlayerData.set(eventId, playersWithPIV);
    return playersWithPIV;
  }
  
  /**
   * Get teams with TIR values for a specific event
   */
  public async getTeamsWithTIR(eventId: number = 1): Promise<TeamWithTIR[]> {
    if (!this.supabaseAvailable) {
      await this.checkConnection();
    }
    
    // Use cached data if available
    if (this.cachedTeamData.has(eventId)) {
      return this.cachedTeamData.get(eventId)!;
    }
    
    let teamsWithTIR: TeamWithTIR[] = [];
    
    if (this.supabaseAvailable) {
      try {
        console.log('Fetching teams with TIR from Supabase...');
        teamsWithTIR = await this.adapter.getTeamsWithTIR(eventId);
        
        if (teamsWithTIR.length > 0) {
          // Cache the data
          this.cachedTeamData.set(eventId, teamsWithTIR);
          return teamsWithTIR;
        }
      } catch (error) {
        console.error('Error getting teams from Supabase:', error);
      }
    }
    
    // If Supabase is unavailable or returns no data, fall back to CSV
    console.log('Falling back to CSV data for teams...');
    
    // Get players first since we need them to calculate team stats
    const players = await this.getPlayersWithPIV(eventId);
    
    // Group players by team
    const teamMap = new Map<string, PlayerWithPIV[]>();
    for (const player of players) {
      const teamName = player.teamName || '';
      if (!teamMap.has(teamName)) {
        teamMap.set(teamName, []);
      }
      teamMap.get(teamName)!.push(player);
    }
    
    // Generate team data from player information
    teamsWithTIR = Array.from(teamMap.entries()).map(([teamName, teamPlayers]) => {
      // Calculate average PIV
      const avgPIV = teamPlayers.reduce((sum, p) => sum + p.piv, 0) / teamPlayers.length;
      
      // Count role distribution
      const roleCount = {
        0: 0, // Support
        1: 0, // AWP
        2: 0, // Lurker 
        3: 0, // IGL
        4: 0  // Entry
      };
      
      for (const player of teamPlayers) {
        if (player.role !== undefined) {
          roleCount[player.role]++;
        }
        if (player.isIGL) {
          roleCount[3]++; // IGL count
        }
      }
      
      return {
        id: `${teamName}_${eventId}`,
        name: teamName,
        logo: '',
        players: teamPlayers.map(p => p.id),
        tir: avgPIV * 1.2, // TIR calculation based on PIV
        averagePIV: avgPIV,
        wins: 0, // Default values
        losses: 0,
        eventId,
        roleDistribution: roleCount,
        strengths: ["Balanced roster", "Good teamwork"],
        weaknesses: ["Needs more experience"]
      };
    });
    
    // Cache the fallback data
    this.cachedTeamData.set(eventId, teamsWithTIR);
    return teamsWithTIR;
  }
  
  /**
   * Get the last time data was refreshed
   */
  public getLastRefreshTime(): Date | null {
    return this.lastRefreshTime;
  }
  
  /**
   * Check if Supabase is available
   */
  public isSupabaseAvailable(): boolean {
    return this.supabaseAvailable;
  }
  
  /**
   * Load player data from CSV as a fallback
   */
  private async loadPlayersFromCSV(): Promise<PlayerWithPIV[]> {
    try {
      console.log('Loading players from CSV files...');
      
      // Let's use the existing processing from the storage module
      const storage = await import('./storage');
      
      if (storage && storage.getPlayerStats) {
        const players = await storage.getPlayerStats(1);
        return players;
      }
      
      // If the import fails, load directly from CSV
      return this.loadDirectlyFromCSV();
    } catch (error) {
      console.error('Error loading from storage module:', error);
      return this.loadDirectlyFromCSV();
    }
  }
  
  /**
   * Load directly from CSV files if storage module fails
   */
  private async loadDirectlyFromCSV(): Promise<PlayerWithPIV[]> {
    try {
      // Try the new CSV format first
      const csvPath = path.join(process.cwd(), 'attached_assets', 'CS Data Points (IEM_Katowice_2025) - player_stats (IEM_Katowice_2025).csv');
      
      if (fs.existsSync(csvPath)) {
        const playerStats = await loadNewPlayerStats();
        
        // Convert raw stats to PlayerWithPIV
        return playerStats.map(player => ({
          id: player.steamId,
          name: player.playerName,
          teamName: player.teamName,
          team_id: player.team_id || 0,
          role: 0, // Default to Support
          isIGL: false,
          piv: player.rating || 1.0,
          kd: player.kd_diff || (player.kills / Math.max(1, player.deaths)),
          rating: player.rating || 1.0,
          // Metrics
          metrics: {
            kills: player.kills,
            deaths: player.deaths,
            assists: player.assists,
            adr: player.adr,
            kast: player.kast,
            opening_success: player.opening_success,
            headshots: player.headshot_percent,
            clutches: player.clutches_won
          }
        }));
      }
      
      // Fall back to old CSV format
      const oldPlayerStats = await loadPlayerData();
      
      return oldPlayerStats.map(player => ({
        id: player.steamId,
        name: player.playerName,
        teamName: player.teamName,
        team_id: player.team_id || 0,
        role: 0, // Default to Support
        isIGL: false,
        piv: player.rating || 1.0,
        kd: player.kd_diff || (player.kills / Math.max(1, player.deaths)),
        rating: player.rating || 1.0,
        // Metrics
        metrics: {
          kills: player.kills,
          deaths: player.deaths,
          assists: player.assists,
          adr: player.adr,
          kast: player.kast,
          opening_success: player.opening_success,
          headshots: player.headshot_percent,
          clutches: player.clutches_won
        }
      }));
    } catch (error) {
      console.error('Error loading directly from CSV:', error);
      return [];
    }
  }
}

// Create and export singleton instance
export const directSupabaseStorage = new DirectSupabaseStorage();
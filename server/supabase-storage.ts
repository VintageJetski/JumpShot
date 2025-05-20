import { PlayerRawStats, PlayerWithPIV, PlayerRole, TeamWithTIR } from '../shared/schema';
import { parseCSVData, loadPlayerData } from './csvParser';
import { parsePlayerStatsCSV, loadNewPlayerStats } from './newDataParser';
import { processPlayerStats } from './playerAnalytics';
import { processPlayerStatsWithRoles } from './newPlayerAnalytics';
import * as fs from 'fs';
import * as path from 'path';
import { testDatabaseConnection } from './supabase-db';
import { SupabaseAdapter, TeamRawStats } from './final-supabase-adapter';

/**
 * SupabaseStorage class that fetches data from Supabase database
 * with CSV fallback if database connection fails
 */
export class SupabaseStorage {
  private supabaseAvailable: boolean = false;
  private adapter: SupabaseAdapter;
  private cachedPlayerData: Map<number, PlayerRawStats[]> = new Map();
  private cachedTeamData: Map<number, TeamRawStats[]> = new Map();
  
  constructor() {
    this.adapter = new SupabaseAdapter();
    this.checkConnection();
  }
  
  /**
   * Check if the Supabase database connection is available
   */
  public async checkConnection(): Promise<boolean> {
    try {
      this.supabaseAvailable = await testDatabaseConnection();
      console.log(`Supabase connection: ${this.supabaseAvailable ? 'Available' : 'Unavailable'}`);
      return this.supabaseAvailable;
    } catch (error) {
      console.error('Error checking Supabase connection:', error);
      this.supabaseAvailable = false;
      return false;
    }
  }
  
  /**
   * Get all available events
   * Since there's no events table, we'll simulate events for now
   */
  public async getEvents(): Promise<{ id: number, name: string }[]> {
    if (!this.supabaseAvailable) {
      await this.checkConnection();
    }
    
    if (this.supabaseAvailable) {
      try {
        // Since there's no events table, we'll simulate events for now
        return [{ id: 1, name: 'IEM_Katowice_2025' }];
      } catch (error) {
        console.error('Error getting events from Supabase:', error);
        return [{ id: 1, name: 'IEM_Katowice_2025' }];
      }
    }
    
    // Fallback to default event if Supabase is not available
    return [{ id: 1, name: 'IEM_Katowice_2025' }];
  }
  
  /**
   * Get players for a specific event with PIV calculations
   */
  public async getPlayersWithPIV(eventId: number = 1): Promise<PlayerWithPIV[]> {
    if (!this.supabaseAvailable) {
      await this.checkConnection();
    }
    
    let rawPlayerData: PlayerRawStats[] = [];
    
    if (this.supabaseAvailable) {
      try {
        console.log(`Fetching player data from Supabase...`);
        // Check if we have cached data
        if (this.cachedPlayerData.has(eventId)) {
          console.log('Using cached player data');
          rawPlayerData = this.cachedPlayerData.get(eventId)!;
        } else {
          // Fetch from Supabase
          rawPlayerData = await this.adapter.getPlayersForEvent(eventId);
          // Cache the data
          this.cachedPlayerData.set(eventId, rawPlayerData);
        }
        
        if (rawPlayerData.length === 0) {
          console.warn('No player data found in Supabase, falling back to CSV');
          rawPlayerData = await this.loadFromCSV();
        }
      } catch (error) {
        console.error('Error getting players from Supabase:', error);
        rawPlayerData = await this.loadFromCSV();
      }
    } else {
      console.log('Supabase not available, loading from CSV...');
      rawPlayerData = await this.loadFromCSV();
    }
    
    // Group players by team for role assignment
    const teamStatsMap = new Map<string, PlayerRawStats[]>();
    for (const player of rawPlayerData) {
      const teamKey = player.teamName || `team_${player.team_id}`;
      if (!teamStatsMap.has(teamKey)) {
        teamStatsMap.set(teamKey, []);
      }
      teamStatsMap.get(teamKey)!.push(player);
    }
    
    // Process player stats with PIV calculations
    let playersWithPIV: PlayerWithPIV[];
    
    try {
      // Use the basic processor as it's more resilient to missing data
      console.log('Processing player stats with PIV calculations...');
      playersWithPIV = processPlayerStats(rawPlayerData, teamStatsMap);
      
      // Enhance the PlayerWithPIV objects with teamName for UI display
      playersWithPIV = playersWithPIV.map(player => {
        const rawPlayer = rawPlayerData.find(p => p.steamId === player.id);
        if (rawPlayer) {
          // Extend the player object with teamName
          return {
            ...player,
            teamName: rawPlayer.teamName || '',
            team_id: rawPlayer.team_id || 0
          };
        }
        return player;
      });
    } catch (error) {
      console.error('Error processing player stats:', error);
      // Return empty array as fallback
      playersWithPIV = [];
    }
    
    return playersWithPIV;
  }
  
  /**
   * Get teams for a specific event with TIR calculations
   */
  public async getTeamsWithTIR(eventId: number = 1): Promise<TeamWithTIR[]> {
    if (!this.supabaseAvailable) {
      await this.checkConnection();
    }
    
    let teamData: TeamRawStats[] = [];
    let playersWithPIV: PlayerWithPIV[] = [];
    
    if (this.supabaseAvailable) {
      try {
        console.log(`Fetching team data from Supabase...`);
        // Check if we have cached data
        if (this.cachedTeamData.has(eventId)) {
          console.log('Using cached team data');
          teamData = this.cachedTeamData.get(eventId)!;
        } else {
          // Fetch from Supabase
          teamData = await this.adapter.getTeamsForEvent(eventId);
          // Cache the data
          this.cachedTeamData.set(eventId, teamData);
        }
        
        // Get players with PIV for this event
        playersWithPIV = await this.getPlayersWithPIV(eventId);
      } catch (error) {
        console.error('Error getting teams from Supabase:', error);
        // Use playerWithPIV data to construct teams
        playersWithPIV = await this.getPlayersWithPIV(eventId);
      }
    } else {
      console.log('Supabase not available, processing from player data...');
      playersWithPIV = await this.getPlayersWithPIV(eventId);
    }
    
    // Generate team data from player information if needed
    if (teamData.length === 0 && playersWithPIV.length > 0) {
      const teamMap = new Map<string, PlayerWithPIV[]>();
      
      // Group players by team
      for (const player of playersWithPIV) {
        const teamKey = player.teamName || `team_${player.team_id}`;
        if (!teamMap.has(teamKey)) {
          teamMap.set(teamKey, []);
        }
        teamMap.get(teamKey)!.push(player);
      }
      
      // Create team stats from the grouped players
      for (const [teamName, players] of teamMap.entries()) {
        teamData.push({
          name: teamName,
          players: players.length,
          logo: '',
          wins: 0,
          losses: 0,
          eventId
        });
      }
    }
    
    // Calculate TIR and roles distribution for each team
    const teamsWithTIR: TeamWithTIR[] = [];
    
    for (const team of teamData) {
      // Find players for this team
      const teamPlayers = playersWithPIV.filter(p => 
        p.teamName === team.name || 
        (!p.teamName && p.team_id === 
          parseInt(team.name.replace(/^team_/, ''), 10)
        )
      );
      
      if (teamPlayers.length === 0) {
        console.warn(`No players found for team ${team.name}`);
        continue;
      }
      
      // Calculate average PIV for the team
      const avgPIV = teamPlayers.reduce((sum, p) => sum + p.piv, 0) / teamPlayers.length;
      
      // Count role distribution
      const roleCount = {
        [PlayerRole.Entry]: 0,
        [PlayerRole.Lurker]: 0,
        [PlayerRole.Support]: 0,
        [PlayerRole.AWP]: 0,
        [PlayerRole.IGL]: 0
      };
      
      for (const player of teamPlayers) {
        if (player.primaryRole) {
          roleCount[player.primaryRole]++;
        } else {
          roleCount[PlayerRole.Support]++;
        }
        // Special case for IGL role
        if (player.isIGL) {
          roleCount[PlayerRole.IGL]++;
        }
      }
      
      // Calculate strengths and weaknesses
      const strengths = this.calculateTeamStrengths(teamPlayers);
      const weaknesses = this.calculateTeamWeaknesses(teamPlayers);
      
      // Create TIR object
      const teamWithTIR: TeamWithTIR = {
        id: `${team.name}_${team.eventId}`,
        name: team.name,
        logo: team.logo,
        players: teamPlayers.map(p => p.id),
        averagePIV: avgPIV,
        tir: avgPIV * 1.2, // TIR calculation can be improved
        wins: team.wins,
        losses: team.losses,
        roleDistribution: roleCount,
        strengths: strengths,
        weaknesses: weaknesses,
        eventId: team.eventId
      };
      
      teamsWithTIR.push(teamWithTIR);
    }
    
    return teamsWithTIR;
  }
  
  /**
   * Load player data from CSV as a fallback
   */
  private async loadFromCSV(): Promise<PlayerRawStats[]> {
    try {
      console.log('Loading data from CSV files...');
      // Try the new CSV format first
      const csvPath = path.join(process.cwd(), 'attached_assets', 'CS Data Points (IEM_Katowice_2025) - player_stats (IEM_Katowice_2025).csv');
      if (fs.existsSync(csvPath)) {
        return await loadNewPlayerStats();
      }
      
      // Fall back to old CSV format if new format isn't available
      return await loadPlayerData();
    } catch (error) {
      console.error('Error loading data from CSV:', error);
      return [];
    }
  }
  
  /**
   * Calculate team strengths based on player PIVs
   */
  private calculateTeamStrengths(players: PlayerWithPIV[]): string[] {
    const strengths: string[] = [];
    
    // Check if team has a strong AWPer
    const awpers = players.filter(p => p.primaryRole === PlayerRole.AWP);
    if (awpers.length > 0 && awpers.some(p => p.piv > 0.75)) {
      strengths.push("Strong AWP presence");
    }
    
    // Check for strong entry fraggers
    const entryFraggers = players.filter(p => p.primaryRole === PlayerRole.Entry);
    if (entryFraggers.length > 0 && entryFraggers.some(p => p.piv > 0.7)) {
      strengths.push("Powerful entry fraggers");
    }
    
    // Check for experienced IGL
    if (players.some(p => p.isIGL && p.piv > 0.65)) {
      strengths.push("Seasoned in-game leadership");
    }
    
    // Check for overall team consistency
    if (players.length > 0 && players.some(p => p.pivComponents && p.pivComponents.icf > 0.7)) {
      strengths.push("Consistent performance");
    }
    
    // Check for high kill potential
    if (players.length > 0 && players.some(p => p.stats && p.stats.kills > 140)) {
      strengths.push("High fragging power");
    }
    
    // Default strengths if none were found
    if (strengths.length === 0) {
      const avgPIV = players.reduce((sum, p) => sum + p.piv, 0) / Math.max(1, players.length);
      if (avgPIV > 0.7) {
        strengths.push("Strong individual performers");
      } else {
        strengths.push("Team-oriented playstyle");
      }
    }
    
    return strengths.slice(0, 3); // Return top 3 strengths
  }
  
  /**
   * Calculate team weaknesses based on player PIVs
   */
  private calculateTeamWeaknesses(players: PlayerWithPIV[]): string[] {
    const weaknesses: string[] = [];
    
    // Check for balanced role distribution
    const roleCount = {
      [PlayerRole.Entry]: players.filter(p => p.primaryRole === PlayerRole.Entry).length,
      [PlayerRole.Lurker]: players.filter(p => p.primaryRole === PlayerRole.Lurker).length,
      [PlayerRole.Support]: players.filter(p => p.primaryRole === PlayerRole.Support).length,
      [PlayerRole.AWP]: players.filter(p => p.primaryRole === PlayerRole.AWP).length
    };
    
    if (roleCount[PlayerRole.AWP] === 0) {
      weaknesses.push("No dedicated AWPer");
    }
    
    if (roleCount[PlayerRole.Entry] === 0) {
      weaknesses.push("Lacks entry fragging capability");
    }
    
    // Check for inconsistency
    if (players.length > 0 && players.every(p => !p.pivComponents || p.pivComponents.icf < 0.6)) {
      weaknesses.push("Inconsistent performance");
    }
    
    // Check for weak in-game leadership
    const igls = players.filter(p => p.isIGL);
    if (igls.length === 0) {
      weaknesses.push("No identified in-game leader");
    } else if (igls.every(p => p.piv < 0.6)) {
      weaknesses.push("Weak in-game leadership");
    }
    
    // Check for overall low PIV
    const avgPIV = players.reduce((sum, p) => sum + p.piv, 0) / Math.max(1, players.length);
    if (avgPIV < 0.65) {
      weaknesses.push("Below average individual performance");
    }
    
    // Default weaknesses if none were found
    if (weaknesses.length === 0) {
      weaknesses.push("Limited international experience");
    }
    
    return weaknesses.slice(0, 3); // Return top 3 weaknesses
  }
}

export const supabaseStorage = new SupabaseStorage();
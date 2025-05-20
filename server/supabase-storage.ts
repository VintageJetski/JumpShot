import { PlayerRawStats, PlayerWithPIV, PlayerRole, TeamWithTIR } from '../shared/schema';
import { parseCSVData, loadPlayerData } from './csvParser';
import { parsePlayerStatsCSV, loadNewPlayerStats } from './newDataParser';
import { processPlayerStats } from './playerAnalytics';
import { processPlayerStatsWithRoles } from './newPlayerAnalytics';
import * as fs from 'fs';
import * as path from 'path';
import { testDatabaseConnection, getAvailableEvents, getPlayerCountForEvent } from './supabase-db';
import { SupabaseAdapter, TeamRawStats } from './supabase-adapter-new';

/**
 * SupabaseStorage class that fetches data from Supabase database
 * with CSV fallback if database connection fails
 */
export class SupabaseStorage {
  private adapter: SupabaseAdapter;
  private isConnected: boolean = false;
  private availableEvents: number[] = [];
  private cachedPlayerStats: Map<number, PlayerRawStats[]> = new Map();
  private cachedTeamStats: Map<number, TeamRawStats[]> = new Map();
  private cachedPlayerPIV: Map<number, PlayerWithPIV[]> = new Map();
  private cachedTeamTIR: Map<number, TeamWithTIR[]> = new Map();
  private eventNames: Map<number, string> = new Map();
  
  constructor() {
    this.adapter = new SupabaseAdapter();
  }
  
  /**
   * Initialize the storage by testing database connection
   * and fetching available events
   */
  async initialize(): Promise<void> {
    try {
      console.log('Initializing Supabase storage...');
      this.isConnected = await testDatabaseConnection();
      
      if (this.isConnected) {
        console.log('Connected to Supabase database');
        await this.fetchAvailableEvents();
      } else {
        console.warn('Failed to connect to Supabase database, falling back to CSV data');
      }
    } catch (error) {
      console.error('Error initializing Supabase storage:', error);
      this.isConnected = false;
    }
  }
  
  /**
   * Fetch available events from database
   */
  private async fetchAvailableEvents(): Promise<void> {
    try {
      const events = await getAvailableEvents();
      if (events && events.length > 0) {
        this.availableEvents = events.map(event => event.eventId);
        events.forEach(event => this.eventNames.set(event.eventId, event.eventName));
        console.log(`Found ${events.length} events in database:`, events.map(e => e.eventName).join(', '));
      } else {
        console.warn('No events found in database');
      }
    } catch (error) {
      console.error('Error fetching available events:', error);
    }
  }
  
  /**
   * Get player stats from database for a specific event
   * @param eventId Event ID to fetch player stats for
   */
  async getPlayerStatsForEvent(eventId: number): Promise<PlayerRawStats[]> {
    // Check if we have cached data
    if (this.cachedPlayerStats.has(eventId)) {
      return this.cachedPlayerStats.get(eventId) || [];
    }
    
    // If connected to Supabase, fetch from database
    if (this.isConnected && this.availableEvents.includes(eventId)) {
      try {
        console.log(`Fetching player stats for event ${eventId} from Supabase...`);
        const playerCount = await getPlayerCountForEvent(eventId);
        console.log(`Found ${playerCount} players for event ${eventId}`);
        
        const playerStats = await this.adapter.getPlayersForEvent(eventId);
        
        if (playerStats && playerStats.length > 0) {
          console.log(`Successfully fetched ${playerStats.length} player stats from Supabase for event ${eventId}`);
          this.cachedPlayerStats.set(eventId, playerStats);
          return playerStats;
        } else {
          console.warn(`No player stats found in Supabase for event ${eventId}, falling back to CSV data`);
        }
      } catch (error) {
        console.error(`Error fetching player stats from Supabase for event ${eventId}:`, error);
        console.log('Falling back to CSV data');
      }
    }
    
    // Fall back to CSV data
    try {
      console.log('Loading player data from CSV...');
      const csvData = await this.loadCSVData();
      this.cachedPlayerStats.set(1, csvData); // Assume CSV data is for event 1 (IEM_Katowice_2025)
      return eventId === 1 ? csvData : [];
    } catch (error) {
      console.error('Error loading CSV data:', error);
      return [];
    }
  }
  
  /**
   * Get team stats from database for a specific event
   * @param eventId Event ID to fetch team stats for
   */
  async getTeamStatsForEvent(eventId: number): Promise<TeamRawStats[]> {
    // Check if we have cached data
    if (this.cachedTeamStats.has(eventId)) {
      return this.cachedTeamStats.get(eventId) || [];
    }
    
    // If connected to Supabase, fetch from database
    if (this.isConnected && this.availableEvents.includes(eventId)) {
      try {
        console.log(`Fetching team stats for event ${eventId} from Supabase...`);
        const teamStats = await this.adapter.getTeamsForEvent(eventId);
        
        if (teamStats && teamStats.length > 0) {
          console.log(`Successfully fetched ${teamStats.length} team stats from Supabase for event ${eventId}`);
          this.cachedTeamStats.set(eventId, teamStats);
          return teamStats;
        } else {
          console.warn(`No team stats found in Supabase for event ${eventId}, falling back to CSV data`);
        }
      } catch (error) {
        console.error(`Error fetching team stats from Supabase for event ${eventId}:`, error);
        console.log('Falling back to CSV data');
      }
    }
    
    // Fall back to calculating teams from player data (CSV fallback)
    return this.getTeamsFromPlayerStats(eventId);
  }
  
  /**
   * Calculate teams from player stats
   * @param eventId Event ID to calculate teams for
   */
  private async getTeamsFromPlayerStats(eventId: number): Promise<TeamRawStats[]> {
    try {
      const playerStats = await this.getPlayerStatsForEvent(eventId);
      if (!playerStats || playerStats.length === 0) {
        return [];
      }
      
      // Group players by team
      const teamMap = new Map<string, PlayerRawStats[]>();
      for (const player of playerStats) {
        if (player.team) {
          if (!teamMap.has(player.team)) {
            teamMap.set(player.team, []);
          }
          teamMap.get(player.team)?.push(player);
        }
      }
      
      // Create team stats
      const teamStats: TeamRawStats[] = [];
      for (const [teamName, players] of teamMap.entries()) {
        teamStats.push({
          name: teamName,
          players: players.length,
          logo: '',
          wins: 0,
          losses: 0,
          eventId
        });
      }
      
      this.cachedTeamStats.set(eventId, teamStats);
      return teamStats;
    } catch (error) {
      console.error(`Error calculating teams from player stats for event ${eventId}:`, error);
      return [];
    }
  }
  
  /**
   * Get player stats with PIV (Player Impact Value) for a specific event
   * @param eventId Event ID to fetch player stats with PIV for
   */
  async getPlayerStatsWithPIV(eventId: number): Promise<PlayerWithPIV[]> {
    // Check if we have cached data
    if (this.cachedPlayerPIV.has(eventId)) {
      return this.cachedPlayerPIV.get(eventId) || [];
    }
    
    try {
      // Get raw player stats first
      const playerStats = await this.getPlayerStatsForEvent(eventId);
      if (!playerStats || playerStats.length === 0) {
        return [];
      }
      
      // Group players by team for team stats
      const teamMap = new Map<string, PlayerRawStats[]>();
      for (const player of playerStats) {
        if (player.team) {
          if (!teamMap.has(player.team)) {
            teamMap.set(player.team, []);
          }
          teamMap.get(player.team)?.push(player);
        }
      }
      
      // Process player stats with PIV
      console.log(`Processing PIV for ${playerStats.length} players in event ${eventId}...`);
      let playersWithPIV: PlayerWithPIV[];
      
      if (eventId === 1) {
        // For IEM Katowice, we have role information
        playersWithPIV = processPlayerStatsWithRoles(playerStats, teamMap);
      } else {
        // For other events, use general role assignment
        playersWithPIV = processPlayerStats(playerStats, teamMap);
      }
      
      console.log(`Processed PIV for ${playersWithPIV.length} players`);
      this.cachedPlayerPIV.set(eventId, playersWithPIV);
      return playersWithPIV;
    } catch (error) {
      console.error(`Error processing player stats with PIV for event ${eventId}:`, error);
      return [];
    }
  }
  
  /**
   * Get team stats with TIR (Team Impact Rating) for a specific event
   * @param eventId Event ID to fetch team stats with TIR for
   */
  async getTeamStatsWithTIR(eventId: number): Promise<TeamWithTIR[]> {
    // Check if we have cached data
    if (this.cachedTeamTIR.has(eventId)) {
      return this.cachedTeamTIR.get(eventId) || [];
    }
    
    try {
      // Get players with PIV first
      const playersWithPIV = await this.getPlayerStatsWithPIV(eventId);
      if (!playersWithPIV || playersWithPIV.length === 0) {
        return [];
      }
      
      // Group players by team
      const teamMap = new Map<string, PlayerWithPIV[]>();
      for (const player of playersWithPIV) {
        if (player.stats.team) {
          if (!teamMap.has(player.stats.team)) {
            teamMap.set(player.stats.team, []);
          }
          teamMap.get(player.stats.team)?.push(player);
        }
      }
      
      // Calculate team TIR scores
      const teamsWithTIR: TeamWithTIR[] = [];
      
      for (const [teamName, players] of teamMap.entries()) {
        // Calculate average PIV for the team
        const totalPIV = players.reduce((sum, player) => sum + player.piv, 0);
        const avgPIV = totalPIV / players.length;
        
        // Calculate role balance score (better if each role is represented)
        const roles = new Set<PlayerRole>();
        players.forEach(player => {
          roles.add(player.stats.ct_role);
          roles.add(player.stats.t_role);
        });
        const roleBalanceScore = roles.size / 6; // 6 possible roles
        
        // Calculate synergy score based on complementary roles
        const hasIGL = players.some(player => player.stats.is_igl);
        const hasCTAWP = players.some(player => player.stats.ct_role === PlayerRole.AWPCT);
        const hasTAWP = players.some(player => player.stats.t_role === PlayerRole.AWPT);
        
        // Better synergy with IGL and balanced AWP roles
        let synergyScore = 0.5;
        if (hasIGL) synergyScore += 0.2;
        if (hasCTAWP && hasTAWP) synergyScore += 0.2;
        else if (hasCTAWP || hasTAWP) synergyScore += 0.1;
        
        // Team Impact Rating = Average PIV * Role Balance * Synergy Score
        const tir = avgPIV * roleBalanceScore * synergyScore;
        
        // Find team stats
        const teamStats = await this.getTeamStatsForEvent(eventId);
        const team = teamStats.find(t => t.name === teamName);
        
        if (team) {
          teamsWithTIR.push({
            ...team,
            avgPIV: avgPIV,
            roleBalance: roleBalanceScore,
            synergyScore: synergyScore,
            tir: tir,
            players: players.map(p => ({
              id: p.stats.name,
              name: p.stats.name,
              piv: p.piv,
              role: p.primaryRole
            }))
          });
        }
      }
      
      // Sort by TIR
      teamsWithTIR.sort((a, b) => b.tir - a.tir);
      
      this.cachedTeamTIR.set(eventId, teamsWithTIR);
      return teamsWithTIR;
    } catch (error) {
      console.error(`Error calculating team TIR for event ${eventId}:`, error);
      return [];
    }
  }
  
  /**
   * Get available events
   */
  getEvents(): { id: number; name: string }[] {
    const events: { id: number; name: string }[] = [];
    
    // Add database events
    for (const [id, name] of this.eventNames.entries()) {
      events.push({ id, name });
    }
    
    // If no database events, add CSV event
    if (events.length === 0) {
      events.push({ id: 1, name: 'IEM_Katowice_2025' });
    }
    
    return events;
  }
  
  /**
   * Load player data from CSV files (fallback method)
   */
  private async loadCSVData(): Promise<PlayerRawStats[]> {
    // Try new CSV format first
    try {
      const newPlayerStats = await loadNewPlayerStats();
      if (newPlayerStats && newPlayerStats.length > 0) {
        console.log(`Loaded ${newPlayerStats.length} players from new CSV format`);
        return newPlayerStats;
      }
    } catch (error) {
      console.error('Error loading new CSV format:', error);
    }
    
    // Fall back to old CSV format
    try {
      const oldPlayerStats = await loadPlayerData();
      console.log(`Loaded ${oldPlayerStats.length} players from old CSV format`);
      return oldPlayerStats;
    } catch (error) {
      console.error('Error loading old CSV format:', error);
      return [];
    }
  }
  
  /**
   * Check if database connection is available
   */
  isSupabaseConnected(): boolean {
    return this.isConnected;
  }
  
  /**
   * Get the number of available events
   */
  getEventCount(): number {
    return this.availableEvents.length;
  }
}
import { IStorage } from './storage';
import { 
  PlayerRawStats, 
  RoundData, 
  PlayerWithPIV, 
  TeamWithTIR,
  PlayerRole,
  TeamRoundMetrics,
  User,
  InsertUser,
  users
} from '@shared/schema';
import { SupabaseAdapter } from './supabase-adapter';
import { processPlayerStats } from './playerAnalytics';
import { evaluatePlayerRoles } from './playerRoles';
import { supaDb } from './supabase-db';
import { testSupabaseConnection } from './supabase-db';
import { eq } from 'drizzle-orm';
import { db } from './db';
import { loadNewPlayerStats, loadRoundData } from './csvParser';
import { loadPlayerRoles } from './roleParser';

/**
 * Implementation of the storage interface that uses Supabase as the primary data source
 * with fallback to CSV files
 */
export class SupabaseStorage implements IStorage {
  private cachedPlayerData: PlayerRawStats[] | null = null;
  private cachedPlayerWithPIVData: PlayerWithPIV[] | null = null;
  private cachedTeamData: TeamWithTIR[] | null = null;
  private cachedRoundData: RoundData[] | null = null;
  private roundMetricsCache: Map<string, TeamRoundMetrics> = new Map();
  private lastDataRefresh: Date | null = null;
  private refreshIntervalMs = 24 * 60 * 60 * 1000; // 24 hours
  
  private roleMap: Map<string, { isIGL: boolean; tRole: PlayerRole; ctRole: PlayerRole }> | null = null;
  
  constructor() {
    // Initialize with a first data load
    this.refreshData();
    
    // Schedule periodic refreshes
    setInterval(() => this.refreshData(), this.refreshIntervalMs);
  }
  
  /**
   * Refresh the data from Supabase
   */
  async refreshData(): Promise<void> {
    try {
      console.log('Refreshing data from Supabase...');
      const isConnected = await testSupabaseConnection();
      
      if (isConnected) {
        await this.loadFromSupabase();
      } else {
        console.warn('Supabase connection failed, falling back to CSV data');
        await this.loadFromCSV();
      }
      
      this.lastDataRefresh = new Date();
      console.log(`Data refresh completed at ${this.lastDataRefresh.toISOString()}`);
    } catch (error) {
      console.error('Error refreshing data:', error);
      // If we failed to refresh, try to load from CSV as a fallback
      if (!this.cachedPlayerData) {
        await this.loadFromCSV();
      }
    }
  }
  
  /**
   * Load data from Supabase database
   */
  private async loadFromSupabase(): Promise<void> {
    try {
      // Load player data from Supabase
      const playerDataList = await SupabaseAdapter.fetchAllPlayersData();
      this.cachedPlayerData = playerDataList.map(SupabaseAdapter.mapToPlayerRawStats);
      
      // Load role information from CSV (until available in Supabase)
      this.roleMap = await this.loadRoleInfo();
      
      // Process player stats to calculate PIV
      const teamStatsMap = this.getPlayerTeamsMap(this.cachedPlayerData);
      this.cachedPlayerWithPIVData = processPlayerStats(this.cachedPlayerData, teamStatsMap);
      
      // Transform into teams with TIR
      this.cachedTeamData = this.calculateTeamDataWithTIR();
      
      // Load round data - this may need a CSV fallback for now
      // Until we have the round data in Supabase with the right format
      this.cachedRoundData = await loadRoundData();
      
      console.log('Successfully loaded data from Supabase');
    } catch (error) {
      console.error('Error loading from Supabase:', error);
      throw error;
    }
  }
  
  /**
   * Fallback mechanism to load data from CSV files
   */
  private async loadFromCSV(): Promise<void> {
    console.log('Loading from CSV fallback...');
    try {
      // Load player data from CSV
      this.cachedPlayerData = await loadNewPlayerStats();
      
      // Load role information
      this.roleMap = await this.loadRoleInfo();
      
      // Process player stats to calculate PIV
      const teamStatsMap = this.getPlayerTeamsMap(this.cachedPlayerData);
      this.cachedPlayerWithPIVData = processPlayerStats(this.cachedPlayerData, teamStatsMap);
      
      // Transform into teams with TIR
      this.cachedTeamData = this.calculateTeamDataWithTIR();
      
      // Load round data
      this.cachedRoundData = await loadRoundData();
      
      console.log('Successfully loaded data from CSV');
    } catch (error) {
      console.error('Error loading from CSV:', error);
      throw error;
    }
  }
  
  /**
   * Load role information for players
   */
  private async loadRoleInfo(): Promise<Map<string, { isIGL: boolean; tRole: PlayerRole; ctRole: PlayerRole }>> {
    try {
      const roleInfoMap = new Map<string, { isIGL: boolean; tRole: PlayerRole; ctRole: PlayerRole }>();
      const roleMap = await loadPlayerRoles();
      
      for (const [name, info] of Object.entries(roleMap)) {
        roleInfoMap.set(name, {
          isIGL: info.isIGL,
          tRole: info.tRole,
          ctRole: info.ctRole
        });
      }
      
      return roleInfoMap;
    } catch (error) {
      console.error('Error loading role information:', error);
      return new Map();
    }
  }
  
  /**
   * Get players grouped by team
   */
  private getPlayerTeamsMap(players: PlayerRawStats[]): Map<string, PlayerRawStats[]> {
    const teamMap = new Map<string, PlayerRawStats[]>();
    
    for (const player of players) {
      if (!teamMap.has(player.teamName)) {
        teamMap.set(player.teamName, []);
      }
      
      teamMap.get(player.teamName)!.push(player);
    }
    
    return teamMap;
  }
  
  /**
   * Calculate team data with TIR metrics
   */
  private calculateTeamDataWithTIR(): TeamWithTIR[] {
    if (!this.cachedPlayerWithPIVData) return [];
    
    const teamMap = new Map<string, PlayerWithPIV[]>();
    
    // Group players by team
    for (const player of this.cachedPlayerWithPIVData) {
      if (!teamMap.has(player.team)) {
        teamMap.set(player.team, []);
      }
      teamMap.get(player.team)!.push(player);
    }
    
    // Calculate team metrics
    return Array.from(teamMap.entries()).map(([teamName, players]) => {
      // Calculate team metrics
      const sumPIV = players.reduce((sum, player) => sum + player.piv, 0);
      const avgPIV = sumPIV / players.length;
      
      // Find top player
      const topPlayer = players.reduce((highest, player) => 
        player.piv > highest.piv ? player : highest, 
        players[0]
      );
      
      // Calculate synergy factor 
      // This is a simplified version, should be enhanced with role-based synergy
      const roleBalance = this.calculateRoleBalance(players);
      const synergy = roleBalance * (Math.min(5, players.length) / 5);
      
      // Calculate team impact rating (TIR)
      const tir = avgPIV * (1 + synergy);
      
      // Generate team ID
      const id = `team-${teamName.toLowerCase().replace(/\s+/g, '-')}`;
      
      return {
        id,
        name: teamName,
        tir,
        sumPIV,
        synergy,
        avgPIV,
        topPlayer: {
          name: topPlayer.name,
          piv: topPlayer.piv
        },
        players
      };
    });
  }
  
  /**
   * Calculate role balance factor for a team
   */
  private calculateRoleBalance(players: PlayerWithPIV[]): number {
    // Count occurrences of each role
    const roleCounts = new Map<PlayerRole, number>();
    
    for (const player of players) {
      const role = player.role;
      roleCounts.set(role, (roleCounts.get(role) || 0) + 1);
    }
    
    // Check if we have at least one of each critical role
    const hasIGL = roleCounts.get(PlayerRole.IGL) && roleCounts.get(PlayerRole.IGL)! > 0;
    const hasAWP = roleCounts.get(PlayerRole.AWP) && roleCounts.get(PlayerRole.AWP)! > 0;
    const hasSpacetaker = roleCounts.get(PlayerRole.Spacetaker) && roleCounts.get(PlayerRole.Spacetaker)! > 0;
    const hasSupport = roleCounts.get(PlayerRole.Support) && roleCounts.get(PlayerRole.Support)! > 0;
    
    // Calculate a simple role balance score
    let balanceScore = 0.5;  // Default
    
    if (hasIGL) balanceScore += 0.1;
    if (hasAWP) balanceScore += 0.1;
    if (hasSpacetaker) balanceScore += 0.1;
    if (hasSupport) balanceScore += 0.1;
    
    // Penalize for multiple of the same role (except Support)
    for (const [role, count] of Array.from(roleCounts.entries())) {
      if (role !== PlayerRole.Support && count > 1) {
        balanceScore -= 0.05 * (count - 1);
      }
    }
    
    return Math.max(0.3, Math.min(balanceScore, 1.0));
  }
  
  /**
   * Calculate team round metrics based on round data
   */
  private calculateTeamRoundMetrics(teamName: string, rounds: RoundData[]): TeamRoundMetrics {
    // Filter rounds for this team
    const teamRounds = rounds.filter(round => 
      round.ctTeam === teamName || round.tTeam === teamName
    );
    
    if (teamRounds.length === 0) {
      return {
        id: `team-${teamName.toLowerCase().replace(/\s+/g, '-')}`,
        name: teamName,
        econEfficiencyRatio: 0,
        forceRoundWinRate: 0,
        ecoRoundWinRate: 0,
        fullBuyWinRate: 0,
        economicRecoveryIndex: 0,
        aPreference: 0.5,
        bPreference: 0.5,
        bombPlantRate: 0,
        postPlantWinRate: 0,
        retakeSuccessRate: 0,
        pistolRoundWinRate: 0,
        followUpRoundWinRate: 0,
        comebackFactor: 0,
        closingFactor: 0,
        mapPerformance: {}
      };
    }
    
    // Extract CT and T side rounds
    const ctRounds = teamRounds.filter(round => round.ctTeam === teamName);
    const tRounds = teamRounds.filter(round => round.tTeam === teamName);
    
    // Calculate basic round win rates
    const ctWins = ctRounds.filter(round => round.winner === 'ct' && round.winnerTeam === teamName).length;
    const tWins = tRounds.filter(round => round.winner === 't' && round.winnerTeam === teamName).length;
    
    const ctWinRate = ctRounds.length > 0 ? ctWins / ctRounds.length : 0;
    const tWinRate = tRounds.length > 0 ? tWins / tRounds.length : 0;
    
    // Calculate economy metrics
    const ecoRounds = teamRounds.filter(round => {
      const buyType = round.ctTeam === teamName ? round.ctBuyType : round.tBuyType;
      return buyType === 'Eco';
    });
    
    const forceRounds = teamRounds.filter(round => {
      const buyType = round.ctTeam === teamName ? round.ctBuyType : round.tBuyType;
      return buyType === 'Semi-Buy';
    });
    
    const fullBuyRounds = teamRounds.filter(round => {
      const buyType = round.ctTeam === teamName ? round.ctBuyType : round.tBuyType;
      return buyType === 'Full Buy';
    });
    
    const ecoWins = ecoRounds.filter(round => round.winnerTeam === teamName).length;
    const forceWins = forceRounds.filter(round => round.winnerTeam === teamName).length;
    const fullBuyWins = fullBuyRounds.filter(round => round.winnerTeam === teamName).length;
    
    const ecoRoundWinRate = ecoRounds.length > 0 ? ecoWins / ecoRounds.length : 0;
    const forceRoundWinRate = forceRounds.length > 0 ? forceWins / forceRounds.length : 0;
    const fullBuyWinRate = fullBuyRounds.length > 0 ? fullBuyWins / fullBuyRounds.length : 0;
    
    // Calculate site preference (T side)
    const aPlants = tRounds.filter(round => round.bombSite === 'bombsite_a').length;
    const bPlants = tRounds.filter(round => round.bombSite === 'bombsite_b').length;
    const totalPlants = aPlants + bPlants;
    
    const aPreference = totalPlants > 0 ? aPlants / totalPlants : 0.5;
    const bPreference = totalPlants > 0 ? bPlants / totalPlants : 0.5;
    
    // Calculate bomb plant and retake metrics
    const tRoundsWithPlant = tRounds.filter(round => round.bombPlant).length;
    const bombPlantRate = tRounds.length > 0 ? tRoundsWithPlant / tRounds.length : 0;
    
    const tRoundsWithPlantWin = tRounds.filter(round => round.bombPlant && round.winnerTeam === teamName).length;
    const postPlantWinRate = tRoundsWithPlant > 0 ? tRoundsWithPlantWin / tRoundsWithPlant : 0;
    
    const ctRoundsWithPlant = ctRounds.filter(round => round.bombPlant).length;
    const ctRoundsWithPlantWin = ctRounds.filter(round => round.bombPlant && round.winnerTeam === teamName).length;
    const retakeSuccessRate = ctRoundsWithPlant > 0 ? ctRoundsWithPlantWin / ctRoundsWithPlant : 0;
    
    // Organize map data
    const maps = new Set(teamRounds.map(round => round.map));
    const mapPerformance: Record<string, any> = {};
    
    for (const map of maps) {
      const mapRounds = teamRounds.filter(round => round.map === map);
      const mapCtRounds = mapRounds.filter(round => round.ctTeam === teamName);
      const mapTRounds = mapRounds.filter(round => round.tTeam === teamName);
      
      const mapCtWins = mapCtRounds.filter(round => round.winner === 'ct' && round.winnerTeam === teamName).length;
      const mapTWins = mapTRounds.filter(round => round.winner === 't' && round.winnerTeam === teamName).length;
      
      const mapCtWinRate = mapCtRounds.length > 0 ? mapCtWins / mapCtRounds.length : 0;
      const mapTWinRate = mapTRounds.length > 0 ? mapTWins / mapTRounds.length : 0;
      
      const mapAPlants = mapTRounds.filter(round => round.bombSite === 'bombsite_a').length;
      const mapBPlants = mapTRounds.filter(round => round.bombSite === 'bombsite_b').length;
      const mapTotalPlants = mapAPlants + mapBPlants;
      
      mapPerformance[map] = {
        ctWinRate: mapCtWinRate,
        tWinRate: mapTWinRate,
        bombsitesPreference: {
          a: mapTotalPlants > 0 ? mapAPlants / mapTotalPlants : 0.5,
          b: mapTotalPlants > 0 ? mapBPlants / mapTotalPlants : 0.5
        }
      };
    }
    
    // Create team ID from name
    const id = `team-${teamName.toLowerCase().replace(/\s+/g, '-')}`;
    
    return {
      id,
      name: teamName,
      
      // Economy metrics
      econEfficiencyRatio: (ecoRoundWinRate * 3 + forceRoundWinRate * 2 + fullBuyWinRate) / 6,
      forceRoundWinRate,
      ecoRoundWinRate,
      fullBuyWinRate,
      economicRecoveryIndex: 0.5, // Would need round by round analysis to calculate properly
      
      // Strategic metrics
      aPreference,
      bPreference,
      bombPlantRate,
      postPlantWinRate,
      retakeSuccessRate,
      
      // Momentum metrics
      pistolRoundWinRate: 0.5, // Need to identify pistol rounds
      followUpRoundWinRate: 0.5, // Need round by round analysis
      comebackFactor: 0.5, // Need more detailed round analysis
      closingFactor: 0.5, // Need detailed advantage data
      
      // Map-specific metrics
      mapPerformance
    };
  }
  
  // IStorage interface implementation
  
  /**
   * Get all players with their calculated PIV
   */
  async getAllPlayers(): Promise<PlayerWithPIV[]> {
    if (!this.cachedPlayerWithPIVData) {
      await this.refreshData();
    }
    return this.cachedPlayerWithPIVData || [];
  }
  
  /**
   * Get a player by ID
   */
  async getPlayerById(id: string): Promise<PlayerWithPIV | undefined> {
    if (!this.cachedPlayerWithPIVData) {
      await this.refreshData();
    }
    
    return this.cachedPlayerWithPIVData?.find(p => p.id === id);
  }
  
  /**
   * Get players by role
   */
  async getPlayersByRole(role: string): Promise<PlayerWithPIV[]> {
    if (!this.cachedPlayerWithPIVData) {
      await this.refreshData();
    }
    
    return (this.cachedPlayerWithPIVData || []).filter(p => 
      p.role === role || p.secondaryRole === role || p.tRole === role || p.ctRole === role
    );
  }
  
  /**
   * Get all teams with their calculated TIR
   */
  async getAllTeams(): Promise<TeamWithTIR[]> {
    if (!this.cachedTeamData) {
      await this.refreshData();
    }
    return this.cachedTeamData || [];
  }
  
  /**
   * Get a team by name
   */
  async getTeamByName(name: string): Promise<TeamWithTIR | undefined> {
    if (!this.cachedTeamData) {
      await this.refreshData();
    }
    
    return this.cachedTeamData?.find(t => t.name === name);
  }
  
  /**
   * Get detailed team round metrics
   */
  async getTeamRoundMetrics(teamId: string): Promise<TeamRoundMetrics | undefined> {
    // Check cache first
    const cachedMetrics = this.roundMetricsCache.get(teamId);
    if (cachedMetrics) {
      return cachedMetrics;
    }
    
    // Get team name from ID
    const team = await this.getTeamById(teamId);
    if (!team) return undefined;
    
    // Get rounds for this team
    if (!this.cachedRoundData) {
      await this.refreshData();
    }
    
    const rounds = (this.cachedRoundData || []).filter(round => 
      round.ctTeam === team.name || round.tTeam === team.name
    );
    
    // Calculate and cache metrics
    const metrics = this.calculateTeamRoundMetrics(team.name, rounds);
    this.roundMetricsCache.set(teamId, metrics);
    
    return metrics;
  }
  
  /**
   * Set team round metrics
   */
  async setTeamRoundMetrics(metrics: TeamRoundMetrics): Promise<void> {
    this.roundMetricsCache.set(metrics.id, metrics);
  }
  
  /**
   * Set players data (update cache)
   */
  async setPlayers(players: PlayerWithPIV[]): Promise<void> {
    this.cachedPlayerWithPIVData = players;
  }
  
  /**
   * Set teams data (update cache)
   */
  async setTeams(teams: TeamWithTIR[]): Promise<void> {
    this.cachedTeamData = teams;
  }
  
  /**
   * Get all player statistics
   */
  async getAllPlayerStats(): Promise<PlayerRawStats[]> {
    if (!this.cachedPlayerData) {
      await this.refreshData();
    }
    return this.cachedPlayerData || [];
  }
  
  /**
   * Get all rounds
   */
  async getAllRounds(): Promise<RoundData[]> {
    if (!this.cachedRoundData) {
      await this.refreshData();
    }
    return this.cachedRoundData || [];
  }
  
  /**
   * Get rounds for a specific team
   */
  async getRoundsByTeam(teamName: string): Promise<RoundData[]> {
    if (!this.cachedRoundData) {
      await this.refreshData();
    }
    
    return (this.cachedRoundData || []).filter(round => 
      round.ctTeam === teamName || round.tTeam === teamName
    );
  }
  
  /**
   * Get a user by username (for authentication)
   */
  async getUserByUsername(username: string): Promise<User | undefined> {
    try {
      const [user] = await db.select().from(users).where(eq(users.username, username));
      return user;
    } catch (error) {
      console.error(`Error getting user by username ${username}:`, error);
      return undefined;
    }
  }
  
  /**
   * Get a user by ID (for authentication)
   */
  async getUser(id: number): Promise<User | undefined> {
    try {
      const [user] = await db.select().from(users).where(eq(users.id, id));
      return user;
    } catch (error) {
      console.error(`Error getting user by ID ${id}:`, error);
      return undefined;
    }
  }
  
  /**
   * Create a new user (for authentication)
   */
  async createUser(userData: InsertUser): Promise<User> {
    try {
      const [user] = await db
        .insert(users)
        .values(userData)
        .returning();
      return user;
    } catch (error) {
      console.error(`Error creating user ${userData.username}:`, error);
      throw error;
    }
  }
  
  /**
   * Check if data needs to be refreshed
   */
  needsRefresh(): boolean {
    if (!this.lastDataRefresh) return true;
    
    const now = new Date();
    const timeSinceLastRefresh = now.getTime() - this.lastDataRefresh.getTime();
    
    return timeSinceLastRefresh > this.refreshIntervalMs;
  }
  
  /**
   * Get the timestamp of the last data refresh
   */
  getLastRefreshTime(): Date | null {
    return this.lastDataRefresh;
  }
}

// Create and export a singleton instance
export const supabaseStorage = new SupabaseStorage();
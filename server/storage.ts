import { 
  PlayerWithPIV, 
  TeamWithTIR, 
  PlayerRole,
  TeamRoundMetrics
} from "@shared/schema";
import { XYZPlayerData, PositionalMetrics } from "./xyzDataParser";

// Storage interface for the application
export interface IStorage {
  // Player and team management
  getAllPlayers(): Promise<PlayerWithPIV[]>;
  getPlayerById(id: string): Promise<PlayerWithPIV | undefined>;
  getPlayersByRole(role: string): Promise<PlayerWithPIV[]>;
  
  getAllTeams(): Promise<TeamWithTIR[]>;
  getTeamByName(name: string): Promise<TeamWithTIR | undefined>;
  
  // Round data methods
  getTeamRoundMetrics(teamName: string): Promise<TeamRoundMetrics | undefined>;
  setTeamRoundMetrics(metrics: TeamRoundMetrics): Promise<void>;
  
  // Storage update methods
  setPlayers(players: PlayerWithPIV[]): Promise<void>;
  setTeams(teams: TeamWithTIR[]): Promise<void>;
  
  // XYZ Positional Data methods
  getXYZData(): Promise<XYZPlayerData[]>;
  getPositionalMetrics(): Promise<PositionalMetrics[]>;
  getPlayerXYZData(steamId: string): Promise<XYZPlayerData[]>;
  getRoundXYZData(roundNum: number): Promise<XYZPlayerData[]>;
  setXYZData(data: XYZPlayerData[]): Promise<void>;
  setPositionalMetrics(metrics: PositionalMetrics[]): Promise<void>;
  
  // Data initialization
  initializeData(): Promise<void>;
}

/**
 * In-memory storage implementation that loads data from CSV files
 */
export class MemoryStorage implements IStorage {
  private playersCache: Map<string, PlayerWithPIV>;
  private teamsCache: Map<string, TeamWithTIR>;
  private roundMetricsCache: Map<string, TeamRoundMetrics>;
  private xyzDataCache: XYZPlayerData[];
  private positionalMetricsCache: PositionalMetrics[];

  constructor() {
    this.playersCache = new Map();
    this.teamsCache = new Map();
    this.roundMetricsCache = new Map();
    this.xyzDataCache = [];
    this.positionalMetricsCache = [];
  }

  async getAllPlayers(): Promise<PlayerWithPIV[]> {
    return Array.from(this.playersCache.values());
  }

  async getPlayerById(id: string): Promise<PlayerWithPIV | undefined> {
    return this.playersCache.get(id);
  }

  async getPlayersByRole(role: string): Promise<PlayerWithPIV[]> {
    const allPlayers = Array.from(this.playersCache.values());
    return allPlayers.filter(player => player.role === role);
  }

  async getAllTeams(): Promise<TeamWithTIR[]> {
    return Array.from(this.teamsCache.values());
  }

  async getTeamByName(name: string): Promise<TeamWithTIR | undefined> {
    return this.teamsCache.get(name);
  }

  async setPlayers(players: PlayerWithPIV[]): Promise<void> {
    this.playersCache.clear();
    players.forEach(player => {
      this.playersCache.set(player.id, player);
    });
  }

  async setTeams(teamsData: TeamWithTIR[]): Promise<void> {
    this.teamsCache.clear();
    teamsData.forEach(team => {
      this.teamsCache.set(team.name, team);
    });
  }

  async getTeamRoundMetrics(teamName: string): Promise<TeamRoundMetrics | undefined> {
    return this.roundMetricsCache.get(teamName);
  }

  async setTeamRoundMetrics(metrics: TeamRoundMetrics): Promise<void> {
    this.roundMetricsCache.set(metrics.team, metrics);
  }

  // XYZ Positional Data methods implementation
  async getXYZData(): Promise<XYZPlayerData[]> {
    return this.xyzDataCache;
  }

  async getPositionalMetrics(): Promise<PositionalMetrics[]> {
    return this.positionalMetricsCache;
  }

  async getPlayerXYZData(steamId: string): Promise<XYZPlayerData[]> {
    return this.xyzDataCache.filter(data => data.userSteamid === steamId);
  }

  async getRoundXYZData(roundNum: number): Promise<XYZPlayerData[]> {
    return this.xyzDataCache.filter(data => data.roundNum === roundNum);
  }

  async setXYZData(data: XYZPlayerData[]): Promise<void> {
    this.xyzDataCache = data;
  }

  async setPositionalMetrics(metrics: PositionalMetrics[]): Promise<void> {
    this.positionalMetricsCache = metrics;
  }

  // Initialize data by loading from CSV files
  async initializeData(): Promise<void> {
    const { loadNewPlayerStats } = await import("./newDataParser");
    const { loadPlayerRoles } = await import("./roleParser");
    const { processPlayerStatsWithRoles } = await import("./newPlayerAnalytics");
    const { processRoundData } = await import("./roundAnalytics");

    try {
      // Load player stats and roles
      const rawStats = await loadNewPlayerStats();
      const roleMap = await loadPlayerRoles();
      
      // Process players with role assignments
      const processedPlayers = processPlayerStatsWithRoles(rawStats, roleMap);
      await this.setPlayers(processedPlayers);

      // Generate teams from processed players
      const teamMap = new Map<string, TeamWithTIR>();
      processedPlayers.forEach(player => {
        if (!teamMap.has(player.team)) {
          const teamPlayers = processedPlayers.filter(p => p.team === player.team);
          const avgPIV = teamPlayers.reduce((sum, p) => sum + p.piv, 0) / teamPlayers.length;
          teamMap.set(player.team, {
            name: player.team,
            players: teamPlayers,
            tir: avgPIV // Team Impact Rating based on average PIV
          });
        }
      });
      await this.setTeams(Array.from(teamMap.values()));

      // Load round metrics
      const roundMetrics = await processRoundData();
      roundMetrics.forEach((metrics, teamName) => {
        this.roundMetricsCache.set(teamName, metrics);
      });

      console.log(`Loaded ${rawStats.length} raw player records`);
      console.log(`Processed ${processedPlayers.length} players and ${teamMap.size} teams`);
    } catch (error) {
      console.error("Failed to initialize data:", error);
      throw error;
    }
  }
}

export const storage = new MemoryStorage();
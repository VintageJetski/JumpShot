import { 
  PlayerWithPIV, 
  TeamWithTIR, 
  PlayerRole,
  TeamRoundMetrics
} from "@shared/schema";

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
}

/**
 * In-memory storage implementation that loads data from CSV files
 */
export class MemoryStorage implements IStorage {
  private playersCache: Map<string, PlayerWithPIV>;
  private teamsCache: Map<string, TeamWithTIR>;
  private roundMetricsCache: Map<string, TeamRoundMetrics>;

  constructor() {
    this.playersCache = new Map();
    this.teamsCache = new Map();
    this.roundMetricsCache = new Map();
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
    this.roundMetricsCache.set(metrics.teamName, metrics);
  }
}

export const storage = new MemoryStorage();
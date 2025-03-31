import { 
  PlayerWithPIV, 
  TeamWithTIR, 
  PlayerRawStats,
  PlayerMetrics, 
  User, 
  InsertUser 
} from "@shared/schema";

// Storage interface for the application
export interface IStorage {
  // User management (from template)
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  
  // Player and team management
  getAllPlayers(): Promise<PlayerWithPIV[]>;
  getPlayerById(id: string): Promise<PlayerWithPIV | undefined>;
  getPlayersByRole(role: string): Promise<PlayerWithPIV[]>;
  
  getAllTeams(): Promise<TeamWithTIR[]>;
  getTeamByName(name: string): Promise<TeamWithTIR | undefined>;
  
  // Storage update methods
  setPlayers(players: PlayerWithPIV[]): Promise<void>;
  setTeams(teams: TeamWithTIR[]): Promise<void>;
}

export class MemStorage implements IStorage {
  private users: Map<number, User>;
  private players: Map<string, PlayerWithPIV>;
  private teams: Map<string, TeamWithTIR>;
  currentId: number;

  constructor() {
    this.users = new Map();
    this.players = new Map();
    this.teams = new Map();
    this.currentId = 1;
  }

  // User methods (from template)
  async getUser(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.username === username,
    );
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = this.currentId++;
    const user: User = { ...insertUser, id };
    this.users.set(id, user);
    return user;
  }

  // Player methods
  async getAllPlayers(): Promise<PlayerWithPIV[]> {
    return Array.from(this.players.values());
  }

  async getPlayerById(id: string): Promise<PlayerWithPIV | undefined> {
    return this.players.get(id);
  }

  async getPlayersByRole(role: string): Promise<PlayerWithPIV[]> {
    return Array.from(this.players.values()).filter(
      (player) => player.role === role
    );
  }

  // Team methods
  async getAllTeams(): Promise<TeamWithTIR[]> {
    return Array.from(this.teams.values());
  }

  async getTeamByName(name: string): Promise<TeamWithTIR | undefined> {
    return this.teams.get(name);
  }

  // Storage update methods
  async setPlayers(players: PlayerWithPIV[]): Promise<void> {
    this.players.clear();
    for (const player of players) {
      this.players.set(player.id, player);
    }
  }

  async setTeams(teams: TeamWithTIR[]): Promise<void> {
    this.teams.clear();
    for (const team of teams) {
      this.teams.set(team.name, team);
    }
  }
}

export const storage = new MemStorage();

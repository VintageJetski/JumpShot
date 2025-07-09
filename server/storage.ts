import { 
  PlayerWithPIV, 
  TeamWithTIR, 
  PlayerRole,
  TeamRoundMetrics,
  xyzPositionalData,
  analyticsCache,
  InsertXYZData,
  InsertAnalyticsCache
} from "@shared/schema";
import { XYZPlayerData, PositionalMetrics } from "./xyzDataParser";
import { eq, sql } from "drizzle-orm";

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
  
  // Database persistence methods
  loadXYZDataFromDB(): Promise<XYZPlayerData[]>;
  saveXYZDataToDB(data: XYZPlayerData[]): Promise<void>;
  getCachedAnalytics(key: string): Promise<any>;
  setCachedAnalytics(key: string, data: any, expiresInHours?: number): Promise<void>;
  
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
    // Try cache first, then database, then CSV load
    if (this.xyzDataCache.length > 0) {
      return this.xyzDataCache;
    }
    
    // Try loading from database
    const dbData = await this.loadXYZDataFromDB();
    if (dbData.length > 0) {
      this.xyzDataCache = dbData;
      return dbData;
    }
    
    // Fallback to CSV loading (one-time setup)
    await this.loadXYZDataFromCSV();
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
    // Persist to database for future loads
    await this.saveXYZDataToDB(data);
  }

  async setPositionalMetrics(metrics: PositionalMetrics[]): Promise<void> {
    this.positionalMetricsCache = metrics;
  }

  // Database persistence methods
  async loadXYZDataFromDB(): Promise<XYZPlayerData[]> {
    try {
      const { db } = await import("./db");
      const rows = await db.select().from(xyzPositionalData).limit(100000);
      return rows.map(row => ({
        health: row.health,
        flash_duration: row.flashDuration,
        armor: row.armor,
        side: row.side as 't' | 'ct',
        pitch: row.pitch,
        X: row.x,
        yaw: row.yaw,
        Y: row.y,
        velocity_X: row.velocityX,
        Z: row.z,
        velocity_Y: row.velocityY,
        velocity_Z: row.velocityZ,
        tick: row.tick,
        user_steamid: row.userSteamid,
        name: row.name,
        round_num: row.roundNum,
        place: row.place || undefined
      }));
    } catch (error) {
      console.log('No XYZ data in database yet, will load from CSV');
      return [];
    }
  }

  async saveXYZDataToDB(data: XYZPlayerData[]): Promise<void> {
    try {
      const { db } = await import("./db");
      // Check if data already exists
      const existingCount = await db.select({ count: sql<number>`count(*)` }).from(xyzPositionalData);
      if (existingCount[0]?.count > 0) {
        console.log('XYZ data already exists in database, skipping insert');
        return;
      }

      console.log(`Saving ${data.length} XYZ records to database...`);
      
      // Insert in batches for better performance
      const batchSize = 1000;
      for (let i = 0; i < data.length; i += batchSize) {
        const batch = data.slice(i, i + batchSize);
        const insertData: InsertXYZData[] = batch.map(record => ({
          health: record.health,
          flashDuration: record.flash_duration,
          armor: record.armor,
          side: record.side,
          pitch: record.pitch,
          x: record.X,
          yaw: record.yaw,
          y: record.Y,
          velocityX: record.velocity_X,
          z: record.Z,
          velocityY: record.velocity_Y,
          velocityZ: record.velocity_Z,
          tick: record.tick,
          userSteamid: record.user_steamid,
          name: record.name,
          roundNum: record.round_num,
          place: record.place
        }));
        
        await db.insert(xyzPositionalData).values(insertData);
        console.log(`Saved batch ${Math.floor(i/batchSize) + 1}/${Math.ceil(data.length/batchSize)}`);
      }
      
      console.log('XYZ data successfully saved to database');
    } catch (error) {
      console.error('Failed to save XYZ data to database:', error);
    }
  }

  async getCachedAnalytics(key: string): Promise<any> {
    try {
      const { db } = await import("./db");
      const result = await db.select()
        .from(analyticsCache)
        .where(eq(analyticsCache.cacheKey, key))
        .limit(1);
      
      if (result.length > 0 && new Date() < result[0].expiresAt) {
        return result[0].data;
      }
      return null;
    } catch (error) {
      console.error('Error reading analytics cache:', error);
      return null;
    }
  }

  async setCachedAnalytics(key: string, data: any, expiresInHours: number = 24): Promise<void> {
    try {
      const { db } = await import("./db");
      const expiresAt = new Date();
      expiresAt.setHours(expiresAt.getHours() + expiresInHours);
      
      await db.insert(analyticsCache)
        .values({
          cacheKey: key,
          data,
          expiresAt
        })
        .onConflictDoUpdate({
          target: analyticsCache.cacheKey,
          set: { data, expiresAt }
        });
    } catch (error) {
      console.error('Error saving analytics cache:', error);
    }
  }

  async loadXYZDataFromCSV(): Promise<void> {
    try {
      const { loadXYZData } = await import("./xyzDataParser");
      console.log('Loading XYZ data from CSV (one-time setup)...');
      const data = await loadXYZData();
      this.xyzDataCache = data;
      
      // Save to database for future loads
      await this.saveXYZDataToDB(data);
    } catch (error) {
      console.error('Failed to load XYZ data from CSV:', error);
      this.xyzDataCache = [];
    }
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
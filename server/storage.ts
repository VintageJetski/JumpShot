import { 
  PlayerWithPIV, 
  TeamWithTIR, 
  PlayerRawStats,
  PlayerMetrics, 
  User, 
  InsertUser,
  playerStats,
  users,
  teams,
  PlayerRole,
  TeamRoundMetrics
} from "@shared/schema";
import { db } from "./db";
import { eq, sql } from "drizzle-orm";

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
  
  // Round data methods
  getTeamRoundMetrics(teamName: string): Promise<TeamRoundMetrics | undefined>;
  setTeamRoundMetrics(metrics: TeamRoundMetrics): Promise<void>;
  
  // Storage update methods
  setPlayers(players: PlayerWithPIV[]): Promise<void>;
  setTeams(teams: TeamWithTIR[]): Promise<void>;
}

/**
 * Hybrid storage implementation for players and teams data
 * We use the database for basic stats and in-memory caching for complex objects
 */
export class HybridStorage implements IStorage {
  private playersCache: Map<string, PlayerWithPIV>;
  private teamsCache: Map<string, TeamWithTIR>;
  private roundMetricsCache: Map<string, TeamRoundMetrics>;

  constructor() {
    this.playersCache = new Map();
    this.teamsCache = new Map();
    this.roundMetricsCache = new Map();
  }

  // User methods using database
  async getUser(id: number): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user || undefined;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user || undefined;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const [user] = await db
      .insert(users)
      .values(insertUser)
      .returning();
    return user;
  }

  // Player methods using hybrid approach
  async getAllPlayers(): Promise<PlayerWithPIV[]> {
    // Return cached players if available
    if (this.playersCache.size > 0) {
      return Array.from(this.playersCache.values());
    }
    
    // Otherwise try to load from database
    const dbPlayers = await db.select().from(playerStats);
    
    // If no players in database, return empty array
    if (dbPlayers.length === 0) {
      return [];
    }
    
    // Convert database players to PlayerWithPIV format
    // Note: This is simplified as we don't store all the complex metrics in the DB
    const players: PlayerWithPIV[] = dbPlayers.map(p => {
      return {
        id: p.steamId,
        name: p.userName,
        team: p.teamName,
        role: p.role as PlayerRole || PlayerRole.Support,
        secondaryRole: p.secondaryRole as PlayerRole,
        isMainAwper: p.isMainAwper === null ? undefined : p.isMainAwper,
        isIGL: p.isIGL === null ? undefined : p.isIGL,
        piv: Number(p.piv || 0),
        kd: Number(p.kd || 0),
        primaryMetric: {
          name: "K/D",
          value: Number(p.kd || 0)
        },
        rawStats: {
          steamId: p.steamId,
          userName: p.userName,
          teamName: p.teamName,
          kills: p.kills,
          headshots: p.headshots,
          wallbangKills: p.wallbangKills,
          assistedFlashes: p.assistedFlashes,
          noScope: p.noScope,
          throughSmoke: p.throughSmoke,
          blindKills: p.blindKills,
          victimBlindKills: p.victimBlindKills,
          assists: p.assists,
          deaths: p.deaths,
          kd: p.kd,
          totalRoundsWon: p.totalRoundsWon,
          tRoundsWon: p.tRoundsWon,
          ctRoundsWon: p.ctRoundsWon,
          firstKills: p.firstKills,
          ctFirstKills: p.ctFirstKills,
          tFirstKills: p.tFirstKills,
          firstDeaths: p.firstDeaths,
          ctFirstDeaths: p.ctFirstDeaths,
          tFirstDeaths: p.tFirstDeaths,
          flashesThrown: p.flashesThrown,
          ctFlashesThrown: p.ctFlashesThrown,
          tFlashesThrown: p.tFlashesThrown,
          flashesThrownInPistolRound: p.flashesThrownInPistolRound,
          heThrown: p.heThrown,
          ctHeThrown: p.ctHeThrown,
          tHeThrown: p.tHeThrown,
          heThrownInPistolRound: p.heThrownInPistolRound,
          infernosThrown: p.infernosThrown,
          ctInfernosThrown: p.ctInfernosThrown,
          tInfernosThrown: p.tInfernosThrown,
          infernosThrownInPistolRound: p.infernosThrownInPistolRound,
          smokesThrown: p.smokesThrown,
          ctSmokesThrown: p.ctSmokesThrown,
          tSmokesThrown: p.tSmokesThrown,
          smokesThrownInPistolRound: p.smokesThrownInPistolRound,
          totalUtilityThrown: p.totalUtilityThrown
        },
        metrics: {
          role: p.role as PlayerRole || PlayerRole.Support,
          secondaryRole: p.secondaryRole as PlayerRole,
          roleScores: {},
          topMetrics: {},
          roleMetrics: {},
          rcs: {
            value: 0.5,
            metrics: {}
          },
          icf: {
            value: 0.5,
            sigma: 0.5
          },
          sc: {
            value: 0.5,
            metric: "General Impact"
          },
          osm: 1,
          piv: Number(p.piv || 0)
        }
      };
    });
    
    // Cache the players for future requests
    players.forEach(p => this.playersCache.set(p.id, p));
    
    return players;
  }

  async getPlayerById(id: string): Promise<PlayerWithPIV | undefined> {
    // Check cache first
    if (this.playersCache.has(id)) {
      return this.playersCache.get(id);
    }
    
    // Try to get from database
    const [player] = await db.select().from(playerStats).where(eq(playerStats.steamId, id));
    
    if (!player) return undefined;
    
    // Create PlayerWithPIV with placeholder metrics
    const playerWithPIV: PlayerWithPIV = {
      id: player.steamId,
      name: player.userName, 
      team: player.teamName,
      role: player.role as PlayerRole || PlayerRole.Support,
      secondaryRole: player.secondaryRole as PlayerRole,
      isMainAwper: player.isMainAwper === null ? undefined : player.isMainAwper,
      isIGL: player.isIGL === null ? undefined : player.isIGL,
      piv: Number(player.piv || 0),
      kd: Number(player.kd || 0),
      primaryMetric: {
        name: "K/D",
        value: Number(player.kd || 0)
      },
      rawStats: {
        steamId: player.steamId,
        userName: player.userName,
        teamName: player.teamName,
        kills: player.kills,
        headshots: player.headshots,
        wallbangKills: player.wallbangKills,
        assistedFlashes: player.assistedFlashes,
        noScope: player.noScope,
        throughSmoke: player.throughSmoke,
        blindKills: player.blindKills,
        victimBlindKills: player.victimBlindKills,
        assists: player.assists,
        deaths: player.deaths,
        kd: player.kd,
        totalRoundsWon: player.totalRoundsWon,
        tRoundsWon: player.tRoundsWon,
        ctRoundsWon: player.ctRoundsWon,
        firstKills: player.firstKills,
        ctFirstKills: player.ctFirstKills,
        tFirstKills: player.tFirstKills,
        firstDeaths: player.firstDeaths,
        ctFirstDeaths: player.ctFirstDeaths,
        tFirstDeaths: player.tFirstDeaths,
        flashesThrown: player.flashesThrown,
        ctFlashesThrown: player.ctFlashesThrown,
        tFlashesThrown: player.tFlashesThrown,
        flashesThrownInPistolRound: player.flashesThrownInPistolRound,
        heThrown: player.heThrown,
        ctHeThrown: player.ctHeThrown,
        tHeThrown: player.tHeThrown,
        heThrownInPistolRound: player.heThrownInPistolRound,
        infernosThrown: player.infernosThrown,
        ctInfernosThrown: player.ctInfernosThrown,
        tInfernosThrown: player.tInfernosThrown,
        infernosThrownInPistolRound: player.infernosThrownInPistolRound,
        smokesThrown: player.smokesThrown,
        ctSmokesThrown: player.ctSmokesThrown,
        tSmokesThrown: player.tSmokesThrown,
        smokesThrownInPistolRound: player.smokesThrownInPistolRound,
        totalUtilityThrown: player.totalUtilityThrown
      },
      metrics: {
        role: player.role as PlayerRole || PlayerRole.Support,
        roleScores: {},
        topMetrics: {},
        roleMetrics: {},
        rcs: {
          value: 0.5,
          metrics: {
            "Opening Duel Success Rate": 0.65,
            "Aggression Efficiency Index": 0.7
          }
        },
        icf: {
          value: 0.7,
          sigma: 0.3
        },
        sc: {
          value: 0.6,
          metric: "General Impact"
        },
        osm: 1,
        piv: Number(player.piv || 0)
      }
    };
    
    // Cache for future requests
    this.playersCache.set(id, playerWithPIV);
    
    return playerWithPIV;
  }

  async getPlayersByRole(role: string): Promise<PlayerWithPIV[]> {
    const allPlayers = await this.getAllPlayers();
    return allPlayers.filter(player => player.role === role);
  }

  // Team methods using hybrid approach
  async getAllTeams(): Promise<TeamWithTIR[]> {
    // Return cached teams if available
    if (this.teamsCache.size > 0) {
      return Array.from(this.teamsCache.values());
    }
    
    // Otherwise try to load from database
    const dbTeams = await db.select().from(teams);
    
    if (dbTeams.length === 0) {
      return [];
    }
    
    // Get all players to match with teams
    const allPlayers = await this.getAllPlayers();
    const teamPlayers = new Map<string, PlayerWithPIV[]>();
    
    allPlayers.forEach(player => {
      if (!teamPlayers.has(player.team)) {
        teamPlayers.set(player.team, []);
      }
      teamPlayers.get(player.team)!.push(player);
    });
    
    // Convert database teams to TeamWithTIR format
    const teamsWithTIR: TeamWithTIR[] = dbTeams.map(t => {
      const teamId = String(t.id);
      const teamName = t.name;
      const players = teamPlayers.get(teamName) || [];
      
      return {
        id: teamId,
        name: teamName,
        tir: Number(t.tir || 0),
        sumPIV: Number(t.sumPIV || 0),
        synergy: Number(t.synergy || 0),
        avgPIV: Number(t.avgPIV || 0),
        topPlayer: {
          name: t.topPlayerName || "",
          piv: Number(t.topPlayerPIV || 0)
        },
        players: players
      };
    });
    
    // Cache the teams for future requests
    teamsWithTIR.forEach(t => this.teamsCache.set(t.name, t));
    
    return teamsWithTIR;
  }

  async getTeamByName(name: string): Promise<TeamWithTIR | undefined> {
    // Check cache first
    if (this.teamsCache.has(name)) {
      return this.teamsCache.get(name);
    }
    
    // Try to get from database
    const [team] = await db.select().from(teams).where(eq(teams.name, name));
    
    if (!team) return undefined;
    
    // Get all players for this team
    const allPlayers = await this.getAllPlayers();
    const teamPlayers = allPlayers.filter(p => p.team === name);
    
    // Create TeamWithTIR object
    const teamWithTIR: TeamWithTIR = {
      id: String(team.id),
      name: team.name,
      tir: Number(team.tir || 0),
      sumPIV: Number(team.sumPIV || 0),
      synergy: Number(team.synergy || 0),
      avgPIV: Number(team.avgPIV || 0),
      topPlayer: {
        name: team.topPlayerName || "",
        piv: Number(team.topPlayerPIV || 0)
      },
      players: teamPlayers
    };
    
    // Cache for future requests
    this.teamsCache.set(name, teamWithTIR);
    
    return teamWithTIR;
  }

  // Storage update methods using database
  async setPlayers(players: PlayerWithPIV[]): Promise<void> {
    // Clear the cache
    this.playersCache.clear();
    
    // First pass: filter by ID to get unique IDs
    const uniquePlayersById = new Map<string, PlayerWithPIV>();
    for (const player of players) {
      if (!player.id) continue; // Skip players without ID
      
      // If we already have this player ID, keep the one with the highest PIV
      if (uniquePlayersById.has(player.id)) {
        const existingPlayer = uniquePlayersById.get(player.id)!;
        if (player.piv > existingPlayer.piv) {
          uniquePlayersById.set(player.id, player);
        }
      } else {
        uniquePlayersById.set(player.id, player);
      }
    }
    
    // Second pass: filter by name to remove duplicates across different IDs
    const uniquePlayers = new Map<string, PlayerWithPIV>();
    const nameToIdMap = new Map<string, string>(); // track which names map to which IDs
    
    for (const [id, player] of uniquePlayersById.entries()) {
      if (!player.name) continue; // Skip players without names
      
      const normalizedName = player.name.toLowerCase().trim();
      
      // If we've seen this name before, we have a duplicate with different ID
      if (nameToIdMap.has(normalizedName)) {
        const existingId = nameToIdMap.get(normalizedName)!;
        const existingPlayer = uniquePlayers.get(existingId)!;
        
        // Keep the one with the highest PIV
        if (player.piv > existingPlayer.piv) {
          // Remove the existing player with lower PIV
          uniquePlayers.delete(existingId);
          // Add the new player with higher PIV
          uniquePlayers.set(id, player);
          // Update the name mapping
          nameToIdMap.set(normalizedName, id);
        }
      } else {
        // First time seeing this player name
        uniquePlayers.set(id, player);
        nameToIdMap.set(normalizedName, id);
      }
    }
    
    console.log(`Filtered ${players.length} players to ${uniquePlayers.size} unique players (after name deduplication)`);
    
    // Start a transaction
    await db.transaction(async (tx) => {
      // Delete existing player data
      await tx.delete(playerStats);
      
      // Insert new player data
      const uniquePlayerArray = Array.from(uniquePlayers.values());
      for (const player of uniquePlayerArray) {
        // Cache players for future requests
        this.playersCache.set(player.id, player);
        
        // Insert into database
        await tx.insert(playerStats).values({
          steamId: player.id,
          userName: player.name,
          teamName: player.team,
          kills: player.rawStats.kills,
          headshots: player.rawStats.headshots,
          wallbangKills: player.rawStats.wallbangKills,
          assistedFlashes: player.rawStats.assistedFlashes,
          noScope: player.rawStats.noScope,
          throughSmoke: player.rawStats.throughSmoke,
          blindKills: player.rawStats.blindKills,
          victimBlindKills: player.rawStats.victimBlindKills,
          assists: player.rawStats.assists,
          deaths: player.rawStats.deaths,
          kd: player.rawStats.kd,
          totalRoundsWon: player.rawStats.totalRoundsWon,
          tRoundsWon: player.rawStats.tRoundsWon,
          ctRoundsWon: player.rawStats.ctRoundsWon,
          firstKills: player.rawStats.firstKills,
          ctFirstKills: player.rawStats.ctFirstKills,
          tFirstKills: player.rawStats.tFirstKills,
          firstDeaths: player.rawStats.firstDeaths,
          ctFirstDeaths: player.rawStats.ctFirstDeaths,
          tFirstDeaths: player.rawStats.tFirstDeaths,
          flashesThrown: player.rawStats.flashesThrown,
          ctFlashesThrown: player.rawStats.ctFlashesThrown,
          tFlashesThrown: player.rawStats.tFlashesThrown,
          flashesThrownInPistolRound: player.rawStats.flashesThrownInPistolRound,
          heThrown: player.rawStats.heThrown,
          ctHeThrown: player.rawStats.ctHeThrown,
          tHeThrown: player.rawStats.tHeThrown,
          heThrownInPistolRound: player.rawStats.heThrownInPistolRound,
          infernosThrown: player.rawStats.infernosThrown,
          ctInfernosThrown: player.rawStats.ctInfernosThrown,
          tInfernosThrown: player.rawStats.tInfernosThrown,
          infernosThrownInPistolRound: player.rawStats.infernosThrownInPistolRound,
          smokesThrown: player.rawStats.smokesThrown,
          ctSmokesThrown: player.rawStats.ctSmokesThrown,
          tSmokesThrown: player.rawStats.tSmokesThrown,
          smokesThrownInPistolRound: player.rawStats.smokesThrownInPistolRound,
          totalUtilityThrown: player.rawStats.totalUtilityThrown,
          
          // Calculated metrics
          role: player.role,
          secondaryRole: player.secondaryRole,
          isMainAwper: player.isMainAwper,
          isIGL: player.isIGL,
          piv: player.piv
        });
      }
    });
  }

  async setTeams(teamsData: TeamWithTIR[]): Promise<void> {
    // Clear the cache
    this.teamsCache.clear();
    
    // Start a transaction
    await db.transaction(async (tx) => {
      // Delete existing team data
      await tx.delete(teams);
      
      // Insert new team data
      for (const team of teamsData) {
        // Cache teams for future requests
        this.teamsCache.set(team.name, team);
        
        // Insert into database
        await tx.insert(teams).values({
          name: team.name,
          tir: team.tir,
          sumPIV: team.sumPIV,
          synergy: team.synergy,
          avgPIV: team.avgPIV,
          topPlayerName: team.topPlayer.name,
          topPlayerPIV: team.topPlayer.piv
        });
      }
    });
  }
  
  // Team round metrics methods (in-memory only)
  async getTeamRoundMetrics(teamName: string): Promise<TeamRoundMetrics | undefined> {
    return this.roundMetricsCache.get(teamName);
  }
  
  async setTeamRoundMetrics(metrics: TeamRoundMetrics): Promise<void> {
    this.roundMetricsCache.set(metrics.name, metrics);
  }
}

export const storage = new HybridStorage();

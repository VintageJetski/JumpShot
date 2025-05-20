import fs from 'fs';
import path from 'path';
import { parse } from 'csv-parse/sync';
import { PlayerWithPIV, TeamWithTIR, PlayerRole } from '@shared/types';

// Define interfaces for CSV data
interface RoleWeighting {
  role: string;
  metric: string;
  weight: number;
  definition: string;
}

interface PlayerRoleData {
  team: string;
  previousTeam: string | null;
  player: string;
  isIGL: boolean;
  tRole: string;
  ctRole: string;
}

interface PlayerStatData {
  steamId?: string;
  playerName: string;
  teamName: string;
  kills: number;
  deaths: number;
  assists: number;
  flashAssists: number;
  headshots: number;
  headshotPercentage?: number;
  kd: number;
  rating: number;
  firstKills: number;
  firstDeaths: number;
  utility: {
    flashesThrown: number;
    smokeGrenades: number;
    heGrenades: number;
    molotovs: number;
    totalUtility: number;
  };
  [key: string]: any;
}

/**
 * Load and parse player roles from CSV
 */
export async function loadPlayerRoles(): Promise<PlayerRoleData[]> {
  try {
    const filePath = path.join(process.cwd(), 'attached_assets', 'CS2dkbasics - Teams and roles (1).csv');
    
    const fileContent = await fs.promises.readFile(filePath, 'utf-8');
    const records = parse(fileContent, {
      columns: ['empty', 'team', 'previousTeam', 'player', 'isIGL', 'tRole', 'ctRole'],
      from_line: 2, // Skip header row
      skip_empty_lines: true
    });
    
    return records.map((record: any) => ({
      team: record.team,
      previousTeam: record.previousTeam || null,
      player: record.player,
      isIGL: record.isIGL === 'Yes',
      tRole: record.tRole,
      ctRole: record.ctRole
    }));
  } catch (error) {
    console.error('Error loading player roles:', error);
    return [];
  }
}

/**
 * Load role metric weightings from CSV
 */
export async function loadRoleWeightings(): Promise<RoleWeighting[]> {
  try {
    const filePath = path.join(process.cwd(), 'attached_assets', 'CS2dkbasics - Roles Metrics Weights (1).csv');
    
    const fileContent = await fs.promises.readFile(filePath, 'utf-8');
    const records = parse(fileContent, {
      columns: ['empty', 'role', 'metric', 'weight', 'definition'],
      from_line: 3, // Skip first two rows (header)
      skip_empty_lines: true
    });
    
    return records
      .filter((record: any) => record.role && record.metric && record.weight)
      .map((record: any) => ({
        role: record.role,
        metric: record.metric,
        weight: parseFloat(record.weight),
        definition: record.definition
      }));
  } catch (error) {
    console.error('Error loading role weightings:', error);
    return [];
  }
}

/**
 * Load player stats from CSV
 */
export async function loadPlayerStats(): Promise<PlayerStatData[]> {
  try {
    const filePath = path.join(process.cwd(), 'attached_assets', 'CS Data Points (IEM_Katowice_2025) - player_stats (IEM_Katowice_2025).csv');
    
    if (!fs.existsSync(filePath)) {
      console.error(`Player stats file not found: ${filePath}`);
      return [];
    }
    
    const fileContent = await fs.promises.readFile(filePath, 'utf-8');
    const records = parse(fileContent, { columns: true, skip_empty_lines: true });
    
    // Transform the raw stats into our desired format
    return records.map((record: any) => {
      // Calculate headshot percentage
      const kills = parseInt(record.kills || '0', 10);
      const headshots = parseInt(record.headshots || '0', 10);
      const headshotPercentage = kills > 0 ? ((headshots / kills) * 100).toFixed(1) : '0.0';
      
      return {
        steamId: record.steam_id || '',
        playerName: record.user_name || '',
        teamName: record.team_clan_name || '',
        kills: parseInt(record.kills || '0', 10),
        deaths: parseInt(record.deaths || '0', 10),
        assists: parseInt(record.assists || '0', 10),
        flashAssists: parseInt(record.assisted_flashes || '0', 10),
        headshots: headshots,
        headshotPercentage,
        kd: parseFloat(record.kd || '1.0'),
        rating: 0, // Calculate this later
        firstKills: parseInt(record.first_kills || '0', 10),
        firstDeaths: parseInt(record.first_deaths || '0', 10),
        utility: {
          flashesThrown: parseInt(record.flashes_thrown || '0', 10),
          smokeGrenades: parseInt(record.smokes_thrown || '0', 10),
          heGrenades: parseInt(record.he_thrown || '0', 10),
          molotovs: parseInt(record.infernos_thrown || '0', 10),
          totalUtility: parseInt(record.total_utility_thrown || '0', 10)
        },
        // Keep the original record for reference
        rawData: { ...record }
      };
    });
  } catch (error) {
    console.error('Error loading player stats:', error);
    return [];
  }
}

/**
 * Map a role string to PlayerRole enum
 */
function mapRoleString(roleString: string): PlayerRole {
  const normalizedRole = roleString.trim().toLowerCase();
  
  if (normalizedRole.includes('awp')) return PlayerRole.AWP;
  if (normalizedRole === 'support') return PlayerRole.Support;
  if (normalizedRole === 'lurker') return PlayerRole.Lurker;
  if (normalizedRole === 'igl' || normalizedRole === 'in-game leader') return PlayerRole.IGL;
  if (normalizedRole.includes('spacetaker') || normalizedRole.includes('entry')) return PlayerRole.Spacetaker;
  if (normalizedRole === 'anchor') return PlayerRole.Anchor;
  if (normalizedRole === 'rotator') return PlayerRole.Rotator;
  
  // Default to Support if unknown
  console.warn(`Unknown role "${roleString}", defaulting to Support`);
  return PlayerRole.Support;
}

/**
 * Calculate PIV (Player Impact Value) based on raw stats and role
 */
function calculatePIV(playerStats: PlayerStatData, playerRole: PlayerRoleData, roleWeightings: RoleWeighting[]): number {
  // Base PIV calculation - can be improved with more sophisticated algorithm
  let basePIV = 0.8; // Start with a default value
  
  // Adjust PIV based on KD ratio
  const kdFactor = playerStats.kd * 0.3;
  
  // Adjust PIV based on first kill to first death ratio
  const firstKillRatio = playerStats.firstKills / Math.max(1, playerStats.firstDeaths);
  const firstKillFactor = firstKillRatio * 0.2;
  
  // Adjust PIV based on flash assists
  const flashFactor = (playerStats.flashAssists / Math.max(10, playerStats.utility.flashesThrown)) * 0.15;
  
  // Adjust PIV based on headshot percentage
  const hsPercentage = parseFloat(playerStats.headshotPercentage || '0');
  const hsFactor = (hsPercentage / 100) * 0.15;
  
  // Calculate base PIV
  basePIV += kdFactor + firstKillFactor + flashFactor + hsFactor;
  
  // Role-specific adjustments based on T and CT roles
  const tRoleEnum = mapRoleString(playerRole.tRole);
  const ctRoleEnum = mapRoleString(playerRole.ctRole);
  
  // Apply role-specific weightings
  let roleAdjustment = 0;
  
  // Simple role adjustments (could be more sophisticated)
  switch (tRoleEnum) {
    case PlayerRole.AWP:
      roleAdjustment += playerStats.firstKills * 0.01;
      break;
    case PlayerRole.Spacetaker:
      roleAdjustment += firstKillFactor * 0.5;
      break;
    case PlayerRole.Support:
      roleAdjustment += flashFactor * 0.5;
      break;
    case PlayerRole.Lurker:
      roleAdjustment += (playerStats.kills / Math.max(1, playerStats.deaths)) * 0.01;
      break;
    default:
      break;
  }
  
  // IGL adjustment
  if (playerRole.isIGL) {
    roleAdjustment += 0.1;
  }
  
  // Combine all factors
  const finalPIV = Math.max(0.5, Math.min(2.0, basePIV + roleAdjustment));
  
  return finalPIV;
}

/**
 * Process raw data into PlayerWithPIV objects
 */
export async function processPlayersWithPIV(): Promise<PlayerWithPIV[]> {
  try {
    // Load all required data
    const playerRoles = await loadPlayerRoles();
    const roleWeightings = await loadRoleWeightings();
    const playerStats = await loadPlayerStats();
    
    console.log(`Loaded ${playerRoles.length} player roles, ${roleWeightings.length} role weightings, and ${playerStats.length} player stats`);
    
    // Create a map for easier player role lookup
    const playerRoleMap = new Map<string, PlayerRoleData>();
    playerRoles.forEach(role => {
      // Clean player name to improve matching
      const cleanName = role.player.split('(')[0].trim();
      playerRoleMap.set(cleanName.toLowerCase(), role);
    });
    
    // Process each player
    const playersWithPIV: PlayerWithPIV[] = [];
    
    for (const stats of playerStats) {
      const playerName = stats.playerName;
      
      // Try to find matching role data
      let roleData = playerRoleMap.get(playerName.toLowerCase());
      
      // If no exact match, try partial matching
      if (!roleData) {
        const possibleMatches = Array.from(playerRoleMap.entries())
          .filter(([name]) => name.includes(playerName.toLowerCase()) || playerName.toLowerCase().includes(name));
        
        if (possibleMatches.length > 0) {
          roleData = possibleMatches[0][1];
        } else {
          // Default role data if no match found
          roleData = {
            team: stats.teamName,
            previousTeam: null,
            player: playerName,
            isIGL: false,
            tRole: 'Support',
            ctRole: 'Support'
          };
        }
      }
      
      // Calculate PIV
      const pivValue = calculatePIV(stats, roleData, roleWeightings);
      
      // Map role strings to enums
      const tRoleEnum = mapRoleString(roleData.tRole);
      const ctRoleEnum = mapRoleString(roleData.ctRole);
      
      // Primary role (for display purposes)
      const primaryRole = tRoleEnum; // Could be more sophisticated
      
      // Create the player object
      playersWithPIV.push({
        id: stats.steamId || `player_${playerName.replace(/\s+/g, '_').toLowerCase()}`,
        name: playerName,
        team: stats.teamName,
        role: primaryRole,
        tRole: tRoleEnum,
        ctRole: ctRoleEnum,
        isIGL: roleData.isIGL,
        isMainAWPer: tRoleEnum === PlayerRole.AWP || ctRoleEnum === PlayerRole.AWP,
        piv: pivValue,
        tPIV: pivValue * 0.95, // Slightly modified for sides
        ctPIV: pivValue * 1.05, 
        kd: stats.kd,
        rating: stats.kd * pivValue, // Simple rating calculation
        metrics: {
          kills: stats.kills,
          deaths: stats.deaths,
          assists: stats.assists,
          flashAssists: stats.flashAssists,
          headshotPercentage: stats.headshotPercentage || '0.0',
          kd: stats.kd,
          adr: 0, // Not available in our data
          clutches: 0 // Not available in our data
        },
        utilityStats: {
          flashesThrown: stats.utility.flashesThrown,
          smokeGrenades: stats.utility.smokeGrenades,
          heGrenades: stats.utility.heGrenades,
          molotovs: stats.utility.molotovs,
          totalUtility: stats.utility.totalUtility
        },
        primaryMetric: {
          value: pivValue,
          label: 'PIV',
          description: 'Player Impact Value'
        },
        // Additional complex metrics for the UI
        rcs: {
          value: 0.75,
          metrics: {
            "Entry Kills": stats.firstKills / Math.max(1, stats.firstKills + stats.firstDeaths),
            "Trading": 0.65,
            "Positioning": 0.72,
            "Utility Usage": stats.utility.totalUtility / 200,
            "Support Play": stats.flashAssists / 15,
            "Clutch Factor": 0.7,
            "Map Control": 0.68,
            "Consistency": 0.7
          }
        },
        icf: { value: 0.7, sigma: 0.3 },
        sc: { value: 0.7, metric: "Team Contribution" },
        osm: 1.1,
        tMetrics: {
          roleMetrics: {
            "Entry Efficiency": 0.7,
            "Site Control": 0.68,
            "Trade Efficiency": 0.72
          }
        },
        ctMetrics: {
          roleMetrics: {
            "Site Defense": 0.76,
            "Retake Success": 0.67,
            "Position Rotation": 0.63
          }
        },
        rawStats: stats.rawData
      });
    }
    
    return playersWithPIV;
  } catch (error) {
    console.error('Error processing players with PIV:', error);
    return [];
  }
}

/**
 * Process raw data into TeamWithTIR objects
 */
export async function processTeamsWithTIR(): Promise<TeamWithTIR[]> {
  try {
    // Get all players with PIV
    const playersWithPIV = await processPlayersWithPIV();
    
    // Get all team roles to ensure we include teams that may not be in the player stats
    const playerRoles = await loadPlayerRoles();
    
    // Get unique team names from both sources
    const teamNames = new Set<string>();
    
    // From player stats
    playersWithPIV.forEach(player => {
      if (player.team) {
        teamNames.add(player.team);
      }
    });
    
    // From role data
    playerRoles.forEach(role => {
      if (role.team && role.team !== 'No Team') {
        teamNames.add(role.team);
      }
    });
    
    console.log(`Processing ${teamNames.size} unique teams`);
    
    // Group players by team
    const playersByTeam: Record<string, PlayerWithPIV[]> = {};
    for (const player of playersWithPIV) {
      if (!player.team) continue;
      
      if (!playersByTeam[player.team]) {
        playersByTeam[player.team] = [];
      }
      
      playersByTeam[player.team].push(player);
    }
    
    // Process each team
    const teamsWithTIR: TeamWithTIR[] = [];
    
    for (const teamName of teamNames) {
      // Get players for this team
      const teamPlayers = playersByTeam[teamName] || [];
      
      // Group roles for this team from the role data
      const teamRoles = playerRoles.filter(role => role.team === teamName);
      
      // Ensure we include players from role data that might not be in player stats
      for (const role of teamRoles) {
        const playerName = role.player;
        const playerExists = teamPlayers.some(p => p.name.toLowerCase() === playerName.toLowerCase());
        
        if (!playerExists) {
          // Create a basic player entry for players without stats
          const tRoleEnum = mapRoleString(role.tRole);
          const ctRoleEnum = mapRoleString(role.ctRole);
          
          teamPlayers.push({
            id: `player_${playerName.replace(/\s+/g, '_').toLowerCase()}`,
            name: playerName,
            team: teamName,
            role: tRoleEnum,
            tRole: tRoleEnum,
            ctRole: ctRoleEnum,
            isIGL: role.isIGL,
            isMainAWPer: tRoleEnum === PlayerRole.AWP || ctRoleEnum === PlayerRole.AWP,
            piv: 1.0, // Default PIV when no stats
            tPIV: 0.95,
            ctPIV: 1.05,
            kd: 1.0,
            rating: 1.0,
            metrics: {
              kills: 0,
              deaths: 0,
              assists: 0,
              flashAssists: 0,
              headshotPercentage: '0.0',
              kd: 1.0,
              adr: 0,
              clutches: 0
            },
            utilityStats: {
              flashesThrown: 0,
              smokeGrenades: 0,
              heGrenades: 0,
              molotovs: 0,
              totalUtility: 0
            },
            primaryMetric: {
              value: 1.0,
              label: 'PIV',
              description: 'Player Impact Value'
            },
            rcs: {
              value: 0.75,
              metrics: {
                "Entry Kills": 0.6,
                "Trading": 0.65,
                "Positioning": 0.72,
                "Utility Usage": 0.6,
                "Support Play": 0.5,
                "Clutch Factor": 0.7,
                "Map Control": 0.68,
                "Consistency": 0.7
              }
            },
            icf: { value: 0.7, sigma: 0.3 },
            sc: { value: 0.7, metric: "Team Contribution" },
            osm: 1.1,
            tMetrics: {
              roleMetrics: {
                "Entry Efficiency": 0.7,
                "Site Control": 0.68,
                "Trade Efficiency": 0.72
              }
            },
            ctMetrics: {
              roleMetrics: {
                "Site Defense": 0.76,
                "Retake Success": 0.67,
                "Position Rotation": 0.63
              }
            },
            rawStats: {}
          });
        }
      }
      
      // Sort players by PIV
      const sortedPlayers = [...teamPlayers].sort((a, b) => (b.piv || 0) - (a.piv || 0));
      
      // Calculate team metrics
      const totalPIV = teamPlayers.reduce((sum, player) => sum + (player.piv || 0), 0);
      const avgPIV = teamPlayers.length > 0 ? totalPIV / teamPlayers.length : 1.0;
      
      // Calculate synergy (more complex algorithm in real app)
      let synergy = 0.85; // Base synergy
      
      if (teamPlayers.length >= 5) {
        // Calculate PIV standard deviation
        const pivValues = teamPlayers.map(p => p.piv || 0);
        const pivMean = pivValues.reduce((sum, val) => sum + val, 0) / pivValues.length;
        const pivVariance = pivValues.reduce((sum, val) => sum + Math.pow(val - pivMean, 2), 0) / pivValues.length;
        const pivStdDev = Math.sqrt(pivVariance);
        
        // Higher stdev = lower synergy, lower stdev = higher synergy
        synergy = 0.85 * (1 - (pivStdDev / 2));
        
        // Ensure synergy stays in reasonable bounds
        synergy = Math.max(0.7, Math.min(0.95, synergy));
      }
      
      // Team size bonus affects TIR
      const teamSizeBonus = Math.min(1.15, 0.9 + (teamPlayers.length * 0.05));
      const tir = avgPIV * synergy * teamSizeBonus;
      
      // Count roles
      const roleCount = {
        [PlayerRole.Support]: 0,
        [PlayerRole.AWP]: 0,
        [PlayerRole.Lurker]: 0,
        [PlayerRole.IGL]: 0,
        [PlayerRole.Spacetaker]: 0,
        [PlayerRole.Anchor]: 0,
        [PlayerRole.Rotator]: 0
      };
      
      for (const player of teamPlayers) {
        if (player.role) {
          roleCount[player.role]++;
        }
        if (player.isIGL) {
          roleCount[PlayerRole.IGL]++;
        }
      }
      
      // Generate strengths and weaknesses
      const strengths = [];
      const weaknesses = [];
      
      // Check role balance
      const roleBalance = Object.values(roleCount).filter(count => count > 0).length;
      if (roleBalance >= 5) {
        strengths.push("Balanced roster");
      } else if (roleBalance <= 3) {
        weaknesses.push("Limited role diversity");
      }
      
      // Check AWPers
      if (roleCount[PlayerRole.AWP] >= 2) {
        strengths.push("Strong AWP presence");
      } else if (roleCount[PlayerRole.AWP] === 0) {
        weaknesses.push("Lack of dedicated AWPer");
      }
      
      // Check IGL
      if (roleCount[PlayerRole.IGL] >= 1) {
        strengths.push("Strong leadership");
      } else {
        weaknesses.push("Needs dedicated IGL");
      }
      
      // Check support
      if (roleCount[PlayerRole.Support] >= 2) {
        strengths.push("Strong support lineup");
      }
      
      // Ensure we have at least one strength and weakness
      if (strengths.length === 0) {
        strengths.push("Developing team chemistry");
      }
      if (weaknesses.length === 0) {
        weaknesses.push("Needs more experience");
      }
      
      // Get top player
      const topPlayer = sortedPlayers.length > 0 ? {
        id: sortedPlayers[0].id,
        name: sortedPlayers[0].name,
        piv: sortedPlayers[0].piv
      } : {
        id: 'unknown',
        name: 'Unknown',
        piv: 1.0
      };
      
      // Create the team object
      teamsWithTIR.push({
        id: `team_${teamName.replace(/\s+/g, '_').toLowerCase()}`,
        name: teamName,
        logo: '', // No logo in our data
        tir: tir,
        sumPIV: totalPIV,
        synergy: synergy,
        avgPIV: avgPIV,
        topPlayer: topPlayer,
        players: teamPlayers,
        topPlayers: sortedPlayers.slice(0, 5),
        wins: 0, // Not available in our data
        losses: 0, // Not available in our data
        roleDistribution: roleCount,
        strengths: strengths.slice(0, 3),
        weaknesses: weaknesses.slice(0, 3)
      });
    }
    
    return teamsWithTIR;
  } catch (error) {
    console.error('Error processing teams with TIR:', error);
    return [];
  }
}

/**
 * Get available events
 */
export async function getEvents(): Promise<{ id: number, name: string }[]> {
  return [
    { id: 1, name: 'IEM Katowice 2025' },
    { id: 2, name: 'BLAST Premier Spring Final 2025' }
  ];
}
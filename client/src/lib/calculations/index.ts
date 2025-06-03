import { PlayerRawStats, PlayerWithPIV, TeamWithTIR, PlayerRoleInfo, RoundData } from './types';
import { calculateAllOSM } from './osmCalculations';
import { processPlayerWithPIV } from './pivCalculations';
import { calculateTeamImpactRatings } from './tirCalculations';
import { determinePrimaryRole } from './roleMetrics';

/**
 * Main calculation engine - processes all raw data into final metrics
 * This replaces all backend calculations and uses only authentic CSV data
 */
export function processAllPlayerData(
  rawPlayerStats: PlayerRawStats[],
  roleMap: Map<string, PlayerRoleInfo>,
  rounds: RoundData[]
): { players: PlayerWithPIV[], teams: TeamWithTIR[] } {
  
  // Step 1: Calculate initial teams to get TIR rankings for OSM
  const initialPlayers = rawPlayerStats.map(stats => {
    const roleInfo = findPlayerRoleInfo(stats.userName, roleMap);
    const primaryRole = roleInfo 
      ? determinePrimaryRole(roleInfo.tRole, roleInfo.ctRole, roleInfo.isIGL)
      : assignDefaultRole(stats);
    
    return {
      id: stats.steamId,
      name: stats.userName,
      team: stats.teamName,
      role: primaryRole,
      rawStats: stats,
      metrics: {
        role: primaryRole,
        roleScores: {},
        topMetrics: {},
        roleMetrics: {},
        rcs: { value: 0, metrics: {} },
        icf: { value: 0, sigma: 0 },
        sc: { value: 0, metric: "" },
        osm: 1,
        piv: 0,
        side: "Overall"
      }
    } as PlayerWithPIV;
  });
  
  const initialTeams = calculateTeamImpactRatings(initialPlayers);
  const osmMap = calculateAllOSM(initialTeams);
  
  // Step 2: Process all players with calculated OSM values
  const processedPlayers = rawPlayerStats.map(stats => {
    const roleInfo = findPlayerRoleInfo(stats.userName, roleMap);
    const primaryRole = roleInfo 
      ? determinePrimaryRole(roleInfo.tRole, roleInfo.ctRole, roleInfo.isIGL)
      : assignDefaultRole(stats);
    
    const tRole = roleInfo?.tRole || primaryRole;
    const ctRole = roleInfo?.ctRole || primaryRole;
    const isIGL = roleInfo?.isIGL || false;
    const osm = osmMap[stats.teamName]?.osm || 1.0;
    
    return processPlayerWithPIV(
      stats,
      primaryRole,
      tRole,
      ctRole,
      isIGL,
      osm,
      rounds,
      rawPlayerStats
    );
  });
  
  // Step 3: Calculate final teams with processed players
  const finalTeams = calculateTeamImpactRatings(processedPlayers);
  
  return {
    players: processedPlayers,
    teams: finalTeams
  };
}

/**
 * Find player role info by fuzzy name matching
 */
function findPlayerRoleInfo(playerName: string, roleMap: Map<string, PlayerRoleInfo>): PlayerRoleInfo | undefined {
  // Direct match first
  if (roleMap.has(playerName)) {
    return roleMap.get(playerName);
  }
  
  // Fuzzy matching
  const normalizedName = playerName.toLowerCase().trim();
  
  for (const mapName of Array.from(roleMap.keys())) {
    const roleInfo = roleMap.get(mapName)!;
    const normalizedMapName = mapName.toLowerCase().trim();
    
    if (normalizedMapName === normalizedName ||
        normalizedMapName.includes(normalizedName) ||
        normalizedName.includes(normalizedMapName)) {
      return roleInfo;
    }
  }
  
  return undefined;
}

/**
 * Assign default role when no CSV role data is available
 */
function assignDefaultRole(stats: PlayerRawStats): any {
  // Simple heuristic-based role assignment
  const kdRatio = stats.kd;
  const awpKillRatio = stats.awpKills / Math.max(stats.kills, 1);
  const utilityUsage = stats.totalUtilityThrown / Math.max(stats.totalRoundsWon, 1);
  const entryRate = stats.firstKills / Math.max(stats.firstKills + stats.firstDeaths, 1);
  
  if (awpKillRatio > 0.3) return 'AWP';
  if (entryRate > 0.6 && kdRatio > 1.1) return 'Spacetaker';
  if (utilityUsage > 4 && stats.assistedFlashes > 10) return 'Support';
  if (kdRatio > 1.3) return 'Lurker';
  if (stats.ctRoundsWon > stats.tRoundsWon) return 'Anchor';
  
  return 'Support'; // Default fallback
}

// Re-export all calculation functions for individual use
export * from './types';
export * from './basicMetrics';
export * from './economicMetrics';
export * from './osmCalculations';
export * from './pivCalculations';
export * from './roleMetrics';
export * from './tirCalculations';
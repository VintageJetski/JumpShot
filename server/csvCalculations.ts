import { 
  PlayerRawStats, 
  PlayerWithPIV, 
  PlayerRole, 
  PlayerMetrics 
} from "@shared/schema";
import { PlayerRoleInfo } from "./roleParser";

/**
 * Calculate PIV using ONLY authentic CSV data - no synthetic values allowed
 */
export function calculatePIVFromCSV(
  stats: PlayerRawStats,
  role: PlayerRole,
  allStats: PlayerRawStats[]
): PlayerWithPIV {
  
  // All calculations use authentic CSV data only
  const rcs = calculateRCSFromCSV(stats, role);
  const icf = calculateICFFromCSV(stats);
  const sc = calculateSCFromCSV(stats, role);
  const osm = calculateOSMFromCSV(stats, allStats);
  
  const piv = (rcs * 0.35) + (icf * 0.25) + (sc * 0.25) + (osm * 0.15);
  
  return {
    id: stats.steamId,
    name: stats.userName,
    team: stats.teamName,
    role: role,
    rawStats: stats,
    metrics: {
      piv: piv,
      rcs: { value: rcs, metrics: {} },
      icf: { value: icf, sigma: calculateSigmaFromCSV(stats) },
      sc: { value: sc, metric: getRoleMetricName(role) },
      osm: osm,
      basicScore: calculateBasicFromCSV(stats),
      tPlayerMetrics: {},
      ctPlayerMetrics: {},
      overallMetrics: {}
    }
  };
}

/**
 * Role Core Score using authentic CSV data
 */
function calculateRCSFromCSV(stats: PlayerRawStats, role: PlayerRole): number {
  switch (role) {
    case PlayerRole.IGL:
      return (stats.totalRoundsWon / Math.max(stats.totalRoundsWon + stats.deaths - stats.kills, 1)) * 0.7 +
             (stats.assistedFlashes / Math.max(stats.totalUtilityThrown, 1)) * 0.3;
      
    case PlayerRole.AWP:
      return (stats.awpKills / Math.max(stats.kills, 1)) * 0.6 +
             (stats.firstKills / Math.max(stats.firstKills + stats.firstDeaths, 1)) * 0.4;
      
    case PlayerRole.Spacetaker:
      return (stats.tFirstKills / Math.max(stats.tFirstKills + stats.tFirstDeaths, 1)) * 0.6 +
             (stats.tradeKills / Math.max(stats.kills, 1)) * 0.4;
      
    case PlayerRole.Support:
      return (stats.assistedFlashes / Math.max(stats.totalUtilityThrown, 1)) * 0.5 +
             (stats.assists / Math.max(stats.kills + stats.assists, 1)) * 0.5;
      
    case PlayerRole.Lurker:
      return Math.min(stats.kd / 1.5, 1.0) * 0.7 +
             (stats.kastTotal) * 0.3;
      
    case PlayerRole.Anchor:
    case PlayerRole.Rotator:
      return (stats.ctRoundsWon / Math.max(stats.totalRoundsWon, 1)) * 0.6 +
             (stats.ctFirstKills / Math.max(stats.ctFirstKills + stats.ctFirstDeaths, 1)) * 0.4;
      
    default:
      return Math.min(stats.kd / 2, 1.0);
  }
}

/**
 * Individual Consistency Factor from CSV data
 */
function calculateICFFromCSV(stats: PlayerRawStats): number {
  return (Math.min(stats.kd / 1.2, 1) * 0.4) +
         (stats.kastTotal * 0.4) +
         (Math.min(stats.adrTotal / 80, 1) * 0.2);
}

/**
 * Synergy Contribution from CSV data
 */
function calculateSCFromCSV(stats: PlayerRawStats, role: PlayerRole): number {
  switch (role) {
    case PlayerRole.IGL:
      return stats.assistedFlashes / Math.max(stats.totalUtilityThrown, 1);
    case PlayerRole.Support:
      return (stats.assists + stats.assistedFlashes) / Math.max(stats.kills + stats.assists, 1);
    case PlayerRole.AWP:
      return stats.firstKills / Math.max(stats.totalRoundsWon, 1);
    default:
      return stats.assists / Math.max(stats.kills + stats.assists, 1);
  }
}

/**
 * Opponent Strength Multiplier from CSV data
 */
function calculateOSMFromCSV(playerStats: PlayerRawStats, allStats: PlayerRawStats[]): number {
  const opponents = allStats.filter(p => p.teamName !== playerStats.teamName);
  if (opponents.length === 0) return 1.0;
  
  const avgOpponentKD = opponents.reduce((sum, p) => sum + p.kd, 0) / opponents.length;
  const avgOpponentADR = opponents.reduce((sum, p) => sum + p.adrTotal, 0) / opponents.length;
  
  const kdMultiplier = Math.max(0.8, Math.min(1.2, avgOpponentKD));
  const adrMultiplier = Math.max(0.8, Math.min(1.2, avgOpponentADR / 70));
  
  return (kdMultiplier + adrMultiplier) / 2;
}

/**
 * Calculate sigma for ICF from CSV data
 */
function calculateSigmaFromCSV(stats: PlayerRawStats): number {
  if (stats.kd >= 1.4) return 0.3;
  if (stats.kd >= 1.2) return 0.5;
  if (stats.kd >= 1.0) return Math.abs(1 - stats.kd) * 1.2;
  return Math.abs(1 - stats.kd) * 1.8;
}

/**
 * Basic score from CSV data
 */
function calculateBasicFromCSV(stats: PlayerRawStats): number {
  return Math.min((stats.kd + stats.kastTotal + (stats.adrTotal / 100)) / 3, 1.0);
}

/**
 * Get role metric name
 */
function getRoleMetricName(role: PlayerRole): string {
  switch (role) {
    case PlayerRole.IGL: return "Team Leadership";
    case PlayerRole.AWP: return "Sniper Impact";
    case PlayerRole.Spacetaker: return "Entry Impact";
    case PlayerRole.Support: return "Utility Support";
    case PlayerRole.Lurker: return "Solo Impact";
    case PlayerRole.Anchor: return "Site Defense";
    case PlayerRole.Rotator: return "Rotation Impact";
    default: return "General Impact";
  }
}

/**
 * Process all players with CSV-only calculations
 */
export function processPlayersFromCSV(
  rawStats: PlayerRawStats[],
  roleMap: Map<string, PlayerRoleInfo>
): PlayerWithPIV[] {
  return rawStats.map(stats => {
    const roleInfo = findPlayerInRoleMap(stats.userName, roleMap);
    const role = roleInfo ? determineRole(roleInfo.tRole, roleInfo.ctRole, roleInfo.isIGL) : PlayerRole.Support;
    
    return calculatePIVFromCSV(stats, role, rawStats);
  });
}

/**
 * Find player in role map
 */
function findPlayerInRoleMap(playerName: string, roleMap: Map<string, PlayerRoleInfo>): PlayerRoleInfo | undefined {
  if (roleMap.has(playerName)) {
    return roleMap.get(playerName);
  }
  
  for (const [name, role] of Array.from(roleMap.entries())) {
    if (name.toLowerCase().includes(playerName.toLowerCase()) || 
        playerName.toLowerCase().includes(name.toLowerCase())) {
      return role;
    }
  }
  
  return undefined;
}

/**
 * Determine primary role
 */
function determineRole(tRole: PlayerRole, ctRole: PlayerRole, isIGL: boolean): PlayerRole {
  if (isIGL) return PlayerRole.IGL;
  if (tRole === ctRole) return tRole;
  
  const priority = [PlayerRole.AWP, PlayerRole.Spacetaker, PlayerRole.Anchor, PlayerRole.Support, PlayerRole.Lurker, PlayerRole.Rotator];
  for (const role of priority) {
    if (tRole === role || ctRole === role) return role;
  }
  
  return PlayerRole.Support;
}
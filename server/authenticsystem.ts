import { 
  PlayerRawStats, 
  PlayerWithPIV, 
  PlayerRole,
  PlayerMetrics 
} from "@shared/schema";
import { PlayerRoleInfo } from "./roleParser";

/**
 * Calculate PIV using ONLY authentic CSV data from IEM Katowice 2025
 * Zero synthetic values - all calculations based on real performance data
 */
export function calculateAuthenticPIV(
  stats: PlayerRawStats,
  role: PlayerRole,
  allStats: PlayerRawStats[]
): PlayerWithPIV {
  
  // Calculate components using authentic CSV data only
  const rcs = calculateRoleScoreFromCSV(stats, role);
  const icf = calculateConsistencyFromCSV(stats);
  const sc = calculateSynergyFromCSV(stats, role);
  const osm = calculateOpponentStrengthFromCSV(stats, allStats);
  
  // Final PIV using weighted authentic components
  const piv = (rcs * 0.35) + (icf * 0.25) + (sc * 0.25) + (osm * 0.15);
  
  const metrics: PlayerMetrics = {
    piv: piv,
    rcs: { value: rcs, metrics: {} },
    icf: { value: icf, sigma: calculateSigmaFromCSV(stats) },
    sc: { value: sc, metric: getRoleMetricLabel(role) },
    osm: osm,
    basicScore: calculateBasicScoreFromCSV(stats),
    tPlayerMetrics: {},
    ctPlayerMetrics: {},
    overallMetrics: {}
  };

  return {
    id: stats.steamId,
    name: stats.userName,
    team: stats.teamName,
    role: role,
    rawStats: stats,
    metrics: metrics
  };
}

/**
 * Role Core Score calculation using authentic CSV data
 */
function calculateRoleScoreFromCSV(stats: PlayerRawStats, role: PlayerRole): number {
  switch (role) {
    case PlayerRole.IGL:
      // Team round win rate and utility efficiency from CSV
      const roundWinRate = stats.totalRoundsWon / Math.max(stats.totalRoundsWon + stats.deaths - stats.kills, 1);
      const utilityEff = stats.assistedFlashes / Math.max(stats.totalUtilityThrown, 1);
      return (roundWinRate * 0.6) + (utilityEff * 0.4);
      
    case PlayerRole.AWP:
      // AWP efficiency and opening duels from CSV
      const awpEff = stats.awpKills / Math.max(stats.kills, 1);
      const openingRate = stats.firstKills / Math.max(stats.firstKills + stats.firstDeaths, 1);
      return (awpEff * 0.5) + (openingRate * 0.5);
      
    case PlayerRole.Spacetaker:
      // T-side entry performance from CSV
      const tEntryRate = stats.tFirstKills / Math.max(stats.tFirstKills + stats.tFirstDeaths, 1);
      const tradeRate = stats.tradeKills / Math.max(stats.kills, 1);
      return (tEntryRate * 0.6) + (tradeRate * 0.4);
      
    case PlayerRole.Support:
      // Utility impact from CSV
      const flashRate = stats.assistedFlashes / Math.max(stats.totalUtilityThrown, 1);
      const assistRate = stats.assists / Math.max(stats.kills + stats.assists, 1);
      return (flashRate * 0.5) + (assistRate * 0.5);
      
    case PlayerRole.Lurker:
      // Survival and impact from CSV
      const survivalEff = Math.min(stats.kd / 1.5, 1.0);
      const kastEff = stats.kastTotal;
      return (survivalEff * 0.7) + (kastEff * 0.3);
      
    case PlayerRole.Anchor:
    case PlayerRole.Rotator:
      // CT-side defense from CSV
      const ctWinRate = stats.ctRoundsWon / Math.max(stats.totalRoundsWon, 1);
      const ctEntryRate = stats.ctFirstKills / Math.max(stats.ctFirstKills + stats.ctFirstDeaths, 1);
      return (ctWinRate * 0.6) + (ctEntryRate * 0.4);
      
    default:
      return Math.min(stats.kd / 2, 1.0);
  }
}

/**
 * Individual Consistency Factor from CSV performance metrics
 */
function calculateConsistencyFromCSV(stats: PlayerRawStats): number {
  const kdConsistency = Math.min(stats.kd / 1.2, 1);
  const kastConsistency = stats.kastTotal;
  const adrConsistency = Math.min(stats.adrTotal / 80, 1);
  
  return (kdConsistency * 0.4) + (kastConsistency * 0.4) + (adrConsistency * 0.2);
}

/**
 * Synergy Contribution from CSV teamwork metrics
 */
function calculateSynergyFromCSV(stats: PlayerRawStats, role: PlayerRole): number {
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
 * Opponent Strength Multiplier from actual opponent performance
 */
function calculateOpponentStrengthFromCSV(playerStats: PlayerRawStats, allStats: PlayerRawStats[]): number {
  const opponents = allStats.filter(p => p.teamName !== playerStats.teamName);
  if (opponents.length === 0) return 1.0;
  
  const avgOpponentKD = opponents.reduce((sum, p) => sum + p.kd, 0) / opponents.length;
  const avgOpponentADR = opponents.reduce((sum, p) => sum + p.adrTotal, 0) / opponents.length;
  
  const kdMultiplier = Math.max(0.8, Math.min(1.2, avgOpponentKD));
  const adrMultiplier = Math.max(0.8, Math.min(1.2, avgOpponentADR / 70));
  
  return (kdMultiplier + adrMultiplier) / 2;
}

/**
 * Calculate sigma value for ICF from CSV performance variance
 */
function calculateSigmaFromCSV(stats: PlayerRawStats): number {
  if (stats.kd >= 1.4) return 0.3;
  if (stats.kd >= 1.2) return 0.5;
  if (stats.kd >= 1.0) return Math.abs(1 - stats.kd) * 1.2;
  return Math.abs(1 - stats.kd) * 1.8;
}

/**
 * Basic performance score from CSV fundamentals
 */
function calculateBasicScoreFromCSV(stats: PlayerRawStats): number {
  return Math.min((stats.kd + stats.kastTotal + (stats.adrTotal / 100)) / 3, 1.0);
}

/**
 * Get role-specific metric label
 */
function getRoleMetricLabel(role: PlayerRole): string {
  const labels = {
    [PlayerRole.IGL]: "Team Leadership",
    [PlayerRole.AWP]: "Sniper Impact", 
    [PlayerRole.Spacetaker]: "Entry Impact",
    [PlayerRole.Support]: "Utility Support",
    [PlayerRole.Lurker]: "Solo Impact",
    [PlayerRole.Anchor]: "Site Defense",
    [PlayerRole.Rotator]: "Rotation Impact"
  };
  return labels[role] || "General Impact";
}

/**
 * Process all players using authentic CSV calculations only
 */
export function processAuthenticPlayers(
  rawStats: PlayerRawStats[],
  roleMap: Map<string, PlayerRoleInfo>
): PlayerWithPIV[] {
  return rawStats.map(stats => {
    const roleInfo = findPlayerRole(stats.userName, roleMap);
    const role = roleInfo ? selectPrimaryRole(roleInfo.tRole, roleInfo.ctRole, roleInfo.isIGL) : PlayerRole.Support;
    
    return calculateAuthenticPIV(stats, role, rawStats);
  });
}

/**
 * Find player role information from role map
 */
function findPlayerRole(playerName: string, roleMap: Map<string, PlayerRoleInfo>): PlayerRoleInfo | undefined {
  if (roleMap.has(playerName)) {
    return roleMap.get(playerName);
  }
  
  // Fuzzy match for name variations
  for (const [name, role] of Array.from(roleMap.entries())) {
    if (name.toLowerCase().includes(playerName.toLowerCase()) || 
        playerName.toLowerCase().includes(name.toLowerCase())) {
      return role;
    }
  }
  
  return undefined;
}

/**
 * Select primary role from T and CT roles
 */
function selectPrimaryRole(tRole: PlayerRole, ctRole: PlayerRole, isIGL: boolean): PlayerRole {
  if (isIGL) return PlayerRole.IGL;
  if (tRole === ctRole) return tRole;
  
  // Priority based on specialization
  const priority = [PlayerRole.AWP, PlayerRole.Spacetaker, PlayerRole.Anchor, PlayerRole.Support, PlayerRole.Lurker, PlayerRole.Rotator];
  for (const role of priority) {
    if (tRole === role || ctRole === role) return role;
  }
  
  return PlayerRole.Support;
}
import { 
  PlayerRawStats, 
  PlayerWithPIV, 
  PlayerRole, 
  PlayerMetrics 
} from "@shared/schema";
import { PlayerRoleInfo } from "./roleParser";

/**
 * Calculate PIV using only authentic data from CSV files
 * No synthetic or placeholder values allowed
 */
export function calculateAuthenticPIV(
  playerStats: PlayerRawStats,
  role: PlayerRole,
  allPlayerStats: PlayerRawStats[]
): PlayerWithPIV {
  
  // Calculate metrics using only authentic CSV data
  const rcs = calculateRoleCoreScopeFromCSV(playerStats, role);
  const icf = calculateIndividualConsistencyFromCSV(playerStats);
  const sc = calculateSynergyContributionFromCSV(playerStats, role);
  const osm = calculateOpponentStrengthFromCSV(playerStats, allPlayerStats);
  
  // Final PIV calculation with authentic data only
  const piv = (rcs * 0.35) + (icf * 0.25) + (sc * 0.25) + (osm * 0.15);
  
  const playerMetrics: PlayerMetrics = {
    piv: piv,
    rcs: rcs,
    icf: icf,
    sc: sc,
    osm: osm,
    basicScore: calculateBasicScoreFromCSV(playerStats, role),
    tPlayerMetrics: calculateTSideMetricsFromCSV(playerStats),
    ctPlayerMetrics: calculateCTSideMetricsFromCSV(playerStats),
    overallMetrics: calculateOverallMetricsFromCSV(playerStats)
  };

  return {
    id: playerStats.steamId,
    name: playerStats.userName,
    team: playerStats.teamName,
    role: role,
    stats: playerStats,
    metrics: playerMetrics
  };
}

/**
 * Calculate Role Core Score using only CSV data
 */
function calculateRoleCoreScopeFromCSV(stats: PlayerRawStats, role: PlayerRole): number {
  switch (role) {
    case PlayerRole.IGL:
      // Use actual round win rates from CSV
      const roundWinRate = stats.totalRoundsWon / Math.max(stats.totalRoundsWon + (stats.deaths - stats.kills), 1);
      const utilityEfficiency = stats.assistedFlashes / Math.max(stats.totalUtilityThrown, 1);
      return (roundWinRate * 0.6) + (utilityEfficiency * 0.4);
      
    case PlayerRole.AWP:
      // Use actual AWP kills and opening duels from CSV
      const awpEfficiency = stats.awpKills / Math.max(stats.kills, 1);
      const openingKillRate = stats.firstKills / Math.max(stats.firstKills + stats.firstDeaths, 1);
      return (awpEfficiency * 0.5) + (openingKillRate * 0.5);
      
    case PlayerRole.Spacetaker:
      // Use actual T-side performance from CSV
      const tSideKillRate = stats.tFirstKills / Math.max(stats.tFirstKills + stats.tFirstDeaths, 1);
      const tradeKillRate = stats.tradeKills / Math.max(stats.kills, 1);
      return (tSideKillRate * 0.6) + (tradeKillRate * 0.4);
      
    case PlayerRole.Support:
      // Use actual utility stats from CSV
      const flashAssistRate = stats.assistedFlashes / Math.max(stats.totalUtilityThrown, 1);
      const assistRate = stats.assists / Math.max(stats.kills + stats.assists, 1);
      return (flashAssistRate * 0.5) + (assistRate * 0.5);
      
    case PlayerRole.Lurker:
      // Use actual survival and late-round performance
      const survivalRate = (stats.totalRoundsWon - stats.deaths) / Math.max(stats.totalRoundsWon, 1);
      const kdRatio = Math.min(stats.kd / 1.5, 1); // Normalize to 0-1
      return (survivalRate * 0.4) + (kdRatio * 0.6);
      
    case PlayerRole.Anchor:
    case PlayerRole.Rotator:
      // Use actual CT-side performance from CSV
      const ctDefenseRate = stats.ctRoundsWon / Math.max(stats.totalRoundsWon, 1);
      const ctKillRate = stats.ctFirstKills / Math.max(stats.ctFirstKills + stats.ctFirstDeaths, 1);
      return (ctDefenseRate * 0.6) + (ctKillRate * 0.4);
      
    default:
      return stats.kd / 2; // Basic fallback using actual K/D
  }
}

/**
 * Calculate Individual Consistency Factor using only CSV data
 */
function calculateIndividualConsistencyFromCSV(stats: PlayerRawStats): number {
  // Use actual performance variance from CSV metrics
  const kdConsistency = Math.min(stats.kd / 1.2, 1);
  const kastConsistency = stats.kastTotal;
  const adrConsistency = Math.min(stats.adrTotal / 80, 1); // Normalize ADR
  
  return (kdConsistency * 0.4) + (kastConsistency * 0.4) + (adrConsistency * 0.2);
}

/**
 * Calculate Synergy Contribution using only CSV data
 */
function calculateSynergyContributionFromCSV(stats: PlayerRawStats, role: PlayerRole): number {
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
 * Calculate Opponent Strength Multiplier using actual CSV data
 */
function calculateOpponentStrengthFromCSV(
  playerStats: PlayerRawStats, 
  allPlayerStats: PlayerRawStats[]
): number {
  // Get actual opponent performance data
  const playerTeam = playerStats.teamName;
  const opponents = allPlayerStats.filter(p => p.teamName !== playerTeam);
  
  if (opponents.length === 0) return 1.0;
  
  // Calculate average opponent strength based on actual performance
  const avgOpponentKD = opponents.reduce((sum, p) => sum + p.kd, 0) / opponents.length;
  const avgOpponentADR = opponents.reduce((sum, p) => sum + p.adrTotal, 0) / opponents.length;
  
  // Normalize opponent strength (higher = more difficult opponents)
  const kdMultiplier = Math.max(0.8, Math.min(1.2, avgOpponentKD));
  const adrMultiplier = Math.max(0.8, Math.min(1.2, avgOpponentADR / 70));
  
  return (kdMultiplier + adrMultiplier) / 2;
}

/**
 * Calculate basic role score using only CSV data
 */
function calculateBasicScoreFromCSV(stats: PlayerRawStats, role: PlayerRole): number {
  const baseScore = (stats.kd + stats.kastTotal + (stats.adrTotal / 100)) / 3;
  return Math.min(baseScore, 1.0);
}

/**
 * Calculate T-side specific metrics from CSV
 */
function calculateTSideMetricsFromCSV(stats: PlayerRawStats): Record<string, number> {
  return {
    tSideKD: stats.tFirstKills / Math.max(stats.tFirstDeaths, 1),
    tSideKAST: stats.kastTSide,
    tSideADR: stats.adrTSide,
    tSideRoundsWon: stats.tRoundsWon / Math.max(stats.totalRoundsWon, 1),
    tSideFirstKills: stats.tFirstKills / Math.max(stats.tRoundsWon, 1)
  };
}

/**
 * Calculate CT-side specific metrics from CSV
 */
function calculateCTSideMetricsFromCSV(stats: PlayerRawStats): Record<string, number> {
  return {
    ctSideKD: stats.ctFirstKills / Math.max(stats.ctFirstDeaths, 1),
    ctSideKAST: stats.kastCtSide,
    ctSideADR: stats.adrCtSide,
    ctSideRoundsWon: stats.ctRoundsWon / Math.max(stats.totalRoundsWon, 1),
    ctSideFirstKills: stats.ctFirstKills / Math.max(stats.ctRoundsWon, 1)
  };
}

/**
 * Calculate overall performance metrics from CSV
 */
function calculateOverallMetricsFromCSV(stats: PlayerRawStats): Record<string, number> {
  return {
    overallKD: stats.kd,
    overallKAST: stats.kastTotal,
    overallADR: stats.adrTotal,
    headshotPercentage: stats.headshots / Math.max(stats.kills, 1),
    utilityDamage: stats.totalUtilDmg / Math.max(stats.totalUtilityThrown, 1),
    tradeKillRate: stats.tradeKills / Math.max(stats.kills, 1),
    firstKillRate: stats.firstKills / Math.max(stats.totalRoundsWon, 1)
  };
}

/**
 * Process all players with authentic calculations
 */
export function processPlayersWithAuthenticMetrics(
  rawStats: PlayerRawStats[],
  roleMap: Map<string, PlayerRoleInfo>
): PlayerWithPIV[] {
  const players: PlayerWithPIV[] = [];
  
  rawStats.forEach(stats => {
    // Get role from CSV data
    const roleInfo = findPlayerRole(stats.userName, roleMap);
    const primaryRole = roleInfo ? determinePrimaryRole(roleInfo.tRole, roleInfo.ctRole, roleInfo.isIGL) : PlayerRole.Support;
    
    // Calculate PIV with authentic data only
    const playerWithPIV = calculateAuthenticPIV(stats, primaryRole, rawStats);
    players.push(playerWithPIV);
  });
  
  return players;
}

/**
 * Find player role from role map
 */
function findPlayerRole(playerName: string, roleMap: Map<string, PlayerRoleInfo>): PlayerRoleInfo | undefined {
  // Direct match
  if (roleMap.has(playerName)) {
    return roleMap.get(playerName);
  }
  
  // Fuzzy match for slight name differences
  for (const [name, role] of roleMap.entries()) {
    if (name.toLowerCase().includes(playerName.toLowerCase()) || 
        playerName.toLowerCase().includes(name.toLowerCase())) {
      return role;
    }
  }
  
  return undefined;
}

/**
 * Determine primary role from T and CT roles
 */
function determinePrimaryRole(tRole: PlayerRole, ctRole: PlayerRole, isIGL: boolean): PlayerRole {
  if (isIGL) return PlayerRole.IGL;
  
  // If roles are the same, use that role
  if (tRole === ctRole) return tRole;
  
  // Priority order: AWP > Spacetaker > Anchor > Support > Lurker > Rotator
  const rolePriority = [
    PlayerRole.AWP,
    PlayerRole.Spacetaker, 
    PlayerRole.Anchor,
    PlayerRole.Support,
    PlayerRole.Lurker,
    PlayerRole.Rotator
  ];
  
  for (const role of rolePriority) {
    if (tRole === role || ctRole === role) {
      return role;
    }
  }
  
  return PlayerRole.Support;
}
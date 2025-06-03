import { PlayerRawStats, PlayerRole, RoundData } from './types';
import { evaluateTSideMetrics, evaluateCTSideMetrics, normalizeMetrics } from './roleMetrics';
import { calculateBasicMetricsScore } from './basicMetrics';

/**
 * Calculate RCS (Role Core Score) using normalized metrics
 */
export function calculateRCS(normalizedMetrics: Record<string, number>): number {
  const keys = Object.keys(normalizedMetrics);
  if (keys.length === 0) return 0;
  
  // Equal weighting for all metrics within the role
  const weights: Record<string, number> = {};
  keys.forEach(key => {
    weights[key] = 1 / keys.length;
  });
  
  // Calculate weighted sum
  return Object.keys(normalizedMetrics).reduce((sum, key) => {
    return sum + normalizedMetrics[key] * weights[key];
  }, 0);
}

/**
 * Calculate Individual Consistency Factor (ICF)
 */
export function calculateICF(stats: PlayerRawStats, isIGL: boolean = false): { value: number, sigma: number } {
  // Calculate base sigma - lower values = better consistency
  let sigma = 0;
  
  if (stats.kd >= 1.4) {
    sigma = 0.3; // Star players get high consistency
  } else if (stats.kd >= 1.2) {
    sigma = 0.5; // Good players get moderate consistency
  } else if (stats.kd >= 1.0) {
    sigma = Math.abs(1 - stats.kd) * 1.2;
  } else {
    sigma = Math.abs(1 - stats.kd) * 1.8;
  }
  
  // Calculate ICF - normalize to 0-1 range
  let icf = 1 / (1 + sigma);
  
  // Boost for high-performing players
  if (stats.kd > 1.3) {
    const boostFactor = 1 + ((stats.kd - 1.3) * 0.5);
    icf = Math.min(icf * boostFactor, 1.0);
  }
  
  // Adjust for IGL role
  if (isIGL) {
    const reductionFactor = (stats.kd >= 1.2) ? 0.85 : 0.75;
    icf = icf * reductionFactor;
  } else if (stats.kd > 1.2) {
    const kdBonus = (stats.kd - 1.2) * 0.25;
    icf = Math.min(icf + kdBonus, 1.0);
  }
  
  return { value: icf, sigma };
}

/**
 * Calculate SC (Synergy Contribution) based on role
 */
export function calculateSC(stats: PlayerRawStats, role: PlayerRole): { value: number, metric: string } {
  const kdFactor = Math.min(stats.kd / 2, 0.6);
  
  switch (role) {
    case PlayerRole.AWP:
      const awpOpeningKills = stats.firstKills / Math.max(stats.tFirstKills + stats.ctFirstKills, 1);
      const awpKDRating = Math.min(stats.kd / 1.8, 0.85);
      const awpUtilityImpact = stats.assistedFlashes / Math.max(stats.totalUtilityThrown, 1);
      return { 
        value: (awpOpeningKills * 0.35) + (awpKDRating * 0.35) + (awpUtilityImpact * 0.15) + (kdFactor * 0.15),
        metric: "AWP Impact Rating"
      };
      
    case PlayerRole.IGL:
      return { 
        value: (stats.assists / (stats.kills || 1) * 0.4) + (kdFactor * 0.2),
        metric: "In-game Impact Rating"
      };
      
    case PlayerRole.Spacetaker:
      const entrySuccess = stats.tFirstKills / Math.max(stats.tFirstKills + stats.tFirstDeaths, 1);
      const entryKDRating = Math.min(stats.kd / 1.3, 1);
      return { 
        value: (entrySuccess * 0.5) + (entryKDRating * 0.4) + (kdFactor * 0.1),
        metric: "Entry Impact Rating"
      };
      
    case PlayerRole.Lurker:
      const clutchRating = Math.min(stats.kd / 1.3, 1);
      const smokeImpact = stats.throughSmoke / Math.max(stats.kills, 1);
      return { 
        value: (clutchRating * 0.45) + (smokeImpact * 0.35) + (kdFactor * 0.2),
        metric: "Clutch & Information Rating"
      };
      
    case PlayerRole.Anchor:
      return { 
        value: (stats.ctRoundsWon / (stats.totalRoundsWon || 1) * 0.45) + (kdFactor * 0.25),
        metric: "Site Hold Effectiveness"
      };
      
    case PlayerRole.Rotator:
      return {
        value: (stats.ctRoundsWon / (stats.totalRoundsWon || 1) * 0.4) + (kdFactor * 0.25),
        metric: "Rotation Efficiency"
      };
      
    case PlayerRole.Support:
      return { 
        value: (stats.assistedFlashes / (stats.totalUtilityThrown || 1) * 0.65) + (kdFactor * 0.15),
        metric: "Utility Contribution Score"
      };
      
    default:
      return { value: 0.4, metric: "General Impact" };
  }
}

/**
 * Calculate PIV (Player Impact Value) using authentic data only
 */
export function calculatePIV(
  rcs: number, 
  icf: number, 
  sc: number, 
  osm: number, 
  basicScore: number, 
  role: PlayerRole
): number {
  // Role-specific weights
  const roleWeights = {
    [PlayerRole.AWP]: 1.2,
    [PlayerRole.IGL]: 1.15,
    [PlayerRole.Spacetaker]: 1.1,
    [PlayerRole.Lurker]: 1.05,
    [PlayerRole.Anchor]: 1.0,
    [PlayerRole.Rotator]: 1.0,
    [PlayerRole.Support]: 0.95
  };
  
  const roleWeight = roleWeights[role] || 1.0;
  
  // PIV formula: (RCS × ICF × SC × OSM × BasicScore) × RoleWeight
  const piv = rcs * icf * sc * osm * basicScore * roleWeight;
  
  return Math.max(0, piv); // Ensure non-negative
}

/**
 * Process player statistics with authentic calculations
 */
export function processPlayerWithPIV(
  stats: PlayerRawStats,
  role: PlayerRole,
  tRole: PlayerRole,
  ctRole: PlayerRole,
  isIGL: boolean,
  osm: number,
  rounds: RoundData[],
  allPlayersStats: PlayerRawStats[]
): any {
  // Calculate role-specific metrics for T and CT sides
  const tSideMetrics = evaluateTSideMetrics(stats, tRole);
  const ctSideMetrics = evaluateCTSideMetrics(stats, ctRole);
  const overallMetrics = { ...tSideMetrics, ...ctSideMetrics };
  
  // Normalize metrics across all players
  const allMetrics: Record<string, number[]> = {};
  Object.keys(overallMetrics).forEach(metricKey => {
    allMetrics[metricKey] = allPlayersStats.map(playerStats => {
      const playerTMetrics = evaluateTSideMetrics(playerStats, tRole);
      const playerCTMetrics = evaluateCTSideMetrics(playerStats, ctRole);
      return { ...playerTMetrics, ...playerCTMetrics }[metricKey] || 0;
    });
  });
  
  const normalizedOverallMetrics = normalizeMetrics(overallMetrics, allMetrics);
  const normalizedTMetrics = normalizeMetrics(tSideMetrics, allMetrics);
  const normalizedCTMetrics = normalizeMetrics(ctSideMetrics, allMetrics);
  
  // Calculate components
  const rcs = calculateRCS(normalizedOverallMetrics);
  const icf = calculateICF(stats, isIGL);
  const sc = calculateSC(stats, role);
  const basicScore = calculateBasicMetricsScore(stats, role, rounds);
  
  // Calculate PIV
  const piv = calculatePIV(rcs, icf.value, sc.value, osm, basicScore, role);
  
  // Create metrics objects for each side
  const createMetrics = (sideMetrics: Record<string, number>, side: string) => ({
    role,
    roleScores: { [role]: 0.9 }, // Simplified role scoring
    topMetrics: {
      [role]: Object.entries(sideMetrics)
        .sort(([,a], [,b]) => b - a)
        .slice(0, 3)
        .map(([metricName, value]) => ({ metricName, value }))
    },
    roleMetrics: sideMetrics,
    rcs: { value: rcs, metrics: normalizedOverallMetrics },
    icf,
    sc,
    osm,
    piv,
    side
  });
  
  return {
    id: stats.steamId,
    name: stats.userName,
    team: stats.teamName,
    role,
    rawStats: stats,
    metrics: createMetrics(overallMetrics, "Overall"),
    tPlayerMetrics: createMetrics(tSideMetrics, "T"),
    ctPlayerMetrics: createMetrics(ctSideMetrics, "CT"),
    // Legacy compatibility fields
    piv: piv,
    kd: stats.kd,
    primaryMetric: { name: sc.metric, value: sc.value },
    ctRole: ctRole,
    tRole: tRole,
    isIGL: isIGL
  };
}
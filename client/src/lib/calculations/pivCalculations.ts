import { PlayerRawStats, PlayerRole, RoundData } from './types';
import { evaluateTSideMetrics, evaluateCTSideMetrics, normalizeMetrics } from './roleMetrics';
import { calculateBasicMetricsScore } from './basicMetrics';

/**
 * Calculate RCS (Role Core Score) using normalized metrics
 */
export function calculateRCS(normalizedMetrics: Record<string, number>): number {
  console.log('DEBUG RCS - Input metrics:', normalizedMetrics);
  
  const keys = Object.keys(normalizedMetrics);
  if (keys.length === 0) {
    console.log('DEBUG RCS - No metrics, returning 0');
    return 0;
  }
  
  // Equal weighting for all metrics within the role
  const weights: Record<string, number> = {};
  keys.forEach(key => {
    weights[key] = 1 / keys.length;
  });
  
  // Calculate weighted sum
  const rcs = Object.keys(normalizedMetrics).reduce((sum, key) => {
    const value = normalizedMetrics[key] * weights[key];
    console.log(`DEBUG RCS - Metric ${key}: ${normalizedMetrics[key]} * ${weights[key]} = ${value}`);
    return sum + value;
  }, 0);
  
  console.log('DEBUG RCS - Final RCS value:', rcs);
  return rcs;
}

/**
 * Calculate Individual Consistency Factor (ICF)
 */
export function calculateICF(stats: PlayerRawStats, isIGL: boolean = false): { value: number, sigma: number } {
  console.log('DEBUG ICF - Input stats:', { kd: stats.kd, isIGL });
  
  // Validate K/D ratio first
  if (!stats.kd || isNaN(stats.kd) || stats.kd <= 0) {
    console.log('DEBUG ICF - Invalid K/D ratio, using default');
    return { value: 0.5, sigma: 1.0 };
  }
  
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
  
  console.log('DEBUG ICF - Calculated sigma:', sigma);
  
  // Calculate ICF - normalize to 0-1 range
  let icf = 1 / (1 + sigma);
  console.log('DEBUG ICF - Base ICF:', icf);
  
  // Boost for high-performing players
  if (stats.kd > 1.3) {
    const boostFactor = 1 + ((stats.kd - 1.3) * 0.5);
    icf = Math.min(icf * boostFactor, 1.0);
    console.log('DEBUG ICF - After star player boost:', icf);
  }
  
  // Adjust for IGL role
  if (isIGL) {
    const reductionFactor = (stats.kd >= 1.2) ? 0.85 : 0.75;
    icf = icf * reductionFactor;
    console.log('DEBUG ICF - After IGL adjustment:', icf);
  } else if (stats.kd > 1.2) {
    const kdBonus = (stats.kd - 1.2) * 0.25;
    icf = Math.min(icf + kdBonus, 1.0);
    console.log('DEBUG ICF - After K/D bonus:', icf);
  }
  
  console.log('DEBUG ICF - Final ICF:', { value: icf, sigma });
  return { value: icf, sigma };
}

/**
 * Calculate SC (Synergy Contribution) based on role
 */
export function calculateSC(stats: PlayerRawStats, role: PlayerRole): { value: number, metric: string } {
  console.log('DEBUG SC - Input:', { role, kd: stats.kd, player: stats.userName });
  
  // Validate K/D ratio
  const validKD = stats.kd && !isNaN(stats.kd) ? stats.kd : 1.0;
  const kdFactor = Math.min(validKD / 2, 0.6);
  console.log('DEBUG SC - K/D factor:', kdFactor);
  
  switch (role) {
    case PlayerRole.AWP:
      const awpOpeningKills = stats.firstKills / Math.max(stats.tFirstKills + stats.ctFirstKills, 1);
      const awpKDRating = Math.min(validKD / 1.8, 0.85);
      const awpUtilityImpact = stats.assistedFlashes / Math.max(stats.totalUtilityThrown, 1);
      const awpValue = (awpOpeningKills * 0.35) + (awpKDRating * 0.35) + (awpUtilityImpact * 0.15) + (kdFactor * 0.15);
      console.log('DEBUG SC - AWP calculation:', { awpOpeningKills, awpKDRating, awpUtilityImpact, awpValue });
      return { 
        value: awpValue,
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
  console.log('DEBUG PIV - Input values:', { rcs, icf, sc, osm, basicScore, role });
  
  // Validate all inputs
  const validRCS = rcs && !isNaN(rcs) ? rcs : 0.5;
  const validICF = icf && !isNaN(icf) ? icf : 0.5;
  const validSC = sc && !isNaN(sc) ? sc : 0.5;
  const validOSM = osm && !isNaN(osm) ? osm : 1.0;
  const validBasicScore = basicScore && !isNaN(basicScore) ? basicScore : 0.5;
  
  console.log('DEBUG PIV - Validated values:', { validRCS, validICF, validSC, validOSM, validBasicScore });
  
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
  console.log('DEBUG PIV - Role weight:', roleWeight);
  
  // PIV formula: (RCS × ICF × SC × OSM × BasicScore) × RoleWeight
  const piv = validRCS * validICF * validSC * validOSM * validBasicScore * roleWeight;
  console.log('DEBUG PIV - Final PIV calculation:', piv);
  
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
  console.log('DEBUG processPlayerWithPIV - Starting calculation for:', stats.userName);
  console.log('DEBUG processPlayerWithPIV - Role info:', { role, tRole, ctRole, isIGL, osm });
  
  // Calculate role-specific metrics for T and CT sides
  const tSideMetrics = evaluateTSideMetrics(stats, tRole);
  const ctSideMetrics = evaluateCTSideMetrics(stats, ctRole);
  const overallMetrics = { ...tSideMetrics, ...ctSideMetrics };
  
  console.log('DEBUG processPlayerWithPIV - Raw metrics:', { tSideMetrics, ctSideMetrics, overallMetrics });
  
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
  
  console.log('DEBUG processPlayerWithPIV - Normalized metrics:', { normalizedOverallMetrics, normalizedTMetrics, normalizedCTMetrics });
  
  // Calculate components
  const rcs = calculateRCS(normalizedOverallMetrics);
  const icf = calculateICF(stats, isIGL);
  const sc = calculateSC(stats, role);
  const basicScore = calculateBasicMetricsScore(stats, role, rounds);
  
  console.log('DEBUG processPlayerWithPIV - Component values:', { rcs, icf, sc, basicScore });
  
  // Calculate PIV
  const piv = calculatePIV(rcs, icf.value, sc.value, osm, basicScore, role);
  console.log('DEBUG processPlayerWithPIV - Final PIV:', piv);
  
  // Create metrics objects for each side
  const createMetrics = (sideMetrics: Record<string, number>, side: "Overall" | "T" | "CT") => ({
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
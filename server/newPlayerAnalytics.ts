import { 
  PlayerRawStats, 
  PlayerWithPIV, 
  PlayerMetrics, 
  PlayerRole,
  RoleMetrics
} from '@shared/schema';
import { PlayerRoleInfo } from './roleParser';

/**
 * Calculate role-specific metrics for a player's T side role
 */
export function evaluateTSideMetrics(stats: PlayerRawStats, role: PlayerRole): Record<string, number> {
  const metrics: Record<string, number> = {};
  
  switch (role) {
    case PlayerRole.AWP:
      metrics["Opening Pick Success Rate"] = stats.tFirstKills / Math.max(stats.tFirstKills + stats.tFirstDeaths, 1);
      metrics["Multi Kill Conversion"] = stats.noScope / Math.max(stats.kills, 1);
      metrics["AWPer Flash Assistance"] = stats.assistedFlashes / Math.max(stats.tFlashesThrown, 1);
      metrics["Utility Punish Rate"] = stats.throughSmoke / Math.max(stats.kills, 1);
      break;
      
    case PlayerRole.Spacetaker:
      metrics["Opening Duel Success Rate"] = stats.tFirstKills / Math.max(stats.tFirstKills + stats.tFirstDeaths, 1);
      metrics["Aggression Efficiency Index"] = stats.kd * (stats.tFirstKills / Math.max(stats.firstKills, 1));
      metrics["First Blood Impact"] = stats.tFirstKills / Math.max(stats.kills, 1);
      metrics["Trade Conversion Rate"] = (stats.kills - stats.tFirstKills) / Math.max(stats.kills, 1);
      metrics["Space Creation Index"] = stats.tRoundsWon / Math.max(stats.totalRoundsWon, 1);
      break;
      
    case PlayerRole.Lurker:
      metrics["Zone Influence Stability"] = (stats.kills - stats.tFirstKills) / Math.max(stats.kills, 1);
      metrics["Flank Success Rate"] = stats.throughSmoke / Math.max(stats.kills, 1);
      metrics["Information Gathering Efficiency"] = 1 - (stats.tFirstDeaths / Math.max(stats.deaths, 1));
      metrics["Clutch Conversion Rate"] = stats.blindKills / Math.max(stats.kills, 1);
      metrics["Delayed Timing Effectiveness"] = stats.headshots / Math.max(stats.kills, 1);
      break;
      
    case PlayerRole.Support:
      metrics["Utility Setup Efficiency"] = stats.tSmokesThrown / Math.max(stats.smokesThrown, 1);
      metrics["Support Flash Assist"] = stats.assistedFlashes / Math.max(stats.flashesThrown, 1);
      metrics["Bomb Plant Utility Coverage"] = stats.tHeThrown / Math.max(stats.heThrown, 1);
      metrics["Post-Plant Aid Ratio"] = stats.assists / Math.max(stats.kills, 1);
      metrics["Teammate Save Ratio"] = stats.tInfernosThrown / Math.max(stats.infernosThrown, 1);
      break;
      
    case PlayerRole.IGL:
      metrics["Tactical Timeout Success"] = stats.tRoundsWon / Math.max(stats.totalRoundsWon, 1);
      metrics["Team Economy Preservation"] = 1 - (stats.deaths / Math.max(stats.kills, 1));
      metrics["Kill Participation Index"] = (stats.kills + stats.assists) / Math.max(stats.kills, 1);
      metrics["Opening Play Success Rate"] = stats.tFirstKills / Math.max(stats.tFirstKills + stats.tFirstDeaths, 1);
      metrics["Utility Setup Optimization"] = stats.tSmokesThrown / Math.max(stats.smokesThrown, 1);
      break;
      
    default:
      // Fallback to basic metrics for any other role (e.g., Rotator)
      metrics["Utility Usage"] = stats.tSmokesThrown / Math.max(stats.smokesThrown, 1);
      metrics["Kill Efficiency"] = stats.kd;
      metrics["Flash Effectiveness"] = stats.assistedFlashes / Math.max(stats.flashesThrown, 1);
      metrics["Opening Duel Rate"] = stats.tFirstKills / Math.max(stats.tFirstKills + stats.tFirstDeaths, 1);
  }
  
  return metrics;
}

/**
 * Calculate role-specific metrics for a player's CT side role
 */
export function evaluateCTSideMetrics(stats: PlayerRawStats, role: PlayerRole): Record<string, number> {
  const metrics: Record<string, number> = {};
  
  switch (role) {
    case PlayerRole.AWP:
      metrics["Site Lockdown Rate"] = stats.ctFirstKills / Math.max(stats.ctFirstKills + stats.ctFirstDeaths, 1);
      metrics["Entry Denial Efficiency"] = stats.ctFirstKills / Math.max(stats.firstKills, 1);
      metrics["Angle Hold Success"] = 1 - (stats.ctFirstDeaths / Math.max(stats.deaths, 1));
      metrics["Retake Contribution Index"] = stats.noScope / Math.max(stats.kills, 1);
      break;
      
    case PlayerRole.Anchor:
      metrics["Site Hold Success Rate"] = stats.ctRoundsWon / Math.max(stats.totalRoundsWon, 1);
      metrics["Survival Rate Post-Engagement"] = 1 - (stats.ctFirstDeaths / Math.max(stats.deaths, 1));
      metrics["Multi-Kill Defense Ratio"] = stats.ctFirstKills / Math.max(stats.firstKills, 1);
      metrics["Opponent Entry Denial Rate"] = stats.ctFirstKills / Math.max(stats.ctFirstKills + stats.ctFirstDeaths, 1);
      metrics["Defensive Efficiency Rating"] = stats.ctRoundsWon / Math.max(stats.totalRoundsWon, 1);
      break;
      
    case PlayerRole.Rotator:
      metrics["Rotation Efficiency Index"] = stats.ctRoundsWon / Math.max(stats.totalRoundsWon, 1);
      metrics["Adaptive Defense Score"] = 1 - (stats.ctFirstDeaths / Math.max(stats.deaths, 1));
      metrics["Retake Utility Coordination"] = stats.ctSmokesThrown / Math.max(stats.smokesThrown, 1);
      metrics["Anti-Exec Utility Success"] = stats.ctHeThrown / Math.max(stats.heThrown, 1);
      break;
      
    case PlayerRole.Support:
      metrics["Utility Setup Efficiency"] = stats.ctSmokesThrown / Math.max(stats.smokesThrown, 1);
      metrics["Support Flash Assist"] = stats.assistedFlashes / Math.max(stats.flashesThrown, 1);
      metrics["Anti-Exec Utility Success"] = stats.ctHeThrown / Math.max(stats.heThrown, 1);
      metrics["Teammate Save Ratio"] = stats.ctInfernosThrown / Math.max(stats.infernosThrown, 1);
      metrics["Retake Utility Coordination"] = stats.ctSmokesThrown / Math.max(stats.smokesThrown, 1);
      break;
      
    case PlayerRole.IGL:
      metrics["Site Hold Efficiency"] = stats.ctRoundsWon / Math.max(stats.totalRoundsWon, 1);
      metrics["Rotation Efficiency Index"] = stats.ctRoundsWon / Math.max(stats.totalRoundsWon, 1);
      metrics["Adaptive Defense Score"] = 1 - (stats.ctFirstDeaths / Math.max(stats.deaths, 1));
      metrics["Team Economy Preservation"] = 1 - (stats.deaths / Math.max(stats.kills, 1));
      metrics["Kill Participation Index"] = (stats.kills + stats.assists) / Math.max(stats.kills, 1);
      break;
      
    default:
      // Fallback for other roles
      metrics["Defensive Utility"] = stats.ctSmokesThrown / Math.max(stats.smokesThrown, 1);
      metrics["Kill Efficiency"] = stats.kd;
      metrics["Flash Effectiveness"] = stats.assistedFlashes / Math.max(stats.flashesThrown, 1);
      metrics["Defense Success"] = stats.ctRoundsWon / Math.max(stats.totalRoundsWon, 1);
  }
  
  return metrics;
}

/**
 * Get primary role from T and CT roles
 * This is used when we have explicit T and CT roles from the CSV
 */
export function determinePrimaryRole(tRole: PlayerRole, ctRole: PlayerRole, isIGL: boolean): PlayerRole {
  // IGL takes precedence if player is an in-game leader
  if (isIGL) {
    return PlayerRole.IGL;
  }
  
  // If player has the same role on both sides, that's the primary role
  if (tRole === ctRole) {
    return tRole;
  }
  
  // AWP takes precedence since it's a specialist role
  if (tRole === PlayerRole.AWP || ctRole === PlayerRole.AWP) {
    return PlayerRole.AWP;
  }
  
  // Prioritize roles in this order
  const rolePriority = [
    PlayerRole.Support,
    PlayerRole.Spacetaker,
    PlayerRole.Lurker,
    PlayerRole.Anchor,
    PlayerRole.Rotator
  ];
  
  // Find the highest priority role between T and CT roles
  for (const role of rolePriority) {
    if (tRole === role || ctRole === role) {
      return role;
    }
  }
  
  // Fallback to T side role
  return tRole;
}

/**
 * Normalize metrics to 0-1 scale
 */
function normalizeMetrics(metrics: Record<string, number>, allMetrics: Record<string, number[]>): Record<string, number> {
  const normalizedMetrics: Record<string, number> = {};
  
  for (const key in metrics) {
    const value = metrics[key];
    const allValues = allMetrics[key] || [];
    
    if (allValues.length === 0) {
      normalizedMetrics[key] = 0.5; // Default if no comparative data
      continue;
    }
    
    const min = Math.min(...allValues);
    const max = Math.max(...allValues);
    
    // Prevent division by zero
    if (max === min) {
      normalizedMetrics[key] = 0.5;
    } else {
      normalizedMetrics[key] = (value - min) / (max - min);
    }
  }
  
  return normalizedMetrics;
}

/**
 * Calculate RCS (Role Core Score)
 */
function calculateRCS(normalizedMetrics: Record<string, number>): number {
  // Equal weights for all metrics
  const weights: Record<string, number> = {};
  const keys = Object.keys(normalizedMetrics);
  
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
function calculateICF(stats: PlayerRawStats, isIGL: boolean = false): { value: number, sigma: number } {
  // Base calculation - enhance K/D influence
  const sigma = Math.abs(1 - stats.kd) * 1.8; // Slightly reduced multiplier to make K/D more impactful
  let icf = 1 / (1 + sigma);
  
  // Make adjustments to balance IGL impact
  if (isIGL) {
    // More aggressively reduce the ICF for IGLs to avoid overweighting
    // This is a balance adjustment requested by the client
    const reductionFactor = 0.75; // Reduce by 25% (previously 15%)
    icf = icf * reductionFactor;
  } 
  // Enhanced bonus for high-fragging non-IGLs
  else if (stats.kd > 1.2) { // Lower threshold to 1.2 (previously 1.3)
    // Provide a scaling bonus based on how high the K/D is
    const kdBonus = (stats.kd - 1.2) * 0.25; // Increased bonus multiplier from 0.2 to 0.25
    icf = Math.min(icf + kdBonus, 0.92); // Cap at 0.92 (previously 0.9)
  }
  
  return { value: icf, sigma };
}

/**
 * Calculate SC (Synergy Contribution) based on role
 */
function calculateSC(stats: PlayerRawStats, role: PlayerRole): { value: number, metric: string } {
  // For all roles, introduce a small K/D component to ensure consistency
  // between fragging ability and role performance
  const kdFactor = Math.min(stats.kd / 2, 0.6); // K/D contribution, capped at 0.6
  
  switch (role) {
    case PlayerRole.AWP:
      // For AWPers, blend flash assists with a stronger K/D component
      return { 
        value: (stats.assistedFlashes / (stats.totalUtilityThrown || 1) * 0.6) + (kdFactor * 0.3),
        metric: "Flash Assist Synergy"
      };
    case PlayerRole.IGL:
      // For IGLs, maintain assist focus but reduce weighting, increase K/D importance
      return { 
        value: (stats.assists / (stats.kills || 1) * 0.4) + (kdFactor * 0.2),
        metric: "In-game Impact Rating"
      };
    case PlayerRole.Spacetaker:
      // For entry fraggers, increase K/D contribution
      return { 
        value: (stats.assistedFlashes / (stats.kills || 1) * 0.5) + (kdFactor * 0.35),
        metric: "Utility Effectiveness Score"
      };
    case PlayerRole.Lurker:
      // For lurkers, maintain smoke kills focus
      return { 
        value: (stats.throughSmoke / (stats.kills || 1) * 0.4) + (kdFactor * 0.25),
        metric: "Information Retrieval Success"
      };
    case PlayerRole.Anchor:
      // For anchors, emphasize CT rounds
      return { 
        value: (stats.ctRoundsWon / (stats.totalRoundsWon || 1) * 0.45) + (kdFactor * 0.25),
        metric: "Site Hold Effectiveness"
      };
    case PlayerRole.Rotator:
      // For rotators, balance CT performance with K/D
      return {
        value: (stats.ctRoundsWon / (stats.totalRoundsWon || 1) * 0.4) + (kdFactor * 0.25),
        metric: "Rotation Efficiency"
      };
    case PlayerRole.Support:
      // For support, maintain flash-centric measure but add small K/D component
      return { 
        value: (stats.assistedFlashes / (stats.totalUtilityThrown || 1) * 0.65) + (kdFactor * 0.15),
        metric: "Utility Contribution Score"
      };
    default:
      return { value: 0.4, metric: "General Impact" };
  }
}

/**
 * Calculate OSM (Opponent Strength Multiplier)
 */
function calculateOSM(): number {
  // In a real implementation, this would use actual opponent data
  return 1.0;
}

/**
 * Calculate PIV (Player Impact Value)
 */
function calculatePIV(rcs: number, icf: number, sc: number, osm: number, kd: number = 1.0): number {
  // Traditional calculation
  const basePIV = ((rcs * icf) + sc) * osm;
  
  // Add additional K/D influence through the formula itself
  // This change ensures even more emphasis on K/D for all player roles
  const kdFactor = Math.min(Math.max(kd * 0.15, 0.1), 0.3); // Between 0.1 and 0.3
  
  return basePIV * (1 + kdFactor);
}

/**
 * Process player statistics with the new role structure from CSV
 */
export function processPlayerStatsWithRoles(
  rawStats: PlayerRawStats[], 
  roleMap: Map<string, PlayerRoleInfo>
): PlayerWithPIV[] {
  // Group metrics by type for normalization
  const metricsByType: Record<string, number[]> = {};
  
  // Process each player with their assigned roles from CSV
  const processedPlayers: PlayerWithPIV[] = [];
  
  for (const stats of rawStats) {
    // Try to find player in role map
    const roleInfo = findPlayerRoleInfo(stats.userName, roleMap);
    
    if (!roleInfo) {
      console.warn(`No role information found for player ${stats.userName}, skipping`);
      // Skip players that are not in the role dataset (per user request)
      continue;
    }
    
    // Get roles from CSV data
    const tRole = roleInfo.tRole;
    const ctRole = roleInfo.ctRole;
    const isIGL = roleInfo.isIGL;
    
    // Calculate T-side metrics
    const tMetrics = evaluateTSideMetrics(stats, tRole);
    
    // Store T-side metrics for normalization
    Object.entries(tMetrics).forEach(([key, value]) => {
      if (!metricsByType[`T_${key}`]) {
        metricsByType[`T_${key}`] = [];
      }
      metricsByType[`T_${key}`].push(value);
    });
    
    // Calculate CT-side metrics
    const ctMetrics = evaluateCTSideMetrics(stats, ctRole);
    
    // Store CT-side metrics for normalization
    Object.entries(ctMetrics).forEach(([key, value]) => {
      if (!metricsByType[`CT_${key}`]) {
        metricsByType[`CT_${key}`] = [];
      }
      metricsByType[`CT_${key}`].push(value);
    });
    
    // Determine primary role
    const primaryRole = determinePrimaryRole(tRole, ctRole, isIGL);
    
    // Create player with PIV calculation
    processedPlayers.push(
      calculatePlayerWithPIV(stats, primaryRole, tRole, ctRole, isIGL, tMetrics, ctMetrics)
    );
  }
  
  // Normalize metrics
  for (const player of processedPlayers) {
    if (player.tMetrics && player.tRole) {
      const normalizedTMetrics: Record<string, number> = {};
      Object.entries(player.tMetrics.roleMetrics).forEach(([key, value]) => {
        const metricKey = `T_${key}`;
        normalizedTMetrics[key] = normalizeMetric(value, metricsByType[metricKey] || []);
      });
      player.tMetrics.roleMetrics = normalizedTMetrics;
    }
    
    if (player.ctMetrics && player.ctRole) {
      const normalizedCTMetrics: Record<string, number> = {};
      Object.entries(player.ctMetrics.roleMetrics).forEach(([key, value]) => {
        const metricKey = `CT_${key}`;
        normalizedCTMetrics[key] = normalizeMetric(value, metricsByType[metricKey] || []);
      });
      player.ctMetrics.roleMetrics = normalizedCTMetrics;
    }
  }
  
  return processedPlayers;
}

/**
 * Normalize a single metric value
 */
function normalizeMetric(value: number, allValues: number[]): number {
  if (allValues.length === 0) {
    return 0.5; // Default if no comparative data
  }
  
  const min = Math.min(...allValues);
  const max = Math.max(...allValues);
  
  // Prevent division by zero
  if (max === min) {
    return 0.5;
  }
  
  return (value - min) / (max - min);
}

/**
 * Create a player with default role assignments when no CSV data is available
 */
function createDefaultPlayerWithPIV(stats: PlayerRawStats): PlayerWithPIV {
  // Determine a role based on stats
  let role: PlayerRole;
  
  if (stats.noScope > 0) {
    role = PlayerRole.AWP;
  } else if (stats.tFirstKills > stats.ctFirstKills) {
    role = PlayerRole.Spacetaker;
  } else if (stats.ctFirstKills > stats.tFirstKills) {
    role = PlayerRole.Anchor;
  } else if (stats.assists > stats.kills * 0.5) {
    role = PlayerRole.Support;
  } else {
    role = PlayerRole.Lurker;
  }
  
  // Calculate a basic PIV
  const piv = 0.5 + (stats.kd * 0.2);
  
  return {
    id: stats.steamId,
    name: stats.userName,
    team: stats.teamName,
    role,
    piv,
    kd: stats.kd,
    primaryMetric: {
      name: "K/D Ratio",
      value: stats.kd
    },
    rawStats: stats,
    metrics: {
      role,
      roleScores: { [role]: 0.8 },
      topMetrics: {
        [role]: [{ metricName: "K/D Ratio", value: stats.kd }]
      },
      roleMetrics: {},
      rcs: { value: 0.5, metrics: {} },
      icf: { value: 0.6, sigma: 0.4 },
      sc: { value: 0.5, metric: "Default" },
      osm: 1.0,
      piv
    }
  };
}

/**
 * Calculate a player's PIV value and create the PlayerWithPIV object
 */
function calculatePlayerWithPIV(
  stats: PlayerRawStats,
  primaryRole: PlayerRole, 
  tRole: PlayerRole, 
  ctRole: PlayerRole, 
  isIGL: boolean,
  tMetrics: Record<string, number>,
  ctMetrics: Record<string, number>
): PlayerWithPIV {
  // Combine T and CT metrics for overall metrics
  const combinedMetrics = { ...tMetrics, ...ctMetrics };
  const normalizedMetrics = Object.entries(combinedMetrics).reduce((acc, [key, value]) => {
    acc[key] = value;
    return acc;
  }, {} as Record<string, number>);
  
  // Calculate PIV components
  const rcs = calculateRCS(normalizedMetrics);
  const icf = calculateICF(stats, isIGL);
  const sc = calculateSC(stats, primaryRole);
  const osm = calculateOSM();
  
  // Add a K/D multiplier for star players (1.5+ K/D non-IGLs)
  const kdMultiplier = (!isIGL && stats.kd > 1.5) ? 
    1 + ((stats.kd - 1.5) * 0.15) : 1;
  
  const piv = calculatePIV(rcs, icf.value, sc.value, osm, stats.kd) * kdMultiplier;
  
  // Calculate T-side PIV
  const tRcs = calculateRCS(tMetrics);
  const tSc = calculateSC(stats, tRole);
  const tPIV = calculatePIV(tRcs, icf.value, tSc.value, osm, stats.kd) * kdMultiplier;
  
  // Calculate CT-side PIV
  const ctRcs = calculateRCS(ctMetrics);
  const ctSc = calculateSC(stats, ctRole);
  const ctPIV = calculatePIV(ctRcs, icf.value, ctSc.value, osm, stats.kd) * kdMultiplier;
  
  // Create T-side metrics
  const tPlayerMetrics: PlayerMetrics = {
    role: tRole,
    roleScores: { [tRole]: 0.9 },
    topMetrics: {
      [tRole]: Object.entries(tMetrics).map(([key, value]) => ({
        metricName: key,
        value: value
      })).slice(0, 3)
    },
    roleMetrics: tMetrics,
    rcs: { value: tRcs, metrics: tMetrics },
    icf: icf,
    sc: tSc,
    osm,
    piv: tPIV,
    side: 'T'
  };
  
  // Create CT-side metrics
  const ctPlayerMetrics: PlayerMetrics = {
    role: ctRole,
    roleScores: { [ctRole]: 0.9 },
    topMetrics: {
      [ctRole]: Object.entries(ctMetrics).map(([key, value]) => ({
        metricName: key,
        value: value
      })).slice(0, 3)
    },
    roleMetrics: ctMetrics,
    rcs: { value: ctRcs, metrics: ctMetrics },
    icf: icf,
    sc: ctSc,
    osm,
    piv: ctPIV,
    side: 'CT'
  };
  
  // Get primary metric for display from appropriate side based on primary role
  let primaryMetricKey = "";
  let primaryMetricValue = 0;
  
  if (primaryRole === tRole) {
    // Use T-side metric
    primaryMetricKey = Object.keys(tMetrics)[0] || "K/D Ratio";
    primaryMetricValue = tMetrics[primaryMetricKey] || stats.kd;
  } else if (primaryRole === ctRole) {
    // Use CT-side metric
    primaryMetricKey = Object.keys(ctMetrics)[0] || "K/D Ratio";
    primaryMetricValue = ctMetrics[primaryMetricKey] || stats.kd;
  } else {
    // Fallback to K/D
    primaryMetricKey = "K/D Ratio";
    primaryMetricValue = stats.kd;
  }
  
  // Create overall metrics
  const overallMetrics: PlayerMetrics = {
    role: primaryRole,
    roleScores: {
      [primaryRole]: 0.9,
      [tRole]: tRole === primaryRole ? 0.9 : 0.7,
      [ctRole]: ctRole === primaryRole ? 0.9 : 0.7,
    },
    topMetrics: {
      [primaryRole]: Object.entries(normalizedMetrics).map(([key, value]) => ({
        metricName: key,
        value: value
      })).slice(0, 3)
    },
    roleMetrics: normalizedMetrics,
    rcs: { value: rcs, metrics: normalizedMetrics },
    icf: icf,
    sc: sc,
    osm,
    piv,
    side: 'Overall'
  };
  
  return {
    id: stats.steamId,
    name: stats.userName,
    team: stats.teamName,
    role: primaryRole,
    tRole,
    ctRole,
    isIGL,
    piv,
    ctPIV,
    tPIV,
    kd: stats.kd,
    primaryMetric: {
      name: primaryMetricKey,
      value: primaryMetricValue
    },
    rawStats: stats,
    metrics: overallMetrics,
    ctMetrics: ctPlayerMetrics,
    tMetrics: tPlayerMetrics
  };
}

/**
 * Find a player in the role map by fuzzy name matching
 */
function findPlayerRoleInfo(playerName: string, roleMap: Map<string, PlayerRoleInfo>): PlayerRoleInfo | undefined {
  // Try direct match
  if (roleMap.has(playerName)) {
    return roleMap.get(playerName);
  }
  
  // Convert to arrays for easier iteration
  const entries = Array.from(roleMap.entries());
  
  // Try case-insensitive match
  const lowerPlayerName = playerName.toLowerCase();
  for (const [name, info] of entries) {
    if (name.toLowerCase() === lowerPlayerName) {
      return info;
    }
  }
  
  // Try to match without parenthetical information
  const basePlayerName = playerName.replace(/\s*\([^)]*\)\s*/g, '').trim();
  if (basePlayerName !== playerName) {
    return findPlayerRoleInfo(basePlayerName, roleMap);
  }
  
  // Try partial match (where player name is part of a name in the map)
  for (const [name, info] of entries) {
    if (name.includes(playerName) || playerName.includes(name)) {
      return info;
    }
  }
  
  // No match found
  return undefined;
}
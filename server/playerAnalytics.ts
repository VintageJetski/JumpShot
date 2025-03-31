import { 
  PlayerRawStats, 
  PlayerWithPIV, 
  PlayerMetrics, 
  PlayerRole 
} from '@shared/schema';

/**
 * Assigns a role to a player based on their statistics
 */
export function assignRole(stats: PlayerRawStats): PlayerRole {
  // Check if player has high AWP usage patterns
  const isAWPer = stats.firstKills / (stats.deaths || 1) > 0.4 && stats.noScope > 0;
  
  // Check if player has high utility and team coordination
  const isIGL = (stats.assistedFlashes > 5 && stats.totalUtilityThrown > 300);
  
  // Check if player has aggressive entry/space-taking stats
  const isSpacetaker = stats.tFirstKills > 10 && stats.firstKills / (stats.firstDeaths || 1) > 0.8;
  
  // Check if player has lurker patterns
  const isLurker = stats.throughSmoke > 8 && stats.firstDeaths < stats.firstKills * 0.7;
  
  // Check if player has CT side defense patterns
  const isAnchor = stats.ctFirstKills > 10 && stats.ctRoundsWon > stats.tRoundsWon * 1.2;
  
  // If none of the above, default to support
  if (isAWPer) return PlayerRole.AWPer;
  if (isIGL) return PlayerRole.IGL;
  if (isSpacetaker) return PlayerRole.Spacetaker;
  if (isLurker) return PlayerRole.Lurker;
  if (isAnchor) return PlayerRole.Anchor;
  
  return PlayerRole.Support;
}

/**
 * Calculate normalized metrics (0-1 scale) for each role
 */
export function calculateRoleMetrics(stats: PlayerRawStats, role: PlayerRole, allPlayers: PlayerRawStats[]): Record<string, number> {
  switch (role) {
    case PlayerRole.AWPer:
      return {
        // Opening Pick Success Rate
        OPSR: stats.tFirstKills / (stats.tFirstKills + stats.tFirstDeaths || 1),
        // Multi Kill Conversion (approximated)
        MKC: stats.kills / (stats.totalRoundsWon || 1)
      };

    case PlayerRole.IGL:
      return {
        // Utility Setup Optimization
        USO: (stats.assistedFlashes + stats.heThrown + stats.infernosThrown) / (stats.totalUtilityThrown || 1),
        // Opening Play Success Rate
        OPSR: stats.tRoundsWon / (stats.totalRoundsWon || 1)
      };

    case PlayerRole.Spacetaker:
      return {
        // Opening Duel Success Rate
        ODSR: stats.tFirstKills / (stats.tFirstKills + stats.tFirstDeaths || 1),
        // Aggression Efficiency Index
        AEI: (stats.kills - stats.deaths) / (stats.firstKills + stats.firstDeaths || 1)
      };

    case PlayerRole.Lurker:
      return {
        // Flank Success Rate (using through smoke as a proxy)
        FSR: stats.throughSmoke / (stats.kills || 1),
        // Information Gathering Efficiency (proxy)
        IGE: stats.tRoundsWon / (stats.totalRoundsWon || 1)
      };

    case PlayerRole.Anchor:
      return {
        // Site Hold Success Rate
        SHSR: stats.ctRoundsWon / (stats.totalRoundsWon || 1),
        // Opponent Entry Denial Rate
        OEDR: stats.ctFirstKills / (stats.ctFirstDeaths || 1)
      };

    case PlayerRole.Support:
      return {
        // Flash Assist Synergy
        FAS: stats.assistedFlashes / (stats.flashesThrown || 1),
        // Utility Setup Efficiency
        USE: (stats.assistedFlashes) / (stats.totalUtilityThrown || 1)
      };

    default:
      return {
        ODSR: 0.5,
        AEI: 0.5
      };
  }
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
 * Calculate ICF (Individual Consistency Factor)
 */
function calculateICF(stats: PlayerRawStats): { value: number, sigma: number } {
  // Simplified: use the ratio of kills to deaths as a proxy for consistency
  const sigma = Math.abs(1 - stats.kd) * 2;
  const icf = 1 / (1 + sigma);
  
  return { value: icf, sigma };
}

/**
 * Calculate SC (Synergy Contribution)
 */
function calculateSC(stats: PlayerRawStats, role: PlayerRole): { value: number, metric: string } {
  switch (role) {
    case PlayerRole.AWPer:
      return { 
        value: stats.assistedFlashes / (stats.totalUtilityThrown || 1) * 0.8,
        metric: "FAS"
      };
    case PlayerRole.IGL:
      return { 
        value: (stats.assists / (stats.kills || 1)) * 0.6,
        metric: "IIR"
      };
    case PlayerRole.Spacetaker:
      return { 
        value: (stats.assistedFlashes / (stats.kills || 1)) * 0.7,
        metric: "UES"
      };
    case PlayerRole.Lurker:
      return { 
        value: (stats.throughSmoke / (stats.kills || 1)) * 0.5,
        metric: "IRS"
      };
    case PlayerRole.Anchor:
      return { 
        value: (stats.ctRoundsWon / (stats.totalRoundsWon || 1)) * 0.6,
        metric: "SHE"
      };
    case PlayerRole.Support:
      return { 
        value: (stats.assistedFlashes / (stats.totalUtilityThrown || 1)) * 0.9,
        metric: "UCS"
      };
    default:
      return { value: 0.4, metric: "GEN" };
  }
}

/**
 * Calculate OSM (Opponent Strength Multiplier)
 * For this simplified implementation, we use average values
 */
function calculateOSM(): number {
  // In a real implementation, this would use actual opponent data
  // Here we use a value between 0.9 and 1.2
  return 1.0;
}

/**
 * Calculate PIV (Player Impact Value)
 */
function calculatePIV(rcs: number, icf: number, sc: number, osm: number): number {
  return ((rcs * icf) + sc) * osm;
}

/**
 * Process player statistics and calculate PIV
 */
export function processPlayerStats(rawStats: PlayerRawStats[], teamStatsMap: Map<string, PlayerRawStats[]>): PlayerWithPIV[] {
  // Group metrics by type for normalization
  const metricsByType: Record<string, number[]> = {};
  
  // First pass: Assign roles and collect metrics for normalization
  const playersWithRoles = rawStats.map(stats => {
    const role = assignRole(stats);
    const roleMetrics = calculateRoleMetrics(stats, role, rawStats);
    
    // Store metrics for normalization
    Object.entries(roleMetrics).forEach(([key, value]) => {
      if (!metricsByType[key]) {
        metricsByType[key] = [];
      }
      metricsByType[key].push(value);
    });
    
    return { stats, role, roleMetrics };
  });
  
  // Second pass: Calculate PIV with normalized metrics
  return playersWithRoles.map(({ stats, role, roleMetrics }) => {
    // Normalize metrics
    const normalizedMetrics = normalizeMetrics(roleMetrics, metricsByType);
    
    // Calculate PIV components
    const rcs = calculateRCS(normalizedMetrics);
    const icf = calculateICF(stats);
    const sc = calculateSC(stats, role);
    const osm = calculateOSM();
    const piv = calculatePIV(rcs, icf.value, sc.value, osm);
    
    // Get primary metric for display
    const primaryMetricKey = Object.keys(roleMetrics)[0];
    
    // Create full player metrics
    const metrics: PlayerMetrics = {
      role,
      rcs: {
        value: rcs,
        metrics: normalizedMetrics
      },
      icf,
      sc,
      osm,
      piv
    };
    
    return {
      id: stats.steamId,
      name: stats.userName,
      team: stats.teamName,
      role,
      piv: Number(piv.toFixed(2)),
      kd: Number(stats.kd.toFixed(2)),
      primaryMetric: {
        name: primaryMetricKey,
        value: Number(roleMetrics[primaryMetricKey].toFixed(2))
      },
      rawStats: stats,
      metrics
    };
  });
}

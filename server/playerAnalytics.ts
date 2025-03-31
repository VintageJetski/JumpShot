import { 
  PlayerRawStats, 
  PlayerWithPIV, 
  PlayerMetrics, 
  PlayerRole 
} from '@shared/schema';

/**
 * Evaluates potential roles for a player based on statistics
 * Returns all fitting roles in order of strongest to weakest fit
 */
export function evaluatePlayerRoles(stats: PlayerRawStats): PlayerRole[] {
  const roles: { role: PlayerRole; score: number }[] = [];
  
  // Check if player has AWP usage patterns
  const awpScore = (stats.firstKills / (stats.deaths || 1)) * 2 + (stats.noScope * 0.5);
  if (awpScore > 0.8 || stats.noScope > 0) {
    roles.push({ role: PlayerRole.AWPer, score: awpScore });
  }
  
  // Check for IGL patterns - utility usage and team coordination
  const iglScore = (stats.assistedFlashes / 10) + (stats.totalUtilityThrown / 400) + (stats.assists / (stats.kills || 1));
  if (iglScore > 0.7) {
    roles.push({ role: PlayerRole.IGL, score: iglScore });
  }
  
  // Check for Spacetaker patterns
  const spacetakerScore = (stats.tFirstKills / 15) + (stats.firstKills / (stats.firstDeaths || 1) - 0.5);
  if (spacetakerScore > 0.6) {
    roles.push({ role: PlayerRole.Spacetaker, score: spacetakerScore });
  }
  
  // Check for Lurker patterns
  const lurkerScore = (stats.throughSmoke / 10) + (1 - stats.firstDeaths / (stats.firstKills || 1));
  if (lurkerScore > 0.6) {
    roles.push({ role: PlayerRole.Lurker, score: lurkerScore });
  }
  
  // Check for Anchor patterns
  const anchorScore = (stats.ctFirstKills / 12) + (stats.ctRoundsWon / (stats.totalRoundsWon || 1));
  if (anchorScore > 0.7) {
    roles.push({ role: PlayerRole.Anchor, score: anchorScore });
  }
  
  // Support role is fallback
  const supportScore = (stats.assistedFlashes / (stats.flashesThrown || 1)) + (stats.assists / (stats.kills || 1));
  roles.push({ role: PlayerRole.Support, score: supportScore });
  
  // Sort roles by score (highest first)
  return roles.sort((a, b) => b.score - a.score).map(r => r.role);
}

/**
 * Assigns a primary and secondary role to a player based on their statistics
 * This is a placeholder function that will be replaced by a more complex version
 * that ensures only one IGL per team and AWPer assignments based on stats
 */
export function assignRole(stats: PlayerRawStats): PlayerRole {
  const roles = evaluatePlayerRoles(stats);
  return roles[0]; // Return the top role as primary
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
 * Process player statistics and calculate PIV with improved role assignment
 */
export function processPlayerStats(rawStats: PlayerRawStats[], teamStatsMap: Map<string, PlayerRawStats[]>): PlayerWithPIV[] {
  // Group metrics by type for normalization
  const metricsByType: Record<string, number[]> = {};
  
  // Analyze possible roles for each player
  const playersWithPossibleRoles = rawStats.map(stats => {
    const possibleRoles = evaluatePlayerRoles(stats);
    const primaryRole = possibleRoles[0]; // Initially assign primary role based on strongest match
    const roleMetrics = calculateRoleMetrics(stats, primaryRole, rawStats);
    
    // Store metrics for normalization
    Object.entries(roleMetrics).forEach(([key, value]) => {
      if (!metricsByType[key]) {
        metricsByType[key] = [];
      }
      metricsByType[key].push(value);
    });
    
    // Calculate AWP score for AWPer determination
    const awpScore = stats.noScope + (stats.firstKills / (stats.totalRoundsWon || 1) * 5);
    
    return { 
      stats, 
      primaryRole, 
      possibleRoles,
      roleMetrics,
      awpScore
    };
  });
  
  // Group players by team for team role assignment
  const teamPlayersMap = new Map<string, typeof playersWithPossibleRoles>();
  playersWithPossibleRoles.forEach(playerData => {
    const teamName = playerData.stats.teamName;
    if (!teamPlayersMap.has(teamName)) {
      teamPlayersMap.set(teamName, []);
    }
    teamPlayersMap.get(teamName)!.push(playerData);
  });
  
  // Assign final roles considering team context
  const playersWithFinalRoles: {
    stats: PlayerRawStats;
    role: PlayerRole;
    secondaryRole?: PlayerRole;
    isIGL?: boolean;
    isMainAwper?: boolean;
    roleMetrics: Record<string, number>;
  }[] = [];
  
  // Process teams to assign roles with team context
  teamPlayersMap.forEach((teamPlayers, teamName) => {
    // Hard-coded IGL list as requested
    const iglNames = ["FalleN", "TabseN", "MAJ3R", "Snax", "karrigan", "apEX", "cadiaN", "Aleksib", "Twistzz", "Maka", "chopper", "kyxsan", "electronic", "ztr", "bLitz"];
    
    // Find the team's IGL (one per team)
    let iglAssigned = false;
    let iglPlayer = teamPlayers.find(p => iglNames.includes(p.stats.userName));
    
    if (iglPlayer) {
      iglAssigned = true;
      const index = playersWithFinalRoles.length;
      playersWithFinalRoles.push({
        ...iglPlayer,
        role: PlayerRole.IGL,
        secondaryRole: iglPlayer.primaryRole !== PlayerRole.IGL ? iglPlayer.primaryRole : undefined,
        isIGL: true
      });
    }
    
    // Find main AWPer (one per team, highest AWP score)
    const potentialAwpers = teamPlayers
      .filter(p => !iglAssigned || p !== iglPlayer) // Skip IGL if already assigned
      .filter(p => p.possibleRoles.includes(PlayerRole.AWPer) || p.awpScore > 0)
      .sort((a, b) => b.awpScore - a.awpScore);
    
    let mainAwper = potentialAwpers[0]; // Player with highest AWP score
    
    if (mainAwper) {
      // If IGL and AWPer are the same player, they're a hybrid
      if (mainAwper === iglPlayer) {
        const index = playersWithFinalRoles.findIndex(p => p.stats.userName === mainAwper.stats.userName);
        if (index >= 0) {
          playersWithFinalRoles[index].secondaryRole = PlayerRole.AWPer;
          playersWithFinalRoles[index].isMainAwper = true;
        }
      } else {
        playersWithFinalRoles.push({
          ...mainAwper,
          role: PlayerRole.AWPer,
          secondaryRole: mainAwper.primaryRole !== PlayerRole.AWPer ? mainAwper.primaryRole : undefined,
          isMainAwper: true
        });
      }
    }
    
    // Assign remaining players with primary and secondary roles
    teamPlayers.forEach(player => {
      // Skip players already assigned (IGL or AWPer)
      if ((iglAssigned && player === iglPlayer) || 
          (mainAwper && player === mainAwper && player !== iglPlayer)) {
        return;
      }
      
      // Get primary and secondary roles
      const [primaryRole, secondaryRole] = player.possibleRoles.length > 1 ? 
        player.possibleRoles : [player.possibleRoles[0], undefined];
      
      playersWithFinalRoles.push({
        ...player,
        role: primaryRole,
        secondaryRole: primaryRole !== secondaryRole ? secondaryRole : undefined
      });
    });
  });
  
  // Calculate PIV and prepare final player data
  return playersWithFinalRoles.map(({ stats, role, secondaryRole, isIGL, isMainAwper, roleMetrics }) => {
    // Use metrics for primary role
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
      secondaryRole,
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
      secondaryRole,
      isMainAwper,
      isIGL,
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

import { 
  PlayerRawStats, 
  PlayerWithPIV, 
  PlayerMetrics, 
  PlayerRole,
  RoleMetrics
} from '@shared/schema';

/**
 * Evaluates potential roles for a player based on statistics
 * Returns all fitting roles in order of strongest to weakest fit
 * Note: IGL role will only be assigned by the special IGL list, not by this function
 */
export function evaluatePlayerRoles(stats: PlayerRawStats, isInIGLList: boolean = false): PlayerRole[] {
  const roles: { role: PlayerRole; score: number }[] = [];
  
  // Check if player has AWP usage patterns
  const awpScore = (stats.firstKills / (stats.deaths || 1)) * 2 + (stats.noScope * 0.5);
  if (awpScore > 0.8 || stats.noScope > 0) {
    roles.push({ role: PlayerRole.AWPer, score: awpScore });
  }
  
  // Only consider IGL role if the player is explicitly in the IGL list
  if (isInIGLList) {
    const iglScore = (stats.assistedFlashes / 10) + (stats.totalUtilityThrown / 400) + (stats.assists / (stats.kills || 1));
    roles.push({ role: PlayerRole.IGL, score: iglScore });
  }
  
  // Check for Spacetaker patterns (boosted K/D importance for non-IGLs)
  const spacetakerScore = (stats.tFirstKills / 15) + (stats.firstKills / (stats.firstDeaths || 1) - 0.5);
  // Add K/D bonus for high performers
  const kdBonus = isInIGLList ? 0 : (stats.kd > 1.2 ? (stats.kd - 1) * 0.6 : 0);
  if (spacetakerScore > 0.6 || kdBonus > 0.3) {
    roles.push({ role: PlayerRole.Spacetaker, score: spacetakerScore + kdBonus });
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
        "Opening Pick Success Rate": stats.tFirstKills / (stats.tFirstKills + stats.tFirstDeaths || 1),
        // Multi Kill Conversion (approximated)
        "Multi Kill Conversion": stats.kills / (stats.totalRoundsWon || 1)
      };

    case PlayerRole.IGL:
      return {
        // Utility Setup Optimization
        "Utility Setup Optimization": (stats.assistedFlashes + stats.heThrown + stats.infernosThrown) / (stats.totalUtilityThrown || 1),
        // Opening Play Success Rate
        "Opening Play Success Rate": stats.tRoundsWon / (stats.totalRoundsWon || 1)
      };

    case PlayerRole.Spacetaker:
      return {
        // Opening Duel Success Rate
        "Opening Duel Success Rate": stats.tFirstKills / (stats.tFirstKills + stats.tFirstDeaths || 1),
        // Aggression Efficiency Index
        "Aggression Efficiency Index": (stats.kills - stats.deaths) / (stats.firstKills + stats.firstDeaths || 1)
      };

    case PlayerRole.Lurker:
      return {
        // Flank Success Rate (using through smoke as a proxy)
        "Flank Success Rate": stats.throughSmoke / (stats.kills || 1),
        // Information Gathering Efficiency (proxy)
        "Information Gathering Efficiency": stats.tRoundsWon / (stats.totalRoundsWon || 1)
      };

    case PlayerRole.Anchor:
      return {
        // Site Hold Success Rate
        "Site Hold Success Rate": stats.ctRoundsWon / (stats.totalRoundsWon || 1),
        // Opponent Entry Denial Rate
        "Opponent Entry Denial Rate": stats.ctFirstKills / (stats.ctFirstDeaths || 1)
      };

    case PlayerRole.Support:
      return {
        // Flash Assist Synergy
        "Flash Assist Synergy": stats.assistedFlashes / (stats.flashesThrown || 1),
        // Utility Setup Efficiency
        "Utility Setup Efficiency": (stats.assistedFlashes) / (stats.totalUtilityThrown || 1)
      };

    default:
      return {
        "Opening Duel Success Rate": 0.5,
        "Aggression Efficiency Index": 0.5
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
 * For high-fragging players (like zywOo), provides a greater weight to K/D
 */
function calculateICF(stats: PlayerRawStats, isIGL: boolean = false): { value: number, sigma: number } {
  // Base calculation
  const sigma = Math.abs(1 - stats.kd) * 2;
  let icf = 1 / (1 + sigma);
  
  // Bonus for high-fragging non-IGLs
  if (!isIGL && stats.kd > 1.3) {
    // Provide a scaling bonus based on how high the K/D is
    const kdBonus = (stats.kd - 1.3) * 0.2;
    icf = Math.min(icf + kdBonus, 0.9); // Cap at 0.9
  }
  
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
        metric: "Flash Assist Synergy"
      };
    case PlayerRole.IGL:
      return { 
        value: (stats.assists / (stats.kills || 1)) * 0.6,
        metric: "In-game Impact Rating"
      };
    case PlayerRole.Spacetaker:
      return { 
        value: (stats.assistedFlashes / (stats.kills || 1)) * 0.7,
        metric: "Utility Effectiveness Score"
      };
    case PlayerRole.Lurker:
      return { 
        value: (stats.throughSmoke / (stats.kills || 1)) * 0.5,
        metric: "Information Retrieval Success"
      };
    case PlayerRole.Anchor:
      return { 
        value: (stats.ctRoundsWon / (stats.totalRoundsWon || 1)) * 0.6,
        metric: "Site Hold Effectiveness"
      };
    case PlayerRole.Support:
      return { 
        value: (stats.assistedFlashes / (stats.totalUtilityThrown || 1)) * 0.9,
        metric: "Utility Contribution Score"
      };
    default:
      return { value: 0.4, metric: "General Impact" };
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
  
  // Hard-coded IGL list as requested
  const iglNames = ["FalleN", "TabseN", "MAJ3R", "Snax", "karrigan", "apEX", "cadiaN", "Aleksib", "Twistzz", "Maka", "chopper", "kyxsan", "electronic", "ztr", "bLitz"];
  
  // Hard-coded AWPer list as requested
  const awperNames = ["dev1ce", "sh1ro", "FalleN", "broky", "zywOo", "Monesy", "w0nderful", "910-", "degster", "torzsi", "REZ", "hyped", "ICY", "woxic"];
  
  // Analyze possible roles for each player
  const playersWithPossibleRoles = rawStats.map(stats => {
    const isInIGLList = iglNames.includes(stats.userName);
    const isInAwperList = awperNames.includes(stats.userName);
    
    // If player is a known AWPer, prioritize that role
    let possibleRoles = evaluatePlayerRoles(stats, isInIGLList);
    if (isInAwperList) {
      // Remove AWPer if it's already in the list
      possibleRoles = possibleRoles.filter(role => role !== PlayerRole.AWPer);
      // Add AWPer as the primary role with a high score
      possibleRoles.unshift(PlayerRole.AWPer);
    }
    
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
    // Give a significant boost to known AWPers
    const awpScore = isInAwperList ? 
      10.0 : // High fixed value for known AWPers
      stats.noScope + (stats.firstKills / (stats.totalRoundsWon || 1) * 5);
    
    return { 
      stats, 
      primaryRole, 
      possibleRoles,
      roleMetrics,
      awpScore,
      isInIGLList,
      isInAwperList
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
    // Find the team's IGL (one per team)
    let iglAssigned = false;
    let iglPlayer = teamPlayers.find(p => p.isInIGLList);
    
    if (iglPlayer) {
      iglAssigned = true;
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
      
      // Special handling for high K/D players - boost PIV for non-IGLs
      // This will help with making zywOo and similar fraggers properly valued
      const kdBonus = player.stats.kd > 1.5 && !player.isInIGLList;
      
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
    const icf = calculateICF(stats, role === PlayerRole.IGL);
    const sc = calculateSC(stats, role);
    const osm = calculateOSM();
    
    // Add a K/D multiplier for star players (1.5+ K/D non-IGLs)
    const kdMultiplier = (role !== PlayerRole.IGL && stats.kd > 1.5) ? 
      1 + ((stats.kd - 1.5) * 0.15) : 1;
    
    const piv = calculatePIV(rcs, icf.value, sc.value, osm) * kdMultiplier;
    
    // Get primary metric for display
    const primaryMetricKey = Object.keys(roleMetrics)[0];
    
    // Calculate role scores
    const roleScores: {[role in PlayerRole]?: number} = {};
    for (const r of Object.values(PlayerRole)) {
      roleScores[r] = r === role ? 0.85 : (r === secondaryRole ? 0.65 : 0.3);
    }
    
    // Create detailed metrics for each role
    const detailedRoleMetrics: Partial<RoleMetrics> = {};
    
    // Convert basic metrics to detailed role-based metrics
    Object.entries(normalizedMetrics).forEach(([key, value]) => {
      detailedRoleMetrics[key as keyof RoleMetrics] = value;
    });
    
    // Calculate top metrics for each role
    const topMetrics: {[role in PlayerRole]?: {metricName: string, value: number}[]} = {};
    
    // For primary and secondary roles, show top 3 metrics
    if (role) {
      topMetrics[role] = Object.entries(detailedRoleMetrics)
        .filter(([key]) => normalizedMetrics[key] !== undefined)
        .map(([key, value]) => ({ metricName: key, value: Number(value.toFixed(2)) }))
        .sort((a, b) => b.value - a.value)
        .slice(0, 3);
    }
    
    if (secondaryRole) {
      // For secondary role, calculate some basic metrics based on stats
      const secondaryRoleMetrics = calculateRoleMetrics(stats, secondaryRole, []);
      topMetrics[secondaryRole] = Object.entries(secondaryRoleMetrics)
        .map(([key, value]) => ({ metricName: key, value: Number(value.toFixed(2)) }))
        .sort((a, b) => b.value - a.value)
        .slice(0, 3);
    }
    
    // Create full player metrics
    const metrics: PlayerMetrics = {
      role,
      secondaryRole,
      roleScores,
      topMetrics,
      roleMetrics: detailedRoleMetrics,
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
      piv: Number((piv || 0).toFixed(2)),
      kd: Number((stats.kd || 0).toFixed(2)),
      primaryMetric: {
        name: primaryMetricKey,
        value: Number(detailedRoleMetrics[primaryMetricKey as keyof RoleMetrics]?.toFixed(2) || "0")
      },
      rawStats: stats,
      metrics
    };
  });
}

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
 * Redesigned to better reward high-performing players
 */
function calculateICF(stats: PlayerRawStats, isIGL: boolean = false): { value: number, sigma: number } {
  // Calculate base sigma - lower values = better consistency
  let sigma = 0;
  
  if (stats.kd >= 1.4) {
    // For star players with high K/D, give a much lower sigma (high consistency)
    sigma = 0.3;
  } else if (stats.kd >= 1.2) {
    // For good players, give a moderately low sigma
    sigma = 0.5;
  } else if (stats.kd >= 1.0) {
    // For average players, standard sigma
    sigma = Math.abs(1 - stats.kd) * 1.2;
  } else {
    // For below average players, higher sigma
    sigma = Math.abs(1 - stats.kd) * 1.8;
  }
  
  // Calculate ICF - normalize to 0-1 range
  let icf = 1 / (1 + sigma);
  
  // Boost for high-performing players
  if (stats.kd > 1.3) {
    // Apply a multiplier based on how much above 1.3 the K/D is
    const boostFactor = 1 + ((stats.kd - 1.3) * 0.5);
    icf = Math.min(icf * boostFactor, 1.0); // Cap at 1.0
  }
  
  // Adjust for IGL role
  if (isIGL) {
    // Less aggressive reduction for IGLs with good K/D
    const reductionFactor = (stats.kd >= 1.2) ? 0.85 : 0.75;
    icf = icf * reductionFactor;
  }
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
      // Rebalanced AWP impact to prevent AWP dominance
      // Reduced weighting of K/D ratio and added utility component
      const awpOpeningKills = stats.firstKills / Math.max(stats.tFirstKills + stats.ctFirstKills, 1);
      const awpKDRating = Math.min(stats.kd / 1.8, 0.85); // Lower cap and normalizing factor
      const awpUtilityImpact = stats.assistedFlashes / Math.max(stats.totalUtilityThrown, 1);
      return { 
        value: (awpOpeningKills * 0.35) + (awpKDRating * 0.35) + (awpUtilityImpact * 0.15) + (kdFactor * 0.15),
        metric: "AWP Impact Rating"
      };
    case PlayerRole.IGL:
      // For IGLs, maintain assist focus but reduce weighting, increase K/D importance
      return { 
        value: (stats.assists / (stats.kills || 1) * 0.4) + (kdFactor * 0.2),
        metric: "In-game Impact Rating"
      };
    case PlayerRole.Spacetaker:
      // For Spacetakers (entry fraggers), heavily reward opening duels and high K/D
      const entrySuccess = stats.tFirstKills / Math.max(stats.tFirstKills + stats.tFirstDeaths, 1);
      const entryKDRating = Math.min(stats.kd / 1.3, 1); // Normalize to 0-1
      return { 
        value: (entrySuccess * 0.5) + (entryKDRating * 0.4) + (kdFactor * 0.1),
        metric: "Entry Impact Rating"
      };
    case PlayerRole.Lurker:
      // For lurkers, reward clutch situations (using K/D as proxy) and smoke kills
      const clutchRating = Math.min(stats.kd / 1.3, 1);
      const smokeImpact = stats.throughSmoke / Math.max(stats.kills, 1);
      return { 
        value: (clutchRating * 0.45) + (smokeImpact * 0.35) + (kdFactor * 0.2),
        metric: "Clutch & Information Rating"
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
 * Calculate Basic Metrics Score based on role
 * This implements the metrics from CS2dkbasics - Roles Metrics Weights
 */
function calculateBasicMetricsScore(stats: PlayerRawStats, role: PlayerRole): number {
  let score = 0;
  
  switch(role) {
    case PlayerRole.IGL:
      // Round Win Rate in Rifle Rounds (using general rounds as proxy)
      const rifleRoundWinRate = stats.totalRoundsWon / Math.max(stats.totalRoundsWon + (stats.deaths - stats.totalRoundsWon), 1);
      score += rifleRoundWinRate * 0.245;
      
      // Utility Usage Efficiency
      const utilEfficiency = stats.assistedFlashes / Math.max(stats.totalUtilityThrown, 1);
      score += utilEfficiency * 0.21;
      
      // Timeout Conversion (using a standard 50% conversion as baseline)
      const timeoutConversion = 0.5; // baseline estimation
      score += timeoutConversion * 0.14;
      
      // Basic Consistency (already calculated in ICF)
      score += 0.105; // will be weighted by actual consistency
      
      // Eco/Force Round Conversion (using a standard 35% conversion as baseline)
      const ecoForceConversion = 0.35; // baseline estimation
      score += ecoForceConversion * 0.15;
      
      // 5v4 Conversion Rate (using 70% baseline)
      const manAdvantageConversion = 0.7; // baseline estimation
      score += manAdvantageConversion * 0.15;
      break;
      
    case PlayerRole.AWP:
      // Rebalanced AWP metrics with lower opening kill impact
      // Opening Kill Ratio - reduced weight from 0.28 to 0.22
      const openingKillRatio = stats.firstKills / Math.max(stats.firstKills + stats.firstDeaths, 1);
      score += openingKillRatio * 0.22;
      
      // Basic Consistency (already calculated in ICF) - reduced weight from 0.205 to 0.18
      score += 0.18; // will be weighted by actual consistency
      
      // AWP Kill Share (assuming 50% of kills are with AWP as baseline)
      const awpKillShare = 0.5; // baseline estimation
      score += awpKillShare * 0.16; // reduced from 0.175
      
      // Multi-Kill Conversion (using K/D as a proxy)
      const multiKillConversion = Math.min(stats.kd, 2) / 2;
      score += multiKillConversion * 0.13; // reduced from 0.14
      
      // Save + Rebuy Efficiency (using a standard 40% save rate as baseline)
      const saveRebuy = 0.4; // baseline estimation
      score += saveRebuy * 0.15;
      
      // Weapon Survival Rate (using a standard survival rate)
      const weaponSurvival = (stats.kills - stats.deaths + stats.assists) / Math.max(stats.kills + stats.assists, 1);
      score += weaponSurvival * 0.05;
      
      // Team Utility Support (new metric to balance AWP score)
      const teamUtilSupport = stats.assistedFlashes / Math.max(stats.totalUtilityThrown, 1);
      score += teamUtilSupport * 0.11;
      break;
      
    case PlayerRole.Spacetaker:
      // Opening Duel Success Rate
      const openingDuelSuccessRate = stats.tFirstKills / Math.max(stats.tFirstKills + stats.tFirstDeaths, 1);
      score += openingDuelSuccessRate * 0.28;
      
      // Trade Kill Involvement (estimated from assists)
      const tradeKillInvolvement = stats.assists / Math.max(stats.kills, 1);
      score += tradeKillInvolvement * 0.175;
      
      // Average Damage per Round (estimated using kills/deaths with 100 dmg per kill)
      const adr = (stats.kills * 100) / Math.max(stats.kills + stats.deaths, 1);
      score += (adr / 200) * 0.14; // Normalize to 0-1 range
      
      // Basic Consistency (already calculated in ICF)
      score += 0.105; // will be weighted by actual consistency
      
      // Headshot Percentage (estimated at 40% baseline)
      const hsPercentage = stats.headshots / Math.max(stats.kills, 1);
      score += hsPercentage * 0.15;
      
      // T-Side KAST (estimated from overall stats)
      const tSideKast = (stats.kills + stats.assists) / Math.max(stats.kills + stats.deaths, 1);
      score += tSideKast * 0.15;
      break;
      
    case PlayerRole.Lurker:
      // 1vX Conversion Rate (using K/D as a proxy)
      const clutchSuccess = Math.min(stats.kd, 2) / 2;
      score += clutchSuccess * 0.21;
      
      // Late-Round Survival Rate (estimated)
      const lateRoundSurvival = stats.kills / Math.max(stats.deaths, 1) * 0.7;
      score += lateRoundSurvival * 0.21;
      
      // KAST (estimated)
      const kast = (stats.kills + stats.assists) / Math.max(stats.kills + stats.deaths, 1);
      score += kast * 0.175;
      
      // Basic Consistency (already calculated in ICF)
      score += 0.105; // will be weighted by actual consistency
      
      // Clutch Rounds Entered (estimated)
      const clutchRoundsEntered = 0.4; // baseline estimation
      score += clutchRoundsEntered * 0.15;
      
      // T-Side K/D Ratio (estimated from overall K/D)
      score += Math.min(stats.kd / 2, 0.5) * 0.15;
      break;
      
    case PlayerRole.Anchor:
      // Site Hold Success Rate (estimated)
      const siteHold = stats.ctRoundsWon / Math.max(stats.ctRoundsWon + stats.ctFirstDeaths, 1);
      score += siteHold * 0.245;
      
      // Multi-Kills on CT (using overall K/D as proxy)
      const ctMultiKills = Math.min(stats.kd, 2) / 2;
      score += ctMultiKills * 0.175;
      
      // CT-Side ADR (estimated)
      const ctADR = (stats.kills * 100) / Math.max(stats.kills + stats.deaths, 1);
      score += (ctADR / 200) * 0.175; 
      
      // Basic Consistency (already calculated in ICF)
      score += 0.105; // will be weighted by actual consistency
      
      // CT-Side KAST (estimated)
      const ctKAST = (stats.kills + stats.assists) / Math.max(stats.kills + stats.deaths, 1);
      score += ctKAST * 0.15;
      
      // CT Utility Efficiency
      const ctUtilityEff = stats.assistedFlashes / Math.max(stats.totalUtilityThrown, 1);
      score += ctUtilityEff * 0.15;
      break;
      
    case PlayerRole.Support:
      // Flash Assist Ratio
      const flashAssistRatio = stats.assistedFlashes / Math.max(stats.flashesThrown, 1);
      score += flashAssistRatio * 0.21;
      
      // Save Rounds / Economy Preservation (estimated)
      const saveRounds = 0.4; // baseline estimation
      score += saveRounds * 0.175;
      
      // Bomb Plant/Defuse Count (estimated from rounds won)
      const bombActivity = stats.totalRoundsWon / 30; // normalized to 0-1 range
      score += bombActivity * 0.175;
      
      // Basic Consistency (already calculated in ICF)
      score += 0.105; // will be weighted by actual consistency
      
      // Non-Flash Utility Impact
      const nonFlashUtility = (stats.totalUtilityThrown - stats.flashesThrown) / Math.max(stats.totalUtilityThrown, 1);
      score += nonFlashUtility * 0.15;
      
      // T-Side Plant Conversion (estimated)
      const tSidePlant = stats.tRoundsWon / Math.max(stats.totalRoundsWon, 1);
      score += tSidePlant * 0.15;
      break;
      
    case PlayerRole.Rotator:
      // Rotation Speed (estimated from CT performance)
      const rotationSpeed = 0.5; // baseline estimation
      score += rotationSpeed * 0.25;
      
      // CT-Side ADR (estimated)
      const rotatorADR = (stats.kills * 100) / Math.max(stats.kills + stats.deaths, 1);
      score += (rotatorADR / 200) * 0.20;
      
      // Multi-Kills After Rotation (using K/D as proxy)
      const rotatorMultiKills = Math.min(stats.kd, 2) / 2;
      score += rotatorMultiKills * 0.15;
      
      // Basic Consistency (already calculated in ICF)
      score += 0.105; // will be weighted by actual consistency
      
      // Flash Assist Ratio
      const rotatorFlashRatio = stats.assistedFlashes / Math.max(stats.flashesThrown, 1);
      score += rotatorFlashRatio * 0.15;
      
      // CT-Side KAST (estimated)
      const rotatorKAST = (stats.kills + stats.assists) / Math.max(stats.kills + stats.deaths, 1);
      score += rotatorKAST * 0.10;
      break;
      
    default:
      score = 0.5; // Default score if no role defined
  }
  
  return score;
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
function calculatePIV(rcs: number, icf: number, sc: number, osm: number, kd: number = 1.0, basicScore: number = 0.5, role: PlayerRole = PlayerRole.Support): number {
  // New calculation with basic metrics integration
  // Reduce advanced metrics (RCS) to 50% weight
  const reducedRCS = rcs * 0.5;
  
  // Add 50% weight from basic metrics
  const combinedRCS = reducedRCS + (basicScore * 0.5);
  
  // Traditional calculation with the combined RCS
  const basePIV = ((combinedRCS * icf) + sc) * osm;
  
  // Add additional K/D influence through the formula itself
  // Significantly increased to better reward star fraggers
  const kdFactor = Math.min(Math.max(kd * 0.25, 0.15), 0.5); // Between 0.15 and 0.5
  
  // Special treatment for exceptional K/D (1.4+)
  const starBonus = (kd >= 1.4) ? (kd - 1.4) * 0.35 : 0;
  
  // Apply role-based balancing modifier to prevent AWP dominance
  let roleModifier = 1.0;
  
  // Set role-specific modifiers to better balance output
  switch(role) {
    case PlayerRole.AWP:
      // Apply a moderate reduction to AWP PIV to balance overall ratings
      roleModifier = 0.90;
      break;
    case PlayerRole.IGL:
      // Slightly boost IGL values to compensate for their often lower K/D
      roleModifier = 1.05;
      break;
    case PlayerRole.Support:
      // Slightly boost Support roles to compensate for lower fragging 
      roleModifier = 1.08;
      break;
    case PlayerRole.Spacetaker:
      // Minor boost for Spacetakers to reward entry fragging
      roleModifier = 1.03;
      break;
    default:
      roleModifier = 1.0;
  }
  
  return basePIV * (1 + kdFactor + starBonus) * roleModifier;
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
    // Debug: Log the actual data structure we're receiving
    console.log('DEBUG - Processing player data:', {
      available_fields: Object.keys(stats),
      userName: stats.userName,
      name: stats.name,
      teamName: stats.teamName,
      team: stats.team,
      kills: stats.kills,
      deaths: stats.deaths,
      adr: stats.adr,
      kd: stats.kd
    });
    
    // Get player name from available fields (handle different field names from Supabase)
    const playerName = stats.userName || stats.name || stats.player_name || stats.displayName;
    
    console.log(`DEBUG - Looking for role info for player: "${playerName}"`);
    
    // Try to find player in role map
    const roleInfo = findPlayerRoleInfo(playerName, roleMap);
    
    if (!roleInfo) {
      console.warn(`No role information found for player ${playerName}, skipping`);
      // Skip players that are not in the role dataset (per user request)
      continue;
    }
    
    console.log(`DEBUG - Found role info for ${playerName}:`, roleInfo);
    
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
  const icf = calculateICF(stats, isIGL);
  const osm = calculateOSM();
  
  // Add a K/D multiplier for star players (1.2+ K/D)
  // Increased coefficient from 0.15 to 0.6 and lowered threshold from 1.5 to 1.2
  // This gives star players a much stronger boost based on their K/D
  const kdMultiplier = (stats.kd > 1.2) ? 
    1 + ((stats.kd - 1.2) * 0.6) : 1;
    
  // Special additional multiplier for extremely high K/D (1.5+)
  const superStarMultiplier = (stats.kd > 1.5) ? 
    1 + ((stats.kd - 1.5) * 0.3) : 1;
    
  // Combined multiplier (apply both factors)
  const combinedKdMultiplier = kdMultiplier * superStarMultiplier;
  
  // Calculate T-side basic metrics and PIV with role parameter
  const tBasicScore = calculateBasicMetricsScore(stats, tRole);
  const tRcs = calculateRCS(tMetrics);
  const tSc = calculateSC(stats, tRole);
  const tPIV = calculatePIV(tRcs, icf.value, tSc.value, osm, stats.kd, tBasicScore, tRole) * combinedKdMultiplier;
  
  // Calculate CT-side basic metrics and PIV with role parameter
  const ctBasicScore = calculateBasicMetricsScore(stats, ctRole);
  const ctRcs = calculateRCS(ctMetrics);
  const ctSc = calculateSC(stats, ctRole);
  const ctPIV = calculatePIV(ctRcs, icf.value, ctSc.value, osm, stats.kd, ctBasicScore, ctRole) * combinedKdMultiplier;
  
  // Calculate IGL metrics and PIV if applicable
  let iglPIV = 0;
  if (isIGL) {
    const iglBasicScore = calculateBasicMetricsScore(stats, PlayerRole.IGL);
    // Use a combined set of metrics for IGL evaluation
    const iglMetrics = { ...ctMetrics, ...tMetrics };
    const iglRcs = calculateRCS(iglMetrics);
    const iglSc = calculateSC(stats, PlayerRole.IGL);
    iglPIV = calculatePIV(iglRcs, icf.value, iglSc.value, osm, stats.kd, iglBasicScore, PlayerRole.IGL) * combinedKdMultiplier;
  }
  
  // Calculate overall PIV based on role weightings
  let piv = 0;
  if (isIGL) {
    // For IGLs: 50% IGL, 25% CT Role, 25% T Role
    piv = (iglPIV * 0.5) + (ctPIV * 0.25) + (tPIV * 0.25);
  } else {
    // For non-IGLs: 50% CT Role, 50% T Role
    piv = (ctPIV * 0.5) + (tPIV * 0.5);
  }
  
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
  
  // Calculate normalized combined metrics for overall view
  const combinedRcs = (isIGL) ? 
    (iglPIV * 0.5 + ctRcs * 0.25 + tRcs * 0.25) : 
    (ctRcs * 0.5 + tRcs * 0.5);
    
  // Create primary role SC
  const primarySc = primaryRole === tRole ? tSc : 
                    primaryRole === ctRole ? ctSc : 
                    isIGL ? { value: 0.8, metric: "Leadership Impact" } : tSc;
  
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
    rcs: { value: combinedRcs, metrics: normalizedMetrics },
    icf: icf,
    sc: primarySc,
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
function findPlayerRoleInfo(playerName: string | undefined, roleMap: Map<string, PlayerRoleInfo>): PlayerRoleInfo | undefined {
  // Null safety check
  if (!playerName || typeof playerName !== 'string' || !roleMap) {
    return undefined;
  }
  
  // Try direct match
  if (roleMap.has(playerName)) {
    return roleMap.get(playerName);
  }
  
  // Convert to arrays for easier iteration
  const entries = Array.from(roleMap.entries());
  
  // Try case-insensitive match
  const lowerPlayerName = playerName.toLowerCase();
  for (const [name, info] of entries) {
    if (name && name.toLowerCase() === lowerPlayerName) {
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
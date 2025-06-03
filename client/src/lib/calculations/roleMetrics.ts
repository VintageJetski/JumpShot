import { PlayerRawStats, PlayerRole } from './types';

/**
 * Calculate role-specific metrics for T side
 */
export function evaluateTSideMetrics(stats: PlayerRawStats, role: PlayerRole): Record<string, number> {
  const metrics: Record<string, number> = {};
  
  switch (role) {
    case PlayerRole.IGL:
      metrics["T-Side Round Win Rate"] = stats.tRoundsWon / Math.max(stats.totalRoundsWon, 1);
      metrics["T-Side Tactical Efficiency"] = stats.tFirstKills / Math.max(stats.tFirstKills + stats.tFirstDeaths, 1);
      metrics["T-Side Utility Coordination"] = stats.tFlashesThrown / Math.max(stats.flashesThrown, 1);
      break;
      
    case PlayerRole.AWP:
      metrics["Opening Pick Success Rate"] = stats.tFirstKills / Math.max(stats.tFirstKills + stats.tFirstDeaths, 1);
      metrics["Multi Kill Conversion"] = stats.awpKills / Math.max(stats.kills, 1);
      metrics["AWPer Flash Assistance"] = stats.assistedFlashes / Math.max(stats.totalUtilityThrown, 1);
      metrics["Utility Punish Rate"] = stats.throughSmoke / Math.max(stats.kills, 1);
      break;
      
    case PlayerRole.Spacetaker:
      metrics["Entry Success Rate"] = stats.tFirstKills / Math.max(stats.tFirstKills + stats.tFirstDeaths, 1);
      metrics["Trade Setup Efficiency"] = stats.tradeKills / Math.max(stats.kills, 1);
      metrics["T-Side Impact Rating"] = (stats.tFirstKills * 2 + stats.kills) / Math.max(stats.tRoundsWon * 5, 1);
      break;
      
    case PlayerRole.Lurker:
      metrics["Solo Kill Rate"] = (stats.kills - stats.tradeKills) / Math.max(stats.kills, 1);
      metrics["Information Gathering"] = stats.throughSmoke / Math.max(stats.kills, 1);
      metrics["Late Round Impact"] = stats.kd; // Proxy for clutch situations
      break;
      
    case PlayerRole.Support:
      metrics["Flash Assistance Rate"] = stats.assistedFlashes / Math.max(stats.totalUtilityThrown, 1);
      metrics["Utility Distribution"] = stats.tFlashesThrown / Math.max(stats.flashesThrown, 1);
      metrics["Team Support Index"] = stats.assists / Math.max(stats.kills + stats.assists, 1);
      break;
      
    default: // Anchor, Rotator (primarily CT roles)
      metrics["T-Side Adaptability"] = stats.tRoundsWon / Math.max(stats.totalRoundsWon, 1);
      metrics["Role Flexibility"] = stats.kd;
      break;
  }
  
  return metrics;
}

/**
 * Calculate role-specific metrics for CT side
 */
export function evaluateCTSideMetrics(stats: PlayerRawStats, role: PlayerRole): Record<string, number> {
  const metrics: Record<string, number> = {};
  
  switch (role) {
    case PlayerRole.IGL:
      metrics["CT-Side Round Win Rate"] = stats.ctRoundsWon / Math.max(stats.totalRoundsWon, 1);
      metrics["Defensive Coordination"] = stats.ctFirstKills / Math.max(stats.ctFirstKills + stats.ctFirstDeaths, 1);
      metrics["CT Utility Management"] = stats.ctFlashesThrown / Math.max(stats.flashesThrown, 1);
      break;
      
    case PlayerRole.AWP:
      metrics["Site Lockdown Rate"] = stats.ctRoundsWon / Math.max(stats.totalRoundsWon, 1);
      metrics["Entry Denial Efficiency"] = stats.ctFirstKills / Math.max(stats.ctFirstKills + stats.ctFirstDeaths, 1);
      metrics["Angle Hold Success"] = stats.kd;
      metrics["Retake Contribution Index"] = stats.awpKills / Math.max(stats.kills, 1);
      break;
      
    case PlayerRole.Anchor:
      metrics["Site Hold Effectiveness"] = stats.ctRoundsWon / Math.max(stats.totalRoundsWon, 1);
      metrics["Solo Defense Rating"] = stats.ctFirstKills / Math.max(stats.firstKills, 1);
      metrics["Anchor Consistency"] = 1 - Math.abs(stats.kd - 1); // Closer to 1.0 K/D = more consistent
      break;
      
    case PlayerRole.Rotator:
      metrics["Rotation Efficiency"] = stats.ctRoundsWon / Math.max(stats.totalRoundsWon, 1);
      metrics["Multi-Site Impact"] = stats.assists / Math.max(stats.kills + stats.assists, 1);
      metrics["CT Flexibility Index"] = stats.ctFirstKills / Math.max(stats.firstKills, 1);
      break;
      
    case PlayerRole.Support:
      metrics["CT Flash Support"] = stats.ctFlashesThrown / Math.max(stats.flashesThrown, 1);
      metrics["Defensive Utility Usage"] = stats.totalUtilityThrown / Math.max(stats.ctRoundsWon, 1);
      metrics["Team Cohesion Factor"] = stats.assistedFlashes / Math.max(stats.totalUtilityThrown, 1);
      break;
      
    default: // Spacetaker, Lurker (primarily T roles)
      metrics["CT-Side Adaptability"] = stats.ctRoundsWon / Math.max(stats.totalRoundsWon, 1);
      metrics["Role Flexibility"] = stats.kd;
      break;
  }
  
  return metrics;
}

/**
 * Get primary role from T and CT roles
 */
export function determinePrimaryRole(tRole: PlayerRole, ctRole: PlayerRole, isIGL: boolean): PlayerRole {
  if (isIGL) return PlayerRole.IGL;
  
  // AWP role takes priority
  if (tRole === PlayerRole.AWP || ctRole === PlayerRole.AWP) {
    return PlayerRole.AWP;
  }
  
  // Prioritize more specialized roles
  const roleImportance = {
    [PlayerRole.IGL]: 7,
    [PlayerRole.AWP]: 6,
    [PlayerRole.Spacetaker]: 5,
    [PlayerRole.Lurker]: 4,
    [PlayerRole.Anchor]: 3,
    [PlayerRole.Rotator]: 2,
    [PlayerRole.Support]: 1
  };
  
  return roleImportance[tRole] >= roleImportance[ctRole] ? tRole : ctRole;
}

/**
 * Normalize metrics to 0-1 scale
 */
export function normalizeMetrics(
  metrics: Record<string, number>, 
  allMetrics: Record<string, number[]>
): Record<string, number> {
  const normalized: Record<string, number> = {};
  
  Object.keys(metrics).forEach(key => {
    const values = allMetrics[key] || [metrics[key]];
    const min = Math.min(...values);
    const max = Math.max(...values);
    
    if (max === min) {
      normalized[key] = 1; // If all values are the same, normalize to 1
    } else {
      normalized[key] = (metrics[key] - min) / (max - min);
    }
  });
  
  return normalized;
}
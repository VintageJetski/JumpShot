import { PlayerPerformanceData, PlayerWithPIV, PlayerRole } from '../shared/supabase-types';

/**
 * Calculate PIV (Player Impact Value) from Supabase data
 * This replaces the old CSV-based PIV calculation
 */
export function calculatePIVFromSupabaseData(playerData: PlayerPerformanceData[]): PlayerWithPIV[] {
  if (!playerData || playerData.length === 0) {
    return [];
  }

  const processedPlayers: PlayerWithPIV[] = [];

  for (const data of playerData) {
    const { player, team, event, killStats, generalStats, utilityStats } = data;

    // Extract key metrics with null safety
    const kills = killStats.kills || 0;
    const deaths = generalStats.deaths || 1; // Avoid division by zero
    const kd = generalStats.kd || (kills / deaths);
    const adr = generalStats.adr_total || 0;
    const kast = generalStats.kast_total || 0;
    const firstKills = killStats.first_kills || 0;
    const headshots = killStats.headshots || 0;
    const awpKills = killStats.awp_kills || 0;
    const utilityDamage = utilityStats.total_util_dmg || 0;
    const totalUtilThrown = utilityStats.total_util_thrown || 0;
    const assistedFlashes = utilityStats.assisted_flashes || 0;

    // Role determination based on statistics
    const role = determinePlayerRole({
      kills,
      awpKills,
      firstKills,
      utilityDamage,
      totalUtilThrown,
      assistedFlashes,
      kd,
      adr
    });

    // PIV calculation components
    const killImpact = calculateKillImpact(kills, firstKills, headshots, awpKills);
    const survivalImpact = calculateSurvivalImpact(kd, kast);
    const utilityImpact = calculateUtilityImpact(utilityDamage, totalUtilThrown, assistedFlashes);
    const consistencyFactor = calculateConsistencyFactor(kd, adr, kast);
    const roleMultiplier = getRoleMultiplier(role, {
      kills,
      firstKills,
      awpKills,
      utilityDamage,
      assistedFlashes
    });

    // Final PIV calculation
    const basePIV = (killImpact * 0.4) + (survivalImpact * 0.3) + (utilityImpact * 0.3);
    const adjustedPIV = basePIV * consistencyFactor * roleMultiplier;
    
    // Normalize to reasonable scale (0-100)
    const finalPIV = Math.min(100, Math.max(0, adjustedPIV * 10));

    processedPlayers.push({
      steamId: player.steam_id,
      name: player.user_name || `Player_${player.steam_id}`,
      team: team?.team_clan_name || 'Unknown Team',
      piv: Math.round(finalPIV * 100) / 100, // Round to 2 decimal places
      role,
      metrics: {
        kd: Math.round(kd * 100) / 100,
        adr: Math.round(adr * 100) / 100,
        kast: Math.round(kast * 100) / 100,
        firstKills,
        utilityDamage,
        headshots
      },
      event: event.event_name
    });
  }

  // Sort by PIV descending
  return processedPlayers.sort((a, b) => b.piv - a.piv);
}

function calculateKillImpact(kills: number, firstKills: number, headshots: number, awpKills: number): number {
  const baseKills = kills * 0.5;
  const firstKillBonus = firstKills * 1.5; // First kills are more valuable
  const headshotBonus = headshots * 0.3;
  const awpBonus = awpKills * 0.8; // AWP kills show skill
  
  return baseKills + firstKillBonus + headshotBonus + awpBonus;
}

function calculateSurvivalImpact(kd: number, kast: number): number {
  const kdImpact = kd * 2;
  const kastImpact = (kast / 100) * 3; // KAST as percentage
  
  return kdImpact + kastImpact;
}

function calculateUtilityImpact(utilityDamage: number, totalUtilThrown: number, assistedFlashes: number): number {
  const damageImpact = (utilityDamage / 100) * 2; // Scale damage appropriately
  const utilityUsage = (totalUtilThrown / 10) * 1.5; // Reward utility usage
  const teamplayImpact = assistedFlashes * 0.8; // Reward team-oriented utility
  
  return damageImpact + utilityUsage + teamplayImpact;
}

function calculateConsistencyFactor(kd: number, adr: number, kast: number): number {
  // Reward consistent performers
  const kdConsistency = kd > 0.8 ? 1.1 : (kd < 0.6 ? 0.9 : 1.0);
  const adrConsistency = adr > 70 ? 1.1 : (adr < 50 ? 0.9 : 1.0);
  const kastConsistency = kast > 70 ? 1.1 : (kast < 60 ? 0.9 : 1.0);
  
  return (kdConsistency + adrConsistency + kastConsistency) / 3;
}

interface PlayerMetrics {
  kills: number;
  firstKills: number;
  awpKills: number;
  utilityDamage: number;
  assistedFlashes: number;
}

function determinePlayerRole(metrics: PlayerMetrics & { kd: number; adr: number }): PlayerRole {
  const { kills, firstKills, awpKills, utilityDamage, assistedFlashes, kd, adr } = metrics;
  
  // AWPer detection - high AWP kills relative to total kills
  if (awpKills > 0 && awpKills / kills > 0.3) {
    return PlayerRole.AWPer;
  }
  
  // Entry fragger - high first kills and good fragging stats
  if (firstKills > 15 && kd > 1.0 && adr > 75) {
    return PlayerRole.Entry;
  }
  
  // Support - high utility usage and team-oriented stats
  if (assistedFlashes > 10 || utilityDamage > 200) {
    return PlayerRole.Support;
  }
  
  // Lurker - decent stats but lower utility usage
  if (kd > 0.9 && utilityDamage < 100 && assistedFlashes < 5) {
    return PlayerRole.Lurker;
  }
  
  // Default to Support for players who don't fit other categories
  return PlayerRole.Support;
}

function getRoleMultiplier(role: PlayerRole, metrics: PlayerMetrics): number {
  switch (role) {
    case PlayerRole.AWPer:
      // Reward AWPers for AWP efficiency and impact
      return 1.1 + (metrics.awpKills / 100);
    
    case PlayerRole.Entry:
      // Reward entry fraggers for first kills
      return 1.05 + (metrics.firstKills / 200);
    
    case PlayerRole.IGL:
      // IGLs get a small boost for leadership (would need additional detection)
      return 1.15;
    
    case PlayerRole.Support:
      // Reward support players for utility impact
      return 1.0 + (metrics.utilityDamage / 1000) + (metrics.assistedFlashes / 100);
    
    case PlayerRole.Lurker:
      // Standard multiplier for lurkers
      return 1.0;
    
    default:
      return 1.0;
  }
}
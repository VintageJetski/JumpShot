import { PlayerRawStats, PlayerRole, RoundData } from './types';
import { calculateEcoForceConversion, calculate5v4Conversion, calculateRifleRoundWinRate } from './economicMetrics';

/**
 * Calculate AWP Kill Share for a player
 */
export function calculateAWPKillShare(stats: PlayerRawStats): number {
  return stats.kills > 0 ? stats.awpKills / stats.kills : 0;
}

/**
 * Calculate Basic Metrics Score based on role using authentic CSV data only
 */
export function calculateBasicMetricsScore(
  stats: PlayerRawStats, 
  role: PlayerRole, 
  rounds: RoundData[]
): number {
  let score = 0;
  
  switch(role) {
    case PlayerRole.IGL:
      // Rifle Round Win Rate (from rounds data)
      const rifleRoundWinRate = calculateRifleRoundWinRate(rounds, stats.teamName);
      score += rifleRoundWinRate * 0.35; // Increased weight (was 0.245)
      
      // Utility Usage Efficiency
      const utilEfficiency = stats.assistedFlashes / Math.max(stats.totalUtilityThrown, 1);
      score += utilEfficiency * 0.30; // Increased weight (was 0.21)
      
      // Eco/Force Round Conversion (from rounds data)
      const ecoForceConversion = calculateEcoForceConversion(rounds, stats.teamName);
      score += ecoForceConversion * 0.21; // Increased weight (was 0.15)
      
      // 5v4 Conversion Rate (from rounds data)
      const manAdvantageConversion = calculate5v4Conversion(rounds, stats.teamName);
      score += manAdvantageConversion * 0.14; // No change (was 0.15)
      
      // Note: Removed Timeout Conversion (0.14) and Basic Consistency (0.105)
      // Weights redistributed proportionally
      break;
      
    case PlayerRole.AWP:
      // Opening Kill Ratio
      const openingKillRatio = stats.firstKills / Math.max(stats.firstKills + stats.firstDeaths, 1);
      score += openingKillRatio * 0.26; // Increased weight (was 0.22)
      
      // AWP Kill Share (authentic calculation)
      const awpKillShare = calculateAWPKillShare(stats);
      score += awpKillShare * 0.19; // Increased weight (was 0.16)
      
      // Multi-Kill Conversion (using K/D as proxy)
      const multiKillConversion = Math.min(stats.kd, 2) / 2;
      score += multiKillConversion * 0.15; // Increased weight (was 0.13)
      
      // Weapon Survival Rate
      const weaponSurvival = (stats.kills - stats.deaths + stats.assists) / Math.max(stats.kills + stats.assists, 1);
      score += Math.max(0, weaponSurvival) * 0.06; // Increased weight (was 0.05)
      
      // Team Utility Support
      const teamUtilSupport = stats.assistedFlashes / Math.max(stats.totalUtilityThrown, 1);
      score += teamUtilSupport * 0.12; // Increased weight (was 0.11)
      
      // 5v4 Advantage Conversion
      const awp5v4Conversion = calculate5v4Conversion(rounds, stats.teamName);
      score += awp5v4Conversion * 0.22; // Increased weight (was 0.15)
      
      // Note: Removed Basic Consistency (0.18) and Save+Rebuy (0.15)
      // Weights redistributed proportionally
      break;
      
    case PlayerRole.Spacetaker:
      // Entry Success Rate
      const entrySuccess = stats.tFirstKills / Math.max(stats.tFirstKills + stats.tFirstDeaths, 1);
      score += entrySuccess * 0.35;
      
      // K/D Performance
      const kdPerformance = Math.min(stats.kd, 2) / 2;
      score += kdPerformance * 0.25;
      
      // Trade Kill Efficiency
      const tradeEfficiency = stats.tradeKills / Math.max(stats.kills, 1);
      score += tradeEfficiency * 0.20;
      
      // 5v4 Advantage Conversion
      const spacetaker5v4 = calculate5v4Conversion(rounds, stats.teamName);
      score += spacetaker5v4 * 0.20;
      break;
      
    case PlayerRole.Lurker:
      // Clutch Performance (using K/D as proxy)
      const clutchPerformance = Math.min(stats.kd, 2) / 2;
      score += clutchPerformance * 0.30;
      
      // Smoke Impact
      const smokeImpact = stats.throughSmoke / Math.max(stats.kills, 1);
      score += smokeImpact * 0.25;
      
      // Solo Kill Efficiency
      const soloKills = stats.kills - stats.tradeKills;
      const soloKillRate = soloKills / Math.max(stats.kills, 1);
      score += soloKillRate * 0.25;
      
      // Economic Round Performance
      const lurkerEcoConversion = calculateEcoForceConversion(rounds, stats.teamName);
      score += lurkerEcoConversion * 0.20;
      break;
      
    case PlayerRole.Anchor:
      // CT Performance
      const ctPerformance = stats.ctRoundsWon / Math.max(stats.totalRoundsWon, 1);
      score += ctPerformance * 0.35;
      
      // Site Hold K/D
      const ctKD = Math.min(stats.kd, 2) / 2;
      score += ctKD * 0.25;
      
      // Rifle Round Win Rate
      const anchorRifleWins = calculateRifleRoundWinRate(rounds, stats.teamName);
      score += anchorRifleWins * 0.25;
      
      // Utility Usage
      const anchorUtilUsage = stats.totalUtilityThrown / Math.max(stats.totalRoundsWon, 1);
      score += Math.min(anchorUtilUsage / 5, 1) * 0.15; // Normalize utility per round
      break;
      
    case PlayerRole.Rotator:
      // Overall Round Win Contribution
      const rotatorWinRate = stats.totalRoundsWon / Math.max(stats.totalRoundsWon + (stats.deaths - stats.totalRoundsWon), 1);
      score += rotatorWinRate * 0.30;
      
      // Balanced Side Performance
      const sideBalance = 1 - Math.abs((stats.ctRoundsWon / Math.max(stats.totalRoundsWon, 1)) - 0.5) * 2;
      score += sideBalance * 0.25;
      
      // Assist Rate
      const assistRate = stats.assists / Math.max(stats.kills + stats.assists, 1);
      score += assistRate * 0.25;
      
      // 5v4 Conversion
      const rotator5v4 = calculate5v4Conversion(rounds, stats.teamName);
      score += rotator5v4 * 0.20;
      break;
      
    case PlayerRole.Support:
      // Flash Assistance
      const flashAssistance = stats.assistedFlashes / Math.max(stats.totalUtilityThrown, 1);
      score += flashAssistance * 0.40;
      
      // Overall Utility Impact
      const utilityImpact = stats.totalUtilityThrown / Math.max(stats.totalRoundsWon, 1);
      score += Math.min(utilityImpact / 6, 1) * 0.25; // Normalize utility per round
      
      // Team Assist Rate
      const teamAssistRate = stats.assists / Math.max(stats.kills + stats.assists, 1);
      score += teamAssistRate * 0.20;
      
      // Economic Round Support
      const supportEcoConversion = calculateEcoForceConversion(rounds, stats.teamName);
      score += supportEcoConversion * 0.15;
      break;
      
    default:
      score = 0.5; // Fallback for unknown roles
  }
  
  return Math.max(0, Math.min(1, score)); // Clamp between 0 and 1
}
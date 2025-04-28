import { PlayerWithPIV, TeamWithTIR, PlayerRole } from "@shared/types";

// Constants for calculation weights
const ROLE_SCORE_WEIGHT = 0.55;
const SYNERGY_WEIGHT = 0.35;
const RISK_WEIGHT = 0.10;

// Constants for synergy components
const ROLE_SIMILARITY_WEIGHT = 0.45;
const MAP_POOL_OVERLAP_WEIGHT = 0.30;
const CHEMISTRY_PROXY_WEIGHT = 0.15;
const MOMENTUM_DELTA_WEIGHT = 0.10;

// Constants for risk factors
const LOW_SAMPLE_RISK_WEIGHT = 0.6;
const TILT_PROXY_WEIGHT = 0.4;

// Scout Metrics Types
export interface ScoutMetrics {
  roleScore: number;
  synergy: number;
  risk: number;
  overall: number;
}

export interface RoleFit {
  primary: number;
  secondary: number;
}

export interface MapComfort {
  [key: string]: number;
}

export interface PlayerScoutData {
  scoutMetrics: ScoutMetrics;
  riskLevel: 'low' | 'medium' | 'high';
  synergyRating: 'bad' | 'fine' | 'good' | 'very good';
  roleFit: RoleFit;
  mapComfort: MapComfort;
}

// Utility functions for normalization and metric calculation
function normalizeValue(value: number, min: number, max: number): number {
  if (max === min) return 50; // Default mid-point if all values are the same
  return ((value - min) / (max - min)) * 100;
}

function getRiskLevel(risk: number): 'low' | 'medium' | 'high' {
  if (risk <= 25) return 'low';
  if (risk <= 50) return 'medium';
  return 'high';
}

function getSynergyRating(synergy: number): 'bad' | 'fine' | 'good' | 'very good' {
  if (synergy < 60) return 'bad';
  if (synergy < 70) return 'fine';
  if (synergy < 80) return 'good';
  return 'very good';
}

// Main calculation functions
export function calculatePlayerScoutData(
  player: PlayerWithPIV,
  team: TeamWithTIR | null,
  allPlayers: PlayerWithPIV[]
): PlayerScoutData {
  // Calculate base metrics
  const roleScore = calculateRoleScore(player, allPlayers);
  const synergy = team ? calculateSynergy(player, team, allPlayers) : 50;
  const risk = calculateRiskScore(player);
  
  // Calculate overall score
  const overall = (roleScore * ROLE_SCORE_WEIGHT) + (synergy * SYNERGY_WEIGHT) - (risk * RISK_WEIGHT);
  
  return {
    scoutMetrics: {
      roleScore,
      synergy,
      risk,
      overall
    },
    riskLevel: getRiskLevel(risk),
    synergyRating: getSynergyRating(synergy),
    roleFit: calculateRoleFit(player, team),
    mapComfort: calculateMapComfort(player)
  };
}

// 1. Universal Housekeeping Metrics
function getPlayerUniversalMetrics(player: PlayerWithPIV): Record<string, number> {
  if (!player.rawStats) {
    return {
      R: 0,
      KAST: 0,
      ADR: 0,
      OKR: 0,
      FlashEff: 0,
      UtilityDmgEff: 0,
      HeadshotPercent: 0,
      AWPShare: 0,
      TradeRatio: 0,
      ClutchPercent: 0
    };
  }
  
  const stats = player.rawStats;
  
  // Calculate rounds played
  const roundsPlayed = (stats.ctRoundsWon + stats.tRoundsWon) || 200; // Default fallback
  
  // Get universal metrics
  return {
    R: roundsPlayed,
    KAST: stats.kastTotal || 0,
    ADR: stats.adrTotal || 0,
    OKR: stats.firstKills / Math.max(1, (stats.firstKills + stats.firstDeaths)),
    FlashEff: stats.assistedFlashes / Math.max(1, stats.totalUtilityThrown),
    UtilityDmgEff: (stats.totalUtilDmg || 0) / Math.max(1, stats.totalUtilityThrown),
    HeadshotPercent: stats.headshots / Math.max(1, stats.kills),
    AWPShare: (stats.awpKills || 0) / Math.max(1, stats.kills),
    TradeRatio: (stats.tradeKills || 1) / Math.max(1, (stats.tradeDeaths || 1)),
    ClutchPercent: 0 // Placeholder until clutch data is available
  };
}

// 2. Role-specific scorecard calculations
function calculateRoleScore(player: PlayerWithPIV, allPlayers: PlayerWithPIV[]): number {
  // Get universal metrics for the player
  const metrics = getPlayerUniversalMetrics(player);
  
  // Check for low sample size
  if (metrics.R < 200) {
    // Find median score in dataset to use as fallback
    const allScores = allPlayers.map(p => p.piv * 100);
    allScores.sort((a, b) => a - b);
    const medianIndex = Math.floor(allScores.length / 2);
    return allScores[medianIndex];
  }
  
  // Calculate role-specific score based on player's primary role
  let roleScore = 0;
  
  switch (player.role) {
    case PlayerRole.IGL:
      // IGL metrics
      roleScore = calculateIGLScore(player, metrics, allPlayers);
      break;
    
    case PlayerRole.AWP:
      // AWP metrics
      roleScore = calculateAWPScore(player, metrics, allPlayers);
      break;
      
    case PlayerRole.Spacetaker:
      // Spacetaker metrics
      roleScore = calculateSpacetakerScore(player, metrics, allPlayers);
      break;
      
    case PlayerRole.Lurker:
      // Lurker metrics
      roleScore = calculateLurkerScore(player, metrics, allPlayers);
      break;
      
    case PlayerRole.Support:
      // Support metrics
      roleScore = calculateSupportScore(player, metrics, allPlayers);
      break;
      
    case PlayerRole.Anchor:
    case PlayerRole.Rotator:
      // Anchor/Rotator metrics
      roleScore = calculateAnchorScore(player, metrics, allPlayers);
      break;
      
    default:
      // Fallback to PIV score
      roleScore = player.piv * 100;
  }
  
  return Math.min(100, Math.max(0, roleScore));
}

function calculateIGLScore(player: PlayerWithPIV, metrics: Record<string, number>, allPlayers: PlayerWithPIV[]): number {
  if (!player.rawStats) return 50;
  
  // Get all metric values from all IGLs for normalization
  const iglPlayers = allPlayers.filter(p => p.role === PlayerRole.IGL && p.rawStats);
  
  // Round win rate rifle v rifle (24.5%)
  const ctRoundsWon = player.rawStats.ctRoundsWon || 0;
  const tRoundsWon = player.rawStats.tRoundsWon || 0;
  const rifleRoundWinRate = ctRoundsWon / Math.max(1, (ctRoundsWon + tRoundsWon));
  const allRifleRoundWinRates = iglPlayers.map(p => {
    const pCtRoundsWon = p.rawStats?.ctRoundsWon || 0;
    const pTRoundsWon = p.rawStats?.tRoundsWon || 0;
    return pCtRoundsWon / Math.max(1, (pCtRoundsWon + pTRoundsWon));
  });
  const normalizedRifleRoundWinRate = normalizeValue(
    rifleRoundWinRate,
    Math.min(...allRifleRoundWinRates),
    Math.max(...allRifleRoundWinRates)
  );
  
  // Utility usage efficiency (21.0%)
  const utilityEfficiency = metrics.FlashEff;
  const allUtilityEfficiencies = iglPlayers.map(p => {
    const m = getPlayerUniversalMetrics(p);
    return m.FlashEff;
  });
  const normalizedUtilityEfficiency = normalizeValue(
    utilityEfficiency,
    Math.min(...allUtilityEfficiencies),
    Math.max(...allUtilityEfficiencies)
  );
  
  // Timeout conversion (14.0%) - using fallback
  const timeoutConversion = 50; // Placeholder
  
  // Basic consistency (10.5%)
  const basicConsistency = 1 / Math.max(0.01, Math.sqrt(
    Math.pow(player.rawStats.adrTotal - 70, 2) +
    Math.pow(player.rawStats.kastTotal - 70, 2) +
    Math.pow(player.rawStats.kd - 1, 2)
  ) / 3);
  const allBasicConsistencies = iglPlayers.map(p => {
    if (!p.rawStats) return 0;
    return 1 / Math.max(0.01, Math.sqrt(
      Math.pow(p.rawStats.adrTotal - 70, 2) +
      Math.pow(p.rawStats.kastTotal - 70, 2) +
      Math.pow(p.rawStats.kd - 1, 2)
    ) / 3);
  });
  const normalizedBasicConsistency = normalizeValue(
    basicConsistency,
    Math.min(...allBasicConsistencies),
    Math.max(...allBasicConsistencies)
  );
  
  // Eco/force conversion (15.0%) - using fallback
  const ecoForceConversion = 50; // Placeholder
  
  // 5v4 conversion (15.0%) - using fallback
  const fiveVFourConversion = 50; // Placeholder
  
  // Calculate weighted score
  return (
    normalizedRifleRoundWinRate * 0.245 +
    normalizedUtilityEfficiency * 0.210 +
    timeoutConversion * 0.140 +
    normalizedBasicConsistency * 0.105 +
    ecoForceConversion * 0.150 +
    fiveVFourConversion * 0.150
  );
}

function calculateAWPScore(player: PlayerWithPIV, metrics: Record<string, number>, allPlayers: PlayerWithPIV[]): number {
  if (!player.rawStats) return 50;
  
  // Get all metric values from all AWPers for normalization
  const awpPlayers = allPlayers.filter(p => p.role === PlayerRole.AWP && p.rawStats);
  
  // Opening kill ratio (28.0%)
  const openingKillRatio = metrics.OKR;
  const allOKRs = awpPlayers.map(p => {
    const m = getPlayerUniversalMetrics(p);
    return m.OKR;
  });
  const normalizedOKR = normalizeValue(
    openingKillRatio,
    Math.min(...allOKRs),
    Math.max(...allOKRs)
  );
  
  // Basic consistency (20.5%)
  // Using K/D standard deviation as a proxy for consistency
  const basicConsistency = player.rawStats.kd;
  const allBasicConsistencies = awpPlayers.map(p => p.rawStats?.kd || 0);
  const normalizedBasicConsistency = normalizeValue(
    basicConsistency,
    Math.min(...allBasicConsistencies),
    Math.max(...allBasicConsistencies)
  );
  
  // AWP kill share (17.5%)
  const awpKillShare = metrics.AWPShare;
  const allAWPShares = awpPlayers.map(p => {
    const m = getPlayerUniversalMetrics(p);
    return m.AWPShare;
  });
  const normalizedAWPShare = normalizeValue(
    awpKillShare,
    Math.min(...allAWPShares),
    Math.max(...allAWPShares)
  );
  
  // CT-side ADR (16.5%)
  const ctSideADR = player.rawStats.adrCtSide || player.rawStats.adrTotal;
  const allCTADRs = awpPlayers.map(p => p.rawStats?.adrCtSide || p.rawStats?.adrTotal || 0);
  const normalizedCTADR = normalizeValue(
    ctSideADR,
    Math.min(...allCTADRs),
    Math.max(...allCTADRs)
  );
  
  // Multi-kill rate (17.5%) - using kills per round as fallback
  const multiKillRate = player.rawStats.kills / metrics.R;
  const allMultiKillRates = awpPlayers.map(p => {
    if (!p.rawStats) return 0;
    const m = getPlayerUniversalMetrics(p);
    return p.rawStats.kills / m.R;
  });
  const normalizedMultiKillRate = normalizeValue(
    multiKillRate,
    Math.min(...allMultiKillRates),
    Math.max(...allMultiKillRates)
  );
  
  // Calculate weighted score
  return (
    normalizedOKR * 0.280 +
    normalizedBasicConsistency * 0.205 +
    normalizedAWPShare * 0.175 +
    normalizedCTADR * 0.165 +
    normalizedMultiKillRate * 0.175
  );
}

function calculateSpacetakerScore(player: PlayerWithPIV, metrics: Record<string, number>, allPlayers: PlayerWithPIV[]): number {
  if (!player.rawStats) return 50;
  
  // Get all spacetakers for normalization
  const spacetakerPlayers = allPlayers.filter(p => p.role === PlayerRole.Spacetaker && p.rawStats);
  
  // First duel success (28.0%)
  const firstDuelSuccess = metrics.OKR;
  const allFirstDuelSuccesses = spacetakerPlayers.map(p => {
    const m = getPlayerUniversalMetrics(p);
    return m.OKR;
  });
  const normalizedFirstDuelSuccess = normalizeValue(
    firstDuelSuccess,
    Math.min(...allFirstDuelSuccesses),
    Math.max(...allFirstDuelSuccesses)
  );
  
  // Impact rating (21.0%)
  const impactRating = (
    player.rawStats.firstKills + 
    (player.rawStats.tradeKills || 0) + 
    (player.rawStats.totalUtilDmg || 0)
  ) / metrics.R;
  const allImpactRatings = spacetakerPlayers.map(p => {
    if (!p.rawStats) return 0;
    const m = getPlayerUniversalMetrics(p);
    return (
      p.rawStats.firstKills + 
      (p.rawStats.tradeKills || 0) + 
      (p.rawStats.totalUtilDmg || 0)
    ) / m.R;
  });
  const normalizedImpactRating = normalizeValue(
    impactRating,
    Math.min(...allImpactRatings),
    Math.max(...allImpactRatings)
  );
  
  // Utility front-load (14.0%)
  const utilityFrontLoad = (player.rawStats.tFlashesThrown + player.rawStats.tSmokesThrown) / metrics.R;
  const allUtilityFrontLoads = spacetakerPlayers.map(p => {
    if (!p.rawStats) return 0;
    const m = getPlayerUniversalMetrics(p);
    return (p.rawStats.tFlashesThrown + p.rawStats.tSmokesThrown) / m.R;
  });
  const normalizedUtilityFrontLoad = normalizeValue(
    utilityFrontLoad,
    Math.min(...allUtilityFrontLoads),
    Math.max(...allUtilityFrontLoads)
  );
  
  // Space-gain damage (10.5%)
  const spaceGainDamage = player.rawStats.adrTSide || player.rawStats.adrTotal;
  const allSpaceGainDamages = spacetakerPlayers.map(p => p.rawStats?.adrTSide || p.rawStats?.adrTotal || 0);
  const normalizedSpaceGainDamage = normalizeValue(
    spaceGainDamage,
    Math.min(...allSpaceGainDamages),
    Math.max(...allSpaceGainDamages)
  );
  
  // Consistency (10.5%) - using K/D as a proxy
  const consistency = player.rawStats.kd;
  const allConsistencies = spacetakerPlayers.map(p => p.rawStats?.kd || 0);
  const normalizedConsistency = normalizeValue(
    consistency,
    Math.min(...allConsistencies),
    Math.max(...allConsistencies)
  );
  
  // CT retake assists (15.0%) - using assisted flashes as proxy
  const ctRetakeAssists = player.rawStats.assistedFlashes / metrics.R;
  const allCTRetakeAssists = spacetakerPlayers.map(p => {
    if (!p.rawStats) return 0;
    const m = getPlayerUniversalMetrics(p);
    return p.rawStats.assistedFlashes / m.R;
  });
  const normalizedCTRetakeAssists = normalizeValue(
    ctRetakeAssists,
    Math.min(...allCTRetakeAssists),
    Math.max(...allCTRetakeAssists)
  );
  
  // Calculate weighted score
  return (
    normalizedFirstDuelSuccess * 0.280 +
    normalizedImpactRating * 0.210 +
    normalizedUtilityFrontLoad * 0.140 +
    normalizedSpaceGainDamage * 0.105 +
    normalizedConsistency * 0.105 +
    normalizedCTRetakeAssists * 0.150
  );
}

function calculateLurkerScore(player: PlayerWithPIV, metrics: Record<string, number>, allPlayers: PlayerWithPIV[]): number {
  if (!player.rawStats) return 50;
  
  // Get all lurkers for normalization
  const lurkerPlayers = allPlayers.filter(p => p.role === PlayerRole.Lurker && p.rawStats);
  
  // Using simplified proxy calculations for lurker-specific metrics
  
  // Trade ratio (17.5%)
  const tradeRatio = metrics.TradeRatio;
  const allTradeRatios = lurkerPlayers.map(p => {
    const m = getPlayerUniversalMetrics(p);
    return m.TradeRatio;
  });
  const normalizedTradeRatio = normalizeValue(
    tradeRatio,
    Math.min(...allTradeRatios),
    Math.max(...allTradeRatios)
  );
  
  // T-side ADR (17.5%)
  const tSideADR = player.rawStats.adrTSide || player.rawStats.adrTotal;
  const allTSideADRs = lurkerPlayers.map(p => p.rawStats?.adrTSide || p.rawStats?.adrTotal || 0);
  const normalizedTSideADR = normalizeValue(
    tSideADR,
    Math.min(...allTSideADRs),
    Math.max(...allTSideADRs)
  );
  
  // Using simplified placeholders for other metrics
  const lateRoundConversion = 60; // Placeholder
  const mapPressure = 50; // Placeholder
  const consistency = player.rawStats.kd;
  const allConsistencies = lurkerPlayers.map(p => p.rawStats?.kd || 0);
  const normalizedConsistency = normalizeValue(
    consistency,
    Math.min(...allConsistencies),
    Math.max(...allConsistencies)
  );
  const postPlantSurvival = 50; // Placeholder
  
  // Calculate weighted score
  return (
    lateRoundConversion * 0.245 +
    normalizedTradeRatio * 0.175 +
    normalizedTSideADR * 0.175 +
    mapPressure * 0.150 +
    normalizedConsistency * 0.105 +
    postPlantSurvival * 0.150
  );
}

function calculateSupportScore(player: PlayerWithPIV, metrics: Record<string, number>, allPlayers: PlayerWithPIV[]): number {
  if (!player.rawStats) return 50;
  
  // Get all supports for normalization
  const supportPlayers = allPlayers.filter(p => p.role === PlayerRole.Support && p.rawStats);
  
  // Flash assist per round (24.5%)
  const flashAssistPerRound = player.rawStats.assistedFlashes / metrics.R;
  const allFlashAssistPerRounds = supportPlayers.map(p => {
    if (!p.rawStats) return 0;
    const m = getPlayerUniversalMetrics(p);
    return p.rawStats.assistedFlashes / m.R;
  });
  const normalizedFlashAssistPerRound = normalizeValue(
    flashAssistPerRound,
    Math.min(...allFlashAssistPerRounds),
    Math.max(...allFlashAssistPerRounds)
  );
  
  // Utility damage efficiency (17.5%)
  const utilityDamageEff = metrics.UtilityDmgEff;
  const allUtilityDamageEffs = supportPlayers.map(p => {
    const m = getPlayerUniversalMetrics(p);
    return m.UtilityDmgEff;
  });
  const normalizedUtilityDamageEff = normalizeValue(
    utilityDamageEff,
    Math.min(...allUtilityDamageEffs),
    Math.max(...allUtilityDamageEffs)
  );
  
  // Trade assists (17.5%) - using trade kills as proxy
  const tradeAssists = player.rawStats.tradeKills || 0 / metrics.R;
  const allTradeAssists = supportPlayers.map(p => {
    if (!p.rawStats) return 0;
    const m = getPlayerUniversalMetrics(p);
    return (p.rawStats.tradeKills || 0) / m.R;
  });
  const normalizedTradeAssists = normalizeValue(
    tradeAssists,
    Math.min(...allTradeAssists),
    Math.max(...allTradeAssists)
  );
  
  // Survival rate (15.0%)
  const survivalRate = 1 - (player.rawStats.deaths / metrics.R);
  const allSurvivalRates = supportPlayers.map(p => {
    if (!p.rawStats) return 0;
    const m = getPlayerUniversalMetrics(p);
    return 1 - (p.rawStats.deaths / m.R);
  });
  const normalizedSurvivalRate = normalizeValue(
    survivalRate,
    Math.min(...allSurvivalRates),
    Math.max(...allSurvivalRates)
  );
  
  // Pistol influence (10.5%) - placeholder
  const pistolInfluence = 50;
  
  // Smoke usage (15.0%)
  const totalSmokes = player.rawStats.tSmokesThrown + player.rawStats.ctSmokesThrown;
  const smokeUsage = totalSmokes / metrics.R;
  const allSmokeUsages = supportPlayers.map(p => {
    if (!p.rawStats) return 0;
    const m = getPlayerUniversalMetrics(p);
    const pTotalSmokes = (p.rawStats.tSmokesThrown || 0) + (p.rawStats.ctSmokesThrown || 0);
    return pTotalSmokes / m.R;
  });
  const normalizedSmokeUsage = normalizeValue(
    smokeUsage,
    Math.min(...allSmokeUsages),
    Math.max(...allSmokeUsages)
  );
  
  // Calculate weighted score
  return (
    normalizedFlashAssistPerRound * 0.245 +
    normalizedUtilityDamageEff * 0.175 +
    normalizedTradeAssists * 0.175 +
    normalizedSurvivalRate * 0.150 +
    pistolInfluence * 0.105 +
    normalizedSmokeUsage * 0.150
  );
}

function calculateAnchorScore(player: PlayerWithPIV, metrics: Record<string, number>, allPlayers: PlayerWithPIV[]): number {
  if (!player.rawStats) return 50;
  
  // Get all anchors for normalization
  const anchorPlayers = allPlayers.filter(p => (p.role === PlayerRole.Anchor || p.role === PlayerRole.Rotator) && p.rawStats);
  
  // Using kill per CT round as proxy for site-hold success (24.5%)
  const siteHoldSuccess = player.rawStats.kills / metrics.R;
  const allSiteHoldSuccesses = anchorPlayers.map(p => {
    if (!p.rawStats) return 0;
    const m = getPlayerUniversalMetrics(p);
    return p.rawStats.kills / m.R;
  });
  const normalizedSiteHoldSuccess = normalizeValue(
    siteHoldSuccess,
    Math.min(...allSiteHoldSuccesses),
    Math.max(...allSiteHoldSuccesses)
  );
  
  // Multi-kills on CT (17.5%) - using kills as proxy
  const multiKillsOnCT = player.rawStats.kills;
  const allMultiKillsOnCT = anchorPlayers.map(p => p.rawStats?.kills || 0);
  const normalizedMultiKillsOnCT = normalizeValue(
    multiKillsOnCT,
    Math.min(...allMultiKillsOnCT),
    Math.max(...allMultiKillsOnCT)
  );
  
  // CT ADR (17.5%)
  const ctADR = player.rawStats.adrCtSide || player.rawStats.adrTotal;
  const allCTADRs = anchorPlayers.map(p => p.rawStats?.adrCtSide || p.rawStats?.adrTotal || 0);
  const normalizedCTADR = normalizeValue(
    ctADR,
    Math.min(...allCTADRs),
    Math.max(...allCTADRs)
  );
  
  // CT KAST (15.0%)
  const ctKAST = player.rawStats.kastCtSide || player.rawStats.kastTotal;
  const allCTKASTs = anchorPlayers.map(p => p.rawStats?.kastCtSide || p.rawStats?.kastTotal || 0);
  const normalizedCTKAST = normalizeValue(
    ctKAST,
    Math.min(...allCTKASTs),
    Math.max(...allCTKASTs)
  );
  
  // CT utility efficiency (15.0%)
  const ctUtilityEff = (player.rawStats.ctTotalUtilDmg || 0) / 
                        Math.max(1, player.rawStats.ctTotalUtilityThrown || player.rawStats.totalUtilityThrown);
  const allCTUtilityEffs = anchorPlayers.map(p => {
    if (!p.rawStats) return 0;
    return (p.rawStats.ctTotalUtilDmg || 0) / 
           Math.max(1, p.rawStats.ctTotalUtilityThrown || p.rawStats.totalUtilityThrown);
  });
  const normalizedCTUtilityEff = normalizeValue(
    ctUtilityEff,
    Math.min(...allCTUtilityEffs),
    Math.max(...allCTUtilityEffs)
  );
  
  // Consistency (10.5%) - using K/D as proxy
  const consistency = player.rawStats.kd;
  const allConsistencies = anchorPlayers.map(p => p.rawStats?.kd || 0);
  const normalizedConsistency = normalizeValue(
    consistency,
    Math.min(...allConsistencies),
    Math.max(...allConsistencies)
  );
  
  // Calculate weighted score
  return (
    normalizedSiteHoldSuccess * 0.245 +
    normalizedMultiKillsOnCT * 0.175 +
    normalizedCTADR * 0.175 +
    normalizedCTKAST * 0.150 +
    normalizedCTUtilityEff * 0.150 +
    normalizedConsistency * 0.105
  );
}

// 3. Team-fit Layer
function calculateSynergy(player: PlayerWithPIV, team: TeamWithTIR, allPlayers: PlayerWithPIV[]): number {
  // Get team players
  const teamPlayers = allPlayers.filter(p => p.team === team.name);
  
  // Role similarity (45%)
  let roleSimilarity = 0;
  const teamRoles = teamPlayers.map(p => p.role);
  const teamTRoles = teamPlayers.map(p => p.tRole);
  const teamCTRoles = teamPlayers.map(p => p.ctRole);
  
  if (teamRoles.includes(player.role)) {
    roleSimilarity = 100; // Perfect role match
  } else if (teamTRoles.includes(player.tRole) || teamCTRoles.includes(player.ctRole)) {
    roleSimilarity = 65; // Secondary role match
  } else {
    roleSimilarity = 0; // No role match
  }
  
  // Map-pool overlap (30%)
  // Simplified implementation - would extract map names from demos
  const mapComfort = calculateMapComfort(player);
  const teamMapComfort = teamPlayers.reduce((acc, p) => {
    const playerMapComfort = calculateMapComfort(p);
    Object.keys(playerMapComfort).forEach(map => {
      if (!acc[map]) acc[map] = 0;
      if (playerMapComfort[map] >= 60) {
        acc[map]++;
      }
    });
    return acc;
  }, {} as Record<string, number>);
  
  // Count shared comfort maps
  let sharedComfortMaps = 0;
  Object.keys(mapComfort).forEach(map => {
    if (mapComfort[map] >= 60 && teamMapComfort[map] > 0) {
      sharedComfortMaps++;
    }
  });
  
  const mapPoolOverlap = (sharedComfortMaps / 7) * 100;
  
  // Chemistry proxy (15%)
  let chemistryProxy = 0;
  
  // Same team history
  if (player.team === team.name) {
    chemistryProxy += 20;
  }
  
  // Played together
  // Simplified - would need to analyze round data
  chemistryProxy += 10;
  
  // Momentum delta (10%)
  // Simplified - would compare recent performance trends
  const momentumDelta = 10;
  
  // Calculate weighted synergy score
  return (
    roleSimilarity * ROLE_SIMILARITY_WEIGHT +
    mapPoolOverlap * MAP_POOL_OVERLAP_WEIGHT +
    chemistryProxy * CHEMISTRY_PROXY_WEIGHT +
    momentumDelta * MOMENTUM_DELTA_WEIGHT
  );
}

// 4. Risk dot
function calculateRiskScore(player: PlayerWithPIV): number {
  if (!player.rawStats) return 50;
  
  // Calculate rounds played
  const roundsPlayed = (player.rawStats.ctRoundsWon + player.rawStats.tRoundsWon) || 0;
  
  // Low-sample risk (60%)
  const lowSampleRisk = 100 - (Math.min(roundsPlayed, 200) / 200) * 100;
  
  // Tilt proxy (40%)
  // Placeholder until voice processing is implemented
  const tiltProxy = 10;
  
  // Calculate weighted risk score
  return (
    lowSampleRisk * LOW_SAMPLE_RISK_WEIGHT +
    tiltProxy * TILT_PROXY_WEIGHT
  );
}

// Utilities for player/team fit
function calculateRoleFit(player: PlayerWithPIV, team: TeamWithTIR | null): RoleFit {
  if (!team) {
    return {
      primary: 100,
      secondary: 65
    };
  }
  
  // Get team roles
  const teamPlayers = team.players || [];
  const teamRoles = teamPlayers.map(p => p.role);
  const teamTRoles = teamPlayers.map(p => p.tRole);
  const teamCTRoles = teamPlayers.map(p => p.ctRole);
  
  // Calculate primary role fit
  const primaryRoleFit = teamRoles.includes(player.role) ? 100 : 0;
  
  // Calculate secondary role fit
  const secondaryRoleFit = (teamTRoles.includes(player.tRole) || teamCTRoles.includes(player.ctRole)) ? 65 : 0;
  
  return {
    primary: primaryRoleFit,
    secondary: secondaryRoleFit
  };
}

function calculateMapComfort(player: PlayerWithPIV): MapComfort {
  if (!player.rawStats) {
    return {
      "ancient": 50,
      "anubis": 50,
      "inferno": 50,
      "mirage": 50,
      "nuke": 50,
      "overpass": 50,
      "vertigo": 50
    };
  }
  
  // In real implementation, would analyze map-specific performance
  // Here using simplified random-based comfort levels
  return {
    "ancient": Math.max(40, Math.min(90, 50 + (player.rawStats.kd * 20))),
    "anubis": Math.max(40, Math.min(90, 50 + (player.rawStats.adrTotal / 10))),
    "inferno": Math.max(40, Math.min(90, 50 + (player.rawStats.kastTotal / 2))),
    "mirage": Math.max(40, Math.min(90, 50 + (player.rawStats.firstKills / 2))),
    "nuke": Math.max(40, Math.min(90, 60 + (player.rawStats.assistedFlashes / 5))),
    "overpass": Math.max(40, Math.min(90, 50 + (player.rawStats.totalUtilityThrown / 20))),
    "vertigo": Math.max(40, Math.min(90, 55 + (player.rawStats.headshots / 10)))
  };
}
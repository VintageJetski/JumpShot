/**
 * Positional Metrics Calculator for CS2 XYZ Data
 * 
 * This module calculates advanced metrics from player positional data based on
 * the CSDK Analysis metric set.
 */

import { RoundPositionalMetrics, PlayerMovementAnalysis, TeamMetrics } from './xyz-data-parser';

// Define map zones for Inferno
// These are approximations of key areas based on XYZ coordinate data
const MAP_ZONES = {
  INFERNO: {
    A_SITE: { minX: 1500, maxX: 2500, minY: 400, maxY: 1500 },
    B_SITE: { minX: -1000, maxX: 0, minY: -1000, maxY: 0 },
    MID: { minX: 0, maxX: 1000, minY: 0, maxY: 1000 },
    T_SPAWN: { minX: -2000, maxX: -1000, minY: -2000, maxY: -1000 },
    CT_SPAWN: { minX: 500, maxX: 1500, minY: 1500, maxY: 2500 },
    BANANA: { minX: -1500, maxX: -500, minY: -500, maxY: 500 },
    APARTMENTS: { minX: 1000, maxX: 2000, minY: 0, maxY: 500 },
  }
};

/**
 * Role-Based Metrics
 */
interface RolePositionalMetrics {
  // General positioning metrics
  positionConsistency: number;
  rotationalEfficiency: number;
  mapCoverage: number;
  
  // AWPer metrics
  sniperLaneControl?: number;
  repositioningSuccessRate?: number;
  
  // Entry/Spacetaker metrics
  entryPathEfficiency?: number;
  tradePositioningScore?: number;
  spaceCreationIndex?: number;
  
  // Support metrics
  utilityPositioningScore?: number;
  supportProximityIndex?: number;
  
  // Lurker metrics
  isolationIndex?: number;
  flankerPositionAdvantage?: number;
  informationGatheringRange?: number;
  
  // IGL metrics (hard to derive from just positional data)
  teamSpreadControl?: number;
  midRoundAdjustmentIndicator?: number;
}

/**
 * Calculate positional metrics for a specific player based on role
 */
export function calculatePlayerRoleMetrics(
  playerData: PlayerMovementAnalysis,
  allPlayers: PlayerMovementAnalysis[],
  mapName: string = 'INFERNO'
): RolePositionalMetrics {
  // Base metrics for all roles
  const metrics: RolePositionalMetrics = {
    positionConsistency: calculatePositionConsistency(playerData),
    rotationalEfficiency: calculateRotationalEfficiency(playerData),
    mapCoverage: calculateMapCoverage(playerData),
  };
  
  // For AWPers (can be inferred from low movement, high angle holding positions)
  if (isLikelyAwper(playerData)) {
    metrics.sniperLaneControl = calculateSniperLaneControl(playerData, mapName);
    metrics.repositioningSuccessRate = calculateRepositioningRate(playerData);
  }
  
  // For Entry/Spacetaker roles (high movement, aggressive positioning)
  if (isLikelyEntryOrSpaceTaker(playerData)) {
    metrics.entryPathEfficiency = calculateEntryPathEfficiency(playerData, mapName);
    metrics.tradePositioningScore = calculateTradePositioningScore(playerData, allPlayers);
    metrics.spaceCreationIndex = calculateSpaceCreationIndex(playerData, allPlayers);
  }
  
  // For Support roles (positioned near teammates)
  if (isLikelySupport(playerData, allPlayers)) {
    metrics.utilityPositioningScore = calculateUtilityPositioningScore(playerData, mapName);
    metrics.supportProximityIndex = calculateSupportProximityIndex(playerData, allPlayers);
  }
  
  // For Lurker roles (isolated movement, flanking positions)
  if (isLikelyLurker(playerData, allPlayers)) {
    metrics.isolationIndex = calculateIsolationIndex(playerData, allPlayers);
    metrics.flankerPositionAdvantage = calculateFlankerAdvantage(playerData, mapName);
    metrics.informationGatheringRange = calculateInfoGatheringRange(playerData, mapName);
  }
  
  return metrics;
}

/**
 * Calculate team-based positional metrics
 */
export function calculateTeamPositionalMetrics(
  teamPlayers: PlayerMovementAnalysis[],
  opposingTeamPlayers: PlayerMovementAnalysis[],
  mapName: string = 'INFERNO'
): Record<string, any> {
  // Calculate team-based metrics
  const metrics = {
    // Team cohesion metrics
    teamCohesionScore: calculateTeamCohesion(teamPlayers),
    averageTeamDistance: calculateAverageTeamDistance(teamPlayers),
    
    // Trade potential metrics
    overallTradeEfficiency: calculateOverallTradeEfficiency(teamPlayers),
    
    // Map control metrics
    mapControlDistribution: calculateMapControlDistribution(teamPlayers, mapName),
    powerPositionControl: calculatePowerPositionControl(teamPlayers, opposingTeamPlayers, mapName),
    
    // Team movement metrics
    movementCoordination: calculateMovementCoordination(teamPlayers),
    rotationTimings: calculateRotationTimings(teamPlayers),
    
    // Attack/defense metrics
    attackExecutionScore: teamPlayers[0]?.side.toLowerCase() === 't' ? 
                           calculateAttackExecutionScore(teamPlayers, mapName) : null,
    defenseSetupQuality: teamPlayers[0]?.side.toLowerCase() === 'ct' ? 
                           calculateDefenseSetupQuality(teamPlayers, mapName) : null,
    
    // Round prediction
    roundWinProbability: calculateRoundWinProbability(teamPlayers, opposingTeamPlayers)
  };
  
  return metrics;
}

/**
 * Helper function implementations
 */

// Position consistency: how consistently a player holds specific positions
function calculatePositionConsistency(player: PlayerMovementAnalysis): number {
  // Calculate variance or clustering of positions
  // Higher value = more consistent positioning
  const positions = player.positionHeatmap;
  
  // Simple implementation: calculate standard deviation of positions
  // Lower std dev = higher consistency
  let totalX = 0, totalY = 0;
  positions.forEach(pos => {
    totalX += pos.x;
    totalY += pos.y;
  });
  
  const avgX = totalX / positions.length;
  const avgY = totalY / positions.length;
  
  let varianceSum = 0;
  positions.forEach(pos => {
    varianceSum += Math.pow(pos.x - avgX, 2) + Math.pow(pos.y - avgY, 2);
  });
  
  const standardDeviation = Math.sqrt(varianceSum / positions.length);
  
  // Invert and normalize to 0-1 scale where 1 = high consistency
  return Math.min(1, Math.max(0, 1 - (standardDeviation / 2000)));
}

// Rotational efficiency: how optimally a player moves between positions
function calculateRotationalEfficiency(player: PlayerMovementAnalysis): number {
  // For simplicity, base this on number of rotations vs distance traveled
  // More efficient rotation = less distance per rotation
  if (player.rotations === 0) return 0;
  
  // Calculate average distance per rotation
  const avgDistPerRotation = player.totalDistance / player.rotations;
  
  // Normalize: Lower distance per rotation = higher efficiency
  // Assuming 500 units is very efficient, 2000+ is inefficient
  return Math.min(1, Math.max(0, 1 - ((avgDistPerRotation - 500) / 1500)));
}

// Map coverage: how much of the map the player controls/observes
function calculateMapCoverage(player: PlayerMovementAnalysis): number {
  // Simplified implementation: based on site presence percentages
  const { ASite, BSite, Mid } = player.sitePresence;
  
  // Calculate weighted map coverage based on site presence
  // This is a simplified approach - ideally we'd use a more precise calculation
  return (ASite + BSite + Mid) / 3;
}

// AWPer role determination
function isLikelyAwper(player: PlayerMovementAnalysis): boolean {
  // AWPers typically have:
  // 1. Lower movement (holding angles)
  // 2. Fewer rotations (more static)
  // 3. High site presence in one area
  const lowMovement = player.avgSpeed < 200;
  const fewRotations = player.rotations < 3;
  const strongSiteHold = Math.max(
    player.sitePresence.ASite, 
    player.sitePresence.BSite, 
    player.sitePresence.Mid
  ) > 0.6;
  
  return lowMovement && (fewRotations || strongSiteHold);
}

// Calculate sniper lane control (for AWPers)
function calculateSniperLaneControl(player: PlayerMovementAnalysis, mapName: string): number {
  // Identify key sniper positions on the map and check if player holds them
  // This is a simplified implementation
  const { positionHeatmap } = player;
  
  // Count positions in key sniper lanes
  let sniperPositionsCount = 0;
  
  // Check CT side angles for Inferno
  if (mapName === 'INFERNO' && player.side.toLowerCase() === 'ct') {
    // B site AWP angles
    const bSiteAwpPositions = positionHeatmap.filter(pos => 
      (pos.x > -1000 && pos.x < -800 && pos.y > -200 && pos.y < 0) || // B site looking at banana
      (pos.x > -1200 && pos.x < -1000 && pos.y > -500 && pos.y < -300)  // Coffins position
    );
    
    // A site AWP angles
    const aSiteAwpPositions = positionHeatmap.filter(pos => 
      (pos.x > 1800 && pos.x < 2000 && pos.y > 500 && pos.y < 700) || // A site looking at apartments
      (pos.x > 1500 && pos.x < 1700 && pos.y > 800 && pos.y < 1000)   // Library position
    );
    
    // Mid AWP angles
    const midAwpPositions = positionHeatmap.filter(pos => 
      (pos.x > 800 && pos.x < 1000 && pos.y > 300 && pos.y < 500)  // Mid looking toward T side
    );
    
    sniperPositionsCount = bSiteAwpPositions.length + aSiteAwpPositions.length + midAwpPositions.length;
  } 
  // T side AWP positions for Inferno
  else if (mapName === 'INFERNO' && player.side.toLowerCase() === 't') {
    // T side AWP positions tend to be more dynamic, but we can identify some
    const tAwpPositions = positionHeatmap.filter(pos => 
      (pos.x > -1500 && pos.x < -1300 && pos.y > -200 && pos.y < 0) || // Top of banana
      (pos.x > 500 && pos.x < 700 && pos.y > -200 && pos.y < 0)       // Mid
    );
    
    sniperPositionsCount = tAwpPositions.length;
  }
  
  // Calculate control as percentage of positions in sniper lanes
  return Math.min(1, sniperPositionsCount / (positionHeatmap.length * 0.3));
}

// Calculate repositioning rate
function calculateRepositioningRate(player: PlayerMovementAnalysis): number {
  // Identify sequences where player moves significantly after being stationary
  // This is a simplified implementation
  const { positionHeatmap } = player;
  
  let repositioningCount = 0;
  let lastStationaryPosition = null;
  
  // Loop through positions to find stationary periods followed by movement
  for (let i = 1; i < positionHeatmap.length; i++) {
    const prevPos = positionHeatmap[i-1];
    const currPos = positionHeatmap[i];
    
    // Calculate distance between consecutive positions
    const distance = Math.sqrt(
      Math.pow(currPos.x - prevPos.x, 2) + 
      Math.pow(currPos.y - prevPos.y, 2)
    );
    
    // If player was previously stationary but now moved significantly
    if (distance > 200 && lastStationaryPosition !== null) {
      repositioningCount++;
      lastStationaryPosition = null;
    } 
    // If player is currently stationary
    else if (distance < 50) {
      lastStationaryPosition = currPos;
    }
  }
  
  // Normalize by total potential repositionings (conservatively 1 per every 10 positions)
  return Math.min(1, repositioningCount / (positionHeatmap.length / 10));
}

// Entry/Spacetaker role determination
function isLikelyEntryOrSpaceTaker(player: PlayerMovementAnalysis): boolean {
  // Entry fraggers typically have:
  // 1. High movement speed
  // 2. Leading positions (ahead of teammates)
  // 3. More presence in contested areas
  const highSpeed = player.avgSpeed > 240;
  const highRotations = player.rotations >= 3;
  
  return player.side.toLowerCase() === 't' && (highSpeed || highRotations);
}

// Calculate entry path efficiency
function calculateEntryPathEfficiency(player: PlayerMovementAnalysis, mapName: string): number {
  // T side metric for optimal entry routes
  if (player.side.toLowerCase() !== 't') return 0;
  
  const { positionHeatmap } = player;
  
  // For Inferno, ideal entry paths avoid excessive exposure
  if (mapName === 'INFERNO') {
    // First, determine if player is entering A or B site
    const aSitePresence = player.sitePresence.ASite;
    const bSitePresence = player.sitePresence.BSite;
    
    if (aSitePresence > bSitePresence) {
      // Check positions for efficient A entry (apartments or short A)
      const efficientAPathPositions = positionHeatmap.filter(pos => 
        // Apartments path
        (pos.x > 1000 && pos.x < 1500 && pos.y > 200 && pos.y < 500) ||
        // Short A path after mid control
        (pos.x > 1000 && pos.x < 1500 && pos.y > 500 && pos.y < 800)
      );
      
      return Math.min(1, efficientAPathPositions.length / (positionHeatmap.length * 0.4));
    } else {
      // Check positions for efficient B entry (banana control)
      const efficientBPathPositions = positionHeatmap.filter(pos => 
        // Banana path - controlled advance
        (pos.x > -1500 && pos.x < -500 && pos.y > -500 && pos.y < 200)
      );
      
      return Math.min(1, efficientBPathPositions.length / (positionHeatmap.length * 0.4));
    }
  }
  
  // Default fallback
  return 0.5;
}

// Calculate trade positioning score
function calculateTradePositioningScore(player: PlayerMovementAnalysis, allPlayers: PlayerMovementAnalysis[]): number {
  // Calculate how well positioned a player is for trading teammates
  // Find teammates (same side)
  const teammates = allPlayers.filter(p => 
    p.side === player.side && p.user_steamid !== player.user_steamid
  );
  
  if (teammates.length === 0) return 0;
  
  // For simplicity, we'll use the average distance to closest teammate as a proxy
  // In a real implementation, you'd analyze proximity over time
  
  let tradePositionScore = 0;
  const positions = player.positionHeatmap;
  
  // Sample positions for analysis (reduce computational load)
  const samplingInterval = Math.max(1, Math.floor(positions.length / 20));
  
  for (let i = 0; i < positions.length; i += samplingInterval) {
    const playerPos = positions[i];
    
    // Find closest teammate at this position
    let minDistance = Infinity;
    
    teammates.forEach(teammate => {
      if (i >= teammate.positionHeatmap.length) return;
      
      const teammatePos = teammate.positionHeatmap[i];
      if (!teammatePos) return;
      
      const distance = Math.sqrt(
        Math.pow(playerPos.x - teammatePos.x, 2) + 
        Math.pow(playerPos.y - teammatePos.y, 2)
      );
      
      minDistance = Math.min(minDistance, distance);
    });
    
    // Ideal trade distance is 200-500 units
    // Too close (< 200): both can be killed by same spray
    // Too far (> 500): can't trade effectively
    if (minDistance >= 200 && minDistance <= 500) {
      tradePositionScore++;
    }
  }
  
  // Normalize by number of sampled positions
  return tradePositionScore / (positions.length / samplingInterval);
}

// Calculate space creation index
function calculateSpaceCreationIndex(player: PlayerMovementAnalysis, allPlayers: PlayerMovementAnalysis[]): number {
  // Calculate how well player creates space for teammates
  // This is a simplified implementation
  
  // Only relevant for T side
  if (player.side.toLowerCase() !== 't') return 0;
  
  // Find teammates (same side)
  const teammates = allPlayers.filter(p => 
    p.side === player.side && p.user_steamid !== player.user_steamid
  );
  
  if (teammates.length === 0) return 0;
  
  // Check if player's positions are consistently ahead of teammates
  // This indicates space creation (leading the push)
  
  let leadingPositionsCount = 0;
  const positions = player.positionHeatmap;
  
  // Sample positions for analysis
  const samplingInterval = Math.max(1, Math.floor(positions.length / 20));
  
  for (let i = 0; i < positions.length; i += samplingInterval) {
    const playerPos = positions[i];
    
    // Check if player is leading the attack (forward position)
    let isLeading = true;
    
    teammates.forEach(teammate => {
      if (i >= teammate.positionHeatmap.length) return;
      
      const teammatePos = teammate.positionHeatmap[i];
      if (!teammatePos) return;
      
      // For Inferno, T side attacks generally move from negative to positive X values
      // Check if player is further ahead in attack direction
      const isPlayerAhead = (
        (player.sitePresence.ASite > player.sitePresence.BSite && playerPos.x > teammatePos.x) || 
        (player.sitePresence.BSite > player.sitePresence.ASite && playerPos.x < teammatePos.x)
      );
      
      if (!isPlayerAhead) {
        isLeading = false;
      }
    });
    
    if (isLeading) {
      leadingPositionsCount++;
    }
  }
  
  // Normalize by number of sampled positions
  return leadingPositionsCount / (positions.length / samplingInterval);
}

// Support role determination
function isLikelySupport(player: PlayerMovementAnalysis, allPlayers: PlayerMovementAnalysis[]): boolean {
  // Support players typically:
  // 1. Stay near teammates
  // 2. Have moderate movement speed
  // 3. Position in supporting roles (not leading, not lurking)
  
  // Calculate average distance to teammates
  const teammates = allPlayers.filter(p => 
    p.side === player.side && p.user_steamid !== player.user_steamid
  );
  
  if (teammates.length === 0) return false;
  
  let totalDistance = 0;
  let sampleCount = 0;
  
  // Sample a few positions to determine average teammate distance
  const positions = player.positionHeatmap;
  const samplingInterval = Math.max(1, Math.floor(positions.length / 10));
  
  for (let i = 0; i < positions.length; i += samplingInterval) {
    const playerPos = positions[i];
    
    teammates.forEach(teammate => {
      if (i >= teammate.positionHeatmap.length) return;
      
      const teammatePos = teammate.positionHeatmap[i];
      if (!teammatePos) return;
      
      const distance = Math.sqrt(
        Math.pow(playerPos.x - teammatePos.x, 2) + 
        Math.pow(playerPos.y - teammatePos.y, 2)
      );
      
      totalDistance += distance;
      sampleCount++;
    });
  }
  
  const avgTeammateDistance = sampleCount > 0 ? totalDistance / sampleCount : Infinity;
  
  // Support players should be relatively close to teammates but not too close
  const isCloseToTeammates = avgTeammateDistance >= 200 && avgTeammateDistance <= 600;
  
  // Support players typically have moderate speed
  const hasModerateSpeed = player.avgSpeed >= 180 && player.avgSpeed <= 250;
  
  return isCloseToTeammates && hasModerateSpeed;
}

// Calculate utility positioning score
function calculateUtilityPositioningScore(player: PlayerMovementAnalysis, mapName: string): number {
  // This would ideally use utility usage data which we don't have in positional data
  // As a proxy, we'll check if player positions align with good utility spots
  
  const { positionHeatmap } = player;
  
  // For Inferno, identify positions where utility usage is effective
  if (mapName === 'INFERNO') {
    const utilityPositions = [];
    
    if (player.side.toLowerCase() === 't') {
      // T side utility positions
      utilityPositions.push(
        // Flash positions for A site
        { x: 1200, y: 400, radius: 150 },
        { x: 1400, y: 600, radius: 150 },
        // Smoke positions for B site
        { x: -1200, y: -200, radius: 150 },
        { x: -1000, y: 0, radius: 150 },
        // Molotov positions
        { x: 1600, y: 700, radius: 150 },
        { x: -800, y: -100, radius: 150 }
      );
    } else {
      // CT side utility positions
      utilityPositions.push(
        // Defensive utility for A site
        { x: 1700, y: 800, radius: 150 },
        { x: 1800, y: 600, radius: 150 },
        // Defensive utility for B site
        { x: -900, y: -100, radius: 150 },
        { x: -1100, y: -300, radius: 150 },
        // Retake utility
        { x: 1500, y: 500, radius: 150 },
        { x: -700, y: 0, radius: 150 }
      );
    }
    
    // Count positions in utility zones
    let utilityPositionCount = 0;
    
    positionHeatmap.forEach(pos => {
      utilityPositions.forEach(utilPos => {
        const distance = Math.sqrt(
          Math.pow(pos.x - utilPos.x, 2) + 
          Math.pow(pos.y - utilPos.y, 2)
        );
        
        if (distance <= utilPos.radius) {
          utilityPositionCount++;
        }
      });
    });
    
    // Normalize by total positions (expecting ~20% in utility positions for a good support)
    return Math.min(1, utilityPositionCount / (positionHeatmap.length * 0.2));
  }
  
  // Default fallback
  return 0.5;
}

// Calculate support proximity index
function calculateSupportProximityIndex(player: PlayerMovementAnalysis, allPlayers: PlayerMovementAnalysis[]): number {
  // Measure how well the player maintains optimal supporting distance to teammates
  // Similar to trade positioning but optimizing for support role
  
  // Find teammates (same side)
  const teammates = allPlayers.filter(p => 
    p.side === player.side && p.user_steamid !== player.user_steamid
  );
  
  if (teammates.length === 0) return 0;
  
  let supportPositionScore = 0;
  const positions = player.positionHeatmap;
  
  // Sample positions for analysis
  const samplingInterval = Math.max(1, Math.floor(positions.length / 20));
  
  for (let i = 0; i < positions.length; i += samplingInterval) {
    const playerPos = positions[i];
    
    // Find closest teammate at this position
    let minDistance = Infinity;
    
    teammates.forEach(teammate => {
      if (i >= teammate.positionHeatmap.length) return;
      
      const teammatePos = teammate.positionHeatmap[i];
      if (!teammatePos) return;
      
      const distance = Math.sqrt(
        Math.pow(playerPos.x - teammatePos.x, 2) + 
        Math.pow(playerPos.y - teammatePos.y, 2)
      );
      
      minDistance = Math.min(minDistance, distance);
    });
    
    // Ideal support distance varies by side
    let isOptimalDistance = false;
    
    if (player.side.toLowerCase() === 't') {
      // T side support: slightly behind entries but close enough to trade
      isOptimalDistance = minDistance >= 200 && minDistance <= 400;
    } else {
      // CT side support: close enough to assist but not in same angle
      isOptimalDistance = minDistance >= 300 && minDistance <= 600;
    }
    
    if (isOptimalDistance) {
      supportPositionScore++;
    }
  }
  
  // Normalize by number of sampled positions
  return supportPositionScore / (positions.length / samplingInterval);
}

// Lurker role determination
function isLikelyLurker(player: PlayerMovementAnalysis, allPlayers: PlayerMovementAnalysis[]): boolean {
  // Lurkers typically:
  // 1. Stay far from teammates
  // 2. Have strategic positioning away from main team
  // 3. Primarily a T side role
  
  if (player.side.toLowerCase() !== 't') return false;
  
  // Calculate average distance to teammates
  const teammates = allPlayers.filter(p => 
    p.side === player.side && p.user_steamid !== player.user_steamid
  );
  
  if (teammates.length === 0) return false;
  
  let totalDistance = 0;
  let sampleCount = 0;
  
  // Sample positions to determine average teammate distance
  const positions = player.positionHeatmap;
  const samplingInterval = Math.max(1, Math.floor(positions.length / 10));
  
  for (let i = 0; i < positions.length; i += samplingInterval) {
    const playerPos = positions[i];
    
    teammates.forEach(teammate => {
      if (i >= teammate.positionHeatmap.length) return;
      
      const teammatePos = teammate.positionHeatmap[i];
      if (!teammatePos) return;
      
      const distance = Math.sqrt(
        Math.pow(playerPos.x - teammatePos.x, 2) + 
        Math.pow(playerPos.y - teammatePos.y, 2)
      );
      
      totalDistance += distance;
      sampleCount++;
    });
  }
  
  const avgTeammateDistance = sampleCount > 0 ? totalDistance / sampleCount : 0;
  
  // Lurkers should be relatively far from teammates
  const isFarFromTeammates = avgTeammateDistance > 800;
  
  // Lurkers often have fewer rotations as they commit to an area
  const hasFewRotations = player.rotations <= 2;
  
  return isFarFromTeammates || hasFewRotations;
}

// Calculate isolation index for lurkers
function calculateIsolationIndex(player: PlayerMovementAnalysis, allPlayers: PlayerMovementAnalysis[]): number {
  // Measure how effectively the player isolates from teammates for lurking
  // Only relevant for T side
  if (player.side.toLowerCase() !== 't') return 0;
  
  // Calculate average distance to teammates over time
  const teammates = allPlayers.filter(p => 
    p.side === player.side && p.user_steamid !== player.user_steamid
  );
  
  if (teammates.length === 0) return 0;
  
  let totalDistanceScore = 0;
  const positions = player.positionHeatmap;
  
  // Sample positions for analysis
  const samplingInterval = Math.max(1, Math.floor(positions.length / 20));
  
  for (let i = 0; i < positions.length; i += samplingInterval) {
    const playerPos = positions[i];
    
    // Find average distance to all teammates at this position
    let totalDistance = 0;
    let teammateCount = 0;
    
    teammates.forEach(teammate => {
      if (i >= teammate.positionHeatmap.length) return;
      
      const teammatePos = teammate.positionHeatmap[i];
      if (!teammatePos) return;
      
      const distance = Math.sqrt(
        Math.pow(playerPos.x - teammatePos.x, 2) + 
        Math.pow(playerPos.y - teammatePos.y, 2)
      );
      
      totalDistance += distance;
      teammateCount++;
    });
    
    const avgDistance = teammateCount > 0 ? totalDistance / teammateCount : 0;
    
    // Ideal lurk distance is 800-1500 units
    // Too close: not effectively lurking
    // Too far: not useful for the team
    if (avgDistance >= 800 && avgDistance <= 1500) {
      totalDistanceScore++;
    }
  }
  
  // Normalize by number of sampled positions
  return totalDistanceScore / (positions.length / samplingInterval);
}

// Calculate flanker advantage
function calculateFlankerAdvantage(player: PlayerMovementAnalysis, mapName: string): number {
  // Measure how effectively the player positions for flanking opportunities
  // Only relevant for T side
  if (player.side.toLowerCase() !== 't') return 0;
  
  const { positionHeatmap } = player;
  
  // For Inferno, identify positions that are good for flanking
  if (mapName === 'INFERNO') {
    // Define flanking positions
    const flankingPositions = [
      // Mid to A flanks
      { x: 1000, y: 500, radius: 200 },
      { x: 1200, y: 700, radius: 200 },
      // Mid to B flanks
      { x: 0, y: 0, radius: 200 },
      { x: -500, y: 200, radius: 200 },
      // Deep flanks from T spawn
      { x: -1500, y: -1500, radius: 200 },
      { x: -1000, y: -1000, radius: 200 }
    ];
    
    // Count positions in flanking zones
    let flankingPositionCount = 0;
    
    positionHeatmap.forEach(pos => {
      flankingPositions.forEach(flankPos => {
        const distance = Math.sqrt(
          Math.pow(pos.x - flankPos.x, 2) + 
          Math.pow(pos.y - flankPos.y, 2)
        );
        
        if (distance <= flankPos.radius) {
          flankingPositionCount++;
        }
      });
    });
    
    // Normalize by total positions (expecting ~30% in flanking positions for a good lurker)
    return Math.min(1, flankingPositionCount / (positionHeatmap.length * 0.3));
  }
  
  // Default fallback
  return 0.5;
}

// Calculate information gathering range
function calculateInfoGatheringRange(player: PlayerMovementAnalysis, mapName: string): number {
  // Measure how much map information the player's positions could gather
  // This is a simplified implementation
  
  const { positionHeatmap } = player;
  
  // For Inferno, calculate coverage of key information areas
  if (mapName === 'INFERNO') {
    // Define information gathering areas
    const infoAreas = [];
    
    if (player.side.toLowerCase() === 't') {
      // T side info areas
      infoAreas.push(
        // Mid control info
        { x: 500, y: 0, radius: 200 },
        { x: 800, y: 300, radius: 200 },
        // Banana control info
        { x: -1200, y: -200, radius: 200 },
        { x: -900, y: 0, radius: 200 },
        // Apps control info
        { x: 1200, y: 400, radius: 200 },
        { x: 1500, y: 600, radius: 200 }
      );
    } else {
      // CT side info areas
      infoAreas.push(
        // A site info
        { x: 1700, y: 700, radius: 200 },
        { x: 1500, y: 900, radius: 200 },
        // B site info
        { x: -900, y: -100, radius: 200 },
        { x: -1100, y: -300, radius: 200 },
        // Mid info
        { x: 700, y: 300, radius: 200 },
        { x: 900, y: 500, radius: 200 }
      );
    }
    
    // Count unique info areas visited
    const visitedInfoAreas = new Set();
    
    positionHeatmap.forEach(pos => {
      infoAreas.forEach((infoArea, index) => {
        const distance = Math.sqrt(
          Math.pow(pos.x - infoArea.x, 2) + 
          Math.pow(pos.y - infoArea.y, 2)
        );
        
        if (distance <= infoArea.radius) {
          visitedInfoAreas.add(index);
        }
      });
    });
    
    // Normalize by total info areas
    return visitedInfoAreas.size / infoAreas.length;
  }
  
  // Default fallback
  return 0.5;
}

/**
 * Team-based metric calculations
 */

// Calculate team cohesion
function calculateTeamCohesion(teamPlayers: PlayerMovementAnalysis[]): number {
  // Measure how well the team stays within effective ranges of each other
  // This is a simplified implementation
  
  if (teamPlayers.length <= 1) return 0;
  
  // Calculate average distance between players over time
  let totalDistanceScore = 0;
  let sampleCount = 0;
  
  // Determine maximum samples to analyze
  const maxSamples = Math.min(...teamPlayers.map(p => p.positionHeatmap.length));
  const samplingInterval = Math.max(1, Math.floor(maxSamples / 20));
  
  // Sample positions for analysis
  for (let i = 0; i < maxSamples; i += samplingInterval) {
    let pairwiseDistanceSum = 0;
    let pairCount = 0;
    
    // Calculate pairwise distances
    for (let j = 0; j < teamPlayers.length; j++) {
      for (let k = j + 1; k < teamPlayers.length; k++) {
        const playerJ = teamPlayers[j];
        const playerK = teamPlayers[k];
        
        if (i >= playerJ.positionHeatmap.length || i >= playerK.positionHeatmap.length) continue;
        
        const posJ = playerJ.positionHeatmap[i];
        const posK = playerK.positionHeatmap[i];
        
        const distance = Math.sqrt(
          Math.pow(posJ.x - posK.x, 2) + 
          Math.pow(posJ.y - posK.y, 2)
        );
        
        pairwiseDistanceSum += distance;
        pairCount++;
      }
    }
    
    if (pairCount > 0) {
      const avgDistance = pairwiseDistanceSum / pairCount;
      
      // Evaluate based on side and map
      const isTSide = teamPlayers[0].side.toLowerCase() === 't';
      
      let optimalDistance;
      if (isTSide) {
        // T side optimal distance: closer together for executes
        optimalDistance = avgDistance >= 300 && avgDistance <= 800;
      } else {
        // CT side optimal distance: more spread for site coverage
        optimalDistance = avgDistance >= 500 && avgDistance <= 1200;
      }
      
      if (optimalDistance) {
        totalDistanceScore++;
      }
      
      sampleCount++;
    }
  }
  
  // Normalize by sample count
  return sampleCount > 0 ? totalDistanceScore / sampleCount : 0;
}

// Calculate average team distance
function calculateAverageTeamDistance(teamPlayers: PlayerMovementAnalysis[]): number {
  // Simple average of the distances between team players
  if (teamPlayers.length <= 1) return 0;
  
  // Helper function to get player position at a specific sample
  const getPositionAt = (player: PlayerMovementAnalysis, index: number) => {
    if (index >= player.positionHeatmap.length) return null;
    return player.positionHeatmap[index];
  };
  
  // Determine maximum samples to analyze
  const maxSamples = Math.min(...teamPlayers.map(p => p.positionHeatmap.length));
  const samplingInterval = Math.max(1, Math.floor(maxSamples / 10));
  
  let totalDistance = 0;
  let sampleCount = 0;
  
  // Sample positions for analysis
  for (let i = 0; i < maxSamples; i += samplingInterval) {
    let pairwiseDistanceSum = 0;
    let pairCount = 0;
    
    // Calculate pairwise distances
    for (let j = 0; j < teamPlayers.length; j++) {
      for (let k = j + 1; k < teamPlayers.length; k++) {
        const posJ = getPositionAt(teamPlayers[j], i);
        const posK = getPositionAt(teamPlayers[k], i);
        
        if (!posJ || !posK) continue;
        
        const distance = Math.sqrt(
          Math.pow(posJ.x - posK.x, 2) + 
          Math.pow(posJ.y - posK.y, 2)
        );
        
        pairwiseDistanceSum += distance;
        pairCount++;
      }
    }
    
    if (pairCount > 0) {
      totalDistance += pairwiseDistanceSum / pairCount;
      sampleCount++;
    }
  }
  
  return sampleCount > 0 ? totalDistance / sampleCount : 0;
}

// Calculate trade efficiency
function calculateOverallTradeEfficiency(teamPlayers: PlayerMovementAnalysis[]): number {
  // Measures how well positioned players are for trading
  if (teamPlayers.length <= 1) return 0;
  
  // Helper function to get player position at a specific sample
  const getPositionAt = (player: PlayerMovementAnalysis, index: number) => {
    if (index >= player.positionHeatmap.length) return null;
    return player.positionHeatmap[index];
  };
  
  // Determine maximum samples to analyze
  const maxSamples = Math.min(...teamPlayers.map(p => p.positionHeatmap.length));
  const samplingInterval = Math.max(1, Math.floor(maxSamples / 20));
  
  let tradablePositionsCount = 0;
  let totalPositionsChecked = 0;
  
  // Sample positions for analysis
  for (let i = 0; i < maxSamples; i += samplingInterval) {
    for (let j = 0; j < teamPlayers.length; j++) {
      const posJ = getPositionAt(teamPlayers[j], i);
      if (!posJ) continue;
      
      let isTradable = false;
      
      // Check if this player is tradable by at least one teammate
      for (let k = 0; k < teamPlayers.length; k++) {
        if (j === k) continue;
        
        const posK = getPositionAt(teamPlayers[k], i);
        if (!posK) continue;
        
        const distance = Math.sqrt(
          Math.pow(posJ.x - posK.x, 2) + 
          Math.pow(posJ.y - posK.y, 2)
        );
        
        // Ideal trade distance is 200-600 units
        if (distance >= 200 && distance <= 600) {
          isTradable = true;
          break;
        }
      }
      
      if (isTradable) {
        tradablePositionsCount++;
      }
      
      totalPositionsChecked++;
    }
  }
  
  // Normalize by total positions checked
  return totalPositionsChecked > 0 ? tradablePositionsCount / totalPositionsChecked : 0;
}

// Calculate map control distribution
function calculateMapControlDistribution(teamPlayers: PlayerMovementAnalysis[], mapName: string): Record<string, number> {
  // Aggregates site presence for the team
  if (teamPlayers.length === 0) {
    return { ASite: 0, BSite: 0, Mid: 0 };
  }
  
  // Calculate average site presence across all team players
  const teamSitePresence = {
    ASite: 0,
    BSite: 0,
    Mid: 0
  };
  
  teamPlayers.forEach(player => {
    teamSitePresence.ASite += player.sitePresence.ASite;
    teamSitePresence.BSite += player.sitePresence.BSite;
    teamSitePresence.Mid += player.sitePresence.Mid;
  });
  
  // Normalize by player count
  Object.keys(teamSitePresence).forEach(site => {
    teamSitePresence[site] /= teamPlayers.length;
  });
  
  return teamSitePresence;
}

// Calculate power position control
function calculatePowerPositionControl(
  teamPlayers: PlayerMovementAnalysis[], 
  opposingTeamPlayers: PlayerMovementAnalysis[],
  mapName: string
): number {
  // Measures control of key power positions on the map
  if (teamPlayers.length === 0) return 0;
  
  // Define power positions for the map
  const powerPositions = [];
  
  if (mapName === 'INFERNO') {
    // Power positions for Inferno
    powerPositions.push(
      // A site
      { x: 1800, y: 700, radius: 150, name: 'A Site Default' },
      { x: 1600, y: 900, radius: 150, name: 'Library' },
      // B site
      { x: -950, y: -150, radius: 150, name: 'B Site Default' },
      { x: -1200, y: -300, radius: 150, name: 'Coffins' },
      // Mid
      { x: 800, y: 400, radius: 150, name: 'Mid Control' },
      { x: 500, y: 200, radius: 150, name: 'Bottom Mid' }
    );
  }
  
  if (powerPositions.length === 0) return 0;
  
  // Calculate control percentage for each power position
  const powerPositionControl = [];
  
  powerPositions.forEach(powerPos => {
    let teamControlCount = 0;
    let opposingTeamControlCount = 0;
    
    // Check team control
    teamPlayers.forEach(player => {
      player.positionHeatmap.forEach(pos => {
        const distance = Math.sqrt(
          Math.pow(pos.x - powerPos.x, 2) + 
          Math.pow(pos.y - powerPos.y, 2)
        );
        
        if (distance <= powerPos.radius) {
          teamControlCount++;
        }
      });
    });
    
    // Check opposing team control
    opposingTeamPlayers.forEach(player => {
      player.positionHeatmap.forEach(pos => {
        const distance = Math.sqrt(
          Math.pow(pos.x - powerPos.x, 2) + 
          Math.pow(pos.y - powerPos.y, 2)
        );
        
        if (distance <= powerPos.radius) {
          opposingTeamControlCount++;
        }
      });
    });
    
    // Calculate control percentage
    const totalControl = teamControlCount + opposingTeamControlCount;
    const controlPercentage = totalControl > 0 ? teamControlCount / totalControl : 0;
    
    powerPositionControl.push({
      position: powerPos.name,
      control: controlPercentage
    });
  });
  
  // Average control across all power positions
  const avgPowerPositionControl = powerPositionControl.reduce(
    (sum, pos) => sum + pos.control, 0
  ) / powerPositionControl.length;
  
  return avgPowerPositionControl;
}

// Calculate movement coordination
function calculateMovementCoordination(teamPlayers: PlayerMovementAnalysis[]): number {
  // Measures how coordinated player movements are
  if (teamPlayers.length <= 1) return 0;
  
  // Helper function to get player movement vector at a specific sample
  const getMovementVectorAt = (player: PlayerMovementAnalysis, index: number) => {
    if (index >= player.positionHeatmap.length - 1) return null;
    
    const pos1 = player.positionHeatmap[index];
    const pos2 = player.positionHeatmap[index + 1];
    
    return {
      x: pos2.x - pos1.x,
      y: pos2.y - pos1.y
    };
  };
  
  // Determine maximum samples to analyze
  const maxSamples = Math.min(...teamPlayers.map(p => p.positionHeatmap.length)) - 1;
  const samplingInterval = Math.max(1, Math.floor(maxSamples / 20));
  
  let coordinationScore = 0;
  let sampleCount = 0;
  
  // Sample movement vectors for analysis
  for (let i = 0; i < maxSamples; i += samplingInterval) {
    const movementVectors = [];
    
    // Collect movement vectors for all players
    for (let j = 0; j < teamPlayers.length; j++) {
      const vector = getMovementVectorAt(teamPlayers[j], i);
      if (vector) {
        movementVectors.push(vector);
      }
    }
    
    if (movementVectors.length <= 1) continue;
    
    // Calculate average movement direction
    const avgVector = {
      x: movementVectors.reduce((sum, v) => sum + v.x, 0) / movementVectors.length,
      y: movementVectors.reduce((sum, v) => sum + v.y, 0) / movementVectors.length
    };
    
    // Calculate magnitude of average vector
    const avgMagnitude = Math.sqrt(avgVector.x * avgVector.x + avgVector.y * avgVector.y);
    
    if (avgMagnitude === 0) continue;
    
    // Normalize average vector
    const normalizedAvg = {
      x: avgVector.x / avgMagnitude,
      y: avgVector.y / avgMagnitude
    };
    
    // Calculate dot products with normalized average
    let totalAlignment = 0;
    
    movementVectors.forEach(vector => {
      const magnitude = Math.sqrt(vector.x * vector.x + vector.y * vector.y);
      
      if (magnitude === 0) return;
      
      const normalized = {
        x: vector.x / magnitude,
        y: vector.y / magnitude
      };
      
      // Calculate dot product (alignment)
      const alignment = normalized.x * normalizedAvg.x + normalized.y * normalizedAvg.y;
      
      // Alignment ranges from -1 (opposite) to 1 (same direction)
      // Rescale to 0-1
      const alignmentScore = (alignment + 1) / 2;
      
      totalAlignment += alignmentScore;
    });
    
    coordinationScore += totalAlignment / movementVectors.length;
    sampleCount++;
  }
  
  // Normalize by sample count
  return sampleCount > 0 ? coordinationScore / sampleCount : 0;
}

// Calculate rotation timings
function calculateRotationTimings(teamPlayers: PlayerMovementAnalysis[]): number {
  // Measures how well timed rotations are between team members
  // This is a simplified implementation that looks for synchronized movements
  if (teamPlayers.length <= 1) return 0;
  
  // Helper function to detect site changes
  const detectSiteChange = (player: PlayerMovementAnalysis, startIdx: number, endIdx: number) => {
    if (startIdx >= player.positionHeatmap.length || endIdx >= player.positionHeatmap.length) {
      return false;
    }
    
    const startPos = player.positionHeatmap[startIdx];
    const endPos = player.positionHeatmap[endIdx];
    
    // Define sites for Inferno
    const inSiteA = (pos: {x: number, y: number}) => 
      pos.x > 1500 && pos.x < 2500 && pos.y > 500 && pos.y < 1500;
    
    const inSiteB = (pos: {x: number, y: number}) => 
      pos.x > -1000 && pos.x < 0 && pos.y > -1000 && pos.y < 0;
    
    const inMid = (pos: {x: number, y: number}) => 
      pos.x > 0 && pos.x < 1000 && pos.y > 0 && pos.y < 1000;
    
    // Check if player moved from one site to another
    const startSite = inSiteA(startPos) ? 'A' : inSiteB(startPos) ? 'B' : inMid(startPos) ? 'Mid' : 'Other';
    const endSite = inSiteA(endPos) ? 'A' : inSiteB(endPos) ? 'B' : inMid(endPos) ? 'Mid' : 'Other';
    
    return startSite !== endSite && startSite !== 'Other' && endSite !== 'Other';
  };
  
  // Determine maximum samples to analyze
  const maxSamples = Math.min(...teamPlayers.map(p => p.positionHeatmap.length));
  
  // We'll check for rotations with a larger window size
  const rotationWindowSize = Math.floor(maxSamples / 5);
  
  let synchronizedRotations = 0;
  let totalRotations = 0;
  
  // Look for rotations in segments
  for (let windowStart = 0; windowStart < maxSamples - rotationWindowSize; windowStart += rotationWindowSize) {
    const windowEnd = windowStart + rotationWindowSize;
    
    // Count players rotating in this window
    let rotatingPlayers = 0;
    
    teamPlayers.forEach(player => {
      if (detectSiteChange(player, windowStart, windowEnd)) {
        rotatingPlayers++;
      }
    });
    
    if (rotatingPlayers > 0) {
      // Calculate how synchronized the rotation is
      const synchronization = rotatingPlayers / teamPlayers.length;
      
      // Add weighted contribution to the score
      synchronizedRotations += synchronization * rotatingPlayers;
      totalRotations += rotatingPlayers;
    }
  }
  
  // Normalize by total rotations
  return totalRotations > 0 ? synchronizedRotations / totalRotations : 0;
}

// Calculate attack execution score for T side
function calculateAttackExecutionScore(teamPlayers: PlayerMovementAnalysis[], mapName: string): number {
  // Measures how well coordinated the team's attack executes are
  if (teamPlayers.length === 0 || teamPlayers[0].side.toLowerCase() !== 't') {
    return 0;
  }
  
  // Determine maximum samples to analyze
  const maxSamples = Math.min(...teamPlayers.map(p => p.positionHeatmap.length));
  const samplingInterval = Math.max(1, Math.floor(maxSamples / 20));
  
  // Define site entry areas for Inferno
  const aSiteEntry = { x: 1700, y: 700, radius: 300 };
  const bSiteEntry = { x: -800, y: -100, radius: 300 };
  
  let executionScore = 0;
  
  // Sample positions for analysis
  for (let i = 0; i < maxSamples; i += samplingInterval) {
    // Count players in A site entry area
    let playersInASite = 0;
    let playersInBSite = 0;
    
    teamPlayers.forEach(player => {
      if (i >= player.positionHeatmap.length) return;
      
      const pos = player.positionHeatmap[i];
      
      // Check if in A site entry
      const distanceToASite = Math.sqrt(
        Math.pow(pos.x - aSiteEntry.x, 2) + 
        Math.pow(pos.y - aSiteEntry.y, 2)
      );
      
      if (distanceToASite <= aSiteEntry.radius) {
        playersInASite++;
      }
      
      // Check if in B site entry
      const distanceToBSite = Math.sqrt(
        Math.pow(pos.x - bSiteEntry.x, 2) + 
        Math.pow(pos.y - bSiteEntry.y, 2)
      );
      
      if (distanceToBSite <= bSiteEntry.radius) {
        playersInBSite++;
      }
    });
    
    // Calculate execution score for this sample
    const maxPlayersInSite = Math.max(playersInASite, playersInBSite);
    const siteExecutionScore = maxPlayersInSite / teamPlayers.length;
    
    executionScore = Math.max(executionScore, siteExecutionScore);
  }
  
  return executionScore;
}

// Calculate defense setup quality for CT side
function calculateDefenseSetupQuality(teamPlayers: PlayerMovementAnalysis[], mapName: string): number {
  // Measures how well positioned the team's defense is
  if (teamPlayers.length === 0 || teamPlayers[0].side.toLowerCase() !== 'ct') {
    return 0;
  }
  
  // For Inferno, ideal CT setups have players distributed across key defensive positions
  
  // Define key defensive positions for Inferno
  const defensivePositions = [
    { x: 1800, y: 700, radius: 200, site: 'A' }, // A site default
    { x: 1600, y: 900, radius: 200, site: 'A' }, // Library
    { x: -900, y: -150, radius: 200, site: 'B' }, // B site default
    { x: -1200, y: -300, radius: 200, site: 'B' }, // Coffins
    { x: 800, y: 400, radius: 200, site: 'Mid' }, // Mid
    { x: 500, y: 0, radius: 200, site: 'Mid' }  // Bottom mid
  ];
  
  // Check coverage of defensive positions
  const coveredPositions = new Set();
  
  teamPlayers.forEach(player => {
    player.positionHeatmap.forEach(pos => {
      defensivePositions.forEach((defPos, index) => {
        const distance = Math.sqrt(
          Math.pow(pos.x - defPos.x, 2) + 
          Math.pow(pos.y - defPos.y, 2)
        );
        
        if (distance <= defPos.radius) {
          coveredPositions.add(index);
        }
      });
    });
  });
  
  // Calculate base setup quality as percentage of positions covered
  let setupQuality = coveredPositions.size / defensivePositions.length;
  
  // Check site distribution (ideally we want 2 A, 2 B, 1 Mid)
  const avgSitePresence = {
    A: 0,
    B: 0,
    Mid: 0
  };
  
  teamPlayers.forEach(player => {
    avgSitePresence.A += player.sitePresence.ASite;
    avgSitePresence.B += player.sitePresence.BSite;
    avgSitePresence.Mid += player.sitePresence.Mid;
  });
  
  // Check if site distribution is balanced
  const idealDistribution = teamPlayers.length === 5 ? 
    { A: 2/5, B: 2/5, Mid: 1/5 } : 
    { A: 0.4, B: 0.4, Mid: 0.2 };
  
  const distributionDifference = 
    Math.abs(avgSitePresence.A / teamPlayers.length - idealDistribution.A) + 
    Math.abs(avgSitePresence.B / teamPlayers.length - idealDistribution.B) + 
    Math.abs(avgSitePresence.Mid / teamPlayers.length - idealDistribution.Mid);
  
  // Adjust setup quality based on distribution
  const distributionFactor = Math.max(0, 1 - distributionDifference);
  
  // Final score is a combination of position coverage and distribution
  return (setupQuality * 0.6) + (distributionFactor * 0.4);
}

// Calculate round win probability
function calculateRoundWinProbability(
  teamPlayers: PlayerMovementAnalysis[], 
  opposingTeamPlayers: PlayerMovementAnalysis[]
): { probability: number, factors: string[] } {
  // Attempts to predict round outcome based on positional metrics
  if (teamPlayers.length === 0 || opposingTeamPlayers.length === 0) {
    return { probability: 0.5, factors: ['Insufficient data'] };
  }
  
  const factors = [];
  
  // Factor 1: Team site control comparison
  const teamSiteControl = {
    ASite: 0,
    BSite: 0,
    Mid: 0
  };
  
  const opposingSiteControl = {
    ASite: 0,
    BSite: 0,
    Mid: 0
  };
  
  teamPlayers.forEach(player => {
    teamSiteControl.ASite += player.sitePresence.ASite;
    teamSiteControl.BSite += player.sitePresence.BSite;
    teamSiteControl.Mid += player.sitePresence.Mid;
  });
  
  opposingTeamPlayers.forEach(player => {
    opposingSiteControl.ASite += player.sitePresence.ASite;
    opposingSiteControl.BSite += player.sitePresence.BSite;
    opposingSiteControl.Mid += player.sitePresence.Mid;
  });
  
  // Normalize
  Object.keys(teamSiteControl).forEach(site => {
    teamSiteControl[site] /= teamPlayers.length;
    opposingSiteControl[site] /= opposingTeamPlayers.length;
  });
  
  let siteControlAdvantage = 0;
  if (teamSiteControl.ASite > opposingSiteControl.ASite) {
    siteControlAdvantage += 0.1;
    factors.push('A site control advantage');
  }
  
  if (teamSiteControl.BSite > opposingSiteControl.BSite) {
    siteControlAdvantage += 0.1;
    factors.push('B site control advantage');
  }
  
  if (teamSiteControl.Mid > opposingSiteControl.Mid) {
    siteControlAdvantage += 0.1;
    factors.push('Mid control advantage');
  }
  
  // Factor 2: Team cohesion comparison
  const teamCohesionScore = calculateTeamCohesion(teamPlayers);
  const opposingCohesionScore = calculateTeamCohesion(opposingTeamPlayers);
  
  let cohesionAdvantage = 0;
  if (teamCohesionScore > opposingCohesionScore) {
    cohesionAdvantage = 0.1;
    factors.push('Better team cohesion');
  }
  
  // Factor 3: Trade potential comparison
  const teamTradeEfficiency = calculateOverallTradeEfficiency(teamPlayers);
  const opposingTradeEfficiency = calculateOverallTradeEfficiency(opposingTeamPlayers);
  
  let tradeAdvantage = 0;
  if (teamTradeEfficiency > opposingTradeEfficiency) {
    tradeAdvantage = 0.1;
    factors.push('Superior trade positioning');
  }
  
  // Factor 4: Side-specific advantages
  let sideAdvantage = 0;
  const isTSide = teamPlayers[0].side.toLowerCase() === 't';
  
  if (isTSide) {
    // T side: Check attack execution
    const attackScore = calculateAttackExecutionScore(teamPlayers, 'INFERNO');
    if (attackScore > 0.7) {
      sideAdvantage = 0.1;
      factors.push('Strong site execute');
    }
  } else {
    // CT side: Check defense setup
    const defenseScore = calculateDefenseSetupQuality(teamPlayers, 'INFERNO');
    if (defenseScore > 0.7) {
      sideAdvantage = 0.1;
      factors.push('Solid defensive setup');
    }
  }
  
  // Calculate base win probability (0.5 as neutral)
  const baseChance = 0.5;
  let winProbability = baseChance + siteControlAdvantage + cohesionAdvantage + tradeAdvantage + sideAdvantage;
  
  // Ensure probability is between 0 and 1
  winProbability = Math.min(1, Math.max(0, winProbability));
  
  return {
    probability: winProbability,
    factors
  };
}

/**
 * Map region identification functions
 */

// Classify a position on Inferno
export function classifyInfernoPosition(pos: {x: number, y: number}): string {
  // A simplified position classifier for de_inferno
  const { x, y } = pos;
  
  // A site area
  if (x > 1500 && x < 2500 && y > 500 && y < 1500) {
    return 'A Site';
  }
  
  // B site area
  if (x > -1000 && x < 0 && y > -1000 && y < 0) {
    return 'B Site';
  }
  
  // Mid area
  if (x > 0 && x < 1000 && y > 0 && y < 1000) {
    return 'Mid';
  }
  
  // Banana
  if (x > -1500 && x < -500 && y > -500 && y < 500) {
    return 'Banana';
  }
  
  // Apartments
  if (x > 1000 && x < 1500 && y > 0 && y < 500) {
    return 'Apartments';
  }
  
  // T spawn
  if (x < -1500 && y < -1000) {
    return 'T Spawn';
  }
  
  // CT spawn
  if (x > 500 && x < 1500 && y > 1500) {
    return 'CT Spawn';
  }
  
  return 'Other';
}

/**
 * Enhanced metrics for XYZ data integration with PIV
 */
export function calculateXYZMetricsForPIV(
  playerData: PlayerMovementAnalysis,
  allPlayers: PlayerMovementAnalysis[]
): Record<string, number> {
  // Based on role, calculate relevant PIV component metrics from positional data
  
  const metrics: Record<string, number> = {};
  
  // Determine player role based on movement patterns
  const isT = playerData.side.toLowerCase() === 't';
  
  if (isLikelyAwper(playerData)) {
    // AWPer metrics
    if (isT) {
      // T side AWPer
      metrics['Opening Pick Success Rate'] = calculateOpeningPickPotential(playerData, 'T');
      metrics['Multi Kill Conversion'] = calculateMultiKillPotential(playerData);
      metrics['AWPer Flash Assistance'] = calculateFlashAssistPotential(playerData, allPlayers);
    } else {
      // CT side AWPer
      metrics['Site Lockdown Rate'] = calculateSiteLockdownPotential(playerData);
      metrics['Entry Denial Efficiency'] = calculateEntryDenialPotential(playerData);
      metrics['Angle Hold Success'] = calculatePositionConsistency(playerData);
      metrics['Retake Contribution Index'] = calculateRetakeContributionPotential(playerData);
    }
  } else if (isLikelyEntryOrSpaceTaker(playerData)) {
    // Entry/Spacetaker metrics
    if (isT) {
      metrics['Opening Duel Success Rate'] = calculateEntryPathEfficiency(playerData, 'INFERNO');
      metrics['First Blood Impact'] = calculateOpeningPickPotential(playerData, 'T');
      metrics['Trade Conversion Rate'] = calculateTradePositioningScore(playerData, allPlayers);
      metrics['Space Creation Index'] = calculateSpaceCreationIndex(playerData, allPlayers);
    }
  } else if (isLikelySupport(playerData, allPlayers)) {
    // Support metrics
    metrics['Support Proximity Index'] = calculateSupportProximityIndex(playerData, allPlayers);
    metrics['Utility Positioning Score'] = calculateUtilityPositioningScore(playerData, 'INFERNO');
    metrics['Trade Positioning Score'] = calculateTradePositioningScore(playerData, allPlayers);
  } else if (isLikelyLurker(playerData, allPlayers)) {
    // Lurker metrics
    metrics['Isolation Index'] = calculateIsolationIndex(playerData, allPlayers);
    metrics['Flanker Position Advantage'] = calculateFlankerAdvantage(playerData, 'INFERNO');
    metrics['Information Gathering Range'] = calculateInfoGatheringRange(playerData, 'INFERNO');
  }
  
  // Add general metrics for all roles
  metrics['Position Consistency'] = calculatePositionConsistency(playerData);
  metrics['Rotational Efficiency'] = calculateRotationalEfficiency(playerData);
  metrics['Map Coverage'] = calculateMapCoverage(playerData);
  
  return metrics;
}

// Helper functions for PIV integration

// Calculate opening pick potential based on positioning
function calculateOpeningPickPotential(player: PlayerMovementAnalysis, side: string): number {
  // This estimates the potential for securing opening kills based on positioning
  const { positionHeatmap } = player;
  
  // Define areas where opening picks commonly occur on Inferno
  const openingPickSpots = [];
  
  if (side === 'T') {
    // T side opening pick spots
    openingPickSpots.push(
      { x: -1200, y: -200, radius: 200 }, // Top banana
      { x: 500, y: 0, radius: 200 },     // Mid
      { x: 1200, y: 400, radius: 200 }   // Apartments
    );
  } else {
    // CT side opening pick spots
    openingPickSpots.push(
      { x: -900, y: -100, radius: 200 },  // B site looking at banana
      { x: 800, y: 400, radius: 200 },    // Mid looking at T mid
      { x: 1600, y: 600, radius: 200 }    // A site looking at apartments
    );
  }
  
  // Count positions in opening pick zones
  let openingPickPositionCount = 0;
  
  positionHeatmap.forEach(pos => {
    openingPickSpots.forEach(spot => {
      const distance = Math.sqrt(
        Math.pow(pos.x - spot.x, 2) + 
        Math.pow(pos.y - spot.y, 2)
      );
      
      if (distance <= spot.radius) {
        openingPickPositionCount++;
      }
    });
  });
  
  // Normalize by total positions (expecting ~20% in opening pick positions for a good AWPer)
  return Math.min(1, openingPickPositionCount / (positionHeatmap.length * 0.2));
}

// Calculate multi-kill potential based on positioning
function calculateMultiKillPotential(player: PlayerMovementAnalysis): number {
  // This estimates the potential for securing multiple kills in a round
  
  // A simple proxy: positioning consistency in advantageous spots
  return calculatePositionConsistency(player);
}

// Calculate flash assist potential for AWPers
function calculateFlashAssistPotential(player: PlayerMovementAnalysis, allPlayers: PlayerMovementAnalysis[]): number {
  // This estimates the potential for utilizing teammate flashes effectively
  // Look for optimal positions where flashbangs are typically thrown
  
  // Calculate average distance to teammates (should be within flash assist range)
  const teammates = allPlayers.filter(p => 
    p.side === player.side && p.user_steamid !== player.user_steamid
  );
  
  if (teammates.length === 0) return 0;
  
  let totalDistance = 0;
  let sampleCount = 0;
  
  // Sample a subset of positions
  const positions = player.positionHeatmap;
  const samplingInterval = Math.max(1, Math.floor(positions.length / 10));
  
  for (let i = 0; i < positions.length; i += samplingInterval) {
    const playerPos = positions[i];
    
    teammates.forEach(teammate => {
      if (i >= teammate.positionHeatmap.length) return;
      
      const teammatePos = teammate.positionHeatmap[i];
      if (!teammatePos) return;
      
      const distance = Math.sqrt(
        Math.pow(playerPos.x - teammatePos.x, 2) + 
        Math.pow(playerPos.y - teammatePos.y, 2)
      );
      
      // Flash assist range: 500-1000 units
      if (distance >= 500 && distance <= 1000) {
        totalDistance += 1;
      }
      
      sampleCount++;
    });
  }
  
  // Normalize
  return sampleCount > 0 ? totalDistance / sampleCount : 0;
}

// Calculate site lockdown potential for CT AWPers
function calculateSiteLockdownPotential(player: PlayerMovementAnalysis): number {
  // This estimates how effectively the player can lock down a site
  
  // For simplicity, use site presence as a proxy
  const { ASite, BSite } = player.sitePresence;
  
  // Focus on a single site is better for lockdown
  const primarySitePresence = Math.max(ASite, BSite);
  
  return primarySitePresence;
}

// Calculate entry denial potential for CT AWPers
function calculateEntryDenialPotential(player: PlayerMovementAnalysis): number {
  // This estimates how effectively the player can deny entry to a site
  
  // Define entry denial positions for Inferno
  const entryDenialSpots = [
    { x: -900, y: -100, radius: 200 },  // B site looking at banana
    { x: -1200, y: -300, radius: 200 }, // Coffins
    { x: 1800, y: 700, radius: 200 },   // A site looking at apartments
    { x: 1600, y: 900, radius: 200 }    // Library
  ];
  
  // Count positions in entry denial zones
  let entryDenialPositionCount = 0;
  
  player.positionHeatmap.forEach(pos => {
    entryDenialSpots.forEach(spot => {
      const distance = Math.sqrt(
        Math.pow(pos.x - spot.x, 2) + 
        Math.pow(pos.y - spot.y, 2)
      );
      
      if (distance <= spot.radius) {
        entryDenialPositionCount++;
      }
    });
  });
  
  // Normalize by total positions
  return Math.min(1, entryDenialPositionCount / (player.positionHeatmap.length * 0.3));
}

// Calculate retake contribution potential
function calculateRetakeContributionPotential(player: PlayerMovementAnalysis): number {
  // This estimates how effectively the player contributes to retakes
  
  // For Inferno, identify retake positions
  const retakePositions = [
    { x: 1500, y: 600, radius: 200 },  // A site retake
    { x: -700, y: -100, radius: 200 }  // B site retake
  ];
  
  // Count positions in retake zones
  let retakePositionCount = 0;
  
  player.positionHeatmap.forEach(pos => {
    retakePositions.forEach(spot => {
      const distance = Math.sqrt(
        Math.pow(pos.x - spot.x, 2) + 
        Math.pow(pos.y - spot.y, 2)
      );
      
      if (distance <= spot.radius) {
        retakePositionCount++;
      }
    });
  });
  
  // Normalize by total positions
  return Math.min(1, retakePositionCount / (player.positionHeatmap.length * 0.2));
}
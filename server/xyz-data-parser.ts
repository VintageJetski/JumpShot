/**
 * XYZ Data Parser for CS2 Positional Data
 * 
 * This module parses XYZ positional data from CS2 matches and generates
 * advanced metrics for player and team analysis.
 */

import * as fs from 'fs';
import * as path from 'path';
import * as csv from 'csv-parse/sync';
import { calculatePlayerRoleMetrics, calculateTeamPositionalMetrics, calculateXYZMetricsForPIV, classifyInfernoPosition } from './positionalMetrics';

// Types for XYZ data analysis
export interface PlayerMovementAnalysis {
  name: string;
  user_steamid: string;
  side: string;
  round_num: number;
  totalDistance: number;
  avgSpeed: number;
  rotations: number;
  sitePresence: {
    ASite: number;
    BSite: number;
    Mid: number;
  };
  positionHeatmap: {
    x: number;
    y: number;
    intensity: number;
  }[];
}

export interface TeamMetrics {
  avgTeamDistance: number;
  teamSpread: number;
  tradeEfficiency: number;
  siteControl: {
    ASite: number;
    BSite: number;
    Mid: number;
  };
}

export interface RoundPositionalMetrics {
  round_num: number;
  teamMetrics: {
    t: TeamMetrics;
    ct: TeamMetrics;
  };
  playerMetrics: Record<string, PlayerMovementAnalysis>;
  roleMetrics?: Record<string, any>;
  pivMetrics?: Record<string, any>;
  teamStrategyInsights?: Record<string, any>;
  roundPrediction?: {
    winProbability: number;
    tProbability: number;
    ctProbability: number;
    factors: string[];
  };
}

interface XYZDataPoint {
  round_num: number;
  player_name: string;
  user_steamid: string;
  team_name: string;
  side: string;
  x: number;
  y: number;
  z: number;
  timestamp: number;
}

/**
 * Parse XYZ data from a CSV file
 */
export async function parseXYZDataFile(filePath: string): Promise<XYZDataPoint[]> {
  try {
    const fileContent = fs.readFileSync(filePath, 'utf8');
    const records = csv.parse(fileContent, {
      columns: true,
      skip_empty_lines: true
    });
    
    return records.map((record: any) => ({
      round_num: parseInt(record.round_num),
      player_name: record.player_name,
      user_steamid: record.user_steamid,
      team_name: record.team_name,
      side: record.side,
      x: parseFloat(record.x),
      y: parseFloat(record.y),
      z: parseFloat(record.z),
      timestamp: parseFloat(record.timestamp)
    }));
  } catch (error) {
    console.error('Error parsing XYZ data file:', error);
    throw new Error('Failed to parse XYZ data file');
  }
}

/**
 * Sample data to make it more manageable
 * This can be important for large datasets with tens of thousands of points
 */
function sampleData(data: XYZDataPoint[], roundNumber: number, sampleSize: number = 10000): XYZDataPoint[] {
  // Filter to just the requested round
  const roundData = data.filter(point => point.round_num === roundNumber);
  
  if (roundData.length <= sampleSize) {
    return roundData;
  }
  
  // If we have more data than our sample size, take every nth point
  const samplingInterval = Math.floor(roundData.length / sampleSize);
  
  return roundData.filter((_, index) => index % samplingInterval === 0);
}

/**
 * Calculate movement metrics for a player
 */
function calculatePlayerMovementMetrics(playerData: XYZDataPoint[]): PlayerMovementAnalysis {
  if (!playerData.length) {
    throw new Error('No data provided for player movement calculation');
  }
  
  // Basic player info
  const player = playerData[0];
  const name = player.player_name;
  const user_steamid = player.user_steamid;
  const side = player.side;
  const round_num = player.round_num;
  
  // Calculate total distance traveled
  let totalDistance = 0;
  let rotations = 0;
  let lastLocation = '';
  
  for (let i = 1; i < playerData.length; i++) {
    const prev = playerData[i - 1];
    const curr = playerData[i];
    
    // Calculate distance between consecutive points
    const distance = Math.sqrt(
      Math.pow(curr.x - prev.x, 2) + 
      Math.pow(curr.y - prev.y, 2) + 
      Math.pow(curr.z - prev.z, 2)
    );
    
    // Add to total distance
    totalDistance += distance;
    
    // Detect rotations (changes between map areas)
    const currLocation = classifyInfernoPosition({ x: curr.x, y: curr.y });
    if (lastLocation && currLocation !== lastLocation) {
      rotations++;
    }
    lastLocation = currLocation;
  }
  
  // Calculate average speed (units per second)
  let avgSpeed = 0;
  if (playerData.length > 1) {
    const firstPoint = playerData[0];
    const lastPoint = playerData[playerData.length - 1];
    const timeDiff = lastPoint.timestamp - firstPoint.timestamp;
    
    avgSpeed = timeDiff > 0 ? (totalDistance / timeDiff) : 0;
  }
  
  // Calculate site presence
  const sitePresence = {
    ASite: 0,
    BSite: 0,
    Mid: 0
  };
  
  playerData.forEach(point => {
    const location = classifyInfernoPosition({ x: point.x, y: point.y });
    if (location === 'A Site') {
      sitePresence.ASite++;
    } else if (location === 'B Site') {
      sitePresence.BSite++;
    } else if (location === 'Mid') {
      sitePresence.Mid++;
    }
  });
  
  // Normalize site presence to percentages
  const totalPoints = playerData.length;
  sitePresence.ASite /= totalPoints;
  sitePresence.BSite /= totalPoints;
  sitePresence.Mid /= totalPoints;
  
  // Generate position heatmap
  const positionHeatmap = playerData.map(point => ({
    x: point.x,
    y: point.y,
    intensity: 1 // Simple intensity value for now
  }));
  
  return {
    name,
    user_steamid,
    side,
    round_num,
    totalDistance,
    avgSpeed,
    rotations,
    sitePresence,
    positionHeatmap
  };
}

/**
 * Calculate team-level metrics for a group of players
 */
function calculateTeamMetrics(playerAnalyses: PlayerMovementAnalysis[]): TeamMetrics {
  if (!playerAnalyses.length) {
    throw new Error('No player analyses provided for team metrics calculation');
  }
  
  // Calculate average distance traveled by team
  const avgTeamDistance = playerAnalyses.reduce(
    (sum, player) => sum + player.totalDistance, 0
  ) / playerAnalyses.length;
  
  // Calculate team spread (average distance between players)
  // This is a simplification - ideally we'd calculate this for each position snapshot
  let teamSpread = 0;
  if (playerAnalyses.length > 1) {
    let pairCount = 0;
    let totalDistance = 0;
    
    // Take median position from each player's heatmap for a rough estimate
    const playerPositions = playerAnalyses.map(player => {
      const positions = player.positionHeatmap;
      const midpoint = positions[Math.floor(positions.length / 2)];
      return { x: midpoint.x, y: midpoint.y };
    });
    
    // Calculate pairwise distances
    for (let i = 0; i < playerPositions.length; i++) {
      for (let j = i + 1; j < playerPositions.length; j++) {
        const distance = Math.sqrt(
          Math.pow(playerPositions[i].x - playerPositions[j].x, 2) +
          Math.pow(playerPositions[i].y - playerPositions[j].y, 2)
        );
        totalDistance += distance;
        pairCount++;
      }
    }
    
    if (pairCount > 0) {
      teamSpread = totalDistance / pairCount;
    }
  }
  
  // Calculate trade efficiency (percentage of players within trade distance of another player)
  // Again, this is a simplification for this example
  let tradeEfficiency = 0;
  if (playerAnalyses.length > 1) {
    // Take 5 snapshots from the round
    const snapshotPoints = [0.2, 0.4, 0.6, 0.8, 1.0];
    let totalTradeScore = 0;
    
    for (const fraction of snapshotPoints) {
      const tradeablePlayerCount = calculateTradeablePlayersAtSnapshot(playerAnalyses, fraction);
      totalTradeScore += tradeablePlayerCount / playerAnalyses.length;
    }
    
    tradeEfficiency = totalTradeScore / snapshotPoints.length;
  }
  
  // Calculate site control (average presence across team)
  const siteControl = {
    ASite: playerAnalyses.reduce((sum, player) => sum + player.sitePresence.ASite, 0) / playerAnalyses.length,
    BSite: playerAnalyses.reduce((sum, player) => sum + player.sitePresence.BSite, 0) / playerAnalyses.length,
    Mid: playerAnalyses.reduce((sum, player) => sum + player.sitePresence.Mid, 0) / playerAnalyses.length
  };
  
  return {
    avgTeamDistance,
    teamSpread,
    tradeEfficiency,
    siteControl
  };
}

/**
 * Helper function to calculate tradeable players at a specific snapshot
 */
function calculateTradeablePlayersAtSnapshot(
  playerAnalyses: PlayerMovementAnalysis[],
  fractionComplete: number
): number {
  const playerPositions = playerAnalyses.map(player => {
    const positions = player.positionHeatmap;
    const index = Math.min(positions.length - 1, Math.floor(positions.length * fractionComplete));
    return { x: positions[index].x, y: positions[index].y };
  });
  
  let tradeablePlayerCount = 0;
  
  for (let i = 0; i < playerPositions.length; i++) {
    let isTradeable = false;
    
    for (let j = 0; j < playerPositions.length; j++) {
      if (i === j) continue;
      
      const distance = Math.sqrt(
        Math.pow(playerPositions[i].x - playerPositions[j].x, 2) +
        Math.pow(playerPositions[i].y - playerPositions[j].y, 2)
      );
      
      // Typical trade distance in CS2
      if (distance >= 200 && distance <= 600) {
        isTradeable = true;
        break;
      }
    }
    
    if (isTradeable) {
      tradeablePlayerCount++;
    }
  }
  
  return tradeablePlayerCount;
}

/**
 * Analyze XYZ data for a specific round
 */
export function analyzeRoundXYZData(data: XYZDataPoint[], roundNumber: number): RoundPositionalMetrics {
  // Sample data if needed to keep processing efficient
  const sampledData = sampleData(data, roundNumber);
  
  // Group data by player
  const playerData: Record<string, XYZDataPoint[]> = {};
  sampledData.forEach(point => {
    if (!playerData[point.user_steamid]) {
      playerData[point.user_steamid] = [];
    }
    playerData[point.user_steamid].push(point);
  });
  
  // Calculate movement metrics for each player
  const playerMetrics: Record<string, PlayerMovementAnalysis> = {};
  Object.entries(playerData).forEach(([steamId, points]) => {
    playerMetrics[steamId] = calculatePlayerMovementMetrics(points);
  });
  
  // Group players by team side
  const tPlayers: PlayerMovementAnalysis[] = [];
  const ctPlayers: PlayerMovementAnalysis[] = [];
  
  Object.values(playerMetrics).forEach(player => {
    if (player.side.toLowerCase() === 't') {
      tPlayers.push(player);
    } else if (player.side.toLowerCase() === 'ct') {
      ctPlayers.push(player);
    }
  });
  
  // Calculate team metrics
  const tTeamMetrics = tPlayers.length ? calculateTeamMetrics(tPlayers) : {
    avgTeamDistance: 0,
    teamSpread: 0,
    tradeEfficiency: 0,
    siteControl: { ASite: 0, BSite: 0, Mid: 0 }
  };
  
  const ctTeamMetrics = ctPlayers.length ? calculateTeamMetrics(ctPlayers) : {
    avgTeamDistance: 0,
    teamSpread: 0,
    tradeEfficiency: 0,
    siteControl: { ASite: 0, BSite: 0, Mid: 0 }
  };
  
  // Calculate role-based metrics for each player
  const allPlayers = [...tPlayers, ...ctPlayers];
  const roleMetrics: Record<string, any> = {};
  
  Object.entries(playerMetrics).forEach(([steamId, player]) => {
    roleMetrics[steamId] = calculatePlayerRoleMetrics(player, allPlayers);
  });
  
  // Calculate PIV integration metrics
  const pivMetrics: Record<string, any> = {};
  
  Object.entries(playerMetrics).forEach(([steamId, player]) => {
    pivMetrics[steamId] = calculateXYZMetricsForPIV(player, allPlayers);
  });
  
  // Calculate team strategy insights
  const tStrategyInsights = calculateTeamPositionalMetrics(tPlayers, ctPlayers);
  const ctStrategyInsights = calculateTeamPositionalMetrics(ctPlayers, tPlayers);
  
  // Calculate round win probability
  const tWinProb = tStrategyInsights.roundWinProbability ? 
                   (tStrategyInsights.roundWinProbability as any).probability : 0.5;
  
  const ctWinProb = ctStrategyInsights.roundWinProbability ? 
                    (ctStrategyInsights.roundWinProbability as any).probability : 0.5;
  
  // Normalize probabilities to add up to 1
  const totalProb = tWinProb + ctWinProb;
  const normalizedTProb = totalProb > 0 ? tWinProb / totalProb : 0.5;
  const normalizedCTProb = totalProb > 0 ? ctWinProb / totalProb : 0.5;
  
  // Combine T and CT factors
  const tFactors = tStrategyInsights.roundWinProbability ? 
                   (tStrategyInsights.roundWinProbability as any).factors : [];
  
  const ctFactors = ctStrategyInsights.roundWinProbability ? 
                    (ctStrategyInsights.roundWinProbability as any).factors : [];
  
  // Combine results
  return {
    round_num: roundNumber,
    teamMetrics: {
      t: tTeamMetrics,
      ct: ctTeamMetrics
    },
    playerMetrics,
    roleMetrics,
    pivMetrics,
    teamStrategyInsights: {
      t: tStrategyInsights,
      ct: ctStrategyInsights
    },
    roundPrediction: {
      winProbability: Math.max(normalizedTProb, normalizedCTProb),
      tProbability: normalizedTProb,
      ctProbability: normalizedCTProb,
      factors: [...tFactors, ...ctFactors]
    }
  };
}

/**
 * Main function to process XYZ data from file
 */
export async function processXYZDataFromFile(filePath: string, roundNumber: number): Promise<RoundPositionalMetrics> {
  try {
    console.log(`Reading XYZ data from: ${filePath}`);
    const xyzData = await parseXYZDataFile(filePath);
    console.log(`Parsed ${xyzData.length} sampled positional data points from ${filePath}`);
    
    console.log(`Successfully parsed ${xyzData.length} data points for analysis`);
    console.log(`Analyzing ${xyzData.length} positional data points for round ${roundNumber}`);
    
    return analyzeRoundXYZData(xyzData, roundNumber);
  } catch (error) {
    console.error('Error processing XYZ data:', error);
    throw new Error('Failed to process XYZ data');
  }
}
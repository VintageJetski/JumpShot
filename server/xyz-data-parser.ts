/**
 * Parser and analyzer for CS2 positional (XYZ) data
 * This module processes tick-by-tick positional data from matches
 * to generate insights about player movement, rotations, and positioning
 */

import fs from 'fs';
import path from 'path';
import { parse } from 'csv-parse/sync';

// Type definitions for positional data
export interface PositionalDataPoint {
  health: number;
  flash_duration: number;
  place: string;
  armor: number;
  side: string;
  pitch: number;
  X: number;
  yaw: number;
  Y: number;
  velocity_X: number;
  Z: number;
  velocity_Y: number;
  velocity_Z: number;
  tick: number;
  user_steamid: string;
  name: string;
  round_num: number;
  x_smoke?: number;
  y_smoke?: number;
  z_smoke?: number;
  x_infernos?: number;
  y_infernos?: number;
  z_infernos?: number;
  x_he?: number;
  y_he?: number;
  z_he?: number;
  x_flashes?: number;
  y_flashes?: number;
  z_flashes?: number;
}

// Interface for player movement analysis
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

// Interface for round positional metrics
export interface RoundPositionalMetrics {
  round_num: number;
  teamMetrics: {
    t: {
      avgTeamDistance: number;
      teamSpread: number;
      tradeEfficiency: number;
      siteControl: {
        ASite: number;
        BSite: number;
        Mid: number;
      };
    };
    ct: {
      avgTeamDistance: number;
      teamSpread: number;
      tradeEfficiency: number;
      siteControl: {
        ASite: number;
        BSite: number;
        Mid: number;
      };
    };
  };
  playerMetrics: Record<string, PlayerMovementAnalysis>;
}

/**
 * Parse XYZ positional data from CSV
 */
export async function parseXYZData(filePath: string): Promise<PositionalDataPoint[]> {
  try {
    const content = fs.readFileSync(filePath, { encoding: 'utf-8' });
    const records = parse(content, {
      columns: true,
      skip_empty_lines: true,
      cast: (value, context) => {
        // Convert numeric fields to numbers
        const columnName = context.column as string;
        if (columnName === 'health' || columnName === 'armor' || 
            columnName === 'pitch' || columnName === 'X' || 
            columnName === 'yaw' || columnName === 'Y' || 
            columnName === 'velocity_X' || columnName === 'Z' || 
            columnName === 'velocity_Y' || columnName === 'velocity_Z' || 
            columnName === 'tick' || columnName === 'round_num' || 
            columnName === 'flash_duration' ||
            columnName.startsWith('x_') || 
            columnName.startsWith('y_') || 
            columnName.startsWith('z_')) {
          return value !== '' ? Number(value) : null;
        }
        return value;
      }
    });
    
    console.log(`Parsed ${records.length} positional data points from ${filePath}`);
    return records as PositionalDataPoint[];
  } catch (error) {
    console.error('Error parsing XYZ data:', error);
    throw new Error(`Failed to parse XYZ data: ${error}`);
  }
}

/**
 * Group positional data by round and player
 */
export function groupDataByRound(data: PositionalDataPoint[]): Map<number, PositionalDataPoint[]> {
  const roundMap = new Map<number, PositionalDataPoint[]>();
  
  for (const point of data) {
    if (!roundMap.has(point.round_num)) {
      roundMap.set(point.round_num, []);
    }
    
    roundMap.get(point.round_num)!.push(point);
  }
  
  return roundMap;
}

/**
 * Calculate distance between two 3D points
 */
function calculate3DDistance(x1: number, y1: number, z1: number, x2: number, y2: number, z2: number): number {
  return Math.sqrt(Math.pow(x2 - x1, 2) + Math.pow(y2 - y1, 2) + Math.pow(z2 - z1, 2));
}

/**
 * Analyze player movement for a single player in a round
 */
function analyzePlayerMovement(
  playerData: PositionalDataPoint[],
  roundNum: number
): PlayerMovementAnalysis {
  if (playerData.length === 0) {
    throw new Error('No player data provided for movement analysis');
  }
  
  const player = playerData[0];
  let totalDistance = 0;
  let rotations = 0;
  let prevYaw = player.yaw;
  const areaPresence = {
    ASite: 0,
    BSite: 0,
    Mid: 0,
  };
  
  // Simple position heatmap - divide map into 10x10 grid cells
  const heatmapGrid: Record<string, number> = {};
  const MAP_SIZE = 4000; // Approximate size of maps in CS2 units
  const GRID_SIZE = 400; // 10x10 grid cells
  
  // For position heatmap analysis
  const gridCellsX = Math.ceil(MAP_SIZE / GRID_SIZE);
  const gridCellsY = Math.ceil(MAP_SIZE / GRID_SIZE);
  
  // Process each data point
  for (let i = 1; i < playerData.length; i++) {
    const prev = playerData[i - 1];
    const current = playerData[i];
    
    // Calculate distance traveled
    const distance = calculate3DDistance(
      prev.X, prev.Y, prev.Z,
      current.X, current.Y, current.Z
    );
    
    totalDistance += distance;
    
    // Check for significant rotations (more than 45 degrees)
    const yawDiff = Math.abs(current.yaw - prevYaw);
    if (yawDiff > 45 && yawDiff < 315) { // Avoid counting full 360 rotations
      rotations++;
    }
    prevYaw = current.yaw;
    
    // Update site presence 
    // Note: These are simplified placeholders for actual map coordinates
    // In a real implementation, we would use actual map-specific site boundaries
    if (current.place === 'ASite' || 
        (Math.abs(current.X - 500) < 300 && Math.abs(current.Y - 500) < 300)) {
      areaPresence.ASite++;
    } else if (current.place === 'BSite' || 
               (Math.abs(current.X - 2000) < 300 && Math.abs(current.Y - 2000) < 300)) {
      areaPresence.BSite++;
    } else if (current.place === 'Mid' || 
               (Math.abs(current.X - 1000) < 300 && Math.abs(current.Y - 1000) < 300)) {
      areaPresence.Mid++;
    }
    
    // Update heatmap
    const gridX = Math.floor((current.X + MAP_SIZE/2) / GRID_SIZE);
    const gridY = Math.floor((current.Y + MAP_SIZE/2) / GRID_SIZE);
    const cellKey = `${gridX},${gridY}`;
    
    if (!heatmapGrid[cellKey]) {
      heatmapGrid[cellKey] = 0;
    }
    heatmapGrid[cellKey]++;
  }
  
  // Convert heatmap grid to array of points
  const positionHeatmap = Object.entries(heatmapGrid).map(([key, intensity]) => {
    const [x, y] = key.split(',').map(Number);
    return {
      x: x * GRID_SIZE - MAP_SIZE/2 + GRID_SIZE/2, // Get center of grid cell
      y: y * GRID_SIZE - MAP_SIZE/2 + GRID_SIZE/2,
      intensity
    };
  });
  
  // Create player movement analysis
  return {
    name: player.name,
    user_steamid: player.user_steamid,
    side: player.side,
    round_num: roundNum,
    totalDistance,
    avgSpeed: totalDistance / playerData.length, // Simplistic - could be refined
    rotations,
    sitePresence: {
      ASite: areaPresence.ASite / playerData.length,
      BSite: areaPresence.BSite / playerData.length,
      Mid: areaPresence.Mid / playerData.length,
    },
    positionHeatmap
  };
}

/**
 * Calculate team spread - average distance between team members
 */
function calculateTeamSpread(playerDataPoints: PositionalDataPoint[]): number {
  if (playerDataPoints.length <= 1) return 0;
  
  let totalDistance = 0;
  let comparisons = 0;
  
  for (let i = 0; i < playerDataPoints.length; i++) {
    for (let j = i + 1; j < playerDataPoints.length; j++) {
      const p1 = playerDataPoints[i];
      const p2 = playerDataPoints[j];
      
      if (p1.side !== p2.side) continue; // Only compare players on same team
      
      totalDistance += calculate3DDistance(
        p1.X, p1.Y, p1.Z,
        p2.X, p2.Y, p2.Z
      );
      comparisons++;
    }
  }
  
  return comparisons > 0 ? totalDistance / comparisons : 0;
}

/**
 * Analyze a full round of positional data
 */
export function analyzeRoundPositionalData(
  roundData: PositionalDataPoint[]
): RoundPositionalMetrics {
  const roundNum = roundData[0]?.round_num || 0;
  console.log(`Analyzing ${roundData.length} positional data points for round ${roundNum}`);
  
  // Group data by player
  const playerGroupedData = new Map<string, PositionalDataPoint[]>();
  for (const point of roundData) {
    if (!playerGroupedData.has(point.user_steamid)) {
      playerGroupedData.set(point.user_steamid, []);
    }
    playerGroupedData.get(point.user_steamid)!.push(point);
  }
  
  // Analyze each player's movement
  const playerMetrics: Record<string, PlayerMovementAnalysis> = {};
  playerGroupedData.forEach((playerData, steamId) => {
    if (playerData.length > 0) {
      playerMetrics[steamId] = analyzePlayerMovement(playerData, roundNum);
    }
  });
  
  // Group players by team
  const tPlayers: string[] = [];
  const ctPlayers: string[] = [];
  
  for (const [steamId, analysis] of Object.entries(playerMetrics)) {
    if (analysis.side.toLowerCase() === 't') {
      tPlayers.push(steamId);
    } else if (analysis.side.toLowerCase() === 'ct') {
      ctPlayers.push(steamId);
    }
  }
  
  // Calculate team-wide metrics
  const tTeamSpread = calculateTeamSpread(
    roundData.filter(p => p.side.toLowerCase() === 't')
  );
  
  const ctTeamSpread = calculateTeamSpread(
    roundData.filter(p => p.side.toLowerCase() === 'ct')
  );
  
  // Calculate team averages
  const tAvgDistance = tPlayers.reduce(
    (sum, id) => sum + playerMetrics[id].totalDistance, 0
  ) / (tPlayers.length || 1);
  
  const ctAvgDistance = ctPlayers.reduce(
    (sum, id) => sum + playerMetrics[id].totalDistance, 0
  ) / (ctPlayers.length || 1);
  
  // Calculate site control - which team has more presence in each area
  const tSitePresence = {
    ASite: tPlayers.reduce(
      (sum, id) => sum + playerMetrics[id].sitePresence.ASite, 0
    ) / (tPlayers.length || 1),
    BSite: tPlayers.reduce(
      (sum, id) => sum + playerMetrics[id].sitePresence.BSite, 0
    ) / (tPlayers.length || 1),
    Mid: tPlayers.reduce(
      (sum, id) => sum + playerMetrics[id].sitePresence.Mid, 0
    ) / (tPlayers.length || 1),
  };
  
  const ctSitePresence = {
    ASite: ctPlayers.reduce(
      (sum, id) => sum + playerMetrics[id].sitePresence.ASite, 0
    ) / (ctPlayers.length || 1),
    BSite: ctPlayers.reduce(
      (sum, id) => sum + playerMetrics[id].sitePresence.BSite, 0
    ) / (ctPlayers.length || 1),
    Mid: ctPlayers.reduce(
      (sum, id) => sum + playerMetrics[id].sitePresence.Mid, 0
    ) / (ctPlayers.length || 1),
  };
  
  return {
    round_num: roundNum,
    teamMetrics: {
      t: {
        avgTeamDistance: tAvgDistance,
        teamSpread: tTeamSpread,
        tradeEfficiency: 0, // Would require kill data to calculate properly
        siteControl: tSitePresence,
      },
      ct: {
        avgTeamDistance: ctAvgDistance,
        teamSpread: ctTeamSpread,
        tradeEfficiency: 0, // Would require kill data to calculate properly
        siteControl: ctSitePresence,
      },
    },
    playerMetrics
  };
}

/**
 * Process sample XYZ data file
 */
export async function processSampleXYZData(): Promise<RoundPositionalMetrics> {
  try {
    const filePath = path.join(process.cwd(), 'attached_assets', 'round_4_mapping.csv');
    const xyzData = await parseXYZData(filePath);
    
    // For testing, we're just using all data from one round
    return analyzeRoundPositionalData(xyzData);
  } catch (error) {
    console.error('Error processing sample XYZ data:', error);
    throw new Error(`Failed to process sample XYZ data: ${error}`);
  }
}
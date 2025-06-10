import { parse } from 'csv-parse';
import { readFileSync } from 'fs';
import path from 'path';

/**
 * Raw XYZ position data from CS2 demo files
 */
export interface XYZPlayerData {
  health: number;
  flashDuration: number;
  place: string;
  armor: number;
  side: 't' | 'ct';
  pitch: number;
  X: number;
  yaw: number;
  Y: number;
  velocityX: number;
  Z: number;
  velocityY: number;
  velocityZ: number;
  tick: number;
  userSteamid: string;
  name: string;
  roundNum: number;
  // Utility positions
  xSmoke?: number;
  ySmoke?: number;
  zSmoke?: number;
  xInfernos?: number;
  yInfernos?: number;
  zInfernos?: number;
  xHe?: number;
  yHe?: number;
  zHe?: number;
  xFlashes?: number;
  yFlashes?: number;
  zFlashes?: number;
}

/**
 * Processed positional metrics for analytics
 */
export interface PositionalMetrics {
  playerId: string;
  playerName: string;
  team: string;
  roundNum: number;
  // Movement patterns
  totalDistance: number;
  averageVelocity: number;
  maxVelocity: number;
  // Positioning analysis
  mapControl: {
    areasCovered: string[];
    timeInEachArea: Record<string, number>;
    dominantArea: string;
  };
  // Hot zones (areas of high activity)
  hotZones: {
    x: number;
    y: number;
    intensity: number;
    timeSpent: number;
  }[];
  // Rotation analysis
  rotations: {
    from: string;
    to: string;
    timeToRotate: number;
    distanceTraveled: number;
  }[];
  // Utility effectiveness
  utilityUsage: {
    smokes: { x: number; y: number; z: number; effectiveness: number }[];
    flashes: { x: number; y: number; z: number; effectiveness: number }[];
    nades: { x: number; y: number; z: number; effectiveness: number }[];
    molotovs: { x: number; y: number; z: number; effectiveness: number }[];
  };
}

/**
 * Dynamically generated map areas based on actual coordinate data
 */
let MAP_AREAS: Record<string, Record<string, { minX: number; maxX: number; minY: number; maxY: number }>> = {};

/**
 * Parse XYZ positional data from CSV
 */
export async function parseXYZData(filePath: string): Promise<XYZPlayerData[]> {
  try {
    const csvData = readFileSync(filePath, 'utf-8');
    const records: XYZPlayerData[] = [];

    return new Promise((resolve, reject) => {
      parse(csvData, {
        columns: true,
        skip_empty_lines: true,
        cast: (value, { column }) => {
          // Convert numeric fields
          const numericFields = [
            'health', 'flashDuration', 'armor', 'pitch', 'X', 'yaw', 'Y',
            'velocityX', 'Z', 'velocityY', 'velocityZ', 'tick', 'roundNum',
            'xSmoke', 'ySmoke', 'zSmoke', 'xInfernos', 'yInfernos', 'zInfernos',
            'xHe', 'yHe', 'zHe', 'xFlashes', 'yFlashes', 'zFlashes'
          ];
          
          if (numericFields.includes(column as string)) {
            const num = parseFloat(value);
            return isNaN(num) ? undefined : num;
          }
          
          return value === '' ? undefined : value;
        }
      }, (err, data) => {
        if (err) {
          reject(err);
          return;
        }
        
        resolve(data as XYZPlayerData[]);
      });
    });
  } catch (error) {
    console.error('Error parsing XYZ data:', error);
    throw error;
  }
}

/**
 * Generate map areas dynamically from actual coordinate data using clustering
 */
function generateMapAreas(data: XYZPlayerData[]): Record<string, { minX: number; maxX: number; minY: number; maxY: number }> {
  if (data.length === 0) return {};

  // Get coordinate bounds from actual data
  const xCoords = data.map(d => d.X);
  const yCoords = data.map(d => d.Y);
  
  const minX = Math.min(...xCoords);
  const maxX = Math.max(...xCoords);
  const minY = Math.min(...yCoords);
  const maxY = Math.max(...yCoords);

  // Sample data more aggressively for faster processing while maintaining spatial distribution
  const sampledData = data.filter((_, index) => index % 500 === 0);
  console.log(`Sampling ${sampledData.length} points from ${data.length} total points for clustering`);
  
  // Use simplified grid-based clustering for faster processing
  const clusters = performSimplifiedClustering(sampledData, 8); // 8 clusters for comprehensive map coverage
  
  // Convert clusters to named areas based on position characteristics
  const areas: Record<string, { minX: number; maxX: number; minY: number; maxY: number }> = {};
  
  clusters.forEach((cluster: { center: { x: number; y: number }; points: XYZPlayerData[] }, index: number) => {
    const clusterX = cluster.points.map((p: XYZPlayerData) => p.X);
    const clusterY = cluster.points.map((p: XYZPlayerData) => p.Y);
    
    const areaName = determineAreaName(cluster, index, minX, maxX, minY, maxY);
    
    areas[areaName] = {
      minX: Math.min(...clusterX) - 50, // Add small buffer
      maxX: Math.max(...clusterX) + 50,
      minY: Math.min(...clusterY) - 50,
      maxY: Math.max(...clusterY) + 50
    };
  });
  
  return areas;
}

/**
 * Perform simplified grid-based clustering for faster processing
 */
function performSimplifiedClustering(data: XYZPlayerData[], k: number): Array<{ center: { x: number; y: number }; points: XYZPlayerData[] }> {
  if (data.length === 0) return [];
  
  const xCoords = data.map(d => d.X);
  const yCoords = data.map(d => d.Y);
  const minX = Math.min(...xCoords);
  const maxX = Math.max(...xCoords);
  const minY = Math.min(...yCoords);
  const maxY = Math.max(...yCoords);
  
  // Create grid-based clusters using spatial divisions
  const gridSize = Math.ceil(Math.sqrt(k));
  const xStep = (maxX - minX) / gridSize;
  const yStep = (maxY - minY) / gridSize;
  
  const gridClusters = new Map<string, XYZPlayerData[]>();
  
  data.forEach(point => {
    const gridX = Math.min(gridSize - 1, Math.max(0, Math.floor((point.X - minX) / xStep)));
    const gridY = Math.min(gridSize - 1, Math.max(0, Math.floor((point.Y - minY) / yStep)));
    const key = `${gridX},${gridY}`;
    
    if (!gridClusters.has(key)) {
      gridClusters.set(key, []);
    }
    gridClusters.get(key)!.push(point);
  });
  
  // Convert to cluster format and merge small clusters
  const clusters: Array<{ center: { x: number; y: number }; points: XYZPlayerData[] }> = [];
  
  Array.from(gridClusters.entries())
    .filter(([_, points]) => points.length >= 1) // Include all areas with activity
    .sort(([_, a], [__, b]) => b.length - a.length) // Sort by size
    .forEach(([_, points]) => {
      const centerX = points.reduce((sum, p) => sum + p.X, 0) / points.length;
      const centerY = points.reduce((sum, p) => sum + p.Y, 0) / points.length;
      
      clusters.push({
        center: { x: centerX, y: centerY },
        points
      });
    });
  
  return clusters;
}

/**
 * Determine area name based on cluster characteristics and position
 */
function determineAreaName(cluster: { center: { x: number; y: number }; points: XYZPlayerData[] }, index: number, minX: number, maxX: number, minY: number, maxY: number): string {
  const { center, points } = cluster;
  const centerX = center.x;
  const centerY = center.y;
  
  // Analyze cluster characteristics
  const xRange = maxX - minX;
  const yRange = maxY - minY;
  
  // Determine relative position
  const xRatio = (centerX - minX) / xRange;
  const yRatio = (centerY - minY) / yRange;
  
  // Analyze team composition in this area
  const tSideCount = points.filter(p => p.side === 't').length;
  const ctSideCount = points.filter(p => p.side === 'ct').length;
  
  // Analyze activity level (how often players are here)
  const activityLevel = points.length;
  
  // Generate meaningful names based on position and characteristics
  if (xRatio < 0.3 && yRatio > 0.7) {
    return tSideCount > ctSideCount ? 'T Spawn Area' : 'T Side Control';
  } else if (xRatio > 0.7 && yRatio < 0.3) {
    return ctSideCount > tSideCount ? 'CT Spawn Area' : 'CT Side Control';
  } else if (xRatio > 0.6 && yRatio > 0.4 && yRatio < 0.8) {
    return activityLevel > 100 ? 'A Site Complex' : 'A Site Approach';
  } else if (xRatio < 0.4 && yRatio > 0.4 && yRatio < 0.8) {
    return activityLevel > 100 ? 'B Site Complex' : 'B Site Approach';
  } else if (xRatio > 0.3 && xRatio < 0.7 && yRatio > 0.3 && yRatio < 0.7) {
    return 'Mid Control';
  } else if (yRatio > 0.7) {
    return 'North Sector';
  } else if (yRatio < 0.3) {
    return 'South Sector';
  } else if (xRatio < 0.3) {
    return 'West Sector';
  } else if (xRatio > 0.7) {
    return 'East Sector';
  } else {
    return `Zone ${index + 1}`;
  }
}

/**
 * Determine which map area a position belongs to using dynamic areas
 */
export function getMapArea(x: number, y: number, mapName: string = 'dynamic'): string {
  const areas = MAP_AREAS[mapName];
  if (!areas) return 'Unknown';

  for (const [areaName, bounds] of Object.entries(areas)) {
    if (x >= bounds.minX && x <= bounds.maxX && 
        y >= bounds.minY && y <= bounds.maxY) {
      return areaName;
    }
  }
  
  return 'Unmapped Area';
}

/**
 * Calculate distance between two points
 */
export function calculateDistance(x1: number, y1: number, x2: number, y2: number): number {
  return Math.sqrt(Math.pow(x2 - x1, 2) + Math.pow(y2 - y1, 2));
}

/**
 * Calculate velocity magnitude
 */
export function calculateVelocity(vx: number, vy: number, vz: number): number {
  return Math.sqrt(vx * vx + vy * vy + vz * vz);
}

/**
 * Process raw XYZ data into positional metrics
 */
export function processPositionalData(rawData: XYZPlayerData[], mapName: string = 'dynamic'): PositionalMetrics[] {
  const playerMetrics = new Map<string, PositionalMetrics>();
  const playerPositions = new Map<string, XYZPlayerData[]>();

  // Generate dynamic map areas from actual coordinate data
  console.log('Generating dynamic map areas from coordinate data...');
  const dynamicAreas = generateMapAreas(rawData);
  MAP_AREAS[mapName] = dynamicAreas;
  console.log(`Generated ${Object.keys(dynamicAreas).length} map areas:`, Object.keys(dynamicAreas));

  // Group data by player
  rawData.forEach(record => {
    const playerId = record.userSteamid;
    if (!playerPositions.has(playerId)) {
      playerPositions.set(playerId, []);
    }
    playerPositions.get(playerId)!.push(record);
  });

  // Process each player's data
  playerPositions.forEach((positions, playerId) => {
    // Sort by tick to ensure chronological order
    positions.sort((a, b) => a.tick - b.tick);

    const metrics: PositionalMetrics = {
      playerId,
      playerName: positions[0].name,
      team: positions[0].side === 't' ? 'Terrorist' : 'Counter-Terrorist',
      roundNum: positions[0].roundNum,
      totalDistance: 0,
      averageVelocity: 0,
      maxVelocity: 0,
      mapControl: {
        areasCovered: [],
        timeInEachArea: {},
        dominantArea: ''
      },
      hotZones: [],
      rotations: [],
      utilityUsage: {
        smokes: [],
        flashes: [],
        nades: [],
        molotovs: []
      }
    };

    // Calculate movement metrics
    let totalVelocity = 0;
    const areaTime = new Map<string, number>();
    let previousPos: XYZPlayerData | null = null;

    positions.forEach((pos, index) => {
      // Calculate velocity
      const velocity = calculateVelocity(pos.velocityX, pos.velocityY, pos.velocityZ);
      totalVelocity += velocity;
      metrics.maxVelocity = Math.max(metrics.maxVelocity, velocity);

      // Calculate distance traveled
      if (previousPos) {
        const distance = calculateDistance(previousPos.X, previousPos.Y, pos.X, pos.Y);
        metrics.totalDistance += distance;
      }

      // Track area control
      const area = getMapArea(pos.X, pos.Y, mapName);
      const timeInArea = areaTime.get(area) || 0;
      areaTime.set(area, timeInArea + 1); // +1 tick

      // Track utility usage with real effectiveness calculation
      if (pos.xSmoke !== undefined && pos.ySmoke !== undefined && pos.zSmoke !== undefined) {
        metrics.utilityUsage.smokes.push({
          x: pos.xSmoke,
          y: pos.ySmoke,
          z: pos.zSmoke,
          effectiveness: calculateUtilityEffectiveness(pos.xSmoke, pos.ySmoke, 'smoke', rawData, pos.tick)
        });
      }

      if (pos.xFlashes !== undefined && pos.yFlashes !== undefined && pos.zFlashes !== undefined) {
        metrics.utilityUsage.flashes.push({
          x: pos.xFlashes,
          y: pos.yFlashes,
          z: pos.zFlashes,
          effectiveness: calculateUtilityEffectiveness(pos.xFlashes, pos.yFlashes, 'flash', rawData, pos.tick)
        });
      }

      if (pos.xHe !== undefined && pos.yHe !== undefined && pos.zHe !== undefined) {
        metrics.utilityUsage.nades.push({
          x: pos.xHe,
          y: pos.yHe,
          z: pos.zHe,
          effectiveness: calculateUtilityEffectiveness(pos.xHe, pos.yHe, 'he', rawData, pos.tick)
        });
      }

      if (pos.xInfernos !== undefined && pos.yInfernos !== undefined && pos.zInfernos !== undefined) {
        metrics.utilityUsage.molotovs.push({
          x: pos.xInfernos,
          y: pos.yInfernos,
          z: pos.zInfernos,
          effectiveness: calculateUtilityEffectiveness(pos.xInfernos, pos.yInfernos, 'molotov', rawData, pos.tick)
        });
      }

      previousPos = pos;
    });

    // Finalize metrics
    metrics.averageVelocity = positions.length > 0 ? totalVelocity / positions.length : 0;

    // Map control analysis
    metrics.mapControl.areasCovered = Array.from(areaTime.keys());
    metrics.mapControl.timeInEachArea = Object.fromEntries(areaTime);
    metrics.mapControl.dominantArea = Array.from(areaTime.entries())
      .sort(([,a], [,b]) => b - a)[0]?.[0] || 'Unknown';

    // Generate hot zones (areas of frequent positioning)
    metrics.hotZones = generateHotZones(positions, mapName);

    // Detect rotations
    metrics.rotations = detectRotations(positions, mapName);

    playerMetrics.set(playerId, metrics);
  });

  return Array.from(playerMetrics.values());
}

/**
 * Calculate utility effectiveness based on actual usage patterns and outcomes
 */
function calculateUtilityEffectiveness(x: number, y: number, type: string, allData: XYZPlayerData[], utilityTick: number): number {
  const effectivenessRadius = 400; // Units within which to measure impact
  const timeWindow = 320; // ~5 seconds in ticks to measure post-utility impact
  
  // Find all players within effectiveness radius during the time window
  const affectedPlayers = allData.filter(data => {
    const distance = calculateDistance(x, y, data.X, data.Y);
    const timeDiff = Math.abs(data.tick - utilityTick);
    
    return distance <= effectivenessRadius && timeDiff <= timeWindow;
  });
  
  if (affectedPlayers.length === 0) return 0.1;
  
  // Calculate effectiveness based on actual impact metrics
  let effectivenessScore = 0;
  let maxPossibleScore = 0;
  
  affectedPlayers.forEach(player => {
    const timeDiff = Math.abs(player.tick - utilityTick);
    const distance = calculateDistance(x, y, player.X, player.Y);
    const proximity = Math.max(0, 1 - (distance / effectivenessRadius));
    const timeRelevance = Math.max(0, 1 - (timeDiff / timeWindow));
    
    maxPossibleScore += proximity * timeRelevance;
    
    // Different utility types have different impact measurements
    switch (type) {
      case 'smoke':
        // Effectiveness based on player movement disruption and positioning changes
        const velocityMagnitude = calculateVelocity(player.velocityX, player.velocityY, player.velocityZ);
        if (velocityMagnitude < 50) { // Player stopped/slowed by smoke
          effectivenessScore += proximity * timeRelevance * 0.8;
        }
        if (player.flashDuration > 0) { // Player was also flashed through smoke
          effectivenessScore += proximity * timeRelevance * 0.3;
        }
        break;
        
      case 'flash':
        // Effectiveness based on actual flash duration
        if (player.flashDuration > 0) {
          const flashIntensity = Math.min(1, player.flashDuration / 2.0); // Normalize flash duration
          effectivenessScore += proximity * timeRelevance * flashIntensity;
        }
        break;
        
      case 'he':
        // Effectiveness based on health reduction and positioning impact
        if (player.health < 100) {
          const healthImpact = (100 - player.health) / 100;
          effectivenessScore += proximity * timeRelevance * healthImpact;
        }
        // Movement disruption from explosion
        const postUtilVelocity = calculateVelocity(player.velocityX, player.velocityY, player.velocityZ);
        if (postUtilVelocity > 200) { // Player forced to move quickly
          effectivenessScore += proximity * timeRelevance * 0.4;
        }
        break;
        
      case 'molotov':
        // Effectiveness based on area denial and movement patterns
        const playerVelocity = calculateVelocity(player.velocityX, player.velocityY, player.velocityZ);
        if (playerVelocity > 150) { // Player forced to move away
          effectivenessScore += proximity * timeRelevance * 0.7;
        }
        if (player.health < 100) { // Damage dealt
          const damageRatio = (100 - player.health) / 100;
          effectivenessScore += proximity * timeRelevance * damageRatio * 0.9;
        }
        break;
    }
  });
  
  // Normalize effectiveness score
  const normalizedScore = maxPossibleScore > 0 ? effectivenessScore / maxPossibleScore : 0;
  
  // Add strategic positioning bonus based on map area control
  const area = getMapArea(x, y, 'dynamic');
  const strategicBonus = calculateStrategicPositioningBonus(area, type, affectedPlayers);
  
  return Math.min(1.0, normalizedScore + strategicBonus);
}

/**
 * Calculate strategic positioning bonus based on area importance and team composition
 */
function calculateStrategicPositioningBonus(area: string, utilityType: string, affectedPlayers: XYZPlayerData[]): number {
  const enemyPlayers = affectedPlayers.filter(p => p.side !== affectedPlayers[0]?.side);
  const friendlyPlayers = affectedPlayers.filter(p => p.side === affectedPlayers[0]?.side);
  
  let bonus = 0;
  
  // High-value areas get bonus effectiveness
  if (area.includes('Site') || area.includes('Mid Control')) {
    bonus += 0.15;
  }
  
  // Utilities affecting more enemies than friendlies get bonus
  if (enemyPlayers.length > friendlyPlayers.length) {
    bonus += Math.min(0.2, (enemyPlayers.length - friendlyPlayers.length) * 0.05);
  }
  
  // Specific utility bonuses for strategic usage
  if (utilityType === 'smoke' && area.includes('Site')) {
    bonus += 0.1; // Smokes on sites are highly valuable
  }
  
  if (utilityType === 'flash' && enemyPlayers.length >= 2) {
    bonus += 0.15; // Multi-player flashes are very effective
  }
  
  return Math.min(0.3, bonus); // Cap bonus at 30%
}

/**
 * Generate hot zones using adaptive density-based clustering
 */
function generateHotZones(positions: XYZPlayerData[], mapName: string): Array<{x: number; y: number; intensity: number; timeSpent: number}> {
  if (positions.length === 0) return [];
  
  // Use DBSCAN-like clustering to find natural activity hotspots
  const clusters = performDensityBasedClustering(positions, 150, 5); // 150 unit radius, min 5 points
  
  const hotZones: Array<{x: number; y: number; intensity: number; timeSpent: number}> = [];
  
  clusters.forEach(cluster => {
    if (cluster.points.length === 0) return;
    
    // Calculate cluster center
    const centerX = cluster.points.reduce((sum, p) => sum + p.X, 0) / cluster.points.length;
    const centerY = cluster.points.reduce((sum, p) => sum + p.Y, 0) / cluster.points.length;
    
    // Calculate intensity based on point density and time spent
    const maxPoints = Math.max(...clusters.map(c => c.points.length));
    const intensity = cluster.points.length / maxPoints;
    
    // Calculate total time spent in this zone
    const timeSpent = cluster.points.length * 15.625; // Convert ticks to milliseconds (64 tick rate)
    
    // Only include significant clusters
    if (intensity > 0.1 && cluster.points.length >= 5) {
      hotZones.push({
        x: centerX,
        y: centerY,
        intensity,
        timeSpent
      });
    }
  });

  return hotZones.sort((a, b) => b.intensity - a.intensity);
}

/**
 * Perform density-based clustering similar to DBSCAN
 */
function performDensityBasedClustering(data: XYZPlayerData[], epsilon: number, minPoints: number): Array<{ points: XYZPlayerData[] }> {
  const clusters: Array<{ points: XYZPlayerData[] }> = [];
  const visited = new Set<number>();
  const clustered = new Set<number>();
  
  data.forEach((point, index) => {
    if (visited.has(index)) return;
    
    visited.add(index);
    const neighbors = findNeighbors(data, index, epsilon);
    
    if (neighbors.length < minPoints) {
      // Point is noise, skip
      return;
    }
    
    // Create new cluster
    const cluster = { points: [point] };
    clustered.add(index);
    
    // Expand cluster
    const queue = [...neighbors];
    while (queue.length > 0) {
      const neighborIndex = queue.shift()!;
      
      if (!visited.has(neighborIndex)) {
        visited.add(neighborIndex);
        const neighborNeighbors = findNeighbors(data, neighborIndex, epsilon);
        
        if (neighborNeighbors.length >= minPoints) {
          queue.push(...neighborNeighbors);
        }
      }
      
      if (!clustered.has(neighborIndex)) {
        cluster.points.push(data[neighborIndex]);
        clustered.add(neighborIndex);
      }
    }
    
    clusters.push(cluster);
  });
  
  return clusters;
}

/**
 * Find neighbors within epsilon distance
 */
function findNeighbors(data: XYZPlayerData[], pointIndex: number, epsilon: number): number[] {
  const point = data[pointIndex];
  const neighbors: number[] = [];
  
  data.forEach((otherPoint, index) => {
    if (index === pointIndex) return;
    
    const distance = calculateDistance(point.X, point.Y, otherPoint.X, otherPoint.Y);
    if (distance <= epsilon) {
      neighbors.push(index);
    }
  });
  
  return neighbors;
}

/**
 * Detect rotation patterns from position data
 */
function detectRotations(positions: XYZPlayerData[], mapName: string): Array<{from: string; to: string; timeToRotate: number; distanceTraveled: number}> {
  const rotations: Array<{from: string; to: string; timeToRotate: number; distanceTraveled: number}> = [];
  let currentArea = '';
  let areaStartTick = 0;
  let areaStartPos: XYZPlayerData | null = null;

  positions.forEach(pos => {
    const area = getMapArea(pos.X, pos.Y, mapName);
    
    if (area !== currentArea && currentArea !== '') {
      // Area change detected - record rotation
      if (areaStartPos) {
        const timeToRotate = (pos.tick - areaStartTick) * 15; // Convert to milliseconds
        const distanceTraveled = calculateDistance(areaStartPos.X, areaStartPos.Y, pos.X, pos.Y);
        
        rotations.push({
          from: currentArea,
          to: area,
          timeToRotate,
          distanceTraveled
        });
      }
    }
    
    if (area !== currentArea) {
      currentArea = area;
      areaStartTick = pos.tick;
      areaStartPos = pos;
    }
  });

  return rotations;
}

/**
 * Load and process XYZ data from attached assets
 */
export async function loadXYZData(): Promise<PositionalMetrics[]> {
  try {
    const filePath = path.join(process.cwd(), 'attached_assets', 'round_4_mapping_1749572845894.csv');
    const rawData = await parseXYZData(filePath);
    
    console.log(`Loaded ${rawData.length} XYZ position records`);
    
    // Process the data into positional metrics
    const metrics = processPositionalData(rawData, 'de_inferno');
    
    console.log(`Processed metrics for ${metrics.length} players`);
    
    return metrics;
  } catch (error) {
    console.error('Error loading XYZ data:', error);
    return [];
  }
}
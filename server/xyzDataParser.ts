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
 * Map area definitions for different CS2 maps
 */
const MAP_AREAS = {
  'de_inferno': {
    'A Site': { minX: 1800, maxX: 2600, minY: -800, maxY: 200 },
    'B Site': { minX: 100, maxX: 800, minY: 2000, maxY: 2800 },
    'Mid': { minX: 800, maxX: 1800, minY: 500, maxY: 1500 },
    'Apartments': { minX: 200, maxX: 1000, minY: 800, maxY: 1600 },
    'Banana': { minX: -400, maxX: 400, minY: 1800, maxY: 2600 },
    'T Spawn': { minX: -2000, maxX: -1000, minY: 2000, maxY: 3000 },
    'CT Spawn': { minX: 2000, maxX: 3000, minY: 1500, maxY: 2500 }
  },
  'de_dust2': {
    'A Site': { minX: 1000, maxX: 1800, minY: -1000, maxY: -200 },
    'B Site': { minX: -1000, maxX: -200, minY: 200, maxY: 1000 },
    'Mid': { minX: -200, maxX: 600, minY: -600, maxY: 200 },
    'Long': { minX: 600, maxX: 1400, minY: -1400, maxY: -600 },
    'Tunnels': { minX: -1400, maxX: -600, minY: -200, maxY: 600 },
    'T Spawn': { minX: -2000, maxX: -1400, minY: -1000, maxY: 0 },
    'CT Spawn': { minX: 1400, maxX: 2000, minY: -600, maxY: 400 }
  }
};

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
 * Determine which map area a position belongs to
 */
export function getMapArea(x: number, y: number, mapName: string = 'de_inferno'): string {
  const areas = MAP_AREAS[mapName as keyof typeof MAP_AREAS];
  if (!areas) return 'Unknown';

  for (const [areaName, bounds] of Object.entries(areas)) {
    if (x >= bounds.minX && x <= bounds.maxX && 
        y >= bounds.minY && y <= bounds.maxY) {
      return areaName;
    }
  }
  
  return 'Other';
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
export function processPositionalData(rawData: XYZPlayerData[], mapName: string = 'de_inferno'): PositionalMetrics[] {
  const playerMetrics = new Map<string, PositionalMetrics>();
  const playerPositions = new Map<string, XYZPlayerData[]>();

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

      // Track utility usage
      if (pos.xSmoke !== undefined && pos.ySmoke !== undefined && pos.zSmoke !== undefined) {
        metrics.utilityUsage.smokes.push({
          x: pos.xSmoke,
          y: pos.ySmoke,
          z: pos.zSmoke,
          effectiveness: calculateUtilityEffectiveness(pos.xSmoke, pos.ySmoke, 'smoke', mapName)
        });
      }

      if (pos.xFlashes !== undefined && pos.yFlashes !== undefined && pos.zFlashes !== undefined) {
        metrics.utilityUsage.flashes.push({
          x: pos.xFlashes,
          y: pos.yFlashes,
          z: pos.zFlashes,
          effectiveness: calculateUtilityEffectiveness(pos.xFlashes, pos.yFlashes, 'flash', mapName)
        });
      }

      if (pos.xHe !== undefined && pos.yHe !== undefined && pos.zHe !== undefined) {
        metrics.utilityUsage.nades.push({
          x: pos.xHe,
          y: pos.yHe,
          z: pos.zHe,
          effectiveness: calculateUtilityEffectiveness(pos.xHe, pos.yHe, 'he', mapName)
        });
      }

      if (pos.xInfernos !== undefined && pos.yInfernos !== undefined && pos.zInfernos !== undefined) {
        metrics.utilityUsage.molotovs.push({
          x: pos.xInfernos,
          y: pos.yInfernos,
          z: pos.zInfernos,
          effectiveness: calculateUtilityEffectiveness(pos.xInfernos, pos.yInfernos, 'molotov', mapName)
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
 * Calculate utility effectiveness based on position and type
 */
function calculateUtilityEffectiveness(x: number, y: number, type: string, mapName: string): number {
  const area = getMapArea(x, y, mapName);
  
  // Basic effectiveness calculation based on utility type and area
  const baseEffectiveness = {
    'smoke': { 'A Site': 0.9, 'B Site': 0.9, 'Mid': 0.8, 'default': 0.6 },
    'flash': { 'A Site': 0.8, 'B Site': 0.8, 'Mid': 0.7, 'default': 0.5 },
    'he': { 'A Site': 0.7, 'B Site': 0.7, 'Mid': 0.6, 'default': 0.4 },
    'molotov': { 'A Site': 0.8, 'B Site': 0.8, 'Mid': 0.5, 'default': 0.3 }
  };

  const typeEffectiveness = baseEffectiveness[type as keyof typeof baseEffectiveness];
  if (!typeEffectiveness) return 0.5;

  return typeEffectiveness[area as keyof typeof typeEffectiveness] || typeEffectiveness.default;
}

/**
 * Generate hot zones from position data
 */
function generateHotZones(positions: XYZPlayerData[], mapName: string): Array<{x: number; y: number; intensity: number; timeSpent: number}> {
  const gridSize = 200; // 200 unit grid cells
  const heatMap = new Map<string, { count: number; totalTime: number }>();

  positions.forEach(pos => {
    const gridX = Math.floor(pos.X / gridSize) * gridSize;
    const gridY = Math.floor(pos.Y / gridSize) * gridSize;
    const key = `${gridX},${gridY}`;
    
    const existing = heatMap.get(key) || { count: 0, totalTime: 0 };
    heatMap.set(key, {
      count: existing.count + 1,
      totalTime: existing.totalTime + 1 // 1 tick = ~15ms
    });
  });

  // Convert to hot zones array
  const hotZones: Array<{x: number; y: number; intensity: number; timeSpent: number}> = [];
  
  heatMap.forEach(({ count, totalTime }, key) => {
    const [x, y] = key.split(',').map(Number);
    const intensity = Math.min(1.0, count / 100); // Normalize intensity
    
    if (intensity > 0.1) { // Only include significant hot zones
      hotZones.push({
        x: x + gridSize / 2, // Center of grid cell
        y: y + gridSize / 2,
        intensity,
        timeSpent: totalTime * 15 // Convert ticks to milliseconds
      });
    }
  });

  return hotZones.sort((a, b) => b.intensity - a.intensity).slice(0, 20); // Top 20 hot zones
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
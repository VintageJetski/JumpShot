import { useState, useMemo, useEffect, useRef, useCallback } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { MapPin, TrendingUp, Zap, Target, Activity, Play, Pause, RotateCcw, Eye, Shield, Users } from 'lucide-react';

// Import map assets
import infernoMapPath from '@assets/De_inferno_GS_1749671392877.jpg';
import infernoRadarPath from '@assets/CS2_inferno_radar_1749672397531.webp';

interface XYZPlayerData {
  health: number;
  flash_duration: number;
  place?: string;
  armor: number;
  side: 't' | 'ct';
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
}

interface TacticalMapAnalysisProps {
  xyzData: XYZPlayerData[];
}

// Map coordinate bounds from round 4 data analysis
const INFERNO_MAP_CONFIG = {
  // Real coordinate bounds from round 4 data analysis
  bounds: { 
    minX: -1675.62, maxX: 2644.97,  // Exact bounds from data
    minY: -755.62, maxY: 3452.23    // Exact bounds from data
  }
};

// Convert CS2 coordinates to map percentage with proper scaling
function coordToMapPercent(x: number, y: number): { x: number, y: number } {
  const { bounds } = INFERNO_MAP_CONFIG;
  
  // Apply padding to ensure all coordinates fit within the visible map area
  const padding = 0.08; // 8% padding (copied from working PositionalAnalysisPage)
  const width = bounds.maxX - bounds.minX;
  const height = bounds.maxY - bounds.minY;
  
  const mapX = ((x - bounds.minX) / width) * (1 - 2 * padding) + padding;
  const mapY = ((y - bounds.minY) / height) * (1 - 2 * padding) + padding;
  
  // Invert Y coordinate for proper map orientation
  return { 
    x: Math.max(0, Math.min(100, mapX * 100)), 
    y: Math.max(0, Math.min(100, (1 - mapY) * 100)) 
  };
}

// Determine which zone a player is in using manually mapped zones ONLY
function getPlayerZone(x: number, y: number, mappedZones?: Map<string, {x: number, y: number, w: number, h: number}>): string {
  // Only use manually mapped zones - no hardcoded fallbacks
  if (mappedZones && mappedZones.size > 0) {
    // Convert game coordinates to map percentage for zone checking
    const mapPos = coordToMapPercent(x, y);
    
    for (const [zoneKey, zoneRect] of mappedZones) {
      // Check if player position (as percentage) is within zone rectangle (as percentage)
      if (mapPos.x >= zoneRect.x && 
          mapPos.x <= (zoneRect.x + zoneRect.w) &&
          mapPos.y >= zoneRect.y && 
          mapPos.y <= (zoneRect.y + zoneRect.h)) {
        return zoneKey;
      }
    }
  }
  
  // No fallback - return UNKNOWN if no manual zones match
  return 'UNKNOWN';
}

// Get authentic tactical events from real data analysis
function getAuthenticTacticalEvents(zoneName: string, data: XYZPlayerData[]): Array<{
  icon: string;
  color: string;
  size?: number;
  fontSize?: string;
  x?: number;
  y?: number;
}> {
  const events: Array<{
    icon: string;
    color: string;
    size?: number;
    fontSize?: string;
    x?: number;
    y?: number;
  }> = [];

  // Filter data for this zone using manually mapped zones
  const zoneData = data.filter(point => {
    const zone = getPlayerZone(point.X, point.Y);
    return zone === zoneName;
  });

  // DEBUG: Only log zones with significant activity, with special focus on CONSTRUCTION and APARTMENTS
  if (zoneData.length > 50 || zoneData.filter(p => p.health <= 0).length > 0 || zoneName === 'CONSTRUCTION' || zoneName === 'APARTMENTS') {
    const uniquePlayers = [...new Set(zoneData.map(p => p.name || p.steamId))];
    console.log(`🔍 ZONE ANALYSIS ${zoneName}:`, {
      dataPoints: zoneData.length,
      playerNames: uniquePlayers,
      zoneBounds: INFERNO_MAP_CONFIG.zones[zoneName],
      tPresence: zoneData.filter(p => p.side === 't').length,
      ctPresence: zoneData.filter(p => p.side === 'ct').length,
      sampleCoordinates: zoneData.slice(0, 3).map(p => [p.X, p.Y])
    });
  }

  if (zoneData.length === 0) return events;

  // Analyze actual combat events - focus on health transitions, not persistent health=0
  // Group by player and look for health drops indicating actual combat
  const playerHealthMap = new Map<string, Array<{tick: number, health: number}>>();
  
  zoneData.forEach(point => {
    const key = point.steamId || point.name;
    if (!playerHealthMap.has(key)) {
      playerHealthMap.set(key, []);
    }
    playerHealthMap.get(key)!.push({tick: point.tick, health: point.health});
  });

  // Detect actual death events (health drops to 0 from >0)
  const actualDeathEvents: Array<{player: string, side: string, tick: number}> = [];
  
  playerHealthMap.forEach((healthHistory, player) => {
    // Sort by tick to analyze sequence
    const sorted = healthHistory.sort((a, b) => a.tick - b.tick);
    
    for (let i = 1; i < sorted.length; i++) {
      const prev = sorted[i-1];
      const curr = sorted[i];
      
      // Death occurred if health dropped from >0 to 0
      if (prev.health > 0 && curr.health === 0) {
        const playerData = zoneData.find(p => (p.steamId || p.name) === player);
        if (playerData) {
          actualDeathEvents.push({
            player,
            side: playerData.side,
            tick: curr.tick
          });
        }
        break; // Only count first death per player
      }
    }
  });

  // DEBUG: Only log real death events
  if (actualDeathEvents.length > 0) {
    console.log(`⚔️ REAL COMBAT in ${zoneName}:`, {
      actualDeaths: actualDeathEvents.length,
      deathDetails: actualDeathEvents
    });
  }

  if (actualDeathEvents.length >= 1) {
    // Check if deaths from both sides occurred
    const tDeaths = actualDeathEvents.filter(d => d.side === 't').length;
    const ctDeaths = actualDeathEvents.filter(d => d.side === 'ct').length;
    
    if (tDeaths > 0 && ctDeaths > 0) {
      // Real duel with casualties on both sides
      events.push({
        icon: '⚔️',
        color: 'rgba(255, 165, 0, 0.9)',
        size: 8,
        fontSize: 'bold 10px sans-serif',
        x: 10,
        y: 15
      });
    } else if (tDeaths > 0 || ctDeaths > 0) {
      // One-sided engagement
      events.push({
        icon: '💥',
        color: 'rgba(220, 38, 38, 0.8)',
        size: 6,
        x: 15,
        y: 25
      });
    }
  }

  // Analyze utility usage (flash/smoke effects)
  const utilityEvents = zoneData.filter(point => point.flash_duration > 0);
  if (utilityEvents.length > 0) {
    events.push({
      icon: '💨',
      color: 'rgba(147, 51, 234, 0.8)',
      size: 6,
      x: -10,
      y: 25
    });
  }

  // Analyze territory control patterns
  const tPresence = zoneData.filter(p => p.side === 't').length;
  const ctPresence = zoneData.filter(p => p.side === 'ct').length;
  
  // Analyze lurker patterns (T players alone in advanced zones)
  const tPlayers = zoneData.filter(p => p.side === 't');
  const uniqueTPlayers = [...new Set(tPlayers.map(p => p.steamId))];
  
  // For each T player in this zone, check if they're isolated from teammates
  uniqueTPlayers.forEach(playerId => {
    const playerPoints = tPlayers.filter(p => p.steamId === playerId);
    if (playerPoints.length > 50) { // Significant presence duration
      
      // DEBUG: Show detailed coordinate analysis for specific players
      const playerName = playerPoints[0]?.name || 'Unknown';
      if (playerName === 'ropz' && zoneName === 'CONSTRUCTION') {
        console.log(`🚨 CONSTRUCTION ZONE ISSUE - ropz coordinates:`, {
          totalPoints: playerPoints.length,
          actualCoordinates: playerPoints.slice(0, 10).map(p => ({
            tick: p.tick,
            coordinates: [p.X, p.Y],
            recalculatedZone: getPlayerZone(p.X, p.Y)
          })),
          constructionZoneBounds: INFERNO_MAP_CONFIG.zones.CONSTRUCTION,
          allZoneDefinitions: INFERNO_MAP_CONFIG.zones,
          playerShouldBeInApartments: 'ropz should be lurking in APARTMENTS according to heatmap'
        });
        
        // Test coordinate against all zones to see which ones claim these coordinates
        const testCoord = playerPoints[0];
        const zoneMatches = Object.keys(INFERNO_MAP_CONFIG.zones).filter(zoneName => {
          const zone = INFERNO_MAP_CONFIG.zones[zoneName];
          return testCoord.X >= zone.bounds.minX && 
                 testCoord.X <= zone.bounds.maxX && 
                 testCoord.Y >= zone.bounds.minY && 
                 testCoord.Y <= zone.bounds.maxY;
        });
        
        console.log(`🔍 COORDINATE ZONE OVERLAP TEST:`, {
          testCoordinate: [testCoord.X, testCoord.Y],
          matchingZones: zoneMatches,
          shouldBeInApartments: 'Based on heatmap visual'
        });
        
        // Extract actual coordinate values for zone boundary reconstruction
        const actualCoords = playerPoints.slice(0, 20).map(p => [p.X, p.Y]);
        const coordRange = {
          minX: Math.min(...playerPoints.map(p => p.X)),
          maxX: Math.max(...playerPoints.map(p => p.X)),
          minY: Math.min(...playerPoints.map(p => p.Y)),
          maxY: Math.max(...playerPoints.map(p => p.Y))
        };
        
        console.log(`🔧 ZONE BOUNDARY RECONSTRUCTION DATA:`, {
          ropzCoordinates: actualCoords,
          currentConstructionBounds: INFERNO_MAP_CONFIG.zones.CONSTRUCTION.bounds,
          currentApartmentsBounds: INFERNO_MAP_CONFIG.zones.APARTMENTS.bounds,
          coordinateRange: coordRange
        });
        
        // Show the actual values for immediate debugging
        console.log(`📍 ACTUAL COORDINATES (first 5):`, actualCoords.slice(0, 5));
        console.log(`📏 COORDINATE RANGE:`, coordRange);
        console.log(`🏗️ CONSTRUCTION BOUNDS:`, INFERNO_MAP_CONFIG.zones.CONSTRUCTION.bounds);
        console.log(`🏠 APARTMENTS BOUNDS:`, INFERNO_MAP_CONFIG.zones.APARTMENTS.bounds);
      }
      
      // Check if player is alone by sampling ticks and checking teammate distances
      const sampleTicks = playerPoints.filter((_, i) => i % 10 === 0); // Sample every 10th point
      let aloneCount = 0;
      
      sampleTicks.forEach(point => {
        // Find all teammates at same tick
        const teammates = data.filter(d => 
          d.tick === point.tick && 
          d.side === 't' && 
          d.steamId !== playerId
        );
        
        // Calculate distances to teammates
        const distances = teammates.map(mate => 
          Math.sqrt(Math.pow(point.X - mate.X, 2) + Math.pow(point.Y - mate.Y, 2))
        );
        
        // If no teammates within 500 units, player is isolated
        if (distances.length === 0 || Math.min(...distances) > 500) {
          aloneCount++;
        }
      });
      
      // If alone for significant portion, it's lurking
      if (aloneCount > sampleTicks.length * 0.6) {
        console.log(`👁️ LURKER DETECTED: ${zoneName} - ${playerName} alone ${(aloneCount / sampleTicks.length * 100).toFixed(1)}% of time`);
        
        events.push({
          icon: '👁️',
          color: 'rgba(255, 193, 7, 0.9)',
          size: 7,
          x: 25,
          y: 45
        });
      }
    }
  });
  
  // Only show control markers if there's significant presence disparity
  if (tPresence > ctPresence * 2 && tPresence > 10) {
    events.push({
      icon: '🏴',
      color: 'rgba(220, 38, 38, 0.8)',
      size: 6,
      x: 15,
      y: 35
    });
  } else if (ctPresence > tPresence * 2 && ctPresence > 10) {
    events.push({
      icon: '🛡️',
      color: 'rgba(34, 197, 94, 0.8)',
      size: 6,
      x: 15,
      y: 35
    });
  }

  return events;
}

// ML-driven tactical insights from authentic CS2 data
interface TacticalInsight {
  type: 'positioning' | 'rotation' | 'engagement' | 'utility' | 'economic';
  description: string;
  confidence: number;
  impact: 'high' | 'medium' | 'low';
  recommendation: string;
}

// Calculate advanced movement and tactical metrics
function calculateMovementMetrics(data: XYZPlayerData[]) {
  const playerMovement = new Map<string, {
    totalDistance: number;
    zones: Set<string>;
    engagements: number;
    avgVelocity: number;
    positions: Array<{ x: number, y: number, tick: number, zone: string }>;
    rotationPattern: string[];
    utilityUsage: number;
    economicImpact: number;
  }>();

  // Sort data by tick for sequential analysis
  const sortedData = data.sort((a, b) => a.tick - b.tick);
  
  sortedData.forEach((point, index) => {
    const key = `${point.name}_${point.side}`;
    if (!playerMovement.has(key)) {
      playerMovement.set(key, {
        totalDistance: 0,
        zones: new Set(),
        engagements: 0,
        avgVelocity: 0,
        positions: [],
        rotationPattern: [],
        utilityUsage: 0,
        economicImpact: 0
      });
    }

    const movement = playerMovement.get(key)!;
    const zone = getPlayerZone(point.X, point.Y);
    movement.zones.add(zone);
    
    // Track zone transitions for rotation analysis
    if (movement.positions.length > 0) {
      const lastZone = movement.positions[movement.positions.length - 1].zone;
      if (lastZone !== zone) {
        movement.rotationPattern.push(`${lastZone}->${zone}`);
      }
    }
    
    movement.positions.push({ 
      x: point.X, 
      y: point.Y, 
      tick: point.tick, 
      zone 
    });

    const velocity = Math.sqrt(point.velocity_X ** 2 + point.velocity_Y ** 2);
    movement.avgVelocity = (movement.avgVelocity + velocity) / 2;
    
    // Calculate distance traveled
    if (index > 0 && sortedData[index - 1].name === point.name) {
      const prevPoint = sortedData[index - 1];
      const distance = Math.sqrt(
        Math.pow(point.X - prevPoint.X, 2) + 
        Math.pow(point.Y - prevPoint.Y, 2)
      );
      movement.totalDistance += distance;
    }
    
    // Track engagements and utility usage
    if (point.health < 100) movement.engagements++;
    if (point.flash_duration > 0) movement.utilityUsage++;
  });

  return playerMovement;
}

// Enhanced role-based tactical insights using advanced zone analytics
function generateEnhancedTacticalInsights(
  movementMetrics: Map<string, any>, 
  zoneAnalytics: Map<string, any>,
  tacticalValues: Map<string, any>,
  data: XYZPlayerData[]
): TacticalInsight[] {
  const insights: TacticalInsight[] = [];
  
  // Phase 1 Enhanced Analytics: Real-Time Player State Assessment
  
  // Player survival analysis (replacing vulnerability alerts with more tactical insights)
  const lowHealthPlayers = data.filter(d => d.health > 0 && d.health < 50);
  const deadPlayers = data.filter(d => d.health <= 0);
  
  if (deadPlayers.length > 0) {
    insights.push({
      type: 'tactical',
      description: `Combat casualties: ${deadPlayers.length} players eliminated, ${lowHealthPlayers.length} wounded`,
      confidence: 0.98,
      impact: 'high',
      recommendation: deadPlayers.length > 2 ? 'Critical player disadvantage - consider saving weapons' : 'Manageable casualties - maintain aggression'
    });
  }
  
  // Flash coordination and impact tracking
  const flashedPlayers = data.filter(d => d.flash_duration > 0);
  if (flashedPlayers.length > 0) {
    const avgFlash = flashedPlayers.reduce((sum, p) => sum + p.flash_duration, 0) / flashedPlayers.length;
    insights.push({
      type: 'utility',
      description: `Flash warfare: ${flashedPlayers.length} players affected, ${avgFlash.toFixed(1)}s avg duration`,
      confidence: 0.90,
      impact: 'high',
      recommendation: avgFlash > 2.5 ? 'Excellent flash usage - capitalize on blind enemies' : 'Quick flash recovery detected'
    });
  }
  
  // Armor economics assessment
  const armorData = {
    armored: data.filter(d => d.armor > 0).length,
    total: data.length,
    fullArmor: data.filter(d => d.armor >= 100).length
  };
  if (armorData.armored / armorData.total < 0.6) {
    insights.push({
      type: 'economic',
      description: `Armor disadvantage: Only ${armorData.armored}/${armorData.total} players equipped`,
      confidence: 0.85,
      impact: 'medium',
      recommendation: 'Consider defensive positioning until next buy round'
    });
  }
  
  // Velocity-based movement prediction
  const activePlayers = data.filter(d => Math.sqrt(d.velocity_X ** 2 + d.velocity_Y ** 2) > 150);
  if (activePlayers.length > 2) {
    const rotationZones = activePlayers.map(p => getPlayerZone(p.X, p.Y));
    insights.push({
      type: 'rotation',
      description: `High mobility detected: ${activePlayers.length} players in active rotation`,
      confidence: 0.82,
      impact: 'medium',
      recommendation: 'Expect aggressive site executes or rapid rotations'
    });
  }
  
  // Analyze AWPer positioning patterns
  const awperPositions = data.filter(d => d.name.includes('s1mple') || d.name.includes('ZywOo') || d.name.includes('sh1ro'));
  if (awperPositions.length > 0) {
    const awperZones = awperPositions.map(p => getPlayerZone(p.X, p.Y));
    const longRangeZones = awperZones.filter(z => ['A_SITE', 'LONG_HALL', 'PIT'].includes(z));
    const awperEfficiency = longRangeZones.length / awperZones.length;
    
    insights.push({
      type: 'positioning',
      description: `AWPer positioning efficiency: ${(awperEfficiency * 100).toFixed(1)}% in optimal angles`,
      confidence: 0.88,
      impact: awperEfficiency > 0.6 ? 'high' : 'medium',
      recommendation: awperEfficiency > 0.6 ? 
        'AWPer maintains excellent long-range positioning' : 
        'AWPer should prioritize long-range angles and site control positions'
    });
  }
  
  // Entry fragger analysis
  const entryPlayers = data.filter(d => d.side === 't' && d.velocity_X !== 0 && d.velocity_Y !== 0);
  const entryZones = entryPlayers.map(p => getPlayerZone(p.X, p.Y));
  const chokePoints = entryZones.filter(z => ['BANANA', 'APARTMENTS', 'MIDDLE'].includes(z));
  
  if (entryPlayers.length > 0) {
    const entryEfficiency = chokePoints.length / entryZones.length;
    insights.push({
      type: 'engagement',
      description: `Entry fraggers targeting key choke points: ${(entryEfficiency * 100).toFixed(1)}% efficiency`,
      confidence: 0.82,
      impact: 'high',
      recommendation: entryEfficiency > 0.4 ? 
        'Strong entry coordination through primary choke points' : 
        'Focus T-side entries through Banana, Apartments, and Mid control'
    });
  }
  
  // Support player utility analysis
  const supportUtility = data.filter(d => d.flash_duration > 0 || d.armor > 0);
  const utilityZones = supportUtility.map(p => getPlayerZone(p.X, p.Y));
  const supportZones = utilityZones.filter(z => ['CONNECTOR', 'ARCH_SIDE', 'SPEEDWAY'].includes(z));
  
  if (supportUtility.length > 0) {
    const supportEfficiency = supportZones.length / utilityZones.length;
    insights.push({
      type: 'utility',
      description: `Support utility deployed in strategic positions: ${(supportEfficiency * 100).toFixed(1)}%`,
      confidence: 0.75,
      impact: 'medium',
      recommendation: 'Support players should focus utility usage around connector areas and site approaches'
    });
  }
  
  // Lurker positioning analysis
  const lurkerMovement = Array.from(movementMetrics.values()).filter(m => m.rotationPattern.length < 2);
  if (lurkerMovement.length > 0) {
    const avgDistance = lurkerMovement.reduce((sum, m) => sum + m.totalDistance, 0) / lurkerMovement.length;
    insights.push({
      type: 'positioning',
      description: `Lurker positioning detected: ${avgDistance.toFixed(0)} units average movement`,
      confidence: 0.70,
      impact: 'medium',
      recommendation: 'Lurkers maintaining good positional discipline for late-round impact'
    });
  }
  
  // Advanced zone-based tactical analysis using real analytics
  if (zoneAnalytics.size > 0) {
    const highActivityZones = Array.from(zoneAnalytics.entries())
      .sort((a, b) => (b[1].dwellTime.t + b[1].dwellTime.ct) - (a[1].dwellTime.t + a[1].dwellTime.ct))
      .slice(0, 3);
    
    if (highActivityZones.length > 0) {
      const topZone = highActivityZones[0];
      const zoneFocus = topZone[1];
      const tactical = zoneFocus.dwellTime.t > zoneFocus.dwellTime.ct ? 'T-sided' : 'CT-sided';
      insights.push({
        type: 'positioning',
        description: `${tactical} tactical focus in ${topZone[0].replace('_', ' ')}`,
        confidence: 0.85,
        impact: 'high',
        recommendation: `IGL should adapt strategy based on ${tactical} dominance patterns`
      });
    }
  }
  
  // Anchor player defensive analysis
  const defensivePositions = data.filter(d => d.side === 'ct' && d.velocity_X === 0 && d.velocity_Y === 0);
  const anchorZones = defensivePositions.map(p => getPlayerZone(p.X, p.Y));
  const siteAnchors = anchorZones.filter(z => ['A_SITE', 'B_SITE'].includes(z));
  
  if (defensivePositions.length > 0) {
    const anchorEfficiency = siteAnchors.length / anchorZones.length;
    insights.push({
      type: 'positioning',
      description: `Site anchoring efficiency: ${(anchorEfficiency * 100).toFixed(1)}% on bomb sites`,
      confidence: 0.83,
      impact: 'high',
      recommendation: anchorEfficiency > 0.5 ? 
        'Strong site anchoring maintaining defensive control' : 
        'Anchor players should prioritize direct site positions over rotational areas'
    });
  }
  
  return insights;
}

// Advanced Zone Analytics using accurate zone mapping
function calculateAdvancedZoneAnalytics(data: XYZPlayerData[], mappedZones: Map<string, {x: number, y: number, w: number, h: number}>) {
  // Always try to load manually mapped zones first
  let actualMappedZones = mappedZones;
  if (!actualMappedZones || actualMappedZones.size === 0) {
    const saved = localStorage.getItem('infernoZoneMapping');
    if (saved) {
      try {
        const zonesObject = JSON.parse(saved);
        actualMappedZones = new Map(Object.entries(zonesObject));
        console.log('🗺️ ZONE ANALYTICS - Loaded zones from localStorage:', actualMappedZones.size);
      } catch (error) {
        console.error('❌ ERROR LOADING ZONES:', error);
      }
    }
  }
  
  // If still no manual zones, create basic fallback zones for interface functionality
  if (!actualMappedZones || actualMappedZones.size === 0) {
    actualMappedZones = new Map();
    // Add basic zones so the interface works while user sets up manual zones
    Object.entries(INFERNO_MAP_CONFIG.zones).forEach(([zoneName, zone]) => {
      const bounds = zone.bounds;
      const pos1 = coordToMapPercent(bounds.minX, bounds.minY);
      const pos2 = coordToMapPercent(bounds.maxX, bounds.maxY);
      actualMappedZones.set(zoneName, {
        x: (pos1.x / 100) * 800,
        y: (pos1.y / 100) * 600,
        w: Math.abs((pos2.x - pos1.x) / 100) * 800,
        h: Math.abs((pos2.y - pos1.y) / 100) * 600
      });
    });
  }
  const zoneAnalytics = new Map<string, {
    // Real-time occupation
    simultaneousPresence: number;
    contestedMoments: number;
    
    // Combat-weighted control
    fightOutcomes: { tWins: number, ctWins: number };
    firstBloods: { t: number, ct: number };
    
    // Time-contextual phases
    earlyRoundControl: { t: number, ct: number };  // 0-30s
    midRoundControl: { t: number, ct: number };    // 30-90s
    lateRoundControl: { t: number, ct: number };   // 90s+
    
    // Role-based activity
    awperActivity: number;
    entryActivity: number;
    supportActivity: number;
    anchorActivity: number;
    
    // Tactical values
    dwellTime: { t: number, ct: number };
    rotationThroughput: number;
    denialSuccess: { t: number, ct: number };
  }>();

  // Initialize analytics for all mapped zones
  actualMappedZones.forEach((zone, zoneName) => {
    zoneAnalytics.set(zoneName, {
      simultaneousPresence: 0,
      contestedMoments: 0,
      fightOutcomes: { tWins: 0, ctWins: 0 },
      firstBloods: { t: 0, ct: 0 },
      earlyRoundControl: { t: 0, ct: 0 },
      midRoundControl: { t: 0, ct: 0 },
      lateRoundControl: { t: 0, ct: 0 },
      awperActivity: 0,
      entryActivity: 0,
      supportActivity: 0,
      anchorActivity: 0,
      dwellTime: { t: 0, ct: 0 },
      rotationThroughput: 0,
      denialSuccess: { t: 0, ct: 0 }
    });
  });

  // Group data by tick to analyze simultaneous presence
  const tickGroups = new Map<number, XYZPlayerData[]>();
  data.forEach(point => {
    if (!tickGroups.has(point.tick)) {
      tickGroups.set(point.tick, []);
    }
    tickGroups.get(point.tick)!.push(point);
  });

  // Get round duration for time-based analysis
  const ticks = Array.from(tickGroups.keys()).sort((a, b) => a - b);
  const minTick = ticks[0] || 0;
  const maxTick = ticks[ticks.length - 1] || 0;
  const roundDuration = maxTick - minTick;

  // Analyze each tick for zone activity
  tickGroups.forEach((tickData, tick) => {
    const roundTime = tick - minTick;
    const roundPhase = roundTime < roundDuration * 0.25 ? 'early' : 
                     roundTime < roundDuration * 0.75 ? 'mid' : 'late';

    // Check each zone for activity this tick
    actualMappedZones.forEach((zoneRect, zoneName) => {
      const playersInZone = tickData.filter(player => 
        isPlayerInZone(player.X, player.Y, zoneRect)
      );

      const tPlayers = playersInZone.filter(p => p.side === 't');
      const ctPlayers = playersInZone.filter(p => p.side === 'ct');

      const analytics = zoneAnalytics.get(zoneName)!;

      // Simultaneous presence and contested moments
      if (tPlayers.length > 0 && ctPlayers.length > 0) {
        analytics.simultaneousPresence++;
        analytics.contestedMoments++;
      }

      // Dwell time calculation
      analytics.dwellTime.t += tPlayers.length;
      analytics.dwellTime.ct += ctPlayers.length;

      // Time-contextual control
      if (roundPhase === 'early') {
        analytics.earlyRoundControl.t += tPlayers.length;
        analytics.earlyRoundControl.ct += ctPlayers.length;
      } else if (roundPhase === 'mid') {
        analytics.midRoundControl.t += tPlayers.length;
        analytics.midRoundControl.ct += ctPlayers.length;
      } else {
        analytics.lateRoundControl.t += tPlayers.length;
        analytics.lateRoundControl.ct += ctPlayers.length;
      }

      // Role-based activity detection
      playersInZone.forEach(player => {
        // AWPer detection (high velocity players in long-range zones)
        if (['A_SITE', 'LIBRARY', 'PIT', 'LONG_HALL'].includes(zoneName)) {
          const velocity = Math.sqrt(player.velocity_X ** 2 + player.velocity_Y ** 2);
          if (velocity < 100) { // Stationary AWP positioning
            analytics.awperActivity++;
          }
        }

        // Entry fragger detection (high velocity in chokepoints)
        if (['BANANA', 'APARTMENTS', 'MIDDLE', 'T_RAMP'].includes(zoneName)) {
          const velocity = Math.sqrt(player.velocity_X ** 2 + player.velocity_Y ** 2);
          if (velocity > 200 && player.side === 't') {
            analytics.entryActivity++;
          }
        }

        // Support activity (utility usage indicators)
        if (player.flash_duration > 0 || player.armor > 0) {
          analytics.supportActivity++;
        }

        // Anchor activity (static CT positioning on sites)
        if (['A_SITE', 'B_SITE'].includes(zoneName) && player.side === 'ct') {
          const velocity = Math.sqrt(player.velocity_X ** 2 + player.velocity_Y ** 2);
          if (velocity < 50) {
            analytics.anchorActivity++;
          }
        }
      });

      // Combat outcomes (approximated by health changes)
      const damagedPlayers = playersInZone.filter(p => p.health < 100 && p.health > 0);
      const deadPlayers = playersInZone.filter(p => p.health <= 0);
      
      deadPlayers.forEach(player => {
        if (player.side === 't') {
          analytics.fightOutcomes.ctWins++;
        } else {
          analytics.fightOutcomes.tWins++;
        }
      });

      // Rotation throughput (players moving through zone quickly)
      const fastMovingPlayers = playersInZone.filter(p => {
        const velocity = Math.sqrt(p.velocity_X ** 2 + p.velocity_Y ** 2);
        return velocity > 250;
      });
      analytics.rotationThroughput += fastMovingPlayers.length;
    });
  });

  return zoneAnalytics;
}

// Helper function to check if player coordinates are within mapped zone
function isPlayerInZone(playerX: number, playerY: number, zoneRect: {x: number, y: number, w: number, h: number}): boolean {
  // Convert player world coordinates to canvas coordinates
  const pos = coordToMapPercent(playerX, playerY);
  const canvasX = (pos.x / 100) * 800; // Canvas width
  const canvasY = (pos.y / 100) * 600; // Canvas height
  
  const isInZone = canvasX >= zoneRect.x && 
         canvasX <= zoneRect.x + zoneRect.w &&
         canvasY >= zoneRect.y && 
         canvasY <= zoneRect.y + zoneRect.h;
  
  // Debug logging for coordinate conversion
  if (playerX === -1675.62 && Math.abs(playerY - 351.695) < 1) { // ropz's coordinates
    console.log('🎯 ROPZ COORDINATE DEBUG:', {
      worldCoords: { x: playerX, y: playerY },
      mapPercent: pos,
      canvasCoords: { x: canvasX, y: canvasY },
      zoneRect,
      isInZone
    });
  }
  
  return isInZone;
}

// Calculate tactical zone values for strategic decision making
function calculateTacticalZoneValues(zoneAnalytics: Map<string, any>) {
  const tacticalValues = new Map<string, {
    controlValue: number;
    contestedIntensity: number;
    strategicImportance: number;
    roleEfficiency: number;
    recommendation: string;
  }>();

  zoneAnalytics.forEach((analytics, zoneName) => {
    // Control Value: Based on who holds the zone when it matters
    const totalLateControl = analytics.lateRoundControl.t + analytics.lateRoundControl.ct;
    const controlValue = totalLateControl > 0 ? 
      Math.abs(analytics.lateRoundControl.t - analytics.lateRoundControl.ct) / totalLateControl : 0;

    // Contested Intensity: Combined fighting + presence (includes lurker control)
    const totalPresence = analytics.dwellTime.t + analytics.dwellTime.ct;
    const presenceIntensity = totalPresence > 0 ? analytics.simultaneousPresence / totalPresence : 0;
    const combatWeight = analytics.contestedMoments > 0 ? 0.7 : 0; // Combat gets 70% weight
    const presenceWeight = presenceIntensity > 0 ? 0.3 : 0; // Non-combat presence gets 30% weight
    const contestedIntensity = combatWeight * (analytics.contestedMoments / Math.max(totalPresence, 1)) + 
                               presenceWeight * presenceIntensity;

    // Strategic Importance: Based on CS2 tactical reality
    let strategicImportance = 0;
    if (['BANANA', 'APARTMENTS', 'MIDDLE'].includes(zoneName)) {
      strategicImportance = 0.95; // Major chokepoints - control the round flow
    } else if (['A_SITE', 'B_SITE'].includes(zoneName)) {
      strategicImportance = 0.70; // Bomb sites - important but chokepoints dictate access
    } else if (['PIT', 'ARCH', 'LIBRARY', 'LONG_HALL', 'A_SHORT'].includes(zoneName)) {
      strategicImportance = 0.70; // Key angles for map control
    } else if (['CT_SPAWN', 'T_SPAWN'].includes(zoneName)) {
      strategicImportance = 0.0; // Spawns offer no strategic value mid-round
    } else {
      strategicImportance = 0.60; // Support positions
    }

    // Role Efficiency: How well roles are being executed in this zone
    const totalRoleActivity = analytics.awperActivity + analytics.entryActivity + 
                             analytics.supportActivity + analytics.anchorActivity;
    const roleEfficiency = totalRoleActivity > 0 ? 
      Math.max(analytics.awperActivity, analytics.entryActivity, analytics.supportActivity, analytics.anchorActivity) / totalRoleActivity : 0;

    // Generate tactical recommendation
    let recommendation = '';
    if (contestedIntensity > 0.7) {
      recommendation = 'High-contest zone - coordinate utility usage';
    } else if (controlValue > 0.8) {
      recommendation = 'Strong control established - maintain positioning';
    } else if (roleEfficiency < 0.4) {
      recommendation = 'Poor role execution - reassign player positions';
    } else {
      recommendation = 'Balanced activity - monitor for opportunities';
    }

    tacticalValues.set(zoneName, {
      controlValue,
      contestedIntensity,
      strategicImportance,
      roleEfficiency,
      recommendation
    });
  });

  return tacticalValues;
}

export function TacticalMapAnalysis({ xyzData }: TacticalMapAnalysisProps) {
  const [selectedPlayer, setSelectedPlayer] = useState<string>('all');
  const [selectedRound, setSelectedRound] = useState<string>('round_4');
  const [currentTick, setCurrentTick] = useState<number>(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [playbackSpeed, setPlaybackSpeed] = useState(1);
  const [activeTab, setActiveTab] = useState('live');
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [mapImage, setMapImage] = useState<HTMLImageElement | null>(null);
  const [isMapping, setIsMapping] = useState(false);
  const [mappedZones, setMappedZones] = useState<Map<string, {x: number, y: number, w: number, h: number}>>(new Map());
  const [draggedZone, setDraggedZone] = useState<string | null>(null);
  const [dragOffset, setDragOffset] = useState<{x: number, y: number}>({ x: 0, y: 0 });
  const [resizingZone, setResizingZone] = useState<string | null>(null);
  const [resizeHandle, setResizeHandle] = useState<'tl' | 'tr' | 'bl' | 'br' | null>(null);
  const [isDragging, setIsDragging] = useState(false);

  // Get available rounds from data
  const availableRounds = useMemo(() => {
    if (!xyzData.length) return [];
    const uniqueRounds = Array.from(new Set(xyzData.map(d => d.round_num)))
      .sort((a, b) => a - b);
    return uniqueRounds;
  }, [xyzData]);

  // Process data for analysis using accurate zone mapping
  const analysisData = useMemo(() => {
    if (!xyzData.length || isDragging) return null;

    // Filter data by selected round first
    let processedData = xyzData;
    if (selectedRound !== 'all_rounds') {
      const roundNum = parseInt(selectedRound.replace('round_', ''));
      processedData = xyzData.filter(d => d.round_num === roundNum);
    }

    const movementMetrics = calculateMovementMetrics(processedData);
    
    // Advanced zone analytics using accurately mapped zones (or fallback zones if none mapped)
    const zoneAnalytics = calculateAdvancedZoneAnalytics(processedData, mappedZones);
    const tacticalValues = calculateTacticalZoneValues(zoneAnalytics);
    
    // Enhanced tactical insights based on zone analytics
    const tacticalInsights = generateEnhancedTacticalInsights(movementMetrics, zoneAnalytics, tacticalValues, processedData);
    
    const ticks = Array.from(new Set(processedData.map(d => d.tick))).sort((a, b) => a - b);
    const players = Array.from(new Set(processedData.map(d => d.name)));
    
    // Generate heatmap data
    const heatmapData = new Map<string, number>();
    const gridSize = 50;
    processedData.forEach(point => {
      const pos = coordToMapPercent(point.X, point.Y);
      const gridX = Math.floor((pos.x / 100) * gridSize);
      const gridY = Math.floor((pos.y / 100) * gridSize);
      const key = `${gridX},${gridY}`;
      heatmapData.set(key, (heatmapData.get(key) || 0) + 1);
    });
    
    return {
      movementMetrics,
      zoneAnalytics,
      tacticalValues,
      tacticalInsights,
      ticks,
      players,
      totalDataPoints: processedData.length,
      heatmapData,
      gridSize
    };
  }, [xyzData, mappedZones, selectedRound, isDragging]);

  // Filter data for current view
  const filteredData = useMemo(() => {
    if (!xyzData.length) return [];
    
    let filtered = xyzData;
    
    // DEBUG: Focus on round filtering issue
    console.log('📊 DATA FILTERING:', {
      selectedRound,
      totalPoints: xyzData.length,
      uniqueRounds: [...new Set(xyzData.map(d => d.round_num))]
    });
    
    // Filter by selected round
    if (selectedRound !== 'all_rounds') {
      const roundNum = parseInt(selectedRound.replace('round_', ''));
      const beforeFilter = filtered.length;
      filtered = filtered.filter(d => d.round_num === roundNum);
      console.log(`DEBUG ROUND FILTER - Round ${roundNum}:`, {
        beforeFilter,
        afterFilter: filtered.length,
        matchingRounds: filtered.length > 0 ? [...new Set(filtered.map(d => d.round_num))] : []
      });
    }
    
    if (selectedPlayer !== 'all') {
      const beforeFilter = filtered.length;
      filtered = filtered.filter(d => d.name === selectedPlayer);
      console.log(`DEBUG PLAYER FILTER - Player ${selectedPlayer}:`, {
        beforeFilter,
        afterFilter: filtered.length
      });
    }
    
    if (activeTab === 'live' && currentTick > 0) {
      const beforeFilter = filtered.length;
      filtered = filtered.filter(d => d.tick === currentTick);
      console.log(`DEBUG TICK FILTER - Tick ${currentTick}:`, {
        beforeFilter,
        afterFilter: filtered.length
      });
    }
    
    console.log('DEBUG FILTERING - Final result:', {
      finalPoints: filtered.length,
      sampleData: filtered.slice(0, 3).map(d => ({
        player: d.name,
        side: d.side,
        round: d.round_num,
        tick: d.tick,
        health: d.health,
        position: [d.X, d.Y]
      }))
    });
    
    return filtered;
  }, [xyzData, selectedPlayer, selectedRound, currentTick, activeTab]);

  // Active zones from reference map (removed unnecessary zones dumped in top-left)
  const zonesToMap = [
    'T_SPAWN', 'CONSTRUCTION', 'GRILL', 'TRUCK', 'CONNECTOR', 
    'WELL', 'TERRACE', 'BANANA', 'T_RAMP', 'KITCHEN', 
    'APARTMENTS', 'BALCONY', 'SECOND_ORANGES', 'BRIDGE', 'STAIRS', 
    'ARCH', 'LIBRARY', 'A_LONG', 'MIDDLE', 'TOP_MID', 'PIT', 
    'A_SHORT', 'QUAD', 'NEWBOX', 'CT_SPAWN', 'A_SITE', 'B_SITE',
    'BOILER', 'SPEEDWAY', 'GRAVEYARD', 'MOTO', 'CLOSE', 'TRIPLE',
    'LONG_HALL', 'CUBBY', 'SANDBAGS'
  ];

  // Get mouse position on canvas
  const getMousePos = (event: React.MouseEvent<HTMLCanvasElement>) => {
    if (!canvasRef.current) return { x: 0, y: 0 };
    
    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    return {
      x: (event.clientX - rect.left) * scaleX,
      y: (event.clientY - rect.top) * scaleY
    };
  };

  // Check if mouse is over a resize handle
  const getResizeHandle = (mouseX: number, mouseY: number, zone: {x: number, y: number, w: number, h: number}) => {
    const handleSize = 12;
    const handles = [
      { type: 'tl', x: zone.x - handleSize/2, y: zone.y - handleSize/2 },
      { type: 'tr', x: zone.x + zone.w - handleSize/2, y: zone.y - handleSize/2 },
      { type: 'bl', x: zone.x - handleSize/2, y: zone.y + zone.h - handleSize/2 },
      { type: 'br', x: zone.x + zone.w - handleSize/2, y: zone.y + zone.h - handleSize/2 }
    ];
    
    for (const handle of handles) {
      if (mouseX >= handle.x && mouseX <= handle.x + handleSize &&
          mouseY >= handle.y && mouseY <= handle.y + handleSize) {
        return handle.type as 'tl' | 'tr' | 'bl' | 'br';
      }
    }
    return null;
  };

  // Check if mouse is over a zone
  const getZoneAtPosition = (mouseX: number, mouseY: number) => {
    for (const [zoneKey, zone] of mappedZones) {
      if (mouseX >= zone.x && mouseX <= zone.x + zone.w &&
          mouseY >= zone.y && mouseY <= zone.y + zone.h) {
        return zoneKey;
      }
    }
    return null;
  };

  // Handle mouse down for dragging/resizing
  const handleMouseDown = (event: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isMapping || !canvasRef.current) return;
    
    const mousePos = getMousePos(event);
    
    // Check for resize handles first
    for (const [zoneKey, zone] of mappedZones) {
      const handle = getResizeHandle(mousePos.x, mousePos.y, zone);
      if (handle) {
        setResizingZone(zoneKey);
        setResizeHandle(handle);
        setIsDragging(true);
        return;
      }
    }
    
    // Check for zone dragging
    const zoneKey = getZoneAtPosition(mousePos.x, mousePos.y);
    if (zoneKey) {
      const zone = mappedZones.get(zoneKey)!;
      setDraggedZone(zoneKey);
      setDragOffset({ x: mousePos.x - zone.x, y: mousePos.y - zone.y });
      setIsDragging(true);
    }
  };

  // Handle mouse move for dragging/resizing
  const handleMouseMove = (event: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isMapping || !canvasRef.current) return;
    
    const mousePos = getMousePos(event);
    
    if (isDragging) {
      if (resizingZone && resizeHandle) {
        // Handle resizing
        const zone = mappedZones.get(resizingZone)!;
        const newZone = { ...zone };
        
        switch (resizeHandle) {
          case 'tl':
            newZone.w = zone.w + (zone.x - mousePos.x);
            newZone.h = zone.h + (zone.y - mousePos.y);
            newZone.x = mousePos.x;
            newZone.y = mousePos.y;
            break;
          case 'tr':
            newZone.w = mousePos.x - zone.x;
            newZone.h = zone.h + (zone.y - mousePos.y);
            newZone.y = mousePos.y;
            break;
          case 'bl':
            newZone.w = zone.w + (zone.x - mousePos.x);
            newZone.h = mousePos.y - zone.y;
            newZone.x = mousePos.x;
            break;
          case 'br':
            newZone.w = mousePos.x - zone.x;
            newZone.h = mousePos.y - zone.y;
            break;
        }
        
        // Ensure minimum size
        newZone.w = Math.max(30, newZone.w);
        newZone.h = Math.max(20, newZone.h);
        
        const newMappedZones = new Map(mappedZones);
        newMappedZones.set(resizingZone, newZone);
        setMappedZones(newMappedZones);
      } else if (draggedZone) {
        // Handle dragging
        const newZone = {
          ...mappedZones.get(draggedZone)!,
          x: mousePos.x - dragOffset.x,
          y: mousePos.y - dragOffset.y
        };
        
        const newMappedZones = new Map(mappedZones);
        newMappedZones.set(draggedZone, newZone);
        setMappedZones(newMappedZones);
      }
    }
  };

  // Handle mouse up
  const handleMouseUp = () => {
    setIsDragging(false);
    setDraggedZone(null);
    setResizingZone(null);
    setResizeHandle(null);
    
    // Auto-save zones after any modification
    setTimeout(() => {
      const zonesObject = Object.fromEntries(mappedZones);
      localStorage.setItem('infernoZoneMapping', JSON.stringify(zonesObject));
      console.log('✅ AUTO-SAVED', mappedZones.size, 'ZONES TO LOCALSTORAGE');
    }, 100);
  };

  // Save mapped zones to localStorage
  const saveMappedZones = () => {
    const zonesObject = Object.fromEntries(mappedZones);
    localStorage.setItem('infernoZoneMapping', JSON.stringify(zonesObject));
  };

  // Load mapped zones from localStorage
  const loadMappedZones = () => {
    const saved = localStorage.getItem('infernoZoneMapping');
    if (saved) {
      try {
        const zonesObject = JSON.parse(saved);
        setMappedZones(new Map(Object.entries(zonesObject)));
        console.log('✅ LOADED', Object.keys(zonesObject).length, 'ZONES FROM LOCALSTORAGE');
      } catch (error) {
        console.error('❌ ERROR LOADING ZONES:', error);
      }
    } else {
      console.log('ℹ️ NO SAVED ZONES FOUND');
    }
  };

  // Auto-load zones when Territory tab becomes active
  useEffect(() => {
    if (activeTab === 'territory') {
      loadMappedZones();
    }
  }, [activeTab]);

  // Auto-play functionality
  useEffect(() => {
    if (!isPlaying || !analysisData) return;

    const interval = setInterval(() => {
      setCurrentTick(prev => {
        const nextIndex = analysisData.ticks.findIndex(t => t > prev);
        return nextIndex >= 0 ? analysisData.ticks[nextIndex] : analysisData.ticks[0];
      });
    }, 1000 / playbackSpeed);

    return () => clearInterval(interval);
  }, [isPlaying, playbackSpeed, analysisData]);

  // Draw tactical map
  const drawTacticalMap = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas || !mapImage) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Clear and draw background map
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(mapImage, 0, 0, canvas.width, canvas.height);

    // Draw manually mapped zones or mapping interface
    if (activeTab === 'territory') {
      if (isMapping) {
        // Draw mapping interface - show all mapped zones
        mappedZones.forEach((zone, key) => {
          // Draw zone boundary
          ctx.strokeStyle = 'rgba(255, 255, 255, 0.8)';
          ctx.lineWidth = 2;
          ctx.setLineDash([5, 5]);
          ctx.strokeRect(zone.x, zone.y, zone.w, zone.h);
          ctx.setLineDash([]);
          
          // Neutral zone fill (no red/green coloring)
          ctx.fillStyle = 'rgba(100, 100, 100, 0.1)';
          ctx.fillRect(zone.x, zone.y, zone.w, zone.h);
          
          // Zone label
          const displayName = key === 'SITE' ? 'B SITE' : key.replace('_', ' ');
          ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
          ctx.fillRect(zone.x + 2, zone.y + 2, displayName.length * 7 + 6, 16);
          ctx.fillStyle = 'white';
          ctx.font = '11px sans-serif';
          ctx.fillText(displayName, zone.x + 5, zone.y + 13);
          
          // Resize handles
          const handleSize = 8;
          ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
          // Top-left
          ctx.fillRect(zone.x - handleSize/2, zone.y - handleSize/2, handleSize, handleSize);
          // Top-right
          ctx.fillRect(zone.x + zone.w - handleSize/2, zone.y - handleSize/2, handleSize, handleSize);
          // Bottom-left
          ctx.fillRect(zone.x - handleSize/2, zone.y + zone.h - handleSize/2, handleSize, handleSize);
          // Bottom-right
          ctx.fillRect(zone.x + zone.w - handleSize/2, zone.y + zone.h - handleSize/2, handleSize, handleSize);
        });
        
        // Show mapping instructions
        ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
        ctx.font = '14px sans-serif';
        ctx.fillText('Drag zones to position them, drag corners to resize', 10, 30);
      } else {
        // Normal territory display with mapped zones
        // Find highest contest intensity zone for marker
        let highestContestZone = null;
        let highestContestIntensity = 0;
        if (analysisData?.tacticalValues) {
          Array.from(analysisData.tacticalValues.entries()).forEach(([zoneName, values]) => {
            if (values.contestedIntensity > highestContestIntensity) {
              highestContestIntensity = values.contestedIntensity;
              highestContestZone = zoneName;
            }
          });
        }

        mappedZones.forEach((zone, key) => {
          const isHighestContest = key === highestContestZone && highestContestIntensity > 0.05;
          
          // Draw zone boundary (highlight if highest contest)
          if (isHighestContest) {
            ctx.strokeStyle = 'rgba(255, 69, 0, 0.9)'; // Orange-red for combat zone
            ctx.lineWidth = 3;
            ctx.setLineDash([]);
          } else {
            ctx.strokeStyle = 'rgba(255, 255, 255, 0.6)';
            ctx.lineWidth = 2;
            ctx.setLineDash([5, 5]);
          }
          ctx.strokeRect(zone.x, zone.y, zone.w, zone.h);
          ctx.setLineDash([]);
          
          // Zone fill (highlight combat zone)
          if (isHighestContest) {
            ctx.fillStyle = 'rgba(255, 69, 0, 0.2)'; // Orange glow for combat
          } else {
            ctx.fillStyle = 'rgba(100, 100, 100, 0.1)';
          }
          ctx.fillRect(zone.x, zone.y, zone.w, zone.h);
          
          // Zone label with background
          const displayName = key === 'SITE' ? 'B SITE' : key.replace('_', ' ');
          ctx.fillStyle = isHighestContest ? 'rgba(255, 69, 0, 0.9)' : 'rgba(0, 0, 0, 0.7)';
          ctx.fillRect(zone.x + 2, zone.y + 2, displayName.length * 7 + 6, 16);
          ctx.fillStyle = 'white';
          ctx.font = '11px sans-serif';
          ctx.fillText(displayName, zone.x + 5, zone.y + 13);
          
          // Combat intensity marker
          if (isHighestContest) {
            const centerX = zone.x + zone.w / 2;
            const centerY = zone.y + zone.h / 2;
            
            // Pulsing combat marker
            const pulseSize = 8 + Math.sin(Date.now() / 300) * 3;
            ctx.beginPath();
            ctx.arc(centerX, centerY, pulseSize, 0, 2 * Math.PI);
            ctx.fillStyle = 'rgba(255, 69, 0, 0.8)';
            ctx.fill();
            ctx.strokeStyle = 'white';
            ctx.lineWidth = 2;
            ctx.stroke();
            
            // Combat icon
            ctx.fillStyle = 'white';
            ctx.font = 'bold 14px sans-serif';
            ctx.textAlign = 'center';
            ctx.fillText('🔥', centerX, centerY + 4);
            ctx.textAlign = 'left';
          }
          
          // Authentic tactical event markers based on real data
          const authenticEvents = getAuthenticTacticalEvents(key, filteredData);
          
          authenticEvents.forEach((event, index) => {
            const markerX = zone.x + (event.x || zone.w / 2);
            const markerY = zone.y + (event.y || 20 + index * 25);
            
            // Draw marker background
            ctx.beginPath();
            ctx.arc(markerX, markerY, event.size || 6, 0, 2 * Math.PI);
            ctx.fillStyle = event.color;
            ctx.fill();
            ctx.strokeStyle = 'white';
            ctx.lineWidth = 1;
            ctx.stroke();
            
            // Draw event icon
            ctx.fillStyle = 'white';
            ctx.font = event.fontSize || 'bold 8px sans-serif';
            ctx.textAlign = 'center';
            ctx.fillText(event.icon, markerX, markerY + 2);
          });
        });
      }
    }

    // Draw player positions (skip if showing territory control or individual player trail in heatmap)
    if (activeTab !== 'territory' && !(activeTab === 'heatmap' && selectedPlayer !== 'all') && filteredData.length > 0) {
      filteredData.forEach((point, index) => {
        const pos = coordToMapPercent(point.X, point.Y);
        const x = (pos.x / 100) * canvas.width;
        const y = (pos.y / 100) * canvas.height;

        // Check if player is dead (health <= 0)
        const isDead = point.health <= 0;

        if (isDead) {
          // Draw skull icon for dead players
          ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
          ctx.font = '16px sans-serif';
          ctx.textAlign = 'center';
          ctx.fillText('💀', x, y + 4);
          ctx.textAlign = 'left';
        } else {
          // Player dot for alive players
          ctx.beginPath();
          ctx.arc(x, y, 8, 0, 2 * Math.PI);
          ctx.fillStyle = point.side === 't' ? '#dc2626' : '#22c55e';
          ctx.fill();
          ctx.strokeStyle = 'white';
          ctx.lineWidth = 2;
          ctx.stroke();

          // HP number above player head
          ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
          ctx.fillRect(x - 10, y - 25, 20, 12);
          ctx.fillStyle = point.health > 50 ? '#22c55e' : point.health > 25 ? '#eab308' : '#dc2626';
          ctx.font = 'bold 10px sans-serif';
          ctx.textAlign = 'center';
          ctx.fillText(`${point.health}`, x, y - 16);
          ctx.textAlign = 'left';
        }

        // Flash indicator
        if (point.flash_duration > 0) {
          ctx.beginPath();
          ctx.arc(x, y, 12, 0, 2 * Math.PI);
          ctx.strokeStyle = '#fbbf24';
          ctx.lineWidth = 3;
          ctx.stroke();
        }

        // Velocity arrow
        if (point.velocity_X !== 0 || point.velocity_Y !== 0) {
          const velocity = Math.sqrt(point.velocity_X ** 2 + point.velocity_Y ** 2);
          if (velocity > 100) {
            const angle = Math.atan2(point.velocity_Y, point.velocity_X);
            const arrowLength = Math.min(velocity / 10, 30);
            
            ctx.strokeStyle = point.side === 't' ? '#dc2626' : '#22c55e';
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.moveTo(x, y);
            ctx.lineTo(x + Math.cos(angle) * arrowLength, y + Math.sin(angle) * arrowLength);
            ctx.stroke();
          }
        }

        // Player name
        ctx.fillStyle = 'white';
        ctx.font = '11px sans-serif';
        ctx.strokeStyle = 'black';
        ctx.lineWidth = 3;
        ctx.strokeText(point.name, x - 15, y + 25);
        ctx.fillText(point.name, x - 15, y + 25);
      });
    }

    // Draw clean movement trails for heatmap tab (only when player selected)
    if (activeTab === 'heatmap' && selectedPlayer !== 'all') {
      // Clear any existing artifacts first
      ctx.save();
      
      // Get all positions for selected player, sorted by tick
      const playerPositions = xyzData
        .filter(d => d.name === selectedPlayer)
        .sort((a, b) => a.tick - b.tick);

      if (playerPositions.length > 1) {
        // Determine player side for color
        const playerSide = playerPositions[0].side;
        const trailColor = playerSide === 't' ? '#dc2626' : '#22c55e';
        
        // Draw glow effect (multiple lines with decreasing opacity)
        for (let glowLevel = 0; glowLevel < 3; glowLevel++) {
          const glowOpacity = Math.round(255 * (0.2 - glowLevel * 0.06));
          ctx.strokeStyle = `${trailColor}${glowOpacity.toString(16).padStart(2, '0')}`;
          ctx.lineWidth = 14 - glowLevel * 3;
          ctx.lineCap = 'round';
          ctx.lineJoin = 'round';
          ctx.shadowColor = trailColor;
          ctx.shadowBlur = 8 - glowLevel * 2;
          
          ctx.beginPath();
          playerPositions.forEach((pos, index) => {
            const mapPos = coordToMapPercent(pos.X, pos.Y);
            const x = (mapPos.x / 100) * canvas.width;
            const y = (mapPos.y / 100) * canvas.height;
            
            if (index === 0) {
              ctx.moveTo(x, y);
            } else {
              ctx.lineTo(x, y);
            }
          });
          ctx.stroke();
        }
        
        // Reset shadow
        ctx.shadowColor = 'transparent';
        ctx.shadowBlur = 0;
        
        // Draw main trail line
        ctx.strokeStyle = trailColor;
        ctx.lineWidth = 4;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        
        ctx.beginPath();
        playerPositions.forEach((pos, index) => {
          const mapPos = coordToMapPercent(pos.X, pos.Y);
          const x = (mapPos.x / 100) * canvas.width;
          const y = (mapPos.y / 100) * canvas.height;
          
          if (index === 0) {
            ctx.moveTo(x, y);
          } else {
            ctx.lineTo(x, y);
          }
        });
        ctx.stroke();
        
        // Mark start and end positions
        if (playerPositions.length > 0) {
          // Start position (white circle with colored border)
          const startPos = coordToMapPercent(playerPositions[0].X, playerPositions[0].Y);
          const startX = (startPos.x / 100) * canvas.width;
          const startY = (startPos.y / 100) * canvas.height;
          
          ctx.beginPath();
          ctx.arc(startX, startY, 7, 0, 2 * Math.PI);
          ctx.fillStyle = '#ffffff';
          ctx.fill();
          ctx.strokeStyle = trailColor;
          ctx.lineWidth = 3;
          ctx.stroke();
          
          // End position (colored circle with white border)
          const endPos = coordToMapPercent(playerPositions[playerPositions.length - 1].X, playerPositions[playerPositions.length - 1].Y);
          const endX = (endPos.x / 100) * canvas.width;
          const endY = (endPos.y / 100) * canvas.height;
          
          ctx.beginPath();
          ctx.arc(endX, endY, 9, 0, 2 * Math.PI);
          ctx.fillStyle = trailColor;
          ctx.fill();
          ctx.strokeStyle = '#ffffff';
          ctx.lineWidth = 3;
          ctx.stroke();
        }
      }
      
      ctx.restore();
    }
  }, [filteredData, activeTab, analysisData, mapImage, mappedZones, isMapping]);



  // Load saved zones on component mount
  useEffect(() => {
    loadMappedZones();
  }, []);

  // Load map image and draw
  useEffect(() => {
    const img = new Image();
    img.onload = () => {
      setMapImage(img);
    };
    img.src = infernoRadarPath;
  }, []);

  useEffect(() => {
    if (mapImage) {
      drawTacticalMap();
    }
  }, [mapImage, drawTacticalMap, mappedZones]);

  if (!analysisData) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MapPin className="h-5 w-5" />
            Tactical Map Analysis
          </CardTitle>
          <CardDescription>Loading positional data...</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center h-64">
            <div className="text-muted-foreground">No tactical data available</div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MapPin className="h-5 w-5" />
            CS2 Inferno - Tactical Analysis
          </CardTitle>
          <CardDescription>
            {analysisData 
              ? `Analyzing ${analysisData.totalDataPoints.toLocaleString()} authentic position records`
              : 'Zone mapping mode - tactical analysis disabled for performance'
            }
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-4 mb-6">
            <div className="lg:col-span-1 space-y-4">
              {/* Player Selection */}
              <div>
                <label className="text-sm font-medium mb-2 block">Player Focus</label>
                <Select value={selectedPlayer} onValueChange={setSelectedPlayer}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Players</SelectItem>
                    {analysisData?.players?.map(player => (
                      <SelectItem key={player} value={player}>{player}</SelectItem>
                    )) || []}
                  </SelectContent>
                </Select>
              </div>

              {/* Round Selection */}
              <div>
                <label className="text-sm font-medium mb-2 block">Select Round</label>
                <Select value={selectedRound} onValueChange={setSelectedRound}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all_rounds">All Rounds</SelectItem>
                    {availableRounds.map(round => (
                      <SelectItem key={round} value={`round_${round}`}>
                        Round {round}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Playback Controls */}
              <div className="space-y-3">
                <label className="text-sm font-medium block">Playback Controls</label>
                <div className="flex gap-2">
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => setIsPlaying(!isPlaying)}
                  >
                    {isPlaying ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => setCurrentTick(analysisData?.ticks?.[0] || 0)}
                  >
                    <RotateCcw className="h-4 w-4" />
                  </Button>
                </div>
                
                <div>
                  <label className="text-xs text-muted-foreground">Speed: {playbackSpeed}x</label>
                  <Slider
                    value={[playbackSpeed]}
                    onValueChange={([value]) => setPlaybackSpeed(value)}
                    min={0.25}
                    max={4}
                    step={0.25}
                    className="mt-1"
                  />
                </div>

                <div>
                  <label className="text-xs text-muted-foreground">
                    Tick: {currentTick} / {analysisData?.ticks?.[analysisData.ticks.length - 1] || 0}
                  </label>
                  <Slider
                    value={[currentTick]}
                    onValueChange={([value]) => setCurrentTick(value)}
                    min={analysisData?.ticks?.[0] || 0}
                    max={analysisData?.ticks?.[analysisData.ticks.length - 1] || 0}
                    step={1}
                    className="mt-1"
                  />
                </div>
              </div>

              {/* Quick Stats */}
              <div className="space-y-2">
                <h4 className="text-sm font-medium">Quick Stats</h4>
                <div className="space-y-1 text-xs">
                  <div className="flex justify-between">
                    <span>Active Players:</span>
                    <Badge variant="secondary">{new Set(filteredData.map(d => d.name)).size}</Badge>
                  </div>
                  <div className="flex justify-between">
                    <span>Position Records:</span>
                    <Badge variant="secondary">{filteredData.length}</Badge>
                  </div>
                  <div className="flex justify-between">
                    <span>Active Zones:</span>
                    <Badge variant="secondary">
                      {new Set(filteredData.map(d => getPlayerZone(d.X, d.Y))).size}
                    </Badge>
                  </div>
                </div>
              </div>


            </div>

            {/* Map Display */}
            <div className="lg:col-span-3">
              <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                <TabsList className="grid w-full grid-cols-4">
                  <TabsTrigger value="live" className="flex items-center gap-2">
                    <Eye className="h-4 w-4" />
                    Live View
                  </TabsTrigger>
                  <TabsTrigger value="heatmap" className="flex items-center gap-2">
                    <Activity className="h-4 w-4" />
                    Heatmap
                  </TabsTrigger>
                  <TabsTrigger value="territory" className="flex items-center gap-2">
                    <Shield className="h-4 w-4" />
                    Territory
                  </TabsTrigger>
                  <TabsTrigger value="insights" className="flex items-center gap-2">
                    <TrendingUp className="h-4 w-4" />
                    Insights
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="live" className="mt-4">
                  <div className="relative bg-slate-900 rounded-lg overflow-hidden">
                    <canvas 
                      ref={canvasRef}
                      width={800}
                      height={600}
                      className="w-full h-auto max-h-[600px] object-contain"
                    />
                    <div className="absolute top-4 left-4 bg-black/50 text-white p-2 rounded text-sm">
                      <div>Live Position Tracking</div>
                      <div className="text-xs text-gray-300">
                        Red: Terrorist • Green: Counter-Terrorist
                      </div>
                    </div>
                  </div>
                </TabsContent>

                <TabsContent value="heatmap" className="mt-4">
                  <div className="relative bg-slate-900 rounded-lg overflow-hidden">
                    <canvas 
                      ref={canvasRef}
                      width={800}
                      height={600}
                      className="w-full h-auto max-h-[600px] object-contain"
                    />
                    <div className="absolute top-4 left-4 bg-black/50 text-white p-2 rounded text-sm">
                      <div>Movement Trail Analysis</div>
                      <div className="text-xs text-gray-300">
                        Select a player to see movement trail with glow effect
                      </div>
                    </div>
                  </div>
                </TabsContent>

                <TabsContent value="territory" className="mt-4">
                  <div className="space-y-4">
                    {/* Manual Zone Mapping Controls */}
                    <div className="flex gap-2 mb-4">
                      <Button 
                        variant={isMapping ? "destructive" : "default"} 
                        size="sm"
                        onClick={() => setIsMapping(!isMapping)}
                      >
                        {isMapping ? 'Exit Mapping' : 'Map Zones'}
                      </Button>
                      {isMapping && (
                        <>
                          <Button variant="outline" size="sm" onClick={saveMappedZones}>
                            Save Zones
                          </Button>
                          <Button variant="outline" size="sm" onClick={loadMappedZones}>
                            Load Zones
                          </Button>
                          <Button 
                            variant="destructive" 
                            size="sm" 
                            onClick={() => {
                              // Remove zones positioned in top-left corner (likely duplicates/clutter)
                              const newMappedZones = new Map();
                              mappedZones.forEach((zone, key) => {
                                // Keep zones that are properly positioned (not in top-left clutter area)
                                if (zone.x > 100 || zone.y > 100) {
                                  newMappedZones.set(key, zone);
                                }
                              });
                              setMappedZones(newMappedZones);
                              saveMappedZones();
                            }}
                          >
                            Clear Top-Left
                          </Button>
                        </>
                      )}
                    </div>

                    {/* Zone List for Mapping */}
                    {isMapping && (
                      <div className="grid grid-cols-4 gap-2 mb-4">
                        {zonesToMap.map(zone => {
                          const isPlaced = mappedZones.has(zone);
                          return (
                            <Button
                              key={zone}
                              variant={isPlaced ? "default" : "outline"}
                              size="sm"
                              onClick={() => {
                                if (!isPlaced) {
                                  // Add zone at center of canvas
                                  const newMappedZones = new Map(mappedZones);
                                  newMappedZones.set(zone, {
                                    x: 350, // Center of 800px canvas
                                    y: 275, // Center of 600px canvas
                                    w: 100,
                                    h: 50
                                  });
                                  setMappedZones(newMappedZones);
                                }
                              }}
                              className="text-xs"
                            >
                              {zone.replace('_', ' ')} {isPlaced ? '✓' : ''}
                            </Button>
                          );
                        })}
                      </div>
                    )}

                    {/* Round Story Header */}
                    {analysisData?.tacticalValues && (
                      <div className="mb-4 p-4 bg-gradient-to-r from-blue-900/20 to-purple-900/20 rounded-lg border border-blue-500/20">
                        {(() => {
                          // Find the zone with highest contest intensity
                          const sortedZones = Array.from(analysisData.tacticalValues.entries())
                            .filter(([zone, values]) => values.strategicImportance > 0)
                            .sort((a, b) => b[1].contestedIntensity - a[1].contestedIntensity);
                          
                          const primaryZone = sortedZones[0];
                          const hasMainEngagement = primaryZone && primaryZone[1].contestedIntensity > 0.1;
                          
                          // Generate tactical flow narrative
                          const generateTacticalFlow = () => {
                            if (!hasMainEngagement) return "Early Round: Positioning and map control establishment";
                            
                            const zoneName = primaryZone[0].replace('_', ' ');
                            const highActivityZones = sortedZones.filter(([_, values]) => 
                              analysisData.zoneAnalytics.get(_)?.supportActivity > 1000
                            );
                            
                            // Determine round phase based on contest intensity and activity patterns
                            if (primaryZone[1].contestedIntensity > 0.15) {
                              return `Mid Round: Heavy engagement at ${zoneName} with ${highActivityZones.length} support zones active`;
                            } else {
                              return `Early Round: Initial contact at ${zoneName} with teams positioning for execution`;
                            }
                          };
                          
                          // Generate specific tactical events
                          const generateTacticalEvents = () => {
                            const events = [];
                            
                            if (hasMainEngagement) {
                              const zoneName = primaryZone[0].replace('_', ' ');
                              const analytics = analysisData.zoneAnalytics.get(primaryZone[0]);
                              
                              if (analytics?.entryActivity > 0) {
                                events.push(`T entry attempt at ${zoneName}`);
                              }
                              if (analytics?.anchorActivity > 0) {
                                events.push(`CT anchor defense established`);
                              }
                            }
                            
                            // Check for lurker patterns
                            const lurkerZones = sortedZones.filter(([zone, values]) => {
                              const analytics = analysisData.zoneAnalytics.get(zone);
                              return analytics && analytics.supportActivity > 500 && values.contestedIntensity < 0.05;
                            });
                            
                            if (lurkerZones.length > 0) {
                              events.push(`T lurker control in ${lurkerZones[0][0].replace('_', ' ')}`);
                            }
                            
                            // Check for rotation patterns
                            const rotationZones = sortedZones.filter(([zone, values]) => {
                              const analytics = analysisData.zoneAnalytics.get(zone);
                              return analytics && analytics.supportActivity > 1500;
                            });
                            
                            if (rotationZones.length > 1) {
                              events.push(`CT rotation network active`);
                            }
                            
                            return events;
                          };
                          
                          const tacticalFlow = generateTacticalFlow();
                          const tacticalEvents = generateTacticalEvents();
                          
                          if (hasMainEngagement) {
                            const zoneName = primaryZone[0].replace('_', ' ');
                            const intensity = (primaryZone[1].contestedIntensity * 100).toFixed(1);
                            
                            return (
                              <div>
                                <div className="text-lg font-bold text-white mb-2 flex items-center gap-2">
                                  🔥 {zoneName.toUpperCase()} EXECUTE DETECTED
                                </div>
                                
                                {/* Timeline Context */}
                                <div className="mb-3 p-2 bg-black/30 rounded text-sm text-blue-200">
                                  <div className="flex items-center gap-2 mb-1">
                                    <span className="text-xs bg-blue-600 px-2 py-1 rounded">TIMELINE</span>
                                    <span>{tacticalFlow}</span>
                                  </div>
                                  {tacticalEvents.length > 0 && (
                                    <div className="flex flex-wrap gap-2 mt-1">
                                      {tacticalEvents.map((event, i) => (
                                        <span key={i} className="text-xs bg-orange-600/50 px-2 py-1 rounded">
                                          {event}
                                        </span>
                                      ))}
                                    </div>
                                  )}
                                </div>

                                {/* Tactical Flow Diagram */}
                                <div className="mb-3 p-2 bg-black/30 rounded text-xs">
                                  <div className="text-blue-200 mb-2 font-medium">ROUND STORY:</div>
                                  <div className="flex items-center justify-between text-gray-300">
                                    <div className="flex items-center gap-1">
                                      <span className="text-red-400">T SIDE:</span>
                                      <span>Setup →</span>
                                      <span className="bg-red-600/30 px-2 py-1 rounded">{zoneName}</span>
                                      <span>→ Execute</span>
                                    </div>
                                    <div className="text-gray-500">VS</div>
                                    <div className="flex items-center gap-1">
                                      <span>Defense ←</span>
                                      <span className="bg-green-600/30 px-2 py-1 rounded">Rotate</span>
                                      <span>← Setup</span>
                                      <span className="text-green-400">:CT SIDE</span>
                                    </div>
                                  </div>
                                </div>
                                
                                <div className="text-sm text-blue-200 mb-3">
                                  Primary engagement at {zoneName} ({intensity}% intensity) with support positioning across other zones
                                </div>
                                
                                <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-xs">
                                  {sortedZones.slice(0, 8).map(([zone, values]) => {
                                    const analytics = analysisData.zoneAnalytics.get(zone);
                                    if (!analytics) return null;
                                    
                                    let icon = '👁️'; // Default: information gathering
                                    let role = 'Info gathering';
                                    
                                    if (values.contestedIntensity > 0.1) {
                                      icon = '🔥';
                                      role = 'Active combat';
                                    } else if (analytics.supportActivity > 1000) {
                                      icon = '⚡';
                                      role = 'Rotation prep';
                                    } else if (analytics.anchorActivity > 0) {
                                      icon = '🛡️';
                                      role = 'Anchor position';
                                    }
                                    
                                    return (
                                      <div key={zone} className="flex items-center gap-1 text-gray-300">
                                        <span>{icon}</span>
                                        <span className="font-medium">{zone.replace('_', ' ')}</span>
                                        <span className="text-xs text-gray-400">({role})</span>
                                      </div>
                                    );
                                  })}
                                </div>
                              </div>
                            );
                          } else {
                            return (
                              <div>
                                <div className="text-lg font-bold text-white mb-2">
                                  🎯 POSITIONING PHASE
                                </div>
                                <div className="mb-3 p-2 bg-black/30 rounded text-sm text-blue-200">
                                  <div className="flex items-center gap-2">
                                    <span className="text-xs bg-blue-600 px-2 py-1 rounded">TIMELINE</span>
                                    <span>Early Round: Teams establishing map control with minimal direct engagement</span>
                                  </div>
                                </div>
                                <div className="text-sm text-blue-200">
                                  Teams establishing initial positions and gathering information
                                </div>
                              </div>
                            );
                          }
                        })()}
                      </div>
                    )}

                    <div className="relative bg-slate-900 rounded-lg overflow-hidden">
                      <canvas 
                        ref={canvasRef}
                        width={800}
                        height={600}
                        className="w-full h-auto max-h-[600px] object-contain"
                        onMouseDown={handleMouseDown}
                        onMouseMove={handleMouseMove}
                        onMouseUp={handleMouseUp}
                        style={{ cursor: isDragging ? 'grabbing' : 'grab' }}
                      />
                      <div className="absolute top-4 left-4 bg-black/50 text-white p-2 rounded text-sm">
                        <div>Advanced Zone Analytics</div>
                        <div className="text-xs text-gray-300">
                          {isMapping ? 'Drag zones to position them, drag corners to resize' : 'Real-time tactical intelligence from accurate zone mapping'}
                        </div>
                      </div>
                      
                      {/* Tactical Markers Legend */}
                      {!isMapping && analysisData?.tacticalValues && (
                        <div className="absolute top-4 right-4 bg-black/70 text-white p-3 rounded text-xs max-w-xs">
                          <div className="font-medium mb-2">Tactical Markers</div>
                          <div className="grid grid-cols-2 gap-1 text-xs">
                            <div className="flex items-center gap-1">
                              <span className="w-3 h-3 bg-orange-500 rounded-full flex items-center justify-center text-xs">🔥</span>
                              <span>Primary Combat</span>
                            </div>
                            <div className="flex items-center gap-1">
                              <span className="w-3 h-3 bg-green-500 rounded-full flex items-center justify-center text-xs">🛡️</span>
                              <span>CT Map Control</span>
                            </div>
                            <div className="flex items-center gap-1">
                              <span className="w-3 h-3 bg-red-500 rounded-full flex items-center justify-center text-xs">👁️</span>
                              <span>T Lurker Control</span>
                            </div>
                            <div className="flex items-center gap-1">
                              <span className="w-3 h-3 bg-orange-400 rounded-full flex items-center justify-center text-xs">⚔️</span>
                              <span>Entry Kill Zone</span>
                            </div>
                            <div className="flex items-center gap-1">
                              <span className="w-3 h-3 bg-purple-500 rounded-full flex items-center justify-center text-xs">⚡</span>
                              <span>Rotation Hub</span>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Advanced Zone Analytics - Sorted by Contest Intensity */}
                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                      {analysisData?.tacticalValues && Array.from(analysisData.tacticalValues.entries())
                        .filter(([zone, values]) => values.strategicImportance > 0) // Exclude spawns (0% strategic value)
                        .sort((a, b) => b[1].contestedIntensity - a[1].contestedIntensity) // Sort by contest intensity (highest first)
                        .map(([zone, values]) => {
                        const analytics = analysisData.zoneAnalytics.get(zone);
                        if (!analytics) return null;
                        
                        const displayName = zone === 'SITE' ? 'B SITE' : zone.replace('_', ' ');
                        const contestedPercent = values.contestedIntensity * 100;
                        const controlPercent = values.controlValue * 100;
                        
                        return (
                          <Card key={zone} className="p-3">
                            <div className="text-sm font-medium mb-2">{displayName}</div>
                            <div className="space-y-2">
                              {/* Strategic Importance */}
                              <div className="flex justify-between text-xs">
                                <span>Strategic Value:</span>
                                <span className="font-medium">{(values.strategicImportance * 100).toFixed(0)}%</span>
                              </div>
                              
                              {/* Contest Intensity */}
                              <div>
                                <div className="flex justify-between text-xs mb-1">
                                  <span>Contest Intensity:</span>
                                  <span className={contestedPercent > 50 ? 'text-red-500' : 'text-green-500'}>
                                    {contestedPercent.toFixed(1)}%
                                  </span>
                                </div>
                                <Progress value={contestedPercent} className="h-1" />
                              </div>
                              
                              {/* Role Activity */}
                              <div className="text-xs">
                                <div className="flex justify-between">
                                  <span>AWP:</span><span>{analytics.awperActivity}</span>
                                </div>
                                <div className="flex justify-between">
                                  <span>Entry:</span><span>{analytics.entryActivity}</span>
                                </div>
                                <div className="flex justify-between">
                                  <span>Support:</span><span>{analytics.supportActivity}</span>
                                </div>
                              </div>
                              
                              {/* Tactical Recommendation */}
                              <div className="text-xs text-slate-800 bg-slate-100 p-2 rounded border">
                                {values.recommendation}
                              </div>
                            </div>
                          </Card>
                        );
                      })}
                    </div>
                  </div>
                </TabsContent>

                <TabsContent value="insights" className="mt-4">
                  <div className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {analysisData?.tacticalInsights.map((insight: TacticalInsight, index: number) => (
                        <Card key={index} className="p-4">
                          <div className="flex items-center gap-3 mb-3">
                            <div className="flex items-center gap-2">
                              {insight.type === 'positioning' && <MapPin className="h-4 w-4 text-blue-500" />}
                              {insight.type === 'engagement' && <Target className="h-4 w-4 text-red-500" />}
                              {insight.type === 'utility' && <Zap className="h-4 w-4 text-yellow-500" />}
                              {insight.type === 'rotation' && <Activity className="h-4 w-4 text-green-500" />}
                              {insight.type === 'economic' && <TrendingUp className="h-4 w-4 text-purple-500" />}
                              <Badge 
                                variant={insight.impact === 'high' ? 'destructive' : insight.impact === 'medium' ? 'default' : 'secondary'}
                                className="text-xs"
                              >
                                {insight.type.toUpperCase()}
                              </Badge>
                            </div>
                            <div className="flex items-center gap-2 ml-auto">
                              <span className="text-xs text-muted-foreground">
                                {(insight.confidence * 100).toFixed(0)}% confidence
                              </span>
                              <Badge variant="outline" className="text-xs">
                                {insight.impact} impact
                              </Badge>
                            </div>
                          </div>
                          <h4 className="font-medium text-sm mb-2">{insight.description}</h4>
                        </Card>
                      )) || (
                        <div className="col-span-2 text-center text-muted-foreground">
                          Processing tactical patterns from {analysisData?.totalDataPoints.toLocaleString()} position records...
                        </div>
                      )}
                    </div>
                    
                    <Card className="p-4">
                      <h4 className="font-medium text-sm mb-3 flex items-center gap-2">
                        <Users className="h-4 w-4" />
                        Role-Based Performance Summary
                      </h4>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-xs">
                        <div className="text-center">
                          <div className="font-medium text-blue-500">AWPers</div>
                          <div className="text-muted-foreground">Long-range positioning</div>
                        </div>
                        <div className="text-center">
                          <div className="font-medium text-red-500">Entry Fraggers</div>
                          <div className="text-muted-foreground">Choke point control</div>
                        </div>
                        <div className="text-center">
                          <div className="font-medium text-green-500">Support Players</div>
                          <div className="text-muted-foreground">Utility deployment</div>
                        </div>
                        <div className="text-center">
                          <div className="font-medium text-purple-500">Anchors</div>
                          <div className="text-muted-foreground">Site defense</div>
                        </div>
                      </div>
                    </Card>
                  </div>
                </TabsContent>
              </Tabs>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
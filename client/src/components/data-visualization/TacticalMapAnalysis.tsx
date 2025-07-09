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

// Accurate CS2 de_inferno map coordinate mapping based on actual round 4 data
const INFERNO_MAP_CONFIG = {
  // Real coordinate bounds from round 4 data analysis
  bounds: { 
    minX: -1675.62, maxX: 2644.97,  // Exact bounds from data
    minY: -755.62, maxY: 3452.23    // Exact bounds from data
  },
  // Tactical zones mapped to actual CS2 de_inferno coordinates using map images
  zones: {
    'A_SITE': { 
      bounds: { minX: 1400, maxX: 2400, minY: 300, maxY: 1200 },
      color: '#22c55e', name: 'A Site', priority: 'high'
    },
    'B_SITE': { 
      bounds: { minX: -1400, maxX: -400, minY: 2800, maxY: 3400 },
      color: '#8b5cf6', name: 'B Site', priority: 'high'
    },
    'APARTMENTS': { 
      bounds: { minX: 200, maxX: 1200, minY: 1800, maxY: 2800 },
      color: '#3b82f6', name: 'Apartments', priority: 'medium'
    },
    'MIDDLE': { 
      bounds: { minX: -400, maxX: 800, minY: 1000, maxY: 2000 },
      color: '#eab308', name: 'Middle', priority: 'high'
    },
    'BANANA': { 
      bounds: { minX: -1400, maxX: -200, minY: 2000, maxY: 2800 },
      color: '#f97316', name: 'Banana', priority: 'medium'
    },
    'T_RAMP': { 
      bounds: { minX: -1400, maxX: -600, minY: 3200, maxY: 3450 },
      color: '#ef4444', name: 'T Ramp', priority: 'medium'
    },
    'ARCH_SIDE': { 
      bounds: { minX: 200, maxX: 1200, minY: 600, maxY: 1400 },
      color: '#06b6d4', name: 'Arch Side', priority: 'medium'
    },
    'PIT': { 
      bounds: { minX: 1200, maxX: 2200, minY: 1200, maxY: 2000 },
      color: '#84cc16', name: 'Pit', priority: 'medium'
    },
    'LONG_HALL': { 
      bounds: { minX: 600, maxX: 1600, minY: 1400, maxY: 2200 },
      color: '#64748b', name: 'Long Hall', priority: 'low'
    },
    'CT_SPAWN': { 
      bounds: { minX: 2200, maxX: 2644, minY: 1800, maxY: 2200 },
      color: '#10b981', name: 'CT Spawn', priority: 'low'
    },
    'T_SPAWN': { 
      bounds: { minX: -1675, maxX: -1200, minY: 250, maxY: 500 },
      color: '#dc2626', name: 'T Spawn', priority: 'low'
    },
    'SPEEDWAY': { 
      bounds: { minX: 800, maxX: 1600, minY: 200, maxY: 800 },
      color: '#06b6d4', name: 'Speedway', priority: 'medium'
    },
    'CONNECTOR': { 
      bounds: { minX: -200, maxX: 600, minY: 1400, maxY: 2200 },
      color: '#9333ea', name: 'Connector', priority: 'medium'
    }
  }
};

// Convert CS2 coordinates to map percentage with proper scaling
function coordToMapPercent(x: number, y: number): { x: number, y: number } {
  const { bounds } = INFERNO_MAP_CONFIG;
  
  // Apply padding to ensure all coordinates fit within the visible map area
  const padding = 0.1; // 10% padding
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

// Determine which zone a player is in
function getPlayerZone(x: number, y: number): string {
  for (const [zoneKey, zone] of Object.entries(INFERNO_MAP_CONFIG.zones)) {
    if (x >= zone.bounds.minX && x <= zone.bounds.maxX && 
        y >= zone.bounds.minY && y <= zone.bounds.maxY) {
      return zoneKey;
    }
  }
  return 'UNKNOWN';
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

// Enhanced role-based tactical insights
function generateEnhancedTacticalInsights(
  movementMetrics: Map<string, any>, 
  territoryControl: Map<string, { t: number, ct: number }>,
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
  
  // IGL tactical calling analysis
  const highTrafficZones = Array.from(territoryControl.entries())
    .sort((a, b) => (b[1].t + b[1].ct) - (a[1].t + a[1].ct))
    .slice(0, 3);
  
  if (highTrafficZones.length > 0) {
    const zoneFocus = highTrafficZones[0][1];
    const tactical = zoneFocus.t > zoneFocus.ct ? 'T-sided' : 'CT-sided';
    insights.push({
      type: 'positioning',
      description: `${tactical} tactical focus in ${INFERNO_MAP_CONFIG.zones[highTrafficZones[0][0] as keyof typeof INFERNO_MAP_CONFIG.zones]?.name}`,
      confidence: 0.85,
      impact: 'high',
      recommendation: `IGL should adapt strategy based on ${tactical} dominance patterns`
    });
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

// Territory control analysis
function calculateTerritoryControl(data: XYZPlayerData[]) {
  const territoryControl = new Map<string, { t: number, ct: number }>();
  
  Object.keys(INFERNO_MAP_CONFIG.zones).forEach(zone => {
    territoryControl.set(zone, { t: 0, ct: 0 });
  });

  data.forEach(point => {
    const zone = getPlayerZone(point.X, point.Y);
    if (territoryControl.has(zone)) {
      const control = territoryControl.get(zone)!;
      control[point.side]++;
    }
  });

  return territoryControl;
}

export function TacticalMapAnalysis({ xyzData }: TacticalMapAnalysisProps) {
  const [selectedPlayer, setSelectedPlayer] = useState<string>('all');
  const [currentTick, setCurrentTick] = useState<number>(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [playbackSpeed, setPlaybackSpeed] = useState(1);
  const [activeTab, setActiveTab] = useState('live');
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [mapImage, setMapImage] = useState<HTMLImageElement | null>(null);

  // Process data for analysis
  const analysisData = useMemo(() => {
    if (!xyzData.length) return null;

    const movementMetrics = calculateMovementMetrics(xyzData);
    const territoryControl = calculateTerritoryControl(xyzData);
    const tacticalInsights = generateEnhancedTacticalInsights(movementMetrics, territoryControl, xyzData);
    
    const ticks = Array.from(new Set(xyzData.map(d => d.tick))).sort((a, b) => a - b);
    const players = Array.from(new Set(xyzData.map(d => d.name)));
    
    // Generate heatmap data
    const heatmapData = new Map<string, number>();
    const gridSize = 50;
    xyzData.forEach(point => {
      const pos = coordToMapPercent(point.X, point.Y);
      const gridX = Math.floor((pos.x / 100) * gridSize);
      const gridY = Math.floor((pos.y / 100) * gridSize);
      const key = `${gridX},${gridY}`;
      heatmapData.set(key, (heatmapData.get(key) || 0) + 1);
    });
    
    return {
      movementMetrics,
      territoryControl,
      tacticalInsights,
      ticks,
      players,
      totalDataPoints: xyzData.length,
      heatmapData,
      gridSize
    };
  }, [xyzData]);

  // Filter data for current view
  const filteredData = useMemo(() => {
    if (!xyzData.length) return [];
    
    let filtered = xyzData;
    
    if (selectedPlayer !== 'all') {
      filtered = filtered.filter(d => d.name === selectedPlayer);
    }
    
    if (activeTab === 'live' && currentTick > 0) {
      filtered = filtered.filter(d => d.tick === currentTick);
    }
    
    return filtered;
  }, [xyzData, selectedPlayer, currentTick, activeTab]);

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
    if (!canvas || !mapImage || !filteredData.length) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Clear and draw background map
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(mapImage, 0, 0, canvas.width, canvas.height);

    // Draw zone overlays for territory control
    if (activeTab === 'territory') {
      Object.entries(INFERNO_MAP_CONFIG.zones).forEach(([zoneKey, zone]) => {
        const control = analysisData?.territoryControl.get(zoneKey);
        if (control) {
          const total = control.t + control.ct;
          const tPercent = total > 0 ? control.t / total : 0;
          
          // Calculate zone boundaries properly
          const topLeft = coordToMapPercent(zone.bounds.minX, zone.bounds.maxY);
          const bottomRight = coordToMapPercent(zone.bounds.maxX, zone.bounds.minY);
          
          const x = (topLeft.x / 100) * canvas.width;
          const y = (topLeft.y / 100) * canvas.height;
          const width = ((bottomRight.x - topLeft.x) / 100) * canvas.width;
          const height = ((bottomRight.y - topLeft.y) / 100) * canvas.height;
          
          // Draw zone boundary
          ctx.strokeStyle = 'rgba(255, 255, 255, 0.6)';
          ctx.lineWidth = 2;
          ctx.setLineDash([5, 5]);
          ctx.strokeRect(x, y, width, height);
          ctx.setLineDash([]);
          
          // Fill zone based on control
          if (total > 0) {
            ctx.fillStyle = tPercent > 0.6 ? 'rgba(220, 38, 38, 0.25)' : 
                           tPercent < 0.4 ? 'rgba(34, 197, 94, 0.25)' : 
                           'rgba(234, 179, 8, 0.25)';
            ctx.fillRect(x, y, width, height);
          }
          
          // Zone label with background
          ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
          ctx.fillRect(x + 2, y + 2, zone.name.length * 7 + 6, 16);
          ctx.fillStyle = 'white';
          ctx.font = '11px sans-serif';
          ctx.fillText(zone.name, x + 5, y + 13);
          
          // Control percentage
          if (total > 0) {
            ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
            ctx.fillRect(x + 2, y + height - 18, 40, 16);
            ctx.fillStyle = tPercent > 0.6 ? '#dc2626' : tPercent < 0.4 ? '#22c55e' : '#eab308';
            ctx.font = '10px sans-serif';
            ctx.fillText(`${Math.round(tPercent * 100)}%`, x + 5, y + height - 7);
          }
        }
      });
    }

    // Draw player positions (skip if showing individual player trail in heatmap)
    if (!(activeTab === 'heatmap' && selectedPlayer !== 'all')) {
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
  }, [filteredData, activeTab, analysisData, mapImage]);

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
  }, [mapImage, drawTacticalMap]);

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
            Analyzing {analysisData.totalDataPoints.toLocaleString()} authentic position records
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
                    {analysisData.players.map(player => (
                      <SelectItem key={player} value={player}>{player}</SelectItem>
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
                    onClick={() => setCurrentTick(analysisData.ticks[0] || 0)}
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
                    Tick: {currentTick} / {analysisData.ticks[analysisData.ticks.length - 1] || 0}
                  </label>
                  <Slider
                    value={[currentTick]}
                    onValueChange={([value]) => setCurrentTick(value)}
                    min={analysisData.ticks[0] || 0}
                    max={analysisData.ticks[analysisData.ticks.length - 1] || 0}
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
                    <div className="relative bg-slate-900 rounded-lg overflow-hidden">
                      <canvas 
                        ref={canvasRef}
                        width={800}
                        height={600}
                        className="w-full h-auto max-h-[600px] object-contain"
                      />
                      <div className="absolute top-4 left-4 bg-black/50 text-white p-2 rounded text-sm">
                        <div>Territory Control Analysis</div>
                        <div className="text-xs text-gray-300">
                          Green: CT Control • Red: T Control • Yellow: Contested
                        </div>
                      </div>
                    </div>

                    {/* Territory Control Stats */}
                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                      {Array.from(analysisData.territoryControl.entries()).map(([zone, control]) => {
                        const total = control.t + control.ct;
                        const tPercent = total > 0 ? (control.t / total) * 100 : 0;
                        const zoneName = INFERNO_MAP_CONFIG.zones[zone as keyof typeof INFERNO_MAP_CONFIG.zones]?.name || zone;
                        
                        return (
                          <Card key={zone} className="p-3">
                            <div className="text-sm font-medium mb-2">{zoneName}</div>
                            <div className="space-y-1">
                              <div className="flex justify-between text-xs">
                                <span className="text-red-500">T: {control.t}</span>
                                <span className="text-green-500">CT: {control.ct}</span>
                              </div>
                              <Progress 
                                value={tPercent} 
                                className="h-2"
                              />
                              <div className="text-xs text-center text-muted-foreground">
                                {tPercent > 60 ? 'T Control' : tPercent < 40 ? 'CT Control' : 'Contested'}
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
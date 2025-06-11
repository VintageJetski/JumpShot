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
import infernoRadarPath from '@assets/CS2_inferno_radar_1749671392878.webp';

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

// Real CS2 de_inferno map coordinate mapping based on authentic demo data
const INFERNO_MAP_CONFIG = {
  // Actual coordinate bounds from authentic CS2 demo data
  bounds: { 
    minX: -1675.62, maxX: 2644.97, 
    minY: -755.62, maxY: 3452.23 
  },
  // Real tactical zones mapped to actual CS2 de_inferno coordinates
  zones: {
    'A_SITE': { 
      bounds: { minX: 1800, maxX: 2600, minY: 400, maxY: 1200 },
      color: '#22c55e', name: 'A Site', priority: 'high'
    },
    'B_SITE': { 
      bounds: { minX: -1600, maxX: -800, minY: 2700, maxY: 3400 },
      color: '#8b5cf6', name: 'B Site', priority: 'high'
    },
    'APARTMENTS': { 
      bounds: { minX: 900, maxX: 1800, minY: 1800, maxY: 2800 },
      color: '#3b82f6', name: 'Apartments', priority: 'medium'
    },
    'MIDDLE': { 
      bounds: { minX: -200, maxX: 1000, minY: 1200, maxY: 2000 },
      color: '#eab308', name: 'Middle', priority: 'high'
    },
    'BANANA': { 
      bounds: { minX: -1600, maxX: -600, minY: 2000, maxY: 2700 },
      color: '#f97316', name: 'Banana', priority: 'medium'
    },
    'T_RAMP': { 
      bounds: { minX: -1200, maxX: -400, minY: 3200, maxY: 3452 },
      color: '#ef4444', name: 'T Ramp', priority: 'medium'
    },
    'ARCH_SIDE': { 
      bounds: { minX: 600, maxX: 1400, minY: 800, maxY: 1600 },
      color: '#06b6d4', name: 'Arch Side', priority: 'medium'
    },
    'PIT': { 
      bounds: { minX: 1200, maxX: 2000, minY: 2400, maxY: 3200 },
      color: '#84cc16', name: 'Pit', priority: 'medium'
    },
    'LONG_HALL': { 
      bounds: { minX: 800, maxX: 1600, minY: 2800, maxY: 3400 },
      color: '#64748b', name: 'Long Hall', priority: 'low'
    },
    'CT_SPAWN': { 
      bounds: { minX: 2000, maxX: 2644, minY: -755, maxY: 400 },
      color: '#10b981', name: 'CT Spawn', priority: 'low'
    },
    'T_SPAWN': { 
      bounds: { minX: -1675, maxX: -1000, minY: 3000, maxY: 3452 },
      color: '#dc2626', name: 'T Spawn', priority: 'low'
    },
    'SPEEDWAY': { 
      bounds: { minX: 200, maxX: 800, minY: 400, maxY: 1000 },
      color: '#06b6d4', name: 'Speedway', priority: 'medium'
    },
    'CONNECTOR': { 
      bounds: { minX: -400, maxX: 400, minY: 1600, maxY: 2400 },
      color: '#9333ea', name: 'Connector', priority: 'medium'
    }
  }
};

// Convert CS2 coordinates to map percentage
function coordToMapPercent(x: number, y: number): { x: number, y: number } {
  const { bounds } = INFERNO_MAP_CONFIG;
  const mapX = ((x - bounds.minX) / (bounds.maxX - bounds.minX)) * 100;
  const mapY = ((y - bounds.minY) / (bounds.maxY - bounds.minY)) * 100;
  return { x: Math.max(0, Math.min(100, mapX)), y: Math.max(0, Math.min(100, 100 - mapY)) };
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

// Calculate movement metrics
function calculateMovementMetrics(data: XYZPlayerData[]) {
  const playerMovement = new Map<string, {
    totalDistance: number;
    zones: Set<string>;
    engagements: number;
    avgVelocity: number;
    positions: Array<{ x: number, y: number, tick: number, zone: string }>;
  }>();

  data.forEach(point => {
    const key = `${point.name}_${point.side}`;
    if (!playerMovement.has(key)) {
      playerMovement.set(key, {
        totalDistance: 0,
        zones: new Set(),
        engagements: 0,
        avgVelocity: 0,
        positions: []
      });
    }

    const movement = playerMovement.get(key)!;
    const zone = getPlayerZone(point.X, point.Y);
    movement.zones.add(zone);
    movement.positions.push({ 
      x: point.X, 
      y: point.Y, 
      tick: point.tick, 
      zone 
    });

    const velocity = Math.sqrt(point.velocity_X ** 2 + point.velocity_Y ** 2);
    movement.avgVelocity = (movement.avgVelocity + velocity) / 2;
    
    if (point.health < 100) movement.engagements++;
  });

  return playerMovement;
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
  const mapImageRef = useRef<HTMLImageElement>(null);

  // Process data for analysis
  const analysisData = useMemo(() => {
    if (!xyzData.length) return null;

    const movementMetrics = calculateMovementMetrics(xyzData);
    const territoryControl = calculateTerritoryControl(xyzData);
    
    const ticks = Array.from(new Set(xyzData.map(d => d.tick))).sort((a, b) => a - b);
    const players = Array.from(new Set(xyzData.map(d => d.name)));
    
    return {
      movementMetrics,
      territoryControl,
      ticks,
      players,
      totalDataPoints: xyzData.length
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
    const mapImage = mapImageRef.current;
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
          
          ctx.fillStyle = tPercent > 0.6 ? 'rgba(220, 38, 38, 0.3)' : 
                         tPercent < 0.4 ? 'rgba(34, 197, 94, 0.3)' : 
                         'rgba(234, 179, 8, 0.3)';
          
          const bounds = zone.bounds;
          const topLeft = coordToMapPercent(bounds.minX, bounds.maxY);
          const bottomRight = coordToMapPercent(bounds.maxX, bounds.minY);
          
          const x = (topLeft.x / 100) * canvas.width;
          const y = (topLeft.y / 100) * canvas.height;
          const width = ((bottomRight.x - topLeft.x) / 100) * canvas.width;
          const height = ((bottomRight.y - topLeft.y) / 100) * canvas.height;
          
          ctx.fillRect(x, y, width, height);
          
          // Zone label
          ctx.fillStyle = 'white';
          ctx.font = '12px sans-serif';
          ctx.fillText(zone.name, x + 5, y + 15);
        }
      });
    }

    // Draw player positions
    filteredData.forEach(point => {
      const pos = coordToMapPercent(point.X, point.Y);
      const x = (pos.x / 100) * canvas.width;
      const y = (pos.y / 100) * canvas.height;

      // Player dot
      ctx.beginPath();
      ctx.arc(x, y, 8, 0, 2 * Math.PI);
      ctx.fillStyle = point.side === 't' ? '#dc2626' : '#22c55e';
      ctx.fill();
      ctx.strokeStyle = 'white';
      ctx.lineWidth = 2;
      ctx.stroke();

      // Health bar
      if (point.health < 100) {
        const barWidth = 20;
        const barHeight = 4;
        ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
        ctx.fillRect(x - barWidth/2, y - 15, barWidth, barHeight);
        ctx.fillStyle = point.health > 50 ? '#22c55e' : point.health > 25 ? '#eab308' : '#dc2626';
        ctx.fillRect(x - barWidth/2, y - 15, (point.health / 100) * barWidth, barHeight);
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

    // Draw heatmap for heatmap tab
    if (activeTab === 'heatmap') {
      const heatmapData = new Map<string, number>();
      const gridSize = 50;
      
      filteredData.forEach(point => {
        const pos = coordToMapPercent(point.X, point.Y);
        const gridX = Math.floor((pos.x / 100) * gridSize);
        const gridY = Math.floor((pos.y / 100) * gridSize);
        const key = `${gridX},${gridY}`;
        heatmapData.set(key, (heatmapData.get(key) || 0) + 1);
      });

      const maxCount = Math.max(...Array.from(heatmapData.values()));
      Array.from(heatmapData.entries()).forEach(([key, count]) => {
        const [gridX, gridY] = key.split(',').map(Number);
        const intensity = count / maxCount;
        const cellSize = canvas.width / gridSize;
        
        ctx.fillStyle = `rgba(255, 0, 0, ${intensity * 0.6})`;
        ctx.fillRect(gridX * cellSize, gridY * cellSize, cellSize, cellSize);
      });
    }
  }, [filteredData, activeTab, analysisData]);

  // Load map image and draw
  useEffect(() => {
    const img = new Image();
    img.onload = () => {
      if (mapImageRef.current) {
        mapImageRef.current = img;
      }
      drawTacticalMap();
    };
    img.src = infernoMapPath;
  }, [drawTacticalMap]);

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
                <TabsList className="grid w-full grid-cols-3">
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
                      <div>Position Density Heatmap</div>
                      <div className="text-xs text-gray-300">
                        Red intensity shows player concentration
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
              </Tabs>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
import { useState, useMemo, useEffect, useRef } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { Badge } from '@/components/ui/badge';
import { MapPin, TrendingUp, Zap, Target, Activity, Play, Pause, RotateCcw, Eye } from 'lucide-react';

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

// CS2 Inferno map coordinates with real tactical zones
const MAP_CONFIG = {
  bounds: { minX: -2500, maxX: 2500, minY: -2500, maxY: 2500 },
  zones: {
    'A_SITE': { x: 75, y: 25, width: 20, height: 15, color: 'green' },
    'B_SITE': { x: 20, y: 75, width: 20, height: 15, color: 'purple' },
    'MID': { x: 45, y: 50, width: 15, height: 12, color: 'yellow' },
    'APARTMENTS': { x: 55, y: 30, width: 12, height: 20, color: 'blue' },
    'BANANA': { x: 15, y: 60, width: 25, height: 8, color: 'orange' },
    'CONNECTOR': { x: 35, y: 45, width: 8, height: 15, color: 'gray' },
    'T_SPAWN': { x: 45, y: 85, width: 15, height: 10, color: 'red' },
    'CT_SPAWN': { x: 45, y: 15, width: 15, height: 10, color: 'blue' }
  }
};

function coordToPercent(coord: number, isX: boolean): number {
  const bounds = isX ? 
    { min: MAP_CONFIG.bounds.minX, max: MAP_CONFIG.bounds.maxX } : 
    { min: MAP_CONFIG.bounds.minY, max: MAP_CONFIG.bounds.maxY };
  return Math.max(0, Math.min(100, ((coord - bounds.min) / (bounds.max - bounds.min)) * 100));
}

function generateHeatmapData(positions: XYZPlayerData[], side?: 't' | 'ct'): number[][] {
  const gridSize = 50;
  const heatmap = Array(gridSize).fill(0).map(() => Array(gridSize).fill(0));
  
  const filteredPositions = side ? positions.filter(p => p.side === side) : positions;
  
  filteredPositions.forEach(pos => {
    const x = Math.floor(coordToPercent(pos.X, true) * (gridSize - 1) / 100);
    const y = Math.floor(coordToPercent(pos.Y, false) * (gridSize - 1) / 100);
    
    if (x >= 0 && x < gridSize && y >= 0 && y < gridSize) {
      heatmap[y][x]++;
      // Add blur effect
      for (let dy = -2; dy <= 2; dy++) {
        for (let dx = -2; dx <= 2; dx++) {
          const nx = x + dx;
          const ny = y + dy;
          if (nx >= 0 && nx < gridSize && ny >= 0 && ny < gridSize) {
            const distance = Math.sqrt(dx * dx + dy * dy);
            const weight = Math.max(0, 1 - distance / 3);
            heatmap[ny][nx] += weight * 0.3;
          }
        }
      }
    }
  });
  
  return heatmap;
}

export default function TacticalMapAnalysis({ xyzData = [] }: TacticalMapAnalysisProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [selectedPlayer, setSelectedPlayer] = useState<string>('');
  const [selectedRound, setSelectedRound] = useState<number | null>(null);
  const [currentTick, setCurrentTick] = useState<number>(0);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [playbackSpeed, setPlaybackSpeed] = useState<number>(1);
  const [heatmapMode, setHeatmapMode] = useState<'all' | 't' | 'ct'>('all');
  const [analysisType, setAnalysisType] = useState<'positioning' | 'control' | 'rotations'>('positioning');

  // Initialize selectedRound when data loads
  useEffect(() => {
    if (xyzData && xyzData.length > 0 && selectedRound === null) {
      const rounds = Array.from(new Set(xyzData.map(d => d.round_num))).sort((a, b) => a - b);
      if (rounds.length > 0) {
        setSelectedRound(rounds[0]);
      }
    }
  }, [xyzData, selectedRound]);

  // Process data for analysis
  const { players, rounds, roundData, tickRange, territoryControl } = useMemo(() => {
    const uniquePlayers = Array.from(new Set(xyzData.map(d => d.user_steamid)))
      .map(steamId => {
        const playerData = xyzData.find(d => d.user_steamid === steamId);
        return {
          steamId,
          name: playerData?.name || 'Unknown',
          side: playerData?.side || 't'
        };
      });

    const uniqueRounds = Array.from(new Set(xyzData.map(d => d.round_num))).sort((a, b) => a - b);
    
    const currentRoundData = selectedRound ? xyzData.filter(d => d.round_num === selectedRound) : [];
    const ticks = currentRoundData.length > 0 ? currentRoundData.map(d => d.tick) : [0];
    const minTick = Math.min(...ticks);
    const maxTick = Math.max(...ticks);

    // Calculate territory control
    const control = Object.keys(MAP_CONFIG.zones).reduce((acc, zone) => {
      const zoneConfig = MAP_CONFIG.zones[zone as keyof typeof MAP_CONFIG.zones];
      const playersInZone = currentRoundData.filter(p => {
        const px = coordToPercent(p.X, true);
        const py = coordToPercent(p.Y, false);
        return px >= zoneConfig.x && px <= zoneConfig.x + zoneConfig.width &&
               py >= zoneConfig.y && py <= zoneConfig.y + zoneConfig.height;
      });
      
      const tCount = playersInZone.filter(p => p.side === 't').length;
      const ctCount = playersInZone.filter(p => p.side === 'ct').length;
      
      acc[zone] = { t: tCount, ct: ctCount, contested: tCount > 0 && ctCount > 0 };
      return acc;
    }, {} as Record<string, { t: number; ct: number; contested: boolean }>);

    return {
      players: uniquePlayers,
      rounds: uniqueRounds,
      roundData: currentRoundData,
      tickRange: { min: minTick, max: maxTick },
      territoryControl: control
    };
  }, [xyzData, selectedRound]);

  // Get current tick data
  const currentTickData = useMemo(() => {
    return roundData.filter(d => d.tick === currentTick);
  }, [roundData, currentTick]);

  // Auto-play functionality
  useEffect(() => {
    if (!isPlaying || tickRange.max === tickRange.min) return;

    const interval = setInterval(() => {
      setCurrentTick(prev => {
        const next = prev + (128 * playbackSpeed);
        return next > tickRange.max ? tickRange.min : next;
      });
    }, 100);

    return () => clearInterval(interval);
  }, [isPlaying, tickRange, playbackSpeed]);

  // Draw heatmap on canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !roundData.length) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width;
    canvas.height = rect.height;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    const heatmapData = generateHeatmapData(roundData, heatmapMode === 'all' ? undefined : heatmapMode);
    const maxIntensity = Math.max(...heatmapData.flat());

    if (maxIntensity > 0) {
      const cellWidth = canvas.width / heatmapData[0].length;
      const cellHeight = canvas.height / heatmapData.length;

      heatmapData.forEach((row, y) => {
        row.forEach((intensity, x) => {
          if (intensity > 0) {
            const alpha = Math.min(0.8, intensity / maxIntensity);
            const hue = heatmapMode === 't' ? 0 : heatmapMode === 'ct' ? 240 : 60;
            ctx.fillStyle = `hsla(${hue}, 80%, 50%, ${alpha})`;
            ctx.fillRect(x * cellWidth, y * cellHeight, cellWidth, cellHeight);
          }
        });
      });
    }
  }, [roundData, heatmapMode]);

  // Player movement analysis
  const playerAnalysis = useMemo(() => {
    if (!selectedPlayer || !roundData.length) return null;

    const playerPositions = roundData
      .filter(d => d.user_steamid === selectedPlayer)
      .sort((a, b) => a.tick - b.tick);

    if (playerPositions.length < 2) return null;

    let totalDistance = 0;
    let maxVelocity = 0;
    const velocities: number[] = [];
    const zonesVisited = new Set<string>();

    playerPositions.forEach((pos, i) => {
      if (i > 0) {
        const prev = playerPositions[i - 1];
        const distance = Math.sqrt(Math.pow(pos.X - prev.X, 2) + Math.pow(pos.Y - prev.Y, 2));
        totalDistance += distance;
      }

      const velocity = Math.sqrt(Math.pow(pos.velocity_X, 2) + Math.pow(pos.velocity_Y, 2));
      velocities.push(velocity);
      maxVelocity = Math.max(maxVelocity, velocity);

      // Check which zone player is in
      const px = coordToPercent(pos.X, true);
      const py = coordToPercent(pos.Y, false);
      
      Object.entries(MAP_CONFIG.zones).forEach(([zoneName, zoneConfig]) => {
        if (px >= zoneConfig.x && px <= zoneConfig.x + zoneConfig.width &&
            py >= zoneConfig.y && py <= zoneConfig.y + zoneConfig.height) {
          zonesVisited.add(zoneName);
        }
      });
    });

    const avgVelocity = velocities.length > 0 ? velocities.reduce((a, b) => a + b, 0) / velocities.length : 0;

    return {
      totalDistance: Math.round(totalDistance),
      averageVelocity: Math.round(avgVelocity),
      maxVelocity: Math.round(maxVelocity),
      zonesVisited: Array.from(zonesVisited),
      positions: playerPositions,
      engagement: playerPositions.filter(p => p.health < 100).length
    };
  }, [selectedPlayer, roundData]);

  if (!xyzData || xyzData.length === 0) {
    return (
      <Card className="glassmorphism border-white/10">
        <CardContent className="pt-6">
          <div className="flex items-center justify-center py-12">
            <div className="text-center space-y-4">
              <Activity className="h-12 w-12 text-blue-400 mx-auto animate-spin" />
              <h3 className="text-white font-semibold">Loading Tactical Analysis</h3>
              <p className="text-blue-200 text-sm">Processing authentic positioning data...</p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Controls */}
      <Card className="glassmorphism border-white/10">
        <CardHeader>
          <CardTitle className="text-white flex items-center gap-2">
            <Target className="h-5 w-5" />
            Tactical Map Analysis - CS2 Inferno
          </CardTitle>
          <CardDescription className="text-blue-200">
            Advanced positioning analysis with territory control and movement patterns
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
            <div>
              <label className="text-sm font-medium text-white mb-2 block">Round</label>
              <Select value={selectedRound?.toString() || ''} onValueChange={(value) => setSelectedRound(Number(value))}>
                <SelectTrigger className="bg-white/5 border-white/20 text-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {rounds.map(round => (
                    <SelectItem key={round} value={round.toString()}>
                      Round {round}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="text-sm font-medium text-white mb-2 block">Focus Player</label>
              <Select value={selectedPlayer} onValueChange={setSelectedPlayer}>
                <SelectTrigger className="bg-white/5 border-white/20 text-white">
                  <SelectValue placeholder="Select player" />
                </SelectTrigger>
                <SelectContent>
                  {players.map(player => (
                    <SelectItem key={player.steamId} value={player.steamId}>
                      {player.name} ({player.side.toUpperCase()})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="text-sm font-medium text-white mb-2 block">Heatmap</label>
              <Select value={heatmapMode} onValueChange={(value: 'all' | 't' | 'ct') => setHeatmapMode(value)}>
                <SelectTrigger className="bg-white/5 border-white/20 text-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Players</SelectItem>
                  <SelectItem value="t">T-Side Only</SelectItem>
                  <SelectItem value="ct">CT-Side Only</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="text-sm font-medium text-white mb-2 block">Playback</label>
              <div className="flex gap-2">
                <Button
                  onClick={() => setIsPlaying(!isPlaying)}
                  size="sm"
                  variant="outline"
                  className="bg-white/5 border-white/20 text-white hover:bg-white/10"
                >
                  {isPlaying ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
                </Button>
                <Button
                  onClick={() => setCurrentTick(tickRange.min)}
                  size="sm"
                  variant="outline"
                  className="bg-white/5 border-white/20 text-white hover:bg-white/10"
                >
                  <RotateCcw className="h-4 w-4" />
                </Button>
              </div>
            </div>

            <div>
              <label className="text-sm font-medium text-white mb-2 block">Speed: {playbackSpeed}x</label>
              <Slider
                value={[playbackSpeed]}
                onValueChange={([value]) => setPlaybackSpeed(value)}
                min={0.25}
                max={4}
                step={0.25}
                className="w-full"
              />
            </div>
          </div>

          {/* Tick Control */}
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <label className="text-sm font-medium text-white">Tick: {currentTick}</label>
              <div className="text-xs text-blue-200">
                {Math.round((currentTick - tickRange.min) / (tickRange.max - tickRange.min) * 100)}% complete
              </div>
            </div>
            <Slider
              value={[currentTick]}
              onValueChange={([value]) => setCurrentTick(value)}
              min={tickRange.min}
              max={tickRange.max}
              step={64}
              className="w-full"
            />
          </div>
        </CardContent>
      </Card>

      {/* Main Analysis */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Tactical Map */}
        <div className="lg:col-span-2">
          <Tabs defaultValue="live" className="space-y-4">
            <TabsList className="grid w-full grid-cols-3 bg-white/5 border border-white/10">
              <TabsTrigger value="live" className="text-white data-[state=active]:bg-white/10">
                <Eye className="h-4 w-4 mr-1" />
                Live View
              </TabsTrigger>
              <TabsTrigger value="heatmap" className="text-white data-[state=active]:bg-white/10">
                <TrendingUp className="h-4 w-4 mr-1" />
                Heatmap
              </TabsTrigger>
              <TabsTrigger value="control" className="text-white data-[state=active]:bg-white/10">
                <Target className="h-4 w-4 mr-1" />
                Control
              </TabsTrigger>
            </TabsList>

            <TabsContent value="live">
              <Card className="glassmorphism border-white/10">
                <CardHeader>
                  <CardTitle className="text-white text-lg">Live Tactical View</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="relative w-full aspect-square bg-gradient-to-br from-orange-900/40 to-red-900/40 border border-white/10 rounded-lg overflow-hidden">
                    {/* Map Structure */}
                    {Object.entries(MAP_CONFIG.zones).map(([zoneName, zone]) => (
                      <div
                        key={zoneName}
                        className={`absolute border-2 rounded-lg flex items-center justify-center text-xs font-bold transition-all duration-300 ${
                          territoryControl[zoneName]?.contested 
                            ? 'border-yellow-400 bg-yellow-400/20 text-yellow-200' 
                            : territoryControl[zoneName]?.t > territoryControl[zoneName]?.ct
                            ? 'border-red-400 bg-red-400/15 text-red-200'
                            : territoryControl[zoneName]?.ct > territoryControl[zoneName]?.t
                            ? 'border-blue-400 bg-blue-400/15 text-blue-200'
                            : 'border-gray-400 bg-gray-400/10 text-gray-300'
                        }`}
                        style={{
                          left: `${zone.x}%`,
                          top: `${zone.y}%`,
                          width: `${zone.width}%`,
                          height: `${zone.height}%`
                        }}
                      >
                        {zoneName.replace('_', ' ')}
                      </div>
                    ))}

                    {/* Player Trails */}
                    {selectedPlayer && playerAnalysis && (
                      <svg className="absolute inset-0 w-full h-full pointer-events-none z-10">
                        <path
                          d={playerAnalysis.positions.map((pos, i) => 
                            `${i === 0 ? 'M' : 'L'} ${coordToPercent(pos.X, true)} ${coordToPercent(pos.Y, false)}`
                          ).join(' ')}
                          stroke="rgba(59, 130, 246, 0.8)"
                          strokeWidth="3"
                          fill="none"
                          strokeDasharray="10,5"
                        />
                      </svg>
                    )}

                    {/* Player Positions */}
                    {currentTickData.map((player) => (
                      <div
                        key={player.user_steamid}
                        className={`absolute rounded-full border-3 border-white shadow-2xl transition-all duration-300 flex items-center justify-center cursor-pointer hover:scale-125 ${
                          player.user_steamid === selectedPlayer ? 'w-10 h-10 z-30 ring-4 ring-blue-400' : 'w-7 h-7 z-20'
                        }`}
                        style={{
                          left: `${Math.max(5, Math.min(95, coordToPercent(player.X, true)))}%`,
                          top: `${Math.max(5, Math.min(95, coordToPercent(player.Y, false)))}%`,
                          backgroundColor: player.side === 't' ? '#dc2626' : '#2563eb',
                          transform: 'translate(-50%, -50%)',
                          opacity: player.health > 0 ? 1 : 0.3,
                        }}
                        title={`${player.name} (${player.health}HP, ${player.armor}A)`}
                        onClick={() => setSelectedPlayer(player.user_steamid)}
                      >
                        <span className="text-xs text-white font-bold">
                          {player.name.substring(0, 2).toUpperCase()}
                        </span>
                      </div>
                    ))}

                    {/* Engagement Indicators */}
                    {currentTickData.filter(p => p.flash_duration > 0).map((player) => (
                      <div
                        key={`flash-${player.user_steamid}`}
                        className="absolute w-12 h-12 border-2 border-yellow-400 rounded-full animate-ping pointer-events-none z-15"
                        style={{
                          left: `${Math.max(5, Math.min(95, coordToPercent(player.X, true)))}%`,
                          top: `${Math.max(5, Math.min(95, coordToPercent(player.Y, false)))}%`,
                          transform: 'translate(-50%, -50%)',
                        }}
                      />
                    ))}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="heatmap">
              <Card className="glassmorphism border-white/10">
                <CardHeader>
                  <CardTitle className="text-white text-lg">Position Heatmap</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="relative w-full aspect-square border border-white/10 rounded-lg overflow-hidden">
                    <canvas 
                      ref={canvasRef}
                      className="absolute inset-0 w-full h-full"
                      style={{ background: 'rgba(15, 23, 42, 0.8)' }}
                    />
                    
                    {/* Zone overlays for reference */}
                    {Object.entries(MAP_CONFIG.zones).map(([zoneName, zone]) => (
                      <div
                        key={`overlay-${zoneName}`}
                        className="absolute border border-white/20 rounded text-xs text-white/60 flex items-center justify-center"
                        style={{
                          left: `${zone.x}%`,
                          top: `${zone.y}%`,
                          width: `${zone.width}%`,
                          height: `${zone.height}%`
                        }}
                      >
                        {zoneName.replace('_', ' ')}
                      </div>
                    ))}

                    {/* Heatmap Legend */}
                    <div className="absolute bottom-4 right-4 bg-black/70 rounded-lg p-3">
                      <div className="text-xs text-white mb-2 font-semibold">Activity Intensity</div>
                      <div className="flex items-center space-x-2">
                        <div className="w-4 h-4 bg-blue-500 rounded"></div>
                        <span className="text-xs text-blue-200">Low</span>
                        <div className="w-4 h-4 bg-yellow-500 rounded"></div>
                        <span className="text-xs text-yellow-200">Med</span>
                        <div className="w-4 h-4 bg-red-500 rounded"></div>
                        <span className="text-xs text-red-200">High</span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="control">
              <Card className="glassmorphism border-white/10">
                <CardHeader>
                  <CardTitle className="text-white text-lg">Territory Control</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {Object.entries(territoryControl).map(([zone, control]) => (
                      <div key={zone} className="flex items-center justify-between p-3 bg-white/5 rounded-lg">
                        <span className="text-white font-medium">{zone.replace('_', ' ')}</span>
                        <div className="flex items-center space-x-4">
                          <div className="flex items-center space-x-2">
                            <div className="w-3 h-3 bg-red-500 rounded"></div>
                            <span className="text-red-200 text-sm">{control.t}</span>
                          </div>
                          <div className="flex items-center space-x-2">
                            <div className="w-3 h-3 bg-blue-500 rounded"></div>
                            <span className="text-blue-200 text-sm">{control.ct}</span>
                          </div>
                          {control.contested && (
                            <Badge variant="outline" className="text-yellow-200 border-yellow-400">
                              Contested
                            </Badge>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>

        {/* Analysis Panel */}
        <div>
          <Tabs defaultValue="movement" className="space-y-4">
            <TabsList className="grid w-full grid-cols-3 bg-white/5 border border-white/10">
              <TabsTrigger value="movement" className="text-white data-[state=active]:bg-white/10">
                Movement
              </TabsTrigger>
              <TabsTrigger value="utility" className="text-white data-[state=active]:bg-white/10">
                Utility
              </TabsTrigger>
              <TabsTrigger value="tactical" className="text-white data-[state=active]:bg-white/10">
                Tactical
              </TabsTrigger>
            </TabsList>

            <TabsContent value="movement" className="space-y-4">
              <Card className="glassmorphism border-white/10">
                <CardHeader>
                  <CardTitle className="text-white text-sm">Movement Analysis</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {selectedPlayer && playerAnalysis ? (
                    <>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="text-center">
                          <div className="text-2xl font-bold text-blue-400">{playerAnalysis.totalDistance}</div>
                          <div className="text-xs text-blue-200">Total Distance</div>
                        </div>
                        <div className="text-center">
                          <div className="text-2xl font-bold text-green-400">{playerAnalysis.averageVelocity}</div>
                          <div className="text-xs text-green-200">Avg Velocity</div>
                        </div>
                        <div className="text-center">
                          <div className="text-2xl font-bold text-yellow-400">{playerAnalysis.maxVelocity}</div>
                          <div className="text-xs text-yellow-200">Max Velocity</div>
                        </div>
                        <div className="text-center">
                          <div className="text-2xl font-bold text-purple-400">{playerAnalysis.zonesVisited.length}</div>
                          <div className="text-xs text-purple-200">Zones Visited</div>
                        </div>
                      </div>
                      
                      <div>
                        <h4 className="text-white text-sm font-medium mb-2">Zones Visited</h4>
                        <div className="flex flex-wrap gap-1">
                          {playerAnalysis.zonesVisited.map(zone => (
                            <Badge key={zone} variant="outline" className="text-xs text-white border-white/20">
                              {zone.replace('_', ' ')}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    </>
                  ) : (
                    <p className="text-sm text-blue-200">Select a player to view movement analysis</p>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="utility" className="space-y-4">
              <Card className="glassmorphism border-white/10">
                <CardHeader>
                  <CardTitle className="text-white text-sm">Utility & Status</CardTitle>
                </CardHeader>
                <CardContent>
                  {selectedPlayer ? (
                    <div className="space-y-3">
                      {(() => {
                        const player = currentTickData.find(p => p.user_steamid === selectedPlayer);
                        return player ? (
                          <>
                            <div className="flex justify-between items-center">
                              <span className="text-sm text-blue-200">Health</span>
                              <div className="flex items-center space-x-2">
                                <div className="w-16 h-2 bg-gray-700 rounded">
                                  <div 
                                    className="h-full bg-green-500 rounded transition-all"
                                    style={{ width: `${player.health}%` }}
                                  />
                                </div>
                                <Badge variant="outline" className="text-white border-white/20 text-xs">
                                  {player.health}HP
                                </Badge>
                              </div>
                            </div>
                            
                            <div className="flex justify-between items-center">
                              <span className="text-sm text-blue-200">Armor</span>
                              <Badge variant="outline" className="text-white border-white/20">
                                {player.armor}
                              </Badge>
                            </div>
                            
                            <div className="flex justify-between items-center">
                              <span className="text-sm text-blue-200">Flash Duration</span>
                              <Badge 
                                variant="outline" 
                                className={`border-white/20 ${player.flash_duration > 0 ? 'text-yellow-400 border-yellow-400' : 'text-white'}`}
                              >
                                {player.flash_duration.toFixed(1)}s
                              </Badge>
                            </div>
                            
                            <div className="flex justify-between items-center">
                              <span className="text-sm text-blue-200">Current Velocity</span>
                              <Badge variant="outline" className="text-white border-white/20">
                                {Math.round(Math.sqrt(player.velocity_X ** 2 + player.velocity_Y ** 2))} u/s
                              </Badge>
                            </div>
                          </>
                        ) : (
                          <p className="text-sm text-gray-400">Player not visible at current tick</p>
                        );
                      })()}
                    </div>
                  ) : (
                    <p className="text-sm text-blue-200">Select a player to view utility data</p>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="tactical" className="space-y-4">
              <Card className="glassmorphism border-white/10">
                <CardHeader>
                  <CardTitle className="text-white text-sm">Tactical Insights</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div>
                      <h4 className="text-white text-sm font-medium mb-2">Round Overview</h4>
                      <div className="grid grid-cols-2 gap-2 text-xs">
                        <div className="text-blue-200">Active Players: {currentTickData.length}</div>
                        <div className="text-green-200">T-Side: {currentTickData.filter(p => p.side === 't').length}</div>
                        <div className="text-purple-200">CT-Side: {currentTickData.filter(p => p.side === 'ct').length}</div>
                        <div className="text-yellow-200">Flashed: {currentTickData.filter(p => p.flash_duration > 0).length}</div>
                      </div>
                    </div>
                    
                    <div>
                      <h4 className="text-white text-sm font-medium mb-2">Zone Control</h4>
                      <div className="text-xs text-blue-200">
                        Contested Zones: {Object.values(territoryControl).filter(z => z.contested).length}
                      </div>
                      <div className="text-xs text-red-200">
                        T-Controlled: {Object.values(territoryControl).filter(z => z.t > z.ct && !z.contested).length}
                      </div>
                      <div className="text-xs text-blue-200">
                        CT-Controlled: {Object.values(territoryControl).filter(z => z.ct > z.t && !z.contested).length}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
}
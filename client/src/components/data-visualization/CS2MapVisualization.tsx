import { useState, useMemo, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { Badge } from '@/components/ui/badge';
import { MapPin, Move, Zap, Target, Activity, Play, Pause, RotateCcw } from 'lucide-react';

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

interface CS2MapVisualizationProps {
  xyzData: XYZPlayerData[];
}

// CS2 Inferno map coordinates - adjusted for proper scaling
const MAP_BOUNDS = {
  minX: -2500,
  maxX: 2500,
  minY: -2500,
  maxY: 2500
};

// Convert CS2 coordinates to percentage position on map
function coordToPercent(coord: number, isX: boolean): number {
  const bounds = isX ? { min: MAP_BOUNDS.minX, max: MAP_BOUNDS.maxX } : { min: MAP_BOUNDS.minY, max: MAP_BOUNDS.maxY };
  return ((coord - bounds.min) / (bounds.max - bounds.min)) * 100;
}

export default function CS2MapVisualization({ xyzData = [] }: CS2MapVisualizationProps) {
  const [selectedPlayer, setSelectedPlayer] = useState<string>('');
  const [selectedRound, setSelectedRound] = useState<number | null>(null);
  const [currentTick, setCurrentTick] = useState<number>(0);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [playbackSpeed, setPlaybackSpeed] = useState<number>(1);

  // Initialize selectedRound when data loads
  useEffect(() => {
    if (xyzData && xyzData.length > 0 && selectedRound === null) {
      const rounds = Array.from(new Set(xyzData.map(d => d.round_num))).sort((a, b) => a - b);
      if (rounds.length > 0) {
        setSelectedRound(rounds[0]);
      }
    }
  }, [xyzData, selectedRound]);

  // Get available data
  const { players, rounds, roundData, tickRange } = useMemo(() => {
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

    return {
      players: uniquePlayers,
      rounds: uniqueRounds,
      roundData: currentRoundData,
      tickRange: { min: minTick, max: maxTick }
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
        const next = prev + (100 * playbackSpeed); // Skip ticks for smoother playback
        return next > tickRange.max ? tickRange.min : next;
      });
    }, 100);

    return () => clearInterval(interval);
  }, [isPlaying, tickRange, playbackSpeed]);

  // Player movement analysis
  const playerMovement = useMemo(() => {
    if (!selectedPlayer || !roundData.length) return null;

    const playerPositions = roundData
      .filter(d => d.user_steamid === selectedPlayer)
      .sort((a, b) => a.tick - b.tick);

    if (playerPositions.length < 2) return null;

    let totalDistance = 0;
    let maxVelocity = 0;
    const velocities: number[] = [];

    for (let i = 1; i < playerPositions.length; i++) {
      const curr = playerPositions[i];
      const prev = playerPositions[i - 1];
      
      const distance = Math.sqrt(
        Math.pow(curr.X - prev.X, 2) + 
        Math.pow(curr.Y - prev.Y, 2)
      );
      
      const velocity = Math.sqrt(
        Math.pow(curr.velocity_X, 2) + 
        Math.pow(curr.velocity_Y, 2)
      );

      totalDistance += distance;
      velocities.push(velocity);
      maxVelocity = Math.max(maxVelocity, velocity);
    }

    const avgVelocity = velocities.length > 0 ? velocities.reduce((a, b) => a + b, 0) / velocities.length : 0;

    return {
      totalDistance: Math.round(totalDistance),
      averageVelocity: Math.round(avgVelocity),
      maxVelocity: Math.round(maxVelocity),
      positions: playerPositions
    };
  }, [selectedPlayer, roundData]);

  if (!xyzData || xyzData.length === 0) {
    return (
      <Card className="glassmorphism border-white/10">
        <CardContent className="pt-6">
          <div className="flex items-center justify-center py-12">
            <div className="text-center space-y-4">
              <Activity className="h-12 w-12 text-blue-400 mx-auto animate-spin" />
              <h3 className="text-white font-semibold">Loading CS2 Position Data</h3>
              <p className="text-blue-200 text-sm">Processing authentic coordinate data from demo files...</p>
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
            <MapPin className="h-5 w-5" />
            CS2 Map Visualization - Inferno
          </CardTitle>
          <CardDescription className="text-blue-200">
            Real-time player positioning analysis from authentic demo data
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
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
                min={0.5}
                max={3}
                step={0.5}
                className="w-full"
              />
            </div>
          </div>

          {/* Tick slider */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-white">Tick: {currentTick}</label>
            <Slider
              value={[currentTick]}
              onValueChange={([value]) => setCurrentTick(value)}
              min={tickRange.min}
              max={tickRange.max}
              step={50}
              className="w-full"
            />
          </div>
        </CardContent>
      </Card>

      {/* Map and Analysis */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Map Visualization */}
        <div className="lg:col-span-2">
          <Card className="glassmorphism border-white/10">
            <CardHeader>
              <CardTitle className="text-white text-lg">Live Map View</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="relative w-full aspect-square bg-gradient-to-br from-orange-900/20 to-red-900/20 border border-white/10 rounded-lg overflow-hidden">
                {/* Map background overlay */}
                <div className="absolute inset-0 bg-gradient-to-br from-orange-800/10 via-red-800/10 to-yellow-800/10" />
                
                {/* Grid lines */}
                <svg className="absolute inset-0 w-full h-full">
                  <defs>
                    <pattern id="grid" width="10%" height="10%" patternUnits="userSpaceOnUse">
                      <path d="M 10 0 L 0 0 0 10" fill="none" stroke="rgba(255,255,255,0.1)" strokeWidth="0.5"/>
                    </pattern>
                  </defs>
                  <rect width="100%" height="100%" fill="url(#grid)" />
                </svg>

                {/* Map landmarks */}
                <div className="absolute inset-0">
                  {/* A Site */}
                  <div className="absolute top-1/4 right-1/4 w-16 h-12 bg-blue-500/20 border border-blue-400/40 rounded flex items-center justify-center">
                    <span className="text-xs text-blue-300 font-bold">A</span>
                  </div>
                  
                  {/* B Site */}
                  <div className="absolute bottom-1/3 left-1/4 w-16 h-12 bg-red-500/20 border border-red-400/40 rounded flex items-center justify-center">
                    <span className="text-xs text-red-300 font-bold">B</span>
                  </div>
                  
                  {/* Mid */}
                  <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-12 h-8 bg-yellow-500/20 border border-yellow-400/40 rounded flex items-center justify-center">
                    <span className="text-xs text-yellow-300 font-bold">MID</span>
                  </div>
                </div>

                {/* Player trail for selected player */}
                {selectedPlayer && playerMovement && (
                  <svg className="absolute inset-0 w-full h-full pointer-events-none">
                    <path
                      d={playerMovement.positions.map((pos, i) => 
                        `${i === 0 ? 'M' : 'L'} ${coordToPercent(pos.X, true)} ${coordToPercent(pos.Y, false)}`
                      ).join(' ')}
                      stroke="rgba(59, 130, 246, 0.6)"
                      strokeWidth="2"
                      fill="none"
                      strokeDasharray="5,5"
                    />
                  </svg>
                )}

                {/* Current player positions */}
                {currentTickData.map((player) => (
                  <div
                    key={player.user_steamid}
                    className={`absolute w-4 h-4 rounded-full border-2 border-white shadow-lg transition-all duration-200 flex items-center justify-center ${
                      player.user_steamid === selectedPlayer ? 'w-6 h-6 z-20' : 'z-10'
                    }`}
                    style={{
                      left: `${coordToPercent(player.X, true)}%`,
                      top: `${coordToPercent(player.Y, false)}%`,
                      backgroundColor: player.side === 't' ? '#ef4444' : '#3b82f6',
                      transform: 'translate(-50%, -50%)',
                    }}
                    title={`${player.name} (${player.health}HP)`}
                  >
                    <span className="text-xs text-white font-bold">
                      {player.name.substring(0, 2).toUpperCase()}
                    </span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Analysis Tabs */}
        <div>
          <Tabs defaultValue="movement" className="space-y-4">
            <TabsList className="grid w-full grid-cols-3 bg-white/5 border border-white/10">
              <TabsTrigger value="movement" className="text-white data-[state=active]:bg-white/10">
                <Move className="h-4 w-4 mr-1" />
                Movement
              </TabsTrigger>
              <TabsTrigger value="utility" className="text-white data-[state=active]:bg-white/10">
                <Zap className="h-4 w-4 mr-1" />
                Utility
              </TabsTrigger>
              <TabsTrigger value="metrics" className="text-white data-[state=active]:bg-white/10">
                <Target className="h-4 w-4 mr-1" />
                Metrics
              </TabsTrigger>
            </TabsList>

            <TabsContent value="movement" className="space-y-4">
              <Card className="glassmorphism border-white/10">
                <CardHeader>
                  <CardTitle className="text-white text-sm">Movement Analysis</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {selectedPlayer && playerMovement ? (
                    <>
                      <div className="space-y-2">
                        <div className="flex justify-between">
                          <span className="text-sm text-blue-200">Total Distance</span>
                          <Badge variant="outline" className="text-white border-white/20">
                            {playerMovement.totalDistance} units
                          </Badge>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-sm text-blue-200">Avg Velocity</span>
                          <Badge variant="outline" className="text-white border-white/20">
                            {playerMovement.averageVelocity} u/s
                          </Badge>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-sm text-blue-200">Max Velocity</span>
                          <Badge variant="outline" className="text-white border-white/20">
                            {playerMovement.maxVelocity} u/s
                          </Badge>
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
                  <CardTitle className="text-white text-sm">Utility Usage</CardTitle>
                </CardHeader>
                <CardContent>
                  {selectedPlayer ? (
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span className="text-sm text-blue-200">Flash Duration</span>
                        <Badge variant="outline" className="text-white border-white/20">
                          {currentTickData.find(p => p.user_steamid === selectedPlayer)?.flash_duration || 0}s
                        </Badge>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-blue-200">Current Health</span>
                        <Badge variant="outline" className="text-white border-white/20">
                          {currentTickData.find(p => p.user_steamid === selectedPlayer)?.health || 0}HP
                        </Badge>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-blue-200">Armor</span>
                        <Badge variant="outline" className="text-white border-white/20">
                          {currentTickData.find(p => p.user_steamid === selectedPlayer)?.armor || 0}
                        </Badge>
                      </div>
                    </div>
                  ) : (
                    <p className="text-sm text-blue-200">Select a player to view utility data</p>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="metrics" className="space-y-4">
              <Card className="glassmorphism border-white/10">
                <CardHeader>
                  <CardTitle className="text-white text-sm">Performance Metrics</CardTitle>
                </CardHeader>
                <CardContent>
                  {selectedPlayer ? (
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span className="text-sm text-blue-200">Position Count</span>
                        <Badge variant="outline" className="text-white border-white/20">
                          {roundData.filter(d => d.user_steamid === selectedPlayer).length}
                        </Badge>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-blue-200">Round Activity</span>
                        <Badge variant="outline" className="text-white border-white/20">
                          {((roundData.filter(d => d.user_steamid === selectedPlayer).length / roundData.length) * 100).toFixed(1)}%
                        </Badge>
                      </div>
                    </div>
                  ) : (
                    <p className="text-sm text-blue-200">Select a player to view metrics</p>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
}
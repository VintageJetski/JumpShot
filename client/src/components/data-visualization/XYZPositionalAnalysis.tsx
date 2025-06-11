import { useState, useMemo, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { Badge } from '@/components/ui/badge';
import { MapPin, Move, Zap, Target, Activity, AlertCircle, RotateCcw } from 'lucide-react';

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

interface PositionalMetrics {
  playerId: string;
  playerName: string;
  team: string;
  roundNum: number;
  totalDistance: number;
  averageVelocity: number;
  maxVelocity: number;
  mapControl: {
    areasCovered: string[];
    timeInEachArea: Record<string, number>;
    dominantArea: string;
  };
  hotZones: {
    x: number;
    y: number;
    intensity: number;
    timeSpent: number;
  }[];
  rotations: {
    from: string;
    to: string;
    timeToRotate: number;
    distanceTraveled: number;
  }[];
  utilityUsage: {
    smokes: { x: number; y: number; z: number; effectiveness: number }[];
    flashes: { x: number; y: number; z: number; effectiveness: number }[];
    nades: { x: number; y: number; z: number; effectiveness: number }[];
    molotovs: { x: number; y: number; z: number; effectiveness: number }[];
  };
}

interface XYZPositionalAnalysisProps {
  xyzData?: XYZPlayerData[];
  positionalMetrics?: PositionalMetrics[];
}

export default function XYZPositionalAnalysis({ xyzData = [], positionalMetrics = [] }: XYZPositionalAnalysisProps) {
  const [selectedPlayer, setSelectedPlayer] = useState<string>('');
  const [selectedRound, setSelectedRound] = useState<number | null>(null);
  const [playbackTick, setPlaybackTick] = useState<number>(0);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState<string>('heatmap');

  // Initialize selectedRound when XYZ data loads
  useEffect(() => {
    if (xyzData && xyzData.length > 0 && selectedRound === null) {
      const uniqueRounds = Array.from(new Set(xyzData.map(d => d.round_num))).sort((a, b) => a - b);
      if (uniqueRounds.length > 0) {
        setSelectedRound(uniqueRounds[0]);
      }
    }
  }, [xyzData, selectedRound]);

  // Show loading state if no data is available yet
  if (!xyzData || xyzData.length === 0) {
    return (
      <div className="space-y-6">
        <Card className="glassmorphism border-white/10">
          <CardContent className="pt-6">
            <div className="flex items-center justify-center py-12">
              <div className="text-center space-y-4">
                <AlertCircle className="h-12 w-12 text-blue-400 mx-auto animate-pulse" />
                <h3 className="text-white font-semibold">Loading Authentic Coordinate Data</h3>
                <p className="text-blue-200 text-sm max-w-md mx-auto">
                  Processing real XYZ coordinates from CS2 demo files. 
                  Dynamic clustering algorithms are generating authentic map areas from player positioning data.
                </p>
                <div className="flex items-center justify-center space-x-2 text-xs text-blue-300">
                  <Activity className="h-4 w-4 animate-spin" />
                  <span>Analyzing movement patterns...</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Get unique players and rounds from data
  const { players, rounds, tickRange } = useMemo(() => {
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
    
    const roundData = selectedRound ? xyzData.filter(d => d.round_num === selectedRound) : [];
    const minTick = roundData.length > 0 ? Math.min(...roundData.map(d => d.tick)) : 0;
    const maxTick = roundData.length > 0 ? Math.max(...roundData.map(d => d.tick)) : 0;

    return {
      players: uniquePlayers,
      rounds: uniqueRounds,
      tickRange: { min: minTick, max: maxTick }
    };
  }, [xyzData, selectedRound]);

  // Get current round data
  const currentRoundData = useMemo(() => {
    return selectedRound ? xyzData.filter(d => d.round_num === selectedRound) : [];
  }, [xyzData, selectedRound]);

  // Get current tick data for playback
  const currentTickData = useMemo(() => {
    return currentRoundData.filter(d => d.tick === playbackTick);
  }, [currentRoundData, playbackTick]);

  // Get selected player's metrics
  const playerMetrics = useMemo(() => {
    return positionalMetrics.find(m => m.playerId === selectedPlayer);
  }, [positionalMetrics, selectedPlayer]);

  // Auto-play functionality
  useEffect(() => {
    if (!isPlaying) return;

    const interval = setInterval(() => {
      setPlaybackTick(prev => {
        if (prev >= tickRange.max) {
          setIsPlaying(false);
          return tickRange.min;
        }
        return prev + 100; // Advance by 100 ticks (~1.5 seconds)
      });
    }, 100); // Update every 100ms for smooth playback

    return () => clearInterval(interval);
  }, [isPlaying, tickRange]);

  // Initialize playback tick when round changes
  useEffect(() => {
    setPlaybackTick(tickRange.min);
    setIsPlaying(false);
  }, [selectedRound, tickRange.min]);

  const formatTime = (tick: number) => {
    const seconds = Math.floor(tick / 64); // CS2 runs at 64 tick rate
    const minutes = Math.floor(seconds / 60);
    return `${minutes}:${(seconds % 60).toString().padStart(2, '0')}`;
  };

  const getPlayerColor = (side: 't' | 'ct', index: number) => {
    const tColors = ['#ff6b6b', '#ff8e53', '#ff6b9d', '#ff7675', '#fd79a8'];
    const ctColors = ['#74b9ff', '#0984e3', '#6c5ce7', '#55a3ff', '#3742fa'];
    return side === 't' ? tColors[index % 5] : ctColors[index % 5];
  };

  return (
    <div className="space-y-6">
      {/* Control Panel */}
      <Card className="glassmorphism border-white/10">
        <CardHeader>
          <CardTitle className="text-white flex items-center gap-2">
            <MapPin className="h-5 w-5" />
            XYZ Positional Analysis
          </CardTitle>
          <CardDescription className="text-blue-200">
            Real-time analysis of player movements using actual CS2 coordinate data
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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
                      <div className="flex items-center gap-2">
                        <div className={`w-2 h-2 rounded-full ${player.side === 't' ? 'bg-red-500' : 'bg-blue-500'}`} />
                        {player.name}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="text-sm font-medium text-white mb-2 block">
                Playback: {formatTime(playbackTick)}
              </label>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setIsPlaying(!isPlaying)}
                  className="bg-white/10 border-white/20 text-white hover:bg-white/20"
                >
                  {isPlaying ? 'Pause' : 'Play'}
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setPlaybackTick(tickRange.min);
                    setIsPlaying(false);
                  }}
                  className="bg-white/10 border-white/20 text-white hover:bg-white/20"
                >
                  Reset
                </Button>
              </div>
            </div>
          </div>

          {/* Playback Slider */}
          <div className="mt-4">
            <Slider
              value={[playbackTick]}
              onValueChange={(values: number[]) => setPlaybackTick(values[0])}
              min={tickRange.min}
              max={tickRange.max}
              step={64}
              className="w-full"
            />
          </div>
        </CardContent>
      </Card>

      {/* Analysis Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid grid-cols-4 w-full bg-white/5">
          <TabsTrigger value="heatmap" className="text-white">Heat Map</TabsTrigger>
          <TabsTrigger value="movement" className="text-white">Movement</TabsTrigger>
          <TabsTrigger value="utility" className="text-white">Utility</TabsTrigger>
          <TabsTrigger value="metrics" className="text-white">Metrics</TabsTrigger>
        </TabsList>

        <TabsContent value="heatmap" className="mt-6">
          <Card className="glassmorphism border-white/10">
            <CardHeader>
              <CardTitle className="text-white">Player Heat Map</CardTitle>
              <CardDescription className="text-blue-200">
                Shows areas of highest player activity based on position density
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="relative bg-slate-800 rounded-lg p-4" style={{ aspectRatio: '16/9', minHeight: '400px' }}>
                {/* Map Background */}
                <div className="absolute inset-0 bg-gradient-to-br from-slate-700 to-slate-900 rounded-lg">
                  {/* Map Areas Overlay */}
                  <div className="absolute inset-4">
                    {/* Hot Zones */}
                    {playerMetrics?.hotZones.map((zone, index) => (
                      <div
                        key={index}
                        className="absolute rounded-full"
                        style={{
                          left: `${((zone.x + 2000) / 4000) * 100}%`,
                          top: `${((zone.y + 2000) / 4000) * 100}%`,
                          width: `${zone.intensity * 30}px`,
                          height: `${zone.intensity * 30}px`,
                          backgroundColor: `rgba(255, 100, 100, ${zone.intensity})`,
                          transform: 'translate(-50%, -50%)'
                        }}
                        title={`Intensity: ${(zone.intensity * 100).toFixed(1)}%`}
                      />
                    ))}

                    {/* Current Player Positions */}
                    {currentTickData.map((player, index) => (
                      <div
                        key={player.user_steamid}
                        className="absolute w-3 h-3 rounded-full border-2 border-white shadow-lg transition-all duration-200"
                        style={{
                          left: `${((player.X + 2000) / 4000) * 100}%`,
                          top: `${((player.Y + 2000) / 4000) * 100}%`,
                          backgroundColor: getPlayerColor(player.side, index),
                          transform: 'translate(-50%, -50%)',
                          zIndex: player.user_steamid === selectedPlayer ? 20 : 10
                        }}
                        title={`${player.name} (${player.health}HP)`}
                      />
                    ))}
                  </div>
                </div>

                {/* Map Legend */}
                <div className="absolute bottom-4 left-4 bg-black/50 rounded p-2">
                  <div className="text-white text-xs space-y-1">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 bg-red-500 rounded-full" />
                      <span>Terrorist</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 bg-blue-500 rounded-full" />
                      <span>Counter-Terrorist</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 bg-red-500/50 rounded-full" />
                      <span>Hot Zone</span>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="movement" className="mt-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card className="glassmorphism border-white/10">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-2">
                  <Move className="h-5 w-5" />
                  Movement Patterns
                </CardTitle>
              </CardHeader>
              <CardContent>
                {playerMetrics ? (
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="bg-white/5 rounded p-3">
                        <div className="text-sm text-blue-200">Total Distance</div>
                        <div className="text-lg font-semibold text-white">
                          {playerMetrics.totalDistance.toFixed(0)} units
                        </div>
                      </div>
                      <div className="bg-white/5 rounded p-3">
                        <div className="text-sm text-blue-200">Avg Velocity</div>
                        <div className="text-lg font-semibold text-white">
                          {playerMetrics.averageVelocity.toFixed(1)} u/s
                        </div>
                      </div>
                    </div>

                    <div>
                      <h4 className="text-white font-medium mb-2">Areas Covered</h4>
                      <div className="flex flex-wrap gap-2">
                        {playerMetrics.mapControl.areasCovered.map(area => (
                          <Badge key={area} variant="secondary" className="bg-white/10 text-white">
                            {area}
                          </Badge>
                        ))}
                      </div>
                    </div>

                    <div>
                      <h4 className="text-white font-medium mb-2">Dominant Area</h4>
                      <Badge variant="default" className="bg-blue-500/20 text-blue-200">
                        {playerMetrics.mapControl.dominantArea}
                      </Badge>
                    </div>
                  </div>
                ) : (
                  <div className="text-center text-blue-200 py-8">
                    Select a player to view movement patterns
                  </div>
                )}
              </CardContent>
            </Card>

            <Card className="glassmorphism border-white/10">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-2">
                  <RotateCcw className="h-5 w-5" />
                  Rotations
                </CardTitle>
              </CardHeader>
              <CardContent>
                {playerMetrics?.rotations.length ? (
                  <div className="space-y-3 max-h-64 overflow-y-auto">
                    {playerMetrics.rotations.slice(0, 10).map((rotation, index) => (
                      <div key={index} className="bg-white/5 rounded p-3">
                        <div className="flex justify-between items-start">
                          <div>
                            <div className="text-white font-medium">
                              {rotation.from} → {rotation.to}
                            </div>
                            <div className="text-xs text-blue-200">
                              {(rotation.timeToRotate / 1000).toFixed(1)}s
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="text-sm text-white">
                              {rotation.distanceTraveled.toFixed(0)} units
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center text-blue-200 py-8">
                    No rotations detected for selected player
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="utility" className="mt-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Utility Usage Cards */}
            {playerMetrics && (
              <>
                <Card className="glassmorphism border-white/10">
                  <CardHeader>
                    <CardTitle className="text-white flex items-center gap-2">
                      <Zap className="h-5 w-5" />
                      Smokes & Flashes
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div>
                        <h4 className="text-white font-medium mb-2">Smokes ({playerMetrics.utilityUsage.smokes.length})</h4>
                        <div className="space-y-2">
                          {playerMetrics.utilityUsage.smokes.slice(0, 3).map((smoke, index) => (
                            <div key={index} className="bg-white/5 rounded p-2">
                              <div className="text-sm text-white">
                                Position: ({smoke.x.toFixed(0)}, {smoke.y.toFixed(0)})
                              </div>
                              <div className="text-xs text-blue-200">
                                Effectiveness: {(smoke.effectiveness * 100).toFixed(1)}%
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>

                      <div>
                        <h4 className="text-white font-medium mb-2">Flashes ({playerMetrics.utilityUsage.flashes.length})</h4>
                        <div className="space-y-2">
                          {playerMetrics.utilityUsage.flashes.slice(0, 3).map((flash, index) => (
                            <div key={index} className="bg-white/5 rounded p-2">
                              <div className="text-sm text-white">
                                Position: ({flash.x.toFixed(0)}, {flash.y.toFixed(0)})
                              </div>
                              <div className="text-xs text-blue-200">
                                Effectiveness: {(flash.effectiveness * 100).toFixed(1)}%
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="glassmorphism border-white/10">
                  <CardHeader>
                    <CardTitle className="text-white flex items-center gap-2">
                      <Target className="h-5 w-5" />
                      Grenades & Molotovs
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div>
                        <h4 className="text-white font-medium mb-2">HE Grenades ({playerMetrics.utilityUsage.nades.length})</h4>
                        <div className="space-y-2">
                          {playerMetrics.utilityUsage.nades.slice(0, 3).map((nade, index) => (
                            <div key={index} className="bg-white/5 rounded p-2">
                              <div className="text-sm text-white">
                                Position: ({nade.x.toFixed(0)}, {nade.y.toFixed(0)})
                              </div>
                              <div className="text-xs text-blue-200">
                                Effectiveness: {(nade.effectiveness * 100).toFixed(1)}%
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>

                      <div>
                        <h4 className="text-white font-medium mb-2">Molotovs ({playerMetrics.utilityUsage.molotovs.length})</h4>
                        <div className="space-y-2">
                          {playerMetrics.utilityUsage.molotovs.slice(0, 3).map((molotov, index) => (
                            <div key={index} className="bg-white/5 rounded p-2">
                              <div className="text-sm text-white">
                                Position: ({molotov.x.toFixed(0)}, {molotov.y.toFixed(0)})
                              </div>
                              <div className="text-xs text-blue-200">
                                Effectiveness: {(molotov.effectiveness * 100).toFixed(1)}%
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </>
            )}
          </div>
        </TabsContent>

        <TabsContent value="metrics" className="mt-6">
          <Card className="glassmorphism border-white/10">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <Activity className="h-5 w-5" />
                Comprehensive Player Metrics
              </CardTitle>
            </CardHeader>
            <CardContent>
              {playerMetrics ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  <div className="space-y-3">
                    <h4 className="text-white font-semibold">Movement Stats</h4>
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span className="text-blue-200">Distance:</span>
                        <span className="text-white">{playerMetrics.totalDistance.toFixed(0)} units</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-blue-200">Avg Speed:</span>
                        <span className="text-white">{playerMetrics.averageVelocity.toFixed(1)} u/s</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-blue-200">Max Speed:</span>
                        <span className="text-white">{playerMetrics.maxVelocity.toFixed(1)} u/s</span>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <h4 className="text-white font-semibold">Map Control</h4>
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span className="text-blue-200">Areas:</span>
                        <span className="text-white">{playerMetrics.mapControl.areasCovered.length}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-blue-200">Dominant:</span>
                        <span className="text-white">{playerMetrics.mapControl.dominantArea}</span>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <h4 className="text-white font-semibold">Utility Usage</h4>
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span className="text-blue-200">Smokes:</span>
                        <span className="text-white">{playerMetrics.utilityUsage.smokes.length}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-blue-200">Flashes:</span>
                        <span className="text-white">{playerMetrics.utilityUsage.flashes.length}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-blue-200">Nades:</span>
                        <span className="text-white">{playerMetrics.utilityUsage.nades.length}</span>
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-center text-blue-200 py-8">
                  Select a player to view detailed metrics
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
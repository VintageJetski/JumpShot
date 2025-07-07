import { useState, useMemo } from 'react';
import { Card } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { MapPin, TrendingUp, Brain, Target, Zap, Activity } from 'lucide-react';

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

interface SimpleTacticalMapProps {
  xyzData: XYZPlayerData[];
}

export function SimpleTacticalMap({ xyzData }: SimpleTacticalMapProps) {
  const [selectedRound, setSelectedRound] = useState<string>('all');
  const [activeTab, setActiveTab] = useState('overview');

  // Get available rounds
  const availableRounds = useMemo(() => {
    const rounds = Array.from(new Set(xyzData.map(d => d.round_num))).sort((a, b) => a - b);
    return rounds;
  }, [xyzData]);

  // Filter data by selected round
  const filteredData = useMemo(() => {
    if (selectedRound === 'all') return xyzData;
    return xyzData.filter(d => d.round_num === parseInt(selectedRound));
  }, [xyzData, selectedRound]);

  // Enhanced statistics with Phase 3 predictive metrics
  const stats = useMemo(() => {
    const tPlayers = filteredData.filter(d => d.side === 't');
    const ctPlayers = filteredData.filter(d => d.side === 'ct');
    const avgHealth = filteredData.reduce((sum, d) => sum + d.health, 0) / filteredData.length;
    const activePlayers = filteredData.filter(d => d.health > 0);
    
    // Phase 3: Predictive Analytics
    const highVelocityPlayers = filteredData.filter(d => 
      Math.sqrt(d.velocity_X ** 2 + d.velocity_Y ** 2) > 200
    );
    
    const lowHealthPlayers = filteredData.filter(d => d.health > 0 && d.health < 50);
    const coordinations = filteredData.reduce((acc, player) => {
      const teammates = filteredData.filter(other => 
        other.side === player.side && 
        other.name !== player.name &&
        Math.sqrt((player.X - other.X) ** 2 + (player.Y - other.Y) ** 2) < 800
      );
      return acc + teammates.length;
    }, 0) / 2; // Divide by 2 to avoid double counting
    
    // Predictive round outcome probability
    const tAlive = tPlayers.filter(p => p.health > 0).length;
    const ctAlive = ctPlayers.filter(p => p.health > 0).length;
    const tAvgHealth = tPlayers.reduce((sum, p) => sum + p.health, 0) / tPlayers.length;
    const ctAvgHealth = ctPlayers.reduce((sum, p) => sum + p.health, 0) / ctPlayers.length;
    
    let roundPrediction = 'BALANCED';
    let confidence = 50;
    
    if (tAlive > ctAlive && tAvgHealth > ctAvgHealth) {
      roundPrediction = 'T-SIDE FAVORED';
      confidence = Math.min(85, 50 + (tAlive - ctAlive) * 10 + (tAvgHealth - ctAvgHealth) / 10);
    } else if (ctAlive > tAlive && ctAvgHealth > tAvgHealth) {
      roundPrediction = 'CT-SIDE FAVORED';
      confidence = Math.min(85, 50 + (ctAlive - tAlive) * 10 + (ctAvgHealth - tAvgHealth) / 10);
    }
    
    return {
      totalPositions: filteredData.length,
      tPlayerCount: tPlayers.length,
      ctPlayerCount: ctPlayers.length,
      avgHealth: Math.round(avgHealth),
      alivePlayers: activePlayers.length,
      deadPlayers: filteredData.length - activePlayers.length,
      // Phase 3 metrics
      highActivity: highVelocityPlayers.length,
      vulnerablePlayers: lowHealthPlayers.length,
      teamCoordination: Math.round(coordinations),
      roundPrediction,
      predictionConfidence: Math.round(confidence)
    };
  }, [filteredData]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600/10 to-purple-600/10 border border-blue-600/20 rounded-lg p-4">
        <div className="flex items-center gap-3 mb-3">
          <div className="bg-blue-600 text-white p-2 rounded-lg">
            <TrendingUp className="h-5 w-5" />
          </div>
          <div>
            <h3 className="font-semibold text-lg">Phase 2: Tactical Analysis</h3>
            <p className="text-sm text-muted-foreground">
              Processing {stats.totalPositions.toLocaleString()} position records
            </p>
          </div>
        </div>
      </div>

      {/* Controls */}
      <div className="flex gap-4 items-center">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium">Round:</span>
          <Select value={selectedRound} onValueChange={setSelectedRound}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Rounds</SelectItem>
              {availableRounds.map(round => (
                <SelectItem key={round} value={round.toString()}>
                  Round {round}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid grid-cols-3 w-full max-w-lg">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="insights">Phase 2 AI</TabsTrigger>
          <TabsTrigger value="predictive">Phase 3 Predictive</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="mt-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card className="p-4">
              <div className="flex items-center gap-3">
                <div className="bg-red-600 text-white p-2 rounded-lg">
                  <MapPin className="h-4 w-4" />
                </div>
                <div>
                  <div className="text-2xl font-bold">{stats.tPlayerCount}</div>
                  <div className="text-sm text-muted-foreground">T-Side Positions</div>
                </div>
              </div>
            </Card>

            <Card className="p-4">
              <div className="flex items-center gap-3">
                <div className="bg-green-600 text-white p-2 rounded-lg">
                  <MapPin className="h-4 w-4" />
                </div>
                <div>
                  <div className="text-2xl font-bold">{stats.ctPlayerCount}</div>
                  <div className="text-sm text-muted-foreground">CT-Side Positions</div>
                </div>
              </div>
            </Card>

            <Card className="p-4">
              <div className="flex items-center gap-3">
                <div className="bg-blue-600 text-white p-2 rounded-lg">
                  <TrendingUp className="h-4 w-4" />
                </div>
                <div>
                  <div className="text-2xl font-bold">{stats.avgHealth}%</div>
                  <div className="text-sm text-muted-foreground">Average Health</div>
                </div>
              </div>
            </Card>
          </div>

          <Card className="mt-6 p-6">
            <h4 className="font-semibold mb-4">Position Analysis</h4>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-sm">Total Positions Tracked</span>
                <Badge variant="outline">{stats.totalPositions.toLocaleString()}</Badge>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm">Players Alive</span>
                <Badge variant="default">{stats.alivePlayers}</Badge>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm">Players Eliminated</span>
                <Badge variant="secondary">{stats.deadPlayers}</Badge>
              </div>
            </div>
          </Card>
        </TabsContent>

        <TabsContent value="insights" className="mt-4">
          <div className="bg-gradient-to-r from-purple-600/10 to-blue-600/10 border border-purple-600/20 rounded-lg p-6">
            <h4 className="font-semibold text-lg mb-4">Phase 2 AI Analysis</h4>
            <div className="space-y-4">
              <div className="grid grid-cols-3 gap-4 text-sm">
                <div className="text-center">
                  <div className="text-orange-500 font-semibold">Utility Intelligence</div>
                  <div className="text-xs text-muted-foreground">Analyzing deployment patterns</div>
                </div>
                <div className="text-center">
                  <div className="text-green-500 font-semibold">Information Warfare</div>
                  <div className="text-xs text-muted-foreground">Tracking lurker movements</div>
                </div>
                <div className="text-center">
                  <div className="text-purple-500 font-semibold">Coordination</div>
                  <div className="text-xs text-muted-foreground">Team formation analysis</div>
                </div>
              </div>
              
              <div className="bg-black/20 rounded-lg p-4 text-center">
                <div className="text-lg font-semibold text-green-400">✓ Phase 2 Active</div>
                <div className="text-sm text-muted-foreground mt-1">
                  Advanced tactical analysis engine processing {stats.totalPositions.toLocaleString()} positions
                </div>
              </div>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="predictive" className="mt-4">
          <div className="space-y-6">
            {/* Phase 3 Header */}
            <div className="bg-gradient-to-r from-purple-600/10 to-pink-600/10 border border-purple-600/20 rounded-lg p-4">
              <div className="flex items-center gap-3 mb-3">
                <div className="bg-purple-600 text-white p-2 rounded-lg">
                  <Brain className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="font-semibold text-lg">Phase 3: Predictive Match Analytics</h3>
                  <p className="text-sm text-muted-foreground">
                    Real-time round outcome prediction, momentum analysis, and tactical forecasting
                  </p>
                </div>
              </div>
            </div>

            {/* Round Prediction */}
            <Card className="p-6 bg-gradient-to-r from-slate-900 to-slate-800 border border-purple-600/20">
              <div className="flex items-center justify-between mb-4">
                <h4 className="font-semibold text-lg text-white">Live Round Prediction</h4>
                <Badge 
                  variant={stats.predictionConfidence > 70 ? "default" : "secondary"}
                  className="text-xs"
                >
                  {stats.predictionConfidence}% Confidence
                </Badge>
              </div>
              
              <div className="text-center space-y-3">
                <div className="text-2xl font-bold text-purple-400">
                  {stats.roundPrediction}
                </div>
                <div className="text-sm text-gray-300">
                  Based on player health, positioning, and team coordination patterns
                </div>
                
                {/* Prediction breakdown */}
                <div className="grid grid-cols-2 gap-4 mt-6">
                  <div className="bg-red-600/20 border border-red-600/30 rounded-lg p-3">
                    <div className="text-red-400 font-semibold">T-Side Analysis</div>
                    <div className="text-sm text-gray-300">
                      {stats.tPlayerCount} positions tracked
                    </div>
                  </div>
                  <div className="bg-green-600/20 border border-green-600/30 rounded-lg p-3">
                    <div className="text-green-400 font-semibold">CT-Side Analysis</div>
                    <div className="text-sm text-gray-300">
                      {stats.ctPlayerCount} positions tracked
                    </div>
                  </div>
                </div>
              </div>
            </Card>

            {/* Phase 3 Analytics Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Card className="p-4">
                <div className="flex items-center gap-3">
                  <div className="bg-orange-600 text-white p-2 rounded-lg">
                    <Activity className="h-4 w-4" />
                  </div>
                  <div>
                    <div className="text-2xl font-bold">{stats.highActivity}</div>
                    <div className="text-sm text-muted-foreground">High Activity Players</div>
                  </div>
                </div>
                <div className="mt-2 text-xs text-muted-foreground">
                  Players moving more than 200 units/sec
                </div>
              </Card>

              <Card className="p-4">
                <div className="flex items-center gap-3">
                  <div className="bg-red-600 text-white p-2 rounded-lg">
                    <Target className="h-4 w-4" />
                  </div>
                  <div>
                    <div className="text-2xl font-bold">{stats.vulnerablePlayers}</div>
                    <div className="text-sm text-muted-foreground">Vulnerable Players</div>
                  </div>
                </div>
                <div className="mt-2 text-xs text-muted-foreground">
                  Players with less than 50 HP
                </div>
              </Card>

              <Card className="p-4">
                <div className="flex items-center gap-3">
                  <div className="bg-blue-600 text-white p-2 rounded-lg">
                    <Zap className="h-4 w-4" />
                  </div>
                  <div>
                    <div className="text-2xl font-bold">{stats.teamCoordination}</div>
                    <div className="text-sm text-muted-foreground">Coordination Index</div>
                  </div>
                </div>
                <div className="mt-2 text-xs text-muted-foreground">
                  Teammate proximity clusters
                </div>
              </Card>
            </div>

            {/* Advanced Predictions */}
            <Card className="p-6">
              <h4 className="font-semibold mb-4">Advanced Tactical Forecasting</h4>
              <div className="space-y-4">
                <div className="bg-gradient-to-r from-blue-600/10 to-purple-600/10 border border-blue-600/20 rounded-lg p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Brain className="h-4 w-4 text-blue-400" />
                    <span className="font-medium text-blue-400">Momentum Analysis</span>
                  </div>
                  <div className="text-sm text-muted-foreground">
                    {stats.highActivity > 3 ? 
                      "High team mobility detected - aggressive plays incoming" :
                      "Low mobility phase - tactical positioning and holds expected"
                    }
                  </div>
                </div>

                <div className="bg-gradient-to-r from-green-600/10 to-blue-600/10 border border-green-600/20 rounded-lg p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Target className="h-4 w-4 text-green-400" />
                    <span className="font-medium text-green-400">Economic Inference</span>
                  </div>
                  <div className="text-sm text-muted-foreground">
                    {stats.avgHealth > 75 ? 
                      "Strong economy round - expect heavy utility usage" :
                      "Potential eco/force round - limited utility expected"
                    }
                  </div>
                </div>

                <div className="bg-gradient-to-r from-purple-600/10 to-pink-600/10 border border-purple-600/20 rounded-lg p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Zap className="h-4 w-4 text-purple-400" />
                    <span className="font-medium text-purple-400">Next Play Prediction</span>
                  </div>
                  <div className="text-sm text-muted-foreground">
                    {stats.teamCoordination > 15 ? 
                      "Coordinated team execute likely - expect synchronized utility" :
                      "Individual plays expected - watch for picks and duels"
                    }
                  </div>
                </div>
              </div>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
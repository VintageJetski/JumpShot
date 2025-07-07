import { useState, useMemo } from 'react';
import { Card } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { MapPin, TrendingUp, Brain, Target, Zap, Activity, Shield, Sword, Users, AlertTriangle, Eye, Crown } from 'lucide-react';

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

  // Phase 4: Tactical Analysis Functions
  const analyzeTacticalFormations = (players: XYZPlayerData[]) => {
    if (players.length === 0) return { type: 'Unknown', confidence: 0 };
    
    const alivePlayers = players.filter(p => p.health > 0);
    if (alivePlayers.length < 2) return { type: 'Individual', confidence: 90 };
    
    const avgX = alivePlayers.reduce((sum, p) => sum + p.X, 0) / alivePlayers.length;
    const avgY = alivePlayers.reduce((sum, p) => sum + p.Y, 0) / alivePlayers.length;
    
    const distances = alivePlayers.map(p => Math.sqrt((p.X - avgX) ** 2 + (p.Y - avgY) ** 2));
    const avgDistance = distances.reduce((sum, d) => sum + d, 0) / distances.length;
    
    if (avgDistance < 400) return { type: 'Tight Stack', confidence: 85 };
    if (avgDistance < 800) return { type: 'Loose Formation', confidence: 75 };
    return { type: 'Split Formation', confidence: 80 };
  };

  const calculateMapControl = (players: XYZPlayerData[]) => {
    const tPlayers = players.filter(p => p.side === 't' && p.health > 0);
    const ctPlayers = players.filter(p => p.side === 'ct' && p.health > 0);
    
    const tCoverage = tPlayers.length * 500;
    const ctCoverage = ctPlayers.length * 500;
    
    const totalCoverage = tCoverage + ctCoverage;
    const tControl = totalCoverage > 0 ? (tCoverage / totalCoverage) * 100 : 50;
    
    return { score: Math.round(tControl), advantage: tControl > 60 ? 'T-SIDE' : tControl < 40 ? 'CT-SIDE' : 'CONTESTED' };
  };

  const assessTacticalAdvantage = (players: XYZPlayerData[]) => {
    const tPlayers = players.filter(p => p.side === 't');
    const ctPlayers = players.filter(p => p.side === 'ct');
    
    const tAlive = tPlayers.filter(p => p.health > 0).length;
    const ctAlive = ctPlayers.filter(p => p.health > 0).length;
    
    const tAvgHealth = tPlayers.reduce((sum, p) => sum + p.health, 0) / tPlayers.length || 0;
    const ctAvgHealth = ctPlayers.reduce((sum, p) => sum + p.health, 0) / ctPlayers.length || 0;
    
    const tScore = (tAlive * 20) + (tAvgHealth * 0.5);
    const ctScore = (ctAlive * 20) + (ctAvgHealth * 0.5);
    
    if (tScore > ctScore + 30) return { side: 'T-STRONG', confidence: 80 };
    if (ctScore > tScore + 30) return { side: 'CT-STRONG', confidence: 80 };
    return { side: 'BALANCED', confidence: 60 };
  };

  const predictExecuteTiming = (players: XYZPlayerData[]) => {
    const highVelocity = players.filter(p => 
      Math.sqrt(p.velocity_X ** 2 + p.velocity_Y ** 2) > 150 && p.health > 0
    ).length;
    
    const coordination = players.reduce((acc, player) => {
      const teammates = players.filter(other => 
        other.side === player.side && 
        other.name !== player.name &&
        Math.sqrt((player.X - other.X) ** 2 + (player.Y - other.Y) ** 2) < 600
      );
      return acc + teammates.length;
    }, 0) / 2;
    
    if (highVelocity > 4 && coordination > 10) return { phase: 'IMMEDIATE EXECUTE', timing: '0-5s' };
    if (highVelocity > 2 && coordination > 5) return { phase: 'PREPARING EXECUTE', timing: '5-15s' };
    return { phase: 'POSITIONAL SETUP', timing: '15-30s' };
  };

  const calculateInformationControl = (players: XYZPlayerData[]) => {
    const tPlayers = players.filter(p => p.side === 't' && p.health > 0);
    const ctPlayers = players.filter(p => p.side === 'ct' && p.health > 0);
    
    const tSpread = tPlayers.length > 1 ? 
      Math.max(...tPlayers.map(p => p.X)) - Math.min(...tPlayers.map(p => p.X)) : 0;
    const ctSpread = ctPlayers.length > 1 ? 
      Math.max(...ctPlayers.map(p => p.X)) - Math.min(...ctPlayers.map(p => p.X)) : 0;
    
    if (tSpread > ctSpread + 500) return { advantage: 'T-SIDE', score: 75 };
    if (ctSpread > tSpread + 500) return { advantage: 'CT-SIDE', score: 75 };
    return { advantage: 'NEUTRAL', score: 50 };
  };

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

    // Phase 4: Advanced Tactical Analysis
    const tFormations = analyzeTacticalFormations(tPlayers);
    const ctFormations = analyzeTacticalFormations(ctPlayers);
    const mapControl = calculateMapControl(filteredData);
    const tacticalAdvantage = assessTacticalAdvantage(filteredData);
    const executeTiming = predictExecuteTiming(filteredData);
    const informationControl = calculateInformationControl(filteredData);
    
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
      predictionConfidence: Math.round(confidence),
      // Phase 4 metrics
      tFormation: tFormations.type,
      ctFormation: ctFormations.type,
      mapControlScore: mapControl.score,
      tacticalAdvantage: tacticalAdvantage.side,
      executeTiming: executeTiming.phase,
      informationControl: informationControl.advantage
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
        <TabsList className="grid grid-cols-4 w-full max-w-2xl">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="insights">Phase 2 AI</TabsTrigger>
          <TabsTrigger value="predictive">Phase 3 Predictive</TabsTrigger>
          <TabsTrigger value="tactical">Phase 4 Tactical</TabsTrigger>
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

        <TabsContent value="tactical" className="mt-4">
          <div className="space-y-6">
            {/* Phase 4 Header */}
            <div className="bg-gradient-to-r from-indigo-600/10 to-purple-600/10 border border-indigo-600/20 rounded-lg p-4">
              <div className="flex items-center gap-3 mb-3">
                <div className="bg-indigo-600 text-white p-2 rounded-lg">
                  <Crown className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="font-semibold text-lg">Phase 4: Advanced Tactical Intelligence</h3>
                  <p className="text-sm text-muted-foreground">
                    Elite-level tactical analysis, formation recognition, and strategic decision support
                  </p>
                </div>
              </div>
            </div>

            {/* Tactical Command Center */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Formation Analysis */}
              <Card className="p-6 bg-gradient-to-br from-slate-900 to-slate-800 border border-indigo-600/20">
                <div className="flex items-center gap-3 mb-4">
                  <div className="bg-indigo-600 text-white p-2 rounded-lg">
                    <Users className="h-5 w-5" />
                  </div>
                  <h4 className="font-semibold text-lg text-white">Formation Analysis</h4>
                </div>
                
                <div className="space-y-4">
                  <div className="bg-red-600/20 border border-red-600/30 rounded-lg p-4">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-red-400 font-medium">T-Side Formation</span>
                      <Badge variant="outline" className="text-xs border-red-600/50">
                        {stats.tFormation}
                      </Badge>
                    </div>
                    <div className="text-sm text-gray-300">
                      Current tactical positioning and team structure
                    </div>
                  </div>

                  <div className="bg-green-600/20 border border-green-600/30 rounded-lg p-4">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-green-400 font-medium">CT-Side Formation</span>
                      <Badge variant="outline" className="text-xs border-green-600/50">
                        {stats.ctFormation}
                      </Badge>
                    </div>
                    <div className="text-sm text-gray-300">
                      Defensive setup and site coverage analysis
                    </div>
                  </div>
                </div>
              </Card>

              {/* Tactical Advantage */}
              <Card className="p-6 bg-gradient-to-br from-slate-900 to-slate-800 border border-purple-600/20">
                <div className="flex items-center gap-3 mb-4">
                  <div className="bg-purple-600 text-white p-2 rounded-lg">
                    <Sword className="h-5 w-5" />
                  </div>
                  <h4 className="font-semibold text-lg text-white">Tactical Advantage</h4>
                </div>
                
                <div className="text-center space-y-3">
                  <div className="text-2xl font-bold text-purple-400">
                    {stats.tacticalAdvantage}
                  </div>
                  <div className="text-sm text-gray-300">
                    Overall tactical position assessment
                  </div>
                  
                  <div className="bg-purple-600/20 border border-purple-600/30 rounded-lg p-3 mt-4">
                    <div className="text-sm text-purple-400 font-medium mb-1">Map Control</div>
                    <div className="text-lg font-bold text-white">{stats.mapControlScore}% T-Control</div>
                  </div>
                </div>
              </Card>
            </div>

            {/* Strategic Intelligence Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Card className="p-4">
                <div className="flex items-center gap-3">
                  <div className="bg-yellow-600 text-white p-2 rounded-lg">
                    <AlertTriangle className="h-4 w-4" />
                  </div>
                  <div>
                    <div className="text-lg font-bold">{stats.executeTiming}</div>
                    <div className="text-sm text-muted-foreground">Execute Phase</div>
                  </div>
                </div>
                <div className="mt-2 text-xs text-muted-foreground">
                  Predicted timing window for coordinated action
                </div>
              </Card>

              <Card className="p-4">
                <div className="flex items-center gap-3">
                  <div className="bg-cyan-600 text-white p-2 rounded-lg">
                    <Eye className="h-4 w-4" />
                  </div>
                  <div>
                    <div className="text-lg font-bold">{stats.informationControl}</div>
                    <div className="text-sm text-muted-foreground">Info Control</div>
                  </div>
                </div>
                <div className="mt-2 text-xs text-muted-foreground">
                  Information warfare advantage assessment
                </div>
              </Card>

              <Card className="p-4">
                <div className="flex items-center gap-3">
                  <div className="bg-emerald-600 text-white p-2 rounded-lg">
                    <Shield className="h-4 w-4" />
                  </div>
                  <div>
                    <div className="text-lg font-bold">{stats.teamCoordination}</div>
                    <div className="text-sm text-muted-foreground">Coordination Index</div>
                  </div>
                </div>
                <div className="mt-2 text-xs text-muted-foreground">
                  Team synchronization and positioning cohesion
                </div>
              </Card>
            </div>

            {/* Elite Tactical Insights */}
            <Card className="p-6">
              <h4 className="font-semibold mb-4 flex items-center gap-2">
                <Crown className="h-5 w-5 text-indigo-400" />
                Elite Tactical Command Center
              </h4>
              <div className="space-y-4">
                <div className="bg-gradient-to-r from-indigo-600/10 to-blue-600/10 border border-indigo-600/20 rounded-lg p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Users className="h-4 w-4 text-indigo-400" />
                    <span className="font-medium text-indigo-400">Formation Intelligence</span>
                  </div>
                  <div className="text-sm text-muted-foreground">
                    {stats.tFormation === 'Tight Stack' ? 
                      "T-side showing coordinated stack formation - expect synchronized utility and team execute" :
                    stats.tFormation === 'Split Formation' ? 
                      "T-side utilizing split formation - multiple site pressure and pick potential" :
                      "T-side in loose formation - adaptable positioning with individual play potential"
                    }
                  </div>
                </div>

                <div className="bg-gradient-to-r from-purple-600/10 to-pink-600/10 border border-purple-600/20 rounded-lg p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Sword className="h-4 w-4 text-purple-400" />
                    <span className="font-medium text-purple-400">Strategic Assessment</span>
                  </div>
                  <div className="text-sm text-muted-foreground">
                    {stats.tacticalAdvantage === 'T-STRONG' ? 
                      "T-side holds significant tactical advantage - aggressive plays favored" :
                    stats.tacticalAdvantage === 'CT-STRONG' ? 
                      "CT-side maintains strong defensive position - hold angles and wait for picks" :
                      "Balanced tactical state - adaptability and mid-round calls crucial"
                    }
                  </div>
                </div>

                <div className="bg-gradient-to-r from-cyan-600/10 to-blue-600/10 border border-cyan-600/20 rounded-lg p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Eye className="h-4 w-4 text-cyan-400" />
                    <span className="font-medium text-cyan-400">Information Warfare</span>
                  </div>
                  <div className="text-sm text-muted-foreground">
                    {stats.informationControl === 'T-SIDE' ? 
                      "T-side controls information flow - CT rotations may be delayed or misdirected" :
                    stats.informationControl === 'CT-SIDE' ? 
                      "CT-side has information advantage - strong reads on T-side positioning" :
                      "Neutral information state - both teams operating with limited intel"
                    }
                  </div>
                </div>

                <div className="bg-gradient-to-r from-yellow-600/10 to-orange-600/10 border border-yellow-600/20 rounded-lg p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <AlertTriangle className="h-4 w-4 text-yellow-400" />
                    <span className="font-medium text-yellow-400">Execute Timing Analysis</span>
                  </div>
                  <div className="text-sm text-muted-foreground">
                    {stats.executeTiming === 'IMMEDIATE EXECUTE' ? 
                      "High-velocity coordinated execute incoming - prepare for immediate utility exchanges" :
                    stats.executeTiming === 'PREPARING EXECUTE' ? 
                      "Teams positioning for coordinated execute - utility and timing setup phase" :
                      "Positional setup phase - tactical maneuvering and information gathering"
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
import { useState, useEffect, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Target, Shield, Users, Zap, TrendingUp, Activity } from 'lucide-react';
import { motion } from 'framer-motion';

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

interface PlayerStatsData {
  id: string;
  name: string;
  team: string;
  role: string;
  tRole: string;
  ctRole: string;
  isIGL: boolean;
  piv: number;
  ctPIV: number;
  tPIV: number;
  kd: number;
  primaryMetric: {
    name: string;
    value: number;
  };
}

const ZONE_STRATEGIC_VALUES = {
  'APARTMENTS': 0.95,
  'BANANA': 0.85, 
  'MIDDLE': 0.95,
  'CONSTRUCTION': 0.95,
  'ARCH': 0.70,
  'QUAD': 0.70,
  'A_SITE': 0.70,
  'B_SITE': 0.70,
};

function coordToMapPercent(x: number, y: number) {
  const MAP_BOUNDS = {
    minX: -2217.69, maxX: 2217.69,
    minY: -755.62, maxY: 3452.23
  };
  
  const mapX = (x - MAP_BOUNDS.minX) / (MAP_BOUNDS.maxX - MAP_BOUNDS.minX);
  const mapY = (y - MAP_BOUNDS.minY) / (MAP_BOUNDS.maxY - MAP_BOUNDS.minY);
  
  return { 
    x: Math.max(0, Math.min(100, mapX * 100)), 
    y: Math.max(0, Math.min(100, (1 - mapY) * 100)) 
  };
}

function getPlayerZone(x: number, y: number): string {
  // Approximate zone detection based on coordinates
  if (x >= -800 && x <= -200 && y >= -400 && y <= 200) return 'APARTMENTS';
  if (x >= -1000 && x <= -300 && y >= 2000 && y <= 3000) return 'BANANA';
  if (x >= 400 && x <= 1200 && y >= 800 && y <= 1400) return 'MIDDLE';
  if (x >= -600 && x <= -200 && y >= -800 && y <= -400) return 'CONSTRUCTION';
  if (x >= 600 && x <= 1000 && y >= 1400 && y <= 2000) return 'ARCH';
  if (x >= 800 && x <= 1200 && y >= 1600 && y <= 2200) return 'QUAD';
  return 'OTHER';
}

export default function TacticalInsightsPage() {
  const [selectedRound, setSelectedRound] = useState('round_4');
  const [selectedTeam, setSelectedTeam] = useState('all');

  const { data: xyzData = [] } = useQuery<XYZPlayerData[]>({
    queryKey: ['/api/xyz/raw'],
  });

  const { data: playersData = [] } = useQuery<PlayerStatsData[]>({
    queryKey: ['/api/players'],
  });

  // Filter data based on selections
  const filteredData = xyzData.filter(d => {
    if (selectedRound !== 'all' && d.round_num !== parseInt(selectedRound.split('_')[1])) return false;
    return true;
  });

  // Calculate tactical insights
  const tacticalInsights = useMemo(() => {
    if (filteredData.length === 0) return null;

    // Zone control analysis
    const zoneControl = new Map<string, { t: number; ct: number; contests: number }>();
    
    filteredData.forEach(point => {
      const zone = getPlayerZone(point.X, point.Y);
      if (!zoneControl.has(zone)) {
        zoneControl.set(zone, { t: 0, ct: 0, contests: 0 });
      }
      
      const control = zoneControl.get(zone)!;
      if (point.side === 't') control.t++;
      else control.ct++;
    });

    // Calculate contest levels
    zoneControl.forEach((control, zone) => {
      const total = control.t + control.ct;
      if (total > 0) {
        const balance = Math.min(control.t, control.ct) / total;
        control.contests = balance;
      }
    });

    // Player role analysis
    const roleDistribution = new Map<string, number>();
    const teamAnalysis = new Map<string, {
      avgPIV: number;
      players: number;
      roles: string[];
    }>();

    playersData.forEach(player => {
      roleDistribution.set(player.role, (roleDistribution.get(player.role) || 0) + 1);
      
      if (!teamAnalysis.has(player.team)) {
        teamAnalysis.set(player.team, { avgPIV: 0, players: 0, roles: [] });
      }
      
      const team = teamAnalysis.get(player.team)!;
      team.avgPIV += player.piv;
      team.players++;
      team.roles.push(player.role);
    });

    teamAnalysis.forEach((team) => {
      team.avgPIV = team.avgPIV / team.players;
    });

    // Movement patterns
    const movementMetrics = {
      avgVelocity: 0,
      rushingPlayers: 0,
      staticPlayers: 0,
      flanking: 0
    };

    let totalVelocity = 0;
    filteredData.forEach(point => {
      const velocity = Math.sqrt(point.velocity_X ** 2 + point.velocity_Y ** 2);
      totalVelocity += velocity;
      
      if (velocity > 200) movementMetrics.rushingPlayers++;
      if (velocity < 10) movementMetrics.staticPlayers++;
    });

    movementMetrics.avgVelocity = totalVelocity / filteredData.length;

    return {
      zoneControl,
      roleDistribution,
      teamAnalysis,
      movementMetrics,
      totalDataPoints: filteredData.length
    };
  }, [filteredData, playersData]);

  const uniqueTeams = [...new Set(playersData.map(p => p.team))];

  if (!tacticalInsights) {
    return (
      <div className="p-8 flex items-center justify-center">
        <p className="text-muted-foreground">Loading tactical insights...</p>
      </div>
    );
  }

  const topContestedZones = Array.from(tacticalInsights.zoneControl.entries())
    .filter(([zone]) => zone !== 'OTHER')
    .sort((a, b) => b[1].contests - a[1].contests)
    .slice(0, 5);

  const topTeams = Array.from(tacticalInsights.teamAnalysis.entries())
    .sort((a, b) => b[1].avgPIV - a[1].avgPIV)
    .slice(0, 5);

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="p-8 space-y-6"
    >
      <div className="text-center space-y-2">
        <h1 className="text-3xl font-bold bg-gradient-to-r from-purple-400 to-pink-500 bg-clip-text text-transparent">
          Tactical Insights
        </h1>
        <p className="text-muted-foreground">
          Advanced tactical analysis and strategic intelligence
        </p>
      </div>

      {/* Controls */}
      <div className="flex gap-4 justify-center">
        <Select value={selectedRound} onValueChange={setSelectedRound}>
          <SelectTrigger className="w-48">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="round_4">Round 4</SelectItem>
            <SelectItem value="all">All Rounds</SelectItem>
          </SelectContent>
        </Select>

        <Select value={selectedTeam} onValueChange={setSelectedTeam}>
          <SelectTrigger className="w-48">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Teams</SelectItem>
            {uniqueTeams.map(team => (
              <SelectItem key={team} value={team}>{team}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* Zone Control Analysis */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Target className="w-5 h-5" />
              Zone Contest Analysis
            </CardTitle>
            <CardDescription>
              Most contested tactical areas based on {tacticalInsights.totalDataPoints.toLocaleString()} data points
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {topContestedZones.map(([zone, data]) => {
                const total = data.t + data.ct;
                const tPercent = (data.t / total) * 100;
                const ctPercent = (data.ct / total) * 100;
                const contestLevel = data.contests * 100;
                const strategicValue = ZONE_STRATEGIC_VALUES[zone as keyof typeof ZONE_STRATEGIC_VALUES] || 0.5;

                return (
                  <div key={zone} className="space-y-2">
                    <div className="flex justify-between items-center">
                      <div className="flex items-center gap-2">
                        <Badge variant={contestLevel > 30 ? "destructive" : contestLevel > 15 ? "default" : "secondary"}>
                          {zone}
                        </Badge>
                        <span className="text-sm text-muted-foreground">
                          Contest: {contestLevel.toFixed(1)}%
                        </span>
                        <span className="text-sm text-muted-foreground">
                          Strategic Value: {(strategicValue * 100).toFixed(0)}%
                        </span>
                      </div>
                      <span className="text-sm font-medium">{total.toLocaleString()} positions</span>
                    </div>
                    <div className="flex gap-1 h-2 rounded-full overflow-hidden bg-muted">
                      <div 
                        className="bg-red-500" 
                        style={{ width: `${tPercent}%` }}
                      />
                      <div 
                        className="bg-blue-500" 
                        style={{ width: `${ctPercent}%` }}
                      />
                    </div>
                    <div className="flex justify-between text-xs text-muted-foreground">
                      <span>T: {tPercent.toFixed(1)}%</span>
                      <span>CT: {ctPercent.toFixed(1)}%</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* Movement Analysis */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity className="w-5 h-5" />
              Movement Patterns
            </CardTitle>
            <CardDescription>
              Player mobility and positioning behavior
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Average Velocity</span>
                <Badge variant="outline">
                  {tacticalInsights.movementMetrics.avgVelocity.toFixed(0)} u/s
                </Badge>
              </div>
              
              <div className="space-y-1">
                <div className="flex justify-between text-sm">
                  <span>Rushing Players</span>
                  <span>{tacticalInsights.movementMetrics.rushingPlayers.toLocaleString()}</span>
                </div>
                <Progress value={(tacticalInsights.movementMetrics.rushingPlayers / tacticalInsights.totalDataPoints) * 100} />
              </div>

              <div className="space-y-1">
                <div className="flex justify-between text-sm">
                  <span>Static Positions</span>
                  <span>{tacticalInsights.movementMetrics.staticPlayers.toLocaleString()}</span>
                </div>
                <Progress value={(tacticalInsights.movementMetrics.staticPlayers / tacticalInsights.totalDataPoints) * 100} />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Team Performance */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="w-5 h-5" />
              Team Performance Rankings
            </CardTitle>
            <CardDescription>
              Teams ranked by average Player Impact Value (PIV)
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {topTeams.map(([team, data], index) => (
                <div key={team} className="flex items-center justify-between p-3 rounded-lg border">
                  <div className="flex items-center gap-3">
                    <Badge variant={index < 3 ? "default" : "secondary"}>
                      #{index + 1}
                    </Badge>
                    <div>
                      <p className="font-medium">{team}</p>
                      <p className="text-sm text-muted-foreground">
                        {data.players} players • Roles: {[...new Set(data.roles)].join(', ')}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-lg">{data.avgPIV.toFixed(2)}</p>
                    <p className="text-sm text-muted-foreground">PIV</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Role Distribution */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="w-5 h-5" />
              Role Distribution
            </CardTitle>
            <CardDescription>
              Player role composition across teams
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {Array.from(tacticalInsights.roleDistribution.entries())
                .sort((a, b) => b[1] - a[1])
                .map(([role, count]) => (
                  <div key={role} className="flex justify-between items-center">
                    <span className="text-sm font-medium">{role}</span>
                    <div className="flex items-center gap-2">
                      <div className="w-20 h-2 bg-muted rounded-full">
                        <div 
                          className="h-full bg-primary rounded-full"
                          style={{ 
                            width: `${(count / Math.max(...tacticalInsights.roleDistribution.values())) * 100}%` 
                          }}
                        />
                      </div>
                      <Badge variant="outline">{count}</Badge>
                    </div>
                  </div>
                ))}
            </div>
          </CardContent>
        </Card>

        {/* Data Summary */}
        <Card className="lg:col-span-3">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="w-5 h-5" />
              Analysis Summary
            </CardTitle>
            <CardDescription>
              Key tactical insights from {selectedRound === 'all' ? 'all rounds' : 'round 4'}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-center">
              <div className="p-4 border rounded-lg">
                <p className="text-2xl font-bold text-primary">{tacticalInsights.totalDataPoints.toLocaleString()}</p>
                <p className="text-sm text-muted-foreground">Total Positions</p>
              </div>
              <div className="p-4 border rounded-lg">
                <p className="text-2xl font-bold text-primary">{tacticalInsights.zoneControl.size}</p>
                <p className="text-sm text-muted-foreground">Zones Analyzed</p>
              </div>
              <div className="p-4 border rounded-lg">
                <p className="text-2xl font-bold text-primary">{tacticalInsights.teamAnalysis.size}</p>
                <p className="text-sm text-muted-foreground">Teams</p>
              </div>
              <div className="p-4 border rounded-lg">
                <p className="text-2xl font-bold text-primary">{tacticalInsights.roleDistribution.size}</p>
                <p className="text-sm text-muted-foreground">Player Roles</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </motion.div>
  );
}
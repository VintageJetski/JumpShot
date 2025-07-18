import { useState, useMemo, useEffect, useRef } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Shield, Zap, Activity, Users } from 'lucide-react';

// Import map assets
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

interface PlayerData {
  id: string;
  name: string;
  team: string;
  role: string;
  piv: number;
}

// Accurate CS2 de_inferno map coordinate mapping
const INFERNO_MAP_CONFIG = {
  bounds: { 
    minX: -1675.62, maxX: 2644.97,
    minY: -755.62, maxY: 3452.23
  }
};

function coordToMapPercent(x: number, y: number) {
  const mapX = (x - INFERNO_MAP_CONFIG.bounds.minX) / (INFERNO_MAP_CONFIG.bounds.maxX - INFERNO_MAP_CONFIG.bounds.minX);
  const mapY = (y - INFERNO_MAP_CONFIG.bounds.minY) / (INFERNO_MAP_CONFIG.bounds.maxY - INFERNO_MAP_CONFIG.bounds.minY);
  
  return { 
    x: Math.max(0, Math.min(100, mapX * 100)), 
    y: Math.max(0, Math.min(100, (1 - mapY) * 100)) 
  };
}

export default function TacticalInsightsPage() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  
  // Data fetching
  const { data: xyzData = [] } = useQuery<XYZPlayerData[]>({
    queryKey: ['/api/xyz/raw'],
  });

  const { data: playersData = [] } = useQuery<PlayerData[]>({
    queryKey: ['/api/players'],
  });

  // State for filtering and controls
  const [selectedRound, setSelectedRound] = useState('round_4');
  const [selectedTeam, setSelectedTeam] = useState('all');
  const [currentTick, setCurrentTick] = useState(0);
  const [insightType, setInsightType] = useState('positioning');

  // Filtered data based on current selections
  const filteredData = useMemo(() => {
    let data = xyzData;
    
    // Round filter
    if (selectedRound !== 'all') {
      const roundNum = parseInt(selectedRound.split('_')[1]);
      data = data.filter(d => d.round_num === roundNum);
    }
    
    // Team filter
    if (selectedTeam !== 'all') {
      data = data.filter(d => d.side === selectedTeam);
    }
    
    return data;
  }, [xyzData, selectedRound, selectedTeam]);

  // Get unique ticks for timeline
  const uniqueTicks = useMemo(() => {
    const ticks = [...new Set(filteredData.map(d => d.tick))].sort((a, b) => a - b);
    return ticks;
  }, [filteredData]);

  // Current tick data
  const currentTickData = useMemo(() => {
    if (uniqueTicks.length === 0) return [];
    const targetTick = uniqueTicks[currentTick] || uniqueTicks[0];
    return filteredData.filter(d => d.tick === targetTick);
  }, [filteredData, currentTick, uniqueTicks]);

  // Tactical insights calculations
  const tacticalInsights = useMemo(() => {
    const insights = {
      teamPositioning: new Map<string, number>(),
      playerPerformance: new Map<string, {health: number, piv: number}>(),
      tacticalFlow: [],
      keyMoments: []
    };

    // Team positioning analysis
    const teamPositions = filteredData.reduce((acc, point) => {
      const key = `${point.side}_${Math.floor(point.tick / 1000)}`;
      if (!acc[key]) acc[key] = [];
      acc[key].push({ x: point.X, y: point.Y });
      return acc;
    }, {} as Record<string, Array<{x: number, y: number}>>);

    // Calculate team spread for each time segment
    Object.entries(teamPositions).forEach(([key, positions]) => {
      const [side, timeSegment] = key.split('_');
      const avgX = positions.reduce((sum, p) => sum + p.x, 0) / positions.length;
      const avgY = positions.reduce((sum, p) => sum + p.y, 0) / positions.length;
      const spread = Math.sqrt(positions.reduce((sum, p) => 
        sum + Math.pow(p.x - avgX, 2) + Math.pow(p.y - avgY, 2), 0) / positions.length);
      
      insights.teamPositioning.set(key, spread);
    });

    // Player performance analysis
    filteredData.forEach(point => {
      const playerData = playersData.find(p => p.name === point.name);
      if (playerData) {
        insights.playerPerformance.set(point.name, {
          health: point.health,
          piv: playerData.piv
        });
      }
    });

    return insights;
  }, [filteredData, playersData]);

  // Canvas rendering
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Draw background
    const img = new Image();
    img.onload = () => {
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      
      // Draw tactical insights based on selected type
      if (insightType === 'positioning') {
        // Draw team positioning analysis
        currentTickData.forEach(point => {
          const pos = coordToMapPercent(point.X, point.Y);
          const x = (pos.x / 100) * canvas.width;
          const y = (pos.y / 100) * canvas.height;

          // Player dot with tactical importance
          const playerData = playersData.find(p => p.name === point.name);
          const importance = playerData ? playerData.piv : 0.1;
          const radius = 4 + (importance * 8);

          ctx.beginPath();
          ctx.arc(x, y, radius, 0, 2 * Math.PI);
          ctx.fillStyle = point.side === 't' ? '#dc2626' : '#2563eb';
          ctx.globalAlpha = 0.7 + (importance * 0.3);
          ctx.fill();
          ctx.globalAlpha = 1;
          ctx.strokeStyle = 'white';
          ctx.lineWidth = 2;
          ctx.stroke();

          // PIV indicator
          if (playerData && playerData.piv > 0.15) {
            ctx.fillStyle = '#fbbf24';
            ctx.font = 'bold 12px Arial';
            ctx.textAlign = 'center';
            ctx.fillText('★', x, y - radius - 5);
          }
        });
      } else if (insightType === 'movement') {
        // Draw movement patterns
        const playerPaths = new Map<string, Array<{x: number, y: number}>>();
        
        filteredData.forEach(point => {
          if (!playerPaths.has(point.name)) {
            playerPaths.set(point.name, []);
          }
          const pos = coordToMapPercent(point.X, point.Y);
          playerPaths.get(point.name)!.push({
            x: (pos.x / 100) * canvas.width,
            y: (pos.y / 100) * canvas.height
          });
        });

        // Draw paths
        playerPaths.forEach((path, playerName) => {
          if (path.length < 2) return;
          
          const point = currentTickData.find(p => p.name === playerName);
          if (!point) return;

          ctx.strokeStyle = point.side === 't' ? '#dc2626' : '#2563eb';
          ctx.lineWidth = 2;
          ctx.globalAlpha = 0.6;
          ctx.beginPath();
          ctx.moveTo(path[0].x, path[0].y);
          for (let i = 1; i < path.length; i++) {
            ctx.lineTo(path[i].x, path[i].y);
          }
          ctx.stroke();
          ctx.globalAlpha = 1;
        });
      }
    };
    img.src = infernoRadarPath;
  }, [currentTickData, playersData, insightType, filteredData]);

  // Get top performers
  const topPerformers = useMemo(() => {
    return Array.from(tacticalInsights.playerPerformance.entries())
      .sort((a, b) => b[1].piv - a[1].piv)
      .slice(0, 5);
  }, [tacticalInsights]);

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="text-center space-y-2">
        <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent">
          Tactical Insights
        </h1>
        <p className="text-muted-foreground">
          Advanced tactical analysis using authentic PIV data and positional intelligence
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Controls Panel */}
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Analysis Controls</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="text-sm font-medium mb-2 block">Round</label>
                <Select value={selectedRound} onValueChange={setSelectedRound}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="round_4">Round 4</SelectItem>
                    <SelectItem value="all">All Rounds</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="text-sm font-medium mb-2 block">Team</label>
                <Select value={selectedTeam} onValueChange={setSelectedTeam}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Both Teams</SelectItem>
                    <SelectItem value="t">Terrorist</SelectItem>
                    <SelectItem value="ct">Counter-Terrorist</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="text-sm font-medium mb-2 block">Insight Type</label>
                <Select value={insightType} onValueChange={setInsightType}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="positioning">Tactical Positioning</SelectItem>
                    <SelectItem value="movement">Movement Patterns</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="text-sm font-medium mb-2 block">Timeline</label>
                <Slider
                  value={[currentTick]}
                  onValueChange={([value]) => setCurrentTick(value)}
                  min={0}
                  max={Math.max(0, uniqueTicks.length - 1)}
                  step={1}
                  className="w-full"
                />
                <div className="text-xs text-muted-foreground mt-1">
                  Tick: {uniqueTicks[currentTick] || 0}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Top Performers */}
          <Card>
            <CardHeader>
              <CardTitle>Top Performers</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {topPerformers.map(([playerName, stats], index) => (
                  <div key={playerName} className="space-y-1">
                    <div className="flex justify-between text-sm">
                      <span className="font-medium">#{index + 1} {playerName}</span>
                      <Badge variant="secondary">
                        PIV: {(stats.piv * 100).toFixed(1)}
                      </Badge>
                    </div>
                    <Progress value={stats.piv * 100} className="h-2" />
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Tactical Metrics */}
          <Card>
            <CardHeader>
              <CardTitle>Tactical Metrics</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex justify-between text-sm">
                  <span>Active Players:</span>
                  <Badge variant="secondary">{currentTickData.length}</Badge>
                </div>
                <div className="flex justify-between text-sm">
                  <span>High PIV Players:</span>
                  <Badge variant="default">
                    {currentTickData.filter(p => {
                      const playerData = playersData.find(pd => pd.name === p.name);
                      return playerData && playerData.piv > 0.15;
                    }).length}
                  </Badge>
                </div>
                <div className="flex justify-between text-sm">
                  <span>Avg Health:</span>
                  <Badge variant="outline">
                    {currentTickData.length > 0 ? 
                      Math.round(currentTickData.reduce((sum, p) => sum + p.health, 0) / currentTickData.length) : 0}%
                  </Badge>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main Canvas */}
        <div className="lg:col-span-3">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="w-5 h-5" />
                Tactical Analysis Map
              </CardTitle>
              <CardDescription>
                {insightType === 'positioning' ? 
                  'PIV-weighted player positions with tactical importance indicators' :
                  'Movement patterns and flow analysis of player positioning'
                }
              </CardDescription>
            </CardHeader>
            <CardContent>
              <canvas
                ref={canvasRef}
                width={800}
                height={600}
                className="w-full border rounded-lg bg-gray-900"
                style={{ maxWidth: '100%', height: 'auto' }}
              />
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
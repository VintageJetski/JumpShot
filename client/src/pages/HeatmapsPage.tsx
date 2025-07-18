import { useState, useMemo, useEffect, useRef } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { Badge } from '@/components/ui/badge';
import { Target, TrendingUp } from 'lucide-react';

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

export default function HeatmapsPage() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  
  // Data fetching
  const { data: xyzData = [] } = useQuery<XYZPlayerData[]>({
    queryKey: ['/api/xyz/raw'],
  });

  // State for filtering and controls
  const [selectedRound, setSelectedRound] = useState('round_4');
  const [selectedPlayer, setSelectedPlayer] = useState('all');
  const [selectedTeam, setSelectedTeam] = useState('all');
  const [heatmapIntensity, setHeatmapIntensity] = useState(50);
  const [currentTick, setCurrentTick] = useState(0);

  // Filtered data based on current selections
  const filteredData = useMemo(() => {
    let data = xyzData;
    
    // Round filter
    if (selectedRound !== 'all') {
      const roundNum = parseInt(selectedRound.split('_')[1]);
      data = data.filter(d => d.round_num === roundNum);
    }
    
    // Player filter
    if (selectedPlayer !== 'all') {
      data = data.filter(d => d.name === selectedPlayer);
    }
    
    // Team filter
    if (selectedTeam !== 'all') {
      data = data.filter(d => d.side === selectedTeam);
    }
    
    return data;
  }, [xyzData, selectedRound, selectedPlayer, selectedTeam]);

  // Get unique ticks for timeline
  const uniqueTicks = useMemo(() => {
    const ticks = [...new Set(filteredData.map(d => d.tick))].sort((a, b) => a - b);
    return ticks;
  }, [filteredData]);

  // Heatmap data processing
  const heatmapData = useMemo(() => {
    const grid = Array(40).fill(null).map(() => Array(30).fill(0));
    const maxIntensity = heatmapIntensity / 10;
    
    filteredData.forEach(point => {
      const pos = coordToMapPercent(point.X, point.Y);
      const gridX = Math.floor((pos.x / 100) * 40);
      const gridY = Math.floor((pos.y / 100) * 30);
      
      if (gridX >= 0 && gridX < 40 && gridY >= 0 && gridY < 30) {
        grid[gridY][gridX] += 1;
      }
    });
    
    // Normalize grid values
    const maxValue = Math.max(...grid.flat());
    if (maxValue > 0) {
      for (let y = 0; y < 30; y++) {
        for (let x = 0; x < 40; x++) {
          grid[y][x] = (grid[y][x] / maxValue) * maxIntensity;
        }
      }
    }
    
    return grid;
  }, [filteredData, heatmapIntensity]);

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
      
      // Draw heatmap
      const cellWidth = canvas.width / 40;
      const cellHeight = canvas.height / 30;
      
      for (let y = 0; y < 30; y++) {
        for (let x = 0; x < 40; x++) {
          const intensity = heatmapData[y][x];
          if (intensity > 0) {
            const alpha = Math.min(intensity, 1);
            ctx.fillStyle = `rgba(255, 0, 0, ${alpha * 0.7})`;
            ctx.fillRect(x * cellWidth, y * cellHeight, cellWidth, cellHeight);
          }
        }
      }
    };
    img.src = infernoRadarPath;
  }, [heatmapData]);

  // Get unique players for dropdown
  const uniquePlayers = useMemo(() => {
    return [...new Set(xyzData.map(d => d.name))].sort();
  }, [xyzData]);

  // Calculate statistics
  const statistics = useMemo(() => {
    const totalPositions = filteredData.length;
    const uniquePositions = new Set(filteredData.map(d => `${d.X},${d.Y}`)).size;
    const averageHealth = filteredData.length > 0 ? 
      filteredData.reduce((sum, d) => sum + d.health, 0) / filteredData.length : 0;
    
    return {
      totalPositions,
      uniquePositions,
      averageHealth: Math.round(averageHealth)
    };
  }, [filteredData]);

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="text-center space-y-2">
        <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent">
          Position Heatmaps
        </h1>
        <p className="text-muted-foreground">
          Density analysis of player positions using authentic Round 4 data
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Controls Panel */}
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Heatmap Controls</CardTitle>
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
                <label className="text-sm font-medium mb-2 block">Player</label>
                <Select value={selectedPlayer} onValueChange={setSelectedPlayer}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Players</SelectItem>
                    {uniquePlayers.map(player => (
                      <SelectItem key={player} value={player}>{player}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="text-sm font-medium mb-2 block">Intensity: {heatmapIntensity}%</label>
                <Slider
                  value={[heatmapIntensity]}
                  onValueChange={([value]) => setHeatmapIntensity(value)}
                  min={10}
                  max={100}
                  step={10}
                  className="w-full"
                />
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

          {/* Statistics */}
          <Card>
            <CardHeader>
              <CardTitle>Statistics</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex justify-between text-sm">
                  <span>Total Positions:</span>
                  <Badge variant="secondary">{statistics.totalPositions}</Badge>
                </div>
                <div className="flex justify-between text-sm">
                  <span>Unique Positions:</span>
                  <Badge variant="outline">{statistics.uniquePositions}</Badge>
                </div>
                <div className="flex justify-between text-sm">
                  <span>Avg Health:</span>
                  <Badge variant={statistics.averageHealth > 75 ? "default" : "destructive"}>
                    {statistics.averageHealth}%
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
                <Target className="w-5 h-5" />
                Position Heatmap
              </CardTitle>
              <CardDescription>
                Red intensity shows player position density over time
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
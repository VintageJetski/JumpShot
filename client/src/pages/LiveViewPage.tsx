import { useState, useMemo, useEffect, useRef, useCallback } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { Badge } from '@/components/ui/badge';
import { MapPin, Activity, Play, Pause, RotateCcw, Eye } from 'lucide-react';

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

export default function LiveViewPage() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  
  // Data fetching
  const { data: xyzData = [] } = useQuery<XYZPlayerData[]>({
    queryKey: ['/api/xyz/raw'],
  });

  // State for filtering and controls
  const [selectedRound, setSelectedRound] = useState('round_4');
  const [selectedPlayer, setSelectedPlayer] = useState('all');
  const [currentTick, setCurrentTick] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [playbackSpeed, setPlaybackSpeed] = useState(1);

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
    
    return data;
  }, [xyzData, selectedRound, selectedPlayer]);

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
      
      // Draw player positions
      currentTickData.forEach(point => {
        const pos = coordToMapPercent(point.X, point.Y);
        const x = (pos.x / 100) * canvas.width;
        const y = (pos.y / 100) * canvas.height;

        // Player dot
        ctx.beginPath();
        ctx.arc(x, y, 6, 0, 2 * Math.PI);
        ctx.fillStyle = point.side === 't' ? '#dc2626' : '#2563eb';
        ctx.fill();
        ctx.strokeStyle = 'white';
        ctx.lineWidth = 2;
        ctx.stroke();

        // Health indicator
        if (point.health < 100) {
          ctx.fillStyle = point.health > 50 ? '#22c55e' : point.health > 25 ? '#eab308' : '#dc2626';
          ctx.fillRect(x - 8, y - 15, 16 * (point.health / 100), 3);
        }

        // Player name
        ctx.fillStyle = 'white';
        ctx.font = '10px Arial';
        ctx.textAlign = 'center';
        ctx.strokeStyle = 'black';
        ctx.lineWidth = 3;
        ctx.strokeText(point.name, x, y + 20);
        ctx.fillText(point.name, x, y + 20);
      });
    };
    img.src = infernoRadarPath;
  }, [currentTickData]);

  // Auto-play functionality
  useEffect(() => {
    if (!isPlaying) return;
    
    const interval = setInterval(() => {
      setCurrentTick(prev => {
        if (prev >= uniqueTicks.length - 1) {
          setIsPlaying(false);
          return prev;
        }
        return prev + 1;
      });
    }, 1000 / playbackSpeed);

    return () => clearInterval(interval);
  }, [isPlaying, playbackSpeed, uniqueTicks.length]);

  // Get unique players for dropdown
  const uniquePlayers = useMemo(() => {
    return [...new Set(xyzData.map(d => d.name))].sort();
  }, [xyzData]);

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="text-center space-y-2">
        <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent">
          Live View Analysis
        </h1>
        <p className="text-muted-foreground">
          Real-time playback of authentic Round 4 position data with timeline controls
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Controls Panel */}
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Playback Controls</CardTitle>
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

              <div className="flex gap-2">
                <Button 
                  variant={isPlaying ? "destructive" : "default"}
                  size="sm"
                  onClick={() => setIsPlaying(!isPlaying)}
                  disabled={uniqueTicks.length === 0}
                >
                  {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                </Button>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => setCurrentTick(0)}
                  disabled={uniqueTicks.length === 0}
                >
                  <RotateCcw className="w-4 h-4" />
                </Button>
              </div>

              <div>
                <label className="text-sm font-medium mb-2 block">Speed: {playbackSpeed}x</label>
                <Slider
                  value={[playbackSpeed]}
                  onValueChange={([value]) => setPlaybackSpeed(value)}
                  min={0.5}
                  max={3}
                  step={0.5}
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
                  Tick: {uniqueTicks[currentTick] || 0} ({currentTick + 1}/{uniqueTicks.length})
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Current Status */}
          <Card>
            <CardHeader>
              <CardTitle>Current Status</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Players visible:</span>
                  <Badge variant="secondary">{currentTickData.length}</Badge>
                </div>
                <div className="flex justify-between text-sm">
                  <span>T-side:</span>
                  <Badge variant="destructive">{currentTickData.filter(p => p.side === 't').length}</Badge>
                </div>
                <div className="flex justify-between text-sm">
                  <span>CT-side:</span>
                  <Badge variant="default">{currentTickData.filter(p => p.side === 'ct').length}</Badge>
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
                <Eye className="w-5 h-5" />
                Live View Map
              </CardTitle>
              <CardDescription>
                Real-time playback of player positions with health indicators
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
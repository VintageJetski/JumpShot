import { useState, useEffect, useRef } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Slider } from '@/components/ui/slider';
import { Switch } from '@/components/ui/switch';
import { TrendingUp, MapPin } from 'lucide-react';
import { motion } from 'framer-motion';
import infernoMapPath from '@assets/CS2_inferno_radar_1749672397531.webp';

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

export default function HeatmapsPage() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [selectedRound, setSelectedRound] = useState('round_4');
  const [selectedPlayer, setSelectedPlayer] = useState('all');
  const [selectedSide, setSelectedSide] = useState('all');
  const [heatIntensity, setHeatIntensity] = useState([20]);
  const [showDeaths, setShowDeaths] = useState(false);
  const [mapImage, setMapImage] = useState<HTMLImageElement | null>(null);

  const { data: xyzData = [] } = useQuery<XYZPlayerData[]>({
    queryKey: ['/api/xyz/raw'],
  });

  // Filter data based on selections
  const filteredData = xyzData.filter(d => {
    if (selectedRound !== 'all' && d.round_num !== parseInt(selectedRound.split('_')[1])) return false;
    if (selectedPlayer !== 'all' && d.name !== selectedPlayer) return false;
    if (selectedSide !== 'all' && d.side !== selectedSide) return false;
    if (!showDeaths && d.health <= 0) return false;
    return true;
  });

  // Get unique players for selection
  const uniquePlayers = [...new Set(xyzData.map(d => d.name))].sort();

  // Load map image
  useEffect(() => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => setMapImage(img);
    img.src = infernoMapPath;
  }, []);

  // Generate heatmap
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !mapImage || filteredData.length === 0) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Clear and draw background
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(mapImage, 0, 0, canvas.width, canvas.height);

    // Create heatmap grid
    const gridSize = 20;
    const heatGrid = Array(Math.ceil(canvas.height / gridSize))
      .fill(null)
      .map(() => Array(Math.ceil(canvas.width / gridSize)).fill(0));

    // Fill heatmap grid with position data
    filteredData.forEach(point => {
      const pos = coordToMapPercent(point.X, point.Y);
      const x = Math.floor((pos.x / 100) * canvas.width / gridSize);
      const y = Math.floor((pos.y / 100) * canvas.height / gridSize);
      
      if (x >= 0 && x < heatGrid[0].length && y >= 0 && y < heatGrid.length) {
        heatGrid[y][x]++;
      }
    });

    // Find max value for normalization
    const maxValue = Math.max(...heatGrid.flat());
    
    if (maxValue === 0) return;

    // Draw heatmap
    const intensityMultiplier = heatIntensity[0] / 10;
    
    for (let y = 0; y < heatGrid.length; y++) {
      for (let x = 0; x < heatGrid[y].length; x++) {
        const value = heatGrid[y][x];
        if (value > 0) {
          const normalizedValue = (value / maxValue) * intensityMultiplier;
          const alpha = Math.min(0.8, normalizedValue);
          
          // Color gradient from blue (cold) to red (hot)
          let r, g, b;
          if (normalizedValue < 0.5) {
            r = 0;
            g = Math.floor(255 * normalizedValue * 2);
            b = 255;
          } else {
            r = Math.floor(255 * (normalizedValue - 0.5) * 2);
            g = Math.floor(255 * (1 - normalizedValue));
            b = 0;
          }

          ctx.fillStyle = `rgba(${r}, ${g}, ${b}, ${alpha})`;
          ctx.fillRect(x * gridSize, y * gridSize, gridSize, gridSize);
        }
      }
    }

    // Draw data points as small dots
    filteredData.forEach(point => {
      const pos = coordToMapPercent(point.X, point.Y);
      const x = (pos.x / 100) * canvas.width;
      const y = (pos.y / 100) * canvas.height;

      ctx.beginPath();
      ctx.arc(x, y, 1, 0, 2 * Math.PI);
      ctx.fillStyle = point.side === 't' ? 'rgba(220, 38, 38, 0.6)' : 'rgba(37, 99, 235, 0.6)';
      ctx.fill();
    });

  }, [mapImage, filteredData, heatIntensity, showDeaths]);

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="p-8 space-y-6"
    >
      <div className="text-center space-y-2">
        <h1 className="text-3xl font-bold bg-gradient-to-r from-orange-400 to-red-500 bg-clip-text text-transparent">
          Position Heatmaps
        </h1>
        <p className="text-muted-foreground">
          Analyze player positioning patterns and area control
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Controls Panel */}
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="w-5 h-5" />
                Heatmap Controls
              </CardTitle>
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

              <div>
                <label className="text-sm font-medium mb-2 block">Side</label>
                <Select value={selectedSide} onValueChange={setSelectedSide}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Both Teams</SelectItem>
                    <SelectItem value="t">Terrorists</SelectItem>
                    <SelectItem value="ct">Counter-Terrorists</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="text-sm font-medium mb-2 block">
                  Heat Intensity: {heatIntensity[0]}
                </label>
                <Slider
                  value={heatIntensity}
                  onValueChange={setHeatIntensity}
                  min={1}
                  max={50}
                  step={1}
                  className="w-full"
                />
              </div>

              <div className="flex items-center space-x-2">
                <Switch
                  id="show-deaths"
                  checked={showDeaths}
                  onCheckedChange={setShowDeaths}
                />
                <label htmlFor="show-deaths" className="text-sm font-medium">
                  Include Death Positions
                </label>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Statistics</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span>Data Points:</span>
                  <Badge variant="outline">{filteredData.length.toLocaleString()}</Badge>
                </div>
                <div className="flex justify-between">
                  <span>Players:</span>
                  <Badge variant="outline">{new Set(filteredData.map(d => d.name)).size}</Badge>
                </div>
                <div className="flex justify-between">
                  <span>T Positions:</span>
                  <Badge variant="outline" className="text-red-600">
                    {filteredData.filter(d => d.side === 't').length.toLocaleString()}
                  </Badge>
                </div>
                <div className="flex justify-between">
                  <span>CT Positions:</span>
                  <Badge variant="outline" className="text-blue-600">
                    {filteredData.filter(d => d.side === 'ct').length.toLocaleString()}
                  </Badge>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Heatmap Canvas */}
        <div className="lg:col-span-3">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MapPin className="w-5 h-5" />
                Position Heatmap - {selectedPlayer === 'all' ? 'All Players' : selectedPlayer}
              </CardTitle>
              <CardDescription>
                {selectedSide === 'all' ? 'Both teams' : selectedSide.toUpperCase()} • {selectedRound === 'all' ? 'All rounds' : 'Round 4'}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="relative border rounded-lg overflow-hidden bg-gray-900">
                <canvas
                  ref={canvasRef}
                  width={800}
                  height={600}
                  className="w-full h-auto"
                />
                {filteredData.length === 0 && (
                  <div className="absolute inset-0 flex items-center justify-center bg-black/50">
                    <p className="text-white text-lg">No data matches current filters</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </motion.div>
  );
}
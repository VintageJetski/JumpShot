import { useState, useEffect, useRef } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { motion } from 'framer-motion';

interface XYZPlayerData {
  tick: number;
  round: number;
  name: string;
  steamId: string;
  side: 't' | 'ct';
  X: number;
  Y: number;
  health: number;
  armor: number;
  flash_duration: number;
  velocity_X: number;
  velocity_Y: number;
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

export default function HeatmapPage() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [selectedPlayer, setSelectedPlayer] = useState('all');
  const [selectedRound, setSelectedRound] = useState('round_4');

  const { data: xyzData = [] } = useQuery<XYZPlayerData[]>({
    queryKey: ['/api/xyz/raw'],
  });

  const filteredData = xyzData.filter(d => {
    const roundMatch = d.round === parseInt(selectedRound.split('_')[1]);
    const playerMatch = selectedPlayer === 'all' || d.name === selectedPlayer;
    return roundMatch && playerMatch;
  });

  const uniquePlayers = [...new Set(xyzData.map(d => d.name))].sort();

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Draw background
    ctx.fillStyle = '#1a1a1a';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    if (selectedPlayer === 'all') {
      // Create heatmap for all players
      const heatmapData = new Map<string, number>();
      const gridSize = 20;
      
      filteredData.forEach(point => {
        const pos = coordToMapPercent(point.X, point.Y);
        const gridX = Math.floor((pos.x / 100) * (canvas.width / gridSize));
        const gridY = Math.floor((pos.y / 100) * (canvas.height / gridSize));
        const key = `${gridX},${gridY}`;
        heatmapData.set(key, (heatmapData.get(key) || 0) + 1);
      });

      // Find max intensity for normalization
      const maxIntensity = Math.max(...Array.from(heatmapData.values()));

      // Draw heatmap
      heatmapData.forEach((intensity, key) => {
        const [gridX, gridY] = key.split(',').map(Number);
        const normalizedIntensity = intensity / maxIntensity;
        
        // Create heat gradient
        const alpha = Math.min(normalizedIntensity * 0.8, 0.8);
        const hue = (1 - normalizedIntensity) * 240; // Blue to red
        
        ctx.fillStyle = `hsla(${hue}, 70%, 50%, ${alpha})`;
        ctx.fillRect(gridX * gridSize, gridY * gridSize, gridSize, gridSize);
      });
    } else {
      // Draw player trail
      const playerPositions = filteredData
        .filter(d => d.name === selectedPlayer)
        .sort((a, b) => a.tick - b.tick);

      if (playerPositions.length > 1) {
        const playerSide = playerPositions[0].side;
        const trailColor = playerSide === 't' ? '#dc2626' : '#22c55e';
        
        // Draw trail with glow effect
        for (let glowLevel = 0; glowLevel < 3; glowLevel++) {
          ctx.strokeStyle = `${trailColor}${Math.round(255 * (0.2 - glowLevel * 0.06)).toString(16).padStart(2, '0')}`;
          ctx.lineWidth = 14 - glowLevel * 3;
          ctx.lineCap = 'round';
          ctx.lineJoin = 'round';
          
          ctx.beginPath();
          playerPositions.forEach((pos, index) => {
            const mapPos = coordToMapPercent(pos.X, pos.Y);
            const x = (mapPos.x / 100) * canvas.width;
            const y = (mapPos.y / 100) * canvas.height;
            
            if (index === 0) {
              ctx.moveTo(x, y);
            } else {
              ctx.lineTo(x, y);
            }
          });
          ctx.stroke();
        }

        // Draw start and end points
        const startPos = coordToMapPercent(playerPositions[0].X, playerPositions[0].Y);
        const endPos = coordToMapPercent(playerPositions[playerPositions.length - 1].X, playerPositions[playerPositions.length - 1].Y);
        
        // Start point (green)
        ctx.beginPath();
        ctx.arc((startPos.x / 100) * canvas.width, (startPos.y / 100) * canvas.height, 8, 0, 2 * Math.PI);
        ctx.fillStyle = '#22c55e';
        ctx.fill();
        ctx.strokeStyle = 'white';
        ctx.lineWidth = 2;
        ctx.stroke();
        
        // End point (red)
        ctx.beginPath();
        ctx.arc((endPos.x / 100) * canvas.width, (endPos.y / 100) * canvas.height, 8, 0, 2 * Math.PI);
        ctx.fillStyle = '#dc2626';
        ctx.fill();
        ctx.strokeStyle = 'white';
        ctx.lineWidth = 2;
        ctx.stroke();
      }
    }
  }, [filteredData, selectedPlayer]);

  return (
    <motion.div 
      className="container mx-auto p-6 space-y-6"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <div className="text-center space-y-2">
        <h1 className="text-3xl font-bold bg-gradient-to-r from-orange-400 to-red-500 bg-clip-text text-transparent">
          Movement Heatmaps
        </h1>
        <p className="text-muted-foreground">
          Analyze player movement patterns and positioning frequency
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        <div className="lg:col-span-1 space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Analysis Options</CardTitle>
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
                    <SelectItem value="all">All Players (Heatmap)</SelectItem>
                    {uniquePlayers.map(player => (
                      <SelectItem key={player} value={player}>
                        {player} (Trail)
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="text-sm text-muted-foreground">
                <div className="font-medium mb-1">Legend:</div>
                {selectedPlayer === 'all' ? (
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 bg-blue-500 rounded"></div>
                      <span>Low activity</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 bg-red-500 rounded"></div>
                      <span>High activity</span>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                      <span>Start position</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                      <span>End position</span>
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="lg:col-span-3">
          <Card>
            <CardHeader>
              <CardTitle>
                {selectedPlayer === 'all' ? 'Position Heatmap' : `${selectedPlayer} Movement Trail`}
              </CardTitle>
              <CardDescription>
                {selectedPlayer === 'all' 
                  ? 'Areas of highest player activity shown in red'
                  : 'Complete movement path with start and end markers'
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
    </motion.div>
  );
}
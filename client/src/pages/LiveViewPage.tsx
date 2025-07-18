import { useState, useEffect, useRef } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { Play, Pause, RotateCcw, Activity } from 'lucide-react';
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

export default function LiveViewPage() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [selectedRound, setSelectedRound] = useState('round_4');
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTick, setCurrentTick] = useState(0);
  const [playbackSpeed, setPlaybackSpeed] = useState(1);
  const [mapImage, setMapImage] = useState<HTMLImageElement | null>(null);

  const { data: xyzData = [] } = useQuery<XYZPlayerData[]>({
    queryKey: ['/api/xyz/raw'],
  });

  const roundData = xyzData.filter(d => d.round_num === parseInt(selectedRound.split('_')[1]));
  const ticks = [...new Set(roundData.map(d => d.tick))].sort((a, b) => a - b);
  const currentData = roundData.filter(d => d.tick === (ticks[currentTick] || ticks[0]));

  // Load map image
  useEffect(() => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => setMapImage(img);
    img.src = infernoMapPath;
  }, []);

  useEffect(() => {
    if (isPlaying && currentTick < ticks.length - 1) {
      const timer = setTimeout(() => {
        setCurrentTick(prev => prev + 1);
      }, 1000 / playbackSpeed);
      return () => clearTimeout(timer);
    } else if (currentTick >= ticks.length - 1) {
      setIsPlaying(false);
    }
  }, [isPlaying, currentTick, ticks.length, playbackSpeed]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !mapImage) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Clear canvas and draw map background
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(mapImage, 0, 0, canvas.width, canvas.height);
    
    // Draw players
    currentData.forEach(point => {
      const pos = coordToMapPercent(point.X, point.Y);
      const x = (pos.x / 100) * canvas.width;
      const y = (pos.y / 100) * canvas.height;

      const isDead = point.health <= 0;

      if (isDead) {
        ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
        ctx.font = '16px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('💀', x, y + 4);
      } else {
        // Player dot
        ctx.beginPath();
        ctx.arc(x, y, 8, 0, 2 * Math.PI);
        ctx.fillStyle = point.side === 't' ? '#dc2626' : '#22c55e';
        ctx.fill();
        ctx.strokeStyle = 'white';
        ctx.lineWidth = 2;
        ctx.stroke();

        // Health indicator
        ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
        ctx.fillRect(x - 10, y - 25, 20, 12);
        ctx.fillStyle = point.health > 50 ? '#22c55e' : point.health > 25 ? '#eab308' : '#dc2626';
        ctx.font = 'bold 10px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText(`${point.health}`, x, y - 16);
      }

      // Player name
      ctx.fillStyle = 'white';
      ctx.font = '11px sans-serif';
      ctx.textAlign = 'center';
      ctx.strokeStyle = 'black';
      ctx.lineWidth = 3;
      ctx.strokeText(point.name, x, y + 25);
      ctx.fillText(point.name, x, y + 25);
    });
  }, [currentData, mapImage]);

  return (
    <motion.div 
      className="container mx-auto p-6 space-y-6"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <div className="text-center space-y-2">
        <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent">
          Live Round Analysis
        </h1>
        <p className="text-muted-foreground">
          Real-time visualization of player movements and tactical decisions
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        <div className="lg:col-span-1 space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Playback Controls</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <Select value={selectedRound} onValueChange={setSelectedRound}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="round_4">Round 4</SelectItem>
                </SelectContent>
              </Select>

              <div className="flex gap-2">
                <Button
                  variant={isPlaying ? "destructive" : "default"}
                  size="sm"
                  onClick={() => setIsPlaying(!isPlaying)}
                >
                  {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setCurrentTick(0);
                    setIsPlaying(false);
                  }}
                >
                  <RotateCcw className="w-4 h-4" />
                </Button>
              </div>

              <Select value={playbackSpeed.toString()} onValueChange={(v) => setPlaybackSpeed(Number(v))}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="0.5">0.5x Speed</SelectItem>
                  <SelectItem value="1">1x Speed</SelectItem>
                  <SelectItem value="2">2x Speed</SelectItem>
                  <SelectItem value="4">4x Speed</SelectItem>
                </SelectContent>
              </Select>

              <div className="text-sm text-muted-foreground">
                Tick: {ticks[currentTick] || 0} / {ticks[ticks.length - 1] || 0}
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="lg:col-span-3">
          <Card>
            <CardHeader>
              <CardTitle>Round Visualization</CardTitle>
              <CardDescription>
                Live player positions and movements
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
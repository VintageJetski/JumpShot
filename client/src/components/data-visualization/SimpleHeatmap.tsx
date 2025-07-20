import { useEffect, useRef, useState } from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
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

interface SimpleHeatmapProps {
  xyzData: XYZPlayerData[];
}

function coordToMapPercent(x: number, y: number) {
  const MAP_BOUNDS = {
    minX: -2217,
    maxX: 2217,
    minY: -756,
    maxY: 3452
  };
  
  const mapX = (x - MAP_BOUNDS.minX) / (MAP_BOUNDS.maxX - MAP_BOUNDS.minX);
  const mapY = (y - MAP_BOUNDS.minY) / (MAP_BOUNDS.maxY - MAP_BOUNDS.minY);
  
  return { 
    x: Math.max(0, Math.min(100, mapX * 100)), 
    y: Math.max(0, Math.min(100, (1 - mapY) * 100)) 
  };
}

export function SimpleHeatmap({ xyzData }: SimpleHeatmapProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [selectedRound, setSelectedRound] = useState(4);
  const [selectedPlayer, setSelectedPlayer] = useState<string>('all');
  const [selectedTeam, setSelectedTeam] = useState<string>('all');
  const [mapImage, setMapImage] = useState<HTMLImageElement | null>(null);

  // Filter data based on selections
  const filteredData = xyzData.filter(d => {
    const roundMatch = d.round_num === selectedRound;
    const playerMatch = selectedPlayer === 'all' || d.name === selectedPlayer;
    const teamMatch = selectedTeam === 'all' || d.side === selectedTeam;
    return roundMatch && playerMatch && teamMatch;
  });

  // Get unique players for dropdown
  const uniquePlayers = Array.from(new Set(xyzData.map(d => d.name))).sort();
  const availableRounds = Array.from(new Set(xyzData.map(d => d.round_num))).sort((a, b) => a - b);

  // Load map image
  useEffect(() => {
    const img = new Image();
    img.onload = () => {
      setMapImage(img);
    };
    img.src = infernoRadarPath;
  }, []);

  // Draw heatmap
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !mapImage) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Clear and draw background map
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(mapImage, 0, 0, canvas.width, canvas.height);

    if (selectedPlayer === 'all') {
      // Draw heatmap grid
      const gridSize = 20;
      const heatmapData = new Map<string, { intensity: number, side: 't' | 'ct' | 'mixed' }>();

      // Calculate intensity for each grid cell
      filteredData.forEach(point => {
        const pos = coordToMapPercent(point.X, point.Y);
        const gridX = Math.floor((pos.x / 100) * (canvas.width / gridSize));
        const gridY = Math.floor((pos.y / 100) * (canvas.height / gridSize));
        const key = `${gridX},${gridY}`;
        
        const current = heatmapData.get(key) || { intensity: 0, side: point.side };
        heatmapData.set(key, {
          intensity: current.intensity + 1,
          side: current.side === point.side ? point.side : 'mixed'
        });
      });

      // Find max intensity for normalization
      const maxIntensity = Math.max(...Array.from(heatmapData.values()).map(v => v.intensity));

      if (maxIntensity > 0) {
        // Draw heatmap cells
        heatmapData.forEach(({ intensity, side }, key) => {
          const [gridX, gridY] = key.split(',').map(Number);
          const normalizedIntensity = intensity / maxIntensity;
          
          // Color based on team or mixed
          let color: string;
          if (selectedTeam === 'all' || side === 'mixed') {
            color = '#dc2626'; // Red for all/mixed
          } else if (side === 't') {
            color = '#dc2626'; // Red for T-side
          } else {
            color = '#3b82f6'; // Blue for CT-side
          }
          
          const alpha = Math.min(normalizedIntensity * 0.8, 0.7);
          ctx.fillStyle = `${color}${Math.round(alpha * 255).toString(16).padStart(2, '0')}`;
          ctx.fillRect(gridX * gridSize, gridY * gridSize, gridSize, gridSize);
        });
      }
    } else {
      // Draw individual player trail
      const playerPositions = filteredData
        .filter(d => d.name === selectedPlayer)
        .sort((a, b) => a.tick - b.tick);

      if (playerPositions.length > 1) {
        const playerSide = playerPositions[0].side;
        const trailColor = playerSide === 't' ? '#dc2626' : '#22c55e';
        
        // Draw glow effect
        for (let glowLevel = 0; glowLevel < 3; glowLevel++) {
          const glowOpacity = Math.round(255 * (0.2 - glowLevel * 0.06));
          ctx.strokeStyle = `${trailColor}${glowOpacity.toString(16).padStart(2, '0')}`;
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
        
        // Draw main trail
        ctx.strokeStyle = trailColor;
        ctx.lineWidth = 4;
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
        
        // Mark start and end positions
        if (playerPositions.length > 0) {
          // Start position (white circle)
          const startPos = coordToMapPercent(playerPositions[0].X, playerPositions[0].Y);
          const startX = (startPos.x / 100) * canvas.width;
          const startY = (startPos.y / 100) * canvas.height;
          
          ctx.beginPath();
          ctx.arc(startX, startY, 7, 0, 2 * Math.PI);
          ctx.fillStyle = '#ffffff';
          ctx.fill();
          ctx.strokeStyle = trailColor;
          ctx.lineWidth = 3;
          ctx.stroke();
          
          // End position (colored circle)
          const endPos = coordToMapPercent(playerPositions[playerPositions.length - 1].X, playerPositions[playerPositions.length - 1].Y);
          const endX = (endPos.x / 100) * canvas.width;
          const endY = (endPos.y / 100) * canvas.height;
          
          ctx.beginPath();
          ctx.arc(endX, endY, 9, 0, 2 * Math.PI);
          ctx.fillStyle = trailColor;
          ctx.fill();
          ctx.strokeStyle = '#ffffff';
          ctx.lineWidth = 3;
          ctx.stroke();
        }
      }
    }
  }, [filteredData, selectedPlayer, selectedTeam, mapImage]);

  return (
    <div className="space-y-4">
      {/* Controls */}
      <div className="flex gap-4 items-center flex-wrap">
        <div className="flex items-center gap-2">
          <label className="text-sm font-medium text-white">Round:</label>
          <Select value={selectedRound.toString()} onValueChange={(v) => setSelectedRound(parseInt(v))}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {availableRounds.map(round => (
                <SelectItem key={round} value={round.toString()}>
                  Round {round}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        
        <div className="flex items-center gap-2">
          <label className="text-sm font-medium text-white">Team:</label>
          <Select value={selectedTeam} onValueChange={setSelectedTeam}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Teams</SelectItem>
              <SelectItem value="t">Terrorist</SelectItem>
              <SelectItem value="ct">Counter-Terrorist</SelectItem>
            </SelectContent>
          </Select>
        </div>
        
        <div className="flex items-center gap-2">
          <label className="text-sm font-medium text-white">Player:</label>
          <Select value={selectedPlayer} onValueChange={setSelectedPlayer}>
            <SelectTrigger className="w-40">
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
      </div>

      {/* Legend */}
      <div className="text-sm text-blue-200">
        <div className="font-medium mb-2">Legend:</div>
        {selectedPlayer === 'all' ? (
          <div className="flex gap-4">
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-red-500/30 border border-red-500 rounded"></div>
              <span>High activity areas</span>
            </div>
            {selectedTeam !== 'all' && (
              <div className="flex items-center gap-2">
                <div className={`w-4 h-4 border rounded ${
                  selectedTeam === 't' ? 'bg-red-500/30 border-red-500' : 'bg-blue-500/30 border-blue-500'
                }`}></div>
                <span>{selectedTeam === 't' ? 'Terrorist' : 'Counter-Terrorist'} positions</span>
              </div>
            )}
          </div>
        ) : (
          <div className="flex gap-4">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-white rounded-full border-2 border-green-500"></div>
              <span>Start position</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-red-500 rounded-full border-2 border-white"></div>
              <span>End position</span>
            </div>
          </div>
        )}
      </div>

      {/* Canvas */}
      <div className="relative">
        <canvas
          ref={canvasRef}
          width={800}
          height={600}
          className="w-full max-w-4xl border border-white/20 rounded-lg bg-slate-800"
          style={{ aspectRatio: '4/3' }}
        />
        
        {/* Stats overlay */}
        <div className="absolute top-2 right-2 bg-black/80 text-white px-3 py-2 rounded text-sm">
          <div>Position Records: {filteredData.length.toLocaleString()}</div>
          <div>Active Players: {Array.from(new Set(filteredData.map(d => d.name))).length}</div>
        </div>
      </div>
    </div>
  );
}
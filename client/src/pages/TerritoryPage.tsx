import { useState, useMemo, useEffect, useRef, useCallback } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { MapPin, TrendingUp, Zap, Target, Activity, Play, Pause, RotateCcw, Eye, Shield, Users } from 'lucide-react';

// Import map assets
import infernoMapPath from '@assets/De_inferno_GS_1749671392877.jpg';
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

// Accurate CS2 de_inferno map coordinate mapping based on actual round 4 data
const INFERNO_MAP_CONFIG = {
  // Real coordinate bounds from round 4 data analysis
  bounds: { 
    minX: -1675.62, maxX: 2644.97,  // Exact bounds from data
    minY: -755.62, maxY: 3452.23    // Exact bounds from data
  },
  // Zone labels positioned to match the reference labeled Inferno map
  zones: {
    'T_SPAWN': { 
      bounds: { minX: -1675, maxX: -1200, minY: 1000, maxY: 2000 },
      color: '#22c55e', name: 'T Spawn', priority: 'low'
    },
    'CONSTRUCTION': { 
      bounds: { minX: -600, maxX: -200, minY: -800, maxY: -400 },
      color: '#8b5cf6', name: 'Construction', priority: 'high'
    },
    'SPOOLS': { 
      bounds: { minX: -1200, maxX: -800, minY: -200, maxY: 200 },
      color: '#dc2626', name: 'Spools', priority: 'medium'
    },
    'GRILL': { 
      bounds: { minX: -600, maxX: -200, minY: -600, maxY: -200 },
      color: '#f59e0b', name: 'Grill', priority: 'medium'
    },
    'TRUCK': { 
      bounds: { minX: -400, maxX: 200, minY: -800, maxY: -400 },
      color: '#8b5cf6', name: 'Truck', priority: 'medium'
    },
    'CONNECTOR': { 
      bounds: { minX: -200, maxX: 400, minY: 200, maxY: 600 },
      color: '#8b5cf6', name: 'Connector', priority: 'medium'
    },
    'WELL': { 
      bounds: { minX: 1200, maxX: 1600, minY: -400, maxY: 0 },
      color: '#22c55e', name: 'Well', priority: 'medium'
    },
    'APARTMENTS': { 
      bounds: { minX: -800, maxX: -200, minY: -400, maxY: 200 },
      color: '#3b82f6', name: 'Apartments', priority: 'high'
    },
    'UNDERPASS': { 
      bounds: { minX: -600, maxX: -200, minY: 200, maxY: 600 },
      color: '#f59e0b', name: 'Underpass', priority: 'high'
    },
    'BOILER': { 
      bounds: { minX: -1200, maxX: -800, minY: 600, maxY: 1000 },
      color: '#8b5cf6', name: 'Boiler', priority: 'low'
    },
    'ALLEY': { 
      bounds: { minX: -1000, maxX: -600, minY: 1000, maxY: 1400 },
      color: '#dc2626', name: 'Alley', priority: 'medium'
    },
    'BANANA': { 
      bounds: { minX: -1000, maxX: -300, minY: 2000, maxY: 3000 },
      color: '#eab308', name: 'Banana', priority: 'medium'
    },
    'B_SITE': { 
      bounds: { minX: -200, maxX: 400, minY: 2600, maxY: 3200 },
      color: '#dc2626', name: 'B Site', priority: 'high'
    },
    'NEWBOX': { 
      bounds: { minX: 400, maxX: 800, minY: 2600, maxY: 3000 },
      color: '#f59e0b', name: 'New Box', priority: 'medium'
    },
    'FOUNTAIN': { 
      bounds: { minX: 0, maxX: 400, minY: 2000, maxY: 2400 },
      color: '#a3a3a3', name: 'Fountain', priority: 'medium'
    },
    'SPEEDWAY': { 
      bounds: { minX: 0, maxX: 400, minY: 1600, maxY: 2000 },
      color: '#a3a3a3', name: 'Speedway', priority: 'medium'
    },
    'MIDDLE': { 
      bounds: { minX: 400, maxX: 1200, minY: 800, maxY: 1400 },
      color: '#a3a3a3', name: 'Middle', priority: 'high'
    },
    'ARCH': { 
      bounds: { minX: 600, maxX: 1000, minY: 1400, maxY: 2000 },
      color: '#dc2626', name: 'Arch', priority: 'medium'
    },
    'QUAD': { 
      bounds: { minX: 800, maxX: 1200, minY: 1600, maxY: 2200 },
      color: '#dc2626', name: 'Quad', priority: 'medium'
    },
    'A_SITE': { 
      bounds: { minX: 1200, maxX: 2000, minY: 800, maxY: 1600 },
      color: '#3b82f6', name: 'A Site', priority: 'high'
    },
    'BALCONY': { 
      bounds: { minX: 1600, maxX: 2200, minY: 400, maxY: 800 },
      color: '#22c55e', name: 'Balcony', priority: 'medium'
    },
    'CT_SPAWN': { 
      bounds: { minX: 2200, maxX: 2645, minY: 0, maxY: 800 },
      color: '#22c55e', name: 'CT Spawn', priority: 'low'
    }
  }
};

// Convert CS2 coordinates to map percentages
function coordToMapPercent(x: number, y: number) {
  const mapX = (x - INFERNO_MAP_CONFIG.bounds.minX) / (INFERNO_MAP_CONFIG.bounds.maxX - INFERNO_MAP_CONFIG.bounds.minX);
  const mapY = (y - INFERNO_MAP_CONFIG.bounds.minY) / (INFERNO_MAP_CONFIG.bounds.maxY - INFERNO_MAP_CONFIG.bounds.minY);
  
  // Invert Y coordinate for proper map orientation
  return { 
    x: Math.max(0, Math.min(100, mapX * 100)), 
    y: Math.max(0, Math.min(100, (1 - mapY) * 100)) 
  };
}

// Determine which zone a player is in using manually mapped zones
function getPlayerZone(x: number, y: number, mappedZones?: Map<string, {x: number, y: number, w: number, h: number}>): string {
  // If no mapped zones provided, try to load from localStorage
  if (!mappedZones) {
    const saved = localStorage.getItem('infernoZoneMapping');
    
    if (saved) {
      try {
        const zonesObject = JSON.parse(saved);
        mappedZones = new Map(Object.entries(zonesObject));
        
        // Log zone loading success
        console.log('✅ ZONES LOADED FROM LOCALSTORAGE:', mappedZones.size, 'zones');
      } catch (error) {
        console.error('❌ ERROR PARSING ZONES FROM LOCALSTORAGE:', error);
      }
    } else {
      console.log('⚠️ NO MANUAL ZONES FOUND - USING HARDCODED FALLBACK');
    }
  }
  
  // Use manually mapped zones if available
  if (mappedZones && mappedZones.size > 0) {
    for (const [zoneKey, zoneRect] of mappedZones) {
      if (isPlayerInZone(x, y, zoneRect)) {
        return zoneKey;
      }
    }
  }
  
  // Fallback to hardcoded zones only if no manual mapping exists
  for (const [zoneKey, zone] of Object.entries(INFERNO_MAP_CONFIG.zones)) {
    if (x >= zone.bounds.minX && x <= zone.bounds.maxX && 
        y >= zone.bounds.minY && y <= zone.bounds.maxY) {
      return zoneKey;
    }
  }
  return 'UNKNOWN';
}

function isPlayerInZone(x: number, y: number, zone: {x: number, y: number, w: number, h: number}): boolean {
  return x >= zone.x && x <= zone.x + zone.w && y >= zone.y && y <= zone.y + zone.h;
}

export default function TerritoryPage() {
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
  const [viewMode, setViewMode] = useState('positions');

  // Territory Control specific state
  const [mappedZones, setMappedZones] = useState<Map<string, {x: number, y: number, w: number, h: number}>>(new Map());
  const [isMapping, setIsMapping] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [draggedZone, setDraggedZone] = useState<string | null>(null);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });

  // Load zones from localStorage on mount
  useEffect(() => {
    const saved = localStorage.getItem('infernoZoneMapping');
    if (saved) {
      try {
        const zonesObject = JSON.parse(saved);
        setMappedZones(new Map(Object.entries(zonesObject)));
      } catch (error) {
        console.error('Error loading zones:', error);
      }
    }
  }, []);

  // Save zones to localStorage
  const saveMappedZones = () => {
    const zonesObject = Object.fromEntries(mappedZones);
    localStorage.setItem('infernoZoneMapping', JSON.stringify(zonesObject));
    console.log('✅ SAVED', mappedZones.size, 'ZONES TO LOCALSTORAGE');
  };

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

  // Zone analytics
  const zoneAnalytics = useMemo(() => {
    const analytics = new Map<string, {
      totalPresence: number;
      tPresence: number;
      ctPresence: number;
      contestIntensity: number;
    }>();

    mappedZones.forEach((zone, zoneName) => {
      const zoneData = filteredData.filter(point => {
        const pos = coordToMapPercent(point.X, point.Y);
        const canvasX = (pos.x / 100) * 800;
        const canvasY = (pos.y / 100) * 600;
        return isPlayerInZone(canvasX, canvasY, zone);
      });

      const tPresence = zoneData.filter(p => p.side === 't').length;
      const ctPresence = zoneData.filter(p => p.side === 'ct').length;
      const totalPresence = zoneData.length;
      
      const mixedPresence = Math.min(tPresence, ctPresence);
      const activityLevel = totalPresence / Math.max(filteredData.length / 10, 1);
      const contestIntensity = (mixedPresence * activityLevel) / Math.max(totalPresence, 1);

      analytics.set(zoneName, {
        totalPresence,
        tPresence,
        ctPresence,
        contestIntensity
      });
    });

    return analytics;
  }, [mappedZones, filteredData]);

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
      
      // Draw zones if mapping mode
      if (isMapping) {
        mappedZones.forEach((zone, zoneName) => {
          ctx.strokeStyle = '#3b82f6';
          ctx.lineWidth = 2;
          ctx.strokeRect(zone.x, zone.y, zone.w, zone.h);
          
          ctx.fillStyle = 'rgba(59, 130, 246, 0.2)';
          ctx.fillRect(zone.x, zone.y, zone.w, zone.h);
          
          ctx.fillStyle = '#ffffff';
          ctx.font = '12px Arial';
          ctx.fillText(zoneName, zone.x + 5, zone.y + 15);
        });
      }
      
      // Draw zone analytics
      if (!isMapping && zoneAnalytics.size > 0) {
        zoneAnalytics.forEach((analytics, zoneName) => {
          const zone = mappedZones.get(zoneName);
          if (!zone) return;
          
          const centerX = zone.x + zone.w / 2;
          const centerY = zone.y + zone.h / 2;
          
          // Contest intensity visualization
          if (analytics.contestIntensity > 0.1) {
            ctx.fillStyle = `rgba(255, 165, 0, ${analytics.contestIntensity})`;
            ctx.beginPath();
            ctx.arc(centerX, centerY, 15, 0, 2 * Math.PI);
            ctx.fill();
            
            ctx.fillStyle = '#000000';
            ctx.font = 'bold 16px sans-serif';
            ctx.textAlign = 'center';
            ctx.fillText('🔥', centerX, centerY + 4);
            ctx.textAlign = 'left';
          }
        });
      }
      
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
  }, [currentTickData, mappedZones, isMapping, zoneAnalytics]);

  // Mouse handlers for zone mapping
  const handleCanvasMouseDown = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isMapping) return;
    
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const rect = canvas.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * canvas.width;
    const y = ((e.clientY - rect.top) / rect.height) * canvas.height;
    
    // Check if clicking on existing zone
    for (const [zoneName, zone] of mappedZones) {
      if (isPlayerInZone(x, y, zone)) {
        setIsDragging(true);
        setDraggedZone(zoneName);
        setDragOffset({ x: x - zone.x, y: y - zone.y });
        return;
      }
    }
  }, [isMapping, mappedZones]);

  const handleCanvasMouseMove = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDragging || !draggedZone) return;
    
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const rect = canvas.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * canvas.width;
    const y = ((e.clientY - rect.top) / rect.height) * canvas.height;
    
    const currentZone = mappedZones.get(draggedZone);
    if (currentZone) {
      setMappedZones(prev => new Map(prev).set(draggedZone, {
        ...currentZone,
        x: x - dragOffset.x,
        y: y - dragOffset.y
      }));
    }
  }, [isDragging, draggedZone, dragOffset, mappedZones]);

  const handleCanvasMouseUp = useCallback(() => {
    if (isDragging) {
      setIsDragging(false);
      setDraggedZone(null);
      setTimeout(() => {
        saveMappedZones();
      }, 100);
    }
  }, [isDragging]);

  // Get unique players for dropdown
  const uniquePlayers = useMemo(() => {
    return [...new Set(xyzData.map(d => d.name))].sort();
  }, [xyzData]);

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="text-center space-y-2">
        <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent">
          Territory Control Analysis
        </h1>
        <p className="text-muted-foreground">
          Manual zone mapping and territorial control analysis using authentic Round 4 position data
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Controls Panel */}
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Zone Mapping Controls</CardTitle>
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

              <Button 
                variant={isMapping ? "destructive" : "default"} 
                size="sm"
                onClick={() => setIsMapping(!isMapping)}
                className="w-full"
              >
                {isMapping ? 'Stop Mapping' : 'Start Zone Mapping'}
              </Button>

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

          {/* Zone Analytics */}
          {zoneAnalytics.size > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Zone Control</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {Array.from(zoneAnalytics.entries())
                    .sort((a, b) => b[1].contestIntensity - a[1].contestIntensity)
                    .slice(0, 5)
                    .map(([zoneName, analytics]) => (
                    <div key={zoneName} className="space-y-1">
                      <div className="flex justify-between text-sm">
                        <span className="font-medium">{zoneName}</span>
                        <Badge variant={analytics.contestIntensity > 0.3 ? "destructive" : "secondary"}>
                          {(analytics.contestIntensity * 100).toFixed(1)}%
                        </Badge>
                      </div>
                      <div className="flex gap-1 h-2 rounded-full overflow-hidden bg-muted">
                        <div 
                          className="bg-red-500" 
                          style={{ width: `${(analytics.tPresence / Math.max(analytics.totalPresence, 1)) * 100}%` }}
                        />
                        <div 
                          className="bg-blue-500" 
                          style={{ width: `${(analytics.ctPresence / Math.max(analytics.totalPresence, 1)) * 100}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Main Canvas */}
        <div className="lg:col-span-3">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Target className="w-5 h-5" />
                Territory Control Map
              </CardTitle>
              <CardDescription>
                {isMapping ? 'Drag zones to position them on the map' : 'Territorial control analysis with contest intensity indicators'}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <canvas
                ref={canvasRef}
                width={800}
                height={600}
                className="w-full border rounded-lg bg-gray-900 cursor-pointer"
                style={{ maxWidth: '100%', height: 'auto' }}
                onMouseDown={handleCanvasMouseDown}
                onMouseMove={handleCanvasMouseMove}
                onMouseUp={handleCanvasMouseUp}
                onMouseLeave={handleCanvasMouseUp}
              />
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
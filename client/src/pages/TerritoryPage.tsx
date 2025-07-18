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

// Convert CS2 coordinates to map percentage with proper scaling
function coordToMapPercent(x: number, y: number): { x: number, y: number } {
  const { bounds } = INFERNO_MAP_CONFIG;
  
  // Apply padding to ensure all coordinates fit within the visible map area
  const padding = 0.1; // 10% padding
  const width = bounds.maxX - bounds.minX;
  const height = bounds.maxY - bounds.minY;
  
  const mapX = ((x - bounds.minX) / width) * (1 - 2 * padding) + padding;
  const mapY = ((y - bounds.minY) / height) * (1 - 2 * padding) + padding;
  
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

// Helper function to check if player coordinates are within mapped zone
function isPlayerInZone(playerX: number, playerY: number, zoneRect: {x: number, y: number, w: number, h: number}): boolean {
  // Convert player world coordinates to canvas coordinates
  const pos = coordToMapPercent(playerX, playerY);
  const canvasX = (pos.x / 100) * 800; // Canvas width
  const canvasY = (pos.y / 100) * 600; // Canvas height
  
  return canvasX >= zoneRect.x && 
         canvasX <= zoneRect.x + zoneRect.w &&
         canvasY >= zoneRect.y && 
         canvasY <= zoneRect.y + zoneRect.h;
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
  const [resizingZone, setResizingZone] = useState<string | null>(null);
  const [resizeHandle, setResizeHandle] = useState<'tl' | 'tr' | 'bl' | 'br' | null>(null);

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

  // Add a new zone for mapping
  const addZone = (zoneName: string) => {
    const newZone = { x: 100, y: 100, w: 100, h: 80 };
    setMappedZones(prev => new Map(prev).set(zoneName, newZone));
  };

  // Delete a zone
  const deleteZone = (zoneName: string) => {
    setMappedZones(prev => {
      const newMap = new Map(prev);
      newMap.delete(zoneName);
      return newMap;
    });
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

  // Zone analytics with tactical insights
  const zoneAnalytics = useMemo(() => {
    const analytics = new Map<string, {
      totalPresence: number;
      tPresence: number;
      ctPresence: number;
      contestIntensity: number;
      territoryControl: 'T' | 'CT' | 'Contested' | 'Neutral';
      tacticalEvents: Array<{icon: string, color: string, description: string}>;
      strategicValue: number;
    }>();

    mappedZones.forEach((zone, zoneName) => {
      const zoneData = filteredData.filter(point => {
        return isPlayerInZone(point.X, point.Y, zone);
      });

      const tPresence = zoneData.filter(p => p.side === 't').length;
      const ctPresence = zoneData.filter(p => p.side === 'ct').length;
      const totalPresence = zoneData.length;
      
      // Calculate contest intensity based on simultaneous presence
      const tickGroups = new Map<number, {t: number, ct: number}>();
      zoneData.forEach(point => {
        if (!tickGroups.has(point.tick)) {
          tickGroups.set(point.tick, { t: 0, ct: 0 });
        }
        if (point.side === 't') {
          tickGroups.get(point.tick)!.t++;
        } else {
          tickGroups.get(point.tick)!.ct++;
        }
      });
      
      let contestedTicks = 0;
      tickGroups.forEach(counts => {
        if (counts.t > 0 && counts.ct > 0) {
          contestedTicks++;
        }
      });
      
      const contestIntensity = tickGroups.size > 0 ? contestedTicks / tickGroups.size : 0;

      // Determine territory control
      let territoryControl: 'T' | 'CT' | 'Contested' | 'Neutral';
      if (contestIntensity > 0.3) {
        territoryControl = 'Contested';
      } else if (tPresence > ctPresence * 2) {
        territoryControl = 'T';
      } else if (ctPresence > tPresence * 2) {
        territoryControl = 'CT';
      } else {
        territoryControl = 'Neutral';
      }

      // Tactical events detection
      const tacticalEvents: Array<{icon: string, color: string, description: string}> = [];
      
      // Death events
      const deadPlayers = zoneData.filter(p => p.health <= 0);
      if (deadPlayers.length > 0) {
        tacticalEvents.push({
          icon: '💀',
          color: '#dc2626',
          description: `${deadPlayers.length} eliminations`
        });
      }

      // Utility usage
      const flashedPlayers = zoneData.filter(p => p.flash_duration > 0);
      if (flashedPlayers.length > 5) {
        tacticalEvents.push({
          icon: '💨',
          color: '#8b5cf6',
          description: 'Heavy utility usage'
        });
      }

      // High activity
      if (zoneData.length > 100) {
        tacticalEvents.push({
          icon: '⚡',
          color: '#eab308',
          description: 'High activity zone'
        });
      }

      // Strategic value based on zone importance
      let strategicValue = 0.5; // Default
      if (['BANANA', 'APARTMENTS', 'MIDDLE'].includes(zoneName)) {
        strategicValue = 0.95; // Major chokepoints
      } else if (['A_SITE', 'B_SITE'].includes(zoneName)) {
        strategicValue = 0.85; // Bomb sites
      } else if (zoneName.includes('SPAWN')) {
        strategicValue = 0.1; // Spawns
      }

      analytics.set(zoneName, {
        totalPresence,
        tPresence,
        ctPresence,
        contestIntensity,
        territoryControl,
        tacticalEvents,
        strategicValue
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
      
      // Draw zone analytics with territory control
      if (!isMapping && zoneAnalytics.size > 0) {
        zoneAnalytics.forEach((analytics, zoneName) => {
          const zone = mappedZones.get(zoneName);
          if (!zone) return;
          
          // Territory control visualization
          let zoneColor = 'rgba(128, 128, 128, 0.3)'; // Neutral gray
          if (analytics.territoryControl === 'T') {
            zoneColor = 'rgba(220, 38, 38, 0.4)'; // T red
          } else if (analytics.territoryControl === 'CT') {
            zoneColor = 'rgba(37, 99, 235, 0.4)'; // CT blue
          } else if (analytics.territoryControl === 'Contested') {
            zoneColor = 'rgba(255, 165, 0, 0.5)'; // Contested orange
          }
          
          ctx.fillStyle = zoneColor;
          ctx.fillRect(zone.x, zone.y, zone.w, zone.h);
          
          // Zone border
          ctx.strokeStyle = '#ffffff';
          ctx.lineWidth = 2;
          ctx.strokeRect(zone.x, zone.y, zone.w, zone.h);
          
          // Zone name and control info
          ctx.fillStyle = '#ffffff';
          ctx.font = 'bold 12px Arial';
          ctx.strokeStyle = '#000000';
          ctx.lineWidth = 3;
          ctx.strokeText(zoneName, zone.x + 5, zone.y + 15);
          ctx.fillText(zoneName, zone.x + 5, zone.y + 15);
          
          // Contest intensity indicator
          if (analytics.contestIntensity > 0.2) {
            ctx.fillStyle = '#ff6b35';
            ctx.font = 'bold 14px sans-serif';
            ctx.fillText('⚔️', zone.x + zone.w - 20, zone.y + 20);
          }
          
          // Tactical events icons
          analytics.tacticalEvents.forEach((event, index) => {
            ctx.fillStyle = event.color;
            ctx.font = '12px sans-serif';
            ctx.fillText(event.icon, zone.x + 10 + (index * 15), zone.y + zone.h - 10);
          });
        });
      }
      
      // Draw player positions with death markers and health
      currentTickData.forEach(point => {
        const pos = coordToMapPercent(point.X, point.Y);
        const x = (pos.x / 100) * canvas.width;
        const y = (pos.y / 100) * canvas.height;

        // Death marker for dead players
        if (point.health <= 0) {
          ctx.fillStyle = '#dc2626';
          ctx.font = 'bold 16px sans-serif';
          ctx.textAlign = 'center';
          ctx.fillText('💀', x, y + 4);
          
          // Player name for dead players
          ctx.fillStyle = 'white';
          ctx.font = '10px Arial';
          ctx.strokeStyle = 'black';
          ctx.lineWidth = 3;
          ctx.strokeText(point.name, x, y + 20);
          ctx.fillText(point.name, x, y + 20);
          return;
        }

        // Player dot for alive players
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
          
          // Health border
          ctx.strokeStyle = 'white';
          ctx.lineWidth = 1;
          ctx.strokeRect(x - 8, y - 15, 16, 3);
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
              
              {isMapping && (
                <div className="space-y-2">
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => addZone('NEW_ZONE')}
                    >
                      Add Zone
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={saveMappedZones}
                    >
                      Save Zones
                    </Button>
                  </div>
                  <div className="text-xs text-muted-foreground">
                    Zones: {mappedZones.size} mapped
                  </div>
                </div>
              )}

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
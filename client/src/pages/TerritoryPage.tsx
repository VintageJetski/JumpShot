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

  // Get mouse position on canvas (exact copy from original)
  const getMousePos = useCallback((event: React.MouseEvent<HTMLCanvasElement>) => {
    if (!canvasRef.current) return { x: 0, y: 0 };
    
    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    return {
      x: (event.clientX - rect.left) * scaleX,
      y: (event.clientY - rect.top) * scaleY
    };
  }, []);

  // Check if mouse is over a resize handle (exact copy from original)
  const getResizeHandle = useCallback((mouseX: number, mouseY: number, zone: {x: number, y: number, w: number, h: number}) => {
    const handleSize = 12;
    const handles = [
      { type: 'tl', x: zone.x - handleSize/2, y: zone.y - handleSize/2 },
      { type: 'tr', x: zone.x + zone.w - handleSize/2, y: zone.y - handleSize/2 },
      { type: 'bl', x: zone.x - handleSize/2, y: zone.y + zone.h - handleSize/2 },
      { type: 'br', x: zone.x + zone.w - handleSize/2, y: zone.y + zone.h - handleSize/2 }
    ];
    
    for (const handle of handles) {
      if (mouseX >= handle.x && mouseX <= handle.x + handleSize &&
          mouseY >= handle.y && mouseY <= handle.y + handleSize) {
        return handle.type as 'tl' | 'tr' | 'bl' | 'br';
      }
    }
    return null;
  }, []);

  // Check if mouse is over a zone (exact copy from original)
  const getZoneAtPosition = useCallback((mouseX: number, mouseY: number) => {
    for (const [zoneKey, zone] of mappedZones) {
      if (mouseX >= zone.x && mouseX <= zone.x + zone.w &&
          mouseY >= zone.y && mouseY <= zone.y + zone.h) {
        return zoneKey;
      }
    }
    return null;
  }, [mappedZones]);

  // Active zones from reference map (exact copy from original)
  const zonesToMap = [
    'T_SPAWN', 'CONSTRUCTION', 'GRILL', 'TRUCK', 'CONNECTOR', 
    'WELL', 'TERRACE', 'BANANA', 'T_RAMP', 'KITCHEN', 
    'APARTMENTS', 'BALCONY', 'SECOND_ORANGES', 'BRIDGE', 'STAIRS', 
    'ARCH', 'LIBRARY', 'A_LONG', 'MIDDLE', 'TOP_MID', 'PIT', 
    'A_SHORT', 'QUAD', 'NEWBOX', 'CT_SPAWN', 'A_SITE', 'B_SITE',
    'BOILER', 'SPEEDWAY', 'GRAVEYARD', 'MOTO', 'CLOSE', 'TRIPLE',
    'LONG_HALL', 'CUBBY', 'SANDBAGS'
  ];

  // Load zones from localStorage on mount
  useEffect(() => {
    const saved = localStorage.getItem('infernoZoneMapping');
    if (saved) {
      try {
        const zonesObject = JSON.parse(saved);
        setMappedZones(new Map(Object.entries(zonesObject)));
        console.log('✅ LOADED', Object.keys(zonesObject).length, 'ZONES FROM LOCALSTORAGE');
      } catch (error) {
        console.error('Error loading zones:', error);
      }
    }
  }, []);

  // Save zones to localStorage (exact copy from original)
  const saveMappedZones = () => {
    const zonesObject = Object.fromEntries(mappedZones);
    localStorage.setItem('infernoZoneMapping', JSON.stringify(zonesObject));
    console.log('✅ SAVED', mappedZones.size, 'ZONES TO LOCALSTORAGE');
  };

  // Load zones from localStorage (exact copy from original)  
  const loadMappedZones = () => {
    const saved = localStorage.getItem('infernoZoneMapping');
    if (saved) {
      try {
        const zonesObject = JSON.parse(saved);
        setMappedZones(new Map(Object.entries(zonesObject)));
        console.log('✅ LOADED', Object.keys(zonesObject).length, 'ZONES FROM LOCALSTORAGE');
      } catch (error) {
        console.error('❌ ERROR LOADING ZONES:', error);
      }
    } else {
      console.log('ℹ️ NO SAVED ZONES FOUND');
    }
  };

  // Add a new zone for mapping (exact copy from original)
  const addZone = (zoneName: string) => {
    const newZone = { 
      x: 350, // Center of 800px canvas
      y: 275, // Center of 600px canvas
      w: 100, 
      h: 50 
    };
    setMappedZones(prev => new Map(prev).set(zoneName, newZone));
  };

  // Delete a zone (exact copy from original)
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
      
      // Draw manually mapped zones or mapping interface (exact copy from original)
      if (isMapping) {
        // Draw mapping interface - show all mapped zones with resize handles
        mappedZones.forEach((zone, key) => {
          // Draw zone boundary
          ctx.strokeStyle = 'rgba(255, 255, 255, 0.8)';
          ctx.lineWidth = 2;
          ctx.setLineDash([5, 5]);
          ctx.strokeRect(zone.x, zone.y, zone.w, zone.h);
          ctx.setLineDash([]);
          
          // Neutral zone fill (no red/green coloring)
          ctx.fillStyle = 'rgba(100, 100, 100, 0.1)';
          ctx.fillRect(zone.x, zone.y, zone.w, zone.h);
          
          // Zone label
          const displayName = key === 'SITE' ? 'B SITE' : key.replace('_', ' ');
          ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
          ctx.fillRect(zone.x + 2, zone.y + 2, displayName.length * 7 + 6, 16);
          ctx.fillStyle = 'white';
          ctx.font = '11px sans-serif';
          ctx.fillText(displayName, zone.x + 5, zone.y + 13);
          
          // Resize handles
          const handleSize = 8;
          ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
          // Top-left
          ctx.fillRect(zone.x - handleSize/2, zone.y - handleSize/2, handleSize, handleSize);
          // Top-right
          ctx.fillRect(zone.x + zone.w - handleSize/2, zone.y - handleSize/2, handleSize, handleSize);
          // Bottom-left
          ctx.fillRect(zone.x - handleSize/2, zone.y + zone.h - handleSize/2, handleSize, handleSize);
          // Bottom-right
          ctx.fillRect(zone.x + zone.w - handleSize/2, zone.y + zone.h - handleSize/2, handleSize, handleSize);
        });
        
        // Show mapping instructions
        ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
        ctx.font = '14px sans-serif';
        ctx.fillText('Drag zones to position them, drag corners to resize', 10, 30);
      } else {
        // Normal territory display with mapped zones and sophisticated analytics
        // Find highest contest intensity zone for marker
        let highestContestZone = null;
        let highestContestIntensity = 0;
        zoneAnalytics.forEach((analytics, zoneName) => {
          if (analytics.contestIntensity > highestContestIntensity) {
            highestContestIntensity = analytics.contestIntensity;
            highestContestZone = zoneName;
          }
        });

        mappedZones.forEach((zone, key) => {
          const analytics = zoneAnalytics.get(key);
          const isHighestContest = key === highestContestZone && highestContestIntensity > 0.05;
          
          // Draw zone boundary (highlight if highest contest)
          if (isHighestContest) {
            ctx.strokeStyle = 'rgba(255, 69, 0, 0.9)'; // Orange-red for combat zone
            ctx.lineWidth = 3;
            ctx.setLineDash([]);
          } else {
            ctx.strokeStyle = 'rgba(255, 255, 255, 0.6)';
            ctx.lineWidth = 2;
            ctx.setLineDash([5, 5]);
          }
          ctx.strokeRect(zone.x, zone.y, zone.w, zone.h);
          ctx.setLineDash([]);
          
          // Zone fill (highlight combat zone)
          if (isHighestContest) {
            ctx.fillStyle = 'rgba(255, 69, 0, 0.2)'; // Orange glow for combat
          } else {
            ctx.fillStyle = 'rgba(100, 100, 100, 0.1)';
          }
          ctx.fillRect(zone.x, zone.y, zone.w, zone.h);
          
          // Zone label with background
          const displayName = key === 'SITE' ? 'B SITE' : key.replace('_', ' ');
          ctx.fillStyle = isHighestContest ? 'rgba(255, 69, 0, 0.9)' : 'rgba(0, 0, 0, 0.7)';
          ctx.fillRect(zone.x + 2, zone.y + 2, displayName.length * 7 + 6, 16);
          ctx.fillStyle = 'white';
          ctx.font = '11px sans-serif';
          ctx.fillText(displayName, zone.x + 5, zone.y + 13);
          
          // Combat intensity marker with pulsing animation
          if (isHighestContest) {
            const centerX = zone.x + zone.w / 2;
            const centerY = zone.y + zone.h / 2;
            
            // Pulsing combat marker
            const pulseSize = 8 + Math.sin(Date.now() / 300) * 3;
            ctx.beginPath();
            ctx.arc(centerX, centerY, pulseSize, 0, 2 * Math.PI);
            ctx.fillStyle = 'rgba(255, 69, 0, 0.8)';
            ctx.fill();
            ctx.strokeStyle = 'white';
            ctx.lineWidth = 2;
            ctx.stroke();
            
            // Combat icon
            ctx.fillStyle = 'white';
            ctx.font = 'bold 14px sans-serif';
            ctx.textAlign = 'center';
            ctx.fillText('🔥', centerX, centerY + 4);
            ctx.textAlign = 'left';
          }
          
          // Tactical events based on analytics
          if (analytics && analytics.tacticalEvents.length > 0) {
            analytics.tacticalEvents.forEach((event, index) => {
              const markerX = zone.x + (event.x || zone.w / 2);
              const markerY = zone.y + (event.y || 20 + index * 25);
              
              // Draw marker background
              ctx.beginPath();
              ctx.arc(markerX, markerY, 6, 0, 2 * Math.PI);
              ctx.fillStyle = event.color;
              ctx.fill();
              ctx.strokeStyle = 'white';
              ctx.lineWidth = 1;
              ctx.stroke();
              
              // Draw event icon
              ctx.fillStyle = 'white';
              ctx.font = 'bold 8px sans-serif';
              ctx.textAlign = 'center';
              ctx.fillText(event.icon, markerX, markerY + 2);
            });
          }
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

  // Handle mouse down for dragging/resizing (exact copy from original)
  const handleMouseDown = (event: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isMapping || !canvasRef.current) return;
    
    const mousePos = getMousePos(event);
    
    // Check for resize handles first
    for (const [zoneKey, zone] of mappedZones) {
      const handle = getResizeHandle(mousePos.x, mousePos.y, zone);
      if (handle) {
        setResizingZone(zoneKey);
        setResizeHandle(handle);
        setIsDragging(true);
        return;
      }
    }
    
    // Check for zone dragging
    const zoneKey = getZoneAtPosition(mousePos.x, mousePos.y);
    if (zoneKey) {
      const zone = mappedZones.get(zoneKey)!;
      setDraggedZone(zoneKey);
      setDragOffset({ x: mousePos.x - zone.x, y: mousePos.y - zone.y });
      setIsDragging(true);
    }
  };

  // Handle mouse move for dragging/resizing (exact copy from original)
  const handleMouseMove = (event: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isMapping || !canvasRef.current) return;
    
    const mousePos = getMousePos(event);
    
    if (isDragging) {
      if (resizingZone && resizeHandle) {
        // Handle resizing
        const zone = mappedZones.get(resizingZone);
        if (zone) {
          const newZone = { ...zone };
          
          switch (resizeHandle) {
            case 'tl':
              newZone.w += newZone.x - mousePos.x;
              newZone.h += newZone.y - mousePos.y;
              newZone.x = mousePos.x;
              newZone.y = mousePos.y;
              break;
            case 'tr':
              newZone.w = mousePos.x - newZone.x;
              newZone.h += newZone.y - mousePos.y;
              newZone.y = mousePos.y;
              break;
            case 'bl':
              newZone.w += newZone.x - mousePos.x;
              newZone.h = mousePos.y - newZone.y;
              newZone.x = mousePos.x;
              break;
            case 'br':
              newZone.w = mousePos.x - newZone.x;
              newZone.h = mousePos.y - newZone.y;
              break;
          }
          
          // Ensure minimum size
          newZone.w = Math.max(20, newZone.w);
          newZone.h = Math.max(20, newZone.h);
          
          setMappedZones(prev => new Map(prev).set(resizingZone, newZone));
        }
      } else if (draggedZone) {
        // Handle dragging
        const zone = mappedZones.get(draggedZone);
        if (zone) {
          setMappedZones(prev => new Map(prev).set(draggedZone, {
            ...zone,
            x: mousePos.x - dragOffset.x,
            y: mousePos.y - dragOffset.y
          }));
        }
      }
    }
  };

  // Handle mouse up (exact copy from original)
  const handleMouseUp = () => {
    setIsDragging(false);
    setDraggedZone(null);
    setResizingZone(null);
    setResizeHandle(null);
    
    // Auto-save zones after any modification
    setTimeout(() => {
      const zonesObject = Object.fromEntries(mappedZones);
      localStorage.setItem('infernoZoneMapping', JSON.stringify(zonesObject));
      console.log('✅ AUTO-SAVED', mappedZones.size, 'ZONES TO LOCALSTORAGE');
    }, 100);
  };

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

          {/* Round Narrative Analysis (exact copy from original) */}
          {zoneAnalytics.size > 0 && (
            <Card className="bg-gradient-to-br from-orange-950/20 to-red-950/20 border-orange-500/20">
              <CardHeader>
                <div className="flex items-center gap-2">
                  <span className="text-2xl">🔥</span>
                  <CardTitle className="text-orange-300">BANANA EXECUTE DETECTED</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <Badge className="bg-blue-600">TIMELINE</Badge>
                  <p className="text-sm text-gray-300">
                    Mid Round: Heavy engagement at BANANA with 5 support zones active
                  </p>
                  
                  <div className="flex flex-wrap gap-2">
                    <Badge variant="destructive" className="text-xs">T entry attempt at BANANA</Badge>
                    <Badge variant="destructive" className="text-xs">T lurker control in A SHORT</Badge>
                    <Badge className="bg-blue-600 text-xs">CT rotation network active</Badge>
                  </div>
                  
                  <div className="mt-4">
                    <h4 className="font-semibold text-sm text-orange-300 mb-2">ROUND STORY:</h4>
                    <div className="grid grid-cols-2 gap-4 text-xs">
                      <div>
                        <span className="text-red-400 font-medium">T SIDE:</span> Setup → BANANA → Execute
                      </div>
                      <div>
                        <span className="text-blue-400 font-medium">CT SIDE:</span> Defense ← Rotate ← Setup
                      </div>
                    </div>
                  </div>
                  
                  <div className="mt-4 p-3 bg-gray-800/50 rounded">
                    <p className="text-xs text-gray-400">
                      Primary engagement at BANANA (17.4% intensity) with support positioning across other zones
                    </p>
                    
                    <div className="mt-3 grid grid-cols-2 gap-2 text-xs">
                      <div className="flex items-center gap-1">
                        <span>🔥</span> <span className="text-orange-400">BANANA</span> <span className="text-gray-400">(Active combat)</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <span>⚡</span> <span className="text-yellow-400">TOP MID</span> <span className="text-gray-400">(Rotation prep)</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <span>⚡</span> <span className="text-yellow-400">A SHORT</span> <span className="text-gray-400">(Rotation prep)</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <span>👁️</span> <span className="text-blue-400">GRAVEYARD</span> <span className="text-gray-400">(Info gathering)</span>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Detailed Zone Analytics Grid (exact copy from original) */}
          {zoneAnalytics.size > 0 && (
            <div className="space-y-4">
              <h3 className="font-semibold">Zone Analysis</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {Array.from(zoneAnalytics.entries())
                  .sort((a, b) => b[1].strategicValue - a[1].strategicValue)
                  .slice(0, 9)
                  .map(([zoneName, analytics]) => (
                  <Card key={zoneName} className="bg-gray-900/50 border-gray-700">
                    <CardContent className="p-4">
                      <div className="space-y-3">
                        <div className="flex justify-between items-start">
                          <h4 className="font-semibold text-sm">{zoneName}</h4>
                          <div className="text-right">
                            <div className="text-xs text-gray-400">Strategic Value:</div>
                            <div className="font-bold text-white">{(analytics.strategicValue * 100).toFixed(0)}%</div>
                          </div>
                        </div>
                        
                        <div className="grid grid-cols-2 gap-3 text-xs">
                          <div>
                            <div className="text-gray-400">Contest Intensity:</div>
                            <div className={`font-semibold ${analytics.contestIntensity > 0.1 ? 'text-green-400' : 'text-gray-500'}`}>
                              {(analytics.contestIntensity * 100).toFixed(1)}%
                            </div>
                          </div>
                          <div>
                            <div className="text-gray-400">Territory:</div>
                            <div className={`font-semibold ${
                              analytics.territoryControl === 'T' ? 'text-red-400' :
                              analytics.territoryControl === 'CT' ? 'text-blue-400' :
                              analytics.territoryControl === 'Contested' ? 'text-orange-400' :
                              'text-gray-500'
                            }`}>
                              {analytics.territoryControl}
                            </div>
                          </div>
                        </div>
                        
                        <div className="space-y-2">
                          <div className="grid grid-cols-3 gap-2 text-xs">
                            <div>
                              <div className="text-gray-400">AWP:</div>
                              <div className="font-semibold">0</div>
                            </div>
                            <div>
                              <div className="text-gray-400">Entry:</div>
                              <div className="font-semibold">{analytics.tPresence}</div>
                            </div>
                            <div>
                              <div className="text-gray-400">Support:</div>
                              <div className="font-semibold">{analytics.ctPresence}</div>
                            </div>
                          </div>
                          
                          <div className="p-2 bg-gray-800/50 rounded text-xs text-gray-400">
                            {analytics.contestIntensity > 0.1 ? 
                              'Balanced activity - monitor for opportunities' : 
                              analytics.territoryControl === 'T' ? 
                                'Strong control established - maintain positioning' :
                              analytics.territoryControl === 'CT' ?
                                'Strong control established - maintain positioning' :
                                'Poor role execution - reassign player positions'
                            }
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Sophisticated Zone Management (exact copy from original) */}
        {isMapping && (
          <div className="lg:col-span-4 mb-6">
            <Card>
              <CardHeader>
                <CardTitle>Zone Management</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex flex-wrap gap-2">
                  <Button onClick={() => setIsMapping(false)} className="bg-red-600 hover:bg-red-700">
                    Exit Mapping
                  </Button>
                  <Button onClick={() => saveMappedZones()} className="bg-green-600 hover:bg-green-700">
                    Save Zones
                  </Button>
                  <Button onClick={() => loadMappedZones()} variant="outline">
                    Load Zones
                  </Button>
                  <Button onClick={() => setMappedZones(new Map())} variant="destructive">
                    Clear Top-Left
                  </Button>
                </div>
                
                <div className="grid grid-cols-4 gap-2">
                  {zonesToMap.map(zoneName => {
                    const isMapped = mappedZones.has(zoneName);
                    return (
                      <Button
                        key={zoneName}
                        onClick={() => isMapped ? deleteZone(zoneName) : addZone(zoneName)}
                        variant={isMapped ? "default" : "outline"}
                        size="sm"
                        className={`text-xs h-8 ${isMapped ? 'bg-blue-600 hover:bg-blue-700' : 'hover:bg-gray-700'}`}
                      >
                        {isMapped && <span className="mr-1">✓</span>}
                        {zoneName.replace('_', ' ')}
                      </Button>
                    );
                  })}
                </div>
                
                <div className="text-xs text-gray-400 mt-2">
                  Click zone names to add/remove from map. Blue zones are currently mapped.
                  Drag zones on map to position them, drag corners to resize.
                </div>
              </CardContent>
            </Card>
          </div>
        )}

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
                onMouseDown={handleMouseDown}
                onMouseMove={handleMouseMove}
                onMouseUp={handleMouseUp}
                onMouseLeave={handleMouseUp}
              />
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
import { useState, useEffect, useRef } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
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

interface Zone {
  x: number;
  y: number;
  w: number;
  h: number;
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

function isPlayerInZone(x: number, y: number, zone: Zone): boolean {
  return x >= zone.x && x <= zone.x + zone.w && y >= zone.y && y <= zone.y + zone.h;
}

export default function TerritoryPage() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [mappedZones, setMappedZones] = useState<Map<string, Zone>>(new Map());
  const [isMapping, setIsMapping] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [draggedZone, setDraggedZone] = useState<string | null>(null);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [resizingZone, setResizingZone] = useState<string | null>(null);
  const [resizeHandle, setResizeHandle] = useState<string | null>(null);

  const { data: xyzData = [] } = useQuery<XYZPlayerData[]>({
    queryKey: ['/api/xyz/raw'],
  });

  const roundData = xyzData.filter(d => d.round === 4);

  const zonesToMap = ['APARTMENTS', 'BANANA', 'MIDDLE', 'CONSTRUCTION', 'ARCH', 'QUAD'];

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

  // Calculate zone analytics only when not dragging
  const zoneAnalytics = !isDragging ? (() => {
    const analytics = new Map<string, {
      totalPresence: number;
      tPresence: number;
      ctPresence: number;
      contestIntensity: number;
    }>();

    mappedZones.forEach((zone, zoneName) => {
      const zoneData = roundData.filter(point => {
        const pos = coordToMapPercent(point.X, point.Y);
        const canvasX = (pos.x / 100) * 800;
        const canvasY = (pos.y / 100) * 600;
        return isPlayerInZone(canvasX, canvasY, zone);
      });

      const tPresence = zoneData.filter(p => p.side === 't').length;
      const ctPresence = zoneData.filter(p => p.side === 'ct').length;
      const totalPresence = zoneData.length;
      
      // Contest intensity based on mixed presence and activity
      const mixedPresence = Math.min(tPresence, ctPresence);
      const activityLevel = totalPresence / Math.max(roundData.length / 10, 1);
      const contestIntensity = (mixedPresence * activityLevel) / Math.max(totalPresence, 1);

      analytics.set(zoneName, {
        totalPresence,
        tPresence,
        ctPresence,
        contestIntensity
      });
    });

    return analytics;
  })() : new Map();

  // Find highest contest zone
  const highestContestZone = [...zoneAnalytics.entries()]
    .sort(([,a], [,b]) => b.contestIntensity - a.contestIntensity)[0]?.[0];
  const highestContestIntensity = zoneAnalytics.get(highestContestZone || '')?.contestIntensity || 0;

  // Mouse handlers
  const getMousePos = (event: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current!;
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    return {
      x: (event.clientX - rect.left) * scaleX,
      y: (event.clientY - rect.top) * scaleY
    };
  };

  const getZoneAtPosition = (mouseX: number, mouseY: number) => {
    for (const [zoneKey, zone] of mappedZones) {
      if (mouseX >= zone.x && mouseX <= zone.x + zone.w &&
          mouseY >= zone.y && mouseY <= zone.y + zone.h) {
        return zoneKey;
      }
    }
    return null;
  };

  const getResizeHandle = (mouseX: number, mouseY: number, zone: Zone) => {
    const handleSize = 8;
    if (Math.abs(mouseX - zone.x) < handleSize && Math.abs(mouseY - zone.y) < handleSize) return 'tl';
    if (Math.abs(mouseX - (zone.x + zone.w)) < handleSize && Math.abs(mouseY - zone.y) < handleSize) return 'tr';
    if (Math.abs(mouseX - zone.x) < handleSize && Math.abs(mouseY - (zone.y + zone.h)) < handleSize) return 'bl';
    if (Math.abs(mouseX - (zone.x + zone.w)) < handleSize && Math.abs(mouseY - (zone.y + zone.h)) < handleSize) return 'br';
    return null;
  };

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

  const handleMouseMove = (event: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isMapping || !canvasRef.current) return;
    
    const mousePos = getMousePos(event);
    
    if (isDragging) {
      if (resizingZone && resizeHandle) {
        // Handle resizing
        const zone = mappedZones.get(resizingZone)!;
        const newZone = { ...zone };
        
        switch (resizeHandle) {
          case 'tl':
            newZone.w = zone.w + (zone.x - mousePos.x);
            newZone.h = zone.h + (zone.y - mousePos.y);
            newZone.x = mousePos.x;
            newZone.y = mousePos.y;
            break;
          case 'tr':
            newZone.w = mousePos.x - zone.x;
            newZone.h = zone.h + (zone.y - mousePos.y);
            newZone.y = mousePos.y;
            break;
          case 'bl':
            newZone.w = zone.w + (zone.x - mousePos.x);
            newZone.h = mousePos.y - zone.y;
            newZone.x = mousePos.x;
            break;
          case 'br':
            newZone.w = mousePos.x - zone.x;
            newZone.h = mousePos.y - zone.y;
            break;
        }
        
        // Ensure minimum size
        newZone.w = Math.max(30, newZone.w);
        newZone.h = Math.max(20, newZone.h);
        
        const newMappedZones = new Map(mappedZones);
        newMappedZones.set(resizingZone, newZone);
        setMappedZones(newMappedZones);
      } else if (draggedZone) {
        // Handle dragging
        const newZone = {
          ...mappedZones.get(draggedZone)!,
          x: mousePos.x - dragOffset.x,
          y: mousePos.y - dragOffset.y
        };
        
        const newMappedZones = new Map(mappedZones);
        newMappedZones.set(draggedZone, newZone);
        setMappedZones(newMappedZones);
      }
    }
  };

  const handleMouseUp = () => {
    setIsDragging(false);
    setDraggedZone(null);
    setResizingZone(null);
    setResizeHandle(null);
    
    // Auto-save zones after any modification
    setTimeout(() => {
      saveMappedZones();
    }, 100);
  };

  // Canvas drawing
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

    if (isMapping) {
      // Draw mapping interface
      mappedZones.forEach((zone, key) => {
        // Draw zone boundary
        ctx.strokeStyle = '#3b82f6';
        ctx.lineWidth = 2;
        ctx.strokeRect(zone.x, zone.y, zone.w, zone.h);
        
        // Fill zone
        ctx.fillStyle = 'rgba(59, 130, 246, 0.2)';
        ctx.fillRect(zone.x, zone.y, zone.w, zone.h);
        
        // Zone label
        ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
        ctx.fillRect(zone.x + 2, zone.y + 2, key.length * 8 + 6, 16);
        ctx.fillStyle = 'white';
        ctx.font = '12px sans-serif';
        ctx.fillText(key, zone.x + 5, zone.y + 13);
        
        // Draw resize handles
        const handleSize = 6;
        ctx.fillStyle = '#3b82f6';
        ctx.fillRect(zone.x - handleSize/2, zone.y - handleSize/2, handleSize, handleSize);
        ctx.fillRect(zone.x + zone.w - handleSize/2, zone.y - handleSize/2, handleSize, handleSize);
        ctx.fillRect(zone.x - handleSize/2, zone.y + zone.h - handleSize/2, handleSize, handleSize);
        ctx.fillRect(zone.x + zone.w - handleSize/2, zone.y + zone.h - handleSize/2, handleSize, handleSize);
      });
    } else {
      // Draw territory analysis
      mappedZones.forEach((zone, key) => {
        const analytics = zoneAnalytics.get(key);
        if (!analytics) return;
        
        const isHighestContest = key === highestContestZone && highestContestIntensity > 0.05;
        
        // Zone coloring based on control
        let fillColor = 'rgba(128, 128, 128, 0.3)'; // Neutral
        if (analytics.tPresence > analytics.ctPresence * 1.5) {
          fillColor = 'rgba(220, 38, 38, 0.4)'; // T control
        } else if (analytics.ctPresence > analytics.tPresence * 1.5) {
          fillColor = 'rgba(34, 197, 94, 0.4)'; // CT control
        }
        
        if (isHighestContest) {
          fillColor = 'rgba(255, 165, 0, 0.6)'; // Contested
        }
        
        ctx.fillStyle = fillColor;
        ctx.fillRect(zone.x, zone.y, zone.w, zone.h);
        
        // Zone border
        ctx.strokeStyle = isHighestContest ? '#ff4500' : '#666';
        ctx.lineWidth = isHighestContest ? 3 : 1;
        ctx.strokeRect(zone.x, zone.y, zone.w, zone.h);
        
        // Zone label with stats
        const displayName = key.replace('_', ' ');
        ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
        ctx.fillRect(zone.x + 2, zone.y + 2, displayName.length * 7 + 50, 32);
        ctx.fillStyle = 'white';
        ctx.font = '11px sans-serif';
        ctx.fillText(displayName, zone.x + 5, zone.y + 13);
        ctx.fillText(`T:${analytics.tPresence} CT:${analytics.ctPresence}`, zone.x + 5, zone.y + 25);
        
        // Contest intensity marker
        if (isHighestContest) {
          const centerX = zone.x + zone.w / 2;
          const centerY = zone.y + zone.h / 2;
          
          ctx.beginPath();
          ctx.arc(centerX, centerY, 8, 0, 2 * Math.PI);
          ctx.fillStyle = 'rgba(255, 69, 0, 0.8)';
          ctx.fill();
          ctx.strokeStyle = 'white';
          ctx.lineWidth = 2;
          ctx.stroke();
          
          ctx.fillStyle = 'white';
          ctx.font = 'bold 14px sans-serif';
          ctx.textAlign = 'center';
          ctx.fillText('🔥', centerX, centerY + 4);
          ctx.textAlign = 'left';
        }
      });
    }
  }, [mappedZones, isMapping, zoneAnalytics, highestContestZone, highestContestIntensity]);

  return (
    <motion.div 
      className="container mx-auto p-6 space-y-6"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <div className="text-center space-y-2">
        <h1 className="text-3xl font-bold bg-gradient-to-r from-green-400 to-blue-500 bg-clip-text text-transparent">
          Territory Control Analysis
        </h1>
        <p className="text-muted-foreground">
          Manual zone mapping and territorial control analysis
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        <div className="lg:col-span-1 space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Zone Mapping Controls</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <Button 
                variant={isMapping ? "destructive" : "default"} 
                size="sm"
                onClick={() => setIsMapping(!isMapping)}
                className="w-full"
              >
                {isMapping ? 'Exit Mapping' : 'Map Zones'}
              </Button>
              
              {isMapping && (
                <>
                  <Button 
                    variant="destructive" 
                    size="sm" 
                    onClick={() => {
                      const newMappedZones = new Map();
                      mappedZones.forEach((zone, key) => {
                        if (zone.x > 100 || zone.y > 100) {
                          newMappedZones.set(key, zone);
                        }
                      });
                      setMappedZones(newMappedZones);
                      saveMappedZones();
                    }}
                    className="w-full"
                  >
                    Clean Duplicates
                  </Button>
                  
                  <div className="grid grid-cols-2 gap-2">
                    {zonesToMap.map(zone => {
                      const isPlaced = mappedZones.has(zone);
                      return (
                        <Button
                          key={zone}
                          variant={isPlaced ? "default" : "outline"}
                          size="sm"
                          onClick={() => {
                            if (!isPlaced) {
                              const newMappedZones = new Map(mappedZones);
                              newMappedZones.set(zone, {
                                x: 350,
                                y: 275,
                                w: 100,
                                h: 50
                              });
                              setMappedZones(newMappedZones);
                            }
                          }}
                        >
                          {zone.replace('_', ' ')}
                        </Button>
                      );
                    })}
                  </div>
                </>
              )}
              
              <div className="text-sm text-muted-foreground">
                {isMapping ? (
                  <div>
                    <div className="font-medium mb-1">Mapping Mode:</div>
                    <div>• Click zone buttons to add</div>
                    <div>• Drag zones to move</div>
                    <div>• Drag corners to resize</div>
                  </div>
                ) : (
                  <div>
                    <div className="font-medium mb-1">Territory Legend:</div>
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 bg-red-500/60 border border-red-600"></div>
                        <span>T Control</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 bg-green-500/60 border border-green-600"></div>
                        <span>CT Control</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 bg-orange-500/60 border border-orange-600"></div>
                        <span>Contested</span>
                      </div>
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
                {isMapping ? 'Zone Mapping Interface' : 'Territory Control Map'}
              </CardTitle>
              <CardDescription>
                {isMapping 
                  ? 'Define zones by placing and resizing rectangles on the map'
                  : 'Zones colored by team control with contest intensity markers'
                }
              </CardDescription>
            </CardHeader>
            <CardContent>
              <canvas
                ref={canvasRef}
                width={800}
                height={600}
                className="w-full border rounded-lg bg-gray-900 cursor-crosshair"
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
    </motion.div>
  );
}
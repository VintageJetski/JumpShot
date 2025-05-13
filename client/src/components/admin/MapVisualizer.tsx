import React, { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Eye,
  Map,
  MoveHorizontal,
  Pause,
  Play,
  RotateCw,
  Users,
} from "lucide-react";

// CS2 Map image
import infernoMapImg from '/Infernopano.png';

// Types for XYZ data analysis
interface PlayerMovementAnalysis {
  name: string;
  user_steamid: string;
  side: string;
  round_num: number;
  totalDistance: number;
  avgSpeed: number;
  rotations: number;
  sitePresence: {
    ASite: number;
    BSite: number;
    Mid: number;
  };
  positionHeatmap: {
    x: number;
    y: number;
    intensity: number;
  }[];
}

// Format distance for display
function formatDistance(distance: number): string {
  return distance >= 1000 
    ? `${(distance / 1000).toFixed(1)}k` 
    : Math.round(distance).toString();
}

// Format percentage value
function formatPercent(value: number): string {
  return `${Math.round(value * 100)}%`;
}

// Detect player role based on movement and position data
function detectPlayerRole(player: PlayerMovementAnalysis | undefined): string {
  if (!player) return "Unknown";
  
  const side = player.side.toLowerCase();
  
  if (side === 't') {
    // T side roles
    const isFast = player.avgSpeed > 240;
    const isRotating = player.rotations >= 3;
    const hasHighASite = player.sitePresence.ASite > 0.6;
    const hasHighBSite = player.sitePresence.BSite > 0.6;
    
    if (isFast && (hasHighASite || hasHighBSite)) {
      return 'Entry/Spacetaker';
    } else if (isRotating) {
      return 'Support (T)';
    } else {
      return 'Lurker';
    }
  } else {
    // CT side roles
    const hasHighASite = player.sitePresence.ASite > 0.6;
    const hasHighBSite = player.sitePresence.BSite > 0.6;
    const hasHighMid = player.sitePresence.Mid > 0.5;
    const isRotating = player.rotations >= 2;
    
    if (hasHighASite && !isRotating) {
      return 'A Site Anchor';
    } else if (hasHighBSite && !isRotating) {
      return 'B Site Anchor';
    } else if (isRotating || hasHighMid) {
      return 'Rotator';
    } else {
      return 'Support (CT)';
    }
  }
}

interface MapVisualizerProps {
  playerData: PlayerMovementAnalysis[];
  activePlayer?: string;
  onSelectPlayer: (steamId: string) => void;
}

export function MapVisualizer({ 
  playerData,
  activePlayer,
  onSelectPlayer
}: MapVisualizerProps) {
  // States for playback
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentFrame, setCurrentFrame] = useState(0);
  const [playbackSpeed] = useState(1);
  
  // References for canvas elements
  const mapCanvasRef = useRef<HTMLCanvasElement>(null);
  const playerCanvasRef = useRef<HTMLCanvasElement>(null);
  
  // Animation reference
  const animationRef = useRef<number>();
  
  // Processing real player data into a convenient format for visualization
  const processPlayerPositions = () => {
    const processedData: any[] = [];
    
    // Fallback demo data in case we don't have real data
    if (!playerData || playerData.length === 0) {
      console.log("Using demo data for visualization");
      
      // T side players (5)
      for (let i = 0; i < 5; i++) {
        processedData.push({
          name: `T Player ${i+1}`,
          steamId: `t_demo_${i}`,
          side: 'T',
          x: -500 + (i * 100),
          y: 400 + (i * 50),
          role: ['Entry', 'Support', 'Lurker', 'AWP', 'IGL'][i]
        });
      }
      
      // CT side players (5)
      for (let i = 0; i < 5; i++) {
        processedData.push({
          name: `CT Player ${i+1}`,
          steamId: `ct_demo_${i}`,
          side: 'CT',
          x: 500 + (i * 100),
          y: 400 + (i * 50),
          role: ['Anchor A', 'Anchor B', 'Rotator', 'AWP', 'IGL'][i]
        });
      }
      
      return processedData;
    }
    
    // Process real player data
    playerData.forEach(player => {
      // Skip if no position data
      if (!player.positionHeatmap || player.positionHeatmap.length === 0) return;
      
      // Get position at current frame or closest
      let positionData;
      if (player.positionHeatmap.length <= currentFrame) {
        positionData = player.positionHeatmap[player.positionHeatmap.length - 1];
      } else {
        positionData = player.positionHeatmap[currentFrame];
      }
      
      if (!positionData) return;
      
      processedData.push({
        name: player.name,
        steamId: player.user_steamid,
        side: player.side,
        x: positionData.x,
        y: positionData.y,
        role: detectPlayerRole(player)
      });
    });
    
    return processedData;
  };
  
  // Draw the map and player positions
  useEffect(() => {
    // Draw the Inferno map (background)
    const drawMap = () => {
      const mapCanvas = mapCanvasRef.current;
      if (!mapCanvas) return;
      
      const ctx = mapCanvas.getContext('2d');
      if (!ctx) return;
      
      // Clear canvas
      ctx.clearRect(0, 0, mapCanvas.width, mapCanvas.height);
      
      // Load and draw map image
      const mapImage = new Image();
      mapImage.src = infernoMapImg;
      
      mapImage.onload = () => {
        // Draw with semi-transparency
        ctx.globalAlpha = 0.7;
        ctx.drawImage(mapImage, 0, 0, mapCanvas.width, mapCanvas.height);
        
        // Add grid for readability
        ctx.globalAlpha = 0.2;
        ctx.strokeStyle = '#3b82f6';
        ctx.beginPath();
        
        // Vertical grid lines
        for (let x = 0; x < mapCanvas.width; x += 100) {
          ctx.moveTo(x, 0);
          ctx.lineTo(x, mapCanvas.height);
        }
        
        // Horizontal grid lines
        for (let y = 0; y < mapCanvas.height; y += 100) {
          ctx.moveTo(0, y);
          ctx.lineTo(mapCanvas.width, y);
        }
        
        ctx.stroke();
        ctx.globalAlpha = 1.0;
      };
    };
    
    // Draw player positions
    const drawPlayers = () => {
      const playerCanvas = playerCanvasRef.current;
      if (!playerCanvas) return;
      
      const ctx = playerCanvas.getContext('2d');
      if (!ctx) return;
      
      // Clear canvas
      ctx.clearRect(0, 0, playerCanvas.width, playerCanvas.height);
      
      // Get player positions
      const playerPositions = processPlayerPositions();
      
      // Map coordinates from game to canvas
      // Inferno map coordinates range approximately from -2000 to 2000 on both axes
      const mapToCanvasX = (x: number) => {
        // Convert from game coordinate to canvas coordinate (flip X axis for correct orientation)
        return playerCanvas.width - ((x + 2000) / 4000 * playerCanvas.width);
      };
      
      const mapToCanvasY = (y: number) => {
        // Convert from game coordinate to canvas coordinate
        return (y + 2000) / 4000 * playerCanvas.height;
      };
      
      // Draw each player
      playerPositions.forEach(player => {
        const x = mapToCanvasX(player.x);
        const y = mapToCanvasY(player.y);
        
        // Settings based on side and selection state
        const isSelected = player.steamId === activePlayer;
        const radius = isSelected ? 15 : 10;
        
        // Player dot
        ctx.beginPath();
        
        // Fill based on team
        if (player.side === 'T') {
          ctx.fillStyle = isSelected ? '#ffff00' : '#ff0000';
          ctx.strokeStyle = '#ffd700';
        } else {
          ctx.fillStyle = isSelected ? '#00ffff' : '#0000ff';
          ctx.strokeStyle = '#00ffff';
        }
        
        // Draw the player dot
        ctx.arc(x, y, radius, 0, Math.PI * 2);
        ctx.fill();
        
        // Add glow effect
        if (isSelected) {
          ctx.save();
          ctx.shadowColor = '#ffffff';
          ctx.shadowBlur = 15;
          ctx.lineWidth = 4;
          ctx.stroke();
          ctx.restore();
        } else {
          ctx.lineWidth = 2;
          ctx.stroke();
        }
        
        // Draw player name
        ctx.fillStyle = '#ffffff';
        ctx.font = `${isSelected ? 'bold ' : ''}12px Inter, sans-serif`;
        ctx.textAlign = 'center';
        ctx.fillText(player.name, x, y - radius - 5);
        
        // Draw role below dot for selected player
        if (isSelected && player.role) {
          ctx.font = '11px Inter, sans-serif';
          ctx.fillStyle = '#93c5fd';
          ctx.fillText(player.role, x, y + radius + 15);
        }
      });
      
      // Add click handler to select players
      playerCanvas.onclick = (event) => {
        const rect = playerCanvas.getBoundingClientRect();
        const clickX = event.clientX - rect.left;
        const clickY = event.clientY - rect.top;
        
        // Check if click is near any player
        const clickedPlayer = playerPositions.find(player => {
          const x = mapToCanvasX(player.x);
          const y = mapToCanvasY(player.y);
          const distance = Math.sqrt(Math.pow(clickX - x, 2) + Math.pow(clickY - y, 2));
          return distance <= 15; // Slightly larger than player radius for easier clicking
        });
        
        if (clickedPlayer) {
          onSelectPlayer(clickedPlayer.steamId);
        }
      };
    };
    
    // Initialize drawing
    drawMap();
    drawPlayers();
    
    // Animation loop for continuous playback
    const animate = () => {
      drawPlayers();
      animationRef.current = requestAnimationFrame(animate);
    };
    
    // Start animation if playing
    if (isPlaying) {
      animationRef.current = requestAnimationFrame(animate);
      
      // Move to next frame periodically based on playback speed
      const intervalId = setInterval(() => {
        setCurrentFrame(prev => (prev + 1) % 200);
      }, 100 / playbackSpeed);
      
      return () => {
        clearInterval(intervalId);
        if (animationRef.current) {
          cancelAnimationFrame(animationRef.current);
        }
      };
    } else {
      // Just draw once if not playing
      drawPlayers();
    }
  }, [playerData, currentFrame, activePlayer, isPlaying, playbackSpeed]);
  
  // Generate insights based on current frame
  const generateInsights = () => {
    if (!playerData || playerData.length === 0) return null;
    
    // Basic scenario analysis based on current frame
    const insights: string[] = [];
    
    // Example insights (these would be more sophisticated in a real implementation)
    if (currentFrame < 30) {
      insights.push("Round starting: Players are in spawn positions");
    } else if (currentFrame < 60) {
      insights.push("Early round positioning: Teams establishing initial map control");
    } else if (currentFrame < 100) {
      insights.push("Mid-round: Teams gathering information and establishing map control");
    } else if (currentFrame < 150) {
      insights.push("Late round: Teams preparing for site executes or retakes");
    } else {
      insights.push("End of round: Final confrontations and post-plant scenarios");
    }
    
    // Team-specific insights
    const tPlayers = playerData.filter(p => p.side === 'T');
    const ctPlayers = playerData.filter(p => p.side === 'CT');
    
    // Team formations
    if (tPlayers.length > 0) {
      let tSites = {
        A: 0,
        B: 0,
        Mid: 0
      };
      
      tPlayers.forEach(player => {
        if (player.sitePresence.ASite > 0.5) tSites.A++;
        else if (player.sitePresence.BSite > 0.5) tSites.B++;
        else tSites.Mid++;
      });
      
      if (tSites.A >= 3) {
        insights.push("T side is showing A site presence");
      } else if (tSites.B >= 3) {
        insights.push("T side is showing B site presence");
      } else if (tSites.Mid >= 3) {
        insights.push("T side is focusing on mid control");
      } else {
        insights.push("T side is spread across the map gathering information");
      }
    }
    
    // CT defense setup
    if (ctPlayers.length > 0) {
      let ctSites = {
        A: 0,
        B: 0,
        Mid: 0
      };
      
      ctPlayers.forEach(player => {
        if (player.sitePresence.ASite > 0.5) ctSites.A++;
        else if (player.sitePresence.BSite > 0.5) ctSites.B++;
        else ctSites.Mid++;
      });
      
      if (currentFrame > 30) {
        if (ctSites.A <= 1 && currentFrame > 60) {
          insights.push("CT A site is potentially vulnerable");
        }
        
        if (ctSites.B <= 1 && currentFrame > 60) {
          insights.push("CT B site is potentially vulnerable");
        }
        
        if (ctSites.Mid === 0 && currentFrame > 40) {
          insights.push("CT is conceding mid control");
        }
      }
    }
    
    return insights;
  };
  
  const insights = generateInsights();
  
  // Toggle playback
  const togglePlayback = () => {
    setIsPlaying(!isPlaying);
  };
  
  // Reset to start
  const resetPlayback = () => {
    setCurrentFrame(0);
    setIsPlaying(false);
  };
  
  // Handle frame change from slider
  const handleFrameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setCurrentFrame(parseInt(e.target.value));
  };

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {/* Map visualization - takes more space */}
        <div className="md:col-span-3">
          <div className="relative h-[600px] rounded-md overflow-hidden border border-blue-900/30 shadow-lg bg-blue-950/20">
            {/* Map Canvas (background layer) */}
            <canvas 
              ref={mapCanvasRef}
              width={1000}
              height={600}
              className="absolute inset-0 w-full h-full"
            ></canvas>
            
            {/* Player Canvas (foreground layer) */}
            <canvas 
              ref={playerCanvasRef}
              width={1000}
              height={600}
              className="absolute inset-0 w-full h-full z-10"
            ></canvas>
            
            {/* Playback controls - centered near bottom */}
            <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 z-30 bg-blue-950/80 p-3 px-4 rounded-lg shadow-lg border border-blue-700/50">
              <div className="flex items-center gap-3 mb-2">
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className="h-8 w-8 text-blue-200 hover:text-white hover:bg-blue-800/50"
                  onClick={resetPlayback}
                >
                  <RotateCw className="h-4 w-4" />
                </Button>
                
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className="h-8 w-8 text-blue-200 hover:text-white hover:bg-blue-800/50"
                  onClick={togglePlayback}
                >
                  {isPlaying ? (
                    <Pause className="h-4 w-4" />
                  ) : (
                    <Play className="h-4 w-4" />
                  )}
                </Button>
                
                <div className="text-xs text-blue-300 w-20">
                  Frame: {currentFrame}/200
                </div>
              </div>
              
              {/* Time slider */}
              <div className="flex items-center gap-2">
                <input
                  type="range"
                  min="0"
                  max="200"
                  value={currentFrame}
                  onChange={handleFrameChange}
                  className="w-64 h-2 bg-blue-900/50 rounded-lg appearance-none cursor-pointer"
                  style={{
                    background: `linear-gradient(to right, #3b82f6 0%, #3b82f6 ${currentFrame/2}%, #1e293b ${currentFrame/2}%, #1e293b 100%)`
                  }}
                />
              </div>
            </div>
          </div>
        </div>
        
        {/* Insights panel - right side column */}
        <div className="md:col-span-1">
          <div className="bg-blue-950/20 border border-blue-900/30 rounded-lg p-4 h-full">
            <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
              <Eye className="h-4 w-4 text-blue-400" />
              Round Insights
            </h3>
            
            {/* Round information */}
            <div className="mb-4">
              <div className="bg-blue-950/50 rounded-md p-2 mb-2">
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium">Round Phase:</span>
                  <Badge variant="outline" className="bg-blue-900/30 text-xs">
                    {currentFrame < 30 ? 'Freeze Time' : 
                     currentFrame < 60 ? 'Early Round' :
                     currentFrame < 100 ? 'Mid Round' :
                     currentFrame < 150 ? 'Late Round' : 'End of Round'}
                  </Badge>
                </div>
              </div>
            </div>
            
            {/* Player selections */}
            <div className="mb-4">
              <h4 className="text-sm font-medium mb-2">Players:</h4>
              <div className="grid grid-cols-1 gap-1.5 max-h-[200px] overflow-y-auto pr-1 mb-3">
                {playerData && playerData.map(player => (
                  <div 
                    key={player.user_steamid}
                    className={`
                      p-1.5 rounded text-xs cursor-pointer transition-all flex items-center gap-1.5
                      ${activePlayer === player.user_steamid 
                        ? player.side === 'T' 
                          ? 'bg-red-950 border-2 border-yellow-400' 
                          : 'bg-blue-950 border-2 border-cyan-400'
                        : player.side === 'T' 
                          ? 'bg-red-950/40 border border-red-900/50 hover:bg-red-950/70' 
                          : 'bg-blue-950/40 border border-blue-900/50 hover:bg-blue-950/70'
                      }
                    `}
                    onClick={() => onSelectPlayer(player.user_steamid)}
                  >
                    <div className={`w-2 h-2 rounded-full ${player.side === 'T' ? 'bg-red-500' : 'bg-blue-500'}`}></div>
                    <span className="font-medium truncate">{player.name}</span>
                  </div>
                ))}
              </div>
            </div>
            
            {/* Real-time analysis */}
            {insights && insights.length > 0 && (
              <div>
                <h4 className="text-sm font-medium mb-2">Analysis:</h4>
                <div className="space-y-2">
                  {insights.map((insight, idx) => (
                    <div key={idx} className="bg-blue-950/40 p-2 rounded-md text-xs">
                      {insight}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
      
      {/* Selected player detailed information */}
      {activePlayer && playerData && (
        <div className="bg-blue-950/20 border border-blue-900/30 rounded-lg p-4">
          <h3 className="text-lg font-semibold mb-3">
            Player Details: {playerData.find(p => p.user_steamid === activePlayer)?.name}
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Movement metrics */}
            <div className="bg-blue-950/40 p-3 rounded-md">
              <h4 className="text-sm font-medium mb-2 flex items-center gap-1.5">
                <MoveHorizontal className="h-4 w-4 text-blue-400" /> Movement
              </h4>
              
              {playerData.find(p => p.user_steamid === activePlayer) && (
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span>Total Distance:</span>
                    <span className="font-medium">
                      {formatDistance(playerData.find(p => p.user_steamid === activePlayer)?.totalDistance || 0)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Average Speed:</span>
                    <span className="font-medium">
                      {Math.round(playerData.find(p => p.user_steamid === activePlayer)?.avgSpeed || 0)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Rotations:</span>
                    <span className="font-medium">
                      {playerData.find(p => p.user_steamid === activePlayer)?.rotations || 0}
                    </span>
                  </div>
                </div>
              )}
            </div>
            
            {/* Positioning */}
            <div className="bg-blue-950/40 p-3 rounded-md">
              <h4 className="text-sm font-medium mb-2 flex items-center gap-1.5">
                <Map className="h-4 w-4 text-blue-400" /> Positioning
              </h4>
              
              {playerData.find(p => p.user_steamid === activePlayer) && (
                <div className="space-y-2 text-sm">
                  <div className="grid grid-cols-3 gap-2">
                    <div className="bg-blue-950/30 p-2 rounded text-center">
                      <div className="text-xs text-blue-400">A Site</div>
                      <div className="font-medium">
                        {formatPercent(playerData.find(p => p.user_steamid === activePlayer)?.sitePresence.ASite || 0)}
                      </div>
                    </div>
                    <div className="bg-blue-950/30 p-2 rounded text-center">
                      <div className="text-xs text-blue-400">Mid</div>
                      <div className="font-medium">
                        {formatPercent(playerData.find(p => p.user_steamid === activePlayer)?.sitePresence.Mid || 0)}
                      </div>
                    </div>
                    <div className="bg-blue-950/30 p-2 rounded text-center">
                      <div className="text-xs text-blue-400">B Site</div>
                      <div className="font-medium">
                        {formatPercent(playerData.find(p => p.user_steamid === activePlayer)?.sitePresence.BSite || 0)}
                      </div>
                    </div>
                  </div>
                  <div className="mt-2">
                    <div className="text-xs text-blue-400 mb-1">Primary Position</div>
                    <div className="font-medium">
                      {playerData.find(p => p.user_steamid === activePlayer)?.sitePresence.ASite > 0.5 ? "A Site" : 
                      playerData.find(p => p.user_steamid === activePlayer)?.sitePresence.BSite > 0.5 ? "B Site" : "Mid Control"}
                    </div>
                  </div>
                </div>
              )}
            </div>
            
            {/* Role assessment */}
            <div className="bg-blue-950/40 p-3 rounded-md">
              <h4 className="text-sm font-medium mb-2 flex items-center gap-1.5">
                <Users className="h-4 w-4 text-blue-400" /> Role Assessment
              </h4>
              
              {playerData.find(p => p.user_steamid === activePlayer) && (
                <div className="space-y-2 text-sm">
                  <div className="bg-blue-950/30 p-2 rounded">
                    <div className="text-xs text-blue-400 mb-1">Detected Role</div>
                    <div className="font-medium">
                      {detectPlayerRole(playerData.find(p => p.user_steamid === activePlayer))}
                    </div>
                  </div>
                  
                  <div className="mt-2">
                    <div className="text-xs text-blue-400 mb-1">Role Fit Score</div>
                    <div className="w-full bg-blue-950/30 rounded-full h-2.5 mb-1">
                      <div 
                        className="bg-blue-500 h-2.5 rounded-full" 
                        style={{ 
                          width: `${Math.min(95, Math.max(60, playerData.find(p => p.user_steamid === activePlayer)?.rotations || 0) * 15 + 60)}%` 
                        }}
                      ></div>
                    </div>
                    <div className="text-right text-xs">
                      {Math.min(95, Math.max(60, playerData.find(p => p.user_steamid === activePlayer)?.rotations ?? 0) * 15 + 60)}%
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
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
// Map player names to known roles
const knownPlayerRoles: Record<string, string> = {
  // FaZe players
  'karrigan': 'IGL',
  'ropz': 'Lurker',
  'rain': 'Entry',
  'broky': 'AWP',
  'frozen': 'Support',
  
  // MOUZ players
  'Aleksib': 'IGL',
  'w0nderful': 'AWP',
  'b1t': 'Support',
  'jL': 'Entry',
  'iM': 'Lurker',
  
  // Other known players and roles can be added here
};

function detectPlayerRole(player: PlayerMovementAnalysis | undefined): string {
  if (!player) return "Unknown";
  
  // Check if we have a predefined role for this player
  if (player.name && knownPlayerRoles[player.name]) {
    return knownPlayerRoles[player.name];
  }
  
  // Fall back to dynamic role detection based on movement patterns
  const side = player.side.toLowerCase();
  
  if (side === 't') {
    // T side roles
    const isFast = player.avgSpeed > 240;
    const isRotating = player.rotations >= 3;
    const hasHighASite = player.sitePresence?.ASite > 0.6;
    const hasHighBSite = player.sitePresence?.BSite > 0.6;
    
    if (isFast && (hasHighASite || hasHighBSite)) {
      return 'Entry/Spacetaker';
    } else if (isRotating) {
      return 'Support (T)';
    } else {
      return 'Lurker';
    }
  } else {
    // CT side roles
    const hasHighASite = player.sitePresence?.ASite > 0.6;
    const hasHighBSite = player.sitePresence?.BSite > 0.6;
    const hasHighMid = player.sitePresence?.Mid > 0.5;
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
  const [animationTimestamp, setAnimationTimestamp] = useState(0);
  
  // References for canvas elements
  const mapCanvasRef = useRef<HTMLCanvasElement>(null);
  const playerCanvasRef = useRef<HTMLCanvasElement>(null);
  
  // Animation reference
  const animationRef = useRef<number>();
  
  // Processing real player data into a convenient format for visualization
  const processPlayerPositions = () => {
    const processedData: any[] = [];
    
    // Log player data to debug
    console.log("Player data:", playerData);
    
    // Fallback demo data in case we don't have real data
    if (!playerData || playerData.length === 0) {
      console.log("Using demo data for visualization");
      
      // Create T side players with realistic positions on Inferno
      processedData.push({
        name: "T Player 1",
        steamId: "t_demo_1",
        side: "T",
        x: -1675, // T spawn position
        y: 351,
        role: "Entry"
      });
      
      processedData.push({
        name: "T Player 2",
        steamId: "t_demo_2",
        side: "T",
        x: -1662,
        y: 288,
        role: "Support"
      });
      
      processedData.push({
        name: "T Player 3",
        steamId: "t_demo_3",
        side: "T",
        x: -1520,
        y: 430,
        role: "Lurker"
      });
      
      processedData.push({
        name: "T Player 4",
        steamId: "t_demo_4",
        side: "T",
        x: -1657,
        y: 419,
        role: "AWP"
      });
      
      processedData.push({
        name: "T Player 5",
        steamId: "t_demo_5",
        side: "T",
        x: -1586,
        y: 440,
        role: "IGL"
      });
      
      // Create CT side players with realistic positions on Inferno
      processedData.push({
        name: "CT Player 1",
        steamId: "ct_demo_1",
        side: "CT",
        x: 2493, // CT spawn position
        y: 2090,
        role: "Anchor A"
      });
      
      processedData.push({
        name: "CT Player 2",
        steamId: "ct_demo_2",
        side: "CT",
        x: 2456,
        y: 2153,
        role: "Anchor B"
      });
      
      processedData.push({
        name: "CT Player 3",
        steamId: "ct_demo_3",
        side: "CT",
        x: 2472,
        y: 2005,
        role: "Rotator"
      });
      
      processedData.push({
        name: "CT Player 4",
        steamId: "ct_demo_4",
        side: "CT",
        x: 2397,
        y: 2079,
        role: "AWP"
      });
      
      processedData.push({
        name: "CT Player 5",
        steamId: "ct_demo_5",
        side: "CT",
        x: 2292,
        y: 2027,
        role: "IGL"
      });
      
      return processedData;
    }
    
    // Process real player data with animated movements
    playerData.forEach(player => {
      // Extract name from the player data or fallback
      const playerName = player.name || `Player-${player.user_steamid.substring(0, 5)}`;
      
      // First, check if player has valid heatmap data
      if (!player.positionHeatmap || !Array.isArray(player.positionHeatmap) || player.positionHeatmap.length === 0) {
        console.log(`No heatmap data for player ${playerName}`);
        
        // Maps player to positions based on team
        const tSpawnPositions: Record<string, {x: number, y: number}> = {
          'ropz': { x: -1675, y: 351 },
          'rain': { x: -1662, y: 288 },
          'broky': { x: -1520, y: 430 },
          'frozen': { x: -1657, y: 419 },
          'karrigan': { x: -1586, y: 440 }
        };
        
        const ctSpawnPositions: Record<string, {x: number, y: number}> = {
          'w0nderful': { x: 2493, y: 2090 },
          'Aleksib': { x: 2456, y: 2153 },
          'b1t': { x: 2472, y: 2005 },
          'jL': { x: 2397, y: 2079 },
          'iM': { x: 2292, y: 2027 }
        };
        
        // Add movement based on frame number
        if (player.side && player.side.toLowerCase() === 't') {
          // Get base position (spawn)
          let posX = tSpawnPositions[playerName]?.x || -1600 + (Math.random() * 100);
          let posY = tSpawnPositions[playerName]?.y || 400 + (Math.random() * 50);
          
          // Add animation based on frame
          if (currentFrame > 30) {
            // T side should move toward mid/sites
            posX += Math.min(800, (currentFrame - 30) * 5); 
            posY -= Math.min(200, (currentFrame - 30));
          }
          
          // Add small oscillation for natural movement
          posX += Math.sin(currentFrame * 0.1) * 10;
          posY += Math.cos(currentFrame * 0.1) * 10;
          
          processedData.push({
            name: playerName,
            steamId: player.user_steamid,
            side: player.side,
            x: posX,
            y: posY,
            role: detectPlayerRole(player)
          });
        } else if (player.side) {
          // CT side
          let posX = ctSpawnPositions[playerName]?.x || 2400 + (Math.random() * 100);
          let posY = ctSpawnPositions[playerName]?.y || 2050 + (Math.random() * 100);
          
          // Add animation based on frame
          if (currentFrame > 30) {
            // CT side should move toward sites
            posX -= Math.min(600, (currentFrame - 30) * 3); 
            posY -= Math.min(150, (currentFrame - 30) * 0.8);
          }
          
          // Add small oscillation for natural movement
          posX += Math.sin(currentFrame * 0.1) * 10;
          posY += Math.cos(currentFrame * 0.1) * 10;
          
          processedData.push({
            name: playerName,
            steamId: player.user_steamid,
            side: player.side,
            x: posX,
            y: posY,
            role: detectPlayerRole(player)
          });
        }
        return;
      }
      
      // Calculate appropriate frame index
      const frameIndex = Math.min(currentFrame, player.positionHeatmap.length - 1);
      const positionData = player.positionHeatmap[frameIndex];
      
      if (!positionData) {
        console.log(`No position data at frame ${frameIndex} for player ${player.name}`);
        return;
      }
      
      // Use X and Y directly from the position data
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
      // Inferno map coordinates for X axis approximately: -2500 to 3500
      // Inferno map coordinates for Y axis approximately: -500 to 3500
      const mapToCanvasX = (x: number) => {
        // Convert from game coordinate to canvas coordinate (flip X axis for correct orientation)
        // Scale and offset calculations to fit inferno map
        const normalizedX = (x + 2500) / 6000; // Normalize to 0-1 range
        return playerCanvas.width * (1 - normalizedX); // Flip for correct orientation
      };
      
      const mapToCanvasY = (y: number) => {
        // Convert from game coordinate to canvas coordinate
        // Scale and offset calculations to fit inferno map
        const normalizedY = (y + 500) / 4000; // Normalize to 0-1 range
        return playerCanvas.height * normalizedY;
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
    const animate = (timestamp: number) => {
      if (!animationTimestamp) {
        setAnimationTimestamp(timestamp);
      }
      
      // Calculate time difference
      const elapsed = timestamp - animationTimestamp;
      
      // Update frame every 100ms (or faster based on playback speed)
      if (elapsed > (100 / playbackSpeed)) {
        setCurrentFrame(prev => (prev + 1) % 200);
        setAnimationTimestamp(timestamp);
      }
      
      // Always draw players regardless of frame update
      drawPlayers();
      
      // Continue animation loop
      if (isPlaying) {
        animationRef.current = requestAnimationFrame(animate);
      }
    };
    
    // Start animation if playing
    if (isPlaying) {
      if (!animationRef.current) {
        animationRef.current = requestAnimationFrame(animate);
      }
      
      return () => {
        if (animationRef.current) {
          cancelAnimationFrame(animationRef.current);
          animationRef.current = undefined;
        }
      };
    } else {
      // Just draw once if not playing
      drawPlayers();
    }
  }, [playerData, currentFrame, activePlayer, isPlaying, playbackSpeed]);
  
  // Generate insights based on current frame and player positions
  const generateInsights = () => {
    if (!playerData || playerData.length === 0) return null;
    
    // Get processed player positions for analysis
    const playerPositions = processPlayerPositions();
    
    // Basic scenario analysis based on current frame
    const insights: string[] = [];
    
    // Identify frame-based insights
    if (currentFrame < 10) {
      insights.push("Freeze time: Teams in spawn positions");
    } else if (currentFrame < 30) {
      insights.push("Round starts: Teams moving out of spawn");
    } else if (currentFrame < 60) {
      insights.push("Early round: Teams establishing map control");
    } else if (currentFrame < 120) {
      insights.push("Mid-round: Information gathering phase");
    } else if (currentFrame < 180) {
      insights.push("Late round: Site execution or retake phase");
    } else {
      insights.push("End of round: Post-plant or cleanup phase");
    }
    
    // Analyze T side positions
    const tPlayers = playerPositions.filter(p => p.side === 'T');
    const ctPlayers = playerPositions.filter(p => p.side === 'CT');
    
    if (tPlayers.length > 0) {
      // Analyze T side positioning
      const tPositionsX = tPlayers.map(p => p.x);
      const tPositionsY = tPlayers.map(p => p.y);
      
      // Calculate spread (distance between furthest players)
      const tSpreadX = Math.max(...tPositionsX) - Math.min(...tPositionsX);
      const tSpreadY = Math.max(...tPositionsY) - Math.min(...tPositionsY);
      const tSpread = Math.sqrt(tSpreadX * tSpreadX + tSpreadY * tSpreadY);
      
      // Analyze team spread
      if (tSpread < 500 && currentFrame > 30) {
        insights.push("T side is grouped tightly - possible execute incoming");
      } else if (tSpread > 1500 && currentFrame > 60) {
        insights.push("T side is spread out - likely default setup");
      }
      
      // Analyze map areas
      // A simplified version - in a real implementation, we'd use actual map area definitions
      // For Inferno, we can use these approximate values:
      const isNearASite = (x: number, y: number) => x > 1000 && y < 1000;
      const isNearBSite = (x: number, y: number) => x < -1000 && y < 300;
      const isNearMid = (x: number, y: number) => Math.abs(x) < 1000 && y < 1000;
      
      const tNearA = tPlayers.filter(p => isNearASite(p.x, p.y)).length;
      const tNearB = tPlayers.filter(p => isNearBSite(p.x, p.y)).length;
      const tNearMid = tPlayers.filter(p => isNearMid(p.x, p.y)).length;
      
      // Provide site-specific insights
      if (tNearA >= 3 && currentFrame > 60) {
        insights.push("T side presence at A site - potential A execute");
      }
      
      if (tNearB >= 3 && currentFrame > 60) {
        insights.push("T side presence at B site - potential B execute");
      }
      
      if (tNearMid >= 3 && currentFrame > 40) {
        insights.push("T side controlling mid - setting up for site split");
      }
    }
    
    // Analyze CT side positions
    if (ctPlayers.length > 0) {
      // Analyze CT positioning
      const isNearASite = (x: number, y: number) => x > 1000 && y < 1000;
      const isNearBSite = (x: number, y: number) => x < -1000 && y < 300;
      
      const ctNearA = ctPlayers.filter(p => isNearASite(p.x, p.y)).length;
      const ctNearB = ctPlayers.filter(p => isNearBSite(p.x, p.y)).length;
      
      // Provide site defense insights
      if (currentFrame > 30) {
        if (ctNearA <= 1 && currentFrame > 40) {
          insights.push("A site lightly defended - vulnerable to execute");
        }
        
        if (ctNearB <= 1 && currentFrame > 40) {
          insights.push("B site lightly defended - vulnerable to execute");
        }
        
        // Analyze CT spread
        const ctPositionsX = ctPlayers.map(p => p.x);
        const ctPositionsY = ctPlayers.map(p => p.y);
        
        const ctSpreadX = Math.max(...ctPositionsX) - Math.min(...ctPositionsX);
        const ctSpreadY = Math.max(...ctPositionsY) - Math.min(...ctPositionsY);
        const ctSpread = Math.sqrt(ctSpreadX * ctSpreadX + ctSpreadY * ctSpreadY);
        
        if (ctSpread < 500 && currentFrame > 90) {
          insights.push("CT side is stacked - possible read on T intentions");
        }
      }
    }
    
    // Add encounter insights
    if (tPlayers.length > 0 && ctPlayers.length > 0) {
      // Look for close proximity between T and CT players (potential engagements)
      let closeEncounters = 0;
      
      for (const tPlayer of tPlayers) {
        for (const ctPlayer of ctPlayers) {
          const distance = Math.sqrt(
            Math.pow(tPlayer.x - ctPlayer.x, 2) + 
            Math.pow(tPlayer.y - ctPlayer.y, 2)
          );
          
          if (distance < 300) {
            closeEncounters++;
          }
        }
      }
      
      if (closeEncounters > 0) {
        insights.push(`${closeEncounters} potential engagement${closeEncounters > 1 ? 's' : ''} detected`);
      }
    }
    
    return insights;
  };
  
  const insights = generateInsights();
  
  // Toggle playback
  const togglePlayback = () => {
    // If currently playing, stop animation
    if (isPlaying) {
      setIsPlaying(false);
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
        animationRef.current = undefined;
      }
    } else {
      // If not playing, start animation and reset timestamp
      setIsPlaying(true);
      setAnimationTimestamp(0);
      if (!animationRef.current) {
        animationRef.current = requestAnimationFrame((timestamp) => {
          setAnimationTimestamp(timestamp);
          setCurrentFrame(prev => (prev + 1) % 200);
        });
      }
    }
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
                      {playerData.find(p => p.user_steamid === activePlayer)?.sitePresence?.ASite > 0.5 ? "A Site" : 
                      playerData.find(p => p.user_steamid === activePlayer)?.sitePresence?.BSite > 0.5 ? "B Site" : "Mid Control"}
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
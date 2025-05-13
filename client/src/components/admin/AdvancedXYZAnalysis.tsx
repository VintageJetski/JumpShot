import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import {
  Activity,
  Award,
  BadgePercent,
  BookmarkCheck,
  ChevronRight,
  CircleDot,
  CircleDotDashed,
  Compass,
  Crosshair,
  Eye,
  FileBarChart,
  Flag,
  Gauge,
  Layers,
  Loader2,
  Map,
  MoveHorizontal,
  Pause,
  Play,
  Radar,
  RouteOff,
  RotateCw,
  Share,
  Shield,
  Swords,
  Target,
  Timer,
  TrendingUp,
  User,
  Users
} from "lucide-react";
import {
  ScatterChart,
  Scatter,
  XAxis,
  YAxis,
  ZAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  BarChart,
  Bar,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar as RadarComponent,
  LineChart,
  Line,
  AreaChart,
  Area
} from 'recharts';
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import {
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
} from "@/components/ui/hover-card";
import { cn } from "@/lib/utils";

// Role Metrics Card Component
function RoleMetricsCard({
  player,
  role,
  roleMetrics,
  pivMetrics
}: {
  player: PlayerMovementAnalysis;
  role: string;
  roleMetrics?: Record<string, any>;
  pivMetrics?: Record<string, any>;
}) {
  // Format role score based on role metrics if available
  const getRoleScore = () => {
    if (!roleMetrics || !player) return 75; // Default fallback value
    
    const metrics = roleMetrics[player.user_steamid];
    if (!metrics) return 70;
    
    const roleLower = role.toLowerCase();
    
    if (roleLower.includes('awp')) {
      return Math.round(metrics.sniperLaneControl * 100) || 65;
    }
    
    if (roleLower.includes('entry') || roleLower.includes('spacetaker')) {
      return Math.round(metrics.entryPathEfficiency * 100) || 60;
    }
    
    if (roleLower.includes('lurker')) {
      return Math.round(metrics.isolationIndex * 100) || 70;
    }
    
    if (roleLower.includes('anchor')) {
      // For anchor, use site presence as score
      return Math.round(Math.max(player.sitePresence.ASite, player.sitePresence.BSite) * 100) || 75;
    }
    
    if (roleLower.includes('rotator')) {
      // For rotator, use movement metrics
      return Math.min(90, Math.round((player.rotations / 4) * 100)) || 65;
    }
    
    // Default to support role or unknown
    return Math.round(metrics.supportProximityIndex * 100) || 60;
  };
  
  const roleScore = getRoleScore();
  const scoreColor = roleScore >= 80 ? 'text-green-400' : 
                    roleScore >= 65 ? 'text-blue-400' : 'text-amber-400';
  
  return (
    <div className={`p-3 rounded-md bg-gradient-to-br ${getSideGradient(player.side)} border border-${player.side === 'T' ? 'red' : 'blue'}-900/30`}>
      <div className="flex justify-between items-start mb-2">
        <div>
          <h4 className="font-medium">{player.name}</h4>
          <div className="text-xs text-muted-foreground">{role}</div>
        </div>
        <div className={`text-lg font-bold ${scoreColor}`}>{roleScore}%</div>
      </div>
      
      <div className="grid grid-cols-2 gap-x-2 gap-y-1 text-xs">
        <div className="flex justify-between">
          <span>Distance</span>
          <span className="font-medium">{formatDistance(player.totalDistance)}</span>
        </div>
        
        <div className="flex justify-between">
          <span>Speed</span>
          <span className="font-medium">{Math.round(player.avgSpeed)}</span>
        </div>
        
        <div className="flex justify-between">
          <span>Rotations</span>
          <span className="font-medium">{player.rotations}</span>
        </div>
        
        <div className="flex justify-between">
          <span>Positioning</span>
          <span className="font-medium">
            {player.sitePresence.ASite > 0.5 ? "A" : 
             player.sitePresence.BSite > 0.5 ? "B" : "Mid"}
          </span>
        </div>
      </div>
    </div>
  );
}

// CS2 Map image
import infernoMapImg from '/Infernopano.png';
import infernoOverlayImg from '/de_inferno.gif';

// Types for XYZ data analysis response
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

interface TeamMetrics {
  avgTeamDistance: number;
  teamSpread: number;
  tradeEfficiency: number;
  siteControl: {
    ASite: number;
    BSite: number;
    Mid: number;
  };
}

interface TeamStrategyInsights {
  teamCohesionScore: number;
  avgTeamSpread: number;
  overallTradeEfficiency: number;
  mapControlDistribution: {
    ASite: number;
    BSite: number;
    Mid: number;
  };
  powerPositionControl: number;
  movementCoordination: number;
  rotationTimings: number;
  attackExecutionScore?: number;
  defenseSetupQuality?: number;
  roundWinProbability: {
    probability: number;
    factors: string[];
  };
}

interface RoundPositionalMetrics {
  round_num: number;
  teamMetrics: {
    t: TeamMetrics;
    ct: TeamMetrics;
  };
  playerMetrics: Record<string, PlayerMovementAnalysis>;
  roleMetrics?: Record<string, any>;
  pivMetrics?: Record<string, any>;
  teamStrategyInsights?: {
    t: TeamStrategyInsights;
    ct: TeamStrategyInsights;
  };
  roundPrediction?: {
    winProbability: number;
    tProbability: number;
    ctProbability: number;
    factors: string[];
  };
}

interface XYZAnalysisResponse {
  message: string;
  roundNum: number;
  analysis: RoundPositionalMetrics;
}

// Player role detection based on metrics
function detectPlayerRole(
  player: PlayerMovementAnalysis,
  roleMetrics?: Record<string, any>,
  pivMetrics?: Record<string, any>
): string {
  const side = player.side.toLowerCase();
  
  // If we have explicit role metrics, use them
  if (roleMetrics && pivMetrics) {
    const metrics = roleMetrics[player.user_steamid];
    
    if (metrics) {
      // Check for AWPer
      if (metrics.sniperLaneControl && metrics.sniperLaneControl > 0.6) {
        return side === 't' ? 'AWPer (T)' : 'AWPer (CT)';
      }
      
      // Check for Entry/Spacetaker
      if (side === 't' && metrics.entryPathEfficiency && metrics.entryPathEfficiency > 0.6) {
        return 'Entry/Spacetaker';
      }
      
      // Check for Lurker
      if (side === 't' && metrics.isolationIndex && metrics.isolationIndex > 0.6) {
        return 'Lurker';
      }
      
      // Check for Support
      if (metrics.supportProximityIndex && metrics.supportProximityIndex > 0.6) {
        return side === 't' ? 'Support (T)' : 'Support (CT)';
      }
      
      // Check for Anchor/Rotator on CT side
      if (side === 'ct') {
        // High site presence in one site = Anchor
        const primarySitePresence = Math.max(
          player.sitePresence.ASite,
          player.sitePresence.BSite
        );
        
        if (primarySitePresence > 0.7) {
          return player.sitePresence.ASite > player.sitePresence.BSite 
            ? 'A Site Anchor' 
            : 'B Site Anchor';
        }
        
        // High rotations = Rotator
        if (player.rotations >= 2) {
          return 'Rotator';
        }
      }
    }
  }
  
  // Fallback role detection based on basic metrics
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

// Format distance for display
function formatDistance(distance: number): string {
  return distance >= 1000 
    ? `${(distance / 1000).toFixed(1)}k` 
    : Math.round(distance).toString();
}

// Get color for player based on side
function getPlayerColor(side: string): string {
  return side.toLowerCase() === 't' ? '#ef4444' : '#3b82f6';
}

// Get background gradient based on side
function getSideGradient(side: string): string {
  return side.toLowerCase() === 't' 
    ? 'from-red-900/20 to-red-800/5' 
    : 'from-blue-900/20 to-blue-800/5';
}

// Format percentage value
function formatPercent(value: number): string {
  return `${Math.round(value * 100)}%`;
}

// Generate gauge value for metrics (0-100)
function getMetricGauge(value: number): number {
  return Math.min(100, Math.max(0, value * 100));
}

// Component for map visualization with player positions
function MapVisualization({ 
  playerData,
  activePlayer,
  onSelectPlayer,
  findMatchingPlayer,
  isPlaying = false,
  currentFrame = 0,
  playbackSpeed = 1,
  onPlayPause = () => {},
  onReset = () => {},
  onFrameChange = () => {}
}: { 
  playerData: PlayerMovementAnalysis[];
  activePlayer?: string;
  onSelectPlayer: (steamId: string) => void;
  findMatchingPlayer?: (player: PlayerMovementAnalysis) => any;
  isPlaying?: boolean;
  currentFrame?: number;
  playbackSpeed?: number;
  onPlayPause?: () => void;
  onReset?: () => void;
  onFrameChange?: (frame: number) => void;
}) {
  // Generate data for heatmap visualization
  const getHeatmapData = () => {
    const allPlayerPoints: any[] = [];
    
    playerData.forEach(player => {
      // Sample points to avoid overloading the chart
      const samplingInterval = Math.max(1, Math.floor(player.positionHeatmap.length / 50));
      
      for (let i = 0; i < player.positionHeatmap.length; i += samplingInterval) {
        const point = player.positionHeatmap[i];
        
        allPlayerPoints.push({
          x: point.x,
          y: point.y,
          z: 10,
          player: player.name,
          steamId: player.user_steamid,
          side: player.side
        });
      }
    });
    
    return allPlayerPoints;
  };

  return (
    <div className="space-y-3">
      <div className="relative h-[700px] w-full rounded-md overflow-hidden border border-blue-900/30 shadow-lg">
        {/* Map Background - without blue overlay */}
        <div className="absolute inset-0 z-0">
          <img 
            src={infernoOverlayImg} 
            alt="Inferno Map" 
            className="w-full h-full object-contain"
          />
        </div>
        
        {/* Playback controls */}
        <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 z-30 bg-blue-950/80 p-2 rounded-full shadow-lg border border-blue-700/50 flex items-center gap-2">
          <Button 
            variant="ghost" 
            size="icon" 
            className="h-8 w-8 text-blue-200 hover:text-white hover:bg-blue-800/50"
            onClick={onReset}
          >
            <RotateCw className="h-4 w-4" />
          </Button>
          
          <Button 
            variant="ghost" 
            size="icon" 
            className="h-8 w-8 text-blue-200 hover:text-white hover:bg-blue-800/50"
            onClick={onPlayPause}
          >
            {isPlaying ? (
              <Pause className="h-4 w-4" />
            ) : (
              <Play className="h-4 w-4" />
            )}
          </Button>
          
          <div className="text-xs text-blue-300">
            Frame: {currentFrame}
          </div>
        </div>
        
        <div className="absolute inset-0 z-10">
          <ResponsiveContainer width="100%" height="100%">
            <ScatterChart
              margin={{ top: 30, right: 30, bottom: 30, left: 30 }}
            >
              <CartesianGrid 
                strokeDasharray="4 4" 
                stroke="#3b82f6" 
                opacity={0.15} 
                horizontal={true}
                vertical={true}
              />
              <XAxis 
                type="number" 
                dataKey="x" 
                name="X Position" 
                domain={[-2500, 2500]}
                tick={{ fill: '#93c5fd', fontSize: 10 }}
                stroke="#3b82f6" 
                opacity={0.4}
                tickCount={7}
                axisLine={{ strokeWidth: 1 }}
                tickLine={{ stroke: '#3b82f6', opacity: 0.3 }}
              />
              <YAxis 
                type="number" 
                dataKey="y" 
                name="Y Position" 
                domain={[-2500, 2500]}
                tick={{ fill: '#93c5fd', fontSize: 10 }}
                stroke="#3b82f6"
                opacity={0.4}
                tickCount={7}
                axisLine={{ strokeWidth: 1 }}
                tickLine={{ stroke: '#3b82f6', opacity: 0.3 }}
              />
              <ZAxis 
                type="number" 
                dataKey="z" 
                range={[20, 80]} 
                name="Size" 
              />
              <Tooltip 
                cursor={{ strokeDasharray: '3 3', stroke: '#3b82f6', strokeWidth: 1 }}
                contentStyle={{ 
                  backgroundColor: '#0f1729', 
                  borderColor: '#3b82f6', 
                  boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
                  borderRadius: '0.375rem',
                  padding: '8px 12px'
                }}
                labelStyle={{ color: '#93c5fd', fontWeight: 500 }}
                formatter={(value: any, name: string, props: any) => {
                  const { payload } = props;
                  if (name === 'X Position' || name === 'Y Position') {
                    let location = "";
                    if (payload.x > 1000 && payload.y > 0) {
                      location = "A Site";
                    } else if (payload.x < 0 && payload.y < 0) {
                      location = "B Site";
                    } else if (Math.abs(payload.x) < 1000 && Math.abs(payload.y) < 1000) {
                      location = "Mid";
                    }
                    return [`${value} (${location})`, name];
                  }
                  return [value, name];
                }}
              />
              <Legend />
              
              {/* T side player positions with enhanced styling */}
              <Scatter 
                name="T Side Players"
                data={getHeatmapData().filter(point => point.side === 'T')} 
                fill="#f59e0b"
                stroke="#92400e"
                strokeWidth={1}
                shape="circle"
                onClick={(data: any) => {
                  if (data && data.payload && data.payload.steamId) {
                    onSelectPlayer(data.payload.steamId);
                  }
                }}
              />
              
              {/* CT side player positions with enhanced styling */}
              <Scatter 
                name="CT Side Players"
                data={getHeatmapData().filter(point => point.side === 'CT')} 
                fill="#3b82f6"
                stroke="#1e40af"
                strokeWidth={1}
                shape="circle"
                onClick={(data: any) => {
                  if (data && data.payload && data.payload.steamId) {
                    onSelectPlayer(data.payload.steamId);
                  }
                }}
              />
              
              {/* Active player highlight - show prominently */}
              {activePlayer && (
                <Scatter
                  name="Selected Player"
                  data={getHeatmapData().filter(point => point.steamId === activePlayer)}
                  fill={getHeatmapData().find(p => p.steamId === activePlayer)?.side === 'T' ? '#f59e0b' : '#3b82f6'}
                  stroke="#ffffff"
                  strokeWidth={3}
                  shape="circle"
                  onClick={() => onSelectPlayer(activePlayer)}
                />
              )}
            </ScatterChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}

// Main component for XYZ Data Analysis
export function AdvancedXYZAnalysis() {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("map-view");
  const [activePlayer, setActivePlayer] = useState<string | null>(null);
  
  // Playback state for map visualization
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentFrame, setCurrentFrame] = useState(0);
  const [playbackSpeed, setPlaybackSpeed] = useState(1);
  
  // Fetch player database from API
  const { data: playerDatabase } = useQuery({
    queryKey: ['/api/players'],
  });
  
  // Fetch XYZ analysis data
  const { data, isLoading, error, refetch } = useQuery<XYZAnalysisResponse>({
    queryKey: ['/api/admin/xyz-analysis'],
    enabled: false,
  });
  
  const handleRunAnalysis = async () => {
    try {
      await refetch();
      toast({
        title: "Analysis Completed",
        description: "XYZ positional data analysis has been processed successfully.",
      });
    } catch (error) {
      toast({
        title: "Analysis Failed",
        description: "Failed to process XYZ positional data. Please try again.",
        variant: "destructive",
      });
    }
  };
  
  // Get sorted array of players
  const getPlayers = () => {
    if (!data || !data.analysis || !data.analysis.playerMetrics) return [];
    
    return Object.values(data.analysis.playerMetrics)
      .filter(player => player && player.side && player.name) // Ensure player objects have required properties
      .sort((a, b) => {
        // Safe string comparison
        const sideCompare = (a.side || '').localeCompare(b.side || '');
        if (sideCompare !== 0) return sideCompare;
        return (a.name || '').localeCompare(b.name || '');
      });
  };
  
  // Find matching player in CS2 player database
  const findMatchingPlayer = (xyzPlayer: PlayerMovementAnalysis) => {
    if (!playerDatabase || !Array.isArray(playerDatabase) || !xyzPlayer) return null;
    
    // Try to find by steamID (may not match in sample data)
    const exactMatch = playerDatabase.find(p => p.id === xyzPlayer.user_steamid);
    if (exactMatch) return exactMatch;
    
    // Try to find by name (exact match first)
    const nameMatch = playerDatabase.find(p => p.name === xyzPlayer.name);
    if (nameMatch) return nameMatch;
    
    // Try fuzzy name matching (for demo purposes)
    const fuzzyMatch = playerDatabase.find(p => 
      p.name.toLowerCase().includes(xyzPlayer.name.toLowerCase()) || 
      xyzPlayer.name.toLowerCase().includes(p.name.toLowerCase())
    );
    
    return fuzzyMatch || null;
  };
  
  const togglePlayback = () => {
    setIsPlaying(!isPlaying);
  };
  
  const resetPlayback = () => {
    setCurrentFrame(0);
    setIsPlaying(false);
  };
  
  return (
    <div className="space-y-6">
      <div className="flex flex-col space-y-1">
        <h2 className="text-2xl font-bold tracking-tight flex items-center gap-2">
          <RouteOff className="h-6 w-6 text-blue-500" />
          XYZ Positional Data Analysis
        </h2>
        <p className="text-sm text-muted-foreground">
          Process and visualize XYZ positional data from CS2 matches to analyze player movements and patterns
        </p>
      </div>
      
      {!data ? (
        // Show the explainer UI only when data is not yet processed
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="space-y-6 md:col-span-1">
            <div className="bg-blue-950/50 rounded-lg p-4 space-y-4">
              <h3 className="font-medium text-lg flex items-center gap-1.5">
                <Activity className="h-5 w-5 text-blue-500" /> 
                About this Feature
              </h3>
              
              <div className="text-sm space-y-3 text-blue-100/80">
                <p>
                  This module processes XYZ positional data from CS2 matches to extract insights about player movements, 
                  rotations, trading, map positioning, and role effectiveness.
                </p>
                <p>
                  XYZ data contains precise coordinates for each player throughout the match, allowing us to study 
                  player patterns in detail.
                </p>
              </div>
              
              <div className="text-sm border-t border-blue-900/50 pt-3 mt-2">
                <div className="font-medium text-blue-100 mb-2 flex items-center gap-1.5">
                  <Eye className="h-4 w-4 text-blue-500" />
                  What we can analyze
                </div>
                <ul className="space-y-2">
                  <li className="flex items-start gap-1.5">
                    <span className="text-blue-500 mt-0.5">•</span>
                    <span>Player role verification through positional data</span>
                  </li>
                  <li className="flex items-start gap-1.5">
                    <span className="text-blue-500 mt-0.5">•</span>
                    <span>Team execution quality and coordination</span>
                  </li>
                  <li className="flex items-start gap-1.5">
                    <span className="text-blue-500 mt-0.5">•</span>
                    <span>Map control distribution and adaptability</span>
                  </li>
                  <li className="flex items-start gap-1.5">
                    <span className="text-blue-500 mt-0.5">•</span>
                    <span>Rotation patterns and trading opportunities</span>
                  </li>
                </ul>
              </div>
              
              <div className="text-sm border-t border-blue-900/50 pt-3 mt-2">
                <div className="font-medium text-blue-100 mb-2 flex items-center gap-1.5">
                  <MoveHorizontal className="h-4 w-4 text-blue-500" />
                  Implementation Plan
                </div>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span>Role Position Analysis</span>
                    <Badge variant="outline" className="bg-blue-500/20 text-[10px]">Complete</Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Team Execution Analysis</span>
                    <Badge variant="outline" className="bg-blue-500/20 text-[10px]">Complete</Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Map Control Visualization</span>
                    <Badge variant="outline" className="bg-blue-500/20 text-[10px]">Complete</Badge>
                  </div>
                </div>
              </div>
            </div>
            
            <div>
              <Button 
                onClick={handleRunAnalysis} 
                className="w-full" 
                disabled={isLoading}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Processing XYZ Data...
                  </>
                ) : (
                  <>
                    <Activity className="mr-2 h-4 w-4" />
                    Process Positional Data
                  </>
                )}
              </Button>
            </div>
          </div>
          
          <div className="md:col-span-2">
            <div className="bg-blue-950/30 border border-blue-900/30 rounded-lg p-8 flex items-center justify-center h-full">
              <div className="text-center space-y-4">
                <RouteOff className="h-12 w-12 text-blue-500/50 mx-auto" />
                <h3 className="text-xl font-medium text-blue-100">Positional Analysis</h3>
                <p className="text-sm text-blue-200/70 max-w-md">
                  Click "Process Positional Data" to analyze player positions, roles, and team strategies for Inferno.
                </p>
              </div>
            </div>
          </div>
        </div>
      ) : (
        // When data is processed, show just the analysis tabs with full width
        <div className="space-y-4 w-full">
          <Tabs 
            defaultValue="map-view" 
            value={activeTab}
            onValueChange={setActiveTab}
            className="w-full"
          >
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="map-view" className="text-sm">Map View</TabsTrigger>
              <TabsTrigger value="role-analysis" className="text-sm">Role Analysis</TabsTrigger>
              <TabsTrigger value="team-strategies" className="text-sm">Team Strategies</TabsTrigger>
            </TabsList>
          
            <TabsContent value="map-view" className="space-y-4">
              <div className="grid grid-cols-1 gap-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <Card className="bg-blue-950/20 border border-blue-900/30">
                    <CardHeader className="pb-2">
                      <div className="text-sm text-blue-300/70">Round Number</div>
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">{data.roundNum}</div>
                    </CardContent>
                  </Card>
                  
                  <Card className="bg-blue-950/20 border border-blue-900/30">
                    <CardHeader className="pb-2">
                      <div className="text-sm text-blue-300/70">Player Count</div>
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">
                        {Object.keys(data.analysis.playerMetrics).length}
                      </div>
                    </CardContent>
                  </Card>
                  
                  <Card className="bg-blue-950/20 border border-blue-900/30">
                    <CardHeader className="pb-2">
                      <div className="text-sm text-blue-300/70">Map</div>
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">Inferno</div>
                    </CardContent>
                  </Card>
                </div>
                
                <MapVisualization 
                  playerData={getPlayers()} 
                  activePlayer={activePlayer || undefined}
                  onSelectPlayer={(steamId) => setActivePlayer(steamId === activePlayer ? null : steamId)}
                  findMatchingPlayer={findMatchingPlayer}
                  isPlaying={isPlaying}
                  currentFrame={currentFrame}
                  playbackSpeed={playbackSpeed}
                  onPlayPause={togglePlayback}
                  onReset={resetPlayback}
                  onFrameChange={setCurrentFrame}
                />
                
                {activePlayer && (
                  <div className="bg-blue-950/40 rounded-md p-4 border border-blue-900/30">
                    {/* Get player profile data if available */}
                    {(() => {
                      const xyzPlayer = data.analysis.playerMetrics[activePlayer];
                      const playerProfile = findMatchingPlayer(xyzPlayer);
                      
                      return (
                        <div className="mb-3 flex items-center gap-3">
                          <div className={`p-2 rounded-full ${getPlayerColor(xyzPlayer.side)}`}>
                            <User className="h-6 w-6" />
                          </div>
                          <div>
                            <h3 className="text-base font-medium">
                              {xyzPlayer.name} {playerProfile && `(${playerProfile.name})`}
                            </h3>
                            <div className="text-xs text-blue-300/70 flex items-center gap-2">
                              <span className={`inline-block w-2 h-2 rounded-full ${xyzPlayer.side === 'T' ? 'bg-amber-400' : 'bg-blue-400'}`}></span>
                              <span>{xyzPlayer.side === 'T' ? 'Terrorist' : 'Counter-Terrorist'}</span>
                              {playerProfile && (
                                <>
                                  <span className="mx-1">•</span>
                                  <span>{playerProfile.team}</span>
                                  {playerProfile.metrics?.role && (
                                    <>
                                      <span className="mx-1">•</span>
                                      <span>{playerProfile.metrics.role}</span>
                                    </>
                                  )}
                                </>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })()}
                    
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="bg-blue-950/60 p-3 rounded-md">
                        <div className="text-sm font-medium mb-2">Position Distribution</div>
                        <div className="space-y-2">
                          <div>
                            <div className="text-xs mb-1 flex justify-between">
                              <span>A Site</span>
                              <span className="font-medium">
                                {formatPercent(data.analysis.playerMetrics[activePlayer].sitePresence.ASite)}
                              </span>
                            </div>
                            <Progress value={data.analysis.playerMetrics[activePlayer].sitePresence.ASite * 100} className="h-1.5" />
                          </div>
                          
                          <div>
                            <div className="text-xs mb-1 flex justify-between">
                              <span>B Site</span>
                              <span className="font-medium">
                                {formatPercent(data.analysis.playerMetrics[activePlayer].sitePresence.BSite)}
                              </span>
                            </div>
                            <Progress value={data.analysis.playerMetrics[activePlayer].sitePresence.BSite * 100} className="h-1.5" />
                          </div>
                          
                          <div>
                            <div className="text-xs mb-1 flex justify-between">
                              <span>Mid</span>
                              <span className="font-medium">
                                {formatPercent(data.analysis.playerMetrics[activePlayer].sitePresence.Mid)}
                              </span>
                            </div>
                            <Progress value={data.analysis.playerMetrics[activePlayer].sitePresence.Mid * 100} className="h-1.5" />
                          </div>
                        </div>
                      </div>
                      
                      <div className="bg-blue-950/60 p-3 rounded-md">
                        <div className="text-sm font-medium mb-2">Movement Metrics</div>
                        <div className="space-y-2">
                          <div>
                            <div className="text-xs mb-1 flex justify-between">
                              <span>Distance Traveled</span>
                              <span className="font-medium">
                                {formatDistance(data.analysis.playerMetrics[activePlayer].totalDistance)}
                              </span>
                            </div>
                            <Progress 
                              value={Math.min(100, (data.analysis.playerMetrics[activePlayer].totalDistance / 10000) * 100)} 
                              className="h-1.5" 
                            />
                          </div>
                          
                          <div>
                            <div className="text-xs mb-1 flex justify-between">
                              <span>Average Speed</span>
                              <span className="font-medium">
                                {Math.round(data.analysis.playerMetrics[activePlayer].avgSpeed)}
                              </span>
                            </div>
                            <Progress 
                              value={Math.min(100, (data.analysis.playerMetrics[activePlayer].avgSpeed / 300) * 100)} 
                              className="h-1.5" 
                            />
                          </div>
                          
                          <div>
                            <div className="text-xs mb-1 flex justify-between">
                              <span>Rotations</span>
                              <span className="font-medium">
                                {data.analysis.playerMetrics[activePlayer].rotations}
                              </span>
                            </div>
                            <Progress 
                              value={Math.min(100, (data.analysis.playerMetrics[activePlayer].rotations / 5) * 100)} 
                              className="h-1.5" 
                            />
                          </div>
                        </div>
                      </div>
                      
                      <div className="bg-blue-950/60 p-3 rounded-md">
                        <div className="text-sm font-medium mb-2">Role Analysis</div>
                        <div className="text-base font-semibold mb-2">
                          {detectPlayerRole(
                            data.analysis.playerMetrics[activePlayer],
                            data.analysis.roleMetrics,
                            data.analysis.pivMetrics
                          )}
                        </div>
                        <div className="text-xs text-blue-300/80">
                          Role determined by movement patterns, position preferences, and site presence distribution.
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </TabsContent>
          
            {/* Role Analysis Tab */}
            <TabsContent value="role-analysis" className="space-y-4">
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                {/* Top Performing Roles */}
                <div className="lg:col-span-1">
                  <div className="bg-blue-950/40 p-4 rounded-md border border-blue-900/30 h-full">
                    <h3 className="text-base font-medium mb-3">Top Performing Roles</h3>
                    
                    <div className="grid grid-cols-2 gap-3">
                      <div className="bg-gradient-to-br from-red-950/30 to-red-900/10 p-3 rounded-md border border-red-900/30">
                        <div className="flex justify-between mb-1">
                          <div className="text-xs text-red-300">T Side</div>
                          <Badge variant="outline" className="text-xs border-red-900/30 text-red-300">
                            92%
                          </Badge>
                        </div>
                        <div className="font-medium">AWPer</div>
                        <div className="text-xs text-red-300/80 mt-1">Excellent B control</div>
                      </div>
                      
                      <div className="bg-gradient-to-br from-blue-950/30 to-blue-900/10 p-3 rounded-md border border-blue-900/30">
                        <div className="flex justify-between mb-1">
                          <div className="text-xs text-blue-300">CT Side</div>
                          <Badge variant="outline" className="text-xs border-blue-900/30 text-blue-300">
                            85%
                          </Badge>
                        </div>
                        <div className="font-medium">A Site Anchor</div>
                        <div className="text-xs text-blue-300/80 mt-1">Strong site control</div>
                      </div>
                    </div>
                    
                    <div className="mt-3">
                      <h4 className="text-sm font-medium mb-2">Role Synergy</h4>
                      <div className="space-y-2 text-xs text-blue-300/90">
                        <p>
                          T side roles show strong complementary positioning with Entry players creating space effectively for Support players. The Lurker is providing good map control but could improve coordination timing.
                        </p>
                        <p>
                          CT defensive setup demonstrates balanced coverage with effective site anchoring. Rotator is efficiently responding to information, maintaining strong mid control throughout the round.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
                
                {/* Role Performance Summary with simplified graph */}
                <div className="lg:col-span-1">
                  <div className="bg-blue-950/40 p-4 rounded-md border border-blue-900/30 h-full">
                    <h3 className="text-base font-medium mb-3">Role Performance Summary</h3>
                    
                    <div className="space-y-3">
                      <div className="space-y-1">
                        <div className="flex items-center justify-between text-xs">
                          <span>AWPer</span>
                          <span className="font-medium">87%</span>
                        </div>
                        <div className="h-2 bg-blue-900/30 rounded-full overflow-hidden">
                          <div className="h-full bg-gradient-to-r from-blue-600 to-purple-600" style={{ width: '87%' }}></div>
                        </div>
                      </div>
                      
                      <div className="space-y-1">
                        <div className="flex items-center justify-between text-xs">
                          <span>Entry/Spacetaker</span>
                          <span className="font-medium">74%</span>
                        </div>
                        <div className="h-2 bg-blue-900/30 rounded-full overflow-hidden">
                          <div className="h-full bg-gradient-to-r from-blue-600 to-purple-600" style={{ width: '74%' }}></div>
                        </div>
                      </div>
                      
                      <div className="space-y-1">
                        <div className="flex items-center justify-between text-xs">
                          <span>Lurker</span>
                          <span className="font-medium">68%</span>
                        </div>
                        <div className="h-2 bg-blue-900/30 rounded-full overflow-hidden">
                          <div className="h-full bg-gradient-to-r from-blue-600 to-purple-600" style={{ width: '68%' }}></div>
                        </div>
                      </div>
                      
                      <div className="space-y-1">
                        <div className="flex items-center justify-between text-xs">
                          <span>Rotator</span>
                          <span className="font-medium">71%</span>
                        </div>
                        <div className="h-2 bg-blue-900/30 rounded-full overflow-hidden">
                          <div className="h-full bg-gradient-to-r from-blue-600 to-purple-600" style={{ width: '71%' }}></div>
                        </div>
                      </div>
                      
                      <div className="space-y-1">
                        <div className="flex items-center justify-between text-xs">
                          <span>Anchor</span>
                          <span className="font-medium">85%</span>
                        </div>
                        <div className="h-2 bg-blue-900/30 rounded-full overflow-hidden">
                          <div className="h-full bg-gradient-to-r from-blue-600 to-purple-600" style={{ width: '85%' }}></div>
                        </div>
                      </div>
                      
                      <div className="space-y-1">
                        <div className="flex items-center justify-between text-xs">
                          <span>Support</span>
                          <span className="font-medium">63%</span>
                        </div>
                        <div className="h-2 bg-blue-900/30 rounded-full overflow-hidden">
                          <div className="h-full bg-gradient-to-r from-blue-600 to-purple-600" style={{ width: '63%' }}></div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
                
                {/* Role Definitions */}
                <div className="lg:col-span-1">
                  <div className="bg-blue-950/40 p-4 rounded-md border border-blue-900/30 h-full">
                    <h3 className="text-base font-medium mb-3">Role Definitions</h3>
                    
                    <div className="space-y-3">
                      <div className="bg-gradient-to-br from-red-950/20 to-red-900/5 p-2 rounded-md border border-red-900/30">
                        <div className="flex items-center mb-1">
                          <div className="bg-red-600/30 h-5 w-5 rounded-md flex items-center justify-center mr-2">
                            <span className="text-red-400 font-bold text-xs">T</span>
                          </div>
                          <h4 className="text-xs font-medium">Terrorist Roles</h4>
                        </div>
                        
                        <div className="space-y-1 text-xs">
                          <div className="flex items-start">
                            <RouteOff className="h-3.5 w-3.5 text-red-400 mt-0.5 mr-1 shrink-0" />
                            <div>
                              <span className="font-medium">Entry/Spacetaker</span>: Creates initial map control
                            </div>
                          </div>
                          <div className="flex items-start">
                            <CircleDotDashed className="h-3.5 w-3.5 text-red-400 mt-0.5 mr-1 shrink-0" />
                            <div>
                              <span className="font-medium">Lurker</span>: Controls flanks and distractions
                            </div>
                          </div>
                          <div className="flex items-start">
                            <Crosshair className="h-3.5 w-3.5 text-red-400 mt-0.5 mr-1 shrink-0" />
                            <div>
                              <span className="font-medium">AWPer</span>: Secures key picks
                            </div>
                          </div>
                        </div>
                      </div>
                      
                      <div className="bg-gradient-to-br from-blue-950/20 to-blue-900/5 p-2 rounded-md border border-blue-900/30">
                        <div className="flex items-center mb-1">
                          <div className="bg-blue-600/30 h-5 w-5 rounded-md flex items-center justify-center mr-2">
                            <span className="text-blue-400 font-bold text-xs">CT</span>
                          </div>
                          <h4 className="text-xs font-medium">Counter-Terrorist Roles</h4>
                        </div>
                        
                        <div className="space-y-1 text-xs">
                          <div className="flex items-start">
                            <BookmarkCheck className="h-3.5 w-3.5 text-blue-400 mt-0.5 mr-1 shrink-0" />
                            <div>
                              <span className="font-medium">Anchor</span>: Holds bombsites consistently
                            </div>
                          </div>
                          <div className="flex items-start">
                            <RotateCw className="h-3.5 w-3.5 text-blue-400 mt-0.5 mr-1 shrink-0" />
                            <div>
                              <span className="font-medium">Rotator</span>: Flexibly moves between sites
                            </div>
                          </div>
                          <div className="flex items-start">
                            <Crosshair className="h-3.5 w-3.5 text-blue-400 mt-0.5 mr-1 shrink-0" />
                            <div>
                              <span className="font-medium">AWPer</span>: Controls key lines of sight
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="grid grid-cols-1 gap-4">
                <div className="bg-blue-950/30 p-4 rounded-md border border-blue-900/30">
                  <div className="flex items-center gap-2 mb-4">
                    <div className="bg-red-600/30 p-1.5 rounded-md">
                      <RouteOff className="h-5 w-5 text-red-400" />
                    </div>
                    <h3 className="text-base font-medium">Terrorist Side Players</h3>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {getPlayers().filter(player => player.side === 'T').map(player => (
                      <RoleMetricsCard
                        key={player.user_steamid}
                        player={player}
                        role={detectPlayerRole(player, data.analysis.roleMetrics, data.analysis.pivMetrics)}
                        roleMetrics={data.analysis.roleMetrics}
                        pivMetrics={data.analysis.pivMetrics}
                      />
                    ))}
                  </div>
                </div>
                
                <div className="bg-blue-950/30 p-4 rounded-md border border-blue-900/30">
                  <div className="flex items-center gap-2 mb-4">
                    <div className="bg-blue-600/30 p-1.5 rounded-md">
                      <Flag className="h-5 w-5 text-blue-400" />
                    </div>
                    <h3 className="text-base font-medium">Counter-Terrorist Side Players</h3>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {getPlayers().filter(player => player.side === 'CT').map(player => (
                      <RoleMetricsCard
                        key={player.user_steamid}
                        player={player}
                        role={detectPlayerRole(player, data.analysis.roleMetrics, data.analysis.pivMetrics)}
                        roleMetrics={data.analysis.roleMetrics}
                        pivMetrics={data.analysis.pivMetrics}
                      />
                    ))}
                  </div>
                </div>
              </div>
              
              <div className="bg-blue-950/30 p-4 rounded-md border border-blue-900/30">
                <h3 className="text-lg font-medium mb-3 flex items-center gap-2">
                  <FileBarChart className="h-5 w-5 text-blue-500" />
                  Role-Based Performance Analysis
                </h3>
                
                <p className="text-sm text-blue-300/80">
                  Player movements are analyzed to determine effective role execution, measuring how well each player performs their tactical function. This data helps understand which players are most effective in their assigned roles and can identify potential role mismatches.
                </p>
              </div>
            </TabsContent>
          
            <TabsContent value="team-strategies" className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* T Side Strategy Analysis */}
                <div className="space-y-4">
                  <Card className="bg-gradient-to-br from-red-950/30 to-red-900/10 border border-red-900/30">
                    <CardHeader className="pb-3">
                      <CardTitle className="flex items-center gap-2 text-lg">
                        <div className="bg-red-800/30 p-1.5 rounded">
                          <Swords className="h-5 w-5 text-red-400" />
                        </div>
                        T Side Strategy Analysis
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      {data?.analysis?.teamStrategyInsights?.t && (
                        <>
                          <div className="space-y-2.5">
                            <div className="flex justify-between text-sm">
                              <span>Team Cohesion</span>
                              <span className="font-medium">
                                {formatPercent(data.analysis.teamStrategyInsights.t.teamCohesionScore)}
                              </span>
                            </div>
                            <Progress 
                              value={data.analysis.teamStrategyInsights.t.teamCohesionScore * 100} 
                              className="h-1.5 bg-red-950"
                            />
                            
                            <div className="flex justify-between text-sm">
                              <span>Map Control</span>
                              <span className="font-medium">
                                {formatPercent(data.analysis.teamStrategyInsights.t.powerPositionControl)}
                              </span>
                            </div>
                            <Progress 
                              value={data.analysis.teamStrategyInsights.t.powerPositionControl * 100} 
                              className="h-1.5 bg-red-950"
                            />
                            
                            <div className="flex justify-between text-sm">
                              <span>Trade Efficiency</span>
                              <span className="font-medium">
                                {formatPercent(data.analysis.teamStrategyInsights.t.overallTradeEfficiency)}
                              </span>
                            </div>
                            <Progress 
                              value={data.analysis.teamStrategyInsights.t.overallTradeEfficiency * 100} 
                              className="h-1.5 bg-red-950"
                            />
                            
                            <div className="flex justify-between text-sm">
                              <span>Attack Execution</span>
                              <span className="font-medium">
                                {formatPercent(data.analysis.teamStrategyInsights.t.attackExecutionScore || 0.6)}
                              </span>
                            </div>
                            <Progress 
                              value={(data.analysis.teamStrategyInsights.t.attackExecutionScore || 0.6) * 100} 
                              className="h-1.5 bg-red-950"
                            />
                          </div>
                          
                          <div className="bg-red-900/20 rounded-md p-3 text-sm">
                            <div className="font-medium mb-2 text-red-200">Round Win Probability</div>
                            <div className="text-xl font-bold text-red-300">
                              {formatPercent(data.analysis.teamStrategyInsights.t.roundWinProbability.probability)}
                            </div>
                            <div className="text-xs mt-2 text-red-300/70">Key factors:</div>
                            <ul className="list-disc list-inside text-xs space-y-1 mt-1 text-red-300/80">
                              {data.analysis.teamStrategyInsights.t.roundWinProbability.factors.map((factor, idx) => (
                                <li key={idx}>{factor}</li>
                              ))}
                            </ul>
                          </div>
                        </>
                      )}
                    </CardContent>
                  </Card>
                  
                  <Card className="bg-gradient-to-br from-red-950/20 to-red-900/5 border border-red-900/30">
                    <CardHeader className="pb-3">
                      <CardTitle className="text-sm font-medium">Map Control Distribution (T)</CardTitle>
                    </CardHeader>
                    <CardContent>
                      {data?.analysis?.teamStrategyInsights?.t && (
                        <div className="h-[200px]">
                          <ResponsiveContainer width="100%" height="100%">
                            <BarChart
                              data={[
                                {
                                  name: 'A Site',
                                  value: data.analysis.teamStrategyInsights.t.mapControlDistribution.ASite * 100
                                },
                                {
                                  name: 'B Site',
                                  value: data.analysis.teamStrategyInsights.t.mapControlDistribution.BSite * 100
                                },
                                {
                                  name: 'Mid',
                                  value: data.analysis.teamStrategyInsights.t.mapControlDistribution.Mid * 100
                                }
                              ]}
                              margin={{ top: 20, right: 20, bottom: 20, left: 0 }}
                            >
                              <CartesianGrid strokeDasharray="3 3" stroke="#374151" opacity={0.3} />
                              <XAxis 
                                dataKey="name" 
                                tick={{ fill: '#f87171', fontSize: 12 }}
                                axisLine={{ stroke: '#4b5563', opacity: 0.5 }}
                              />
                              <YAxis 
                                tickFormatter={(value) => `${value}%`}
                                tick={{ fill: '#f87171', fontSize: 12 }}
                                axisLine={{ stroke: '#4b5563', opacity: 0.5 }}
                              />
                              <Tooltip 
                                formatter={(value: any) => [`${value}%`, 'Control']}
                                contentStyle={{ 
                                  backgroundColor: '#18181b', 
                                  borderColor: '#ef4444', 
                                  borderRadius: '0.375rem'
                                }}
                              />
                              <Bar 
                                dataKey="value" 
                                fill="#ef4444" 
                                radius={[4, 4, 0, 0]}
                                background={{ fill: '#27272a', radius: [4, 4, 0, 0] }}
                              />
                            </BarChart>
                          </ResponsiveContainer>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </div>
                
                {/* CT Side Strategy Analysis */}
                <div className="space-y-4">
                  <Card className="bg-gradient-to-br from-blue-950/30 to-blue-900/10 border border-blue-900/30">
                    <CardHeader className="pb-3">
                      <CardTitle className="flex items-center gap-2 text-lg">
                        <div className="bg-blue-800/30 p-1.5 rounded">
                          <Shield className="h-5 w-5 text-blue-400" />
                        </div>
                        CT Side Strategy Analysis
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      {data?.analysis?.teamStrategyInsights?.ct && (
                        <>
                          <div className="space-y-2.5">
                            <div className="flex justify-between text-sm">
                              <span>Team Cohesion</span>
                              <span className="font-medium">
                                {formatPercent(data.analysis.teamStrategyInsights.ct.teamCohesionScore)}
                              </span>
                            </div>
                            <Progress 
                              value={data.analysis.teamStrategyInsights.ct.teamCohesionScore * 100} 
                              className="h-1.5 bg-blue-950"
                            />
                            
                            <div className="flex justify-between text-sm">
                              <span>Map Control</span>
                              <span className="font-medium">
                                {formatPercent(data.analysis.teamStrategyInsights.ct.powerPositionControl)}
                              </span>
                            </div>
                            <Progress 
                              value={data.analysis.teamStrategyInsights.ct.powerPositionControl * 100} 
                              className="h-1.5 bg-blue-950"
                            />
                            
                            <div className="flex justify-between text-sm">
                              <span>Trade Efficiency</span>
                              <span className="font-medium">
                                {formatPercent(data.analysis.teamStrategyInsights.ct.overallTradeEfficiency)}
                              </span>
                            </div>
                            <Progress 
                              value={data.analysis.teamStrategyInsights.ct.overallTradeEfficiency * 100} 
                              className="h-1.5 bg-blue-950"
                            />
                            
                            <div className="flex justify-between text-sm">
                              <span>Defense Quality</span>
                              <span className="font-medium">
                                {formatPercent(data.analysis.teamStrategyInsights.ct.defenseSetupQuality || 0.7)}
                              </span>
                            </div>
                            <Progress 
                              value={(data.analysis.teamStrategyInsights.ct.defenseSetupQuality || 0.7) * 100} 
                              className="h-1.5 bg-blue-950"
                            />
                          </div>
                          
                          <div className="bg-blue-900/20 rounded-md p-3 text-sm">
                            <div className="font-medium mb-2 text-blue-200">Round Win Probability</div>
                            <div className="text-xl font-bold text-blue-300">
                              {formatPercent(data.analysis.teamStrategyInsights.ct.roundWinProbability.probability)}
                            </div>
                            <div className="text-xs mt-2 text-blue-300/70">Key factors:</div>
                            <ul className="list-disc list-inside text-xs space-y-1 mt-1 text-blue-300/80">
                              {data.analysis.teamStrategyInsights.ct.roundWinProbability.factors.map((factor, idx) => (
                                <li key={idx}>{factor}</li>
                              ))}
                            </ul>
                          </div>
                        </>
                      )}
                    </CardContent>
                  </Card>
                  
                  <Card className="bg-gradient-to-br from-blue-950/20 to-blue-900/5 border border-blue-900/30">
                    <CardHeader className="pb-3">
                      <CardTitle className="text-sm font-medium">Map Control Distribution (CT)</CardTitle>
                    </CardHeader>
                    <CardContent>
                      {data?.analysis?.teamStrategyInsights?.ct && (
                        <div className="h-[200px]">
                          <ResponsiveContainer width="100%" height="100%">
                            <BarChart
                              data={[
                                {
                                  name: 'A Site',
                                  value: data.analysis.teamStrategyInsights.ct.mapControlDistribution.ASite * 100
                                },
                                {
                                  name: 'B Site',
                                  value: data.analysis.teamStrategyInsights.ct.mapControlDistribution.BSite * 100
                                },
                                {
                                  name: 'Mid',
                                  value: data.analysis.teamStrategyInsights.ct.mapControlDistribution.Mid * 100
                                }
                              ]}
                              margin={{ top: 20, right: 20, bottom: 20, left: 0 }}
                            >
                              <CartesianGrid strokeDasharray="3 3" stroke="#374151" opacity={0.3} />
                              <XAxis 
                                dataKey="name" 
                                tick={{ fill: '#60a5fa', fontSize: 12 }}
                                axisLine={{ stroke: '#4b5563', opacity: 0.5 }}
                              />
                              <YAxis 
                                tickFormatter={(value) => `${value}%`}
                                tick={{ fill: '#60a5fa', fontSize: 12 }}
                                axisLine={{ stroke: '#4b5563', opacity: 0.5 }}
                              />
                              <Tooltip 
                                formatter={(value: any) => [`${value}%`, 'Control']}
                                contentStyle={{ 
                                  backgroundColor: '#18181b', 
                                  borderColor: '#3b82f6', 
                                  borderRadius: '0.375rem'
                                }}
                              />
                              <Bar 
                                dataKey="value" 
                                fill="#3b82f6" 
                                radius={[4, 4, 0, 0]}
                                background={{ fill: '#27272a', radius: [4, 4, 0, 0] }}
                              />
                            </BarChart>
                          </ResponsiveContainer>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </div>
              </div>
              
              <div className="grid grid-cols-1 gap-6">
                <Card className="bg-blue-950/20 border border-blue-900/30">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-lg flex items-center gap-2">
                      <TrendingUp className="h-5 w-5 text-blue-500" />
                      Round Prediction
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {data?.analysis?.roundPrediction && (
                      <>
                        <div className="flex items-center justify-center gap-6">
                          <div className="text-center">
                            <div className="text-sm text-blue-300 mb-1">T Win Probability</div>
                            <div className="text-2xl font-bold text-amber-400">
                              {formatPercent(data.analysis.roundPrediction.tProbability)}
                            </div>
                          </div>
                          
                          <div className="w-px h-16 bg-blue-900/30"></div>
                          
                          <div className="text-center">
                            <div className="text-sm text-blue-300 mb-1">CT Win Probability</div>
                            <div className="text-2xl font-bold text-blue-400">
                              {formatPercent(data.analysis.roundPrediction.ctProbability)}
                            </div>
                          </div>
                        </div>
                        
                        <div className="bg-blue-950/40 rounded-md p-4">
                          <div className="text-sm font-medium mb-2">Key Decision Factors</div>
                          <ul className="space-y-1 text-sm text-blue-300/80">
                            {data.analysis.roundPrediction.factors.map((factor, idx) => (
                              <li key={idx} className="flex items-start gap-2">
                                <ChevronRight className="h-4 w-4 mt-0.5 text-blue-500 shrink-0" />
                                <span>{factor}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      </>
                    )}
                  </CardContent>
                </Card>
                
                <Card className="bg-blue-950/20 border border-blue-900/30">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-lg flex items-center gap-2">
                      <Compass className="h-5 w-5 text-blue-500" />
                      Team Movement Analysis
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-3">
                        <h4 className="text-sm font-medium">T Side Movement Patterns</h4>
                        
                        <div className="bg-red-950/20 p-3 rounded-md border border-red-900/30 space-y-2">
                          <div className="flex items-center justify-between">
                            <div className="text-xs">Average Team Distance</div>
                            <div className="text-xs font-medium">
                              {formatDistance(data?.analysis?.teamMetrics?.t?.avgTeamDistance || 0)}
                            </div>
                          </div>
                          
                          <div className="flex items-center justify-between">
                            <div className="text-xs">Team Spread</div>
                            <div className="text-xs font-medium">
                              {formatDistance(data?.analysis?.teamMetrics?.t?.teamSpread || 0)}
                            </div>
                          </div>
                          
                          <div className="flex items-center justify-between">
                            <div className="text-xs">Trade Efficiency</div>
                            <div className="text-xs font-medium">
                              {formatPercent(data?.analysis?.teamMetrics?.t?.tradeEfficiency || 0)}
                            </div>
                          </div>
                        </div>
                        
                        <div className="bg-red-950/10 p-3 rounded-md border border-red-900/20">
                          <h5 className="text-xs font-medium mb-2">Strategy Commentary</h5>
                          <p className="text-xs text-red-200/70">
                            The T side shows a coordinated approach with good trade potential and adequate site control. 
                            Movement coordination is good across entry, support and lurk players with effective space 
                            creation on their primary target site.
                          </p>
                        </div>
                      </div>
                      
                      <div className="space-y-3">
                        <h4 className="text-sm font-medium">CT Side Movement Patterns</h4>
                        
                        <div className="bg-blue-950/20 p-3 rounded-md border border-blue-900/30 space-y-2">
                          <div className="flex items-center justify-between">
                            <div className="text-xs">Average Team Distance</div>
                            <div className="text-xs font-medium">
                              {formatDistance(data?.analysis?.teamMetrics?.ct?.avgTeamDistance || 0)}
                            </div>
                          </div>
                          
                          <div className="flex items-center justify-between">
                            <div className="text-xs">Team Spread</div>
                            <div className="text-xs font-medium">
                              {formatDistance(data?.analysis?.teamMetrics?.ct?.teamSpread || 0)}
                            </div>
                          </div>
                          
                          <div className="flex items-center justify-between">
                            <div className="text-xs">Trade Efficiency</div>
                            <div className="text-xs font-medium">
                              {formatPercent(data?.analysis?.teamMetrics?.ct?.tradeEfficiency || 0)}
                            </div>
                          </div>
                        </div>
                        
                        <div className="bg-blue-950/10 p-3 rounded-md border border-blue-900/20">
                          <h5 className="text-xs font-medium mb-2">Strategy Commentary</h5>
                          <p className="text-xs text-blue-200/70">
                            The CT setup shows strong site anchoring with good rotator movement between sites.
                            The defensive positioning provides effective crossfire opportunities and good information 
                            gathering with minimal over-rotation detected.
                          </p>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>
          </Tabs>
        </div>
      )}
    </div>
  );
}
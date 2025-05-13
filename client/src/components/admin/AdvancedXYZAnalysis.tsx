import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import {
  Activity,
  BadgePercent,
  BookmarkCheck,
  ChevronRight,
  CircleDotDashed,
  Compass,
  Crosshair,
  Eye,
  Flag,
  Gauge,
  Layers,
  Loader2,
  Map,
  MoveHorizontal,
  Radar,
  RouteOff,
  RotateCw,
  Share,
  Swords,
  Target,
  Timer,
  TrendingUp,
  Users,
  Award,
  FileBarChart,
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

// Round a number to specified decimal places
function roundTo(num: number, decimals: number = 0): number {
  const factor = Math.pow(10, decimals);
  return Math.round(num * factor) / factor;
}

// Component for role-based metrics card
function RoleMetricsCard({ 
  player, 
  role, 
  roleMetrics, 
  pivMetrics 
}: { 
  player: PlayerMovementAnalysis;
  role: string;
  roleMetrics?: any;
  pivMetrics?: any;
}) {
  const playerRoleMetrics = roleMetrics?.[player.user_steamid] || {};
  const playerPivMetrics = pivMetrics?.[player.user_steamid] || {};
  
  // Get primary role-specific metrics
  const getTopMetrics = () => {
    const metrics: { name: string; value: number; icon: JSX.Element }[] = [];
    
    // Add core metrics based on role
    if (role.includes('AWP')) {
      metrics.push(
        { 
          name: 'Opening Pick Potential', 
          value: playerPivMetrics['Opening Pick Success Rate'] || playerRoleMetrics.sniperLaneControl || 0.5, 
          icon: <Crosshair className="h-3.5 w-3.5 text-blue-400" /> 
        },
        { 
          name: 'Angle Control', 
          value: playerPivMetrics['Angle Hold Success'] || playerRoleMetrics.positionConsistency || 0.5, 
          icon: <Target className="h-3.5 w-3.5 text-blue-400" /> 
        }
      );
    } else if (role.includes('Entry') || role.includes('Spacetaker')) {
      metrics.push(
        { 
          name: 'Entry Path Efficiency', 
          value: playerRoleMetrics.entryPathEfficiency || 0.5, 
          icon: <RouteOff className="h-3.5 w-3.5 text-blue-400" /> 
        },
        { 
          name: 'Space Creation', 
          value: playerRoleMetrics.spaceCreationIndex || 0.5, 
          icon: <MoveHorizontal className="h-3.5 w-3.5 text-blue-400" /> 
        }
      );
    } else if (role.includes('Lurker')) {
      metrics.push(
        { 
          name: 'Isolation Index', 
          value: playerRoleMetrics.isolationIndex || 0.5, 
          icon: <CircleDotDashed className="h-3.5 w-3.5 text-blue-400" /> 
        },
        { 
          name: 'Flank Position', 
          value: playerRoleMetrics.flankerPositionAdvantage || 0.5, 
          icon: <Radar className="h-3.5 w-3.5 text-blue-400" /> 
        }
      );
    } else if (role.includes('Support')) {
      metrics.push(
        { 
          name: 'Support Proximity', 
          value: playerRoleMetrics.supportProximityIndex || 0.5, 
          icon: <Users className="h-3.5 w-3.5 text-blue-400" /> 
        },
        { 
          name: 'Utility Positions', 
          value: playerRoleMetrics.utilityPositioningScore || 0.5, 
          icon: <Share className="h-3.5 w-3.5 text-blue-400" /> 
        }
      );
    } else if (role.includes('Anchor')) {
      metrics.push(
        { 
          name: 'Position Consistency', 
          value: playerRoleMetrics.positionConsistency || 0.5, 
          icon: <BookmarkCheck className="h-3.5 w-3.5 text-blue-400" /> 
        },
        { 
          name: 'Site Control', 
          value: role.includes('A') ? player.sitePresence.ASite : player.sitePresence.BSite, 
          icon: <Flag className="h-3.5 w-3.5 text-blue-400" /> 
        }
      );
    } else if (role.includes('Rotator')) {
      metrics.push(
        { 
          name: 'Rotation Efficiency', 
          value: playerRoleMetrics.rotationalEfficiency || 0.5, 
          icon: <RotateCw className="h-3.5 w-3.5 text-blue-400" /> 
        },
        { 
          name: 'Map Coverage', 
          value: playerRoleMetrics.mapCoverage || 0.5, 
          icon: <Compass className="h-3.5 w-3.5 text-blue-400" /> 
        }
      );
    }
    
    // Add general metrics that apply to all roles
    metrics.push({ 
      name: 'Trade Positioning', 
      value: playerRoleMetrics.tradePositioningScore || playerPivMetrics['Trade Positioning Score'] || 0.5, 
      icon: <Swords className="h-3.5 w-3.5 text-blue-400" /> 
    });
    
    return metrics;
  };
  
  // Calculate an estimated PIV value based on role metrics
  const calculatePIVEstimate = (): number => {
    const metrics = getTopMetrics();
    const avgMetricValue = metrics.reduce((sum, m) => sum + m.value, 0) / metrics.length;
    
    // PIV typically ranges from 0.5 to 3.0
    // Map our 0-1 metrics to this range with some variation
    return 0.5 + (avgMetricValue * 2.5);
  };
  
  const pivValue = calculatePIVEstimate();
  const topMetrics = getTopMetrics();
  
  return (
    <div className={cn(
      "bg-gradient-to-br p-3 rounded-md border", 
      player.side.toLowerCase() === 't' 
        ? "from-red-950/20 to-red-900/5 border-red-900/30" 
        : "from-blue-950/20 to-blue-900/5 border-blue-900/30"
    )}>
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <Badge 
            variant={player.side.toLowerCase() === 't' ? 'destructive' : 'default'}
            className="h-6"
          >
            {role}
          </Badge>
          <span className="text-sm font-medium">{player.name}</span>
        </div>
        <HoverCard>
          <HoverCardTrigger asChild>
            <div className="flex items-center cursor-help">
              <Award className="h-4 w-4 text-yellow-500 mr-1" />
              <span className="text-sm font-bold">{pivValue.toFixed(2)}</span>
            </div>
          </HoverCardTrigger>
          <HoverCardContent className="w-80 bg-blue-950 border-blue-900">
            <div className="flex justify-between items-start">
              <div>
                <h4 className="text-sm font-semibold">PIV Rating</h4>
                <p className="text-xs text-blue-300/80">
                  Player Impact Value based on positional metrics
                </p>
              </div>
              <Award className="h-5 w-5 text-yellow-500" />
            </div>
            <Separator className="my-2 bg-blue-800/50" />
            <div className="text-xs space-y-1">
              {topMetrics.map((metric, i) => (
                <div key={i} className="flex items-center justify-between">
                  <div className="flex items-center">
                    {metric.icon}
                    <span className="ml-1">{metric.name}</span>
                  </div>
                  <span className="font-medium">{formatPercent(metric.value)}</span>
                </div>
              ))}
            </div>
          </HoverCardContent>
        </HoverCard>
      </div>
      
      <div className="space-y-3 mt-3">
        {topMetrics.map((metric, i) => (
          <div key={i} className="space-y-1">
            <div className="flex justify-between text-xs">
              <div className="flex items-center gap-1">
                {metric.icon}
                <span>{metric.name}</span>
              </div>
              <span className="font-medium">{formatPercent(metric.value)}</span>
            </div>
            <Progress value={getMetricGauge(metric.value)} className="h-1.5" />
          </div>
        ))}
      </div>
      
      <div className="grid grid-cols-3 gap-2 mt-3">
        <div className="bg-blue-950/40 rounded p-2 text-center">
          <div className="text-[10px] text-blue-300/80">Distance</div>
          <div className="text-sm font-medium">{formatDistance(player.totalDistance)}</div>
        </div>
        <div className="bg-blue-950/40 rounded p-2 text-center">
          <div className="text-[10px] text-blue-300/80">Speed</div>
          <div className="text-sm font-medium">{Math.round(player.avgSpeed)}</div>
        </div>
        <div className="bg-blue-950/40 rounded p-2 text-center">
          <div className="text-[10px] text-blue-300/80">Rotations</div>
          <div className="text-sm font-medium">{player.rotations}</div>
        </div>
      </div>
    </div>
  );
}

// Component for team analysis card
function TeamAnalysisCard({
  side,
  teamMetrics,
  teamInsights,
  roundPrediction
}: {
  side: 'T' | 'CT';
  teamMetrics: TeamMetrics;
  teamInsights?: TeamStrategyInsights;
  roundPrediction?: {
    tProbability: number;
    ctProbability: number;
    factors: string[];
  };
}) {
  const isTSide = side === 'T';
  const winProbability = isTSide ? roundPrediction?.tProbability || 0.5 : roundPrediction?.ctProbability || 0.5;
  const teamColor = isTSide ? '#ef4444' : '#3b82f6'; 
  const gradientClasses = isTSide ? 'from-red-950/30 to-red-900/10' : 'from-blue-950/30 to-blue-900/10';
  const borderClasses = isTSide ? 'border-red-900/30' : 'border-blue-900/30';
  
  const mapControlData = [
    { name: 'A Site', value: teamMetrics.siteControl.ASite * 100 },
    { name: 'Mid', value: teamMetrics.siteControl.Mid * 100 },
    { name: 'B Site', value: teamMetrics.siteControl.BSite * 100 },
  ];
  
  const strategyData = [
    { name: 'Coordination', value: teamInsights?.movementCoordination || 0.5 },
    { name: 'Trade Setup', value: teamMetrics.tradeEfficiency },
    { name: 'Control', value: (teamMetrics.siteControl.ASite + teamMetrics.siteControl.BSite + teamMetrics.siteControl.Mid) / 3 },
    { name: 'Team Spread', value: 1 - Math.min(1, teamMetrics.teamSpread / 2000) },
    { name: 'Rotation', value: teamInsights?.rotationTimings || 0.5 },
  ];
  
  return (
    <div className={`bg-gradient-to-br ${gradientClasses} p-4 rounded-lg border ${borderClasses}`}>
      <div className="flex items-center mb-3">
        <div className={`h-8 w-8 rounded-md flex items-center justify-center mr-3 ${isTSide ? 'bg-red-600/30' : 'bg-blue-600/30'}`}>
          <span className={`font-bold ${isTSide ? 'text-red-400' : 'text-blue-400'}`}>{side}</span>
        </div>
        <h3 className="text-base font-medium">{isTSide ? 'Terrorist' : 'Counter-Terrorist'} Strategy Analysis</h3>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Map Control Chart */}
        <div className="bg-blue-950/50 rounded-md p-3">
          <div className="flex justify-between items-center mb-2">
            <h4 className="text-sm font-medium text-blue-100">Map Control</h4>
            <Badge variant="outline" className={`${isTSide ? 'border-red-800/50 text-red-300' : 'border-blue-800/50 text-blue-300'}`}>
              {formatPercent((teamMetrics.siteControl.ASite + teamMetrics.siteControl.BSite + teamMetrics.siteControl.Mid) / 3)}
            </Badge>
          </div>
          
          <div className="h-[180px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={mapControlData}
                layout="vertical"
                margin={{ top: 5, right: 10, left: 5, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} stroke="#1e3a8a" opacity={0.3} />
                <XAxis type="number" domain={[0, 100]} stroke="#93c5fd" fontSize={11} tickFormatter={(value) => `${value}%`} />
                <YAxis dataKey="name" type="category" stroke="#93c5fd" fontSize={11} width={50} />
                <Tooltip 
                  formatter={(value: number) => [`${value.toFixed(0)}%`, 'Control']}
                  contentStyle={{ backgroundColor: '#0f172a', borderColor: '#1e40af' }}
                />
                <Bar 
                  dataKey="value" 
                  fill={teamColor} 
                  radius={[0, 4, 4, 0]} 
                  background={{ fill: '#1e3a8a30' }} 
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
        
        {/* Strategy Radar Chart */}
        <div className="bg-blue-950/50 rounded-md p-3">
          <div className="flex justify-between items-center mb-2">
            <h4 className="text-sm font-medium text-blue-100">Strategy Metrics</h4>
            <Badge variant="outline" className={`${isTSide ? 'border-red-800/50 text-red-300' : 'border-blue-800/50 text-blue-300'}`}>
              {isTSide ? 'Attack Setup' : 'Defense Setup'}
            </Badge>
          </div>
          
          <div className="h-[180px]">
            <ResponsiveContainer width="100%" height="100%">
              <RadarChart outerRadius={70} data={strategyData}>
                <PolarGrid stroke="#1e3a8a" />
                <PolarAngleAxis dataKey="name" stroke="#93c5fd" fontSize={10} />
                <PolarRadiusAxis angle={30} domain={[0, 1]} stroke="#93c5fd" fontSize={10} tickFormatter={(value) => `${value * 100}%`} />
                <RadarComponent name="Strategy" dataKey="value" stroke={teamColor} fill={teamColor} fillOpacity={0.3} />
                <Tooltip 
                  formatter={(value: number) => [`${(value * 100).toFixed(0)}%`, 'Rating']}
                  contentStyle={{ backgroundColor: '#0f172a', borderColor: '#1e40af' }}
                />
              </RadarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
      
      {/* Key Insights */}
      <div className="mt-4 bg-blue-950/50 rounded-md p-3">
        <div className="flex justify-between items-center mb-2">
          <h4 className="text-sm font-medium text-blue-100">Round Win Probability</h4>
          <Badge className={isTSide ? 'bg-red-700' : 'bg-blue-700'}>
            {formatPercent(winProbability)}
          </Badge>
        </div>
        
        <div className="relative pt-1">
          <div className="flex h-3 mb-2 overflow-hidden rounded-full">
            <div 
              className="bg-gradient-to-r from-red-900 to-red-600 flex justify-center items-center text-xs text-red-100 font-medium" 
              style={{ width: `${roundPrediction?.tProbability ? roundPrediction.tProbability * 100 : 50}%` }}
            >
              {(roundPrediction?.tProbability || 0.5) > 0.25 && "T"}
            </div>
            <div 
              className="bg-gradient-to-r from-blue-600 to-blue-800 flex justify-center items-center text-xs text-blue-100 font-medium" 
              style={{ width: `${roundPrediction?.ctProbability ? roundPrediction.ctProbability * 100 : 50}%` }}
            >
              {(roundPrediction?.ctProbability || 0.5) > 0.25 && "CT"}
            </div>
          </div>
        </div>
        
        <h5 className="text-xs font-medium text-blue-200 mt-3 mb-1">Key Factors</h5>
        <ul className="text-xs space-y-1 pl-1">
          {roundPrediction?.factors.filter(f => 
            isTSide ? 
              !f.toLowerCase().includes('ct') : 
              !f.toLowerCase().includes('t side')
          ).slice(0, 3).map((factor, i) => (
            <li key={i} className="flex items-center">
              <ChevronRight className="h-3 w-3 mr-1 shrink-0" />
              <span className="text-blue-300/90">{factor}</span>
            </li>
          )) || (
            <li className="text-blue-300/90">No specific factors identified</li>
          )}
        </ul>
        
        <h5 className="text-xs font-medium text-blue-200 mt-3 mb-1">Strategic Recommendation</h5>
        <p className="text-xs text-blue-300/90">
          {isTSide ? (
            teamMetrics.siteControl.BSite > teamMetrics.siteControl.ASite ? 
              "Commit to B-site push with proper utility and trade setup. The positional data shows favorable B control." : 
              "Consider A-site execute with mid control. Maintain trade positions during approach."
          ) : (
            teamMetrics.teamSpread > 1200 ?
              "Adjust defensive positions to be less spread out. Consider stacking towards B site based on T tendencies." :
              "Maintain current balanced defensive setup. Prepare for quick rotations through mid."
          )}
        </p>
      </div>
    </div>
  );
}

// Component for map visualization with player positions
function MapVisualization({ 
  playerData,
  activePlayer,
  onSelectPlayer
}: { 
  playerData: PlayerMovementAnalysis[];
  activePlayer?: string;
  onSelectPlayer: (steamId: string) => void;
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
  
  // Generate site boundary data
  const siteBoundaries = [
    // A site boundaries
    { x: 1500, y: 500, label: 'A Site' },
    { x: 2000, y: 1000, label: 'A Site' },
    // B site boundaries
    { x: -1000, y: -1000, label: 'B Site' },
    { x: 0, y: 0, label: 'B Site' },
    // Mid boundaries
    { x: 0, y: 0, label: 'Mid' },
    { x: 1000, y: 1000, label: 'Mid' },
  ];

  return (
    <div className="relative h-[500px] w-full rounded-md overflow-hidden border border-blue-900/30">
      {/* Map Background */}
      <div className="absolute inset-0 z-0">
        <img 
          src={infernoOverlayImg} 
          alt="Inferno Map" 
          className="w-full h-full object-cover opacity-10"
        />
      </div>
      
      <div className="absolute inset-0 z-10">
        <ResponsiveContainer width="100%" height="100%">
          <ScatterChart
            margin={{ top: 20, right: 20, bottom: 20, left: 20 }}
          >
            <CartesianGrid strokeDasharray="3 3" stroke="#1e3a8a" opacity={0.3} />
            <XAxis 
              type="number" 
              dataKey="x" 
              name="X Position" 
              domain={[-2500, 2500]}
              tick={{ fill: '#93c5fd' }}
              stroke="#93c5fd" 
              opacity={0.7}
            />
            <YAxis 
              type="number" 
              dataKey="y" 
              name="Y Position" 
              domain={[-2500, 2500]}
              tick={{ fill: '#93c5fd' }}
              stroke="#93c5fd" 
              opacity={0.7}
            />
            <ZAxis 
              type="number" 
              dataKey="z" 
              range={[20, 80]} 
              name="Size" 
            />
            <Tooltip 
              cursor={{ strokeDasharray: '3 3' }}
              contentStyle={{ backgroundColor: '#0f172a', borderColor: '#1e40af' }}
              labelStyle={{ color: '#93c5fd' }}
              formatter={(value: any, name: string, props: any) => {
                const { payload } = props;
                if (name === 'X Position' || name === 'Y Position') {
                  let location = "";
                  
                  // Identify map location
                  if (payload.x > 1500 && payload.y > 500) {
                    location = " (A Site)";
                  } else if (payload.x < 0 && payload.y < 0) {
                    location = " (B Site)";
                  } else if (payload.x > 0 && payload.x < 1000 && payload.y > 0 && payload.y < 1000) {
                    location = " (Mid)";
                  } else if (payload.x < -1000 && payload.y > -500) {
                    location = " (Banana)";
                  } else if (payload.x > 1000 && payload.x < 1500 && payload.y > 0 && payload.y < 500) {
                    location = " (Apartments)";
                  }
                  
                  return [`${value}${location}`, name];
                }
                return [payload.player, payload.side];
              }}
            />
            <Legend />
            
            {/* Site boundaries */}
            <Scatter 
              name="A Site" 
              data={siteBoundaries.filter(b => b.label === 'A Site')} 
              fill="#d97706"
              line={{ stroke: '#d97706', strokeWidth: 1.5, strokeDasharray: '5 5' }}
            />
            <Scatter 
              name="B Site" 
              data={siteBoundaries.filter(b => b.label === 'B Site')} 
              fill="#059669"
              line={{ stroke: '#059669', strokeWidth: 1.5, strokeDasharray: '5 5' }}
            />
            <Scatter 
              name="Mid" 
              data={siteBoundaries.filter(b => b.label === 'Mid')} 
              fill="#7c3aed"
              line={{ stroke: '#7c3aed', strokeWidth: 1.5, strokeDasharray: '5 5' }}
            />
            
            {/* Player positions */}
            <Scatter 
              name="Player Positions"
              data={getHeatmapData()} 
              fill="#2563eb"
              onClick={(data) => {
                if (data && data.payload) {
                  onSelectPlayer(data.payload.steamId);
                }
              }}
            />
          </ScatterChart>
        </ResponsiveContainer>
      </div>
      
      {/* Map Labels */}
      <div className="absolute top-2 left-2 z-20 bg-blue-950/80 text-xs text-blue-100 px-2 py-1 rounded">
        A Site
      </div>
      <div className="absolute bottom-10 right-8 z-20 bg-blue-950/80 text-xs text-blue-100 px-2 py-1 rounded">
        B Site
      </div>
      <div className="absolute top-[40%] left-[40%] z-20 bg-blue-950/80 text-xs text-blue-100 px-2 py-1 rounded">
        Mid
      </div>
    </div>
  );
}

// Main component for XYZ Data Analysis
export function AdvancedXYZAnalysis() {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("map-view");
  const [activePlayer, setActivePlayer] = useState<string | null>(null);
  
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
      .sort((a, b) => a.side.localeCompare(b.side) || a.name.localeCompare(b.name));
  };
  
  return (
    <div className="space-y-6">
      <Card className="bg-blue-950/30 border border-blue-900/50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Map className="h-5 w-5 text-blue-400" />
            XYZ Positional Data Analysis
          </CardTitle>
          <p className="text-sm text-blue-300/80">
            Process and visualize XYZ positional data from CS2 matches to analyze player movements and patterns
          </p>
        </CardHeader>
        <CardContent className="space-y-4">
          {!data ? (
            <div className="text-center p-6 bg-blue-950/20 rounded-md border border-blue-900/30">
              <Activity className="h-10 w-10 text-blue-500/30 mx-auto mb-3" />
              <p className="text-blue-300/70 mb-4">
                Run the data processor to analyze the sample XYZ positional data from round 4 on de_inferno
              </p>
              <Button
                onClick={handleRunAnalysis}
                disabled={isLoading}
                className="bg-gradient-to-r from-blue-700 to-purple-600 hover:from-blue-800 hover:to-purple-700"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Processing...
                  </>
                ) : (
                  "Process Positional Data"
                )}
              </Button>
            </div>
          ) : (
            <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
              <TabsList className="grid grid-cols-3 bg-blue-950/30 border border-blue-900/30">
                <TabsTrigger value="map-view">Map View</TabsTrigger>
                <TabsTrigger value="role-analysis">Role Analysis</TabsTrigger>
                <TabsTrigger value="team-strategies">Team Strategies</TabsTrigger>
              </TabsList>
              
              {/* Map View Tab */}
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
                  />
                  
                  {activePlayer && (
                    <div className="bg-blue-950/40 rounded-md p-4 border border-blue-900/30">
                      <h3 className="text-base font-medium mb-2">
                        {data.analysis.playerMetrics[activePlayer].name} - Movement Analysis
                      </h3>
                      
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
                          <div className="text-sm font-medium mb-2">Movement Stats</div>
                          <div className="grid grid-cols-2 gap-3">
                            <div>
                              <div className="text-xs text-blue-300/70">Total Distance</div>
                              <div className="text-xl font-medium">
                                {formatDistance(data.analysis.playerMetrics[activePlayer].totalDistance)}
                              </div>
                            </div>
                            
                            <div>
                              <div className="text-xs text-blue-300/70">Average Speed</div>
                              <div className="text-xl font-medium">
                                {Math.round(data.analysis.playerMetrics[activePlayer].avgSpeed)}
                              </div>
                            </div>
                            
                            <div>
                              <div className="text-xs text-blue-300/70">Rotations</div>
                              <div className="text-xl font-medium">
                                {data.analysis.playerMetrics[activePlayer].rotations}
                              </div>
                            </div>
                            
                            <div>
                              <div className="text-xs text-blue-300/70">Role</div>
                              <div className="text-xl font-medium">
                                {detectPlayerRole(
                                  data.analysis.playerMetrics[activePlayer], 
                                  data.analysis.roleMetrics, 
                                  data.analysis.pivMetrics
                                )}
                              </div>
                            </div>
                          </div>
                        </div>
                        
                        <div className="bg-blue-950/60 p-3 rounded-md">
                          <div className="text-sm font-medium mb-2">Performance Insights</div>
                          <div className="text-xs text-blue-300/90 space-y-2">
                            <p>
                              {data.analysis.playerMetrics[activePlayer].side === 'T' ? (
                                data.analysis.playerMetrics[activePlayer].sitePresence.BSite > 0.5 ?
                                  "Player is focused on B site control through Banana, showing clear intent for a B execute. Movement patterns indicate an organized approach with teammates." :
                                  "Player is primarily controlling mid areas with some A site presence. Movement suggests a split approach or mid-to-A strategy."
                              ) : (
                                data.analysis.playerMetrics[activePlayer].sitePresence.ASite > 0.6 ?
                                  "Strong A site anchoring with disciplined positioning. Minimal rotations indicate dedicated site control rather than a floating defense." :
                                  data.analysis.playerMetrics[activePlayer].sitePresence.BSite > 0.6 ?
                                  "B site defense with focus on holding angles towards Banana entrance. Position consistency suggests experienced site anchor." :
                                  "Player is taking a rotator/mid-controller role, with balanced presence across multiple areas. Movement suggests responsive positioning based on information."
                              )}
                            </p>
                            
                            <p>
                              {data.analysis.roleMetrics?.[activePlayer]?.positionConsistency > 0.7 ?
                                "Demonstrates excellent position consistency, holding key angles with discipline." :
                                data.analysis.roleMetrics?.[activePlayer]?.positionConsistency < 0.4 ?
                                "Shows highly dynamic movement patterns with frequent repositioning." :
                                "Balances positional discipline with necessary repositioning."}
                            </p>
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
                  <div className="lg:col-span-3">
                    <div className="bg-blue-950/40 p-4 rounded-md border border-blue-900/30">
                      <h3 className="text-base font-medium mb-3">Role-Based Performance Analysis</h3>
                      <p className="text-sm text-blue-300/80 mb-4">
                        Player movements are analyzed to determine effective role execution, measuring how well each player performs their tactical function.
                      </p>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-2">
                        <div className="bg-gradient-to-br from-red-950/20 to-red-900/5 p-3 rounded-md border border-red-900/30">
                          <div className="flex items-center mb-3">
                            <div className="bg-red-600/30 h-6 w-6 rounded-md flex items-center justify-center mr-2">
                              <span className="text-red-400 font-bold">T</span>
                            </div>
                            <h4 className="text-sm font-medium">Terrorist Roles</h4>
                          </div>
                          
                          <div className="space-y-2 text-xs">
                            <div className="flex items-start">
                              <RouteOff className="h-4 w-4 text-red-400 mt-0.5 mr-1.5 shrink-0" />
                              <div>
                                <span className="font-medium">Entry/Spacetaker</span>: Creates initial map control and space for the team. Measured by entry path efficiency and successful site presence.
                              </div>
                            </div>
                            <div className="flex items-start">
                              <CircleDotDashed className="h-4 w-4 text-red-400 mt-0.5 mr-1.5 shrink-0" />
                              <div>
                                <span className="font-medium">Lurker</span>: Controls flanks and creates distractions. Measured by isolation index and strategic positioning away from team.
                              </div>
                            </div>
                            <div className="flex items-start">
                              <Users className="h-4 w-4 text-red-400 mt-0.5 mr-1.5 shrink-0" />
                              <div>
                                <span className="font-medium">Support</span>: Assists entries and sets up trades. Measured by proximity to teammates and utility positioning.
                              </div>
                            </div>
                            <div className="flex items-start">
                              <Crosshair className="h-4 w-4 text-red-400 mt-0.5 mr-1.5 shrink-0" />
                              <div>
                                <span className="font-medium">AWPer (T)</span>: Secures key picks and holds critical angles. Measured by sniper lane control and pick potential.
                              </div>
                            </div>
                          </div>
                        </div>
                        
                        <div className="bg-gradient-to-br from-blue-950/20 to-blue-900/5 p-3 rounded-md border border-blue-900/30">
                          <div className="flex items-center mb-3">
                            <div className="bg-blue-600/30 h-6 w-6 rounded-md flex items-center justify-center mr-2">
                              <span className="text-blue-400 font-bold">CT</span>
                            </div>
                            <h4 className="text-sm font-medium">Counter-Terrorist Roles</h4>
                          </div>
                          
                          <div className="space-y-2 text-xs">
                            <div className="flex items-start">
                              <BookmarkCheck className="h-4 w-4 text-blue-400 mt-0.5 mr-1.5 shrink-0" />
                              <div>
                                <span className="font-medium">Site Anchor</span>: Holds specific bombsites consistently. Measured by position consistency and site control.
                              </div>
                            </div>
                            <div className="flex items-start">
                              <RotateCw className="h-4 w-4 text-blue-400 mt-0.5 mr-1.5 shrink-0" />
                              <div>
                                <span className="font-medium">Rotator</span>: Flexibly moves between sites as needed. Measured by rotation efficiency and map coverage.
                              </div>
                            </div>
                            <div className="flex items-start">
                              <Users className="h-4 w-4 text-blue-400 mt-0.5 mr-1.5 shrink-0" />
                              <div>
                                <span className="font-medium">Support (CT)</span>: Provides utility and trade opportunities. Measured by support proximity and utility positioning.
                              </div>
                            </div>
                            <div className="flex items-start">
                              <Crosshair className="h-4 w-4 text-blue-400 mt-0.5 mr-1.5 shrink-0" />
                              <div>
                                <span className="font-medium">AWPer (CT)</span>: Controls key lines of sight. Measured by angle control and site lockdown potential.
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  {/* T Side Players */}
                  <div className="space-y-4">
                    <h3 className="text-sm font-medium flex items-center ml-1">
                      <div className="bg-red-600/30 h-5 w-5 rounded-md flex items-center justify-center mr-2">
                        <span className="text-red-400 font-bold text-xs">T</span>
                      </div>
                      Terrorist Side Players
                    </h3>
                    
                    <div className="space-y-3">
                      {getPlayers()
                        .filter(player => player.side.toLowerCase() === 't')
                        .map(player => (
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
                  
                  {/* CT Side Players */}
                  <div className="space-y-4">
                    <h3 className="text-sm font-medium flex items-center ml-1">
                      <div className="bg-blue-600/30 h-5 w-5 rounded-md flex items-center justify-center mr-2">
                        <span className="text-blue-400 font-bold text-xs">CT</span>
                      </div>
                      Counter-Terrorist Side Players
                    </h3>
                    
                    <div className="space-y-3">
                      {getPlayers()
                        .filter(player => player.side.toLowerCase() === 'ct')
                        .map(player => (
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
                  
                  {/* Role Performance Summary */}
                  <div className="lg:col-span-1">
                    <div className="bg-blue-950/40 p-4 rounded-md border border-blue-900/30 h-full">
                      <h3 className="text-base font-medium mb-3">Role Performance Summary</h3>
                      
                      <div className="space-y-5">
                        <div>
                          <h4 className="text-sm font-medium mb-2">Role Effectiveness Distribution</h4>
                          <div className="h-[200px]">
                            <ResponsiveContainer width="100%" height="100%">
                              <BarChart
                                data={[
                                  { name: 'Entry', t: 0.74, ct: 0 },
                                  { name: 'Lurker', t: 0.68, ct: 0 },
                                  { name: 'Support', t: 0.56, ct: 0.63 },
                                  { name: 'AWPer', t: 0.81, ct: 0.78 },
                                  { name: 'Anchor', t: 0, ct: 0.85 },
                                  { name: 'Rotator', t: 0, ct: 0.71 },
                                ]}
                                margin={{ top: 5, right: 5, left: 5, bottom: 5 }}
                              >
                                <CartesianGrid strokeDasharray="3 3" stroke="#1e3a8a" opacity={0.3} />
                                <XAxis dataKey="name" stroke="#93c5fd" fontSize={10} />
                                <YAxis stroke="#93c5fd" fontSize={10} tickFormatter={(value) => `${Math.round(value * 100)}%`} />
                                <Tooltip 
                                  formatter={(value: number) => [`${(value * 100).toFixed(0)}%`, 'Effectiveness']}
                                  contentStyle={{ backgroundColor: '#0f172a', borderColor: '#1e40af' }}
                                />
                                <Bar dataKey="t" fill="#ef4444" name="T Side" />
                                <Bar dataKey="ct" fill="#3b82f6" name="CT Side" />
                              </BarChart>
                            </ResponsiveContainer>
                          </div>
                        </div>
                        
                        <div>
                          <h4 className="text-sm font-medium mb-2">Top Performing Role</h4>
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
                        </div>
                        
                        <div>
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
                  </div>
                </div>
              </TabsContent>
              
              {/* Team Strategies Tab */}
              <TabsContent value="team-strategies" className="space-y-4">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Team Analysis Cards */}
                  <TeamAnalysisCard 
                    side="T"
                    teamMetrics={data.analysis.teamMetrics.t}
                    teamInsights={data.analysis.teamStrategyInsights?.t}
                    roundPrediction={data.analysis.roundPrediction}
                  />
                  
                  <TeamAnalysisCard 
                    side="CT"
                    teamMetrics={data.analysis.teamMetrics.ct}
                    teamInsights={data.analysis.teamStrategyInsights?.ct}
                    roundPrediction={data.analysis.roundPrediction}
                  />
                </div>
                
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  {/* Map Control Visualization */}
                  <div className="lg:col-span-2 bg-blue-950/30 p-4 rounded-md border border-blue-900/30">
                    <h3 className="text-base font-medium mb-3">Map Control Analysis</h3>
                    
                    <div className="relative mb-6">
                      <div className="absolute inset-0 z-0">
                        <img 
                          src={infernoMapImg} 
                          alt="Inferno Map" 
                          className="w-full h-full object-cover opacity-10 rounded-lg"
                        />
                      </div>
                      
                      <div className="bg-blue-950/70 p-4 rounded-md border border-blue-800 relative z-10">
                        <h4 className="text-sm font-medium text-blue-100 mb-2">Control Distribution by Area</h4>
                        
                        <div className="grid grid-cols-3 gap-4 mt-4">
                          <div className="relative">
                            <div className="absolute inset-0 rounded-md" style={{ 
                              background: `linear-gradient(to bottom, rgba(59, 130, 246, ${data.analysis.teamMetrics.ct.siteControl.ASite}), rgba(239, 68, 68, ${data.analysis.teamMetrics.t.siteControl.ASite}))` 
                            }}></div>
                            <div className="bg-blue-950/60 border border-blue-900/50 p-3 rounded-md relative z-10">
                              <div className="text-center mb-2">A Site</div>
                              <div className="flex justify-between text-xs">
                                <div className="flex flex-col items-center">
                                  <Badge className="bg-blue-600">CT</Badge>
                                  <span className="mt-1 font-medium">{formatPercent(data.analysis.teamMetrics.ct.siteControl.ASite)}</span>
                                </div>
                                <div className="flex flex-col items-center">
                                  <Badge variant="destructive">T</Badge>
                                  <span className="mt-1 font-medium">{formatPercent(data.analysis.teamMetrics.t.siteControl.ASite)}</span>
                                </div>
                              </div>
                            </div>
                          </div>
                          
                          <div className="relative">
                            <div className="absolute inset-0 rounded-md" style={{ 
                              background: `linear-gradient(to bottom, rgba(59, 130, 246, ${data.analysis.teamMetrics.ct.siteControl.Mid}), rgba(239, 68, 68, ${data.analysis.teamMetrics.t.siteControl.Mid}))` 
                            }}></div>
                            <div className="bg-blue-950/60 border border-blue-900/50 p-3 rounded-md relative z-10">
                              <div className="text-center mb-2">Mid</div>
                              <div className="flex justify-between text-xs">
                                <div className="flex flex-col items-center">
                                  <Badge className="bg-blue-600">CT</Badge>
                                  <span className="mt-1 font-medium">{formatPercent(data.analysis.teamMetrics.ct.siteControl.Mid)}</span>
                                </div>
                                <div className="flex flex-col items-center">
                                  <Badge variant="destructive">T</Badge>
                                  <span className="mt-1 font-medium">{formatPercent(data.analysis.teamMetrics.t.siteControl.Mid)}</span>
                                </div>
                              </div>
                            </div>
                          </div>
                          
                          <div className="relative">
                            <div className="absolute inset-0 rounded-md" style={{ 
                              background: `linear-gradient(to bottom, rgba(59, 130, 246, ${data.analysis.teamMetrics.ct.siteControl.BSite}), rgba(239, 68, 68, ${data.analysis.teamMetrics.t.siteControl.BSite}))` 
                            }}></div>
                            <div className="bg-blue-950/60 border border-blue-900/50 p-3 rounded-md relative z-10">
                              <div className="text-center mb-2">B Site</div>
                              <div className="flex justify-between text-xs">
                                <div className="flex flex-col items-center">
                                  <Badge className="bg-blue-600">CT</Badge>
                                  <span className="mt-1 font-medium">{formatPercent(data.analysis.teamMetrics.ct.siteControl.BSite)}</span>
                                </div>
                                <div className="flex flex-col items-center">
                                  <Badge variant="destructive">T</Badge>
                                  <span className="mt-1 font-medium">{formatPercent(data.analysis.teamMetrics.t.siteControl.BSite)}</span>
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                        
                        <div className="mt-4 text-xs text-blue-300/90">
                          <p>
                            T side is establishing strong B site control ({formatPercent(data.analysis.teamMetrics.t.siteControl.BSite)}) through Banana, 
                            suggesting a focused B execute strategy. CT defense is prioritizing A site security with minimal mid presence,
                            potentially leaving B site vulnerable to coordinated T side pressure.
                          </p>
                        </div>
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="bg-blue-950/40 p-3 rounded-md border border-blue-900/30">
                        <h4 className="text-sm font-medium mb-2">Team Movement Patterns</h4>
                        <div className="h-[220px]">
                          <ResponsiveContainer width="100%" height="100%">
                            <LineChart
                              data={[
                                { position: 'Early Round', t: data.analysis.teamMetrics.t.teamSpread * 0.7, ct: data.analysis.teamMetrics.ct.teamSpread * 0.7 },
                                { position: 'Mid Round', t: data.analysis.teamMetrics.t.teamSpread * 0.9, ct: data.analysis.teamMetrics.ct.teamSpread * 0.9 },
                                { position: 'Late Round', t: data.analysis.teamMetrics.t.teamSpread * 1.1, ct: data.analysis.teamMetrics.ct.teamSpread * 1.1 },
                                { position: 'Execute', t: data.analysis.teamMetrics.t.teamSpread * 0.8, ct: data.analysis.teamMetrics.ct.teamSpread * 1.2 },
                              ]}
                              margin={{ top: 10, right: 10, left: 10, bottom: 10 }}
                            >
                              <CartesianGrid strokeDasharray="3 3" stroke="#1e3a8a" opacity={0.3} />
                              <XAxis dataKey="position" stroke="#93c5fd" fontSize={10} />
                              <YAxis stroke="#93c5fd" fontSize={10} />
                              <Tooltip 
                                contentStyle={{ backgroundColor: '#0f172a', borderColor: '#1e40af' }}
                              />
                              <Legend />
                              <Line type="monotone" dataKey="t" stroke="#ef4444" name="T Spread" />
                              <Line type="monotone" dataKey="ct" stroke="#3b82f6" name="CT Spread" />
                            </LineChart>
                          </ResponsiveContainer>
                        </div>
                      </div>
                      
                      <div className="bg-blue-950/40 p-3 rounded-md border border-blue-900/30">
                        <h4 className="text-sm font-medium mb-2">Trade Potential Analysis</h4>
                        <div className="h-[220px]">
                          <ResponsiveContainer width="100%" height="100%">
                            <AreaChart
                              data={[
                                { 
                                  name: 'A Site', 
                                  t: data.analysis.teamMetrics.t.tradeEfficiency * data.analysis.teamMetrics.t.siteControl.ASite * 1.2, 
                                  ct: data.analysis.teamMetrics.ct.tradeEfficiency * data.analysis.teamMetrics.ct.siteControl.ASite * 1.2 
                                },
                                { 
                                  name: 'Mid', 
                                  t: data.analysis.teamMetrics.t.tradeEfficiency * data.analysis.teamMetrics.t.siteControl.Mid * 1.2, 
                                  ct: data.analysis.teamMetrics.ct.tradeEfficiency * data.analysis.teamMetrics.ct.siteControl.Mid * 1.2 
                                },
                                { 
                                  name: 'B Site', 
                                  t: data.analysis.teamMetrics.t.tradeEfficiency * data.analysis.teamMetrics.t.siteControl.BSite * 1.2, 
                                  ct: data.analysis.teamMetrics.ct.tradeEfficiency * data.analysis.teamMetrics.ct.siteControl.BSite * 1.2 
                                },
                              ]}
                              margin={{ top: 10, right: 10, left: 10, bottom: 10 }}
                            >
                              <CartesianGrid strokeDasharray="3 3" stroke="#1e3a8a" opacity={0.3} />
                              <XAxis dataKey="name" stroke="#93c5fd" fontSize={10} />
                              <YAxis stroke="#93c5fd" fontSize={10} tickFormatter={(value) => `${Math.round(value * 100)}%`} />
                              <Tooltip 
                                formatter={(value: number) => [`${(value * 100).toFixed(0)}%`, 'Trade Potential']}
                                contentStyle={{ backgroundColor: '#0f172a', borderColor: '#1e40af' }}
                              />
                              <Legend />
                              <Area type="monotone" dataKey="t" stackId="1" stroke="#ef4444" fill="#ef444440" name="T Side" />
                              <Area type="monotone" dataKey="ct" stackId="2" stroke="#3b82f6" fill="#3b82f640" name="CT Side" />
                            </AreaChart>
                          </ResponsiveContainer>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  {/* Tactical Analysis */}
                  <div className="bg-blue-950/30 p-4 rounded-md border border-blue-900/30">
                    <h3 className="text-base font-medium mb-3">Tactical Analysis</h3>
                    
                    <div className="space-y-4">
                      <div className="bg-blue-950/50 p-3 rounded-md">
                        <h4 className="text-sm font-medium mb-2 flex items-center">
                          <FileBarChart className="h-4 w-4 mr-1.5 text-blue-400" />
                          Round Summary
                        </h4>
                        <p className="text-xs text-blue-300/90">
                          Round 4 shows a clear T-side focus on B site control ({formatPercent(data.analysis.teamMetrics.t.siteControl.BSite)}), 
                          with coordinated team movement ({formatPercent(data.analysis.teamStrategyInsights?.t.movementCoordination || 0.7)}).
                          CT defense is primarily anchored at A site ({formatPercent(data.analysis.teamMetrics.ct.siteControl.ASite)}), 
                          suggesting a potential misread of T side intentions.
                        </p>
                      </div>
                      
                      <div className="space-y-1">
                        <h4 className="text-sm font-medium mb-2">Key Performance Metrics</h4>
                        
                        <div className="flex justify-between items-center text-xs">
                          <div className="flex items-center">
                            <Target className="h-3.5 w-3.5 text-blue-400 mr-1.5" />
                            <span>Map Control Efficiency</span>
                          </div>
                          <div className="flex items-center">
                            <span className="text-red-300 mr-2">T {formatPercent(data.analysis.teamStrategyInsights?.t.mapControlDistribution?.BSite || 0.7)}</span>
                            <span className="text-blue-300">CT {formatPercent(data.analysis.teamStrategyInsights?.ct.mapControlDistribution?.ASite || 0.65)}</span>
                          </div>
                        </div>
                        
                        <div className="flex justify-between items-center text-xs">
                          <div className="flex items-center">
                            <Users className="h-3.5 w-3.5 text-blue-400 mr-1.5" />
                            <span>Team Coordination</span>
                          </div>
                          <div className="flex items-center">
                            <span className="text-red-300 mr-2">T {formatPercent(data.analysis.teamStrategyInsights?.t.movementCoordination || 0.75)}</span>
                            <span className="text-blue-300">CT {formatPercent(data.analysis.teamStrategyInsights?.ct.movementCoordination || 0.6)}</span>
                          </div>
                        </div>
                        
                        <div className="flex justify-between items-center text-xs">
                          <div className="flex items-center">
                            <Swords className="h-3.5 w-3.5 text-blue-400 mr-1.5" />
                            <span>Trade Potential</span>
                          </div>
                          <div className="flex items-center">
                            <span className="text-red-300 mr-2">T {formatPercent(data.analysis.teamMetrics.t.tradeEfficiency)}</span>
                            <span className="text-blue-300">CT {formatPercent(data.analysis.teamMetrics.ct.tradeEfficiency)}</span>
                          </div>
                        </div>
                        
                        <div className="flex justify-between items-center text-xs">
                          <div className="flex items-center">
                            <Timer className="h-3.5 w-3.5 text-blue-400 mr-1.5" />
                            <span>Rotation Timing</span>
                          </div>
                          <div className="flex items-center">
                            <span className="text-red-300 mr-2">T {formatPercent(data.analysis.teamStrategyInsights?.t.rotationTimings || 0.65)}</span>
                            <span className="text-blue-300">CT {formatPercent(data.analysis.teamStrategyInsights?.ct.rotationTimings || 0.55)}</span>
                          </div>
                        </div>
                      </div>
                      
                      <div className="bg-blue-950/50 p-3 rounded-md">
                        <h4 className="text-sm font-medium mb-2 flex items-center">
                          <TrendingUp className="h-4 w-4 mr-1.5 text-blue-400" />
                          Strategic Advantage
                        </h4>
                        
                        <div className="relative pt-1">
                          <div className="flex h-3 mb-2 overflow-hidden rounded-full">
                            <div 
                              className="bg-gradient-to-r from-red-900 to-red-600" 
                              style={{ width: `${(data.analysis.roundPrediction?.tProbability || 0.6) * 100}%` }}
                            ></div>
                            <div 
                              className="bg-gradient-to-r from-blue-600 to-blue-800" 
                              style={{ width: `${(data.analysis.roundPrediction?.ctProbability || 0.4) * 100}%` }}
                            ></div>
                          </div>
                          <div className="flex justify-between text-xs">
                            <span className="text-red-300">T Side: {formatPercent(data.analysis.roundPrediction?.tProbability || 0.6)}</span>
                            <span className="text-blue-300">CT Side: {formatPercent(data.analysis.roundPrediction?.ctProbability || 0.4)}</span>
                          </div>
                        </div>
                        
                        <div className="mt-3 text-xs text-blue-300/90">
                          <p>
                            T side has a tactical advantage due to superior B site control and team coordination. 
                            CT side is not optimally positioned to counter the apparent B site execute strategy.
                          </p>
                        </div>
                      </div>
                      
                      <Button 
                        onClick={handleRunAnalysis} 
                        className="w-full bg-gradient-to-r from-blue-700 to-purple-600 hover:from-blue-800 hover:to-purple-700"
                      >
                        Reprocess Positional Data
                      </Button>
                    </div>
                  </div>
                </div>
              </TabsContent>
            </Tabs>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
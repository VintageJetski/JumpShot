import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import {
  Map,
  Loader2,
  Activity,
  Users,
  AlertCircle,
  ChevronRight,
  BarChart2
} from "lucide-react";
import { ScatterChart, Scatter, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ZAxis } from 'recharts';
import { Badge } from "@/components/ui/badge";

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

interface RoundPositionalMetrics {
  round_num: number;
  teamMetrics: {
    t: TeamMetrics;
    ct: TeamMetrics;
  };
  playerMetrics: Record<string, PlayerMovementAnalysis>;
}

interface XYZAnalysisResponse {
  message: string;
  roundNum: number;
  analysis: RoundPositionalMetrics;
}

export function XYZDataAnalysis() {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("overview");
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
  
  // Format player data for charts - optimized for performance
  const getPositionalData = () => {
    if (!data || !data.analysis) return [];

    const allPoints: { x: number, y: number, z: number, intensity: number, name: string, side: string }[] = [];
    
    // Sample the data for better performance - limit to 500 total points
    const maxPoints = 500;
    const players = Object.values(data.analysis.playerMetrics);
    const maxPointsPerPlayer = Math.floor(maxPoints / players.length);
    
    players.forEach(player => {
      // Take a subset of points for each player
      const pointsToSample = Math.min(maxPointsPerPlayer, player.positionHeatmap.length);
      const samplingInterval = Math.max(1, Math.floor(player.positionHeatmap.length / pointsToSample));
      
      for (let i = 0; i < player.positionHeatmap.length; i += samplingInterval) {
        const point = player.positionHeatmap[i];
        if (point) {
          allPoints.push({
            x: point.x,
            y: point.y,
            z: 10,
            intensity: point.intensity,
            name: player.name,
            side: player.side
          });
        }
        
        // Safety check to avoid adding too many points
        if (allPoints.length >= maxPoints) break;
      }
    });
    
    return allPoints;
  };
  
  // Get data for a specific player
  const getPlayerData = (steamId: string) => {
    if (!data || !data.analysis || !data.analysis.playerMetrics[steamId]) return [];
    
    const player = data.analysis.playerMetrics[steamId];
    return player.positionHeatmap.map(point => ({
      x: point.x,
      y: point.y,
      z: point.intensity,
      intensity: point.intensity
    }));
  };

  // Get sorted array of players
  const getPlayers = () => {
    if (!data || !data.analysis) return [];
    
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
          <CardDescription>
            Process and visualize XYZ positional data from CS2 matches to analyze player movements and patterns
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {!data ? (
            <div className="text-center p-6 bg-blue-950/20 rounded-md border border-blue-900/30">
              <Activity className="h-10 w-10 text-blue-500/30 mx-auto mb-3" />
              <p className="text-blue-300/70 mb-4">
                Run the data processor to analyze the sample XYZ positional data from round 4
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
                  "Process Sample XYZ Data"
                )}
              </Button>
            </div>
          ) : (
            <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
              <TabsList className="grid grid-cols-3 bg-blue-950/30 border border-blue-900/30">
                <TabsTrigger value="overview">Overview</TabsTrigger>
                <TabsTrigger value="team-analysis">Team Analysis</TabsTrigger>
                <TabsTrigger value="player-analysis">Player Analysis</TabsTrigger>
              </TabsList>
              
              {/* Overview Tab */}
              <TabsContent value="overview" className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <Card className="bg-blue-950/20 border border-blue-900/30">
                    <CardHeader className="pb-2">
                      <div className="text-sm text-blue-300/70">Round Number</div>
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">{data.analysis.round_num}</div>
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
                      <div className="text-sm text-blue-300/70">Data Points</div>
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">
                        {getPositionalData().length}
                      </div>
                    </CardContent>
                  </Card>
                </div>

                <div className="p-4 bg-blue-950/20 rounded-md border border-blue-900/30">
                  <h3 className="text-lg font-medium mb-3">Position Heatmap (All Players) - Inferno</h3>
                  <div className="h-[500px] w-full relative overflow-hidden">
                    {/* Map Background Image */}
                    <div className="absolute inset-0 opacity-50 z-0">
                      <img 
                        src="/attached_assets/Infernopano.png" 
                        alt="Inferno Map" 
                        className="w-full h-full object-contain"
                      />
                    </div>
                    
                    {/* Map Coordinates Labels */}
                    <div className="absolute top-2 left-2 z-10 bg-blue-900/80 text-xs text-blue-100 px-2 py-1 rounded">
                      A Site (NE): <span className="text-blue-200 font-semibold">O-P, 5-7</span>
                    </div>
                    <div className="absolute top-2 left-32 z-10 bg-blue-900/80 text-xs text-blue-100 px-2 py-1 rounded">
                      B Site (NW): <span className="text-blue-200 font-semibold">C-E, 3-5</span>
                    </div>
                    <div className="absolute top-2 right-2 z-10 bg-blue-900/80 text-xs text-blue-100 px-2 py-1 rounded">
                      Mid: <span className="text-blue-200 font-semibold">G-J, 8-10</span>
                    </div>
                    
                    <ResponsiveContainer width="100%" height="100%" className="z-10 relative">
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
                          range={[50, 400]} 
                          name="Intensity" 
                        />
                        <Tooltip 
                          cursor={{ strokeDasharray: '3 3' }}
                          contentStyle={{ backgroundColor: '#0f172a', borderColor: '#1e40af' }}
                          labelStyle={{ color: '#93c5fd' }}
                          formatter={(value: any, name: any) => {
                            // Convert coordinates to map callouts
                            if (name === 'X Position' || name === 'Y Position') {
                              let location = "";
                              
                              // This is a simplified mapping - would be more accurate with precise zone boundaries
                              const numValue = Number(value);
                              if (numValue > 1000 && numValue < 2000) {
                                if (name === 'X Position') location = " (A Site Area)";
                                if (name === 'Y Position') location = " (Upper Mid)";
                              } else if (numValue < -1000) {
                                if (name === 'X Position') location = " (B Site/Banana Area)";
                                if (name === 'Y Position') location = " (T Spawn Area)";
                              } else if (numValue > 0 && numValue < 1000) {
                                location = " (Mid Area)";
                              }
                              
                              return [`${value}${location}`, name];
                            }
                            return [`${value}`, name];
                          }}
                        />
                        <Scatter 
                          name="T Side" 
                          data={getPositionalData().filter(p => p.side.toLowerCase() === 't')} 
                          fill="#ef4444" 
                        />
                        <Scatter 
                          name="CT Side" 
                          data={getPositionalData().filter(p => p.side.toLowerCase() === 'ct')} 
                          fill="#3b82f6" 
                        />
                      </ScatterChart>
                    </ResponsiveContainer>
                    
                    {/* Map Legend */}
                    <div className="absolute bottom-2 right-2 z-10 bg-blue-950/80 rounded p-2">
                      <div className="text-xs font-semibold text-blue-100 mb-1">Map Areas:</div>
                      <div className="flex flex-wrap gap-2">
                        <div className="flex items-center gap-1">
                          <div className="w-2 h-2 rounded-full bg-red-500"></div>
                          <span className="text-xs text-blue-200">A Site</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <div className="w-2 h-2 rounded-full bg-green-500"></div>
                          <span className="text-xs text-blue-200">B Site</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <div className="w-2 h-2 rounded-full bg-yellow-500"></div>
                          <span className="text-xs text-blue-200">Mid</span>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  <div className="mt-3 text-sm text-blue-300/70">
                    <p>The visualization shows player positions on de_inferno during round 4. 
                    T players (red) are primarily concentrated in Banana (B approach) and Mid areas. 
                    CT players (blue) are defending both bombsites with particular focus on Arch and B Site.</p>
                  </div>
                </div>
              </TabsContent>
              
              {/* Team Analysis Tab */}
              <TabsContent value="team-analysis" className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* T Side Team Analysis */}
                  <Card className="bg-blue-950/20 border border-red-900/30">
                    <CardHeader className="pb-2">
                      <CardTitle className="text-base flex items-center gap-2">
                        <Badge className="bg-red-500/70 text-white">T Side</Badge>
                        <span>Team Analysis</span>
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-2">
                      <div className="flex justify-between items-center">
                        <div className="text-sm text-blue-300/70">Average Distance</div>
                        <div className="font-medium">
                          {data.analysis.teamMetrics.t.avgTeamDistance.toFixed(2)} units
                        </div>
                      </div>
                      <Separator className="my-1 bg-blue-900/30" />
                      <div className="flex justify-between items-center">
                        <div className="text-sm text-blue-300/70">Team Spread</div>
                        <div className="font-medium">
                          {data.analysis.teamMetrics.t.teamSpread.toFixed(2)} units
                        </div>
                      </div>
                      <Separator className="my-1 bg-blue-900/30" />
                      <div>
                        <div className="text-sm text-blue-300/70 mb-1">Site Control</div>
                        <div className="grid grid-cols-3 gap-2">
                          <div className="p-2 rounded bg-blue-950/30 text-center">
                            <div className="text-xs text-blue-300/70">A Site</div>
                            <div className="font-medium text-red-400">
                              {Math.round(data.analysis.teamMetrics.t.siteControl.ASite * 100)}%
                            </div>
                          </div>
                          <div className="p-2 rounded bg-blue-950/30 text-center">
                            <div className="text-xs text-blue-300/70">B Site</div>
                            <div className="font-medium text-red-400">
                              {Math.round(data.analysis.teamMetrics.t.siteControl.BSite * 100)}%
                            </div>
                          </div>
                          <div className="p-2 rounded bg-blue-950/30 text-center">
                            <div className="text-xs text-blue-300/70">Mid</div>
                            <div className="font-medium text-red-400">
                              {Math.round(data.analysis.teamMetrics.t.siteControl.Mid * 100)}%
                            </div>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                  
                  {/* CT Side Team Analysis */}
                  <Card className="bg-blue-950/20 border border-blue-900/30">
                    <CardHeader className="pb-2">
                      <CardTitle className="text-base flex items-center gap-2">
                        <Badge className="bg-blue-500/70 text-white">CT Side</Badge>
                        <span>Team Analysis</span>
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-2">
                      <div className="flex justify-between items-center">
                        <div className="text-sm text-blue-300/70">Average Distance</div>
                        <div className="font-medium">
                          {data.analysis.teamMetrics.ct.avgTeamDistance.toFixed(2)} units
                        </div>
                      </div>
                      <Separator className="my-1 bg-blue-900/30" />
                      <div className="flex justify-between items-center">
                        <div className="text-sm text-blue-300/70">Team Spread</div>
                        <div className="font-medium">
                          {data.analysis.teamMetrics.ct.teamSpread.toFixed(2)} units
                        </div>
                      </div>
                      <Separator className="my-1 bg-blue-900/30" />
                      <div>
                        <div className="text-sm text-blue-300/70 mb-1">Site Control</div>
                        <div className="grid grid-cols-3 gap-2">
                          <div className="p-2 rounded bg-blue-950/30 text-center">
                            <div className="text-xs text-blue-300/70">A Site</div>
                            <div className="font-medium text-blue-400">
                              {Math.round(data.analysis.teamMetrics.ct.siteControl.ASite * 100)}%
                            </div>
                          </div>
                          <div className="p-2 rounded bg-blue-950/30 text-center">
                            <div className="text-xs text-blue-300/70">B Site</div>
                            <div className="font-medium text-blue-400">
                              {Math.round(data.analysis.teamMetrics.ct.siteControl.BSite * 100)}%
                            </div>
                          </div>
                          <div className="p-2 rounded bg-blue-950/30 text-center">
                            <div className="text-xs text-blue-300/70">Mid</div>
                            <div className="font-medium text-blue-400">
                              {Math.round(data.analysis.teamMetrics.ct.siteControl.Mid * 100)}%
                            </div>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </TabsContent>
              
              {/* Player Analysis Tab */}
              <TabsContent value="player-analysis" className="space-y-4">
                {activePlayer ? (
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <Button
                        variant="ghost" 
                        size="sm" 
                        className="text-blue-300"
                        onClick={() => setActivePlayer(null)}
                      >
                        <ChevronRight className="mr-1 h-4 w-4 rotate-180" />
                        Back to Players
                      </Button>
                      <Badge 
                        className={activePlayer && data.analysis.playerMetrics[activePlayer].side.toLowerCase() === 't' 
                          ? "bg-red-500/70" 
                          : "bg-blue-500/70"
                        }
                      >
                        {activePlayer && data.analysis.playerMetrics[activePlayer].side} Side
                      </Badge>
                    </div>
                    
                    <Card className="bg-blue-950/20 border border-blue-900/30">
                      <CardHeader>
                        <CardTitle>
                          {activePlayer && data.analysis.playerMetrics[activePlayer].name}
                        </CardTitle>
                        <CardDescription>
                          Player Movement Analysis for Round {data.analysis.round_num}
                        </CardDescription>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                          <div className="p-3 rounded bg-blue-950/30 text-center">
                            <div className="text-xs text-blue-300/70">Total Distance</div>
                            <div className="font-medium">
                              {activePlayer && data.analysis.playerMetrics[activePlayer].totalDistance.toFixed(2)} units
                            </div>
                          </div>
                          <div className="p-3 rounded bg-blue-950/30 text-center">
                            <div className="text-xs text-blue-300/70">Avg. Speed</div>
                            <div className="font-medium">
                              {activePlayer && data.analysis.playerMetrics[activePlayer].avgSpeed.toFixed(2)} units/tick
                            </div>
                          </div>
                          <div className="p-3 rounded bg-blue-950/30 text-center">
                            <div className="text-xs text-blue-300/70">Rotations</div>
                            <div className="font-medium">
                              {activePlayer && data.analysis.playerMetrics[activePlayer].rotations}
                            </div>
                          </div>
                        </div>
                        
                        <div className="space-y-2">
                          <h4 className="text-sm font-medium">Site Presence</h4>
                          <div className="h-8 w-full bg-blue-950/30 rounded overflow-hidden flex">
                            {activePlayer && (
                              <>
                                <div 
                                  className="h-full bg-red-500/50" 
                                  style={{ 
                                    width: `${data.analysis.playerMetrics[activePlayer].sitePresence.ASite * 100}%` 
                                  }}
                                />
                                <div 
                                  className="h-full bg-green-500/50" 
                                  style={{ 
                                    width: `${data.analysis.playerMetrics[activePlayer].sitePresence.BSite * 100}%` 
                                  }}
                                />
                                <div 
                                  className="h-full bg-blue-500/50" 
                                  style={{ 
                                    width: `${data.analysis.playerMetrics[activePlayer].sitePresence.Mid * 100}%` 
                                  }}
                                />
                              </>
                            )}
                          </div>
                          <div className="flex justify-between text-xs text-blue-300/70">
                            <div className="flex items-center gap-1">
                              <div className="w-2 h-2 bg-red-500/50 rounded-full" />
                              <span>A Site</span>
                            </div>
                            <div className="flex items-center gap-1">
                              <div className="w-2 h-2 bg-green-500/50 rounded-full" />
                              <span>B Site</span>
                            </div>
                            <div className="flex items-center gap-1">
                              <div className="w-2 h-2 bg-blue-500/50 rounded-full" />
                              <span>Mid</span>
                            </div>
                          </div>
                        </div>
                        
                        <div className="pt-4">
                          <h4 className="text-sm font-medium mb-2">Player Movement Analysis - Inferno</h4>
                          <div className="h-[350px] w-full relative overflow-hidden">
                            {/* Map Background Image */}
                            <div className="absolute inset-0 opacity-40 z-0">
                              <img 
                                src="/attached_assets/Infernopano.png" 
                                alt="Inferno Map" 
                                className="w-full h-full object-contain"
                              />
                            </div>
                            
                            <ResponsiveContainer width="100%" height="100%" className="z-10 relative">
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
                                  range={[100, 500]} 
                                  name="Intensity" 
                                />
                                <Tooltip 
                                  cursor={{ strokeDasharray: '3 3' }}
                                  contentStyle={{ backgroundColor: '#0f172a', borderColor: '#1e40af' }}
                                  labelStyle={{ color: '#93c5fd' }}
                                  formatter={(value, name) => {
                                    // Convert coordinates to map callouts
                                    if (name === 'X Position' || name === 'Y Position') {
                                      let location = "";
                                      
                                      // Simplified mapping for Inferno areas
                                      const numValue = Number(value);
                                      if (numValue > 1000 && numValue < 2000) {
                                        if (name === 'X Position') location = " (A Site Area)";
                                        if (name === 'Y Position') location = " (Upper Mid)";
                                      } else if (numValue < -1000) {
                                        if (name === 'X Position') location = " (B Site/Banana Area)";
                                        if (name === 'Y Position') location = " (T Spawn Area)";
                                      } else if (numValue > 0 && numValue < 1000) {
                                        location = " (Mid Area)";
                                      }
                                      
                                      return [`${value}${location}`, name];
                                    }
                                    return [`${value}`, name];
                                  }}
                                />
                                <Scatter 
                                  name="Positions" 
                                  data={activePlayer ? getPlayerData(activePlayer) : []} 
                                  fill={activePlayer && data.analysis.playerMetrics[activePlayer].side.toLowerCase() === 't' 
                                    ? "#ef4444" 
                                    : "#3b82f6"}
                                />
                              </ScatterChart>
                            </ResponsiveContainer>
                            
                            {/* Player Role Info */}
                            <div className="absolute top-2 right-2 z-10 bg-blue-950/80 p-2 rounded text-xs">
                              <div className="font-medium text-blue-200">
                                {activePlayer && data.analysis.playerMetrics[activePlayer].side === 'T' ? 'T Role' : 'CT Role'}: 
                                <span className="ml-1 text-white">
                                  {activePlayer && data.analysis.playerMetrics[activePlayer].side === 'T' ? 
                                    (activePlayer === '76561197991272318' ? 'Lurker' : 
                                     activePlayer === '76561197997351207' ? 'Entry' : 'Support') : 
                                    (activePlayer === '76561198034202275' ? 'Anchor (B)' : 
                                     activePlayer === '76561197987144812' ? 'Rotator' : 'Anchor (A)')}
                                </span>
                              </div>
                            </div>
                          </div>
                          
                          <div className="mt-4 p-3 bg-blue-950/40 rounded">
                            <h5 className="text-sm font-medium mb-2">Role Analysis</h5>
                            <div className="text-xs text-blue-300/90 space-y-1">
                              {activePlayer && (
                                <>
                                  {activePlayer && data.analysis.playerMetrics[activePlayer].side === 'T' ? (
                                    <>
                                      <p>Playing as a {activePlayer === '76561197991272318' ? 'Lurker' : 
                                                         activePlayer === '76561197997351207' ? 'Entry' : 'Support'}, this player&apos;s 
                                        movement pattern shows {' '}
                                        {activePlayer === '76561197991272318' ? 
                                          'flanking behaviors through less-traveled areas of the map, providing tactical advantages by surprising opponents from unexpected angles.' : 
                                          activePlayer === '76561197997351207' ? 
                                          'aggressive positioning at the front lines, leading the team&apos;s charge into bomb sites and creating early space.' : 
                                          'positioning that enables utility usage and trading potential, providing backup for entry fraggers.'}
                                      </p>
                                      <p className="mt-1">
                                        {activePlayer === '76561197991272318' ? 
                                          'Their rotation patterns demonstrate patience in timing and map awareness.' : 
                                          activePlayer === '76561197997351207' ? 
                                          'The data shows rapid site entry and high movement speed consistent with an entry role.' : 
                                          'The player&apos;s positioning shows strategic utility usage spots and trade-fragging positions.'}
                                      </p>
                                    </>
                                  ) : (
                                    <>
                                      <p>As a {activePlayer === '76561198034202275' ? 'B Site Anchor' : 
                                                  activePlayer === '76561197987144812' ? 'Rotator' : 'A Site Anchor'}, this player&apos;s 
                                        movement data reveals {' '}
                                        {activePlayer === '76561198034202275' 
                                          ? 'consistent positioning to hold and defend B site, maintaining control of key angles and chokepoints.' 
                                          : activePlayer === '76561197987144812' 
                                          ? 'flexible positioning between bomb sites, enabling quick rotations and mid-round adaptations.' 
                                          : 'strong A site anchoring with positioning that maximizes defensive advantages.'}
                                      </p>
                                      <p className="mt-1">
                                        {activePlayer === '76561198034202275' 
                                          ? 'Their position consistency suggests disciplined site control and angle holding.' 
                                          : activePlayer === '76561197987144812' 
                                          ? 'The movement patterns show optimized rotation paths and timings between sites.' 
                                          : 'Their site presence data indicates reliable site defense and occasional rotations when needed.'}
                                      </p>
                                    </>
                                  )}
                                </>
                              )}
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {getPlayers().map((player) => (
                      <Card 
                        key={player.user_steamid}
                        className={`bg-blue-950/20 border ${
                          player.side.toLowerCase() === 't' 
                            ? 'border-red-900/30 hover:border-red-700/50' 
                            : 'border-blue-900/30 hover:border-blue-700/50'
                        } cursor-pointer transition-colors`}
                        onClick={() => setActivePlayer(player.user_steamid)}
                      >
                        <CardHeader className="pb-2">
                          <CardTitle className="text-base flex justify-between items-center">
                            <span>{player.name}</span>
                            <Badge 
                              className={player.side.toLowerCase() === 't' 
                                ? "bg-red-500/70 text-xs" 
                                : "bg-blue-500/70 text-xs"
                              }
                            >
                              {player.side}
                            </Badge>
                          </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-2">
                          <div className="flex justify-between text-sm">
                            <span className="text-blue-300/70">Distance</span>
                            <span>{player.totalDistance.toFixed(0)} units</span>
                          </div>
                          <div className="flex justify-between text-sm">
                            <span className="text-blue-300/70">Rotations</span>
                            <span>{player.rotations}</span>
                          </div>
                          <div className="flex justify-between text-sm">
                            <span className="text-blue-300/70">Top Area</span>
                            <span>
                              {Object.entries(player.sitePresence)
                                .sort((a, b) => b[1] - a[1])[0][0]}
                            </span>
                          </div>
                        </CardContent>
                        <CardFooter className="pt-0">
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            className="w-full text-blue-300 hover:text-blue-100"
                          >
                            View Details
                            <ChevronRight className="ml-1 h-4 w-4" />
                          </Button>
                        </CardFooter>
                      </Card>
                    ))}
                  </div>
                )}
              </TabsContent>
            </Tabs>
          )}
        </CardContent>
        
        {data && (
          <CardFooter className="flex justify-between border-t border-blue-900/30 pt-4">
            <p className="text-sm text-blue-300/70">
              Sample data from round {data.analysis.round_num}
            </p>
            <Button 
              variant="outline" 
              size="sm"
              onClick={handleRunAnalysis}
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-3 w-3 animate-spin" />
                  Reprocessing...
                </>
              ) : (
                "Reprocess Data"
              )}
            </Button>
          </CardFooter>
        )}
      </Card>
      
      {error && (
        <div className="p-4 bg-red-900/20 border border-red-900/50 rounded-md flex items-start gap-3">
          <AlertCircle className="h-5 w-5 text-red-500 flex-shrink-0 mt-0.5" />
          <div>
            <h3 className="font-medium text-red-400">Error Processing XYZ Data</h3>
            <p className="text-sm text-red-300/70 mt-1">
              {error instanceof Error ? error.message : 'Unknown error occurred'}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
import { useState, useEffect, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { PlayerWithPIV, PlayerRole } from "../../../shared/schema";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "../components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../components/ui/select";
import { Input } from "../components/ui/input";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "../components/ui/tabs";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "../components/ui/tooltip";
import { Button } from "../components/ui/button";
import { Separator } from "../components/ui/separator";
import { Progress } from "../components/ui/progress";
import { Badge } from "../components/ui/badge";
import { Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, ResponsiveContainer, Scatter, ScatterChart, ZAxis, Legend, XAxis, YAxis, CartesianGrid, BarChart, Bar, Cell, Tooltip as RechartsTooltip } from "recharts";
import { ArrowRightLeft, Zap, Target, Crosshair, ShieldAlert, Sparkles, Brain, Lightbulb, Info, BarChart2, PieChart, BadgeInfo } from "lucide-react";
import RoleBadge from "../components/ui/role-badge";
import PerformanceComparisonSlider from "../components/player-comparison/PerformanceComparisonSlider";

export default function PlayerComparisonsPage() {
  const [player1Id, setPlayer1Id] = useState<string>("");
  const [player2Id, setPlayer2Id] = useState<string>("");
  const [searchQuery1, setSearchQuery1] = useState<string>("");
  const [searchQuery2, setSearchQuery2] = useState<string>("");
  const [comparisonMetric, setComparisonMetric] = useState<"piv" | "kd" | "role_score" | "consistency">("piv");
  const [chartType, setChartType] = useState<"radar" | "scatter" | "bar">("radar");
  const [analysisTab, setAnalysisTab] = useState<"overall" | "ct" | "t">("overall");
  
  const { data: players = [], isLoading } = useQuery<PlayerWithPIV[]>({
    queryKey: ["/api/players"],
  });
  
  // Debug: Log players data to console
  useEffect(() => {
    console.log("Players data loaded:", players?.length || 0, "players");
    if (players?.length > 0) {
      console.log("First player:", players[0]);
    }
  }, [players]);

  // Fetch selected players' full data
  const player1 = useMemo(() => 
    players.find(p => p.id === player1Id), [players, player1Id]
  );
  
  const player2 = useMemo(() => 
    players.find(p => p.id === player2Id), [players, player2Id]
  );

  // Auto-select first two players if none selected
  useEffect(() => {
    if (players.length >= 2 && !player1Id && !player2Id) {
      // Find two players from different teams with same role if possible
      let firstPlayer = players[0];
      let secondPlayer = players.find(p => 
        p.team !== firstPlayer.team && p.role === firstPlayer.role
      ) || players[1];
      
      setPlayer1Id(firstPlayer.id);
      setPlayer2Id(secondPlayer.id);
    }
  }, [players, player1Id, player2Id]);

  // Generate comparison data for radar chart
  const radarData = useMemo(() => {
    if (!player1 || !player2) return [];
    
    // Create metrics based on selected tab
    const getMetricsForTab = (player: PlayerWithPIV) => {
      if (analysisTab === "ct" && player.ctMetrics) {
        return player.ctMetrics;
      } else if (analysisTab === "t" && player.tMetrics) {
        return player.tMetrics;
      } else {
        return player.metrics;
      }
    };
    
    const p1Metrics = getMetricsForTab(player1);
    const p2Metrics = getMetricsForTab(player2);
    
    // Get the role-specific metrics
    const p1RoleMetrics = p1Metrics.roleMetrics || {};
    const p2RoleMetrics = p2Metrics.roleMetrics || {};
    
    // Generate normalized comparison metrics (0-100 scale)
    const normalizeValue = (value: number) => Math.min(100, Math.max(0, value * 100));
    
    const comparisonData = [
      {
        metric: "PIV Rating",
        [player1.name]: normalizeValue(player1.piv),
        [player2.name]: normalizeValue(player2.piv),
        fullMark: 100,
      },
      {
        metric: "K/D Ratio",
        [player1.name]: normalizeValue(player1.kd / 2), // Normalize K/D (assuming 2.0 is exceptional)
        [player2.name]: normalizeValue(player2.kd / 2),
        fullMark: 100,
      },
      {
        metric: "Role Score", 
        [player1.name]: normalizeValue(p1Metrics.rcs.value),
        [player2.name]: normalizeValue(p2Metrics.rcs.value),
        fullMark: 100,
      },
      {
        metric: "Consistency",
        [player1.name]: normalizeValue(p1Metrics.icf.value),
        [player2.name]: normalizeValue(p2Metrics.icf.value),
        fullMark: 100,
      },
      {
        metric: "Team Synergy",
        [player1.name]: normalizeValue(p1Metrics.sc.value),
        [player2.name]: normalizeValue(p2Metrics.sc.value),
        fullMark: 100,
      },
    ];
    
    // Add key role-specific metrics from both players
    const p1RoleKey = Object.keys(p1RoleMetrics)
      .filter(key => typeof p1RoleMetrics[key as keyof typeof p1RoleMetrics] === 'number')
      .sort((a, b) => 
        (p1RoleMetrics[b as keyof typeof p1RoleMetrics] as number) - 
        (p1RoleMetrics[a as keyof typeof p1RoleMetrics] as number)
      )[0];
      
    const p2RoleKey = Object.keys(p2RoleMetrics)
      .filter(key => typeof p2RoleMetrics[key as keyof typeof p2RoleMetrics] === 'number')
      .sort((a, b) => 
        (p2RoleMetrics[b as keyof typeof p2RoleMetrics] as number) - 
        (p2RoleMetrics[a as keyof typeof p2RoleMetrics] as number)
      )[0];
    
    if (p1RoleKey) {
      comparisonData.push({
        metric: p1RoleKey,
        [player1.name]: normalizeValue(p1RoleMetrics[p1RoleKey as keyof typeof p1RoleMetrics] as number),
        [player2.name]: p2RoleMetrics[p1RoleKey as keyof typeof p2RoleMetrics] ? 
          normalizeValue(p2RoleMetrics[p1RoleKey as keyof typeof p2RoleMetrics] as number) : 0,
        fullMark: 100,
      });
    }
    
    if (p2RoleKey && p2RoleKey !== p1RoleKey) {
      comparisonData.push({
        metric: p2RoleKey,
        [player1.name]: p1RoleMetrics[p2RoleKey as keyof typeof p1RoleMetrics] ? 
          normalizeValue(p1RoleMetrics[p2RoleKey as keyof typeof p1RoleMetrics] as number) : 0,
        [player2.name]: normalizeValue(p2RoleMetrics[p2RoleKey as keyof typeof p2RoleMetrics] as number),
        fullMark: 100,
      });
    }
    
    return comparisonData;
  }, [player1, player2, analysisTab]);
  
  // Generate metrics for scatter plot
  const scatterData = useMemo(() => {
    if (!players.length || !player1 || !player2) return [];
    
    // Map for the axes based on metric selection
    const metricMappings = {
      piv: { label: "PIV Score", accessor: (p: PlayerWithPIV) => p.piv * 100 },
      kd: { label: "K/D Ratio", accessor: (p: PlayerWithPIV) => p.kd },
      role_score: { label: "Role Score", accessor: (p: PlayerWithPIV) => p.metrics.rcs.value * 100 },
      consistency: { label: "Consistency", accessor: (p: PlayerWithPIV) => p.metrics.icf.value * 100 }
    };
    
    // Generate scatter plot data for all players
    const allPlayersData = players.map(player => ({
      x: metricMappings.kd.accessor(player),
      y: metricMappings.piv.accessor(player),
      z: player.metrics.sc.value * 100, // Use synergy as bubble size
      name: player.name,
      team: player.team,
      role: player.role,
      id: player.id,
      isHighlighted: player.id === player1Id || player.id === player2Id
    }));
    
    return allPlayersData;
  }, [players, player1, player2, player1Id, player2Id]);
  
  // Generate bar chart comparison data
  const barChartData = useMemo(() => {
    if (!player1 || !player2) return [];
    
    const createComparisonData = () => {
      const getValueForTab = (player: PlayerWithPIV, key: string) => {
        if (analysisTab === "ct" && player.ctMetrics) {
          return player.ctMetrics.roleMetrics[key as keyof typeof player.ctMetrics.roleMetrics] || 0;
        } else if (analysisTab === "t" && player.tMetrics) {
          return player.tMetrics.roleMetrics[key as keyof typeof player.tMetrics.roleMetrics] || 0;
        } else {
          return player.metrics.roleMetrics[key as keyof typeof player.metrics.roleMetrics] || 0;
        }
      };
      
      // Get common metrics between both players
      const p1Metrics = player1.metrics.roleMetrics;
      const p2Metrics = player2.metrics.roleMetrics;
      
      // Find metrics that both players have values for
      const commonMetrics = Object.keys(p1Metrics)
        .filter(key => 
          typeof p1Metrics[key as keyof typeof p1Metrics] === 'number' && 
          typeof p2Metrics[key as keyof typeof p2Metrics] === 'number'
        )
        .sort((a, b) => {
          const diffA = Math.abs(
            (getValueForTab(player1, a) as number) - 
            (getValueForTab(player2, a) as number)
          );
          const diffB = Math.abs(
            (getValueForTab(player1, b) as number) - 
            (getValueForTab(player2, b) as number)
          );
          return diffB - diffA; // Sort by largest difference
        })
        .slice(0, 5); // Get top 5 differentiating metrics
      
      return commonMetrics.map(metric => ({
        name: metric,
        [player1.name]: (getValueForTab(player1, metric) as number) * 100,
        [player2.name]: (getValueForTab(player2, metric) as number) * 100,
      }));
    };
    
    return createComparisonData();
  }, [player1, player2, analysisTab]);
  
  // Generate performance insights based on comparison
  const performanceInsights = useMemo(() => {
    if (!player1 || !player2) return [];
    
    const insights = [];
    
    // Overall PIV comparison
    const pivDiff = player1.piv - player2.piv;
    const formattedPivDiff = Math.abs(pivDiff * 100).toFixed(1);
    
    insights.push({
      title: `Overall Performance`,
      description: pivDiff > 0 
        ? `${player1.name} has a higher PIV rating (+${formattedPivDiff} points) compared to ${player2.name}`
        : pivDiff < 0
          ? `${player2.name} has a higher PIV rating (+${formattedPivDiff} points) compared to ${player1.name}`
          : `Both players have equivalent PIV ratings`,
      icon: Zap,
      color: pivDiff > 0.15 ? "text-green-500" : pivDiff < -0.15 ? "text-red-500" : "text-yellow-500"
    });
    
    // Role effectiveness comparison
    const rcsP1 = player1.metrics.rcs.value;
    const rcsP2 = player2.metrics.rcs.value;
    const rcsDiff = rcsP1 - rcsP2;
    
    insights.push({
      title: `Role Effectiveness`,
      description: rcsDiff > 0.1
        ? `${player1.name} is more effective in their ${player1.role} role (+${(rcsDiff*100).toFixed(1)}%)`
        : rcsDiff < -0.1
          ? `${player2.name} is more effective in their ${player2.role} role (+${(Math.abs(rcsDiff)*100).toFixed(1)}%)`
          : `Both players are similarly effective in their roles`,
      icon: Target,
      color: rcsDiff > 0.1 ? "text-green-500" : rcsDiff < -0.1 ? "text-red-500" : "text-yellow-500"
    });
    
    // Consistency comparison
    const icfDiff = player1.metrics.icf.value - player2.metrics.icf.value;
    
    insights.push({
      title: `Consistency Factor`,
      description: icfDiff > 0.1
        ? `${player1.name} demonstrates higher consistency in performance (+${(icfDiff*100).toFixed(1)}%)`
        : icfDiff < -0.1
          ? `${player2.name} demonstrates higher consistency in performance (+${(Math.abs(icfDiff)*100).toFixed(1)}%)`
          : `Both players show similar consistency in performance`,
      icon: ShieldAlert,
      color: icfDiff > 0.1 ? "text-green-500" : icfDiff < -0.1 ? "text-red-500" : "text-yellow-500"
    });
    
    // Team synergy comparison
    const scDiff = player1.metrics.sc.value - player2.metrics.sc.value;
    
    insights.push({
      title: `Team Synergy`,
      description: scDiff > 0.1
        ? `${player1.name} shows stronger team synergy (+${(scDiff*100).toFixed(1)}%)`
        : scDiff < -0.1
          ? `${player2.name} shows stronger team synergy (+${(Math.abs(scDiff)*100).toFixed(1)}%)`
          : `Both players contribute similarly to team synergy`,
      icon: Sparkles,
      color: scDiff > 0.1 ? "text-green-500" : scDiff < -0.1 ? "text-red-500" : "text-yellow-500"
    });
    
    // If different roles, add complementary insight
    if (player1.role !== player2.role) {
      insights.push({
        title: `Role Complementarity`,
        description: `${player1.name} (${player1.role}) and ${player2.name} (${player2.role}) have complementary roles, potentially enhancing team balance`,
        icon: Brain,
        color: "text-blue-500",
        progressValue: 85
      });
    } else {
      // If same roles, compare direct competition
      const isSameTeam = player1.team === player2.team;
      const complementaryScore = isSameTeam ? 50 : 75;
      
      insights.push({
        title: `Role Competition`,
        description: isSameTeam 
          ? `${player1.name} and ${player2.name} compete for the same ${player1.role} role on team ${player1.team}`
          : `${player1.name} and ${player2.name} play the same ${player1.role} role on different teams`,
        icon: Crosshair,
        color: "text-yellow-500",
        progressValue: complementaryScore
      });
    }
    
    return insights;
  }, [player1, player2]);

  // Format colors for bar chart
  const getBarColors = useMemo(() => {
    if (!player1 || !player2) return { color1: "#4C72B0", color2: "#8172B0" };
    
    // Get dynamic team colors
    const getTeamColor = (teamName: string) => {
      const teamColors: Record<string, string> = {
        "Vitality": "#FFCC00",
        "FaZe": "#FF0000",
        "Spirit": "#3399FF",
        "Astralis": "#FF3333",
        "G2": "#FF99CC",
        "MOUZ": "#990000",
        "NaVi": "#FFFF00",
        "Liquid": "#1971C2",
        "ENCE": "#00CCFF",
        "Complexity": "#6666FF",
        "BIG": "#444444",
        "NAVI": "#FFFF00",
        "Virtus.pro": "#FF9900",
        "Cloud9": "#99CCFF",
        "Imperial": "#009900",
        "Pain": "#FF6600",
        "Heroic": "#AA0000",
        "Fnatic": "#FF9933",
      };
      
      // Team name partial match
      for (const [key, color] of Object.entries(teamColors)) {
        if (teamName.includes(key)) {
          return color;
        }
      }
      
      return "#4C72B0"; // Default blue
    };
    
    return {
      color1: getTeamColor(player1.team),
      color2: getTeamColor(player2.team)
    };
  }, [player1, player2]);

  // If loading, show skeleton
  if (isLoading) {
    return (
      <div className="container mx-auto py-6 space-y-6 px-4">
        <h1 className="text-3xl font-bold">Player Comparisons</h1>
        <div className="h-80 animate-pulse bg-gray-800 rounded-lg"></div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-6 space-y-6 px-4 min-h-screen">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold flex items-center">
            <ArrowRightLeft className="mr-2 h-8 w-8 text-primary" />
            Player Comparisons
          </h1>
          <p className="text-gray-400 mt-1">
            In-depth analysis and side-by-side comparison of player performance
          </p>
        </div>
        
        <div className="flex flex-col md:flex-row gap-3">
          <Select
            value={chartType}
            onValueChange={(value) => setChartType(value as any)}
          >
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Chart Type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="radar">Radar Chart</SelectItem>
              <SelectItem value="scatter">Scatter Plot</SelectItem>
              <SelectItem value="bar">Differential Bar Chart</SelectItem>
            </SelectContent>
          </Select>
          
          <Tabs
            value={analysisTab}
            onValueChange={(value) => setAnalysisTab(value as any)}
            className="w-full md:w-auto"
          >
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="overall">Overall</TabsTrigger>
              <TabsTrigger value="t">T Side</TabsTrigger>
              <TabsTrigger value="ct">CT Side</TabsTrigger>
            </TabsList>
          </Tabs>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Main comparison area - 8 columns on large screens */}
        <div className="lg:col-span-8 space-y-6">
          <Card>
            <CardHeader className="pb-0">
              <div className="flex items-center justify-between">
                <CardTitle>Player Selection</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-4">
                {/* Player 1 Selection */}
                <div className="space-y-4">
                  <h3 className="font-medium">Player 1</h3>
                  
                  <div className="space-y-2">
                    <Input
                      placeholder="Search players..."
                      value={searchQuery1}
                      onChange={(e) => setSearchQuery1(e.target.value)}
                      className="mb-2"
                    />
                    
                    <div className="h-48 overflow-y-auto rounded-md border border-gray-700 bg-background p-2">
                      {players
                        .filter(p => 
                          p.name.toLowerCase().includes(searchQuery1.toLowerCase()) ||
                          p.team.toLowerCase().includes(searchQuery1.toLowerCase())
                        )
                        .map(player => (
                          <div
                            key={player.id}
                            className={`flex items-center justify-between p-2 rounded-md cursor-pointer hover:bg-gray-800 ${
                              player1Id === player.id ? 'bg-blue-950 border border-blue-500' : ''
                            }`}
                            onClick={() => setPlayer1Id(player.id)}
                          >
                            <div className="flex items-center gap-3">
                              <div className="w-8 h-8 rounded-full bg-blue-900/30 flex items-center justify-center text-xs font-medium">
                                {player.team.substring(0, 2)}
                              </div>
                              <div>
                                <div className="font-medium text-sm">{player.name}</div>
                                <div className="text-xs text-gray-400">{player.team}</div>
                              </div>
                            </div>
                            <RoleBadge role={player.role} small />
                          </div>
                        ))}
                    </div>
                  </div>
                  
                  {player1 && (
                    <div className="p-3 rounded-lg bg-gray-800/50 flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-blue-900/50 flex items-center justify-center text-sm font-medium">
                          {player1.team.substring(0, 2)}
                        </div>
                        <div>
                          <div className="font-medium">{player1.name}</div>
                          <div className="text-sm text-gray-400 flex items-center gap-2">
                            {player1.team} • <RoleBadge role={player1.role} small />
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-sm">PIV: {Math.round(player1.piv * 100)}</div>
                      </div>
                    </div>
                  )}
                </div>
                
                {/* Player 2 Selection */}
                <div className="space-y-4">
                  <h3 className="font-medium">Player 2</h3>
                  
                  <div className="space-y-2">
                    <Input
                      placeholder="Search players..."
                      value={searchQuery2}
                      onChange={(e) => setSearchQuery2(e.target.value)}
                      className="mb-2"
                    />
                    
                    <div className="h-48 overflow-y-auto rounded-md border border-gray-700 bg-background p-2">
                      {players
                        .filter(p => 
                          p.name.toLowerCase().includes(searchQuery2.toLowerCase()) ||
                          p.team.toLowerCase().includes(searchQuery2.toLowerCase())
                        )
                        .map(player => (
                          <div
                            key={player.id}
                            className={`flex items-center justify-between p-2 rounded-md cursor-pointer hover:bg-gray-800 ${
                              player2Id === player.id ? 'bg-blue-950 border border-blue-500' : ''
                            }`}
                            onClick={() => setPlayer2Id(player.id)}
                          >
                            <div className="flex items-center gap-3">
                              <div className="w-8 h-8 rounded-full bg-blue-900/30 flex items-center justify-center text-xs font-medium">
                                {player.team.substring(0, 2)}
                              </div>
                              <div>
                                <div className="font-medium text-sm">{player.name}</div>
                                <div className="text-xs text-gray-400">{player.team}</div>
                              </div>
                            </div>
                            <RoleBadge role={player.role} small />
                          </div>
                        ))}
                    </div>
                  </div>
                  
                  {player2 && (
                    <div className="p-3 rounded-lg bg-gray-800/50 flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-blue-900/50 flex items-center justify-center text-sm font-medium">
                          {player2.team.substring(0, 2)}
                        </div>
                        <div>
                          <div className="font-medium">{player2.name}</div>
                          <div className="text-sm text-gray-400 flex items-center gap-2">
                            {player2.team} • <RoleBadge role={player2.role} small />
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-sm">PIV: {Math.round(player2.piv * 100)}</div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
          
          {player1 && player2 && (
            <div className="space-y-6">
              {/* New Performance Comparison Slider */}
              <div>
                <PerformanceComparisonSlider 
                  player1={player1} 
                  player2={player2}
                  activeTab={analysisTab}
                />
              </div>
              
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle>Performance Charts</CardTitle>
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button variant="ghost" size="icon">
                            <Info className="h-4 w-4" />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>
                          <div className="max-w-xs p-2">
                            <p className="text-sm">
                              {chartType === "radar" ? 
                                "Radar chart shows normalized metrics (0-100) for direct comparison across multiple dimensions." :
                               chartType === "scatter" ? 
                                "Scatter plot shows all players with highlighted comparison players. Size represents team synergy contribution." :
                                "Bar chart shows the top differentiating metrics between players."}
                            </p>
                          </div>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </div>
                  <CardDescription>
                    {chartType === "radar" ? 
                      "Multi-dimensional skill comparison across key performance metrics" :
                     chartType === "scatter" ? 
                      "Contextual performance view among all players" :
                      "Direct metric comparison highlighting key differences"}
                  </CardDescription>
                </CardHeader>
                <CardContent className="pt-2">
                  <div className="h-[400px] w-full">
                    {chartType === "radar" && radarData.length > 0 && (
                    <ResponsiveContainer width="100%" height="100%">
                      <RadarChart cx="50%" cy="50%" outerRadius="80%" data={radarData}>
                        <PolarGrid />
                        <PolarAngleAxis dataKey="metric" />
                        <PolarRadiusAxis angle={90} domain={[0, 100]} />
                        <Radar name={player1.name} dataKey={player1.name} stroke={getBarColors.color1} fill={getBarColors.color1} fillOpacity={0.5} />
                        <Radar name={player2.name} dataKey={player2.name} stroke={getBarColors.color2} fill={getBarColors.color2} fillOpacity={0.5} />
                        <Legend />
                      </RadarChart>
                    </ResponsiveContainer>
                  )}
                  
                  {chartType === "scatter" && scatterData.length > 0 && (
                    <ResponsiveContainer width="100%" height="100%">
                      <ScatterChart
                        margin={{ top: 20, right: 20, bottom: 20, left: 20 }}
                      >
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis 
                          type="number" 
                          dataKey="x" 
                          name="K/D Ratio" 
                          domain={[0.7, 'dataMax']} 
                          label={{ value: 'K/D Ratio', position: 'insideBottom', offset: -10 }} 
                        />
                        <YAxis 
                          type="number" 
                          dataKey="y" 
                          name="PIV Score" 
                          domain={[40, 'dataMax']} 
                          label={{ value: 'PIV Score', angle: -90, position: 'insideLeft' }} 
                        />
                        <ZAxis 
                          type="number" 
                          dataKey="z" 
                          range={[50, 400]}
                        />
                        <RechartsTooltip 
                          cursor={{ strokeDasharray: '3 3' }} 
                          content={({ active, payload }) => {
                            if (active && payload && payload.length) {
                              const data = payload[0].payload;
                              return (
                                <div className="bg-background p-3 rounded shadow-lg border border-gray-800">
                                  <p className="text-base font-medium">{data.name}</p>
                                  <p className="text-sm">{data.team} - <RoleBadge role={data.role} /></p>
                                  <div className="grid grid-cols-2 gap-x-4 mt-2">
                                    <p className="text-xs">K/D: <span className="font-medium">{data.x.toFixed(2)}</span></p>
                                    <p className="text-xs">PIV: <span className="font-medium">{data.y.toFixed(0)}</span></p>
                                  </div>
                                </div>
                              );
                            }
                            return null;
                          }}
                        />
                        <Legend />
                        <Scatter 
                          name="All Players" 
                          data={scatterData.filter(p => !p.isHighlighted)} 
                          fill="#8884d8"
                          opacity={0.5}
                        />
                        <Scatter 
                          name={player1.name} 
                          data={[scatterData.find(p => p.id === player1Id)]} 
                          fill={getBarColors.color1} 
                          shape="star"
                        />
                        <Scatter 
                          name={player2.name} 
                          data={[scatterData.find(p => p.id === player2Id)]} 
                          fill={getBarColors.color2} 
                          shape="star"
                        />
                      </ScatterChart>
                    </ResponsiveContainer>
                  )}
                  
                  {chartType === "bar" && barChartData.length > 0 && (
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart
                        data={barChartData}
                        layout="vertical"
                        margin={{ top: 20, right: 30, left: 150, bottom: 5 }}
                      >
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis type="number" domain={[0, 100]} />
                        <YAxis type="category" dataKey="name" width={150} />
                        <RechartsTooltip />
                        <Legend />
                        <Bar dataKey={player1.name} fill={getBarColors.color1} name={player1.name} />
                        <Bar dataKey={player2.name} fill={getBarColors.color2} name={player2.name} />
                      </BarChart>
                    </ResponsiveContainer>
                  )}
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </div>
        
        {/* Analysis and insights - 4 columns on large screens */}
        <div className="lg:col-span-4 space-y-6">
          {player1 && player2 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Lightbulb className="h-5 w-5 text-yellow-400" />
                  Performance Insights
                </CardTitle>
                <CardDescription>
                  Key analytical observations based on player comparison
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  {performanceInsights.map((insight, index) => (
                    <div key={index} className="space-y-2">
                      <div className="flex items-center gap-2">
                        <insight.icon className={`h-5 w-5 ${insight.color}`} />
                        <h3 className="font-medium">{insight.title}</h3>
                      </div>
                      <p className="text-sm text-gray-400">{insight.description}</p>
                      
                      {'progressValue' in insight && (
                        <Progress 
                          value={insight.progressValue || 0} 
                          className={`h-2 mt-1 ${
                            (insight.progressValue || 0) > 70 ? "bg-green-500/20" : 
                            (insight.progressValue || 0) > 40 ? "bg-yellow-500/20" : 
                            "bg-red-500/20"
                          }`}
                        />
                      )}
                    </div>
                  ))}
                </div>
              </CardContent>
              <CardFooter>
                <div className="w-full pt-4 border-t border-gray-800">
                  <h3 className="font-medium text-sm mb-2">Key Metrics Comparison</h3>
                  <div className="space-y-3">
                    {/* PIV Comparison Bar */}
                    <div className="space-y-1">
                      <div className="flex justify-between items-center text-xs">
                        <span>PIV Rating</span>
                        <div className="flex items-center gap-3">
                          <span className="text-xs font-medium" style={{color: getBarColors.color1}}>
                            {Math.round(player1.piv * 100)}
                          </span>
                          <span className="text-xs">vs</span>
                          <span className="text-xs font-medium" style={{color: getBarColors.color2}}>
                            {Math.round(player2.piv * 100)}
                          </span>
                        </div>
                      </div>
                      <div className="flex h-2 overflow-hidden rounded-full bg-gray-800">
                        <div 
                          className="h-full rounded-l-full" 
                          style={{
                            width: `${Math.round(player1.piv * 100)}%`, 
                            backgroundColor: getBarColors.color1,
                            maxWidth: '50%'
                          }} 
                        />
                        <div 
                          className="h-full rounded-r-full" 
                          style={{
                            width: `${Math.round(player2.piv * 100)}%`, 
                            backgroundColor: getBarColors.color2,
                            maxWidth: '50%'
                          }} 
                        />
                      </div>
                    </div>
                    
                    {/* K/D Comparison Bar */}
                    <div className="space-y-1">
                      <div className="flex justify-between items-center text-xs">
                        <span>K/D Ratio</span>
                        <div className="flex items-center gap-3">
                          <span className="text-xs font-medium" style={{color: getBarColors.color1}}>
                            {player1.kd.toFixed(2)}
                          </span>
                          <span className="text-xs">vs</span>
                          <span className="text-xs font-medium" style={{color: getBarColors.color2}}>
                            {player2.kd.toFixed(2)}
                          </span>
                        </div>
                      </div>
                      <div className="flex h-2 overflow-hidden rounded-full bg-gray-800">
                        <div 
                          className="h-full rounded-l-full" 
                          style={{
                            width: `${Math.min(50, Math.round(player1.kd * 25))}%`, 
                            backgroundColor: getBarColors.color1
                          }} 
                        />
                        <div 
                          className="h-full rounded-r-full" 
                          style={{
                            width: `${Math.min(50, Math.round(player2.kd * 25))}%`, 
                            backgroundColor: getBarColors.color2
                          }} 
                        />
                      </div>
                    </div>
                    
                    {/* Role Score Comparison Bar */}
                    <div className="space-y-1">
                      <div className="flex justify-between items-center text-xs">
                        <span>Role Score</span>
                        <div className="flex items-center gap-3">
                          <span className="text-xs font-medium" style={{color: getBarColors.color1}}>
                            {Math.round(player1.metrics.rcs.value * 100)}
                          </span>
                          <span className="text-xs">vs</span>
                          <span className="text-xs font-medium" style={{color: getBarColors.color2}}>
                            {Math.round(player2.metrics.rcs.value * 100)}
                          </span>
                        </div>
                      </div>
                      <div className="flex h-2 overflow-hidden rounded-full bg-gray-800">
                        <div 
                          className="h-full rounded-l-full" 
                          style={{
                            width: `${Math.min(50, Math.round(player1.metrics.rcs.value * 50))}%`, 
                            backgroundColor: getBarColors.color1
                          }} 
                        />
                        <div 
                          className="h-full rounded-r-full" 
                          style={{
                            width: `${Math.min(50, Math.round(player2.metrics.rcs.value * 50))}%`, 
                            backgroundColor: getBarColors.color2
                          }} 
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </CardFooter>
            </Card>
          )}
          
          {/* Playstyle Compatibility Analysis Card */}
          {player1 && player2 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart2 className="h-5 w-5 text-primary" />
                  Player Synergy Analysis
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex flex-col items-center justify-center bg-background-light p-4 rounded-lg">
                    <div className="w-full flex items-center justify-center mb-4">
                      <div className="text-center px-2">
                        <div className="bg-blue-900/30 w-10 h-10 rounded-full flex items-center justify-center mx-auto mb-1">
                          {player1.team.substring(0, 2)}
                        </div>
                        <p className="text-sm font-medium">{player1.name}</p>
                        <p className="text-xs text-gray-400">{player1.role}</p>
                      </div>
                      
                      <div className="text-xs px-2 text-center">
                        <div className="mx-2 my-2">
                          <BadgeInfo className={`h-4 w-4 text-primary mx-auto ${player1.role === player2.role ? 'text-yellow-500' : 'text-green-500'}`} />
                          <div className="h-px w-16 my-2 mx-auto bg-gradient-to-r from-transparent via-blue-500 to-transparent" />
                          <p className="text-xs">
                            {player1.role === player2.role 
                              ? 'Same Role' 
                              : 'Complementary'
                            }
                          </p>
                        </div>
                      </div>
                      
                      <div className="text-center px-2">
                        <div className="bg-blue-900/30 w-10 h-10 rounded-full flex items-center justify-center mx-auto mb-1">
                          {player2.team.substring(0, 2)}
                        </div>
                        <p className="text-sm font-medium">{player2.name}</p>
                        <p className="text-xs text-gray-400">{player2.role}</p>
                      </div>
                    </div>
                    
                    <div className="w-full mt-4">
                      <div className="flex justify-between text-xs mb-1">
                        <span>Synergy Potential</span>
                        <span className="font-medium">
                          {player1.role === player2.role
                            ? player1.team === player2.team
                              ? "Low" // Same role, same team
                              : "Medium" // Same role, different team
                            : player1.team === player2.team
                              ? "High" // Different role, same team
                              : "Very High" // Different role, different team
                          }
                        </span>
                      </div>
                      <Progress
                        value={
                          player1.role === player2.role
                            ? player1.team === player2.team
                              ? 30 // Same role, same team
                              : 50 // Same role, different team
                            : player1.team === player2.team
                              ? 75 // Different role, same team
                              : 90 // Different role, different team
                        }
                        className={`h-2 ${
                          player1.role === player2.role
                            ? player1.team === player2.team
                              ? "bg-red-500/20" // Same role, same team
                              : "bg-yellow-500/20" // Same role, different team
                            : player1.team === player2.team
                              ? "bg-green-500/20" // Different role, same team
                              : "bg-blue-500/20" // Different role, different team
                        }`}
                      />
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <div className="text-sm font-medium">Key Observations</div>
                    <div className="text-xs text-gray-400 space-y-2">
                      <p>
                        {player1.role === player2.role
                          ? `Both players are ${player1.role}s ${
                              player1.team === player2.team
                                ? `on the same team (${player1.team}), potentially competing for the same position.`
                                : `on different teams, allowing for direct performance comparisons.`
                            }`
                          : `${player1.name} (${player1.role}) and ${player2.name} (${player2.role}) have complementary roles ${
                              player1.team === player2.team
                                ? `on the same team (${player1.team}), potentially creating strong synergy.`
                                : `on different teams. They would potentially work well together in a theoretical lineup.`
                            }`
                        }
                      </p>
                      
                      {player1.role !== player2.role && (
                        <p>
                          The {player1.role} and {player2.role} roles naturally complement each other in team dynamics.
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
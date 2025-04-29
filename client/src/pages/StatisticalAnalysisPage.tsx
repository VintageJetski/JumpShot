import { useState, useEffect, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { PlayerWithPIV, PlayerRole } from "@shared/schema";
import { RawStats } from "@shared/types";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import RoleBadge from "@/components/ui/role-badge";
import { 
  BarChart, 
  LineChart,
  Bar, 
  Line,
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Legend, 
  ResponsiveContainer, 
  Tooltip as RechartsTooltip,
  ScatterChart,
  Scatter,
  Cell,
  ZAxis,
  PieChart,
  Pie,
  AreaChart,
  Area
} from "recharts";
import { BarChart2, PieChart as PieChartIcon, TrendingUp, FileBarChart, Filter, Activity, Users } from "lucide-react";

export default function StatisticalAnalysisPage() {
  const [activeTab, setActiveTab] = useState<"distribution" | "correlation" | "trends" | "role" | "team">("distribution");
  const [filterRole, setFilterRole] = useState<string>("all");
  const [filterTeam, setFilterTeam] = useState<string>("all");
  const [selectedMetric, setSelectedMetric] = useState<string>("piv");
  const [selectedSecondaryMetric, setSelectedSecondaryMetric] = useState<string>("kd");
  
  const { data: players = [], isLoading } = useQuery<PlayerWithPIV[]>({
    queryKey: ["/api/players"],
  });
  
  // Extract unique teams and roles for filters
  const uniqueTeams = useMemo(() => {
    const teams = players.map(p => p.team);
    return ["all", ...Array.from(new Set(teams))];
  }, [players]);
  
  const uniqueRoles = useMemo(() => {
    const roles = players.map(p => p.role);
    return ["all", ...Array.from(new Set(roles))];
  }, [players]);
  
  // Filter players based on selected role and team
  const filteredPlayers = useMemo(() => {
    return players.filter(player => 
      (filterRole === "all" || player.role === filterRole) && 
      (filterTeam === "all" || player.team === filterTeam)
    );
  }, [players, filterRole, filterTeam]);
  
  // Metric options for dropdowns
  const metricOptions = [
    { label: "PIV Score", value: "piv" },
    { label: "K/D Ratio", value: "kd" },
    { label: "Role Score", value: "rcs" },
    { label: "Consistency", value: "icf" },
    { label: "Team Synergy", value: "sc" },
    { label: "Headshot %", value: "hs" },
    { label: "First Kills", value: "firstKills" },
    { label: "KAST", value: "kast" },
    { label: "ADR", value: "adr" }
  ];
  
  // Get metric accessor function
  const getMetricValue = (player: PlayerWithPIV, metricKey: string) => {
    switch (metricKey) {
      case "piv":
        return player.piv;
      case "kd":
        return player.kd;
      case "rcs":
        return player.metrics?.rcs || 0;
      case "icf":
        return player.metrics?.icf || 0;
      case "sc":
        return player.metrics?.sc || 0;
      case "hs":
        return player.rawStats?.headshots / Math.max(1, player.rawStats?.kills) || 0;
      case "firstKills":
        return player.rawStats?.firstKills || 0;
      case "kast":
        // Calculate KAST as average of CT and T side values 
        // or fallback to a derived value from player stats
        if (player.rawStats) {
          const rs = player.rawStats as any;
          return rs.kastTotal || 
            ((rs.kastCtSide || 0) + (rs.kastTSide || 0)) / 2 || 
            0.7; // Default average KAST when data is missing
        }
        return 0;
      case "adr":
        // Calculate ADR as average of CT and T side values
        // or fallback to a derived value from player stats
        if (player.rawStats) {
          const rs = player.rawStats as any;
          return rs.adrTotal || 
            ((rs.adrCtSide || 0) + (rs.adrTSide || 0)) / 2 || 
            70; // Default average ADR when data is missing
        }
        return 0;
      default:
        return 0;
    }
  };
  
  // Get metric label
  const getMetricLabel = (metricKey: string) => {
    const option = metricOptions.find(opt => opt.value === metricKey);
    return option?.label || metricKey;
  };
  
  // Generate data for distribution chart (histogram)
  const distributionData = useMemo(() => {
    if (!filteredPlayers.length) return [];
    
    const values = filteredPlayers.map(player => 
      getMetricValue(player, selectedMetric)
    );
    
    // Create appropriate bins based on the metric
    let bins: number[] = [];
    let range: [number, number] = [0, 0];
    
    if (selectedMetric === "piv") {
      // PIV typically ranges from 0.5 to 2.5
      bins = [0.5, 0.75, 1.0, 1.25, 1.5, 1.75, 2.0, 2.25, 2.5];
      range = [0.5, 2.5];
    } else if (selectedMetric === "kd") {
      // K/D typically ranges from 0.6 to 1.8
      bins = [0.6, 0.8, 1.0, 1.2, 1.4, 1.6, 1.8];
      range = [0.6, 1.8];
    } else if (selectedMetric === "rcs" || selectedMetric === "icf" || selectedMetric === "sc") {
      // Normalized metrics typically range from 0 to 1
      bins = [0, 0.2, 0.4, 0.6, 0.8, 1.0];
      range = [0, 1.0];
    } else if (selectedMetric === "hs") {
      // Headshot % typically ranges from 0 to 0.6 (0-60%)
      bins = [0, 0.1, 0.2, 0.3, 0.4, 0.5, 0.6];
      range = [0, 0.6];
    } else {
      // Default bins
      const min = Math.min(...values);
      const max = Math.max(...values);
      const step = (max - min) / 8;
      bins = Array.from({ length: 9 }, (_, i) => min + (i * step));
      range = [min, max];
    }
    
    // Count occurrences in each bin
    const counts = bins.map((binStart, i) => {
      const binEnd = bins[i + 1] || Number.MAX_VALUE;
      const count = values.filter(v => v >= binStart && v < binEnd).length;
      
      // Create bin label
      const label = binEnd === Number.MAX_VALUE 
        ? `${binStart.toFixed(2)}+` 
        : `${binStart.toFixed(2)}-${binEnd.toFixed(2)}`;
      
      return {
        bin: label,
        count,
        // Store actual values for tooltips
        binStart,
        binEnd
      };
    });
    
    return counts;
  }, [filteredPlayers, selectedMetric]);
  
  // Generate data for correlation chart (scatter plot)
  const correlationData = useMemo(() => {
    if (!filteredPlayers.length) return [];
    
    return filteredPlayers.map(player => ({
      name: player.name,
      team: player.team,
      role: player.role,
      x: getMetricValue(player, selectedMetric),
      y: getMetricValue(player, selectedSecondaryMetric),
      id: player.id
    }));
  }, [filteredPlayers, selectedMetric, selectedSecondaryMetric]);
  
  // Calculate correlation coefficient
  const correlationCoefficient = useMemo(() => {
    if (!correlationData.length) return 0;
    
    const n = correlationData.length;
    const sumX = correlationData.reduce((sum, d) => sum + d.x, 0);
    const sumY = correlationData.reduce((sum, d) => sum + d.y, 0);
    const sumXY = correlationData.reduce((sum, d) => sum + (d.x * d.y), 0);
    const sumXSquare = correlationData.reduce((sum, d) => sum + (d.x * d.x), 0);
    const sumYSquare = correlationData.reduce((sum, d) => sum + (d.y * d.y), 0);
    
    const numerator = (n * sumXY) - (sumX * sumY);
    const denominator = Math.sqrt(((n * sumXSquare) - (sumX * sumX)) * ((n * sumYSquare) - (sumY * sumY)));
    
    return denominator === 0 ? 0 : numerator / denominator;
  }, [correlationData]);
  
  // Generate data for role comparison (bar chart)
  const roleComparisonData = useMemo(() => {
    if (!filteredPlayers.length) return [];
    
    // Group by role and calculate average metrics
    const roleGroups = {} as Record<string, PlayerWithPIV[]>;
    
    filteredPlayers.forEach(player => {
      if (!roleGroups[player.role]) {
        roleGroups[player.role] = [];
      }
      roleGroups[player.role].push(player);
    });
    
    return Object.entries(roleGroups).map(([role, players]) => {
      const avgValue = players.reduce((sum, p) => sum + getMetricValue(p, selectedMetric), 0) / players.length;
      return {
        role,
        value: avgValue,
        count: players.length
      };
    }).sort((a, b) => b.value - a.value);
  }, [filteredPlayers, selectedMetric]);
  
  // Generate data for team comparison (bar chart)
  const teamComparisonData = useMemo(() => {
    if (!filteredPlayers.length) return [];
    
    // Group by team and calculate average metrics
    const teamGroups = {} as Record<string, PlayerWithPIV[]>;
    
    filteredPlayers.forEach(player => {
      if (!teamGroups[player.team]) {
        teamGroups[player.team] = [];
      }
      teamGroups[player.team].push(player);
    });
    
    return Object.entries(teamGroups).map(([team, players]) => {
      const avgValue = players.reduce((sum, p) => sum + getMetricValue(p, selectedMetric), 0) / players.length;
      return {
        team,
        value: avgValue,
        count: players.length
      };
    }).sort((a, b) => b.value - a.value);
  }, [filteredPlayers, selectedMetric]);
  
  // Generate data for trend analysis (line chart)
  // Uses the bin data to show the distribution change when switching between roles/teams
  const trendData = useMemo(() => {
    if (!players.length) return [];
    
    // For this simplified version, we'll compare the metric distribution across roles
    const roleDistributions = {} as Record<string, any[]>;
    
    // Only use roles with multiple players
    const significantRoles = Object.entries(
      players.reduce((acc, player) => {
        acc[player.role] = (acc[player.role] || 0) + 1;
        return acc;
      }, {} as Record<string, number>)
    )
    .filter(([_, count]) => count >= 3)
    .map(([role]) => role);
    
    // Create distributions for each significant role
    significantRoles.forEach(role => {
      const rolePlayers = players.filter(p => p.role === role);
      
      // Create 5 bins for simplified distribution
      const values = rolePlayers.map(p => getMetricValue(p, selectedMetric));
      const min = Math.min(...values);
      const max = Math.max(...values);
      const step = (max - min) / 5;
      
      const bins = Array.from({ length: 5 }, (_, i) => {
        const binStart = min + (i * step);
        const binEnd = min + ((i + 1) * step);
        const count = values.filter(v => v >= binStart && v < binEnd).length;
        return { 
          bin: i,
          binLabel: `${binStart.toFixed(2)}-${binEnd.toFixed(2)}`,
          count
        };
      });
      
      roleDistributions[role] = bins;
    });
    
    // Convert to trend data format
    const bins = Array.from({ length: 5 }, (_, i) => i);
    
    return bins.map(bin => {
      const dataPoint = { bin };
      
      significantRoles.forEach(role => {
        const binData = roleDistributions[role].find(b => b.bin === bin);
        (dataPoint as any)[role] = binData ? binData.count : 0;
      });
      
      return dataPoint;
    });
  }, [players, selectedMetric]);
  
  // Statistical insights
  const statisticalInsights = useMemo(() => {
    if (!filteredPlayers.length) return [];
    
    const insights = [];
    
    // Calculate statistics for the primary metric
    const values = filteredPlayers.map(p => getMetricValue(p, selectedMetric));
    const mean = values.reduce((sum, v) => sum + v, 0) / values.length;
    const variance = values.reduce((sum, v) => sum + Math.pow(v - mean, 2), 0) / values.length;
    const stdDev = Math.sqrt(variance);
    const min = Math.min(...values);
    const max = Math.max(...values);
    const median = values.sort((a, b) => a - b)[Math.floor(values.length / 2)];
    
    // Add mean, median, range insights
    insights.push({
      title: "Central Tendency",
      description: `The average ${getMetricLabel(selectedMetric)} is ${mean.toFixed(2)}, with a median of ${median.toFixed(2)}`,
      icon: Activity
    });
    
    insights.push({
      title: "Dispersion",
      description: `Standard deviation is ${stdDev.toFixed(2)}, with values ranging from ${min.toFixed(2)} to ${max.toFixed(2)}`,
      icon: TrendingUp
    });
    
    // Add correlation insight if on correlation tab
    if (activeTab === "correlation" && correlationCoefficient !== 0) {
      const corrStrength = Math.abs(correlationCoefficient);
      const corrType = correlationCoefficient > 0 ? "positive" : "negative";
      let strengthDesc = "weak";
      
      if (corrStrength > 0.7) strengthDesc = "strong";
      else if (corrStrength > 0.4) strengthDesc = "moderate";
      
      insights.push({
        title: "Correlation Analysis",
        description: `There is a ${strengthDesc} ${corrType} correlation (${correlationCoefficient.toFixed(2)}) between ${getMetricLabel(selectedMetric)} and ${getMetricLabel(selectedSecondaryMetric)}`,
        icon: Activity
      });
    }
    
    // Add role-specific insights if on role tab
    if (activeTab === "role" && roleComparisonData.length > 1) {
      const topRole = roleComparisonData[0];
      const bottomRole = roleComparisonData[roleComparisonData.length - 1];
      const difference = ((topRole.value - bottomRole.value) / bottomRole.value * 100).toFixed(1);
      
      insights.push({
        title: "Role Comparison",
        description: `${topRole.role} players have the highest ${getMetricLabel(selectedMetric)} (${topRole.value.toFixed(2)}), ${difference}% higher than ${bottomRole.role} players (${bottomRole.value.toFixed(2)})`,
        icon: Users
      });
    }
    
    // Add outlier detection
    const outlierThreshold = mean + (2 * stdDev);
    const outliers = filteredPlayers.filter(p => getMetricValue(p, selectedMetric) > outlierThreshold);
    
    if (outliers.length > 0) {
      insights.push({
        title: "Statistical Outliers",
        description: `${outliers.length} player(s) show exceptional ${getMetricLabel(selectedMetric)} values, significantly above the average`,
        icon: BarChart2
      });
    }
    
    return insights;
  }, [filteredPlayers, selectedMetric, activeTab, correlationCoefficient, roleComparisonData, selectedSecondaryMetric]);
  
  // If loading, show skeleton
  if (isLoading) {
    return (
      <div className="container mx-auto py-6 space-y-6 px-4">
        <h1 className="text-3xl font-bold">Statistical Analysis</h1>
        <div className="h-80 animate-pulse bg-gray-800 rounded-lg"></div>
      </div>
    );
  }
  
  return (
    <div className="container mx-auto py-6 space-y-6 px-4 min-h-screen">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold flex items-center">
            <BarChart2 className="mr-2 h-8 w-8 text-primary" />
            Statistical Analysis
          </h1>
          <p className="text-gray-400 mt-1">
            Advanced statistical breakdowns and pattern analysis across players, roles, and teams
          </p>
        </div>
        
        <div className="flex flex-wrap gap-2">
          <div className="w-full md:w-auto">
            <Select value={filterRole} onValueChange={setFilterRole}>
              <SelectTrigger className="w-full md:w-[180px]">
                <SelectValue placeholder="Filter by role" />
              </SelectTrigger>
              <SelectContent>
                {uniqueRoles.map(role => (
                  <SelectItem key={role} value={role}>
                    {role === "all" ? "All Roles" : role}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          <div className="w-full md:w-auto">
            <Select value={filterTeam} onValueChange={setFilterTeam}>
              <SelectTrigger className="w-full md:w-[180px]">
                <SelectValue placeholder="Filter by team" />
              </SelectTrigger>
              <SelectContent>
                {uniqueTeams.map(team => (
                  <SelectItem key={team} value={team}>
                    {team === "all" ? "All Teams" : team}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>
      
      <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as any)} className="w-full">
        <TabsList className="grid w-full grid-cols-2 md:grid-cols-5">
          <TabsTrigger value="distribution" className="flex items-center gap-2">
            <BarChart2 className="h-4 w-4" />
            <span className="hidden md:inline">Distribution</span>
            <span className="inline md:hidden">Dist</span>
          </TabsTrigger>
          <TabsTrigger value="correlation" className="flex items-center gap-2">
            <Activity className="h-4 w-4" />
            <span className="hidden md:inline">Correlation</span>
            <span className="inline md:hidden">Corr</span>
          </TabsTrigger>
          <TabsTrigger value="trends" className="flex items-center gap-2">
            <TrendingUp className="h-4 w-4" />
            <span className="hidden md:inline">Trends</span>
            <span className="inline md:hidden">Trends</span>
          </TabsTrigger>
          <TabsTrigger value="role" className="flex items-center gap-2">
            <Users className="h-4 w-4" />
            <span className="hidden md:inline">Role Analysis</span>
            <span className="inline md:hidden">Roles</span>
          </TabsTrigger>
          <TabsTrigger value="team" className="flex items-center gap-2">
            <FileBarChart className="h-4 w-4" />
            <span className="hidden md:inline">Team Analysis</span>
            <span className="inline md:hidden">Teams</span>
          </TabsTrigger>
        </TabsList>
        
        <div className="flex flex-col md:flex-row items-center justify-between mt-4 mb-2">
          <div className="w-full md:w-auto mb-2 md:mb-0">
            <Select value={selectedMetric} onValueChange={setSelectedMetric}>
              <SelectTrigger className="w-full md:w-[200px]">
                <SelectValue placeholder="Select metric" />
              </SelectTrigger>
              <SelectContent>
                {metricOptions.map(metric => (
                  <SelectItem key={metric.value} value={metric.value}>
                    {metric.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          {activeTab === "correlation" && (
            <div className="w-full md:w-auto flex items-center gap-2">
              <span className="text-gray-400">vs</span>
              <Select value={selectedSecondaryMetric} onValueChange={setSelectedSecondaryMetric}>
                <SelectTrigger className="w-full md:w-[200px]">
                  <SelectValue placeholder="Select secondary metric" />
                </SelectTrigger>
                <SelectContent>
                  {metricOptions.map(metric => (
                    <SelectItem key={metric.value} value={metric.value}>
                      {metric.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}
          
          <div className="text-sm text-gray-400 hidden md:block">
            {filteredPlayers.length} players in analysis
          </div>
        </div>
        
        <TabsContent value="distribution" className="mt-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card className="col-span-1 md:col-span-2">
              <CardHeader>
                <CardTitle className="text-xl">
                  {getMetricLabel(selectedMetric)} Distribution
                </CardTitle>
                <CardDescription>
                  Statistical distribution of {getMetricLabel(selectedMetric)} across {filteredPlayers.length} players
                </CardDescription>
              </CardHeader>
              <CardContent className="h-[350px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={distributionData} margin={{ top: 10, right: 30, left: 0, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="bin" />
                    <YAxis />
                    <RechartsTooltip 
                      formatter={(value: number, name: string) => [`${value} players`, 'Count']}
                      labelFormatter={(label) => `Range: ${label}`}
                    />
                    <Bar 
                      dataKey="count" 
                      fill="#8884d8"
                      name="Players"
                    >
                      {distributionData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={`hsl(${240 + (index * 30)}, 70%, 60%)`} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle className="text-xl">Statistical Insights</CardTitle>
                <CardDescription>
                  Key findings from distribution analysis
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {statisticalInsights.map((insight, index) => (
                    <div key={index} className="border border-gray-700 rounded-md p-3">
                      <h3 className="font-medium text-primary mb-1 flex items-center gap-2">
                        <insight.icon className="h-4 w-4" />
                        {insight.title}
                      </h3>
                      <p className="text-sm text-gray-300">{insight.description}</p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
        
        <TabsContent value="correlation" className="mt-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card className="col-span-1 md:col-span-2">
              <CardHeader>
                <CardTitle className="text-xl">
                  Correlation Analysis
                </CardTitle>
                <CardDescription>
                  Relationship between {getMetricLabel(selectedMetric)} and {getMetricLabel(selectedSecondaryMetric)}
                </CardDescription>
              </CardHeader>
              <CardContent className="h-[350px]">
                <ResponsiveContainer width="100%" height="100%">
                  <ScatterChart margin={{ top: 20, right: 20, bottom: 20, left: 20 }}>
                    <CartesianGrid />
                    <XAxis 
                      type="number" 
                      dataKey="x" 
                      name={getMetricLabel(selectedMetric)} 
                      label={{ value: getMetricLabel(selectedMetric), position: 'insideBottomRight', offset: -5 }}
                    />
                    <YAxis 
                      type="number" 
                      dataKey="y" 
                      name={getMetricLabel(selectedSecondaryMetric)} 
                      label={{ value: getMetricLabel(selectedSecondaryMetric), angle: -90, position: 'insideLeft' }}
                    />
                    <ZAxis range={[50, 50]} />
                    <RechartsTooltip 
                      cursor={{ strokeDasharray: '3 3' }}
                      formatter={(value: any, name: string) => {
                        if (name === 'x') return [value.toFixed(2), getMetricLabel(selectedMetric)];
                        if (name === 'y') return [value.toFixed(2), getMetricLabel(selectedSecondaryMetric)];
                        return [value, name];
                      }}
                      labelFormatter={(_, payload) => {
                        if (payload.length > 0) {
                          return `${payload[0].payload.name} (${payload[0].payload.team})`;
                        }
                        return '';
                      }}
                    />
                    <Scatter 
                      name="Players" 
                      data={correlationData} 
                      fill="#8884d8"
                    >
                      {correlationData.map((entry, index) => {
                        // Color by role
                        const roleColors: Record<string, string> = {
                          'AWP': '#ff5555',
                          'Support': '#55aaff',
                          'Lurker': '#55ff55',
                          'Spacetaker': '#ffaa55',
                          'Anchor': '#aa55ff',
                          'Rotator': '#55ffaa',
                          'IGL': '#ffff55'
                        };
                        return (
                          <Cell 
                            key={`cell-${index}`} 
                            fill={roleColors[entry.role] || '#8884d8'} 
                          />
                        );
                      })}
                    </Scatter>
                  </ScatterChart>
                </ResponsiveContainer>
              </CardContent>
              <CardFooter className="flex justify-between">
                <div className="text-sm">
                  Correlation coefficient: <span className="font-bold">{correlationCoefficient.toFixed(2)}</span>
                </div>
                <div className="flex flex-wrap gap-2">
                  {Object.entries({
                    'AWP': '#ff5555',
                    'Support': '#55aaff',
                    'Lurker': '#55ff55',
                    'Spacetaker': '#ffaa55',
                    'Anchor': '#aa55ff',
                    'Rotator': '#55ffaa',
                    'IGL': '#ffff55'
                  }).map(([role, color]) => (
                    <div key={role} className="flex items-center gap-1">
                      <div className="w-3 h-3 rounded-full" style={{ backgroundColor: color }}></div>
                      <span className="text-xs">{role}</span>
                    </div>
                  ))}
                </div>
              </CardFooter>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle className="text-xl">Correlation Insights</CardTitle>
                <CardDescription>
                  Key findings from relationship analysis
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {statisticalInsights.map((insight, index) => (
                    <div key={index} className="border border-gray-700 rounded-md p-3">
                      <h3 className="font-medium text-primary mb-1 flex items-center gap-2">
                        <insight.icon className="h-4 w-4" />
                        {insight.title}
                      </h3>
                      <p className="text-sm text-gray-300">{insight.description}</p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
        
        <TabsContent value="trends" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-xl">
                Trend Analysis
              </CardTitle>
              <CardDescription>
                Distribution patterns for {getMetricLabel(selectedMetric)} across different roles
              </CardDescription>
            </CardHeader>
            <CardContent className="h-[400px]">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={trendData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis 
                    dataKey="bin" 
                    label={{ value: `${getMetricLabel(selectedMetric)} Range (Low to High)`, position: 'insideBottomRight', offset: -5 }}
                  />
                  <YAxis label={{ value: 'Number of Players', angle: -90, position: 'insideLeft' }} />
                  <RechartsTooltip />
                  <Legend />
                  {Object.keys(trendData[0] || {})
                    .filter(key => key !== 'bin')
                    .map((role, index) => (
                      <Line 
                        key={role}
                        type="monotone" 
                        dataKey={role} 
                        name={role}
                        stroke={`hsl(${(index * 40) % 360}, 70%, 60%)`} 
                        activeDot={{ r: 8 }}
                      />
                    ))}
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
            <CardFooter>
              <p className="text-sm text-gray-400">
                This chart shows how {getMetricLabel(selectedMetric)} is distributed differently across player roles.
                Higher peaks indicate more players in that value range for the given role.
              </p>
            </CardFooter>
          </Card>
        </TabsContent>
        
        <TabsContent value="role" className="mt-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card className="col-span-1 md:col-span-2">
              <CardHeader>
                <CardTitle className="text-xl">
                  Role Comparison
                </CardTitle>
                <CardDescription>
                  Average {getMetricLabel(selectedMetric)} by player role
                </CardDescription>
              </CardHeader>
              <CardContent className="h-[350px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={roleComparisonData} layout="vertical" margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis type="number" />
                    <YAxis type="category" dataKey="role" width={100} />
                    <RechartsTooltip 
                      formatter={(value: any) => [`${value.toFixed(2)}`, getMetricLabel(selectedMetric)]}
                      labelFormatter={(label) => `${label} (${roleComparisonData.find(d => d.role === label)?.count} players)`}
                    />
                    <Legend />
                    <Bar dataKey="value" name={getMetricLabel(selectedMetric)}>
                      {roleComparisonData.map((entry, index) => (
                        <Cell 
                          key={`cell-${index}`} 
                          fill={`hsl(${(index * 40) % 360}, 70%, 60%)`} 
                        />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle className="text-xl">Role Insights</CardTitle>
                <CardDescription>
                  Key findings from role analysis
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {statisticalInsights.map((insight, index) => (
                    <div key={index} className="border border-gray-700 rounded-md p-3">
                      <h3 className="font-medium text-primary mb-1 flex items-center gap-2">
                        <insight.icon className="h-4 w-4" />
                        {insight.title}
                      </h3>
                      <p className="text-sm text-gray-300">{insight.description}</p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
        
        <TabsContent value="team" className="mt-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card className="col-span-1 md:col-span-2">
              <CardHeader>
                <CardTitle className="text-xl">
                  Team Comparison
                </CardTitle>
                <CardDescription>
                  Average {getMetricLabel(selectedMetric)} by team
                </CardDescription>
              </CardHeader>
              <CardContent className="h-[450px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={teamComparisonData} layout="vertical" margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis type="number" />
                    <YAxis type="category" dataKey="team" width={120} />
                    <RechartsTooltip 
                      formatter={(value: any) => [`${value.toFixed(2)}`, getMetricLabel(selectedMetric)]}
                      labelFormatter={(label) => `${label} (${teamComparisonData.find(d => d.team === label)?.count} players)`}
                    />
                    <Legend />
                    <Bar dataKey="value" name={getMetricLabel(selectedMetric)}>
                      {teamComparisonData.map((entry, index) => {
                        // Team-based colors
                        const teamColors: Record<string, string> = {
                          "Team Vitality": "#FFCC00",
                          "FaZe Clan": "#FF0000",
                          "Team Spirit": "#3399FF",
                          "Astralis": "#FF3333",
                          "G2 Esports": "#FF99CC",
                          "MOUZ": "#990000",
                          "Natus Vincere": "#FFFF00",
                          "Team Liquid": "#1971C2",
                          "BIG": "#444444",
                          "Virtus.pro": "#FF9900",
                          "GamerLegion": "#FF00FF",
                          "FURIA": "#33CC33",
                          "Eternal Fire": "#FF3300"
                        };
                        
                        return (
                          <Cell 
                            key={`cell-${index}`} 
                            fill={teamColors[entry.team] || `hsl(${(index * 20) % 360}, 70%, 60%)`} 
                          />
                        );
                      })}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
            
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="text-xl">Team Distribution</CardTitle>
                  <CardDescription>
                    Percentage of players by team
                  </CardDescription>
                </CardHeader>
                <CardContent className="h-[200px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={teamComparisonData}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="count"
                      >
                        {teamComparisonData.map((entry, index) => (
                          <Cell 
                            key={`cell-${index}`} 
                            fill={`hsl(${(index * 20) % 360}, 70%, 60%)`} 
                          />
                        ))}
                      </Pie>
                      <RechartsTooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader>
                  <CardTitle className="text-xl">Statistical Notes</CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2 text-sm text-gray-300">
                    <li>
                      • Teams with fewer than 3 players in the dataset may not have statistically significant averages
                    </li>
                    <li>
                      • Team performance can vary significantly based on player roles and team composition
                    </li>
                    <li>
                      • Analysis based on {filteredPlayers.length} players across {teamComparisonData.length} teams
                    </li>
                  </ul>
                </CardContent>
              </Card>
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
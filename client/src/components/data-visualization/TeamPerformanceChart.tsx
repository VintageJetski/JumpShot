import { useState } from 'react';
import { 
  ResponsiveContainer, 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend,
  Radar,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  LineChart,
  Line,
  Treemap,
  Pie,
  PieChart,
  Cell
} from 'recharts';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { TeamWithTIR, TeamRoundMetrics } from '../../../shared/types';
import { 
  BarChart3, 
  LineChart as LineChartIcon, 
  PieChart as PieChartIcon,
  Download,
  Filter
} from 'lucide-react';

// Define the visualization types
type ChartType = 'radar' | 'bar' | 'pie' | 'line';

// Metrics categories for organizing team charts
const metricCategories = {
  overall: ['tir', 'winRate', 'roundWinRate'],
  economy: ['econWinRate', 'forceWinRate', 'pistolWinRate'],
  strategy: ['tRoundWinRate', 'ctRoundWinRate', 'sitePreference']
};

interface TeamPerformanceChartProps {
  team: TeamWithTIR;
  roundMetrics?: TeamRoundMetrics;
  comparisonTeams?: TeamWithTIR[];
}

export default function TeamPerformanceChart({ 
  team, 
  roundMetrics, 
  comparisonTeams = [] 
}: TeamPerformanceChartProps) {
  const [chartType, setChartType] = useState<ChartType>('radar');
  const [metricCategory, setMetricCategory] = useState<keyof typeof metricCategories>('overall');
  
  // Generate radar chart data for team metrics
  const generateRadarData = () => {
    // Base metrics to display in the radar chart
    let metrics: { name: string, value: number, fullMark: number }[] = [];
    
    if (metricCategory === 'overall') {
      // Overall metrics
      const winRate = team.matchesWon / Math.max(team.matchesPlayed, 1);
      const roundWinRate = team.roundsWon / Math.max(team.roundsPlayed, 1);
      
      metrics = [
        { name: 'TIR', value: team.tir / 10, fullMark: 1 }, // Scale TIR down to 0-1 range
        { name: 'Win Rate', value: winRate, fullMark: 1 },
        { name: 'Round Win', value: roundWinRate, fullMark: 1 },
        { name: 'Avg PIV', value: team.averagePIV / 3, fullMark: 1 }, // Scale PIV to 0-1 range
        { name: 'Team Synergy', value: team.teamSynergy || 0.5, fullMark: 1 }
      ];
    } else if (metricCategory === 'economy' && roundMetrics) {
      // Economy metrics
      metrics = [
        { name: 'Pistol Win', value: roundMetrics.economyMetrics.pistolRoundWinRate, fullMark: 1 },
        { name: 'Eco Win', value: roundMetrics.economyMetrics.ecoRoundWinRate, fullMark: 1 },
        { name: 'Semi Eco', value: roundMetrics.economyMetrics.semiEcoWinRate, fullMark: 1 },
        { name: 'Force Buy', value: roundMetrics.economyMetrics.forceBuyWinRate, fullMark: 1 },
        { name: 'Full Buy', value: roundMetrics.economyMetrics.fullBuyWinRate, fullMark: 1 }
      ];
    } else if (metricCategory === 'strategy' && roundMetrics) {
      // Strategy metrics
      metrics = [
        { name: 'T Win Rate', value: roundMetrics.strategicMetrics.tSideWinRate, fullMark: 1 },
        { name: 'CT Win Rate', value: roundMetrics.strategicMetrics.ctSideWinRate, fullMark: 1 },
        { name: 'A Site Win', value: roundMetrics.strategicMetrics.aSiteWinRate, fullMark: 1 },
        { name: 'B Site Win', value: roundMetrics.strategicMetrics.bSiteWinRate, fullMark: 1 },
        { name: 'After Timeout', value: roundMetrics.strategicMetrics.postTimeoutWinRate, fullMark: 1 }
      ];
    } else {
      // Default metrics if roundMetrics not available
      const tWinRate = team.tRoundsWon / Math.max(team.tRoundsPlayed, 1);
      const ctWinRate = team.ctRoundsWon / Math.max(team.ctRoundsPlayed, 1);
      
      metrics = [
        { name: 'TIR', value: team.tir / 10, fullMark: 1 },
        { name: 'T Win Rate', value: tWinRate, fullMark: 1 },
        { name: 'CT Win Rate', value: ctWinRate, fullMark: 1 },
        { name: 'Avg PIV', value: team.averagePIV / 3, fullMark: 1 },
        { name: 'Map Pool', value: team.mapPool?.length / 7 || 0.5, fullMark: 1 }
      ];
    }
    
    return metrics;
  };
  
  // Generate comparison data for multiple teams
  const generateComparisonData = () => {
    const allTeams = [team, ...comparisonTeams];
    
    if (chartType === 'radar') {
      // For radar charts, we just return the team data
      return generateRadarData();
    } else if (chartType === 'pie') {
      // Pie chart special handling for team role distribution
      const roleCounts: Record<string, number> = {};
      
      // Count the number of players in each role
      team.players?.forEach(player => {
        const role = player.role;
        if (role) {
          roleCounts[role] = (roleCounts[role] || 0) + 1;
        }
      });
      
      // Convert to array format for pie chart
      return Object.entries(roleCounts).map(([role, count]) => ({
        name: role,
        value: count
      }));
    } else {
      // For bar and line charts
      let data: any[] = [];
      
      if (metricCategory === 'overall') {
        // Overall Team metrics for comparison
        data = allTeams.map(t => {
          const winRate = t.matchesWon / Math.max(t.matchesPlayed, 1);
          const roundWinRate = t.roundsWon / Math.max(t.roundsPlayed, 1);
          
          return {
            name: t.name,
            'TIR': t.tir,
            'Win Rate': (winRate * 100).toFixed(1),
            'Round Win %': (roundWinRate * 100).toFixed(1),
            'Avg PIV': t.averagePIV
          };
        });
      } else if (metricCategory === 'economy') {
        // Economy metrics - note: this uses roundMetrics which may not be available for all teams
        data = allTeams.map(t => {
          // Try to get the round metrics for this team if available
          const teamRoundMetrics = t.id === team.id ? roundMetrics : undefined;
          
          if (teamRoundMetrics) {
            return {
              name: t.name,
              'Pistol Win %': (teamRoundMetrics.economyMetrics.pistolRoundWinRate * 100).toFixed(1),
              'Eco Win %': (teamRoundMetrics.economyMetrics.ecoRoundWinRate * 100).toFixed(1),
              'Force Win %': (teamRoundMetrics.economyMetrics.forceBuyWinRate * 100).toFixed(1),
              'Full Buy %': (teamRoundMetrics.economyMetrics.fullBuyWinRate * 100).toFixed(1)
            };
          } else {
            // Fallback when round metrics are not available
            return {
              name: t.name,
              'Pistol Win %': 'N/A',
              'Eco Win %': 'N/A',
              'Force Win %': 'N/A',
              'Full Buy %': 'N/A'
            };
          }
        });
      } else {
        // Strategy metrics
        data = allTeams.map(t => {
          const tWinRate = t.tRoundsWon / Math.max(t.tRoundsPlayed, 1);
          const ctWinRate = t.ctRoundsWon / Math.max(t.ctRoundsPlayed, 1);
          
          // Try to get the round metrics for this team if available
          const teamRoundMetrics = t.id === team.id ? roundMetrics : undefined;
          
          if (teamRoundMetrics) {
            return {
              name: t.name,
              'T Win %': (teamRoundMetrics.strategicMetrics.tSideWinRate * 100).toFixed(1),
              'CT Win %': (teamRoundMetrics.strategicMetrics.ctSideWinRate * 100).toFixed(1),
              'A Site %': (teamRoundMetrics.strategicMetrics.aSiteWinRate * 100).toFixed(1),
              'B Site %': (teamRoundMetrics.strategicMetrics.bSiteWinRate * 100).toFixed(1)
            };
          } else {
            // Fallback to basic stats
            return {
              name: t.name,
              'T Win %': (tWinRate * 100).toFixed(1),
              'CT Win %': (ctWinRate * 100).toFixed(1),
              'Maps': t.mapPool?.length || 0,
              'Avg PIV': t.averagePIV
            };
          }
        });
      }
      
      return data;
    }
  };
  
  // Generate colors based on team (using a simple hash function)
  const getTeamColor = (teamName: string, idx = 0) => {
    const colors = [
      '#3b82f6', '#ef4444', '#10b981', '#f59e0b', '#8b5cf6', 
      '#ec4899', '#6366f1', '#14b8a6', '#f97316', '#8b5cf6'
    ];
    
    // Simple hash function for team name
    const hash = teamName.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0) % colors.length;
    
    return colors[(hash + idx) % colors.length];
  };
  
  // Get RGBA color with opacity
  const getRGBA = (color: string, opacity: number) => {
    const hexToRgb = (hex: string) => {
      const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
      return result 
        ? {
            r: parseInt(result[1], 16),
            g: parseInt(result[2], 16),
            b: parseInt(result[3], 16)
          } 
        : { r: 0, g: 0, b: 0 };
    };
    
    const rgb = hexToRgb(color);
    return `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, ${opacity})`;
  };
  
  // Chart data
  const chartData = generateComparisonData();
  
  // Render a single team radar chart
  const renderRadarChart = () => {
    return (
      <ResponsiveContainer width="100%" height={400}>
        <RadarChart cx="50%" cy="50%" outerRadius="80%" data={chartData}>
          <PolarGrid />
          <PolarAngleAxis dataKey="name" />
          <PolarRadiusAxis angle={30} domain={[0, 1]} />
          <Radar
            name={team.name}
            dataKey="value"
            stroke={getTeamColor(team.name)}
            fill={getTeamColor(team.name)}
            fillOpacity={0.6}
          />
          <Legend />
          <Tooltip />
        </RadarChart>
      </ResponsiveContainer>
    );
  };
  
  // Render a bar chart for comparison
  const renderBarChart = () => {
    const metrics = metricCategory === 'overall' 
      ? ['TIR', 'Win Rate', 'Round Win %', 'Avg PIV']
      : metricCategory === 'economy'
        ? ['Pistol Win %', 'Eco Win %', 'Force Win %', 'Full Buy %']
        : ['T Win %', 'CT Win %', 'A Site %', 'B Site %'];
    
    return (
      <ResponsiveContainer width="100%" height={400}>
        <BarChart
          data={chartData}
          margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
        >
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="name" />
          <YAxis />
          <Tooltip />
          <Legend />
          {metrics.map((metric, idx) => (
            <Bar key={metric} dataKey={metric} fill={`hsl(${idx * 36 + 180}, 70%, 50%)`} />
          ))}
        </BarChart>
      </ResponsiveContainer>
    );
  };
  
  // Render a line chart for comparison
  const renderLineChart = () => {
    const metrics = metricCategory === 'overall' 
      ? ['TIR', 'Win Rate', 'Round Win %', 'Avg PIV']
      : metricCategory === 'economy'
        ? ['Pistol Win %', 'Eco Win %', 'Force Win %', 'Full Buy %']
        : ['T Win %', 'CT Win %', 'A Site %', 'B Site %'];
    
    return (
      <ResponsiveContainer width="100%" height={400}>
        <LineChart
          data={chartData}
          margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
        >
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="name" />
          <YAxis />
          <Tooltip />
          <Legend />
          {metrics.map((metric, idx) => (
            <Line key={metric} type="monotone" dataKey={metric} stroke={`hsl(${idx * 36 + 180}, 70%, 50%)`} activeDot={{ r: 8 }} />
          ))}
        </LineChart>
      </ResponsiveContainer>
    );
  };
  
  // Render pie chart for role distribution
  const renderPieChart = () => {
    const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#83a6ed', '#8dd1e1'];
    
    return (
      <ResponsiveContainer width="100%" height={400}>
        <PieChart>
          <Pie
            data={chartData}
            cx="50%"
            cy="50%"
            labelLine={true}
            label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
            outerRadius={120}
            fill="#8884d8"
            dataKey="value"
          >
            {chartData.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
            ))}
          </Pie>
          <Tooltip />
          <Legend />
        </PieChart>
      </ResponsiveContainer>
    );
  };
  
  return (
    <Card className="w-full">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Team Performance Analysis</CardTitle>
            <CardDescription>
              Visualize team performance metrics across maps and strategies
            </CardDescription>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={() => setChartType('radar')}>
              <PieChartIcon className="h-4 w-4 mr-2" />
              Radar
            </Button>
            <Button variant="outline" size="sm" onClick={() => setChartType('bar')}>
              <BarChart3 className="h-4 w-4 mr-2" />
              Bar
            </Button>
            <Button variant="outline" size="sm" onClick={() => setChartType('line')}>
              <LineChartIcon className="h-4 w-4 mr-2" />
              Line
            </Button>
            <Button variant="outline" size="sm" onClick={() => setChartType('pie')}>
              <PieChartIcon className="h-4 w-4 mr-2" />
              Pie
            </Button>
            <Button variant="outline" size="sm">
              <Download className="h-4 w-4 mr-2" />
              Export
            </Button>
          </div>
        </div>
        
        <div className="flex items-center gap-4 mt-4">
          <Select 
            value={metricCategory} 
            onValueChange={(value) => setMetricCategory(value as keyof typeof metricCategories)}
          >
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Select metrics" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="overall">Overall Performance</SelectItem>
              <SelectItem value="economy">Economic Success</SelectItem>
              <SelectItem value="strategy">Strategic Metrics</SelectItem>
            </SelectContent>
          </Select>
        </div>
        
        <Separator className="my-2" />
      </CardHeader>
      <CardContent>
        {chartType === 'radar' && renderRadarChart()}
        {chartType === 'bar' && renderBarChart()}
        {chartType === 'line' && renderLineChart()}
        {chartType === 'pie' && renderPieChart()}
      </CardContent>
    </Card>
  );
}
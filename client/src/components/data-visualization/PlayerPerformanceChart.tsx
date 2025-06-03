import { useState } from 'react';
import { 
  ResponsiveContainer, 
  RadarChart, 
  PolarGrid, 
  PolarAngleAxis, 
  PolarRadiusAxis, 
  Radar, 
  Legend,
  Tooltip,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  LineChart,
  Line
} from 'recharts';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { PlayerRole, PlayerWithPIV } from '../../../shared/types';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Button } from '../ui/button';
import { Separator } from '../ui/separator';
import { 
  BarChart3, 
  LineChart as LineChartIcon, 
  PieChart,
  Download
} from 'lucide-react';

// Define the visualization types
type ChartType = 'radar' | 'bar' | 'line';

// Metrics categories for organizing charts
const metricCategories = {
  combat: ['kd', 'headshotPercentage', 'openingKills', 'multiKills'],
  utility: ['flashAssists', 'utilityDamage', 'smokeUsage', 'grenadeEfficiency'],
  overall: ['piv', 'rcs', 'icf', 'sc']
};

interface PlayerPerformanceChartProps {
  player: PlayerWithPIV;
  comparisonPlayers?: PlayerWithPIV[];
}

export default function PlayerPerformanceChart({ player, comparisonPlayers = [] }: PlayerPerformanceChartProps) {
  const [chartType, setChartType] = useState<ChartType>('radar');
  const [metricCategory, setMetricCategory] = useState<keyof typeof metricCategories>('overall');
  
  // Generate radar chart data for player's role
  const generateRadarData = () => {
    // Base metrics to display in the radar chart
    let metrics: { name: string, value: number, fullMark: number }[] = [];
    
    if (metricCategory === 'overall') {
      // Overall PIV components
      metrics = [
        { name: 'RCS', value: player.metrics?.rcs?.value || 0, fullMark: 1 },
        { name: 'ICF', value: player.metrics?.icf?.value || 0, fullMark: 1 },
        { name: 'SC', value: player.metrics?.sc?.value || 0, fullMark: 1 },
        { name: 'OSM', value: player.metrics?.osm || 1, fullMark: 1.5 },
        { name: 'PIV', value: Math.min(player.piv / 2, 1), fullMark: 1 }
      ];
    } else if (metricCategory === 'combat') {
      // Combat metrics
      const rawStats = player.rawStats || {};
      metrics = [
        { name: 'K/D', value: Math.min(player.kd / 2, 1), fullMark: 1 },
        { name: 'HS%', value: (rawStats.headshots / Math.max(rawStats.kills, 1)) || 0, fullMark: 1 },
        { name: 'Opening', value: rawStats.firstKills / Math.max(rawStats.kills, 1) || 0, fullMark: 0.5 },
        { name: 'Survival', value: 1 - (rawStats.deaths / Math.max(rawStats.kills + rawStats.deaths, 1)) || 0, fullMark: 1 },
        { name: 'Multikills', value: (player.primaryMetric?.name === 'Multi Kill Conversion' ? player.primaryMetric.value : 0.1), fullMark: 0.5 }
      ];
    } else {
      // Utility metrics
      const rawStats = player.rawStats || {};
      metrics = [
        { name: 'Flash Assists', value: (rawStats.assistedFlashes / Math.max(rawStats.flashesThrown, 1)) || 0, fullMark: 0.5 },
        { name: 'Smokes', value: (rawStats.smokesThrown / Math.max(rawStats.totalUtilityThrown, 1)) || 0, fullMark: 0.5 },
        { name: 'Flashes', value: (rawStats.flashesThrown / Math.max(rawStats.totalUtilityThrown, 1)) || 0, fullMark: 0.5 },
        { name: 'Molotovs', value: (rawStats.infernosThrown / Math.max(rawStats.totalUtilityThrown, 1)) || 0, fullMark: 0.5 },
        { name: 'HE', value: (rawStats.heThrown / Math.max(rawStats.totalUtilityThrown, 1)) || 0, fullMark: 0.5 }
      ];
    }
    
    return metrics;
  };
  
  // Generate comparison data for multiple players
  const generateComparisonData = () => {
    const allPlayers = [player, ...comparisonPlayers];
    
    if (chartType === 'radar') {
      // For radar charts, we just return the player data
      return generateRadarData();
    } else {
      // For bar and line charts
      let data: any[] = [];
      
      if (metricCategory === 'overall') {
        // Overall PIV components for all players
        data = allPlayers.map(p => ({
          name: p.name,
          PIV: p.piv,
          RCS: p.metrics?.rcs?.value || 0,
          ICF: p.metrics?.icf?.value || 0,
          SC: p.metrics?.sc?.value || 0
        }));
      } else if (metricCategory === 'combat') {
        // Combat metrics for all players
        data = allPlayers.map(p => {
          const rawStats = p.rawStats || {};
          return {
            name: p.name,
            'K/D': p.kd,
            'HS%': (rawStats.headshots / Math.max(rawStats.kills, 1)) || 0,
            'Opening': rawStats.firstKills || 0,
            'Deaths': rawStats.deaths || 0
          };
        });
      } else {
        // Utility metrics for all players
        data = allPlayers.map(p => {
          const rawStats = p.rawStats || {};
          return {
            name: p.name,
            'Flashes': rawStats.flashesThrown || 0,
            'Smokes': rawStats.smokesThrown || 0,
            'Molotovs': rawStats.infernosThrown || 0,
            'HE': rawStats.heThrown || 0
          };
        });
      }
      
      return data;
    }
  };
  
  // Generate colors based on role
  const getRoleColor = (playerRole: PlayerRole) => {
    const roleColors = {
      [PlayerRole.IGL]: '#8b5cf6',
      [PlayerRole.AWP]: '#ef4444',
      [PlayerRole.Lurker]: '#f59e0b',
      [PlayerRole.Spacetaker]: '#10b981',
      [PlayerRole.Support]: '#3b82f6',
      [PlayerRole.Anchor]: '#6366f1',
      [PlayerRole.Rotator]: '#ec4899'
    };
    
    return roleColors[playerRole] || '#3b82f6';
  };
  
  // Chart data
  const chartData = generateComparisonData();
  
  // Render a single player radar chart
  const renderRadarChart = () => {
    return (
      <ResponsiveContainer width="100%" height={400}>
        <RadarChart cx="50%" cy="50%" outerRadius="80%" data={chartData}>
          <PolarGrid />
          <PolarAngleAxis dataKey="name" />
          <PolarRadiusAxis angle={30} domain={[0, 1]} />
          <Radar
            name={player.name}
            dataKey="value"
            stroke={getRoleColor(player.role)}
            fill={getRoleColor(player.role)}
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
      ? ['PIV', 'RCS', 'ICF', 'SC']
      : metricCategory === 'combat'
        ? ['K/D', 'HS%', 'Opening', 'Deaths']
        : ['Flashes', 'Smokes', 'Molotovs', 'HE'];
    
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
      ? ['PIV', 'RCS', 'ICF', 'SC']
      : metricCategory === 'combat'
        ? ['K/D', 'HS%', 'Opening', 'Deaths']
        : ['Flashes', 'Smokes', 'Molotovs', 'HE'];
    
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
  
  return (
    <Card className="w-full">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Performance Visualization</CardTitle>
            <CardDescription>
              Visualize player performance metrics and statistics
            </CardDescription>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={() => setChartType('radar')}>
              <PieChart className="h-4 w-4 mr-2" />
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
              <SelectItem value="combat">Combat Metrics</SelectItem>
              <SelectItem value="utility">Utility Usage</SelectItem>
            </SelectContent>
          </Select>
        </div>
        
        <Separator className="my-2" />
      </CardHeader>
      <CardContent>
        {chartType === 'radar' && renderRadarChart()}
        {chartType === 'bar' && renderBarChart()}
        {chartType === 'line' && renderLineChart()}
      </CardContent>
    </Card>
  );
}
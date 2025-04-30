import { useState, useMemo } from 'react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Card, CardContent } from '@/components/ui/card';
import {
  Tabs,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { PlayerWithPIV } from '@shared/types';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  BarChart,
  Bar,
} from 'recharts';

interface TrendAnalysisProps {
  players: PlayerWithPIV[];
}

// Metrics categories for analysis
const TREND_METRICS = {
  performance: [
    { key: 'piv', label: 'PIV (Overall)' },
    { key: 'ctPIV', label: 'CT Side PIV' },
    { key: 'tPIV', label: 'T Side PIV' },
    { key: 'metrics.rcs.value', label: 'RCS', accessor: (player: PlayerWithPIV) => player.metrics?.rcs?.value },
    { key: 'metrics.icf.value', label: 'ICF', accessor: (player: PlayerWithPIV) => player.metrics?.icf?.value },
    { key: 'metrics.sc.value', label: 'SC', accessor: (player: PlayerWithPIV) => player.metrics?.sc?.value },
  ],
  offensive: [
    { key: 'kills', label: 'Kills' },
    { key: 'headshots', label: 'Headshots' },
    { key: 'kd', label: 'K/D Ratio' },
    { key: 'firstKills', label: 'First Kills' },
    { key: 'rawStats.tFirstKills', label: 'T Side First Kills', accessor: (player: PlayerWithPIV) => player.rawStats?.tFirstKills },
    { key: 'rawStats.ctFirstKills', label: 'CT Side First Kills', accessor: (player: PlayerWithPIV) => player.rawStats?.ctFirstKills },
  ],
  defensive: [
    { key: 'rawStats.deaths', label: 'Deaths', accessor: (player: PlayerWithPIV) => player.rawStats?.deaths },
    { key: 'rawStats.firstDeaths', label: 'First Deaths', accessor: (player: PlayerWithPIV) => player.rawStats?.firstDeaths },
    { key: 'rawStats.tFirstDeaths', label: 'T Side First Deaths', accessor: (player: PlayerWithPIV) => player.rawStats?.tFirstDeaths },
    { key: 'rawStats.ctFirstDeaths', label: 'CT Side First Deaths', accessor: (player: PlayerWithPIV) => player.rawStats?.ctFirstDeaths },
  ],
  utility: [
    { key: 'rawStats.flashesThrown', label: 'Flashes Thrown', accessor: (player: PlayerWithPIV) => player.rawStats?.flashesThrown },
    { key: 'rawStats.smokesThrown', label: 'Smokes Thrown', accessor: (player: PlayerWithPIV) => player.rawStats?.smokesThrown },
    { key: 'rawStats.heThrown', label: 'HE Grenades Thrown', accessor: (player: PlayerWithPIV) => player.rawStats?.heThrown },
    { key: 'rawStats.infernosThrown', label: 'Molotovs Thrown', accessor: (player: PlayerWithPIV) => player.rawStats?.infernosThrown },
    { key: 'rawStats.assistedFlashes', label: 'Flash Assists', accessor: (player: PlayerWithPIV) => player.rawStats?.assistedFlashes },
  ],
};

// Colors for player data visualization
const PLAYER_COLORS = [
  '#8884d8',
  '#82ca9d',
  '#ffc658',
  '#ff8042',
  '#0088fe',
];

// Chart types for visualization
type ChartType = 'line' | 'radar' | 'bar';

export default function TrendAnalysis({ players }: TrendAnalysisProps) {
  const [selectedMetrics, setSelectedMetrics] = useState<string[]>(['piv', 'kd']);
  const [chartType, setChartType] = useState<ChartType>('line');
  const [category, setCategory] = useState<string>('performance');
  const [normalizeValues, setNormalizeValues] = useState<boolean>(true);
  
  // Get available metrics based on selected category
  const availableMetrics = useMemo(() => {
    switch (category) {
      case 'performance':
        return TREND_METRICS.performance;
      case 'offensive':
        return TREND_METRICS.offensive;
      case 'defensive':
        return TREND_METRICS.defensive;
      case 'utility':
        return TREND_METRICS.utility;
      default:
        return TREND_METRICS.performance;
    }
  }, [category]);
  
  // Helper function to get player value based on metric key
  const getPlayerValue = (player: PlayerWithPIV, metricKey: string): number => {
    // Check if the metric has a custom accessor
    const metric = Object.values(TREND_METRICS)
      .flat()
      .find(m => m.key === metricKey);
      
    if (metric?.accessor) {
      return metric.accessor(player) || 0;
    }
    
    // Handle nested properties like 'metrics.rcs.value'
    if (metricKey.includes('.')) {
      let value: any = player;
      metricKey.split('.').forEach(key => {
        if (value) value = value[key as keyof typeof value];
      });
      return typeof value === 'number' ? value : 0;
    }
    
    // Check for basic properties on player
    return player[metricKey as keyof typeof player] as number || 0;
  };
  
  // Helper function to get a metric label from its key
  const getMetricLabel = (key: string): string => {
    const metric = Object.values(TREND_METRICS)
      .flat()
      .find(m => m.key === key);
    return metric?.label || key;
  };
  
  // Toggle selection of a metric
  const toggleMetricSelection = (metricKey: string) => {
    if (selectedMetrics.includes(metricKey)) {
      setSelectedMetrics(selectedMetrics.filter(key => key !== metricKey));
    } else {
      // Limit to 5 metrics for visualization clarity
      if (selectedMetrics.length < 5) {
        setSelectedMetrics([...selectedMetrics, metricKey]);
      }
    }
  };
  
  // Prepare data for charts
  const chartData = useMemo(() => {
    if (!players.length || !selectedMetrics.length) return [];
    
    if (chartType === 'radar') {
      // For radar chart, prepare data with metrics as attributes
      return players.map(player => {
        const playerData: any = {
          name: player.name,
          team: player.team,
          role: player.role,
        };
        
        // Add metrics to player data
        selectedMetrics.forEach(metricKey => {
          const rawValue = getPlayerValue(player, metricKey);
          playerData[getMetricLabel(metricKey)] = rawValue;
        });
        
        return playerData;
      });
    } else {
      // For line and bar charts, prepare data with players as categories
      return selectedMetrics.map(metricKey => {
        // Calculate the max value for normalization if needed
        const maxValue = normalizeValues
          ? Math.max(...players.map(player => getPlayerValue(player, metricKey)))
          : 1;
          
        return {
          name: getMetricLabel(metricKey),
          ...players.reduce((acc, player, index) => {
            const value = getPlayerValue(player, metricKey);
            acc[player.name] = normalizeValues 
              ? maxValue > 0 
                ? (value / maxValue) * 100 
                : 0
              : value;
            return acc;
          }, {} as Record<string, number>),
        };
      });
    }
  }, [players, selectedMetrics, chartType, normalizeValues]);
  
  // Prepare radar data with fixed format
  const radarData = useMemo(() => {
    if (!players.length || !selectedMetrics.length) return [];
    
    // Need to normalize values for radar chart
    const maxValues: Record<string, number> = {};
    
    // Calculate max values for each metric
    selectedMetrics.forEach(metricKey => {
      maxValues[metricKey] = Math.max(...players.map(player => getPlayerValue(player, metricKey)));
    });
    
    // Create data points for each player
    return selectedMetrics.map(metricKey => {
      const metricLabel = getMetricLabel(metricKey);
      const maxValue = maxValues[metricKey] || 1;
      
      return {
        metric: metricLabel,
        ...players.reduce((acc, player) => {
          const value = getPlayerValue(player, metricKey);
          acc[player.name] = normalizeValues 
            ? maxValue > 0 
              ? (value / maxValue) * 100 
              : 0
            : value;
          return acc;
        }, {} as Record<string, number>),
      };
    });
  }, [players, selectedMetrics, normalizeValues]);
  
  // Simple radar chart format
  const simpleRadarData = useMemo(() => {
    if (!players.length || !selectedMetrics.length) return [];
    
    return players.map(player => {
      const playerData: any = {
        name: player.name,
      };
      
      selectedMetrics.forEach(metricKey => {
        const maxValue = Math.max(...players.map(p => getPlayerValue(p, metricKey))) || 1;
        const value = getPlayerValue(player, metricKey);
        
        playerData[getMetricLabel(metricKey)] = normalizeValues 
          ? (value / maxValue) * 100 
          : value;
      });
      
      return playerData;
    });
  }, [players, selectedMetrics, normalizeValues]);
  
  // Custom tooltip for charts
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      if (chartType === 'radar') {
        return (
          <Card className="bg-background border shadow-md p-0">
            <CardContent className="p-2">
              <p className="font-semibold">{label}</p>
              <div className="text-xs mt-1">
                {payload.map((entry: any, index: number) => (
                  <p key={index} style={{ color: entry.color }}>
                    <span className="font-medium">{entry.name}:</span> {normalizeValues ? `${entry.value.toFixed(1)}%` : entry.value.toFixed(2)}
                  </p>
                ))}
              </div>
            </CardContent>
          </Card>
        );
      } else {
        return (
          <Card className="bg-background border shadow-md p-0">
            <CardContent className="p-2">
              <p className="font-semibold">{label}</p>
              <div className="text-xs mt-1">
                {payload.map((entry: any, index: number) => (
                  <p key={index} style={{ color: entry.color }}>
                    <span className="font-medium">{entry.name}:</span> {normalizeValues ? `${entry.value.toFixed(1)}%` : entry.value.toFixed(2)}
                  </p>
                ))}
              </div>
            </CardContent>
          </Card>
        );
      }
    }
    return null;
  };
  
  return (
    <div className="space-y-4">
      <div className="flex flex-col lg:flex-row gap-4">
        {/* Controls */}
        <Card className="lg:w-1/3">
          <CardContent className="pt-6">
            <h3 className="text-base font-semibold mb-4">Trend Analysis Controls</h3>
            
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium mb-1 block">Chart Type</label>
                <Tabs value={chartType} onValueChange={(value) => setChartType(value as ChartType)}>
                  <TabsList className="grid grid-cols-3 w-full">
                    <TabsTrigger value="line">Line</TabsTrigger>
                    <TabsTrigger value="radar">Radar</TabsTrigger>
                    <TabsTrigger value="bar">Bar</TabsTrigger>
                  </TabsList>
                </Tabs>
              </div>
              
              <div>
                <label className="text-sm font-medium mb-1 block">Metric Category</label>
                <Tabs value={category} onValueChange={setCategory}>
                  <TabsList className="grid grid-cols-4 w-full">
                    <TabsTrigger value="performance">Performance</TabsTrigger>
                    <TabsTrigger value="offensive">Offense</TabsTrigger>
                    <TabsTrigger value="defensive">Defense</TabsTrigger>
                    <TabsTrigger value="utility">Utility</TabsTrigger>
                  </TabsList>
                </Tabs>
              </div>
              
              <div>
                <div className="flex items-center justify-between">
                  <label className="text-sm font-medium">Selected Metrics ({selectedMetrics.length}/5)</label>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={() => setSelectedMetrics([])}
                    disabled={selectedMetrics.length === 0}
                  >
                    Clear
                  </Button>
                </div>
                
                <div className="mt-2 space-y-2">
                  {availableMetrics.map(metric => (
                    <div 
                      key={metric.key}
                      className={`flex items-center p-2 rounded-md border cursor-pointer ${
                        selectedMetrics.includes(metric.key) 
                          ? 'border-primary bg-primary/10' 
                          : 'border-border hover:bg-secondary/50'
                      }`}
                      onClick={() => toggleMetricSelection(metric.key)}
                    >
                      <div className="flex-1">{metric.label}</div>
                      {selectedMetrics.includes(metric.key) && (
                        <div className="w-3 h-3 rounded-full bg-primary"></div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
              
              <div className="flex items-center space-x-2">
                <div className="flex-1">
                  <label className="text-sm font-medium">Normalize Values</label>
                  <p className="text-xs text-muted-foreground">
                    Scale values to percentages for easier comparison
                  </p>
                </div>
                <Button
                  variant={normalizeValues ? "default" : "outline"}
                  size="sm"
                  onClick={() => setNormalizeValues(!normalizeValues)}
                >
                  {normalizeValues ? "On" : "Off"}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
        
        {/* Visualization */}
        <Card className="lg:w-2/3">
          <CardContent className="pt-6">
            <div className="h-[400px] w-full">
              {selectedMetrics.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full">
                  <p className="text-muted-foreground">
                    Select at least one metric to visualize
                  </p>
                </div>
              ) : chartType === 'line' ? (
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart
                    data={chartData}
                    margin={{ top: 20, right: 30, left: 20, bottom: 10 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
                    <XAxis dataKey="name" />
                    <YAxis 
                      label={normalizeValues 
                        ? { value: 'Percentage (%)', angle: -90, position: 'insideLeft' } 
                        : undefined
                      } 
                    />
                    <Tooltip content={<CustomTooltip />} />
                    <Legend />
                    {players.map((player, index) => (
                      <Line
                        key={player.id}
                        type="monotone"
                        dataKey={player.name}
                        stroke={PLAYER_COLORS[index % PLAYER_COLORS.length]}
                        activeDot={{ r: 8 }}
                      />
                    ))}
                  </LineChart>
                </ResponsiveContainer>
              ) : chartType === 'radar' ? (
                <ResponsiveContainer width="100%" height="100%">
                  <RadarChart 
                    outerRadius={130} 
                    width={500} 
                    height={500} 
                    data={simpleRadarData[0] ? Object.keys(simpleRadarData[0])
                      .filter(key => key !== 'name')
                      .map(key => ({
                        subject: key,
                        ...simpleRadarData.reduce((acc, player) => {
                          acc[player.name] = player[key];
                          return acc;
                        }, {} as Record<string, number>),
                        fullMark: normalizeValues ? 100 : undefined,
                      })) : []}
                  >
                    <PolarGrid />
                    <PolarAngleAxis dataKey="subject" />
                    <PolarRadiusAxis 
                      angle={90} 
                      domain={normalizeValues ? [0, 100] : undefined} 
                    />
                    {players.map((player, index) => (
                      <Radar
                        key={player.id}
                        name={player.name}
                        dataKey={player.name}
                        stroke={PLAYER_COLORS[index % PLAYER_COLORS.length]}
                        fill={PLAYER_COLORS[index % PLAYER_COLORS.length]}
                        fillOpacity={0.2}
                      />
                    ))}
                    <Legend />
                    <Tooltip content={<CustomTooltip />} />
                  </RadarChart>
                </ResponsiveContainer>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    width={500}
                    height={300}
                    data={chartData}
                    margin={{ top: 20, right: 30, left: 20, bottom: 10 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
                    <XAxis dataKey="name" />
                    <YAxis 
                      label={normalizeValues 
                        ? { value: 'Percentage (%)', angle: -90, position: 'insideLeft' } 
                        : undefined
                      } 
                    />
                    <Tooltip content={<CustomTooltip />} />
                    <Legend />
                    {players.map((player, index) => (
                      <Bar
                        key={player.id}
                        dataKey={player.name}
                        fill={PLAYER_COLORS[index % PLAYER_COLORS.length]}
                      />
                    ))}
                  </BarChart>
                </ResponsiveContainer>
              )}
            </div>
            
            <div className="mt-2 text-center text-sm text-muted-foreground">
              {selectedMetrics.length === 0 ? (
                "Select metrics from the left panel to analyze trends"
              ) : normalizeValues ? (
                "Values are normalized as percentages of the maximum value for each metric"
              ) : (
                "Showing raw values without normalization"
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
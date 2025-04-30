import { useState } from 'react';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ReferenceLine,
  ComposedChart,
  Area,
} from 'recharts';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Download, ArrowUpDown, BarChart2, LineChart as LineChartIcon } from 'lucide-react';
import { PlayerWithPIV } from '@shared/types';
import { Card, CardContent } from '@/components/ui/card';
import RoleBadge from '@/components/ui/role-badge';

interface TrendAnalysisProps {
  players: PlayerWithPIV[];
}

// Available metric options and their calculation functions
interface MetricOption {
  key: string;
  label: string;
  valueFunction: (player: PlayerWithPIV) => number;
  description: string;
  format?: (value: number) => string;
  baseline?: number;
}

// Helper function to safely access raw stats
const getRawStat = (player: PlayerWithPIV, key: string, defaultValue: number = 0): number => {
  return player.rawStats ? (player.rawStats[key as keyof typeof player.rawStats] as number || defaultValue) : defaultValue;
};

// Format as percentage
const formatPercent = (value: number): string => {
  return `${(value * 100).toFixed(1)}%`;
};

// Format to 2 decimal places
const formatDecimal = (value: number): string => {
  return value.toFixed(2);
};

// Define the metrics for trend analysis
const metricOptions: MetricOption[] = [
  { 
    key: 'piv', 
    label: 'PIV',
    description: 'Player Impact Value - overall performance metric',
    valueFunction: (player) => player.piv,
    format: formatDecimal,
    baseline: 1.0
  },
  { 
    key: 'kd', 
    label: 'K/D Ratio',
    description: 'Kill to death ratio',
    valueFunction: (player) => player.kd,
    format: formatDecimal,
    baseline: 1.0
  },
  { 
    key: 'tPIV', 
    label: 'T-Side PIV',
    description: 'Player Impact Value on T-side',
    valueFunction: (player) => player.tPIV,
    format: formatDecimal,
    baseline: 1.0
  },
  { 
    key: 'ctPIV', 
    label: 'CT-Side PIV',
    description: 'Player Impact Value on CT-side',
    valueFunction: (player) => player.ctPIV,
    format: formatDecimal,
    baseline: 1.0
  },
  { 
    key: 'adr', 
    label: 'ADR',
    description: 'Average damage per round',
    valueFunction: (player) => getRawStat(player, 'adrTotal'),
    format: formatDecimal,
    baseline: 75
  },
  { 
    key: 'hs_percent', 
    label: 'Headshot %',
    description: 'Percentage of kills that are headshots',
    valueFunction: (player) => {
      const headshots = getRawStat(player, 'headshots');
      const kills = getRawStat(player, 'kills');
      return kills > 0 ? headshots / kills : 0;
    },
    format: formatPercent,
    baseline: 0.4
  },
  { 
    key: 'first_kill_ratio', 
    label: 'First Kill Ratio',
    description: 'Ratio of first kills to first deaths',
    valueFunction: (player) => {
      const firstKills = getRawStat(player, 'firstKills');
      const firstDeaths = getRawStat(player, 'firstDeaths');
      return firstDeaths > 0 ? firstKills / firstDeaths : firstKills;
    },
    format: formatDecimal,
    baseline: 1.0
  },
  { 
    key: 'flash_assists', 
    label: 'Flash Assists',
    description: 'Number of kills assisted by player flashes',
    valueFunction: (player) => getRawStat(player, 'assistedFlashes'),
    format: formatDecimal
  },
  { 
    key: 'util_damage', 
    label: 'Utility Damage',
    description: 'Average damage per round from utility',
    valueFunction: (player) => {
      const totalUtilDmg = getRawStat(player, 'totalUtilDmg');
      const totalRounds = Math.max(
        getRawStat(player, 'tRoundsWon') + getRawStat(player, 'ctRoundsWon'),
        1
      );
      return totalUtilDmg / totalRounds;
    },
    format: formatDecimal,
    baseline: 10
  },
  { 
    key: 'kast', 
    label: 'KAST %',
    description: 'Percentage of rounds with kill, assist, survival, or trade',
    valueFunction: (player) => getRawStat(player, 'kastTotal'),
    format: formatPercent,
    baseline: 0.7
  }
];

// Chart type options
type ChartType = 'bar' | 'line' | 'area' | 'composed';

// Standardization options
type StandardizationType = 'none' | 'zscore' | 'percent';

export default function TrendAnalysis({ players }: TrendAnalysisProps) {
  const [selectedMetric, setSelectedMetric] = useState<string>('piv');
  const [chartType, setChartType] = useState<ChartType>('bar');
  const [standardization, setStandardization] = useState<StandardizationType>('none');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');
  
  // Get the selected metric definition
  const getMetric = (): MetricOption => {
    return metricOptions.find(m => m.key === selectedMetric) || metricOptions[0];
  };

  // Apply standardization to the metric values
  const getStandardizedValue = (rawValue: number, metric: MetricOption): number => {
    if (standardization === 'none') {
      return rawValue;
    }
    
    // Calculate statistics across all players for this metric
    const allValues = players.map(p => metric.valueFunction(p));
    const sum = allValues.reduce((acc, val) => acc + val, 0);
    const mean = sum / allValues.length;
    
    if (standardization === 'percent') {
      // Express as percentage of mean
      return (rawValue / mean) * 100;
    } else if (standardization === 'zscore') {
      // Z-score standardization
      const squaredDiffs = allValues.map(val => Math.pow(val - mean, 2));
      const variance = squaredDiffs.reduce((acc, val) => acc + val, 0) / allValues.length;
      const stdDev = Math.sqrt(variance);
      
      return stdDev === 0 ? 0 : (rawValue - mean) / stdDev;
    }
    
    return rawValue;
  };

  // Prepare the chart data
  const prepareChartData = () => {
    const metric = getMetric();
    
    // Calculate and sort values
    let result = players.map(player => {
      const rawValue = metric.valueFunction(player);
      const standardizedValue = getStandardizedValue(rawValue, metric);
      
      return {
        name: player.name,
        team: player.team,
        role: player.role,
        value: standardizedValue,
        rawValue: rawValue,
        formatted: metric.format ? metric.format(rawValue) : rawValue.toString()
      };
    });
    
    // Sort the data
    result.sort((a, b) => {
      return sortDirection === 'asc' 
        ? a.value - b.value 
        : b.value - a.value;
    });
    
    return result;
  };
  
  // Calculate the average value
  const calculateAverage = (): number => {
    const metric = getMetric();
    const values = players.map(p => metric.valueFunction(p));
    const sum = values.reduce((acc, val) => acc + val, 0);
    const mean = sum / Math.max(values.length, 1);
    
    return standardization === 'zscore' ? 0 : 
           standardization === 'percent' ? 100 : 
           mean;
  };
  
  // Determine if a value is above or below baseline
  const getValueColor = (value: number): string => {
    const metric = getMetric();
    const baseline = metric.baseline || calculateAverage();
    
    if (standardization === 'zscore') {
      return value > 0 ? 'fill-green-500' : value < 0 ? 'fill-red-500' : 'fill-yellow-500';
    }
    
    const comparisonValue = standardization === 'percent' ? 100 : baseline;
    return value > comparisonValue ? 'fill-green-500' : value < comparisonValue ? 'fill-red-500' : 'fill-yellow-500';
  };
  
  // Get tooltip label for standardized values
  const getTooltipValueLabel = (): string => {
    if (standardization === 'zscore') {
      return 'Z-Score';
    } else if (standardization === 'percent') {
      return '% of Average';
    } else {
      return getMetric().label;
    }
  };
  
  // Chart data
  const chartData = prepareChartData();
  
  // Average line value
  const averageValue = calculateAverage();
  
  // Render different chart types
  const renderChart = () => {
    const metric = getMetric();
    
    // Formatter for tooltip and axis labels
    const valueFormatter = (value: number) => {
      if (standardization === 'zscore') {
        return value.toFixed(2);
      } else if (standardization === 'percent') {
        return `${value.toFixed(1)}%`;
      } else {
        return metric.format ? metric.format(value) : value.toString();
      }
    };
    
    // Bar chart
    if (chartType === 'bar') {
      return (
        <ResponsiveContainer width="100%" height={500}>
          <BarChart
            data={chartData}
            margin={{ top: 20, right: 30, left: 20, bottom: 150 }}
          >
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis 
              dataKey="name" 
              interval={0}
              angle={-45}
              textAnchor="end"
              height={100}
            />
            <YAxis tickFormatter={valueFormatter} />
            <Tooltip 
              formatter={(value, name) => {
                if (name === 'value') {
                  return [valueFormatter(value as number), getTooltipValueLabel()];
                }
                return [value, name];
              }}
              content={({ active, payload }) => {
                if (active && payload && payload.length) {
                  const data = payload[0].payload;
                  return (
                    <div className="bg-background border rounded-md shadow-md p-3">
                      <p className="font-bold">{data.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {data.team} - <RoleBadge role={data.role} size="xs" />
                      </p>
                      <div className="mt-2">
                        <p className="flex justify-between gap-4">
                          <span>{getMetric().label}:</span>
                          <span className="font-medium">{data.formatted}</span>
                        </p>
                        
                        {standardization !== 'none' && (
                          <p className="flex justify-between gap-4">
                            <span>{getTooltipValueLabel()}:</span>
                            <span className="font-medium">{valueFormatter(data.value)}</span>
                          </p>
                        )}
                      </div>
                    </div>
                  );
                }
                return null;
              }}
            />
            <Legend />
            <ReferenceLine y={averageValue} stroke="#FF4500" strokeDasharray="3 3" />
            <Bar 
              dataKey="value" 
              name={getMetric().label} 
              fill="#317039"
              className="transition-all duration-300"
            />
          </BarChart>
        </ResponsiveContainer>
      );
    }
    
    // Line chart
    if (chartType === 'line') {
      return (
        <ResponsiveContainer width="100%" height={500}>
          <LineChart
            data={chartData}
            margin={{ top: 20, right: 30, left: 20, bottom: 150 }}
          >
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis 
              dataKey="name" 
              interval={0}
              angle={-45}
              textAnchor="end"
              height={100}
            />
            <YAxis tickFormatter={valueFormatter} />
            <Tooltip 
              formatter={(value, name) => {
                if (name === 'value') {
                  return [valueFormatter(value as number), getTooltipValueLabel()];
                }
                return [value, name];
              }}
            />
            <Legend />
            <ReferenceLine y={averageValue} stroke="#FF4500" strokeDasharray="3 3" />
            <Line 
              type="monotone" 
              dataKey="value" 
              name={getMetric().label} 
              stroke="#317039" 
              strokeWidth={2}
              activeDot={{ r: 8 }} 
            />
          </LineChart>
        </ResponsiveContainer>
      );
    }
    
    // Area chart
    if (chartType === 'area') {
      return (
        <ResponsiveContainer width="100%" height={500}>
          <ComposedChart
            data={chartData}
            margin={{ top: 20, right: 30, left: 20, bottom: 150 }}
          >
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis 
              dataKey="name" 
              interval={0}
              angle={-45}
              textAnchor="end"
              height={100}
            />
            <YAxis tickFormatter={valueFormatter} />
            <Tooltip 
              formatter={(value, name) => {
                if (name === 'value') {
                  return [valueFormatter(value as number), getTooltipValueLabel()];
                }
                return [value, name];
              }}
            />
            <Legend />
            <ReferenceLine y={averageValue} stroke="#FF4500" strokeDasharray="3 3" />
            <Area 
              type="monotone" 
              dataKey="value" 
              name={getMetric().label} 
              fill="#317039" 
              stroke="#317039"
              fillOpacity={0.6}
            />
          </ComposedChart>
        </ResponsiveContainer>
      );
    }
    
    // Composed chart (bar + line)
    return (
      <ResponsiveContainer width="100%" height={500}>
        <ComposedChart
          data={chartData}
          margin={{ top: 20, right: 30, left: 20, bottom: 150 }}
        >
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis 
            dataKey="name" 
            interval={0}
            angle={-45}
            textAnchor="end"
            height={100}
          />
          <YAxis tickFormatter={valueFormatter} />
          <Tooltip 
            formatter={(value, name) => {
              if (name === 'value') {
                return [valueFormatter(value as number), getTooltipValueLabel()];
              }
              return [value, name];
            }}
          />
          <Legend />
          <ReferenceLine y={averageValue} stroke="#FF4500" strokeDasharray="3 3" />
          <Bar 
            dataKey="value" 
            name={getMetric().label} 
            barSize={20}
            fill="#317039" 
          />
          <Line 
            type="monotone" 
            dataKey="value" 
            name={`${getMetric().label} Trend`} 
            stroke="#FF4500" 
            strokeWidth={2}
          />
        </ComposedChart>
      </ResponsiveContainer>
    );
  };
  
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-2">
        <Card className="p-4">
          <div className="flex flex-col">
            <span className="text-sm text-muted-foreground">Metric</span>
            <span className="text-xl font-bold">{getMetric().label}</span>
            <span className="text-xs text-muted-foreground mt-1">
              {getMetric().description}
            </span>
          </div>
        </Card>
        
        <Card className="p-4">
          <div className="flex flex-col">
            <span className="text-sm text-muted-foreground">Average Value</span>
            <span className="text-xl font-bold">
              {getMetric().format 
                ? getMetric().format(calculateAverage()) 
                : calculateAverage().toFixed(2)}
            </span>
            <span className="text-xs text-muted-foreground mt-1">
              Across {players.length} players
            </span>
          </div>
        </Card>
        
        <Card className="p-4">
          <div className="flex flex-col">
            <span className="text-sm text-muted-foreground">Data View</span>
            <span className="text-xl font-bold">
              {standardization === 'zscore' ? 'Z-Score' : 
               standardization === 'percent' ? 'Percent of Average' : 
               'Raw Values'}
            </span>
            <span className="text-xs text-muted-foreground mt-1">
              {standardization === 'zscore' 
                ? 'Standard deviations from mean'
                : standardization === 'percent'
                ? 'Percentage of average value'
                : 'Actual metric values'}
            </span>
          </div>
        </Card>
      </div>
      
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 w-full sm:w-auto">
          <div>
            <label className="text-sm font-medium mb-1 block">Metric</label>
            <Select 
              value={selectedMetric}
              onValueChange={setSelectedMetric}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select metric" />
              </SelectTrigger>
              <SelectContent>
                {metricOptions.map((metric) => (
                  <SelectItem key={metric.key} value={metric.key}>
                    {metric.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          <div>
            <label className="text-sm font-medium mb-1 block">Chart Type</label>
            <Tabs 
              value={chartType}
              onValueChange={(value) => setChartType(value as ChartType)}
              className="w-full"
            >
              <TabsList className="grid grid-cols-4 w-full">
                <TabsTrigger value="bar" className="px-2">
                  <BarChart2 className="h-4 w-4" />
                </TabsTrigger>
                <TabsTrigger value="line" className="px-2">
                  <LineChartIcon className="h-4 w-4" />
                </TabsTrigger>
                <TabsTrigger value="area" className="text-xs px-2">
                  Area
                </TabsTrigger>
                <TabsTrigger value="composed" className="text-xs px-2">
                  Multi
                </TabsTrigger>
              </TabsList>
            </Tabs>
          </div>
          
          <div>
            <label className="text-sm font-medium mb-1 block">Standardization</label>
            <Select 
              value={standardization}
              onValueChange={(value) => setStandardization(value as StandardizationType)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Data view" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">Raw Values</SelectItem>
                <SelectItem value="percent">% of Average</SelectItem>
                <SelectItem value="zscore">Z-Scores</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <div className="flex items-end">
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc')}
              className="flex items-center gap-1 h-10 w-full justify-center"
            >
              <ArrowUpDown className="h-4 w-4" />
              <span>{sortDirection === 'asc' ? 'Ascending' : 'Descending'}</span>
            </Button>
          </div>
        </div>
        
        <Button variant="outline" size="sm" className="flex items-center gap-1">
          <Download className="h-4 w-4" />
          <span>Export</span>
        </Button>
      </div>
      
      {/* Chart Visualization */}
      <div className="bg-card rounded-md border p-4">
        {renderChart()}
      </div>
      
      <div className="text-center text-muted-foreground text-sm">
        <p>
          The orange reference line indicates the average value ({getMetric().format 
            ? getMetric().format(calculateAverage()) 
            : calculateAverage().toFixed(2)})
          {standardization === 'percent' ? ' (100%)' : standardization === 'zscore' ? ' (0)' : ''}.
        </p>
      </div>
    </div>
  );
}
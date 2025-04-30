import { useState } from 'react';
import {
  ResponsiveContainer,
  ScatterChart,
  Scatter,
  XAxis,
  YAxis,
  ZAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  Label,
} from 'recharts';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Download, ZoomIn, ZoomOut } from 'lucide-react';
import { Card, CardContent, CardDescription } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Label as UILabel } from '@/components/ui/label';
import { PlayerWithPIV } from '@shared/types';

interface CorrelationAnalysisProps {
  players: PlayerWithPIV[];
}

// Available metrics for correlation analysis
interface MetricOption {
  key: string;
  label: string;
  valueFunction: (player: PlayerWithPIV) => number;
  domain?: [number, number]; // Optional min/max values for axis
}

// Helper function to safely get raw stats
const getRawStat = (player: PlayerWithPIV, key: string, defaultValue: number = 0): number => {
  return player.rawStats ? (player.rawStats[key as keyof typeof player.rawStats] as number || defaultValue) : defaultValue;
};

// Define metrics for correlation analysis
const metricOptions: MetricOption[] = [
  { 
    key: 'piv', 
    label: 'PIV', 
    valueFunction: (player) => player.piv,
    domain: [0, 2]
  },
  { 
    key: 'kd', 
    label: 'K/D Ratio', 
    valueFunction: (player) => player.kd,
    domain: [0, 1.5]
  },
  { 
    key: 'adr', 
    label: 'ADR', 
    valueFunction: (player) => getRawStat(player, 'adrTotal'),
    domain: [0, 100]
  },
  { 
    key: 'kast', 
    label: 'KAST%', 
    valueFunction: (player) => getRawStat(player, 'kastTotal'),
    domain: [0, 1]
  },
  { 
    key: 'hs', 
    label: 'Headshot %', 
    valueFunction: (player) => {
      const headshots = getRawStat(player, 'headshots');
      const kills = getRawStat(player, 'kills');
      return kills > 0 ? headshots / kills : 0;
    },
    domain: [0, 1]
  },
  { 
    key: 'firstKillRatio', 
    label: 'First Kill Ratio', 
    valueFunction: (player) => {
      const firstKills = getRawStat(player, 'firstKills');
      const firstDeaths = getRawStat(player, 'firstDeaths');
      return firstDeaths > 0 ? firstKills / firstDeaths : firstKills;
    },
    domain: [0, 3]
  },
  { 
    key: 'utilityDamage', 
    label: 'Utility Damage/Round', 
    valueFunction: (player) => {
      const totalUtilDmg = getRawStat(player, 'totalUtilDmg');
      const totalRounds = Math.max(
        getRawStat(player, 'tRoundsWon') + getRawStat(player, 'ctRoundsWon'),
        1
      );
      return totalUtilDmg / totalRounds;
    },
    domain: [0, 20]
  },
  { 
    key: 'tradeDelta', 
    label: 'Trade Kill Delta', 
    valueFunction: (player) => {
      const tradeKills = getRawStat(player, 'tradeKills');
      const tradeDeaths = getRawStat(player, 'tradeDeaths');
      return tradeKills - tradeDeaths;
    },
    domain: [-10, 10]
  },
  { 
    key: 'flashAssists', 
    label: 'Flash Assists', 
    valueFunction: (player) => getRawStat(player, 'assistedFlashes'),
    domain: [0, 50]
  },
  { 
    key: 'awpRatio', 
    label: 'AWP Kill %', 
    valueFunction: (player) => {
      const awpKills = getRawStat(player, 'awpKills');
      const kills = getRawStat(player, 'kills');
      return kills > 0 ? awpKills / kills : 0;
    },
    domain: [0, 1]
  },
  { 
    key: 'rcs', 
    label: 'RCS', 
    valueFunction: (player) => player.metrics?.rcs?.value || 0,
    domain: [0, 1]
  },
  { 
    key: 'icf', 
    label: 'ICF', 
    valueFunction: (player) => player.metrics?.icf?.value || 0,
    domain: [0, 1]
  },
  { 
    key: 'sc', 
    label: 'SC', 
    valueFunction: (player) => player.metrics?.sc?.value || 0,
    domain: [0, 1]
  }
];

export default function CorrelationAnalysis({ players }: CorrelationAnalysisProps) {
  const [xMetric, setXMetric] = useState<string>('kd');
  const [yMetric, setYMetric] = useState<string>('piv');
  const [zMetric, setZMetric] = useState<string>('adr');
  const [showTrendline, setShowTrendline] = useState(true);
  const [zoomLevel, setZoomLevel] = useState(1);
  
  // Helper to get selected metric object
  const getMetric = (key: string): MetricOption => {
    return metricOptions.find(m => m.key === key) || metricOptions[0];
  };
  
  // Prepare scatter chart data
  const scatterData = players.map((player) => {
    const xValue = getMetric(xMetric).valueFunction(player);
    const yValue = getMetric(yMetric).valueFunction(player);
    const zValue = getMetric(zMetric).valueFunction(player);
    
    return {
      player: player.name,
      team: player.team,
      role: player.role,
      x: xValue,
      y: yValue,
      z: zValue,
      piv: player.piv
    };
  });
  
  // Calculate correlation coefficient
  const calculateCorrelation = () => {
    if (players.length <= 1) return 0;
    
    const xMetricFunc = getMetric(xMetric).valueFunction;
    const yMetricFunc = getMetric(yMetric).valueFunction;
    
    const xValues = players.map(p => xMetricFunc(p));
    const yValues = players.map(p => yMetricFunc(p));
    
    const xMean = xValues.reduce((sum, val) => sum + val, 0) / xValues.length;
    const yMean = yValues.reduce((sum, val) => sum + val, 0) / yValues.length;
    
    let numerator = 0;
    let xDenominator = 0;
    let yDenominator = 0;
    
    for (let i = 0; i < players.length; i++) {
      const xDiff = xValues[i] - xMean;
      const yDiff = yValues[i] - yMean;
      
      numerator += xDiff * yDiff;
      xDenominator += xDiff * xDiff;
      yDenominator += yDiff * yDiff;
    }
    
    const denominator = Math.sqrt(xDenominator * yDenominator);
    return denominator === 0 ? 0 : numerator / denominator;
  };
  
  // Calculate linear regression (simple y = mx + b)
  const calculateRegressionLine = () => {
    if (players.length <= 1) return { m: 0, b: 0 };
    
    const xMetricFunc = getMetric(xMetric).valueFunction;
    const yMetricFunc = getMetric(yMetric).valueFunction;
    
    const xValues = players.map(p => xMetricFunc(p));
    const yValues = players.map(p => yMetricFunc(p));
    
    const xMean = xValues.reduce((sum, val) => sum + val, 0) / xValues.length;
    const yMean = yValues.reduce((sum, val) => sum + val, 0) / yValues.length;
    
    let numerator = 0;
    let denominator = 0;
    
    for (let i = 0; i < players.length; i++) {
      const xDiff = xValues[i] - xMean;
      numerator += xDiff * (yValues[i] - yMean);
      denominator += xDiff * xDiff;
    }
    
    const m = denominator === 0 ? 0 : numerator / denominator;
    const b = yMean - m * xMean;
    
    return { m, b };
  };
  
  // Generate regression line points
  const generateRegressionPoints = () => {
    if (!showTrendline) return [];
    
    const { m, b } = calculateRegressionLine();
    const xDomain = getMetric(xMetric).domain || [0, 2];
    
    return [
      { x: xDomain[0], y: m * xDomain[0] + b },
      { x: xDomain[1], y: m * xDomain[1] + b }
    ];
  };
  
  // Correlation coefficient
  const correlation = calculateCorrelation();
  const correlationStrength = Math.abs(correlation);
  
  let correlationDescription = '';
  if (correlationStrength > 0.7) {
    correlationDescription = 'Strong';
  } else if (correlationStrength > 0.4) {
    correlationDescription = 'Moderate';
  } else if (correlationStrength > 0.2) {
    correlationDescription = 'Weak';
  } else {
    correlationDescription = 'Very Weak/None';
  }
  
  // Get domain with adjustment for zoom
  const getAdjustedDomain = (metric: MetricOption): [number, number] => {
    const domain = metric.domain || [0, 1];
    const mid = (domain[0] + domain[1]) / 2;
    const range = (domain[1] - domain[0]) / zoomLevel;
    
    return [
      Math.max(0, mid - range / 2),
      mid + range / 2
    ];
  };
  
  return (
    <div className="space-y-4">
      {/* Controls */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div>
          <label className="text-sm font-medium mb-1 block">X-Axis Metric</label>
          <Select 
            value={xMetric} 
            onValueChange={setXMetric}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select X metric" />
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
          <label className="text-sm font-medium mb-1 block">Y-Axis Metric</label>
          <Select 
            value={yMetric} 
            onValueChange={setYMetric}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select Y metric" />
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
          <label className="text-sm font-medium mb-1 block">Bubble Size (Z)</label>
          <Select 
            value={zMetric} 
            onValueChange={setZMetric}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select Z metric" />
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
        
        <div className="flex items-end gap-2">
          <div className="flex items-center space-x-2">
            <Switch
              id="trendline"
              checked={showTrendline}
              onCheckedChange={setShowTrendline}
            />
            <UILabel htmlFor="trendline" className="text-sm">Show Trendline</UILabel>
          </div>
          
          <div className="flex gap-1">
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => setZoomLevel(Math.max(1, zoomLevel - 0.5))}
              disabled={zoomLevel <= 1}
            >
              <ZoomOut className="h-4 w-4" />
            </Button>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => setZoomLevel(Math.min(4, zoomLevel + 0.5))}
              disabled={zoomLevel >= 4}
            >
              <ZoomIn className="h-4 w-4" />
            </Button>
            <Button variant="outline" size="sm">
              <Download className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>
      
      {/* Correlation Info Card */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-2">
        <Card className="p-4">
          <div className="flex flex-col">
            <span className="text-sm text-muted-foreground">Correlation Coefficient</span>
            <span className="text-2xl font-bold">{correlation.toFixed(2)}</span>
            <CardDescription>
              Between {getMetric(xMetric).label} and {getMetric(yMetric).label}
            </CardDescription>
          </div>
        </Card>
        
        <Card className="p-4">
          <div className="flex flex-col">
            <span className="text-sm text-muted-foreground">Correlation Strength</span>
            <span className="text-2xl font-bold">{correlationDescription}</span>
            <CardDescription>
              {correlation < 0 ? 'Negative' : 'Positive'} relationship
            </CardDescription>
          </div>
        </Card>
        
        <Card className="p-4">
          <div className="flex flex-col">
            <span className="text-sm text-muted-foreground">Sample Size</span>
            <span className="text-2xl font-bold">{players.length}</span>
            <CardDescription>
              Total players in analysis
            </CardDescription>
          </div>
        </Card>
      </div>
      
      {/* Scatter Plot */}
      <div className="w-full bg-card rounded-md border p-4">
        <ResponsiveContainer width="100%" height={500}>
          <ScatterChart
            margin={{ top: 20, right: 30, bottom: 40, left: 40 }}
          >
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis 
              type="number" 
              dataKey="x" 
              name={getMetric(xMetric).label} 
              domain={getAdjustedDomain(getMetric(xMetric))}
            >
              <Label value={getMetric(xMetric).label} position="bottom" offset={15} />
            </XAxis>
            <YAxis 
              type="number" 
              dataKey="y" 
              name={getMetric(yMetric).label} 
              domain={getAdjustedDomain(getMetric(yMetric))}
            >
              <Label value={getMetric(yMetric).label} angle={-90} position="left" offset={5} />
            </YAxis>
            <ZAxis 
              type="number" 
              dataKey="z" 
              range={[40, 240]} 
              name={getMetric(zMetric).label} 
            />
            <Tooltip 
              cursor={{ strokeDasharray: '3 3' }}
              formatter={(value, name, props) => {
                if (name === 'x') return [value, getMetric(xMetric).label];
                if (name === 'y') return [value, getMetric(yMetric).label];
                if (name === 'z') return [value, getMetric(zMetric).label];
                return [value, name];
              }}
              content={({ active, payload }) => {
                if (active && payload && payload.length) {
                  const data = payload[0].payload;
                  return (
                    <div className="p-3 bg-background border rounded-md shadow-md">
                      <p className="font-bold">{data.player}</p>
                      <p className="text-sm text-muted-foreground">{data.team} - {data.role}</p>
                      <div className="mt-2 grid grid-cols-2 gap-x-4 gap-y-1">
                        <span className="text-sm">{getMetric(xMetric).label}:</span>
                        <span className="text-sm font-medium">{data.x.toFixed(2)}</span>
                        
                        <span className="text-sm">{getMetric(yMetric).label}:</span>
                        <span className="text-sm font-medium">{data.y.toFixed(2)}</span>
                        
                        <span className="text-sm">{getMetric(zMetric).label}:</span>
                        <span className="text-sm font-medium">{data.z.toFixed(2)}</span>
                        
                        <span className="text-sm">PIV:</span>
                        <span className="text-sm font-medium">{data.piv.toFixed(2)}</span>
                      </div>
                    </div>
                  );
                }
                return null;
              }}
            />
            <Legend />
            
            {/* Player data points */}
            <Scatter 
              name="Players" 
              data={scatterData} 
              fill="#317039" 
              fillOpacity={0.8}
            />
            
            {/* Regression line */}
            {showTrendline && (
              <Scatter 
                name="Trend Line" 
                data={generateRegressionPoints()} 
                line={{ stroke: '#FF4500', strokeWidth: 2 }} 
                shape={() => null}
              />
            )}
          </ScatterChart>
        </ResponsiveContainer>
      </div>
      
      <div className="text-center text-muted-foreground text-sm p-4">
        <p>
          Bubble size represents {getMetric(zMetric).label} value. 
          {showTrendline && ' Trend line shows the linear relationship between variables.'}
        </p>
      </div>
    </div>
  );
}
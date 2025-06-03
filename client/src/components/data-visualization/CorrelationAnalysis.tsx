import { useState, useMemo } from 'react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { PlayerWithPIV } from '@shared/types';
import { 
  ScatterChart, 
  Scatter, 
  XAxis, 
  YAxis, 
  ZAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  Legend
} from 'recharts';

interface CorrelationAnalysisProps {
  players: PlayerWithPIV[];
}

// Stat categories available for correlation analysis
const CORRELATION_METRICS = {
  offensive: [
    { key: 'kills', label: 'Kills' },
    { key: 'headshots', label: 'Headshots' },
    { key: 'kd', label: 'K/D Ratio' },
    { key: 'firstKills', label: 'First Kills' },
    { key: 'tFirstKills', label: 'T Side First Kills' },
    { key: 'ctFirstKills', label: 'CT Side First Kills' },
    { key: 'throughSmoke', label: 'Through Smoke Kills' },
    { key: 'blindKills', label: 'Blind Kills' },
    { key: 'wallbangKills', label: 'Wallbang Kills' },
  ],
  defensive: [
    { key: 'deaths', label: 'Deaths' },
    { key: 'firstDeaths', label: 'First Deaths' },
    { key: 'tFirstDeaths', label: 'T Side First Deaths' },
    { key: 'ctFirstDeaths', label: 'CT Side First Deaths' },
    { key: 'victimBlindKills', label: 'Died While Blinded' },
  ],
  utility: [
    { key: 'flashesThrown', label: 'Flashes Thrown' },
    { key: 'smokesThrown', label: 'Smokes Thrown' },
    { key: 'heThrown', label: 'HE Grenades Thrown' },
    { key: 'infernosThrown', label: 'Molotovs Thrown' },
    { key: 'assistedFlashes', label: 'Flash Assists' },
    { key: 'totalUtilityThrown', label: 'Total Utility Thrown' },
  ],
  performance: [
    { key: 'piv', label: 'PIV (Overall)' },
    { key: 'ctPIV', label: 'CT Side PIV' },
    { key: 'tPIV', label: 'T Side PIV' },
    { key: 'metrics.rcs.value', label: 'RCS', accessor: (player: PlayerWithPIV) => player.metrics.rcs.value },
    { key: 'metrics.icf.value', label: 'ICF', accessor: (player: PlayerWithPIV) => player.metrics.icf.value },
    { key: 'metrics.sc.value', label: 'SC', accessor: (player: PlayerWithPIV) => player.metrics.sc.value },
  ],
};

// Define player roles for color mapping
const ROLE_COLORS = {
  IGL: '#8884d8',
  AWP: '#82ca9d',
  Spacetaker: '#ffc658',
  Lurker: '#ff8042',
  Support: '#0088fe',
  Anchor: '#00C49F',
  Rotator: '#FFBB28',
};

export default function CorrelationAnalysis({ players }: CorrelationAnalysisProps) {
  const [xMetric, setXMetric] = useState<string>('kills');
  const [yMetric, setYMetric] = useState<string>('piv');
  const [sizeMetric, setSizeMetric] = useState<string | null>('metrics.rcs.value');
  const [colorBy, setColorBy] = useState<'role' | 'team'>('role');
  const [metricCategory, setMetricCategory] = useState<string>('offensive');
  
  // Get available metrics based on selected category
  const availableMetrics = useMemo(() => {
    switch (metricCategory) {
      case 'offensive':
        return CORRELATION_METRICS.offensive;
      case 'defensive':
        return CORRELATION_METRICS.defensive;
      case 'utility':
        return CORRELATION_METRICS.utility;
      case 'performance':
        return CORRELATION_METRICS.performance;
      default:
        return [...CORRELATION_METRICS.offensive, ...CORRELATION_METRICS.performance];
    }
  }, [metricCategory]);
  
  // Helper function to get value from player based on metric key
  const getPlayerValue = (player: PlayerWithPIV, metricKey: string): number => {
    // Check if the metric has a custom accessor
    const metric = Object.values(CORRELATION_METRICS)
      .flat()
      .find(m => m.key === metricKey);
      
    if (metric && metric.accessor) {
      return metric.accessor(player);
    }
    
    // Handle nested properties like 'metrics.rcs.value'
    if (metricKey.includes('.')) {
      let value: any = player;
      metricKey.split('.').forEach(key => {
        if (value) value = value[key as keyof typeof value];
      });
      return typeof value === 'number' ? value : 0;
    }
    
    // Check for properties in player.rawStats
    if (metricKey in player.rawStats) {
      return player.rawStats[metricKey as keyof typeof player.rawStats] as number || 0;
    }
    
    // Check for direct properties on player
    return player[metricKey as keyof typeof player] as number || 0;
  };
  
  // Prepare data for scatter chart
  const scatterData = useMemo(() => {
    if (!players.length) return [];
    
    return players.map(player => ({
      name: player.name,
      team: player.team,
      role: player.role,
      x: getPlayerValue(player, xMetric),
      y: getPlayerValue(player, yMetric),
      z: sizeMetric ? getPlayerValue(player, sizeMetric) * 100 : 100, // Scale for better visibility
      color: colorBy === 'role' 
        ? ROLE_COLORS[player.role as keyof typeof ROLE_COLORS] || '#999'
        : stringToColor(player.team),
    }));
  }, [players, xMetric, yMetric, sizeMetric, colorBy]);
  
  // Calculate correlation coefficient
  const correlationData = useMemo(() => {
    if (players.length < 3) return { r: 0, equation: 'N/A', r2: 0 };
    
    const xValues = players.map(p => getPlayerValue(p, xMetric));
    const yValues = players.map(p => getPlayerValue(p, yMetric));
    
    // Calculate mean of x and y
    const xMean = xValues.reduce((sum, val) => sum + val, 0) / xValues.length;
    const yMean = yValues.reduce((sum, val) => sum + val, 0) / yValues.length;
    
    // Calculate correlation coefficient
    let numerator = 0;
    let denominatorX = 0;
    let denominatorY = 0;
    
    for (let i = 0; i < xValues.length; i++) {
      const xDiff = xValues[i] - xMean;
      const yDiff = yValues[i] - yMean;
      
      numerator += xDiff * yDiff;
      denominatorX += xDiff * xDiff;
      denominatorY += yDiff * yDiff;
    }
    
    const r = numerator / (Math.sqrt(denominatorX) * Math.sqrt(denominatorY));
    const r2 = r * r;
    
    // Calculate regression line (y = mx + b)
    const m = numerator / denominatorX;
    const b = yMean - m * xMean;
    
    // Format the equation
    const equation = `y = ${m.toFixed(3)}x ${b >= 0 ? '+ ' + b.toFixed(3) : '- ' + Math.abs(b).toFixed(3)}`;
    
    return { r, r2, equation };
  }, [players, xMetric, yMetric]);
  
  // Correlation strength text
  const correlationStrength = useMemo(() => {
    const absR = Math.abs(correlationData.r);
    if (absR < 0.2) return 'Very weak';
    if (absR < 0.4) return 'Weak';
    if (absR < 0.6) return 'Moderate';
    if (absR < 0.8) return 'Strong';
    return 'Very strong';
  }, [correlationData.r]);
  
  // Correlation direction
  const correlationDirection = useMemo(() => {
    if (correlationData.r > 0) return 'positive';
    if (correlationData.r < 0) return 'negative';
    return 'neutral';
  }, [correlationData.r]);
  
  // Custom tooltip for scatter points
  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <Card className="bg-background border shadow-md p-0">
          <CardContent className="p-2">
            <p className="font-semibold">{data.name}</p>
            <p className="text-sm text-muted-foreground">{data.team} - {data.role}</p>
            <div className="text-xs mt-2">
              <p><span className="font-medium">{getMetricLabel(xMetric)}:</span> {data.x.toFixed(2)}</p>
              <p><span className="font-medium">{getMetricLabel(yMetric)}:</span> {data.y.toFixed(2)}</p>
              {sizeMetric && (
                <p><span className="font-medium">{getMetricLabel(sizeMetric)}:</span> {(data.z / 100).toFixed(2)}</p>
              )}
            </div>
          </CardContent>
        </Card>
      );
    }
    return null;
  };
  
  // Helper function to get a metric label from its key
  const getMetricLabel = (key: string): string => {
    const metric = Object.values(CORRELATION_METRICS)
      .flat()
      .find(m => m.key === key);
    return metric?.label || key;
  };
  
  // Convert string (team name) to a stable color
  function stringToColor(str: string): string {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      hash = str.charCodeAt(i) + ((hash << 5) - hash);
    }
    let color = '#';
    for (let i = 0; i < 3; i++) {
      const value = (hash >> (i * 8)) & 0xFF;
      color += ('00' + value.toString(16)).substr(-2);
    }
    return color;
  }
  
  // Custom shape for scatter points that isn't null
  const renderShape = (props: any) => {
    const { cx, cy, fill, r } = props;
    return (
      <circle 
        cx={cx} 
        cy={cy} 
        r={r} 
        fill={fill} 
        opacity={0.8}
        stroke="#fff"
        strokeWidth={1}
      />
    );
  };
  
  return (
    <div className="space-y-4">
      <div className="flex flex-col lg:flex-row gap-4">
        <Card className="lg:w-1/3">
          <CardContent className="pt-6">
            <h3 className="text-base font-semibold mb-4">Correlation Controls</h3>
            
            <Tabs value={metricCategory} onValueChange={setMetricCategory} className="w-full">
              <TabsList className="grid grid-cols-4 w-full">
                <TabsTrigger value="offensive">Offense</TabsTrigger>
                <TabsTrigger value="defensive">Defense</TabsTrigger>
                <TabsTrigger value="utility">Utility</TabsTrigger>
                <TabsTrigger value="performance">Performance</TabsTrigger>
              </TabsList>
            </Tabs>
            
            <div className="space-y-4 mt-4">
              <div>
                <label className="text-sm font-medium mb-1 block">X-Axis Metric</label>
                <Select value={xMetric} onValueChange={setXMetric}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select X-axis metric" />
                  </SelectTrigger>
                  <SelectContent>
                    {availableMetrics.map(metric => (
                      <SelectItem key={metric.key} value={metric.key}>
                        {metric.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <label className="text-sm font-medium mb-1 block">Y-Axis Metric</label>
                <Select value={yMetric} onValueChange={setYMetric}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select Y-axis metric" />
                  </SelectTrigger>
                  <SelectContent>
                    {availableMetrics.map(metric => (
                      <SelectItem key={metric.key} value={metric.key}>
                        {metric.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <label className="text-sm font-medium mb-1 block">Point Size Metric (Optional)</label>
                <Select 
                  value={sizeMetric || 'none'} 
                  onValueChange={(val) => setSizeMetric(val === 'none' ? null : val)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select point size metric" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">None (Fixed Size)</SelectItem>
                    {availableMetrics.map(metric => (
                      <SelectItem key={metric.key} value={metric.key}>
                        {metric.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <label className="text-sm font-medium mb-1 block">Color Points By</label>
                <Select value={colorBy} onValueChange={(val) => setColorBy(val as 'role' | 'team')}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select color scheme" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="role">Player Role</SelectItem>
                    <SelectItem value="team">Team</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card className="lg:w-2/3">
          <CardContent className="pt-6">
            <div className="flex justify-between items-start mb-4">
              <div>
                <h3 className="text-base font-semibold">
                  {getMetricLabel(xMetric)} vs {getMetricLabel(yMetric)}
                </h3>
                <p className="text-sm text-muted-foreground">
                  {players.length} players analyzed
                </p>
              </div>
              
              <div className="text-right">
                <div className="font-medium">Correlation: {correlationData.r.toFixed(3)}</div>
                <div className={`text-sm ${
                  correlationDirection === 'positive' 
                    ? 'text-green-500' 
                    : correlationDirection === 'negative' 
                      ? 'text-red-500' 
                      : 'text-yellow-500'
                }`}>
                  {correlationStrength} {correlationDirection} correlation
                </div>
                <div className="text-xs text-muted-foreground">
                  R² = {correlationData.r2.toFixed(3)} • {correlationData.equation}
                </div>
              </div>
            </div>
            
            <div className="h-[350px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <ScatterChart
                  margin={{ top: 20, right: 20, bottom: 10, left: 10 }}
                >
                  <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
                  <XAxis 
                    type="number" 
                    dataKey="x" 
                    name={getMetricLabel(xMetric)}
                    label={{ 
                      value: getMetricLabel(xMetric), 
                      position: 'bottom',
                      style: { textAnchor: 'middle' }
                    }}
                  />
                  <YAxis 
                    type="number" 
                    dataKey="y" 
                    name={getMetricLabel(yMetric)}
                    label={{ 
                      value: getMetricLabel(yMetric), 
                      angle: -90, 
                      position: 'left',
                      style: { textAnchor: 'middle' }
                    }}
                  />
                  {sizeMetric && (
                    <ZAxis 
                      type="number" 
                      dataKey="z" 
                      range={[50, 600]} 
                      name={getMetricLabel(sizeMetric)} 
                    />
                  )}
                  <Tooltip content={<CustomTooltip />} />
                  <Legend />
                  <Scatter 
                    name={colorBy === 'role' ? 'Player by Role' : 'Player by Team'} 
                    data={scatterData} 
                    fill="#8884d8"
                    shape={renderShape}
                  />
                </ScatterChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
import { ResponsiveContainer, ScatterChart, Scatter, XAxis, YAxis, CartesianGrid, Tooltip, Cell, LineChart, Line } from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useState } from 'react';
import { PlayerWithPIV } from '../../../shared/schema';

interface MetricCorrelationChartProps {
  players: PlayerWithPIV[];
}

type MetricKey = 'piv' | 'kd' | 'kills' | 'assists' | 'deaths' | 'headshots' | 'firstKills';

const METRICS = {
  piv: { label: 'PIV Score', accessor: (p: PlayerWithPIV) => p.piv },
  kd: { label: 'K/D Ratio', accessor: (p: PlayerWithPIV) => p.kd },
  kills: { label: 'Total Kills', accessor: (p: PlayerWithPIV) => p.rawStats.kills },
  assists: { label: 'Total Assists', accessor: (p: PlayerWithPIV) => p.rawStats.assists },
  deaths: { label: 'Total Deaths', accessor: (p: PlayerWithPIV) => p.rawStats.deaths },
  headshots: { label: 'Headshots', accessor: (p: PlayerWithPIV) => p.rawStats.headshots },
  firstKills: { label: 'First Kills', accessor: (p: PlayerWithPIV) => p.rawStats.firstKills }
};

export default function MetricCorrelationChart({ players }: MetricCorrelationChartProps) {
  const [xMetric, setXMetric] = useState<MetricKey>('kd');
  const [yMetric, setYMetric] = useState<MetricKey>('piv');

  const chartData = players.map((player, index) => ({
    name: player.name,
    team: player.team,
    role: player.role,
    x: METRICS[xMetric].accessor(player),
    y: METRICS[yMetric].accessor(player),
    index
  }));

  // Calculate correlation coefficient
  const calculateCorrelation = () => {
    const n = chartData.length;
    const sumX = chartData.reduce((sum, d) => sum + d.x, 0);
    const sumY = chartData.reduce((sum, d) => sum + d.y, 0);
    const sumXY = chartData.reduce((sum, d) => sum + d.x * d.y, 0);
    const sumX2 = chartData.reduce((sum, d) => sum + d.x * d.x, 0);
    const sumY2 = chartData.reduce((sum, d) => sum + d.y * d.y, 0);

    const correlation = (n * sumXY - sumX * sumY) / 
      Math.sqrt((n * sumX2 - sumX * sumX) * (n * sumY2 - sumY * sumY));
    
    return isNaN(correlation) ? 0 : correlation;
  };

  const correlation = calculateCorrelation();

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-background border border-border rounded-lg p-3 shadow-lg">
          <p className="font-semibold">{data.name}</p>
          <p className="text-sm text-muted-foreground">{data.team}</p>
          <p className="text-sm">Role: {data.role}</p>
          <p className="text-sm">{METRICS[xMetric].label}: {data.x.toFixed(2)}</p>
          <p className="text-sm">{METRICS[yMetric].label}: {data.y.toFixed(2)}</p>
        </div>
      );
    }
    return null;
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Metric Correlation Analysis</CardTitle>
        <div className="flex gap-4 mt-4">
          <div className="flex-1">
            <label className="text-sm font-medium">X-Axis Metric</label>
            <Select value={xMetric} onValueChange={(value: MetricKey) => setXMetric(value)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(METRICS).map(([key, metric]) => (
                  <SelectItem key={key} value={key}>{metric.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="flex-1">
            <label className="text-sm font-medium">Y-Axis Metric</label>
            <Select value={yMetric} onValueChange={(value: MetricKey) => setYMetric(value)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(METRICS).map(([key, metric]) => (
                  <SelectItem key={key} value={key}>{metric.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
        <div className="mt-2">
          <span className="text-sm text-muted-foreground">
            Correlation Coefficient: {correlation.toFixed(3)} 
            {Math.abs(correlation) > 0.7 ? ' (Strong)' : 
             Math.abs(correlation) > 0.3 ? ' (Moderate)' : ' (Weak)'}
          </span>
        </div>
      </CardHeader>
      <CardContent>
        <div className="h-96">
          <ResponsiveContainer width="100%" height="100%">
            <ScatterChart
              data={chartData}
              margin={{ top: 20, right: 20, bottom: 20, left: 20 }}
            >
              <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
              <XAxis 
                dataKey="x" 
                name={METRICS[xMetric].label}
                label={{ value: METRICS[xMetric].label, position: 'bottom' }}
              />
              <YAxis 
                dataKey="y" 
                name={METRICS[yMetric].label}
                label={{ value: METRICS[yMetric].label, angle: -90, position: 'insideLeft' }}
              />
              <Tooltip content={<CustomTooltip />} />
              <Scatter dataKey="y" fill="#8884d8" />
            </ScatterChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}
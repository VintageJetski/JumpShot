import { ResponsiveContainer, ComposedChart, Bar, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { PlayerWithPIV } from '../../../shared/schema';

interface PerformanceHeatmapProps {
  players: PlayerWithPIV[];
  metric: 'piv' | 'kd' | 'kills' | 'assists';
}

export default function PerformanceHeatmap({ players, metric }: PerformanceHeatmapProps) {
  // Sort players by the selected metric and prepare data
  const sortedPlayers = [...players]
    .sort((a, b) => {
      const aValue = metric === 'piv' ? a.piv : 
                    metric === 'kd' ? a.kd :
                    metric === 'kills' ? a.rawStats.kills :
                    a.rawStats.assists;
      const bValue = metric === 'piv' ? b.piv : 
                    metric === 'kd' ? b.kd :
                    metric === 'kills' ? b.rawStats.kills :
                    b.rawStats.assists;
      return bValue - aValue;
    })
    .slice(0, 15); // Top 15 players

  const chartData = sortedPlayers.map((player, index) => ({
    name: player.name.length > 12 ? player.name.substring(0, 12) + '...' : player.name,
    fullName: player.name,
    team: player.team,
    value: metric === 'piv' ? player.piv : 
           metric === 'kd' ? player.kd :
           metric === 'kills' ? player.rawStats.kills :
           player.rawStats.assists,
    piv: player.piv,
    kd: player.kd,
    rank: index + 1
  }));

  const getMetricLabel = () => {
    switch (metric) {
      case 'piv': return 'PIV Score';
      case 'kd': return 'K/D Ratio';
      case 'kills': return 'Total Kills';
      case 'assists': return 'Total Assists';
      default: return 'Performance';
    }
  };

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-background border border-border rounded-lg p-3 shadow-lg">
          <p className="font-semibold">{data.fullName}</p>
          <p className="text-sm text-muted-foreground">{data.team}</p>
          <p className="text-sm">Rank: #{data.rank}</p>
          <p className="text-sm">{getMetricLabel()}: {data.value.toFixed(2)}</p>
          <p className="text-sm">PIV: {data.piv.toFixed(2)}</p>
          <p className="text-sm">K/D: {data.kd.toFixed(2)}</p>
        </div>
      );
    }
    return null;
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Top 15 Players - {getMetricLabel()}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-96">
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart
              data={chartData}
              margin={{ top: 20, right: 30, left: 20, bottom: 60 }}
            >
              <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
              <XAxis 
                dataKey="name" 
                angle={-45}
                textAnchor="end"
                height={80}
                interval={0}
              />
              <YAxis />
              <Tooltip content={<CustomTooltip />} />
              <Legend />
              <Bar 
                dataKey="value" 
                fill="#8884d8" 
                name={getMetricLabel()}
                radius={[4, 4, 0, 0]}
              />
              <Line 
                type="monotone" 
                dataKey="piv" 
                stroke="#ff7300" 
                strokeWidth={2}
                name="PIV Trend"
                dot={{ r: 4 }}
              />
            </ComposedChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}
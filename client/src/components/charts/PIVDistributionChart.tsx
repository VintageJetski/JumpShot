import { ResponsiveContainer, ScatterChart, Scatter, XAxis, YAxis, CartesianGrid, Tooltip, Cell } from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { PlayerWithPIV } from '../../../shared/schema';

interface PIVDistributionChartProps {
  players: PlayerWithPIV[];
}

const ROLE_COLORS = {
  'AWPer': '#ff6b6b',
  'Entry Fragger': '#4ecdc4',
  'Support': '#45b7d1',
  'Lurker': '#96ceb4',
  'IGL': '#ffeaa7',
  'Default': '#ddd'
};

export default function PIVDistributionChart({ players }: PIVDistributionChartProps) {
  // Prepare data for scatter plot
  const chartData = players.map((player, index) => ({
    name: player.name,
    piv: player.piv,
    kd: player.kd,
    role: player.role,
    team: player.team,
    index
  }));

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-background border border-border rounded-lg p-3 shadow-lg">
          <p className="font-semibold">{data.name}</p>
          <p className="text-sm text-muted-foreground">{data.team}</p>
          <p className="text-sm">Role: {data.role}</p>
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
        <CardTitle>PIV vs K/D Distribution</CardTitle>
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
                dataKey="kd" 
                name="K/D Ratio"
                label={{ value: 'K/D Ratio', position: 'bottom' }}
              />
              <YAxis 
                dataKey="piv" 
                name="PIV"
                label={{ value: 'PIV', angle: -90, position: 'insideLeft' }}
              />
              <Tooltip content={<CustomTooltip />} />
              <Scatter dataKey="piv" fill="#8884d8">
                {chartData.map((entry, index) => (
                  <Cell 
                    key={`cell-${index}`} 
                    fill={ROLE_COLORS[entry.role as keyof typeof ROLE_COLORS] || ROLE_COLORS.Default}
                  />
                ))}
              </Scatter>
            </ScatterChart>
          </ResponsiveContainer>
        </div>
        
        {/* Legend */}
        <div className="mt-4 flex flex-wrap gap-4 justify-center">
          {Object.entries(ROLE_COLORS).filter(([role]) => role !== 'Default').map(([role, color]) => (
            <div key={role} className="flex items-center gap-2">
              <div 
                className="w-3 h-3 rounded-full" 
                style={{ backgroundColor: color }}
              />
              <span className="text-sm">{role}</span>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
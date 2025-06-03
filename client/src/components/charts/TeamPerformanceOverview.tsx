import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { TeamWithTIR } from '@shared/schema';

interface TeamPerformanceOverviewProps {
  teams: TeamWithTIR[];
}

export default function TeamPerformanceOverview({ teams }: TeamPerformanceOverviewProps) {
  // Prepare data for team performance comparison
  const chartData = teams
    .sort((a, b) => b.tir - a.tir)
    .slice(0, 10)
    .map(team => ({
      name: team.name.length > 15 ? team.name.substring(0, 15) + '...' : team.name,
      fullName: team.name,
      tir: parseFloat(team.tir.toFixed(2)),
      avgPIV: parseFloat(team.avgPIV.toFixed(2)),
      synergy: parseFloat(team.synergy.toFixed(2)),
      topPlayerPIV: parseFloat(team.topPlayer.piv.toFixed(2))
    }));

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-background border border-border rounded-lg p-3 shadow-lg">
          <p className="font-semibold">{data.fullName}</p>
          <p className="text-sm">TIR: {data.tir}</p>
          <p className="text-sm">Avg PIV: {data.avgPIV}</p>
          <p className="text-sm">Synergy: {data.synergy}</p>
          <p className="text-sm">Top Player PIV: {data.topPlayerPIV}</p>
        </div>
      );
    }
    return null;
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Top 10 Teams Performance Overview</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-96">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
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
              <Bar dataKey="tir" fill="#8884d8" name="TIR" radius={[2, 2, 0, 0]} />
              <Bar dataKey="avgPIV" fill="#82ca9d" name="Avg PIV" radius={[2, 2, 0, 0]} />
              <Bar dataKey="synergy" fill="#ffc658" name="Synergy" radius={[2, 2, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}
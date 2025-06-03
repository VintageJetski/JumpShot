import { ResponsiveContainer, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar, Legend } from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { TeamWithTIR } from '../../../shared/schema';

interface TeamSynergyChartProps {
  teams: TeamWithTIR[];
}

export default function TeamSynergyChart({ teams }: TeamSynergyChartProps) {
  // Prepare radar data with normalized metrics
  const chartData = [
    { metric: 'TIR', ...teams.reduce((acc, team, i) => ({ ...acc, [team.name]: team.tir }), {}) },
    { metric: 'Avg PIV', ...teams.reduce((acc, team, i) => ({ ...acc, [team.name]: team.avgPIV }), {}) },
    { metric: 'Synergy', ...teams.reduce((acc, team, i) => ({ ...acc, [team.name]: team.synergy }), {}) },
    { metric: 'Sum PIV', ...teams.reduce((acc, team, i) => ({ ...acc, [team.name]: team.sumPIV / 10 }), {}) }, // Normalize
    { metric: 'Top Player PIV', ...teams.reduce((acc, team, i) => ({ ...acc, [team.name]: team.topPlayer.piv }), {}) }
  ];

  const colors = ['#8884d8', '#82ca9d', '#ffc658', '#ff8042', '#0088fe'];

  return (
    <Card>
      <CardHeader>
        <CardTitle>Team Performance Radar</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-96">
          <ResponsiveContainer width="100%" height="100%">
            <RadarChart data={chartData}>
              <PolarGrid />
              <PolarAngleAxis dataKey="metric" />
              <PolarRadiusAxis angle={90} domain={[0, 'dataMax']} />
              {teams.slice(0, 5).map((team, index) => (
                <Radar
                  key={team.name}
                  name={team.name}
                  dataKey={team.name}
                  stroke={colors[index]}
                  fill={colors[index]}
                  fillOpacity={0.1}
                  strokeWidth={2}
                />
              ))}
              <Legend />
            </RadarChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}
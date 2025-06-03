import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts';
import { PlayerWithPIV, PlayerRole } from '@shared/schema';

interface RoleDistributionChartProps {
  players: PlayerWithPIV[];
}

const ROLE_COLORS = {
  [PlayerRole.IGL]: '#a78bfa',     // purple-400
  [PlayerRole.AWPer]: '#fbbf24',   // amber-400
  [PlayerRole.Spacetaker]: '#fb923c', // orange-400
  [PlayerRole.Lurker]: '#60a5fa',  // blue-400
  [PlayerRole.Anchor]: '#2dd4bf',  // teal-400
  [PlayerRole.Support]: '#22d3ee', // cyan-400
};

export default function RoleDistributionChart({ players }: RoleDistributionChartProps) {
  // Count roles
  const roleCounts = players.reduce((acc, player) => {
    const role = player.role;
    acc[role] = (acc[role] || 0) + 1;
    
    // Also count secondary roles with less weight
    if (player.secondaryRole) {
      acc[player.secondaryRole] = (acc[player.secondaryRole] || 0) + 0.5;
    }
    
    return acc;
  }, {} as Record<string, number>);
  
  // Convert to chart data
  const chartData = Object.entries(roleCounts)
    .map(([role, count]) => ({
      name: role,
      value: count,
    }));
  
  return (
    <div className="flex flex-col h-full">
      <h3 className="text-lg font-medium mb-2">Role Distribution</h3>
      <div className="flex-1 w-full">
        <ResponsiveContainer width="100%" height={300}>
          <PieChart>
            <Pie
              data={chartData}
              cx="50%"
              cy="50%"
              innerRadius={60}
              outerRadius={80}
              fill="#8884d8"
              paddingAngle={3}
              dataKey="value"
              label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
            >
              {chartData.map((entry, index) => (
                <Cell 
                  key={`cell-${index}`} 
                  fill={ROLE_COLORS[entry.name as PlayerRole] || '#888888'} 
                />
              ))}
            </Pie>
            <Tooltip 
              formatter={(value) => [`${value} players`, 'Count']}
              contentStyle={{ 
                backgroundColor: '#1f2937', 
                borderColor: '#374151',
                borderRadius: '0.5rem',
              }}
            />
            <Legend />
          </PieChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
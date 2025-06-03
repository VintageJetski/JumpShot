import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { PlayerWithPIV, PlayerRole } from '../../../shared/schema';

interface TeamPIVBarChartProps {
  players: PlayerWithPIV[];
  showRoles?: boolean;
}

const ROLE_COLORS = {
  [PlayerRole.IGL]: '#a78bfa',     // purple-400
  [PlayerRole.AWPer]: '#fbbf24',   // amber-400
  [PlayerRole.Spacetaker]: '#fb923c', // orange-400
  [PlayerRole.Lurker]: '#60a5fa',  // blue-400
  [PlayerRole.Anchor]: '#2dd4bf',  // teal-400
  [PlayerRole.Support]: '#22d3ee', // cyan-400
};

export default function TeamPIVBarChart({ players, showRoles = true }: TeamPIVBarChartProps) {
  // Sort players by PIV (highest first)
  const sortedPlayers = [...players].sort((a, b) => b.piv - a.piv);
  
  // Prepare data for the chart - if showRoles is true, create a separate bar for each role
  const chartData = sortedPlayers.map(player => {
    if (showRoles) {
      // Create a data object where only the player's role has a value
      const roleData: Record<string, any> = {
        name: player.name,
        kd: player.kd,
      };
      
      // Add a property for each role, but only set the value for the player's role
      Object.values(PlayerRole).forEach(role => {
        roleData[role] = player.role === role ? player.piv : 0;
      });
      
      return roleData;
    } else {
      // Simple data object with just PIV
      return {
        name: player.name,
        piv: player.piv,
        kd: player.kd,
      };
    }
  });
  
  return (
    <div className="flex flex-col h-full">
      <h3 className="text-lg font-medium mb-2">Player Impact Value Comparison</h3>
      <div className="flex-1 w-full">
        <ResponsiveContainer width="100%" height={400}>
          <BarChart
            data={chartData}
            margin={{
              top: 20,
              right: 30,
              left: 20,
              bottom: 60,
            }}
          >
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#374151" />
            <XAxis 
              dataKey="name" 
              tick={{ fill: '#9ca3af' }}
              angle={-45}
              textAnchor="end"
              height={60}
            />
            <YAxis 
              tick={{ fill: '#9ca3af' }}
              label={{ 
                value: 'Player Impact Value (PIV)', 
                angle: -90, 
                position: 'insideLeft',
                style: { fill: '#9ca3af' } 
              }}
            />
            <Tooltip 
              contentStyle={{ 
                backgroundColor: '#1f2937', 
                borderColor: '#374151',
                borderRadius: '0.5rem',
              }}
              formatter={(value, name) => {
                if (name === 'kd' || typeof value !== 'number' || value === 0) return [value, name];
                return [value.toFixed(2), name];
              }}
              labelFormatter={(label) => `Player: ${label}`}
            />
            <Legend verticalAlign="top" />
            
            {showRoles ? (
              // Render a separate bar for each role
              Object.entries(ROLE_COLORS).map(([role, color]) => (
                <Bar 
                  key={role}
                  dataKey={role} 
                  name={role}
                  fill={color}
                  radius={[4, 4, 0, 0]}
                  stackId="a"
                />
              ))
            ) : (
              // Render a single bar for PIV
              <Bar 
                dataKey="piv" 
                name="PIV"
                fill="#3b82f6"
                radius={[4, 4, 0, 0]}
              />
            )}
            
            <Bar dataKey="kd" name="K/D" fill="#f59e0b" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
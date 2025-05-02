import { BarChart, Bar, XAxis, YAxis, CartesianGrid, ResponsiveContainer, Tooltip, Legend, Cell } from 'recharts';
import { PlayerWithPIV } from '@shared/schema';

interface PlayerStatsRadarChartProps {
  player: PlayerWithPIV;
  teamAverages?: Record<string, number>;
}

export default function PlayerStatsRadarChart({ player, teamAverages }: PlayerStatsRadarChartProps) {
  // Extract normalized metrics with safety checks
  const metrics = player?.metrics?.rcs?.metrics || {};
  
  // Check if metrics object exists and has content
  if (!metrics || Object.keys(metrics).length === 0) {
    return (
      <div className="flex flex-col h-full">
        <h3 className="text-lg font-medium mb-2">Performance Metrics</h3>
        <div className="bg-gray-800 rounded-lg p-4 text-center h-64 flex items-center justify-center">
          <span className="text-gray-400">No metrics data available for this player</span>
        </div>
      </div>
    );
  }
  
  // Convert to radar chart format
  const chartData = Object.entries(metrics)
    .filter(([_, value]) => typeof value === 'number' && !isNaN(value) && value !== null && value !== undefined)
    .map(([key, value]) => {
      // Format the key for better display
      const formattedKey = key
        .replace(/([A-Z])/g, ' $1')
        .replace(/^./, (str) => str.toUpperCase())
        .replace(/ Index/g, '')
        .replace(/ Rate/g, '')
        .replace(/ Ratio/g, '');
      
      // Add team average if available with safety check
      const teamValue = teamAverages && typeof teamAverages[key] === 'number' ? teamAverages[key] : 0;
      
      return {
        metric: formattedKey,
        player: typeof value === 'number' ? value : 0,
        team: teamValue,
      };
    })
    .sort((a, b) => b.player - a.player) // Sort by player value (highest first)
    .slice(0, 6); // Take top 6 metrics for better readability in bar chart
  
  if (chartData.length === 0) {
    return <div className="text-gray-400 text-center py-8">No metrics data available</div>;
  }
  
  // Get role color
  const getRoleColor = (index: number) => {
    const colors = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#a855f7', '#ec4899'];
    return colors[index % colors.length];
  };

  return (
    <div className="flex flex-col h-full">
      <h3 className="text-lg font-medium mb-2">Performance Metrics</h3>
      <div className="flex-1 w-full">
        <ResponsiveContainer width="100%" height={400}>
          <BarChart
            data={chartData}
            layout="vertical"
            margin={{ top: 5, right: 30, left: 100, bottom: 5 }}
          >
            <CartesianGrid strokeDasharray="3 3" stroke="#374151" horizontal={false} />
            <XAxis 
              type="number" 
              domain={[0, 1]} 
              tick={{ fill: '#9ca3af' }}
              tickCount={6}
            />
            <YAxis 
              type="category" 
              dataKey="metric" 
              tick={{ fill: '#9ca3af', fontSize: 12 }}
              width={100}
            />
            <Tooltip
              contentStyle={{ 
                backgroundColor: '#1f2937', 
                borderColor: '#374151',
                borderRadius: '0.5rem',
              }}
              formatter={(value) => [typeof value === 'number' ? value.toFixed(2) : value, 'Score']}
            />
            <Legend />
            <Bar 
              name={player.name} 
              dataKey="player" 
              maxBarSize={20}
              radius={[0, 4, 4, 0]}
            >
              {chartData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={getRoleColor(index)} />
              ))}
            </Bar>
            {teamAverages && (
              <Bar 
                name="Team Average" 
                dataKey="team" 
                maxBarSize={20} 
                fill="#f97316"
                fillOpacity={0.7}
                radius={[0, 4, 4, 0]}
              />
            )}
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
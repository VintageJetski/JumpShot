import { RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar, ResponsiveContainer, Tooltip, Legend } from 'recharts';
import { PlayerWithPIV } from '@shared/schema';

interface PlayerStatsRadarChartProps {
  player: PlayerWithPIV;
  teamAverages?: Record<string, number>;
}

export default function PlayerStatsRadarChart({ player, teamAverages }: PlayerStatsRadarChartProps) {
  // Extract normalized metrics
  const metrics = player.metrics?.rcs?.metrics || {};
  
  // Convert to radar chart format
  const chartData = Object.entries(metrics)
    .filter(([_, value]) => typeof value === 'number' && !isNaN(value))
    .map(([key, value]) => {
      // Format the key for better display
      const formattedKey = key
        .replace(/([A-Z])/g, ' $1')
        .replace(/^./, (str) => str.toUpperCase())
        .replace(/ Index/g, '')
        .replace(/ Rate/g, '')
        .replace(/ Ratio/g, '');
      
      // Add team average if available
      const teamValue = teamAverages?.[key] || 0;
      
      return {
        metric: formattedKey,
        player: value,
        team: teamValue,
      };
    })
    .sort((a, b) => b.player - a.player) // Sort by player value (highest first)
    .slice(0, 8); // Take top 8 metrics for readability
  
  if (chartData.length === 0) {
    return <div className="text-gray-400 text-center py-8">No metrics data available</div>;
  }
  
  return (
    <div className="flex flex-col h-full">
      <h3 className="text-lg font-medium mb-2">Performance Metrics</h3>
      <div className="flex-1 w-full">
        <ResponsiveContainer width="100%" height={400}>
          <RadarChart outerRadius={150} data={chartData}>
            <PolarGrid stroke="#374151" />
            <PolarAngleAxis 
              dataKey="metric" 
              tick={{ fill: '#9ca3af', fontSize: 12 }} 
            />
            <PolarRadiusAxis 
              angle={30} 
              domain={[0, 1]} 
              tickCount={6} 
              stroke="#4b5563" 
            />
            <Radar
              name={player.name}
              dataKey="player"
              stroke="#3b82f6"
              fill="#3b82f6"
              fillOpacity={0.6}
            />
            {teamAverages && (
              <Radar
                name="Team Average"
                dataKey="team"
                stroke="#f97316"
                fill="#f97316"
                fillOpacity={0.3}
              />
            )}
            <Tooltip 
              contentStyle={{ 
                backgroundColor: '#1f2937', 
                borderColor: '#374151',
                borderRadius: '0.5rem',
              }}
              formatter={(value) => [typeof value === 'number' ? value.toFixed(2) : value, 'Score']}
            />
            <Legend />
          </RadarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
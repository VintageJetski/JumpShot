import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { PlayerWithPIV } from '../../../../shared/schema';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, TrendingUp } from 'lucide-react';

interface TopPlayersByPIVIncreaseProps {
  limit?: number;
}

const TopPlayersByPIVIncrease: React.FC<TopPlayersByPIVIncreaseProps> = ({ limit = 10 }) => {
  const { data: players = [], isLoading } = useQuery<PlayerWithPIV[]>({
    queryKey: ['/api/players'],
  });

  if (isLoading) {
    return (
      <div className="flex justify-center items-center p-6">
        <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
      </div>
    );
  }

  // In a real app, we'd have historical data to calculate PIV increase
  // For this mockup, we'll simulate increases using a deterministic calculation based on player ID and PIV
  const playersWithIncrease = players.map(player => {
    // Create a stable value based on player.id that gives a number between 0-1
    const idSum = player.id.split('').reduce((sum, char) => sum + char.charCodeAt(0), 0);
    const stableRandom = (idSum % 100) / 100; // Between 0-1
    
    // Calculate increase based on PIV and the stable value (0.1-0.5 range)
    const pivIncrease = parseFloat(((player.piv * 0.2 * stableRandom) + 0.1).toFixed(2));
    
    return {
      ...player,
      pivIncrease,
    };
  });

  // Sort by PIV increase (descending)
  const sortedPlayers = [...playersWithIncrease]
    .sort((a, b) => b.pivIncrease - a.pivIncrease)
    .slice(0, limit);

  return (
    <Card className="w-full h-full bg-card/60 backdrop-blur-sm overflow-hidden">
      <CardHeader className="pb-2 space-y-1">
        <CardTitle className="text-md flex items-center gap-2">
          <TrendingUp className="h-4 w-4 text-blue-500 flex-shrink-0" />
          <span className="truncate">Top Players by PIV Increase</span>
        </CardTitle>
        <CardDescription className="text-xs">
          Top {limit} players with the highest PIV increase
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-1">
          {sortedPlayers.map((player, index) => (
            <div 
              key={player.id} 
              className="flex justify-between items-center py-2 border-b border-border/40 last:border-0"
            >
              <div className="flex items-center gap-3">
                <div className="w-6 h-6 rounded-full bg-blue-500/20 flex items-center justify-center text-blue-500 text-xs font-medium flex-shrink-0">
                  {index + 1}
                </div>
                <div className="max-w-[60%]">
                  <div className="font-medium truncate">{player.name}</div>
                  <div className="text-xs text-muted-foreground truncate">{player.team}</div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <div className="text-right">
                  <div className="font-medium whitespace-nowrap">{player.piv.toFixed(2)}</div>
                  <div className="text-xs text-green-500 flex items-center whitespace-nowrap">
                    <TrendingUp className="h-3 w-3 mr-1 flex-shrink-0" />
                    +{player.pivIncrease}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};

export default TopPlayersByPIVIncrease;
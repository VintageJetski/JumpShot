import React from 'react';
import { PlayerWithPIV } from '@shared/schema';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, User, Activity, Crosshair, Bomb, Shield } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';

interface DetailedPlayerInfoProps {
  playerId?: string;
}

const DetailedPlayerInfo: React.FC<DetailedPlayerInfoProps> = ({ playerId }) => {
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

  const player = playerId ? players.find(p => p.id === playerId) : null;

  if (!player) {
    return (
      <Card className="w-full h-full flex items-center justify-center">
        <CardContent className="text-center p-6">
          <User className="h-12 w-12 text-blue-500/30 mx-auto mb-4" />
          <p className="text-muted-foreground">Select a player to view detailed information</p>
        </CardContent>
      </Card>
    );
  }

  // Determine which icon to use based on the player's role
  const getRoleIcon = (role: string) => {
    switch (role.toUpperCase()) {
      case 'AWP':
        return <Crosshair className="h-5 w-5 text-amber-500" />;
      case 'IGL':
        return <Bomb className="h-5 w-5 text-red-500" />;
      case 'SUPPORT':
        return <Shield className="h-5 w-5 text-blue-500" />;
      default:
        return <Activity className="h-5 w-5 text-green-500" />;
    }
  };

  return (
    <Card className="w-full h-full bg-card/60 backdrop-blur-sm">
      <CardHeader className="pb-2 flex flex-row items-center justify-between">
        <CardTitle className="text-lg">{player.name}</CardTitle>
        <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/10 text-blue-500 text-sm">
          {getRoleIcon(player.role)}
          <span>{player.role}</span>
        </div>
      </CardHeader>
      <CardContent>
        <div className="mb-4">
          <div className="flex items-center justify-between mb-1">
            <span className="text-sm text-muted-foreground">Team</span>
            <span className="font-medium">{player.team}</span>
          </div>
          <div className="flex items-center justify-between mb-1">
            <span className="text-sm text-muted-foreground">PIV Rating</span>
            <span className="font-medium text-blue-500">{player.piv.toFixed(2)}</span>
          </div>
          <div className="flex items-center justify-between mb-1">
            <span className="text-sm text-muted-foreground">K/D Ratio</span>
            <span className="font-medium">{player.kd.toFixed(2)}</span>
          </div>
        </div>
        
        <div className="space-y-4">
          <div>
            <h4 className="text-sm font-medium mb-2">Role Breakdown</h4>
            <div className="grid grid-cols-2 gap-2">
              <div className="bg-card/50 rounded-md p-2">
                <div className="text-xs text-muted-foreground">T Side</div>
                <div className="flex items-center gap-1.5 mt-1">
                  {getRoleIcon(player.tRole)}
                  <span className="font-medium">{player.tRole}</span>
                </div>
                <div className="text-sm mt-1">{player.tPIV.toFixed(2)} PIV</div>
              </div>
              <div className="bg-card/50 rounded-md p-2">
                <div className="text-xs text-muted-foreground">CT Side</div>
                <div className="flex items-center gap-1.5 mt-1">
                  {getRoleIcon(player.ctRole)}
                  <span className="font-medium">{player.ctRole}</span>
                </div>
                <div className="text-sm mt-1">{player.ctPIV.toFixed(2)} PIV</div>
              </div>
            </div>
          </div>
          
          <div>
            <h4 className="text-sm font-medium mb-2">Key Metrics</h4>
            <div className="space-y-2">
              {player.metrics?.topMetrics?.[player.role]?.map((metric, index) => (
                <div key={index} className="flex justify-between items-center">
                  <span className="text-xs text-muted-foreground">{metric.metricName}</span>
                  <span className="text-sm font-medium">
                    {typeof metric.value === 'number' && !isNaN(metric.value) 
                      ? metric.value.toFixed(2)
                      : metric.value}
                  </span>
                </div>
              ))}
            </div>
          </div>
          
          {player.isIGL && (
            <div className="bg-amber-500/10 border border-amber-500/20 rounded-md p-2">
              <div className="flex items-center gap-2">
                <Bomb className="h-4 w-4 text-amber-500" />
                <span className="text-sm font-medium text-amber-500">In-Game Leader</span>
              </div>
              <p className="text-xs mt-1">This player is the team's strategist and shot-caller.</p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default DetailedPlayerInfo;
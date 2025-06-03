import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { PlayerWithPIV } from '../../../../shared/schema';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, Users, Award, Shield, Crosshair, Activity, Bomb } from 'lucide-react';

interface TopPlayersByRoleProps {
  role?: string;
  limit?: number;
}

const TopPlayersByRole: React.FC<TopPlayersByRoleProps> = ({ role = 'AWP', limit = 10 }) => {
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

  // Filter players by selected role and sort by PIV
  const filteredPlayers = role ? 
    players.filter(player => 
      player.role === role || 
      player.tRole === role || 
      player.ctRole === role
    ) : players;
  
  const sortedPlayers = [...filteredPlayers]
    .sort((a, b) => b.piv - a.piv)
    .slice(0, limit);

  // Get role icon
  const getRoleIcon = (roleType: string) => {
    switch (roleType.toUpperCase()) {
      case 'AWP':
        return <Crosshair className="h-5 w-5" />;
      case 'IGL':
        return <Bomb className="h-5 w-5" />;
      case 'SUPPORT':
        return <Shield className="h-5 w-5" />;
      case 'LURKER':
        return <Activity className="h-5 w-5" />;
      case 'SPACETAKER':
        return <Award className="h-5 w-5" />;
      default:
        return <Users className="h-5 w-5" />;
    }
  };

  // Get role color
  const getRoleColor = (roleType: string) => {
    switch (roleType.toUpperCase()) {
      case 'AWP':
        return 'text-amber-500';
      case 'IGL':
        return 'text-red-500';
      case 'SUPPORT':
        return 'text-blue-500';
      case 'LURKER':
        return 'text-purple-500';
      case 'SPACETAKER':
        return 'text-green-500';
      default:
        return 'text-blue-500';
    }
  };

  return (
    <Card className="w-full h-full bg-card/60 backdrop-blur-sm overflow-hidden">
      <CardHeader className="pb-2 space-y-1">
        <CardTitle className="text-md flex items-center gap-2">
          <span className={getRoleColor(role)}>{getRoleIcon(role)}</span>
          <span className="truncate">Top {role} Players</span>
        </CardTitle>
        <CardDescription className="text-xs">
          Top {limit} players in the {role} role by PIV rating
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-1">
          {sortedPlayers.length > 0 ? (
            sortedPlayers.map((player, index) => (
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
                <div className="flex flex-col items-end gap-0.5">
                  <div className="font-medium whitespace-nowrap">{player.piv.toFixed(2)}</div>
                  <div className="text-xs text-muted-foreground whitespace-nowrap">K/D: {player.kd.toFixed(2)}</div>
                </div>
              </div>
            ))
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              No players found for this role
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default TopPlayersByRole;
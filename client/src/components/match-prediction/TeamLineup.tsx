import React from 'react';
import { 
  Card, 
  CardContent
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useQuery } from "@tanstack/react-query";
import { Skeleton } from "@/components/ui/skeleton";
import { PlayerRole } from '@shared/types';

// Define the interface based on the server API response
interface PlayerWithPIV {
  id: string;
  name: string;
  team: string;
  role: PlayerRole;
  ctRole: PlayerRole;
  tRole: PlayerRole;
  isIGL: boolean;
  piv: number;
  kd: number;
  ctPIV?: number;
  tPIV?: number;
  primaryMetric?: {
    name: string;
    value: number;
  };
  metrics: any;
  rawStats: any;
}

interface TeamLineupProps {
  teamName?: string;
  className?: string;
}

const roleColors: Record<string, string> = {
  "IGL": "bg-purple-500/10 text-purple-500 border-purple-500/30",
  "AWP": "bg-red-500/10 text-red-500 border-red-500/30",
  "Spacetaker": "bg-orange-500/10 text-orange-500 border-orange-500/30",
  "Lurker": "bg-blue-500/10 text-blue-500 border-blue-500/30",
  "Support": "bg-green-500/10 text-green-500 border-green-500/30",
  "Anchor": "bg-blue-500/10 text-blue-500 border-blue-500/30", 
  "Rotator": "bg-cyan-500/10 text-cyan-500 border-cyan-500/30",
};

// Get initials for team badge
const getTeamInitials = (teamName: string): string => {
  return teamName
    .split(' ')
    .map(word => word[0])
    .join('')
    .toUpperCase();
};

export const TeamLineup: React.FC<TeamLineupProps> = ({
  teamName,
  className
}) => {
  // Fetch all players
  const { data: playersData = [], isLoading } = useQuery<PlayerWithPIV[]>({
    queryKey: ['/api/players'],
    staleTime: 10 * 60 * 1000, // 10 minutes
  });
  
  // Calculate team stats
  const getTeamStats = () => {
    if (!teamName || !playersData.length) return { avgPIV: 0, synergy: 0 };
    
    const teamPlayers = playersData.filter((player) => player.team === teamName);
    if (!teamPlayers.length) return { avgPIV: 0, synergy: 0 };
    
    const totalPIV = teamPlayers.reduce((sum, player) => sum + player.piv, 0);
    const avgPIV = Math.round(totalPIV / teamPlayers.length * 100) / 100;
    
    // Synergy is randomly between 75-85 for demo purposes
    const synergy = Math.floor(Math.random() * 10) + 75;
    
    return { avgPIV, synergy };
  };
  
  const { avgPIV, synergy } = getTeamStats();

  if (!teamName) {
    return (
      <div className={className}>
        <p className="text-muted-foreground text-sm">Select a team to view lineup</p>
      </div>
    );
  }

  // Filter players by team
  const teamPlayers = playersData.filter((player) => player.team === teamName);

  // Sort players: IGLs first, then by role
  const sortedPlayers = [...teamPlayers].sort((a, b) => {
    if (a.isIGL && !b.isIGL) return -1;
    if (!a.isIGL && b.isIGL) return 1;
    
    // AWPers second
    if (a.role === 'AWP' && b.role !== 'AWP') return -1;
    if (a.role !== 'AWP' && b.role === 'AWP') return 1;
    
    // Then sort by PIV (higher first)
    return b.piv - a.piv;
  });

  return (
    <div className={className}>
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-3">
          <div className="bg-primary/20 text-primary font-bold rounded-md h-8 w-8 flex items-center justify-center">
            {getTeamInitials(teamName)}
          </div>
          <h3 className="text-xl font-bold">{teamName}</h3>
        </div>
        <Badge className="bg-primary/20 text-primary font-semibold px-3 py-1 text-sm rounded-md">
          TIR: {Math.round(avgPIV * 10)}
        </Badge>
      </div>
      
      <div className="grid grid-cols-3 gap-4 mb-4">
        <div className="text-center">
          <div className="text-sm text-muted-foreground">Avg PIV</div>
          <div className="font-semibold">{Math.round(avgPIV * 100)}</div>
        </div>
        <div className="text-center">
          <div className="text-sm text-muted-foreground">Synergy</div>
          <div className="font-semibold">{synergy}%</div>
        </div>
        <div className="text-center">
          <div className="text-sm text-muted-foreground">Key Roles</div>
          <div className="font-semibold text-xs flex items-center justify-center space-x-1">
            <span className="text-purple-500">IGL</span>
            <span>+</span>
            <span className="text-red-500">AWP</span>
          </div>
        </div>
      </div>
      
      <div className="text-sm font-medium mb-2">Team Lineup</div>
      
      {isLoading ? (
        <div className="space-y-2">
          {[1, 2, 3, 4, 5].map((i) => (
            <Skeleton key={i} className="h-10 w-full" />
          ))}
        </div>
      ) : (
        <div className="space-y-1">
          {sortedPlayers.length > 0 ? (
            sortedPlayers.map((player: PlayerWithPIV) => (
              <div 
                key={player.id} 
                className="flex items-center justify-between p-2 bg-card/50 rounded-md"
              >
                <div className="flex items-center space-x-2">
                  <div className={`h-6 w-6 flex items-center justify-center rounded-md text-xs font-medium 
                    ${player.team === teamName ? 'bg-primary/20 text-primary' : 'bg-gray-500/20 text-gray-500'}`}>
                    {getTeamInitials(player.team)}
                  </div>
                  <div className="font-medium">{player.name}</div>
                  {player.isIGL && (
                    <Badge variant="outline" className="bg-purple-500/10 text-purple-500 border-purple-500/30 text-xs px-1">
                      IGL
                    </Badge>
                  )}
                </div>
                <div className="flex items-center space-x-3">
                  <div className="flex">
                    <Badge variant="outline" className="bg-blue-500/10 text-blue-500 border-blue-500/30 text-xs px-1 rounded-r-none">
                      CT:{player.ctRole}
                    </Badge>
                    <Badge variant="outline" className="bg-orange-500/10 text-orange-500 border-orange-500/30 text-xs px-1 rounded-l-none">
                      T:{player.tRole}
                    </Badge>
                  </div>
                  <div className="text-center w-9">
                    <div className="text-xs text-muted-foreground">K/D</div>
                    <div className="font-medium text-sm">{player.kd.toFixed(2)}</div>
                  </div>
                  <div className="text-center w-9">
                    <div className="text-xs text-muted-foreground">PIV</div>
                    <div className="font-medium text-sm">{Math.round(player.piv * 100)}</div>
                  </div>
                </div>
              </div>
            ))
          ) : (
            <p className="text-muted-foreground text-sm">No players found for this team</p>
          )}
        </div>
      )}
    </div>
  );
};

export default TeamLineup;
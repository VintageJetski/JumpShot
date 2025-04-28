import React from 'react';
import { 
  Card, 
  CardContent, 
  CardHeader, 
  CardTitle
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

export const TeamLineup: React.FC<TeamLineupProps> = ({
  teamName,
  className
}) => {
  // Fetch all players
  const { data: playersData = [], isLoading } = useQuery<PlayerWithPIV[]>({
    queryKey: ['/api/players'],
    staleTime: 10 * 60 * 1000, // 10 minutes
  });

  if (!teamName) {
    return (
      <Card className={className}>
        <CardHeader className="pb-3">
          <CardTitle className="text-xl font-bold">Team Lineup</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground text-sm">Select a team to view lineup</p>
        </CardContent>
      </Card>
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
    <Card className={className}>
      <CardHeader className="pb-3">
        <CardTitle className="text-xl font-bold">Team Lineup: {teamName}</CardTitle>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="space-y-2">
            {[1, 2, 3, 4, 5].map((i) => (
              <Skeleton key={i} className="h-12 w-full" />
            ))}
          </div>
        ) : (
          <div className="space-y-2">
            {sortedPlayers.length > 0 ? (
              sortedPlayers.map((player: PlayerWithPIV) => (
                <div 
                  key={player.id} 
                  className="flex items-center justify-between p-2 border rounded-md hover:bg-accent/50 transition-colors"
                >
                  <div className="flex flex-col">
                    <div className="font-medium">{player.name}</div>
                    <div className="text-xs text-muted-foreground">
                      K/D: {player.kd.toFixed(2)} | PIV: {Math.round(player.piv * 100)}
                    </div>
                  </div>
                  <div className="flex space-x-2">
                    {player.isIGL && (
                      <Badge variant="outline" className={roleColors.IGL}>
                        IGL
                      </Badge>
                    )}
                    <Badge variant="outline" className={roleColors[player.role] || "bg-gray-500/10"}>
                      {player.role}
                    </Badge>
                    <div className="flex flex-col items-end">
                      <Badge variant="outline" className="bg-blue-500/10 text-blue-500 border-blue-500/30 text-xs px-1">
                        CT: {player.ctRole}
                      </Badge>
                      <Badge variant="outline" className="bg-orange-500/10 text-orange-500 border-orange-500/30 text-xs px-1 mt-1">
                        T: {player.tRole}
                      </Badge>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-muted-foreground text-sm">No players found for this team</p>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default TeamLineup;
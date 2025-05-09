import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { TeamWithTIR, PlayerWithPIV } from '@shared/schema';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, Users, Trophy, Shield, Crosshair, Activity, Bomb, Star } from 'lucide-react';

interface DetailedTeamInfoProps {
  teamId?: string;
}

const DetailedTeamInfo: React.FC<DetailedTeamInfoProps> = ({ teamId }) => {
  const { data: teams = [], isLoading: isLoadingTeams } = useQuery<TeamWithTIR[]>({
    queryKey: ['/api/teams'],
  });
  
  const { data: players = [], isLoading: isLoadingPlayers } = useQuery<PlayerWithPIV[]>({
    queryKey: ['/api/players'],
  });

  const isLoading = isLoadingTeams || isLoadingPlayers;

  if (isLoading) {
    return (
      <div className="flex justify-center items-center p-6">
        <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
      </div>
    );
  }

  const team = teamId ? teams.find(t => t.name === teamId) : null;

  if (!team) {
    return (
      <Card className="w-full h-full flex items-center justify-center">
        <CardContent className="text-center p-6">
          <Users className="h-12 w-12 text-blue-500/30 mx-auto mb-4" />
          <p className="text-muted-foreground">Select a team to view detailed information</p>
        </CardContent>
      </Card>
    );
  }

  // Get team players
  const teamPlayers = players.filter(p => p.team === team.name)
    .sort((a, b) => b.piv - a.piv);

  // Get role icon
  const getRoleIcon = (roleType: string) => {
    switch (roleType.toUpperCase()) {
      case 'AWP':
        return <Crosshair className="h-4 w-4" />;
      case 'IGL':
        return <Bomb className="h-4 w-4" />;
      case 'SUPPORT':
        return <Shield className="h-4 w-4" />;
      case 'LURKER':
        return <Activity className="h-4 w-4" />;
      case 'SPACETAKER':
        return <Star className="h-4 w-4" />;
      default:
        return <Users className="h-4 w-4" />;
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
    <Card className="w-full h-full bg-card/60 backdrop-blur-sm">
      <CardHeader className="pb-2">
        <div className="flex justify-between items-center">
          <CardTitle className="text-lg">{team.name}</CardTitle>
          <div className="px-2 py-1 rounded-full bg-blue-500/10">
            <span className="text-sm text-blue-500 font-medium">{team.tir.toFixed(2)} TIR</span>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <h3 className="text-sm font-medium flex items-center gap-1.5 mb-2">
            <Trophy className="h-4 w-4 text-blue-500" />
            <span>Team Performance</span>
          </h3>
          
          <div className="grid grid-cols-2 gap-2 mb-3">
            <div className="bg-card/50 rounded-md p-2">
              <div className="text-xs text-muted-foreground">Team Synergy</div>
              <div className="text-lg font-medium mt-1">
                {(team.synergy * 100).toFixed(0)}%
              </div>
            </div>
            <div className="bg-card/50 rounded-md p-2">
              <div className="text-xs text-muted-foreground">Average PIV</div>
              <div className="text-lg font-medium mt-1">
                {(teamPlayers.reduce((sum, p) => sum + p.piv, 0) / teamPlayers.length).toFixed(2)}
              </div>
            </div>
          </div>
          
          <div className="grid grid-cols-2 gap-2">
            <div className="bg-card/50 rounded-md p-2">
              <div className="text-xs text-muted-foreground">T Side Rating</div>
              <div className="text-lg font-medium mt-1">
                {team.tSideRating?.toFixed(2) || "N/A"}
              </div>
            </div>
            <div className="bg-card/50 rounded-md p-2">
              <div className="text-xs text-muted-foreground">CT Side Rating</div>
              <div className="text-lg font-medium mt-1">
                {team.ctSideRating?.toFixed(2) || "N/A"}
              </div>
            </div>
          </div>
        </div>
        
        <div>
          <h3 className="text-sm font-medium flex items-center gap-1.5 mb-2">
            <Users className="h-4 w-4 text-blue-500" />
            <span>Team Roster</span>
          </h3>
          
          <div className="space-y-2">
            {teamPlayers.map((player) => (
              <div 
                key={player.id} 
                className="flex justify-between items-center p-2 rounded-md border border-border/40 bg-card/20"
              >
                <div className="flex items-center gap-2">
                  <div className="text-sm font-medium">{player.name}</div>
                  {player.isIGL && (
                    <div className="px-1.5 py-0.5 rounded-full bg-amber-500/10 text-amber-500 text-xs">
                      IGL
                    </div>
                  )}
                </div>
                
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-1">
                    <span className={getRoleColor(player.role)}>
                      {getRoleIcon(player.role)}
                    </span>
                    <span className="text-xs">{player.role}</span>
                  </div>
                  
                  <div className="text-sm font-medium text-blue-500">
                    {player.piv.toFixed(2)}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
        
        {team.strengths && team.strengths.length > 0 && (
          <div>
            <h3 className="text-sm font-medium flex items-center gap-1.5 mb-2">
              <Star className="h-4 w-4 text-blue-500" />
              <span>Team Strengths</span>
            </h3>
            
            <div className="flex flex-wrap gap-1.5">
              {team.strengths.map((strength, index) => (
                <div 
                  key={index} 
                  className="px-2 py-1 rounded-full bg-green-500/10 text-green-500 text-xs"
                >
                  {strength}
                </div>
              ))}
            </div>
          </div>
        )}
        
        {team.weaknesses && team.weaknesses.length > 0 && (
          <div>
            <h3 className="text-sm font-medium flex items-center gap-1.5 mb-2">
              <Shield className="h-4 w-4 text-blue-500" />
              <span>Areas for Improvement</span>
            </h3>
            
            <div className="flex flex-wrap gap-1.5">
              {team.weaknesses.map((weakness, index) => (
                <div 
                  key={index} 
                  className="px-2 py-1 rounded-full bg-red-500/10 text-red-500 text-xs"
                >
                  {weakness}
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default DetailedTeamInfo;
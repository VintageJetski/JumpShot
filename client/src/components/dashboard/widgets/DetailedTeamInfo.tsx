import React, { useEffect, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { TeamWithTIR, PlayerWithPIV } from '../../../../shared/schema';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Loader2, Users, Trophy, Shield, Crosshair, Activity, Bomb, Star, HelpCircle } from 'lucide-react';
import { TeamCombobox } from '../ui/team-combobox';

interface DetailedTeamInfoProps {
  teamId?: string;
}

const DetailedTeamInfo: React.FC<DetailedTeamInfoProps> = ({ teamId }) => {
  // Add logging for props
  console.log('DetailedTeamInfo rendered with teamId:', teamId);
  
  // Add state for internal team selection
  const [selectedTeamId, setSelectedTeamId] = useState<string | null>(teamId || null);
  
  // Update internal state when prop changes
  useEffect(() => {
    console.log('teamId prop changed to:', teamId);
    setSelectedTeamId(teamId || null);
  }, [teamId]);
  
  const { data: teams = [], isLoading: isLoadingTeams } = useQuery<TeamWithTIR[]>({
    queryKey: ['/api/teams'],
  });
  
  const { data: players = [], isLoading: isLoadingPlayers } = useQuery<PlayerWithPIV[]>({
    queryKey: ['/api/players'],
  });

  const isLoading = isLoadingTeams || isLoadingPlayers;

  // Log teams when they're loaded
  useEffect(() => {
    if (teams.length > 0) {
      console.log('Teams loaded:', teams.map(t => ({ id: t.id, name: t.name })));
    }
  }, [teams]);

  if (isLoading) {
    return (
      <div className="flex justify-center items-center p-6">
        <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
      </div>
    );
  }

  // Try to find team by ID first, then by name
  const team = selectedTeamId 
    ? teams.find(t => t.id === selectedTeamId || t.name === selectedTeamId) 
    : null;
  
  console.log('Found team:', team);

  // Render internal team selector
  if (!team) {
    return (
      <Card className="w-full h-full flex flex-col items-center justify-center p-6">
        <Users className="h-12 w-12 text-blue-500/30 mx-auto mb-4" />
        <p className="text-muted-foreground mb-6">Select a team to view detailed information</p>
        
        <div className="w-full max-w-xs">
          <TeamCombobox
            teams={teams}
            selectedTeamId={null}
            onSelect={(value) => {
              console.log("Team selected directly in widget:", value);
              setSelectedTeamId(value);
            }}
            placeholder="Search for a team..."
          />
        </div>
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
    <Card className="w-full h-full bg-card/60 backdrop-blur-sm overflow-hidden">
      <CardHeader className="pb-2">
        <div className="flex justify-between items-center">
          <CardTitle className="text-md truncate max-w-[65%]">{team.name}</CardTitle>
          <div className="px-2 py-0.5 rounded-full bg-blue-500/10">
            <span className="text-xs text-blue-500 font-medium">{team.tir.toFixed(2)} TIR</span>
          </div>
        </div>
        
        {/* Add direct team selector inside the widget */}
        <div className="mt-2 w-full">
          <TeamCombobox
            teams={teams}
            selectedTeamId={selectedTeamId}
            onSelect={(value) => {
              console.log("Switching to team:", value);
              setSelectedTeamId(value);
            }}
            placeholder="Switch team..."
          />
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
              <div className="text-base font-medium mt-0.5">
                {(team.synergy * 100).toFixed(0)}%
              </div>
            </div>
            <div className="bg-card/50 rounded-md p-2">
              <div className="text-xs text-muted-foreground">Average PIV</div>
              <div className="text-base font-medium mt-0.5">
                {(teamPlayers.reduce((sum, p) => sum + p.piv, 0) / teamPlayers.length).toFixed(2)}
              </div>
            </div>
          </div>
          
          <div className="grid grid-cols-2 gap-2">
            <div className="bg-card/50 rounded-md p-2">
              <div className="text-xs text-muted-foreground">T Side Rating</div>
              <div className="text-base font-medium mt-0.5">
                {(team as any).tSideRating?.toFixed(2) || "N/A"}
              </div>
            </div>
            <div className="bg-card/50 rounded-md p-2">
              <div className="text-xs text-muted-foreground">CT Side Rating</div>
              <div className="text-base font-medium mt-0.5">
                {(team as any).ctSideRating?.toFixed(2) || "N/A"}
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
                <div className="flex items-center gap-2 max-w-[50%]">
                  <div className="text-sm font-medium truncate">{player.name}</div>
                  {player.isIGL && (
                    <div className="px-1.5 py-0.5 rounded-full bg-amber-500/10 text-amber-500 text-xs flex-shrink-0">
                      IGL
                    </div>
                  )}
                </div>
                
                <div className="flex items-center gap-2">
                  <div className="flex items-center gap-1">
                    <span className={getRoleColor(player.role)}>
                      {getRoleIcon(player.role)}
                    </span>
                    <span className="text-xs truncate max-w-[60px]">{player.role}</span>
                  </div>
                  
                  <div className="text-xs font-medium text-blue-500 whitespace-nowrap">
                    {player.piv.toFixed(2)}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
        
        {(team as any).strengths && (team as any).strengths.length > 0 && (
          <div>
            <h3 className="text-sm font-medium flex items-center gap-1.5 mb-2">
              <Star className="h-4 w-4 text-blue-500" />
              <span>Team Strengths</span>
            </h3>
            
            <div className="flex flex-wrap gap-1">
              {(team as any).strengths.map((strength: string, index: number) => (
                <div 
                  key={index} 
                  className="px-1.5 py-0.5 rounded-full bg-green-500/10 text-green-500 text-xs truncate max-w-[120px]"
                  title={strength}
                >
                  {strength}
                </div>
              ))}
            </div>
          </div>
        )}
        
        {(team as any).weaknesses && (team as any).weaknesses.length > 0 && (
          <div>
            <h3 className="text-sm font-medium flex items-center gap-1.5 mb-2">
              <Shield className="h-4 w-4 text-blue-500" />
              <span>Areas for Improvement</span>
            </h3>
            
            <div className="flex flex-wrap gap-1">
              {(team as any).weaknesses.map((weakness: string, index: number) => (
                <div 
                  key={index} 
                  className="px-1.5 py-0.5 rounded-full bg-red-500/10 text-red-500 text-xs truncate max-w-[120px]"
                  title={weakness}
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
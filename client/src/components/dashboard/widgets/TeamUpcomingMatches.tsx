import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { TeamWithTIR } from '@shared/schema';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, Calendar, Trophy, BarChart2 } from 'lucide-react';

interface TeamUpcomingMatchesProps {
  teamId?: string;
  limit?: number;
}

const TeamUpcomingMatches: React.FC<TeamUpcomingMatchesProps> = ({ teamId, limit = 5 }) => {
  const { data: teams = [], isLoading } = useQuery<TeamWithTIR[]>({
    queryKey: ['/api/teams'],
  });

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
          <Calendar className="h-12 w-12 text-blue-500/30 mx-auto mb-4" />
          <p className="text-muted-foreground">Select a team to view upcoming matches</p>
        </CardContent>
      </Card>
    );
  }

  // In a real app, we'd fetch actual upcoming matches
  // For this mockup, we'll generate simulated upcoming matches
  const generateUpcomingMatches = (team: TeamWithTIR, allTeams: TeamWithTIR[], count: number) => {
    const otherTeams = allTeams.filter(t => t.name !== team.name);
    const matches = [];
    
    for (let i = 0; i < count && i < otherTeams.length; i++) {
      const opponent = otherTeams[i];
      const matchDate = new Date();
      matchDate.setDate(matchDate.getDate() + (i + 1) * 2); // Every other day
      
      // Simple prediction based on TIR
      const teamTir = team.tir;
      const opponentTir = opponent.tir;
      const totalTir = teamTir + opponentTir;
      const winProbability = teamTir / totalTir;
      
      matches.push({
        id: `match-${i}`,
        date: matchDate,
        opponent,
        winProbability,
      });
    }
    
    return matches;
  };

  const upcomingMatches = generateUpcomingMatches(team, teams, limit);

  // Format date as "May 10"
  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  return (
    <Card className="w-full h-full bg-card/60 backdrop-blur-sm overflow-hidden">
      <CardHeader className="pb-2 space-y-1">
        <CardTitle className="text-md flex items-center gap-2">
          <Calendar className="h-4 w-4 text-blue-500 flex-shrink-0" />
          <span className="truncate">{team.name} - Upcoming Matches</span>
        </CardTitle>
        <CardDescription className="text-xs">
          Upcoming matches with prediction percentages
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {upcomingMatches.map(match => (
            <div 
              key={match.id} 
              className="flex flex-col space-y-1 p-3 rounded-md border border-border/40 bg-card/40"
            >
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-2 max-w-[60%]">
                  <span className="text-sm font-medium truncate">{match.opponent.name}</span>
                  <span className="text-xs text-muted-foreground whitespace-nowrap">({match.opponent.tir.toFixed(2)} TIR)</span>
                </div>
                <div className="text-xs text-muted-foreground whitespace-nowrap">
                  {formatDate(match.date)}
                </div>
              </div>
              
              <div className="flex justify-between items-center mt-2">
                <div className="text-xs text-muted-foreground flex items-center gap-1">
                  <Trophy className="h-3.5 w-3.5" />
                  <span>Prediction</span>
                </div>
                
                <div className="flex items-center gap-1.5">
                  <div className="w-32 h-2 bg-muted rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-blue-500" 
                      style={{ width: `${match.winProbability * 100}%` }}
                    ></div>
                  </div>
                  <span className={`text-xs font-medium ${match.winProbability > 0.5 ? 'text-green-500' : 'text-red-500'}`}>
                    {Math.round(match.winProbability * 100)}%
                  </span>
                </div>
              </div>
              
              <div className="flex justify-between items-center text-xs mt-1">
                <div className="flex items-center gap-1 text-muted-foreground max-w-[60%]">
                  <BarChart2 className="h-3.5 w-3.5 flex-shrink-0" />
                  <span className="truncate">Team vs team prediction</span>
                </div>
                <div className={`${match.winProbability > 0.5 ? 'text-green-500' : 'text-red-500'} whitespace-nowrap`}>
                  {match.winProbability > 0.5 ? 'Likely win' : 'Challenging'}
                </div>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};

export default TeamUpcomingMatches;
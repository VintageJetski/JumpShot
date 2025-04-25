import React from 'react';
import { 
  Card, 
  CardContent, 
  CardHeader, 
  CardTitle
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { TeamWithTIR } from '@shared/types';
import { SunIcon, MoonIcon } from 'lucide-react';

interface TeamSelectProps {
  teams: TeamWithTIR[];
  team1Id?: string;
  team2Id?: string;
  onTeam1Change: (teamId: string) => void;
  onTeam2Change: (teamId: string) => void;
  className?: string;
}

export const TeamSelect: React.FC<TeamSelectProps> = ({
  teams,
  team1Id,
  team2Id,
  onTeam1Change,
  onTeam2Change,
  className
}) => {
  const team1 = team1Id ? teams.find(t => t.name === team1Id) : undefined;
  const team2 = team2Id ? teams.find(t => t.name === team2Id) : undefined;

  // Calculate match comparison score - this is an approximation based on TIR difference
  let matchupComparison = 0;
  if (team1 && team2) {
    const team1Score = team1.tir * 10; // Scale to 1-100 range
    const team2Score = team2.tir * 10;
    const diff = Math.abs(team1Score - team2Score);
    
    // Create a rough comparison score
    if (diff < 1) matchupComparison = 5; // Very balanced
    else if (diff < 2) matchupComparison = 4; // Balanced
    else if (diff < 4) matchupComparison = 3; // Slightly unbalanced
    else if (diff < 7) matchupComparison = 2; // Unbalanced
    else matchupComparison = 1; // Very unbalanced
  }

  return (
    <Card className={className}>
      <CardHeader className="pb-3">
        <CardTitle className="text-xl font-bold">Team Selection</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium mb-1 block">Team 1</label>
              <Select
                value={team1Id}
                onValueChange={onTeam1Change}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select team 1" />
                </SelectTrigger>
                <SelectContent>
                  {teams.map((team) => (
                    <SelectItem key={team.id} value={team.name}>
                      {team.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {team1 && (
                <div className="mt-2">
                  <Badge variant="outline" className="bg-blue-500/10 text-blue-500 border-blue-500/30">
                    TIR: {Math.round(team1.tir * 10)}
                  </Badge>
                </div>
              )}
            </div>
            
            <div>
              <label className="text-sm font-medium mb-1 block">Team 2</label>
              <Select
                value={team2Id}
                onValueChange={onTeam2Change}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select team 2" />
                </SelectTrigger>
                <SelectContent>
                  {teams.map((team) => (
                    <SelectItem key={team.id} value={team.name}>
                      {team.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {team2 && (
                <div className="mt-2">
                  <Badge variant="outline" className="bg-yellow-500/10 text-yellow-500 border-yellow-500/30">
                    TIR: {Math.round(team2.tir * 10)}
                  </Badge>
                </div>
              )}
            </div>
          </div>
          
          {team1 && team2 && (
            <div className="pt-2 border-t">
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium">Matchup Balance:</span>
                <div className="flex">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <span key={i} className="mx-0.5">
                      {i < matchupComparison ? (
                        <SunIcon className="h-4 w-4 text-yellow-400" />
                      ) : (
                        <MoonIcon className="h-4 w-4 text-gray-400" />
                      )}
                    </span>
                  ))}
                </div>
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                {matchupComparison === 5 && "Perfect balance - Extremely close matchup expected"}
                {matchupComparison === 4 && "Well balanced - Close matchup expected"}
                {matchupComparison === 3 && "Slightly favored - Competitive but one team has an edge"}
                {matchupComparison === 2 && "Clear favorite - One team has significant advantage"}
                {matchupComparison === 1 && "Heavy favorite - One team heavily favored to win"}
              </p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default TeamSelect;
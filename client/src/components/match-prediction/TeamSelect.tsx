import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { TeamWithTIR } from '@shared/schema';
import { Users, Zap } from 'lucide-react';

interface TeamSelectProps {
  teams: TeamWithTIR[];
  selectedTeamId: string;
  onChange: (teamId: string) => void;
  position: 'left' | 'right';
  loading: boolean;
}

const TeamSelect: React.FC<TeamSelectProps> = ({
  teams,
  selectedTeamId,
  onChange,
  position,
  loading
}) => {
  const selectedTeam = teams.find(t => t.id === selectedTeamId);
  const teamColor = position === 'left' ? 'blue' : 'red';
  
  return (
    <div>
      <div className="flex items-center mb-2">
        <Users className={`h-4 w-4 mr-2 text-${teamColor}-400`} />
        <span className="text-sm font-medium">Select {position === 'left' ? 'First' : 'Second'} Team</span>
      </div>
      
      <Select 
        value={selectedTeamId} 
        onValueChange={onChange}
        disabled={loading}
      >
        <SelectTrigger className={`border-${teamColor}-500/30 bg-background-light`}>
          <SelectValue placeholder="Select a team" />
        </SelectTrigger>
        <SelectContent>
          {teams
            .sort((a, b) => b.tir - a.tir)
            .map(team => (
              <SelectItem key={team.id} value={team.id}>
                <div className="flex items-center">
                  <div className="w-6 h-6 rounded-full bg-gray-700 flex items-center justify-center text-sm font-bold mr-2">
                    {team.name.charAt(0)}
                  </div>
                  <span>{team.name}</span>
                  <span className="ml-2 text-xs text-gray-400">({Math.round(team.tir * 10)})</span>
                </div>
              </SelectItem>
            ))}
        </SelectContent>
      </Select>
      
      {selectedTeam && (
        <Card className={`mt-3 bg-gray-800 border-${teamColor}-500/30`}>
          <CardContent className="p-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <div className="w-10 h-10 rounded-full bg-gray-700 flex items-center justify-center text-lg font-bold text-primary mr-3">
                  {selectedTeam.name.charAt(0)}
                </div>
                <div>
                  <h3 className="font-medium">{selectedTeam.name}</h3>
                  <div className="text-sm text-gray-400">{selectedTeam.players.length} players</div>
                </div>
              </div>
              
              <div className={`flex items-center bg-${teamColor}-500/20 text-${teamColor}-400 rounded-full px-3 py-1`}>
                <Zap className="h-4 w-4 mr-1" />
                <span className="text-sm font-medium">{Math.round(selectedTeam.tir * 10)}</span>
              </div>
            </div>
            
            <div className="mt-3 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-400">Avg PIV:</span>
                <span>{Math.round(selectedTeam.avgPIV * 100)}</span>
              </div>
              <div className="flex justify-between mt-1">
                <span className="text-gray-400">Synergy:</span>
                <span>{selectedTeam.synergy.toFixed(2)}</span>
              </div>
              <div className="flex justify-between mt-1">
                <span className="text-gray-400">Top player:</span>
                <span>{selectedTeam.topPlayer.name}</span>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default TeamSelect;
import React from 'react';
import { Label } from '@/components/ui/label';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';
import { TeamWithTIR } from '@shared/schema';
import { Loader2 } from 'lucide-react';

interface TeamSelectProps {
  label: string;
  teams: TeamWithTIR[];
  selectedTeam: string;
  onSelectTeam: (team: string) => void;
  disabled?: boolean;
  isLoading?: boolean;
}

/**
 * TeamSelect - Component for selecting a team from a dropdown list
 */
const TeamSelect: React.FC<TeamSelectProps> = ({
  label,
  teams,
  selectedTeam,
  onSelectTeam,
  disabled = false,
  isLoading = false
}) => {
  return (
    <div className="space-y-2">
      <Label htmlFor={`${label.toLowerCase()}-select`}>{label}</Label>
      <Select
        disabled={disabled || isLoading}
        value={selectedTeam}
        onValueChange={onSelectTeam}
      >
        <SelectTrigger id={`${label.toLowerCase()}-select`} className="w-full">
          {isLoading ? (
            <div className="flex items-center">
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              <span>Loading teams...</span>
            </div>
          ) : (
            <SelectValue placeholder={`Select ${label}`} />
          )}
        </SelectTrigger>
        <SelectContent>
          {teams.map((team) => {
            // Skip teams with empty names or ensure they have valid value
            const teamName = team.name || `Team ${team.id}`;
            return (
              <SelectItem key={team.id} value={teamName}>
                <div className="flex items-center">
                  <div className="h-6 w-6 rounded-full bg-gray-700 flex items-center justify-center text-sm font-bold mr-2">
                    {teamName.charAt(0).toUpperCase()}
                  </div>
                  <span>{teamName}</span>
                  <span className="ml-2 text-xs text-gray-400">TIR: {team.tir || 0}</span>
                </div>
              </SelectItem>
            );
          })}
        </SelectContent>
      </Select>
    </div>
  );
};

export default TeamSelect;
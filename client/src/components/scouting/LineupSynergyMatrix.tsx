import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Activity, Network, Users } from 'lucide-react';
import RoleBadge from '@/components/ui/role-badge';
import { apiRequest } from '@/lib/queryClient';

type Player = {
  id: string;
  name: string;
  team: string;
  role: string;
  piv: number;
}

type SynergyResponse = {
  players: Player[];
  synergy: number[][];
}

type Props = {
  className?: string;
}

export default function LineupSynergyMatrix({ className = '' }: Props) {
  const [selectedPlayers, setSelectedPlayers] = useState<string[]>([]);
  const { toast } = useToast();

  // Fetch all players to allow selection
  const { data: playersData, isLoading: isPlayersLoading } = useQuery({
    queryKey: [`/api/players`],
  });

  // Get synergy matrix data
  const { data: synergyData, isLoading, refetch } = useQuery<SynergyResponse>({
    queryKey: [`/api/lineup/synergy`],
    enabled: false
  });

  const handleAddPlayer = (playerId: string) => {
    if (selectedPlayers.includes(playerId)) return;
    if (selectedPlayers.length >= 5) {
      toast({
        title: "Maximum players reached",
        description: "You can select up to 5 players for a lineup",
        variant: "default"
      });
      return;
    }
    setSelectedPlayers([...selectedPlayers, playerId]);
  };

  const handleRemovePlayer = (playerId: string) => {
    setSelectedPlayers(selectedPlayers.filter(id => id !== playerId));
  };

  const handleCalculateSynergy = async () => {
    if (selectedPlayers.length < 2) {
      toast({
        title: "Select more players",
        description: "Please select at least 2 players to calculate synergy",
        variant: "default"
      });
      return;
    }

    try {
      // Call the synergy API
      await apiRequest('/api/lineup/synergy', {
        method: 'POST',
        body: JSON.stringify({
          playerIds: selectedPlayers
        })
      } as RequestInit);
      
      // Trigger refetch to update UI
      refetch();
    } catch (error) {
      toast({
        title: "Error calculating synergy",
        description: "Failed to calculate lineup synergy. Please try again.",
        variant: "destructive"
      });
    }
  };

  // Get color based on synergy value (0-1 scale)
  const getSynergyColor = (value: number): string => {
    if (value >= 0.8) return 'bg-green-500';
    if (value >= 0.6) return 'bg-green-400';
    if (value >= 0.5) return 'bg-yellow-400';
    if (value >= 0.3) return 'bg-orange-400';
    return 'bg-red-500';
  };

  // Get text color based on synergy value
  const getSynergyTextColor = (value: number): string => {
    if (value >= 0.8) return 'text-green-500';
    if (value >= 0.6) return 'text-green-400';
    if (value >= 0.5) return 'text-yellow-400';
    if (value >= 0.3) return 'text-orange-400';
    return 'text-red-500';
  };

  // Get text label for synergy level
  const getSynergyLabel = (value: number): string => {
    if (value >= 0.8) return 'Excellent';
    if (value >= 0.6) return 'Good';
    if (value >= 0.5) return 'Average';
    if (value >= 0.3) return 'Poor';
    return 'Bad';
  };

  // Render loading state when fetching players
  if (isPlayersLoading) {
    return (
      <Card className={`${className} min-h-[400px] flex items-center justify-center`}>
        <CardContent>
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground mx-auto" />
          <p className="text-center mt-4 text-muted-foreground">Loading players data...</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Network className="h-5 w-5" />
          Lineup Synergy Matrix
        </CardTitle>
        <CardDescription>
          Analyze chemistry between players in a potential lineup
        </CardDescription>
      </CardHeader>
      
      <CardContent>
        <div className="mb-6">
          <div className="flex items-center mb-3 gap-2">
            <Users className="h-4 w-4 text-muted-foreground" />
            <div className="font-medium">Selected Players: {selectedPlayers.length}/5</div>
          </div>
          
          {/* Player Selection */}
          <div className="flex flex-col sm:flex-row gap-4 mb-4">
            <div className="flex-1">
              <label className="text-sm font-medium block mb-2">Add Player</label>
              <Select onValueChange={handleAddPlayer}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a player" />
                </SelectTrigger>
                <SelectContent>
                  {playersData?.map(player => (
                    <SelectItem 
                      key={player.id} 
                      value={player.id}
                      disabled={selectedPlayers.includes(player.id)}
                    >
                      {player.name} ({player.team})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div className="flex-none">
              <Button 
                onClick={handleCalculateSynergy}
                disabled={isLoading || selectedPlayers.length < 2}
                className="mt-8"
              >
                {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                Calculate Synergy
              </Button>
            </div>
          </div>

          {/* Selected Players List */}
          {selectedPlayers.length > 0 && (
            <div className="flex flex-wrap gap-2 mb-4">
              {selectedPlayers.map(playerId => {
                const player = playersData?.find(p => p.id === playerId);
                if (!player) return null;
                
                return (
                  <div 
                    key={playerId}
                    className="flex items-center gap-2 p-2 bg-accent rounded-md"
                  >
                    <div className="text-sm font-medium">{player.name}</div>
                    <RoleBadge role={player.role} />
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      className="h-6 w-6 p-0" 
                      onClick={() => handleRemovePlayer(playerId)}
                    >
                      &times;
                    </Button>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Synergy Matrix Results */}
        {synergyData ? (
          <div className="space-y-4">
            <div className="text-sm font-medium text-muted-foreground mb-1">Synergy Matrix</div>
            
            <div className="overflow-x-auto">
              <table className="min-w-full border-collapse">
                <thead>
                  <tr>
                    <th className="p-2 border border-border"></th>
                    {synergyData.players.map(player => (
                      <th key={player.id} className="p-2 border border-border text-sm">
                        {player.name}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {synergyData.players.map((rowPlayer, rowIndex) => (
                    <tr key={rowPlayer.id}>
                      <td className="p-2 border border-border font-medium text-sm">
                        {rowPlayer.name}
                      </td>
                      {synergyData.synergy[rowIndex].map((synergy, colIndex) => (
                        <td 
                          key={colIndex} 
                          className={`p-2 border border-border text-center ${rowIndex === colIndex ? 'bg-gray-100 dark:bg-gray-800' : ''}`}
                        >
                          {rowIndex !== colIndex ? (
                            <div className="flex flex-col items-center justify-center">
                              <div className={`text-sm font-medium ${getSynergyTextColor(synergy)}`}>
                                {(synergy * 100).toFixed(0)}%
                              </div>
                              <div className="text-xs text-muted-foreground">
                                {getSynergyLabel(synergy)}
                              </div>
                            </div>
                          ) : (
                            <span className="text-xs text-muted-foreground">-</span>
                          )}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Overall Team Synergy */}
            <div className="mt-6 p-4 border border-border rounded-md">
              <div className="flex justify-between items-center mb-2">
                <span className="font-medium">Overall Team Synergy:</span>
                <span className="font-bold text-lg">
                  {synergyData.players.length > 1 ? (
                    calculateOverallSynergy(synergyData.synergy)
                  ) : '-'}
                </span>
              </div>
              <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                {synergyData.players.length > 1 && (
                  <div 
                    className={`h-full ${getSynergyColor(calculateOverallSynergy(synergyData.synergy, true))}`}
                    style={{width: `${calculateOverallSynergy(synergyData.synergy) * 100}%`}}
                  />
                )}
              </div>
            </div>
          </div>
        ) : (
          <div className="p-8 text-center border border-dashed border-muted-foreground/20 rounded-lg">
            <Network className="h-8 w-8 mx-auto text-muted-foreground/50 mb-3" />
            <p className="text-muted-foreground">Select players and calculate to view synergy matrix</p>
          </div>
        )}
      </CardContent>
      
      <CardFooter className="text-xs text-muted-foreground border-t pt-4 mt-2">
        <p>
          Synergy is calculated based on complementary playstyles, role compatibility, and historical performance
        </p>
      </CardFooter>
    </Card>
  );
}

// Helper function to calculate overall team synergy from the matrix
function calculateOverallSynergy(synergyMatrix: number[][], rawValue: boolean = false): number | string {
  if (!synergyMatrix || synergyMatrix.length < 2) return '-';
  
  let sum = 0;
  let count = 0;
  
  // Sum all synergy values (excluding self-synergy which is 1.0)
  for (let i = 0; i < synergyMatrix.length; i++) {
    for (let j = 0; j < synergyMatrix[i].length; j++) {
      if (i !== j) { // Skip diagonal (self-synergy)
        sum += synergyMatrix[i][j];
        count++;
      }
    }
  }
  
  // Calculate average synergy
  const avgSynergy = count > 0 ? sum / count : 0;
  
  // Return raw value or formatted string
  if (rawValue) {
    return avgSynergy;
  } else {
    return `${(avgSynergy * 100).toFixed(0)}%`;
  }
}

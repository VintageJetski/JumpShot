import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Activity, ArrowUpRight, TrendingUp, UserPlus } from 'lucide-react';
import RoleBadge from '@/components/ui/role-badge';
import { apiRequest } from '@/lib/queryClient';

type RecommendationResponse = {
  team: {
    id: string;
    name: string;
    avg_piv: number;
  };
  recommendations: Array<{
    id: string;
    name: string;
    team: string;
    role: string;
    piv: number;
    projected_gain: number;
    percentage_improvement: number;
  }>;
}

type Props = {
  teamId: string;
  className?: string;
}

export default function TeamReplacementRecommender({ teamId, className = '' }: Props) {
  const [targetRole, setTargetRole] = useState<string>("");
  const [selectedCandidates, setSelectedCandidates] = useState<string[]>([]);
  const { toast } = useToast();

  // Fetch all teams to populate team selector
  const { data: teamsData } = useQuery({
    queryKey: [`/api/teams`],
  });

  // Get selected team data
  const { data: teamData, isLoading: isTeamLoading } = useQuery({
    queryKey: [`/api/team/${teamId}`],
    enabled: !!teamId
  });

  // Get recommendations
  const { data: recommendations, isLoading, refetch } = useQuery<RecommendationResponse>({
    queryKey: [`/api/recommend/replacement/${teamId}${targetRole ? `/${targetRole}` : ""}`],
    enabled: false
  });

  const handleGetRecommendations = async () => {
    try {
      // Call the recommendation API
      await apiRequest('/api/recommend/replacement', {
        method: 'POST',
        body: JSON.stringify({
          teamId,
          targetRole: targetRole || undefined,
          candidatePool: selectedCandidates.length > 0 ? selectedCandidates : undefined
        })
      } as RequestInit);
      
      // Trigger refetch to update UI
      refetch();
    } catch (error) {
      toast({
        title: "Error getting recommendations",
        description: "Failed to fetch player recommendations. Please try again.",
        variant: "destructive"
      });
    }
  };

  // Render loading state
  if (isTeamLoading) {
    return (
      <Card className={`${className} min-h-[400px] flex items-center justify-center`}>
        <CardContent>
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground mx-auto" />
          <p className="text-center mt-4 text-muted-foreground">Loading team data...</p>
        </CardContent>
      </Card>
    );
  }

  // Render empty state when no team is selected
  if (!teamData) {
    return (
      <Card className={`${className} min-h-[400px]`}>
        <CardHeader>
          <CardTitle>Player Replacement Scout</CardTitle>
          <CardDescription>Select a team to see replacement recommendations</CardDescription>
        </CardHeader>
        <CardContent className="flex items-center justify-center h-64">
          <p className="text-center text-muted-foreground">No team selected</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <UserPlus className="h-5 w-5" />
          Player Replacement Scout
        </CardTitle>
        <CardDescription>
          Find optimal replacement players to improve team PIV
        </CardDescription>
      </CardHeader>
      
      <CardContent>
        <div className="mb-6">
          <div className="flex items-center mb-3 gap-3">
            <div className="font-medium">Team:</div>
            <div className="text-lg">{teamData.name}</div>
          </div>
          
          <div className="flex flex-col sm:flex-row gap-4 mb-4">
            <div className="flex-1">
              <label className="text-sm font-medium block mb-2">Target Role</label>
              <Select value={targetRole} onValueChange={setTargetRole}>
                <SelectTrigger>
                  <SelectValue placeholder="All roles" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">All roles</SelectItem>
                  <SelectItem value="AWP">AWP</SelectItem>
                  <SelectItem value="IGL">IGL</SelectItem>
                  <SelectItem value="Support">Support</SelectItem>
                  <SelectItem value="Spacetaker">Spacetaker</SelectItem>
                  <SelectItem value="Lurker">Lurker</SelectItem>
                  <SelectItem value="Anchor">Anchor</SelectItem>
                  <SelectItem value="Rotator">Rotator</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="flex-none">
              <Button 
                onClick={handleGetRecommendations}
                disabled={isLoading}
                className="mt-8"
              >
                {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                Find Replacements
              </Button>
            </div>
          </div>
        </div>

        {/* Recommendations Results */}
        {recommendations ? (
          <div className="space-y-4">
            <div className="flex items-center justify-between py-2 border-b border-border">
              <div className="font-medium">Team Avg PIV:</div>
              <div className="font-bold">{recommendations.team.avg_piv.toFixed(2)}</div>
            </div>
            
            <div className="space-y-3">
              <div className="text-sm font-medium text-muted-foreground mb-1">Top Recommendations</div>
              
              {recommendations.recommendations.length > 0 ? (
                <div className="space-y-3">
                  {recommendations.recommendations.map((player, index) => (
                    <div 
                      key={player.id} 
                      className="p-3 bg-card border border-border rounded-lg flex items-center justify-between hover:bg-accent/50 transition-colors"
                    >
                      <div>
                        <div className="font-medium">{player.name}</div>
                        <div className="text-sm text-muted-foreground flex items-center gap-2 mt-1">
                          <span>{player.team}</span>
                          <span className="h-1 w-1 rounded-full bg-muted-foreground"></span>
                          <RoleBadge role={player.role as any} />
                        </div>
                      </div>
                      
                      <div className="text-right">
                        <div className="flex items-center gap-1 text-sm">
                          <span>PIV: </span>
                          <span className="font-bold">{player.piv.toFixed(2)}</span>
                        </div>
                        <div className="flex items-center gap-1 text-xs text-green-500 mt-1">
                          <TrendingUp className="h-3 w-3" />
                          <span>+{player.percentage_improvement.toFixed(1)}%</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-4 text-center text-muted-foreground">
                  No suitable replacement candidates found
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="p-8 text-center border border-dashed border-muted-foreground/20 rounded-lg">
            <Activity className="h-8 w-8 mx-auto text-muted-foreground/50 mb-3" />
            <p className="text-muted-foreground">Run the search to find player recommendations</p>
          </div>
        )}
      </CardContent>
      
      <CardFooter className="text-xs text-muted-foreground border-t pt-4 mt-2">
        <p>
          Recommendations are based on PIV improvement potential and role compatibility
        </p>
      </CardFooter>
    </Card>
  );
}

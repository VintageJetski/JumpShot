import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useLocation } from 'wouter';
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle 
} from '@/components/ui/card';
import { 
  Tabs, 
  TabsContent, 
  TabsList, 
  TabsTrigger 
} from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select';
import { 
  ArrowLeft, 
  BarChart4,
  Calculator, 
  Sigma,
  TrendingUp,
  TrendingDown
} from 'lucide-react';
import { PlayerWithPIV, TeamWithTIR, PlayerRole, RawStats } from '@shared/types';
import AdvancedStatsTable from '@/components/data-visualization/AdvancedStatsTable';
import CorrelationAnalysis from '@/components/data-visualization/CorrelationAnalysis';
import TrendAnalysis from '@/components/data-visualization/TrendAnalysis';
import PositionalHeatmap from '@/components/data-visualization/PositionalHeatmap';
import { Separator } from '@/components/ui/separator';

// Define tabs for the advanced analytics page
enum AnalyticsTab {
  AdvancedStats = "advanced-stats",
  Correlation = "correlation",
  Trends = "trends",
  Positioning = "positioning"
}

export default function AdvancedAnalyticsPage() {
  const [, setLocation] = useLocation();
  const [activeTab, setActiveTab] = useState<AnalyticsTab>(AnalyticsTab.AdvancedStats);
  const [selectedTeam, setSelectedTeam] = useState<string | null>(null);
  const [selectedPlayers, setSelectedPlayers] = useState<string[]>([]);
  const [statFilter, setStatFilter] = useState<'all' | 'offense' | 'defense' | 'utility'>('all');
  const [roleFilter, setRoleFilter] = useState<PlayerRole | 'ALL'>('ALL');

  // Fetch players data
  const { data: players = [], isLoading: isLoadingPlayers } = useQuery<PlayerWithPIV[]>({
    queryKey: ['/api/players'],
  });

  // Fetch teams data
  const { data: teams = [], isLoading: isLoadingTeams } = useQuery<TeamWithTIR[]>({
    queryKey: ['/api/teams'],
  });

  // Filter players based on selected team and role
  const filteredPlayers = players.filter(player => {
    if (selectedTeam && player.team !== selectedTeam) {
      return false;
    }

    if (roleFilter !== 'ALL') {
      if (player.role !== roleFilter && 
          player.tRole !== roleFilter && 
          player.ctRole !== roleFilter) {
        return false;
      }
    }

    return true;
  });

  // Get selected players for analysis
  const selectedPlayerData = players.filter(player => selectedPlayers.includes(player.id));

  // Toggle player selection for analysis
  const togglePlayerSelection = (playerId: string) => {
    if (selectedPlayers.includes(playerId)) {
      setSelectedPlayers(selectedPlayers.filter(id => id !== playerId));
    } else {
      // Limit to 5 players for analysis
      if (selectedPlayers.length < 5) {
        setSelectedPlayers([...selectedPlayers, playerId]);
      }
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex items-center gap-4 mb-6">
        <Button 
          variant="outline" 
          size="sm" 
          onClick={() => setLocation('/')}
          className="flex items-center gap-2"
        >
          <ArrowLeft className="h-4 w-4" />
          Back
        </Button>
        <div>
          <h1 className="text-3xl font-bold">Advanced Analytics</h1>
          <p className="text-muted-foreground mt-1">
            In-depth statistical analysis and advanced comparisons
          </p>
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Filter and selection panel */}
        <Card className="md:col-span-1 h-fit">
          <CardHeader>
            <CardTitle>Analysis Selection</CardTitle>
            <CardDescription>
              Select teams, players, and statistical categories
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {/* Team Selection */}
              <div>
                <label className="text-sm font-medium mb-1 block">Team Filter</label>
                <Select 
                  value={selectedTeam || "all-teams"} 
                  onValueChange={(value) => setSelectedTeam(value === "all-teams" ? null : value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select team" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all-teams">All Teams</SelectItem>
                    {teams.map((team) => (
                      <SelectItem key={team.id} value={team.name}>
                        {team.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              {/* Role Filter */}
              <div>
                <label className="text-sm font-medium mb-1 block">Role Filter</label>
                <Select 
                  value={roleFilter} 
                  onValueChange={(value) => setRoleFilter(value as PlayerRole | 'ALL')}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select role" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ALL">All Roles</SelectItem>
                    <SelectItem value={PlayerRole.IGL}>IGL</SelectItem>
                    <SelectItem value={PlayerRole.AWP}>AWP</SelectItem>
                    <SelectItem value={PlayerRole.Lurker}>Lurker</SelectItem>
                    <SelectItem value={PlayerRole.Spacetaker}>Spacetaker</SelectItem>
                    <SelectItem value={PlayerRole.Support}>Support</SelectItem>
                    <SelectItem value={PlayerRole.Anchor}>Anchor</SelectItem>
                    <SelectItem value={PlayerRole.Rotator}>Rotator</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              {/* Stat Category */}
              <div>
                <label className="text-sm font-medium mb-1 block">Stat Categories</label>
                <Select 
                  value={statFilter} 
                  onValueChange={(value) => setStatFilter(value as 'all' | 'offense' | 'defense' | 'utility')}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select stat category" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Stats</SelectItem>
                    <SelectItem value="offense">Offensive Stats</SelectItem>
                    <SelectItem value="defense">Defensive Stats</SelectItem>
                    <SelectItem value="utility">Utility Stats</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <Separator />
              
              {/* Player Selection */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <h3 className="font-medium">Players for Analysis ({selectedPlayers.length}/5)</h3>
                  {selectedPlayers.length > 0 && (
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={() => setSelectedPlayers([])}
                    >
                      Clear All
                    </Button>
                  )}
                </div>
                
                <div className="max-h-[300px] overflow-y-auto pr-2">
                  {isLoadingPlayers ? (
                    <div className="animate-pulse space-y-2">
                      {[...Array(5)].map((_, idx) => (
                        <div key={idx} className="h-12 bg-secondary rounded-md"></div>
                      ))}
                    </div>
                  ) : filteredPlayers.length === 0 ? (
                    <div className="text-center py-4 text-muted-foreground">
                      No players match your filters
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {filteredPlayers.map((player) => (
                        <div 
                          key={player.id}
                          className={`flex items-center justify-between p-2 rounded-md border ${
                            selectedPlayers.includes(player.id) ? 'border-primary bg-primary/10' : 'border-border'
                          } cursor-pointer hover:bg-secondary/50 transition-colors`}
                          onClick={() => togglePlayerSelection(player.id)}
                        >
                          <div className="flex flex-col">
                            <span className="font-medium">{player.name}</span>
                            <span className="text-sm text-muted-foreground">{player.team}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="text-xs bg-secondary px-2 py-0.5 rounded">{player.role}</span>
                            <span className="font-medium">{player.piv.toFixed(2)}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
        
        {/* Analysis Content */}
        <Card className="md:col-span-2">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Statistical Analysis</CardTitle>
                <CardDescription>
                  Advanced metrics and comparative analysis tools
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          
          <CardContent>
            {selectedPlayers.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-[400px] text-center">
                <Sigma className="h-16 w-16 text-muted-foreground mb-4" />
                <h3 className="text-xl font-bold mb-2">Select Players for Analysis</h3>
                <p className="text-muted-foreground max-w-md">
                  Choose players from the left panel to analyze and compare advanced statistics.
                </p>
              </div>
            ) : (
              <Tabs 
                value={activeTab} 
                onValueChange={(value) => setActiveTab(value as AnalyticsTab)}
                className="w-full"
              >
                <div className="flex justify-end mb-4">
                  <TabsList className="grid grid-cols-2 md:grid-cols-4 w-full md:w-auto">
                    <TabsTrigger value={AnalyticsTab.AdvancedStats} className="flex items-center gap-1">
                      <Sigma className="h-4 w-4" />
                      <span className="hidden md:inline">Advanced Stats</span>
                    </TabsTrigger>
                    <TabsTrigger value={AnalyticsTab.Correlation} className="flex items-center gap-1">
                      <Calculator className="h-4 w-4" />
                      <span className="hidden md:inline">Correlation</span>
                    </TabsTrigger>
                    <TabsTrigger value={AnalyticsTab.Trends} className="flex items-center gap-1">
                      <TrendingUp className="h-4 w-4" />
                      <span className="hidden md:inline">Trends</span>
                    </TabsTrigger>
                    <TabsTrigger value={AnalyticsTab.Positioning} className="flex items-center gap-1">
                      <BarChart4 className="h-4 w-4" />
                      <span className="hidden md:inline">Positioning</span>
                    </TabsTrigger>
                  </TabsList>
                </div>
                
                <TabsContent value={AnalyticsTab.AdvancedStats} className="mt-0">
                  <AdvancedStatsTable 
                    players={selectedPlayerData} 
                    statFilter={statFilter}
                  />
                </TabsContent>
                
                <TabsContent value={AnalyticsTab.Correlation} className="mt-0">
                  <CorrelationAnalysis 
                    players={selectedPlayerData}
                  />
                </TabsContent>
                
                <TabsContent value={AnalyticsTab.Trends} className="mt-0">
                  <TrendAnalysis 
                    players={selectedPlayerData}
                  />
                </TabsContent>
                
                <TabsContent value={AnalyticsTab.Positioning} className="mt-0">
                  <PositionalHeatmap 
                    players={selectedPlayerData}
                  />
                </TabsContent>
              </Tabs>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
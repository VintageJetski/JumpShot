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
import { PlayerWithPIV, TeamWithTIR, PlayerRole, RawStats } from '../../shared/types';
import AdvancedStatsTable from '../components/data-visualization/AdvancedStatsTable';
import CorrelationAnalysis from '../components/data-visualization/CorrelationAnalysis';
import TrendAnalysis from '../components/data-visualization/TrendAnalysis';
import PositionalHeatmap from '../components/data-visualization/PositionalHeatmap';
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
    <div className="container mx-auto px-4 py-8 section-appear">
      <div className="flex items-center gap-4 mb-8">
        <Button 
          variant="outline" 
          size="sm" 
          onClick={() => setLocation('/')}
          className="flex items-center gap-2 border-blue-500/30 bg-blue-950/30 hover:bg-blue-900/30 text-blue-300 transition-all duration-300"
        >
          <ArrowLeft className="h-4 w-4" />
          Back
        </Button>
        <div>
          <h1 className="text-3xl font-bold text-gradient">Advanced Analytics</h1>
          <p className="text-blue-200/80 mt-1">
            In-depth statistical analysis and advanced comparisons
          </p>
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Filter and selection panel */}
        <Card className="md:col-span-1 h-fit glassmorphism border-glow card-hover">
          <CardHeader className="pb-3">
            <CardTitle className="text-gradient text-xl flex items-center gap-2">
              <Sigma className="h-5 w-5" />
              Analysis Selection
            </CardTitle>
            <CardDescription className="text-blue-200/70">
              Select teams, players, and statistical categories
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-5">
              {/* Team Selection */}
              <div className="data-appear" style={{ animationDelay: '100ms' }}>
                <label className="text-sm font-medium mb-2 block text-blue-300">Team Filter</label>
                <Select 
                  value={selectedTeam || "all-teams"} 
                  onValueChange={(value) => setSelectedTeam(value === "all-teams" ? null : value)}
                >
                  <SelectTrigger className="border-blue-500/30 bg-blue-950/30">
                    <SelectValue placeholder="Select team" />
                  </SelectTrigger>
                  <SelectContent className="glassmorphism border-white/10">
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
              <div className="data-appear" style={{ animationDelay: '200ms' }}>
                <label className="text-sm font-medium mb-2 block text-blue-300">Role Filter</label>
                <Select 
                  value={roleFilter} 
                  onValueChange={(value) => setRoleFilter(value as PlayerRole | 'ALL')}
                >
                  <SelectTrigger className="border-blue-500/30 bg-blue-950/30">
                    <SelectValue placeholder="Select role" />
                  </SelectTrigger>
                  <SelectContent className="glassmorphism border-white/10">
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
              <div className="data-appear" style={{ animationDelay: '300ms' }}>
                <label className="text-sm font-medium mb-2 block text-blue-300">Stat Categories</label>
                <Select 
                  value={statFilter} 
                  onValueChange={(value) => setStatFilter(value as 'all' | 'offense' | 'defense' | 'utility')}
                >
                  <SelectTrigger className="border-blue-500/30 bg-blue-950/30">
                    <SelectValue placeholder="Select stat category" />
                  </SelectTrigger>
                  <SelectContent className="glassmorphism border-white/10">
                    <SelectItem value="all">All Stats</SelectItem>
                    <SelectItem value="offense">Offensive Stats</SelectItem>
                    <SelectItem value="defense">Defensive Stats</SelectItem>
                    <SelectItem value="utility">Utility Stats</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <Separator className="bg-blue-500/30" />
              
              {/* Player Selection */}
              <div className="data-appear" style={{ animationDelay: '400ms' }}>
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-medium text-blue-300 flex items-center">
                    <span>Players</span>
                    <span className="ml-2 px-2 py-0.5 bg-blue-950/50 border border-blue-500/30 rounded-full text-xs">
                      {selectedPlayers.length}/5
                    </span>
                  </h3>
                  {selectedPlayers.length > 0 && (
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={() => setSelectedPlayers([])}
                      className="border-blue-500/30 bg-blue-950/30 hover:bg-blue-900/30 text-blue-300"
                    >
                      Clear All
                    </Button>
                  )}
                </div>
                
                <div className="max-h-[300px] overflow-y-auto pr-1.5 pb-2">
                  {isLoadingPlayers ? (
                    <div className="animate-pulse space-y-2">
                      {[...Array(5)].map((_, idx) => (
                        <div key={idx} className="h-14 bg-blue-900/20 rounded-md"></div>
                      ))}
                    </div>
                  ) : filteredPlayers.length === 0 ? (
                    <div className="text-center py-6 text-blue-300/60">
                      No players match your filters
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {filteredPlayers.map((player) => (
                        <div 
                          key={player.id}
                          className={`flex items-center justify-between p-3 rounded-md border transition-all duration-200 ${
                            selectedPlayers.includes(player.id) ? 
                              'border-blue-500/50 bg-blue-900/30 shadow-sm shadow-blue-500/20' : 
                              'border-white/5 hover:border-blue-500/30 hover:bg-blue-950/50'
                          } cursor-pointer`}
                          onClick={() => togglePlayerSelection(player.id)}
                        >
                          <div className="flex flex-col">
                            <span className="font-medium text-white">{player.name}</span>
                            <span className="text-sm text-blue-300/80">{player.team}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="text-xs border border-blue-500/30 bg-blue-900/30 px-2 py-0.5 rounded-full text-blue-300">{player.role}</span>
                            <span className="font-medium text-blue-200">{player.piv.toFixed(2)}</span>
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
        <Card className="md:col-span-2 glassmorphism border-glow card-hover">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-gradient text-xl flex items-center gap-2">
                  <TrendingUp className="h-5 w-5" />
                  Statistical Analysis
                </CardTitle>
                <CardDescription className="text-blue-200/70">
                  Advanced metrics and comparative analysis tools
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          
          <CardContent>
            {selectedPlayers.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-[400px] text-center data-appear">
                <div className="relative">
                  <div className="absolute -inset-5 bg-blue-500/10 rounded-full blur-xl opacity-70"></div>
                  <Sigma className="h-16 w-16 text-blue-400 relative" />
                </div>
                <h3 className="text-xl font-bold text-blue-200 mt-5 mb-2">Select Players for Analysis</h3>
                <p className="text-blue-300/70 max-w-md">
                  Choose players from the left panel to analyze and compare advanced statistics.
                </p>
              </div>
            ) : (
              <Tabs 
                value={activeTab} 
                onValueChange={(value) => setActiveTab(value as AnalyticsTab)}
                className="w-full"
              >
                <div className="flex justify-end mb-6">
                  <TabsList className="grid grid-cols-2 md:grid-cols-4 w-full md:w-auto bg-blue-950/30 p-1 border border-blue-500/20">
                    <TabsTrigger 
                      value={AnalyticsTab.AdvancedStats} 
                      className="flex items-center justify-center gap-1.5 data-tab"
                    >
                      <Sigma className="h-4 w-4" />
                      <span className="hidden md:inline">Advanced Stats</span>
                    </TabsTrigger>
                    <TabsTrigger 
                      value={AnalyticsTab.Correlation} 
                      className="flex items-center justify-center gap-1.5 data-tab"
                    >
                      <Calculator className="h-4 w-4" />
                      <span className="hidden md:inline">Correlation</span>
                    </TabsTrigger>
                    <TabsTrigger 
                      value={AnalyticsTab.Trends} 
                      className="flex items-center justify-center gap-1.5 data-tab"
                    >
                      <TrendingUp className="h-4 w-4" />
                      <span className="hidden md:inline">Trends</span>
                    </TabsTrigger>
                    <TabsTrigger 
                      value={AnalyticsTab.Positioning} 
                      className="flex items-center justify-center gap-1.5 data-tab"
                    >
                      <BarChart4 className="h-4 w-4" />
                      <span className="hidden md:inline">Positioning</span>
                    </TabsTrigger>
                  </TabsList>
                </div>
                
                <TabsContent value={AnalyticsTab.AdvancedStats} className="mt-0 data-appear">
                  <AdvancedStatsTable 
                    players={selectedPlayerData} 
                    statFilter={statFilter}
                  />
                </TabsContent>
                
                <TabsContent value={AnalyticsTab.Correlation} className="mt-0 data-appear">
                  <CorrelationAnalysis 
                    players={selectedPlayerData}
                  />
                </TabsContent>
                
                <TabsContent value={AnalyticsTab.Trends} className="mt-0 data-appear">
                  <TrendAnalysis 
                    players={selectedPlayerData}
                  />
                </TabsContent>
                
                <TabsContent value={AnalyticsTab.Positioning} className="mt-0 data-appear">
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
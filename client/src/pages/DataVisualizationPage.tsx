import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useLocation } from 'wouter';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Separator } from '@/components/ui/separator';
import { 
  BarChart3, 
  Search, 
  Filter,
  PlusCircle, 
  Users, 
  User,
  ArrowLeft
} from 'lucide-react';
import PlayerPerformanceChart from '@/components/data-visualization/PlayerPerformanceChart';
import TeamPerformanceChart from '@/components/data-visualization/TeamPerformanceChart';
import { PlayerWithPIV, TeamWithTIR, PlayerRole, TeamRoundMetrics } from '@shared/types';
import RoleBadge from '@/components/ui/role-badge';

// Define visualization tabs
enum VisualizationTab {
  Player = "player",
  Team = "team",
  Comparison = "comparison"
}

// Define filter interface
interface VisualizationFilters {
  playerName: string;
  teamName: string;
  playerRole: PlayerRole | 'ALL';
  sortBy: 'piv' | 'kd' | 'name';
}

export default function DataVisualizationPage() {
  const [, setLocation] = useLocation();
  const [activeTab, setActiveTab] = useState<VisualizationTab>(VisualizationTab.Player);
  const [filters, setFilters] = useState<VisualizationFilters>({
    playerName: '',
    teamName: '',
    playerRole: 'ALL',
    sortBy: 'piv'
  });
  const [selectedPlayerId, setSelectedPlayerId] = useState<string | null>(null);
  const [selectedTeamName, setSelectedTeamName] = useState<string | null>(null);
  const [comparisonPlayers, setComparisonPlayers] = useState<string[]>([]);
  const [comparisonTeams, setComparisonTeams] = useState<string[]>([]);
  
  // Fetch players
  const { data: players = [], isLoading: isLoadingPlayers } = useQuery<PlayerWithPIV[]>({
    queryKey: ['/api/players'],
  });
  
  // Fetch teams
  const { data: teams = [], isLoading: isLoadingTeams } = useQuery<TeamWithTIR[]>({
    queryKey: ['/api/teams'],
  });
  
  // Fetch round metrics for selected team
  const { data: roundMetrics, isLoading: isLoadingRoundMetrics } = useQuery<TeamRoundMetrics>({
    queryKey: ['/api/round-metrics', selectedTeamName],
    enabled: !!selectedTeamName,
  });
  
  // Filter players based on search criteria
  const filteredPlayers = players.filter(player => {
    if (filters.playerName && !player.name.toLowerCase().includes(filters.playerName.toLowerCase())) {
      return false;
    }
    
    if (filters.teamName && player.team !== filters.teamName) {
      return false;
    }
    
    if (filters.playerRole !== 'ALL') {
      if (player.role !== filters.playerRole && 
          player.tRole !== filters.playerRole && 
          player.ctRole !== filters.playerRole) {
        return false;
      }
    }
    
    return true;
  }).sort((a, b) => {
    if (filters.sortBy === 'piv') {
      return b.piv - a.piv;
    } else if (filters.sortBy === 'kd') {
      return b.kd - a.kd;
    } else {
      return a.name.localeCompare(b.name);
    }
  });
  
  // Get selected player
  const selectedPlayer = selectedPlayerId ? players.find(p => p.id === selectedPlayerId) : null;
  
  // Get comparison players
  const selectedComparisonPlayers = players.filter(p => comparisonPlayers.includes(p.id));
  
  // Get selected team
  const selectedTeam = selectedTeamName ? teams.find(t => t.name === selectedTeamName) : null;
  
  // Get comparison teams
  const selectedComparisonTeams = teams.filter(t => comparisonTeams.includes(t.name));
  
  // Handle player selection
  const handlePlayerSelect = (playerId: string) => {
    setSelectedPlayerId(playerId);
  };
  
  // Handle team selection
  const handleTeamSelect = (teamName: string) => {
    setSelectedTeamName(teamName);
  };
  
  // Toggle comparison player
  const toggleComparisonPlayer = (playerId: string) => {
    if (comparisonPlayers.includes(playerId)) {
      setComparisonPlayers(comparisonPlayers.filter(id => id !== playerId));
    } else {
      // Limit to 3 comparison players
      if (comparisonPlayers.length < 3) {
        setComparisonPlayers([...comparisonPlayers, playerId]);
      }
    }
  };
  
  // Toggle comparison team
  const toggleComparisonTeam = (teamName: string) => {
    if (comparisonTeams.includes(teamName)) {
      setComparisonTeams(comparisonTeams.filter(name => name !== teamName));
    } else {
      // Limit to 3 comparison teams
      if (comparisonTeams.length < 3) {
        setComparisonTeams([...comparisonTeams, teamName]);
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
          <h1 className="text-3xl font-bold">Data Visualization</h1>
          <p className="text-muted-foreground mt-1">
            Interactive analytics and performance visualizations for CS2 players and teams
          </p>
        </div>
      </div>
      
      <Tabs 
        value={activeTab} 
        onValueChange={(value) => setActiveTab(value as VisualizationTab)}
        className="w-full"
      >
        <TabsList className="grid grid-cols-3 w-full md:w-[400px]">
          <TabsTrigger value={VisualizationTab.Player} className="flex items-center gap-2">
            <User className="h-4 w-4" />
            <span>Player</span>
          </TabsTrigger>
          <TabsTrigger value={VisualizationTab.Team} className="flex items-center gap-2">
            <Users className="h-4 w-4" />
            <span>Team</span>
          </TabsTrigger>
          <TabsTrigger value={VisualizationTab.Comparison} className="flex items-center gap-2">
            <BarChart3 className="h-4 w-4" />
            <span>Comparison</span>
          </TabsTrigger>
        </TabsList>
        
        {/* Player Visualization Tab */}
        <TabsContent value={VisualizationTab.Player} className="mt-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Filter Card */}
            <Card className="md:col-span-1">
              <CardHeader>
                <CardTitle>Player Filters</CardTitle>
                <CardDescription>
                  Filter and select players to visualize
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <label className="text-sm font-medium mb-1 block">Search Player</label>
                    <div className="relative">
                      <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                      <Input
                        placeholder="Search by name"
                        className="pl-8"
                        value={filters.playerName}
                        onChange={(e) => setFilters({ ...filters, playerName: e.target.value })}
                      />
                    </div>
                  </div>
                  
                  <div>
                    <label className="text-sm font-medium mb-1 block">Filter by Team</label>
                    <Select 
                      value={filters.teamName || "all-teams"} 
                      onValueChange={(value) => setFilters({ ...filters, teamName: value === "all-teams" ? "" : value })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select team" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all-teams">All Teams</SelectItem>
                        {teams.filter(team => team.name && team.name.trim() !== '').map((team) => (
                          <SelectItem key={team.id} value={team.name || `team-${team.id}`}>
                            {team.name || `Team ${team.id}`}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div>
                    <label className="text-sm font-medium mb-1 block">Filter by Role</label>
                    <Select 
                      value={filters.playerRole} 
                      onValueChange={(value) => setFilters({ ...filters, playerRole: value as PlayerRole | 'ALL' })}
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
                  
                  <div>
                    <label className="text-sm font-medium mb-1 block">Sort By</label>
                    <Select 
                      value={filters.sortBy || "piv"} 
                      onValueChange={(value) => setFilters({ ...filters, sortBy: value as 'piv' | 'kd' | 'name' })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Sort players" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="piv">PIV (Highest)</SelectItem>
                        <SelectItem value="kd">K/D (Highest)</SelectItem>
                        <SelectItem value="name">Name (A-Z)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <Separator />
                  
                  <div className="max-h-[400px] overflow-y-auto pr-2">
                    <h3 className="font-medium mb-2">Players ({filteredPlayers.length})</h3>
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
                              selectedPlayerId === player.id ? 'border-primary bg-primary/10' : 'border-border'
                            } cursor-pointer hover:bg-secondary/50 transition-colors`}
                            onClick={() => handlePlayerSelect(player.id)}
                          >
                            <div className="flex flex-col">
                              <span className="font-medium">{player.name}</span>
                              <div className="flex items-center gap-1 text-sm text-muted-foreground">
                                <span>{player.team}</span>
                                <RoleBadge role={player.role} size="xs" />
                              </div>
                            </div>
                            <div className="flex flex-col items-end">
                              <span className="font-bold">{player.piv ? player.piv.toFixed(2) : "N/A"}</span>
                              <span className="text-xs text-muted-foreground">PIV</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                  
                  <Separator />
                  
                  <div>
                    <h3 className="font-medium mb-2">Comparison Players ({comparisonPlayers.length}/3)</h3>
                    {comparisonPlayers.length === 0 ? (
                      <div className="text-center py-2 text-muted-foreground text-sm">
                        Select players to compare
                      </div>
                    ) : (
                      <div className="space-y-2">
                        {selectedComparisonPlayers.map((player) => (
                          <div 
                            key={player.id}
                            className="flex items-center justify-between p-2 rounded-md border border-primary/50 bg-primary/10"
                          >
                            <span>{player.name}</span>
                            <Button 
                              variant="ghost" 
                              size="sm"
                              onClick={() => toggleComparisonPlayer(player.id)}
                            >
                              Remove
                            </Button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
            
            {/* Visualization Area */}
            <Card className="md:col-span-2">
              {selectedPlayer ? (
                <CardContent className="p-6">
                  <div className="mb-4">
                    <h2 className="text-2xl font-bold">{selectedPlayer.name}</h2>
                    <div className="flex items-center gap-2">
                      <span className="text-muted-foreground">{selectedPlayer.team}</span>
                      <RoleBadge role={selectedPlayer.role} />
                      <Button 
                        variant="outline" 
                        size="sm" 
                        onClick={() => toggleComparisonPlayer(selectedPlayer.id)}
                      >
                        {comparisonPlayers.includes(selectedPlayer.id) ? 'Remove from Comparison' : 'Add to Comparison'}
                      </Button>
                    </div>
                  </div>
                  
                  <PlayerPerformanceChart 
                    player={selectedPlayer} 
                    comparisonPlayers={selectedComparisonPlayers} 
                  />
                </CardContent>
              ) : (
                <CardContent className="p-6">
                  <div className="flex flex-col items-center justify-center h-[400px] text-center">
                    <User className="h-16 w-16 text-muted-foreground mb-4" />
                    <h3 className="text-xl font-bold mb-2">Select a Player</h3>
                    <p className="text-muted-foreground max-w-md mb-6">
                      Choose a player from the list to visualize their performance metrics
                      and compare with other players.
                    </p>
                  </div>
                </CardContent>
              )}
            </Card>
          </div>
        </TabsContent>
        
        {/* Team Visualization Tab */}
        <TabsContent value={VisualizationTab.Team} className="mt-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Filter Card */}
            <Card className="md:col-span-1">
              <CardHeader>
                <CardTitle>Team Filters</CardTitle>
                <CardDescription>
                  Filter and select teams to visualize
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <label className="text-sm font-medium mb-1 block">Search Team</label>
                    <div className="relative">
                      <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                      <Input
                        placeholder="Search by team name"
                        className="pl-8"
                        value={filters.teamName}
                        onChange={(e) => setFilters({ ...filters, teamName: e.target.value })}
                      />
                    </div>
                  </div>
                  
                  <Separator />
                  
                  <div className="max-h-[400px] overflow-y-auto pr-2">
                    <h3 className="font-medium mb-2">Teams ({teams.length})</h3>
                    {isLoadingTeams ? (
                      <div className="animate-pulse space-y-2">
                        {[...Array(5)].map((_, idx) => (
                          <div key={idx} className="h-12 bg-secondary rounded-md"></div>
                        ))}
                      </div>
                    ) : teams.length === 0 ? (
                      <div className="text-center py-4 text-muted-foreground">
                        No teams available
                      </div>
                    ) : (
                      <div className="space-y-2">
                        {teams
                          .filter(team => 
                            !filters.teamName || 
                            team.name.toLowerCase().includes(filters.teamName.toLowerCase())
                          )
                          .map((team) => (
                            <div 
                              key={team.id}
                              className={`flex items-center justify-between p-2 rounded-md border ${
                                selectedTeamName === team.name ? 'border-primary bg-primary/10' : 'border-border'
                              } cursor-pointer hover:bg-secondary/50 transition-colors`}
                              onClick={() => handleTeamSelect(team.name)}
                            >
                              <div className="flex flex-col">
                                <span className="font-medium">{team.name}</span>
                                <span className="text-sm text-muted-foreground">
                                  {team.players?.length || 0} players
                                </span>
                              </div>
                              <div className="flex flex-col items-end">
                                <span className="font-bold">{team.tir.toFixed(2)}</span>
                                <span className="text-xs text-muted-foreground">TIR</span>
                              </div>
                            </div>
                          ))}
                      </div>
                    )}
                  </div>
                  
                  <Separator />
                  
                  <div>
                    <h3 className="font-medium mb-2">Comparison Teams ({comparisonTeams.length}/3)</h3>
                    {comparisonTeams.length === 0 ? (
                      <div className="text-center py-2 text-muted-foreground text-sm">
                        Select teams to compare
                      </div>
                    ) : (
                      <div className="space-y-2">
                        {selectedComparisonTeams.map((team) => (
                          <div 
                            key={team.id}
                            className="flex items-center justify-between p-2 rounded-md border border-primary/50 bg-primary/10"
                          >
                            <span>{team.name}</span>
                            <Button 
                              variant="ghost" 
                              size="sm"
                              onClick={() => toggleComparisonTeam(team.name)}
                            >
                              Remove
                            </Button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
            
            {/* Visualization Area */}
            <Card className="md:col-span-2">
              {selectedTeam ? (
                <CardContent className="p-6">
                  <div className="mb-4">
                    <h2 className="text-2xl font-bold">{selectedTeam.name}</h2>
                    <div className="flex items-center gap-2">
                      <span className="text-muted-foreground">
                        TIR: {selectedTeam.tir.toFixed(2)} | 
                        W/L: {selectedTeam.matchesWon}/{selectedTeam.matchesLost}
                      </span>
                      <Button 
                        variant="outline" 
                        size="sm" 
                        onClick={() => toggleComparisonTeam(selectedTeam.name)}
                      >
                        {comparisonTeams.includes(selectedTeam.name) ? 'Remove from Comparison' : 'Add to Comparison'}
                      </Button>
                    </div>
                  </div>
                  
                  <TeamPerformanceChart 
                    team={selectedTeam} 
                    roundMetrics={roundMetrics}
                    comparisonTeams={selectedComparisonTeams} 
                  />
                </CardContent>
              ) : (
                <CardContent className="p-6">
                  <div className="flex flex-col items-center justify-center h-[400px] text-center">
                    <Users className="h-16 w-16 text-muted-foreground mb-4" />
                    <h3 className="text-xl font-bold mb-2">Select a Team</h3>
                    <p className="text-muted-foreground max-w-md mb-6">
                      Choose a team from the list to visualize their performance metrics
                      and analyze strategic patterns.
                    </p>
                  </div>
                </CardContent>
              )}
            </Card>
          </div>
        </TabsContent>
        
        {/* Comparison Visualization Tab */}
        <TabsContent value={VisualizationTab.Comparison} className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Multi-Entity Comparison</CardTitle>
              <CardDescription>
                Compare multiple players or teams in a single visualization
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h3 className="text-lg font-semibold mb-4">Player Comparison</h3>
                  
                  {selectedComparisonPlayers.length > 0 ? (
                    <div>
                      <div className="flex items-center justify-between mb-4">
                        <span>Selected: {selectedComparisonPlayers.length} players</span>
                        <Button 
                          variant="outline" 
                          size="sm" 
                          onClick={() => setComparisonPlayers([])}
                        >
                          Clear All
                        </Button>
                      </div>
                      
                      <div className="grid grid-cols-1 gap-2 mb-4">
                        {selectedComparisonPlayers.map((player) => (
                          <div 
                            key={player.id}
                            className="flex items-center justify-between p-2 rounded-md border border-primary/50 bg-primary/10"
                          >
                            <div className="flex items-center gap-2">
                              <span className="font-medium">{player.name}</span>
                              <RoleBadge role={player.role} size="xs" />
                            </div>
                            <div className="flex items-center gap-2">
                              <span>PIV: {player.piv.toFixed(2)}</span>
                              <Button 
                                variant="ghost" 
                                size="sm"
                                onClick={() => toggleComparisonPlayer(player.id)}
                              >
                                Remove
                              </Button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center justify-center p-8 text-center">
                      <User className="h-12 w-12 text-muted-foreground mb-4" />
                      <h4 className="text-lg font-semibold mb-2">No Players Selected</h4>
                      <p className="text-muted-foreground mb-4">
                        Add players from the Player tab to compare their performance metrics
                      </p>
                      <Button
                        variant="outline"
                        onClick={() => setActiveTab(VisualizationTab.Player)}
                      >
                        Go to Player Tab
                      </Button>
                    </div>
                  )}
                </div>
                
                <div>
                  <h3 className="text-lg font-semibold mb-4">Team Comparison</h3>
                  
                  {selectedComparisonTeams.length > 0 ? (
                    <div>
                      <div className="flex items-center justify-between mb-4">
                        <span>Selected: {selectedComparisonTeams.length} teams</span>
                        <Button 
                          variant="outline" 
                          size="sm" 
                          onClick={() => setComparisonTeams([])}
                        >
                          Clear All
                        </Button>
                      </div>
                      
                      <div className="grid grid-cols-1 gap-2 mb-4">
                        {selectedComparisonTeams.map((team) => (
                          <div 
                            key={team.id}
                            className="flex items-center justify-between p-2 rounded-md border border-primary/50 bg-primary/10"
                          >
                            <span className="font-medium">{team.name}</span>
                            <div className="flex items-center gap-2">
                              <span>TIR: {team.tir.toFixed(2)}</span>
                              <Button 
                                variant="ghost" 
                                size="sm"
                                onClick={() => toggleComparisonTeam(team.name)}
                              >
                                Remove
                              </Button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center justify-center p-8 text-center">
                      <Users className="h-12 w-12 text-muted-foreground mb-4" />
                      <h4 className="text-lg font-semibold mb-2">No Teams Selected</h4>
                      <p className="text-muted-foreground mb-4">
                        Add teams from the Team tab to compare their performance metrics
                      </p>
                      <Button
                        variant="outline"
                        onClick={() => setActiveTab(VisualizationTab.Team)}
                      >
                        Go to Team Tab
                      </Button>
                    </div>
                  )}
                </div>
              </div>
              
              <Separator className="my-6" />
              
              {/* Visualization area */}
              <div>
                {selectedComparisonPlayers.length > 0 && (
                  <div className="mb-8">
                    <h3 className="text-lg font-semibold mb-4">Player Performance Comparison</h3>
                    {selectedComparisonPlayers.length > 0 && (
                      <PlayerPerformanceChart 
                        player={selectedComparisonPlayers[0]} 
                        comparisonPlayers={selectedComparisonPlayers.slice(1)} 
                      />
                    )}
                  </div>
                )}
                
                {selectedComparisonTeams.length > 0 && (
                  <div>
                    <h3 className="text-lg font-semibold mb-4">Team Performance Comparison</h3>
                    {selectedComparisonTeams.length > 0 && (
                      <TeamPerformanceChart 
                        team={selectedComparisonTeams[0]} 
                        comparisonTeams={selectedComparisonTeams.slice(1)} 
                      />
                    )}
                  </div>
                )}
                
                {selectedComparisonPlayers.length === 0 && selectedComparisonTeams.length === 0 && (
                  <div className="flex flex-col items-center justify-center p-8 text-center">
                    <BarChart3 className="h-16 w-16 text-muted-foreground mb-4" />
                    <h3 className="text-xl font-bold mb-2">No Data to Compare</h3>
                    <p className="text-muted-foreground max-w-md mb-6">
                      Add players or teams from their respective tabs to visualize
                      comparison data.
                    </p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
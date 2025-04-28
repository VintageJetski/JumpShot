import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { 
  Card, 
  CardContent,
  CardHeader,
  CardTitle
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Search, Plus, Info } from "lucide-react";
import { Label } from "@/components/ui/label";
import { PlayerRole, PlayerWithPIV, TeamWithTIR } from "@shared/types";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import RoleBadge from "@/components/ui/role-badge";
import { useToast } from "@/hooks/use-toast";
import { 
  calculatePlayerScoutData, 
  ScoutMetrics, 
  RoleFit, 
  MapComfort, 
  PlayerScoutData 
} from "@/lib/scoutCalculator";

// Define player with scout data interface
interface PlayerWithScout extends PlayerWithPIV, PlayerScoutData {}

export default function ScoutPage() {
  const [selectedTeam, setSelectedTeam] = useState<string>("");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [roleFilter, setRoleFilter] = useState<PlayerRole | "ANY">("ANY");
  const [viewMode, setViewMode] = useState<"grid" | "detail">("grid");
  const [selectedPlayer, setSelectedPlayer] = useState<string | null>(null);
  
  // Sliders for metric importance
  const [roleWeightSlider, setRoleWeightSlider] = useState<number>(55);
  const [synergyWeightSlider, setSynergyWeightSlider] = useState<number>(35);
  const [riskWeightSlider, setRiskWeightSlider] = useState<number>(10);
  const [mapPoolWeightSlider, setMapPoolWeightSlider] = useState<number>(30);
  
  const { toast } = useToast();

  // Fetch teams data
  const { data: teams, isLoading: isLoadingTeams } = useQuery<TeamWithTIR[]>({
    queryKey: ['/api/teams'],
  });

  // Fetch players data
  const { data: players, isLoading: isLoadingPlayers } = useQuery<PlayerWithPIV[]>({
    queryKey: ['/api/players'],
  });

  // Calculate scout metrics for all players
  const playersWithScoutMetrics = useMemo(() => {
    if (!players || !teams) return [];
    
    // Find the selected team data
    const team = teams.find((t) => t.name === selectedTeam);
    
    return players.map((player) => {
      // Use the scout calculator service
      const scoutData = calculatePlayerScoutData(player, team || null, players);
      
      // Apply custom weight adjustments if team is selected
      if (team) {
        // Adjust the overall score based on custom weights
        const overall = (scoutData.scoutMetrics.roleScore * (roleWeightSlider / 100)) + 
                        (scoutData.scoutMetrics.synergy * (synergyWeightSlider / 100)) -
                        (scoutData.scoutMetrics.risk * (riskWeightSlider / 100));
                        
        // Return player with adjusted overall score
        return {
          ...player,
          ...scoutData,
          scoutMetrics: {
            ...scoutData.scoutMetrics,
            overall
          }
        } as PlayerWithScout;
      }
      
      // Return player with calculated scout data
      return {
        ...player,
        ...scoutData
      } as PlayerWithScout;
    });
  }, [players, teams, selectedTeam, roleWeightSlider, synergyWeightSlider, riskWeightSlider]);

  // Filter players based on search and filters
  const filteredPlayers = useMemo(() => {
    if (!playersWithScoutMetrics) return [];
    
    return playersWithScoutMetrics
      .filter((player: PlayerWithScout) => {
        // Apply role filter
        if (roleFilter !== "ANY" && player.role !== roleFilter && 
            player.tRole !== roleFilter && player.ctRole !== roleFilter) {
          return false;
        }
        
        // Apply search filter
        if (searchQuery && !player.name.toLowerCase().includes(searchQuery.toLowerCase())) {
          return false;
        }
        
        return true;
      })
      .sort((a: PlayerWithScout, b: PlayerWithScout) => b.scoutMetrics.overall - a.scoutMetrics.overall);
  }, [playersWithScoutMetrics, roleFilter, searchQuery]);

  // Get single player detail
  const selectedPlayerData = useMemo(() => {
    if (!selectedPlayer || !playersWithScoutMetrics) return null;
    return playersWithScoutMetrics.find((p: PlayerWithScout) => p.id === selectedPlayer) || null;
  }, [selectedPlayer, playersWithScoutMetrics]);

  // Helper functions for calculations
  function calculateRoleScore(player: PlayerWithPIV): number {
    // Simple implementation based on PIV in the player's role
    // In a complete implementation, this would use the detailed formulas from the specs
    return Math.round(player.piv * 100);
  }
  
  function calculateSynergy(player: PlayerWithPIV, team: TeamWithTIR): number {
    // Calculate team synergy (simplified version)
    let synergy = 0;
    
    // Role similarity (45%)
    const teamRoles = team.players.map(p => p.role);
    if (teamRoles.includes(player.role)) {
      synergy += 45; // Perfect role match
    } else if (teamRoles.includes(player.tRole) || teamRoles.includes(player.ctRole)) {
      synergy += 30; // Secondary role match
    } else {
      synergy += 15; // No direct role match
    }
    
    // Map pool overlap (30%)
    // Simplified implementation - would normally check map performance
    synergy += 20; 
    
    // Chemistry proxy (15%)
    if (player.team === team.name) {
      synergy += 15; // Same team bonus
    } else {
      synergy += 5; // Different team
    }
    
    // Momentum delta (10%)
    // Simplified - normally compare recent form
    synergy += 10;
    
    return synergy;
  }
  
  function calculateRiskScore(player: PlayerWithPIV): number {
    // Calculate risk score (simplified)
    // In a real implementation, would consider sample size, tilt proxy, etc.
    const ctRounds = player.rawStats?.ctRoundsWon || 0;
    const tRounds = player.rawStats?.tRoundsWon || 0;
    const roundsPlayed = ctRounds + tRounds;
    
    // Sample size risk (60%)
    const sampleRisk = Math.min(60, Math.max(0, 60 - ((roundsPlayed / 200) * 60)));
    
    // Other risk factors (40%)
    const otherRisk = 10; // Placeholder
    
    return sampleRisk + otherRisk;
  }
  
  function getRiskLevel(risk: number): 'low' | 'medium' | 'high' {
    if (risk <= 25) return 'low';
    if (risk <= 50) return 'medium';
    return 'high';
  }
  
  function getSynergyRating(synergy: number): 'bad' | 'fine' | 'good' | 'very good' {
    if (synergy < 60) return 'bad';
    if (synergy < 70) return 'fine';
    if (synergy < 80) return 'good';
    return 'very good';
  }
  
  function getPlayerRoleFit(player: PlayerWithPIV): { primary: number, secondary: number } {
    // Simplified role fit calculation
    return {
      primary: 100, // Perfect primary role match
      secondary: 65 // Secondary role match level
    };
  }
  
  function getMapComfort(player: PlayerWithPIV): { [key: string]: number } {
    // Simplified map comfort calculation
    // In a real implementation, would analyze map-specific performance
    return {
      "ancient": 50 + Math.floor(Math.random() * 30),
      "anubis": 50 + Math.floor(Math.random() * 30),
      "inferno": 50 + Math.floor(Math.random() * 30),
      "mirage": 50 + Math.floor(Math.random() * 30),
      "nuke": 50 + Math.floor(Math.random() * 30),
      "overpass": 50 + Math.floor(Math.random() * 30),
      "vertigo": 50 + Math.floor(Math.random() * 30)
    };
  }

  function handleTeamSelect(teamName: string) {
    setSelectedTeam(teamName);
  }

  function handlePlayerSelect(playerId: string) {
    setSelectedPlayer(playerId);
    setViewMode("detail");
  }

  function getSynergyColorClass(rating: string): string {
    switch(rating) {
      case 'very good': return 'bg-green-600';
      case 'good': return 'bg-green-500';
      case 'fine': return 'bg-amber-500';
      case 'bad': return 'bg-red-500';
      default: return 'bg-gray-500';
    }
  }

  function getRiskColorClass(level: string): string {
    switch(level) {
      case 'low': return 'text-green-500';
      case 'medium': return 'text-amber-500';
      case 'high': return 'text-red-500';
      default: return 'text-gray-500';
    }
  }

  if (isLoadingTeams || isLoadingPlayers) {
    return <div className="flex justify-center items-center h-screen">Loading scout data...</div>;
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-6">Scout 1.0</h1>
      
      <div className="flex flex-col md:flex-row gap-4 mb-6">
        <div className="w-full md:w-1/2">
          <div className="relative">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search players..."
              className="pl-10"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>
        
        <div className="w-full md:w-1/2">
          <select
            className="w-full rounded-md border border-input bg-background px-3 py-2"
            value={selectedTeam}
            onChange={(e) => handleTeamSelect(e.target.value)}
          >
            <option value="">Select team to scout for...</option>
            {teams && teams.map((team: TeamWithTIR) => (
              <option key={team.name} value={team.name}>
                {team.name}
              </option>
            ))}
          </select>
        </div>
      </div>
      
      <Tabs value={viewMode} onValueChange={(v) => setViewMode(v as "grid" | "detail")}>
        <TabsList className="mb-4">
          <TabsTrigger value="grid">Grid View</TabsTrigger>
          <TabsTrigger value="detail">Player Detail</TabsTrigger>
        </TabsList>
        
        <TabsContent value="grid" className="space-y-4">
          <div className="flex flex-wrap gap-4 mb-6">
            <Button 
              variant={roleFilter === "ANY" ? "default" : "outline"}
              onClick={() => setRoleFilter("ANY")}
            >
              Any Role
            </Button>
            <Button 
              variant={roleFilter === PlayerRole.IGL ? "default" : "outline"}
              onClick={() => setRoleFilter(PlayerRole.IGL)}
            >
              IGL
            </Button>
            <Button 
              variant={roleFilter === PlayerRole.AWP ? "default" : "outline"}
              onClick={() => setRoleFilter(PlayerRole.AWP)}
            >
              AWP
            </Button>
            <Button 
              variant={roleFilter === PlayerRole.Spacetaker ? "default" : "outline"}
              onClick={() => setRoleFilter(PlayerRole.Spacetaker)}
            >
              Spacetaker
            </Button>
            <Button 
              variant={roleFilter === PlayerRole.Lurker ? "default" : "outline"}
              onClick={() => setRoleFilter(PlayerRole.Lurker)}
            >
              Lurker
            </Button>
            <Button 
              variant={roleFilter === PlayerRole.Support ? "default" : "outline"}
              onClick={() => setRoleFilter(PlayerRole.Support)}
            >
              Support
            </Button>
            <Button 
              variant={roleFilter === PlayerRole.Anchor ? "default" : "outline"}
              onClick={() => setRoleFilter(PlayerRole.Anchor)}
            >
              Anchor
            </Button>
            <Button 
              variant={roleFilter === PlayerRole.Rotator ? "default" : "outline"}
              onClick={() => setRoleFilter(PlayerRole.Rotator)}
            >
              Rotator
            </Button>
          </div>
          
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
            {filteredPlayers.map((player: PlayerWithScout) => (
              <Card 
                key={player.id} 
                className="overflow-hidden cursor-pointer hover:border-primary transition-colors"
                onClick={() => handlePlayerSelect(player.id)}
              >
                <CardHeader className="p-3">
                  <CardTitle className="text-sm flex justify-between items-center">
                    <div className="flex flex-col">
                      <span>{player.role}</span>
                      <span className="text-xs text-muted-foreground">{player.team}</span>
                    </div>
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger>
                          <Info className={`h-4 w-4 ${getRiskColorClass(player.riskLevel)}`} />
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>Risk Level: {player.riskLevel}</p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-4 pt-0 text-center flex flex-col items-center">
                  <div className="text-xl font-bold mb-2">{player.name}</div>
                  <div className="w-16 h-16 rounded-full bg-white flex items-center justify-center text-black text-2xl font-bold mb-4">
                    {Math.round(player.scoutMetrics.roleScore)}
                  </div>
                  <div className={`w-full py-1 rounded-md text-sm font-medium text-white ${getSynergyColorClass(player.synergyRating)}`}>
                    {player.synergyRating === 'very good' ? 'Very good' : player.synergyRating}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>
        
        <TabsContent value="detail">
          {selectedPlayerData ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <Card className="overflow-hidden">
                  <CardHeader className="p-4">
                    <CardTitle className="text-xl flex items-center gap-2">
                      {selectedPlayerData.name}
                      <RoleBadge role={selectedPlayerData.role} />
                    </CardTitle>
                    <div className="text-muted-foreground">
                      Current Team: {selectedPlayerData.team}
                    </div>
                  </CardHeader>
                  <CardContent className="p-4 pt-0 flex flex-col items-center">
                    <div className="w-20 h-20 rounded-full bg-white flex items-center justify-center text-black text-3xl font-bold mb-4">
                      {Math.round(selectedPlayerData.scoutMetrics.roleScore)}
                    </div>
                    <div className={`w-full py-2 rounded-md text-center text-white font-medium ${getSynergyColorClass(selectedPlayerData.synergyRating)}`}>
                      Match to team: {selectedPlayerData.synergyRating === 'very good' ? 'Very good' : selectedPlayerData.synergyRating}
                    </div>
                  </CardContent>
                </Card>
                
                <Card className="mt-4">
                  <CardHeader className="p-4">
                    <CardTitle className="text-lg">Role Breakdown</CardTitle>
                  </CardHeader>
                  <CardContent className="p-4 pt-0">
                    <div className="space-y-4">
                      <div>
                        <div className="flex justify-between">
                          <Label>T-Side Role</Label>
                          <span>{selectedPlayerData.tRole}</span>
                        </div>
                        <div className="mt-1 h-2 bg-gray-200 rounded-full overflow-hidden">
                          <div className="bg-primary h-full" style={{ width: `${selectedPlayerData.tPIV * 100}%` }} />
                        </div>
                      </div>
                      
                      <div>
                        <div className="flex justify-between">
                          <Label>CT-Side Role</Label>
                          <span>{selectedPlayerData.ctRole}</span>
                        </div>
                        <div className="mt-1 h-2 bg-gray-200 rounded-full overflow-hidden">
                          <div className="bg-primary h-full" style={{ width: `${selectedPlayerData.ctPIV * 100}%` }} />
                        </div>
                      </div>
                      
                      {selectedPlayerData.isIGL && (
                        <div>
                          <div className="flex justify-between">
                            <Label>IGL Rating</Label>
                            <span>{Math.round(selectedPlayerData.piv * 100)}</span>
                          </div>
                          <div className="mt-1 h-2 bg-gray-200 rounded-full overflow-hidden">
                            <div className="bg-purple-500 h-full" style={{ width: `${selectedPlayerData.piv * 100}%` }} />
                          </div>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </div>
              
              <div>
                <Card>
                  <CardHeader className="p-4">
                    <CardTitle className="text-lg">Metrics & Fit</CardTitle>
                  </CardHeader>
                  <CardContent className="p-4 pt-0">
                    <div className="space-y-4">
                      <div>
                        <div className="flex justify-between">
                          <Label>Role Score</Label>
                          <span>{Math.round(selectedPlayerData.scoutMetrics.roleScore)}/100</span>
                        </div>
                        <Slider
                          value={[selectedPlayerData.scoutMetrics.roleScore]}
                          max={100}
                          step={1}
                          disabled
                        />
                      </div>
                      
                      <div>
                        <div className="flex justify-between">
                          <Label>Team Synergy</Label>
                          <span>{Math.round(selectedPlayerData.scoutMetrics.synergy)}/100</span>
                        </div>
                        <Slider
                          value={[selectedPlayerData.scoutMetrics.synergy]}
                          max={100}
                          step={1}
                          disabled
                        />
                      </div>
                      
                      <div>
                        <div className="flex justify-between">
                          <Label>Risk Factor</Label>
                          <span className={getRiskColorClass(selectedPlayerData.riskLevel)}>
                            {selectedPlayerData.riskLevel.toUpperCase()} - {Math.round(selectedPlayerData.scoutMetrics.risk)}/100
                          </span>
                        </div>
                        <Slider
                          value={[selectedPlayerData.scoutMetrics.risk]}
                          max={100}
                          step={1}
                          disabled
                        />
                      </div>
                      
                      <div>
                        <div className="flex justify-between">
                          <Label>Overall Match</Label>
                          <span>{Math.round(selectedPlayerData.scoutMetrics.overall)}/100</span>
                        </div>
                        <Slider
                          value={[selectedPlayerData.scoutMetrics.overall]}
                          max={100}
                          step={1}
                          disabled
                        />
                      </div>
                    </div>
                  </CardContent>
                </Card>
                
                <Card className="mt-4">
                  <CardHeader className="p-4">
                    <CardTitle className="text-lg">Map Pool Comfort</CardTitle>
                  </CardHeader>
                  <CardContent className="p-4 pt-0">
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                      {Object.entries(selectedPlayerData.mapComfort).map(([map, comfort]) => {
                        // Determine background color based on comfort level
                        let bgColor = "bg-white";
                        let textColor = "text-black";
                        
                        if (comfort >= 80) {
                          bgColor = "bg-green-500";
                          textColor = "text-white";
                        } else if (comfort >= 70) {
                          bgColor = "bg-green-400";
                          textColor = "text-white";
                        } else if (comfort >= 60) {
                          bgColor = "bg-amber-400";
                          textColor = "text-black";
                        } else if (comfort >= 50) {
                          bgColor = "bg-amber-300";
                          textColor = "text-black";
                        } else {
                          bgColor = "bg-red-400";
                          textColor = "text-white";
                        }
                        
                        return (
                          <div key={map} className="text-center">
                            <div className="w-full aspect-square bg-gray-200 rounded-md flex items-center justify-center">
                              <div className={`w-12 h-12 rounded-full ${bgColor} flex items-center justify-center ${textColor} font-bold`}>
                                {Math.round(comfort)}
                              </div>
                            </div>
                            <div className="mt-1 text-xs capitalize">{map}</div>
                          </div>
                        );
                      })}
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-12">
              <p className="text-muted-foreground mb-4">No player selected</p>
              <Button variant="outline" onClick={() => setViewMode("grid")}>
                Return to Grid View
              </Button>
            </div>
          )}
        </TabsContent>
      </Tabs>
      
      {selectedTeam && (
        <Card className="mt-8">
          <CardHeader className="p-4">
            <CardTitle className="text-lg">Scouting Settings</CardTitle>
          </CardHeader>
          <CardContent className="p-4 pt-0">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="space-y-6">
                <h3 className="font-medium">Current Weights</h3>
                
                <div>
                  <div className="flex justify-between">
                    <Label>Role</Label>
                    <span>{roleWeightSlider}%</span>
                  </div>
                  <Slider
                    value={[roleWeightSlider]}
                    max={100}
                    step={5}
                    onValueChange={(value) => setRoleWeightSlider(value[0])}
                  />
                </div>
                
                <div>
                  <div className="flex justify-between">
                    <Label>Synergy</Label>
                    <span>{synergyWeightSlider}%</span>
                  </div>
                  <Slider
                    value={[synergyWeightSlider]}
                    max={100}
                    step={5}
                    onValueChange={(value) => setSynergyWeightSlider(value[0])}
                  />
                </div>
                
                <div>
                  <div className="flex justify-between">
                    <Label>Risk</Label>
                    <span>{riskWeightSlider}%</span>
                  </div>
                  <Slider
                    value={[riskWeightSlider]}
                    max={100}
                    step={5}
                    onValueChange={(value) => setRiskWeightSlider(value[0])}
                  />
                </div>
                
                <div>
                  <div className="flex justify-between">
                    <Label>Map Pool</Label>
                    <span>{mapPoolWeightSlider}%</span>
                  </div>
                  <Slider
                    value={[mapPoolWeightSlider]}
                    max={100}
                    step={5}
                    onValueChange={(value) => setMapPoolWeightSlider(value[0])}
                  />
                </div>
              </div>
              
              <div className="flex flex-col justify-center">
                <h3 className="font-medium mb-4">Map Pool</h3>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {["ancient", "anubis", "inferno", "mirage", "nuke", "overpass", "vertigo"].map((map) => {
                    // Generate a comfort value for each map (would normally come from team data)
                    const comfort = 50 + Math.floor(Math.random() * 30);
                    
                    // Determine background color based on comfort level
                    let bgColor = "bg-white";
                    let textColor = "text-black";
                    
                    if (comfort >= 80) {
                      bgColor = "bg-green-500";
                      textColor = "text-white";
                    } else if (comfort >= 70) {
                      bgColor = "bg-green-400";
                      textColor = "text-white";
                    } else if (comfort >= 60) {
                      bgColor = "bg-amber-400";
                      textColor = "text-black";
                    } else if (comfort >= 50) {
                      bgColor = "bg-amber-300";
                      textColor = "text-black";
                    } else {
                      bgColor = "bg-red-400";
                      textColor = "text-white";
                    }
                    
                    return (
                      <div key={map} className="text-center">
                        <div className="w-full aspect-square bg-gray-200 rounded-md flex items-center justify-center">
                          <div className={`w-12 h-12 rounded-full ${bgColor} flex items-center justify-center ${textColor} font-bold`}>
                            {comfort}
                          </div>
                        </div>
                        <div className="mt-1 text-xs capitalize">{map}</div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
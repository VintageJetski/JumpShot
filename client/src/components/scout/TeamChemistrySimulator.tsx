import { useState, useEffect, useMemo } from "react";
import { DragDropContext, Draggable, Droppable, DropResult } from "react-beautiful-dnd";
import { useQuery } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { 
  Card, 
  CardContent, 
  CardHeader, 
  CardTitle,
  CardDescription,
  CardFooter
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "@/components/ui/select";
import { 
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Slider } from "@/components/ui/slider";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Search, Users, Trash2, RefreshCw, PlusCircle, UserSearch } from "lucide-react";
import RoleBadge from "@/components/ui/role-badge";
import { PlayerRole, PlayerWithPIV, TeamWithTIR } from "@shared/types";
import { calculatePlayerScoutData, PlayerScoutData } from "@/lib/scoutCalculator";

// Define player with scout data interface
interface PlayerWithScout extends PlayerWithPIV, PlayerScoutData {}

// Define a position interface for the squad builder
interface Position {
  id: string;
  name: string;
  role: PlayerRole;
  player: PlayerWithScout | null;
}

interface TeamChemistrySimulatorProps {
  selectedPlayerId?: string | null;
}

export default function TeamChemistrySimulator({ selectedPlayerId = null }: TeamChemistrySimulatorProps) {
  const [selectedTeam, setSelectedTeam] = useState<TeamWithTIR | null>(null);
  const [positions, setPositions] = useState<Position[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [roleFilter, setRoleFilter] = useState<PlayerRole | "ANY">("ANY");
  const [isSearchDialogOpen, setIsSearchDialogOpen] = useState(false);
  const [selectedPosition, setSelectedPosition] = useState<string | null>(null);
  const [teamSynergy, setTeamSynergy] = useState<number>(0);
  const [teamChemistry, setTeamChemistry] = useState<number[]>([]);
  const [replacementSuggestions, setReplacementSuggestions] = useState<PlayerWithScout[]>([]);
  
  const { toast } = useToast();
  const [, setLocation] = useLocation();

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
    if (!players || !selectedTeam) return [];
    
    return players.map((player) => {
      // Use the scout calculator service
      const scoutData = calculatePlayerScoutData(player, selectedTeam, players);
      
      // Return player with calculated scout data
      return {
        ...player,
        ...scoutData
      } as PlayerWithScout;
    });
  }, [players, selectedTeam]);

  // Filter players based on search and filters for replacement
  const filteredPlayers = useMemo(() => {
    if (!playersWithScoutMetrics) return [];
    
    return playersWithScoutMetrics
      .filter((player: PlayerWithScout) => {
        // Don't show players already in the lineup
        const existingPlayerIds = positions
          .filter(p => p.player !== null)
          .map(p => p.player?.id);
        
        if (existingPlayerIds.includes(player.id)) {
          return false;
        }
        
        // Apply role filter
        if (roleFilter !== "ANY") {
          if (selectedPosition) {
            const position = positions.find(p => p.id === selectedPosition);
            if (position && position.role !== player.role && 
                player.tRole !== position.role && 
                player.ctRole !== position.role) {
              return false;
            }
          } else if (player.role !== roleFilter && 
                    player.tRole !== roleFilter && 
                    player.ctRole !== roleFilter) {
            return false;
          }
        }
        
        // Apply search filter
        if (searchQuery && !player.name.toLowerCase().includes(searchQuery.toLowerCase())) {
          return false;
        }
        
        return true;
      })
      .sort((a: PlayerWithScout, b: PlayerWithScout) => b.scoutMetrics.overall - a.scoutMetrics.overall);
  }, [playersWithScoutMetrics, roleFilter, searchQuery, positions, selectedPosition]);

  // Initialize positions when team is selected
  useEffect(() => {
    if (selectedTeam) {
      // Create positions based on team roles
      const newPositions: Position[] = [];
      
      // Create default positions based on common CS2 roles
      newPositions.push({ id: "pos-1", name: "IGL", role: PlayerRole.IGL, player: null });
      newPositions.push({ id: "pos-2", name: "AWP", role: PlayerRole.AWP, player: null });
      newPositions.push({ id: "pos-3", name: "Entry", role: PlayerRole.Spacetaker, player: null });
      newPositions.push({ id: "pos-4", name: "Support", role: PlayerRole.Support, player: null });
      newPositions.push({ id: "pos-5", name: "Lurker", role: PlayerRole.Lurker, player: null });
      
      // Try to populate with current team players
      if (selectedTeam.players && playersWithScoutMetrics.length > 0) {
        selectedTeam.players.forEach((teamPlayer, index) => {
          if (index < newPositions.length) {
            const playerWithScout = playersWithScoutMetrics.find(p => p.id === teamPlayer.id);
            if (playerWithScout) {
              newPositions[index].player = playerWithScout;
              newPositions[index].role = playerWithScout.role;
            }
          }
        });
      }
      
      setPositions(newPositions);
      calculateTeamChemistry(newPositions);
    }
  }, [selectedTeam, playersWithScoutMetrics]);

  // Handle team selection
  const handleTeamSelect = (teamName: string) => {
    const team = teams?.find(t => t.name === teamName) || null;
    setSelectedTeam(team);
  };

  // Handle drag and drop of players
  const handleDragEnd = (result: DropResult) => {
    const { source, destination } = result;
    
    // Dropped outside a droppable area
    if (!destination) return;
    
    // Handle drop from player search to position
    if (source.droppableId === 'player-search' && destination.droppableId.startsWith('position-')) {
      const positionId = destination.droppableId.replace('position-', '');
      const playerIndex = source.index;
      const player = filteredPlayers[playerIndex];
      
      // Update the position with the player
      const newPositions = [...positions];
      const positionIndex = newPositions.findIndex(p => p.id === positionId);
      if (positionIndex !== -1) {
        newPositions[positionIndex].player = player;
        setPositions(newPositions);
        calculateTeamChemistry(newPositions);
        
        // Close the search dialog
        setIsSearchDialogOpen(false);
        setSelectedPosition(null);
        
        toast({
          title: "Player Added",
          description: `${player.name} has been added to the ${newPositions[positionIndex].name} position.`,
        });
      }
    }
    
    // Handle position swapping
    if (source.droppableId.startsWith('position-') && destination.droppableId.startsWith('position-')) {
      const sourceId = source.droppableId.replace('position-', '');
      const destId = destination.droppableId.replace('position-', '');
      
      const newPositions = [...positions];
      const sourcePos = newPositions.find(p => p.id === sourceId);
      const destPos = newPositions.find(p => p.id === destId);
      
      if (sourcePos && destPos) {
        // Swap players between positions
        const tempPlayer = sourcePos.player;
        sourcePos.player = destPos.player;
        destPos.player = tempPlayer;
        
        setPositions(newPositions);
        calculateTeamChemistry(newPositions);
        
        toast({
          title: "Players Swapped",
          description: "Player positions have been swapped.",
        });
      }
    }
  };

  // Handle player selection for a position
  const handlePlayerSelect = (positionId: string, player: PlayerWithScout) => {
    const newPositions = [...positions];
    const position = newPositions.find(p => p.id === positionId);
    
    if (position) {
      position.player = player;
      setPositions(newPositions);
      calculateTeamChemistry(newPositions);
      
      // Close the search dialog
      setIsSearchDialogOpen(false);
      setSelectedPosition(null);
      
      toast({
        title: "Player Added",
        description: `${player.name} has been added to the ${position.name} position.`,
      });
    }
  };

  // Remove a player from a position
  const removePlayer = (positionId: string) => {
    const newPositions = [...positions];
    const position = newPositions.find(p => p.id === positionId);
    
    if (position) {
      position.player = null;
      setPositions(newPositions);
      calculateTeamChemistry(newPositions);
      
      toast({
        title: "Player Removed",
        description: `Player has been removed from the ${position.name} position.`,
      });
    }
  };

  // Open search dialog for a position
  const openSearchDialog = (positionId: string) => {
    setSelectedPosition(positionId);
    
    // Set role filter based on position
    const position = positions.find(p => p.id === positionId);
    if (position) {
      setRoleFilter(position.role);
    }
    
    setIsSearchDialogOpen(true);
  };

  // Calculate team chemistry
  const calculateTeamChemistry = (positions: Position[]) => {
    // Only calculate if we have players in positions
    const playersInPositions = positions.filter(p => p.player !== null);
    
    if (playersInPositions.length < 2) {
      setTeamSynergy(0);
      setTeamChemistry([]);
      return;
    }
    
    // Chemistry calculation between pairs of players
    const pairChemistry: number[] = [];
    let totalSynergy = 0;
    
    for (let i = 0; i < playersInPositions.length; i++) {
      for (let j = i + 1; j < playersInPositions.length; j++) {
        const player1 = playersInPositions[i].player;
        const player2 = playersInPositions[j].player;
        
        if (player1 && player2) {
          // Calculate chemistry between these two players
          const sameTeam = player1.team === player2.team;
          const complementaryRoles = isComplementaryRole(player1.role, player2.role);
          
          // Base chemistry score
          let chemistry = 50;
          
          // Adjust based on team
          if (sameTeam) chemistry += 25;
          
          // Adjust based on roles
          if (complementaryRoles) chemistry += 25;
          
          // Adjust based on synergy
          chemistry += (player1.scoutMetrics.synergy + player2.scoutMetrics.synergy) / 4;
          
          // Ensure in range 0-100
          chemistry = Math.min(100, Math.max(0, chemistry));
          
          pairChemistry.push(chemistry);
          totalSynergy += chemistry;
        }
      }
    }
    
    // Average synergy
    const averageSynergy = pairChemistry.length > 0 ? totalSynergy / pairChemistry.length : 0;
    
    setTeamSynergy(averageSynergy);
    setTeamChemistry(pairChemistry);
  };

  // Check if two roles are complementary
  const isComplementaryRole = (role1: PlayerRole, role2: PlayerRole): boolean => {
    // Simplistic role synergy check
    // In a real implementation, this would have a comprehensive role complementary matrix
    
    // IGL works well with any role
    if (role1 === PlayerRole.IGL || role2 === PlayerRole.IGL) return true;
    
    // AWP works well with Support
    if ((role1 === PlayerRole.AWP && role2 === PlayerRole.Support) ||
        (role2 === PlayerRole.AWP && role1 === PlayerRole.Support)) return true;
    
    // Spacetaker works well with Support
    if ((role1 === PlayerRole.Spacetaker && role2 === PlayerRole.Support) ||
        (role2 === PlayerRole.Spacetaker && role1 === PlayerRole.Support)) return true;
    
    // Lurker works well with Spacetakers
    if ((role1 === PlayerRole.Lurker && role2 === PlayerRole.Spacetaker) ||
        (role2 === PlayerRole.Lurker && role1 === PlayerRole.Spacetaker)) return true;
    
    // Anchor works well with Rotator
    if ((role1 === PlayerRole.Anchor && role2 === PlayerRole.Rotator) ||
        (role2 === PlayerRole.Anchor && role1 === PlayerRole.Rotator)) return true;
    
    return false;
  };

  // Optimize team composition automatically
  const optimizeTeamComposition = () => {
    if (!selectedTeam || !playersWithScoutMetrics.length) return;
    
    // Clone current positions
    const newPositions = [...positions];
    
    // Sort players by their role score
    const sortedPlayers = [...playersWithScoutMetrics]
      .sort((a, b) => b.scoutMetrics.overall - a.scoutMetrics.overall);
    
    // Track players we've already assigned
    const assignedPlayerIds = new Set<string>();
    
    // First, look for an IGL
    const iglPlayer = sortedPlayers.find(p => 
      p.role === PlayerRole.IGL && 
      !assignedPlayerIds.has(p.id));
    
    if (iglPlayer) {
      const iglPosition = newPositions.find(p => p.role === PlayerRole.IGL);
      if (iglPosition) {
        iglPosition.player = iglPlayer;
        assignedPlayerIds.add(iglPlayer.id);
      }
    }
    
    // Then look for an AWP
    const awpPlayer = sortedPlayers.find(p => 
      p.role === PlayerRole.AWP && 
      !assignedPlayerIds.has(p.id));
    
    if (awpPlayer) {
      const awpPosition = newPositions.find(p => p.role === PlayerRole.AWP);
      if (awpPosition) {
        awpPosition.player = awpPlayer;
        assignedPlayerIds.add(awpPlayer.id);
      }
    }
    
    // Fill remaining positions with best role fit
    for (const position of newPositions) {
      if (!position.player) {
        // Find the best player for this role who hasn't been assigned
        const bestPlayer = sortedPlayers.find(p => 
          (p.role === position.role || p.tRole === position.role || p.ctRole === position.role) && 
          !assignedPlayerIds.has(p.id));
        
        if (bestPlayer) {
          position.player = bestPlayer;
          assignedPlayerIds.add(bestPlayer.id);
        } else {
          // If no perfect role match, just take the highest scored available player
          const anyPlayer = sortedPlayers.find(p => !assignedPlayerIds.has(p.id));
          if (anyPlayer) {
            position.player = anyPlayer;
            assignedPlayerIds.add(anyPlayer.id);
          }
        }
      }
    }
    
    setPositions(newPositions);
    calculateTeamChemistry(newPositions);
    
    toast({
      title: "Team Optimized",
      description: "The team composition has been optimized based on player roles and synergy.",
    });
  };

  // Find replacement suggestions for a position
  const findReplacements = (positionId: string) => {
    const position = positions.find(p => p.id === positionId);
    if (!position) return;
    
    // Get top 3 players for this role who aren't already in the lineup
    const existingPlayerIds = positions
      .filter(p => p.player !== null)
      .map(p => p.player?.id);
    
    const suggestions = playersWithScoutMetrics
      .filter(p => 
        !existingPlayerIds.includes(p.id) && 
        (p.role === position.role || p.tRole === position.role || p.ctRole === position.role)
      )
      .sort((a, b) => b.scoutMetrics.overall - a.scoutMetrics.overall)
      .slice(0, 3);
    
    setReplacementSuggestions(suggestions);
    setSelectedPosition(positionId);
  };

  // Replace a player with a suggested replacement
  const replacePlayer = (positionId: string, player: PlayerWithScout) => {
    const newPositions = [...positions];
    const position = newPositions.find(p => p.id === positionId);
    
    if (position) {
      position.player = player;
      setPositions(newPositions);
      calculateTeamChemistry(newPositions);
      
      toast({
        title: "Player Replaced",
        description: `${player.name} has been added to the ${position.name} position.`,
      });
      
      // Clear suggestions
      setReplacementSuggestions([]);
      setSelectedPosition(null);
    }
  };

  // Loading state
  if (isLoadingTeams || isLoadingPlayers) {
    return <div className="flex justify-center items-center h-64">Loading team data...</div>;
  }

  // Render team selection page if no team is selected
  if (!selectedTeam) {
    return (
      <div className="container mx-auto p-4">
        <CardHeader className="px-0">
          <CardTitle className="text-2xl">Team Chemistry Simulator</CardTitle>
          <CardDescription>
            Select a team to start building and optimizing your lineup
          </CardDescription>
        </CardHeader>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mt-6">
          {teams?.map((team) => (
            <Card 
              key={team.name} 
              className="cursor-pointer hover:border-primary transition-colors"
              onClick={() => handleTeamSelect(team.name)}
            >
              <CardHeader>
                <CardTitle>{team.name}</CardTitle>
                <CardDescription>TIR: {team.tir.toFixed(2)}</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2">
                  {team.players.slice(0, 5).map((player) => (
                    <Badge key={player.id} variant="outline">
                      {player.name}
                    </Badge>
                  ))}
                </div>
              </CardContent>
              <CardFooter>
                <Button variant="outline" className="w-full" onClick={() => handleTeamSelect(team.name)}>
                  <Users className="h-4 w-4 mr-2" />
                  Select Team
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  // Render team chemistry simulator
  return (
    <div className="container mx-auto p-4">
      <CardHeader className="px-0 flex flex-row items-center justify-between">
        <div>
          <CardTitle className="text-2xl">
            {selectedTeam.name} - Team Chemistry Simulator
          </CardTitle>
          <CardDescription>
            Add, remove, and replace players to optimize your lineup
          </CardDescription>
        </div>
        
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => setSelectedTeam(null)}>
            Change Team
          </Button>
          <Button variant="outline" onClick={() => setLocation('/scout/search-players')}>
            <UserSearch className="h-4 w-4 mr-2" />
            Find Players
          </Button>
          <Button variant="default" onClick={optimizeTeamComposition}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Auto-Optimize
          </Button>
        </div>
      </CardHeader>
      
      <div className="mt-6 grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>Team Lineup</span>
                <div className="text-right">
                  <div className="text-2xl font-bold">{teamSynergy.toFixed(1)}</div>
                  <div className="text-sm text-muted-foreground">Team Synergy</div>
                </div>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <DragDropContext onDragEnd={handleDragEnd}>
                <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                  {positions.map((position) => (
                    <div key={position.id} className="relative">
                      <Droppable droppableId={`position-${position.id}`}>
                        {(provided) => (
                          <Card 
                            className="h-full border-dashed"
                            ref={provided.innerRef} 
                            {...provided.droppableProps}
                          >
                            <CardHeader className="p-3">
                              <CardTitle className="text-sm flex justify-between items-center">
                                <RoleBadge role={position.role} /> 
                                <span>{position.name}</span>
                              </CardTitle>
                            </CardHeader>
                            <CardContent className="p-3 flex flex-col items-center">
                              {position.player ? (
                                <Draggable 
                                  draggableId={position.player.id} 
                                  index={0}
                                >
                                  {(provided) => (
                                    <div
                                      ref={provided.innerRef}
                                      {...provided.draggableProps}
                                      {...provided.dragHandleProps}
                                      className="w-full text-center"
                                    >
                                      <div className="text-lg font-bold truncate">
                                        {position.player?.name || ''}
                                      </div>
                                      <div className="mb-1 text-xs text-muted-foreground">
                                        {position.player?.team || ''}
                                      </div>
                                      
                                      {position.player && (
                                        <>
                                          <div className="mb-2 grid grid-cols-2 gap-1">
                                            <Badge variant="outline" className="text-xs flex items-center justify-center">
                                              <span className="text-amber-500 mr-1">T:</span> 
                                              <RoleBadge role={position.player.tRole} size="xs" />
                                            </Badge>
                                            <Badge variant="outline" className="text-xs flex items-center justify-center">
                                              <span className="text-blue-500 mr-1">CT:</span> 
                                              <RoleBadge role={position.player.ctRole} size="xs" />
                                            </Badge>
                                          </div>
                                          
                                          <div className="grid grid-cols-2 gap-2 mb-2 text-xs">
                                            <div className="flex flex-col items-center">
                                              <span className="text-muted-foreground mb-1">PIV</span>
                                              <span className="font-bold">{position.player.piv.toFixed(2)}</span>
                                            </div>
                                            <div className="flex flex-col items-center">
                                              <span className="text-muted-foreground mb-1">K/D</span>
                                              <span className="font-bold">{position.player.kd.toFixed(2)}</span>
                                            </div>
                                          </div>
                                          
                                          <div className="w-14 h-14 mx-auto rounded-full bg-primary/25 border-2 border-primary flex items-center justify-center text-black mb-1">
                                            <div className="flex flex-col items-center">
                                              <span className="text-[10px] text-foreground">FIT</span>
                                              <span className="text-xl font-bold text-foreground">
                                                {Math.round(position.player.scoutMetrics.roleScore)}
                                              </span>
                                            </div>
                                          </div>
                                          
                                          {position.player.isIGL && (
                                            <Badge className="mb-1 bg-purple-600">IGL</Badge>
                                          )}
                                        </>
                                      )}
                                      <div className="flex gap-1 justify-center mt-2">
                                        <Button 
                                          variant="destructive" 
                                          size="sm" 
                                          className="h-8 px-2"
                                          onClick={() => removePlayer(position.id)}
                                        >
                                          <Trash2 className="h-4 w-4" />
                                        </Button>
                                        <Button 
                                          variant="outline" 
                                          size="sm" 
                                          className="h-8 px-2"
                                          onClick={() => findReplacements(position.id)}
                                        >
                                          Find Replacement
                                        </Button>
                                      </div>
                                    </div>
                                  )}
                                </Draggable>
                              ) : (
                                <>
                                  <div className="text-muted-foreground mb-3">No player assigned</div>
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => openSearchDialog(position.id)}
                                  >
                                    <PlusCircle className="h-4 w-4 mr-2" />
                                    Add Player
                                  </Button>
                                </>
                              )}
                              {provided.placeholder}
                            </CardContent>
                          </Card>
                        )}
                      </Droppable>
                      
                      {/* Replacement suggestions */}
                      {selectedPosition === position.id && replacementSuggestions.length > 0 && (
                        <Card className="absolute top-full left-0 right-0 z-10 mt-2 shadow-lg">
                          <CardHeader className="p-3">
                            <CardTitle className="text-sm">Suggested Replacements</CardTitle>
                          </CardHeader>
                          <CardContent className="p-3">
                            <div className="space-y-2">
                              {replacementSuggestions.map((player) => (
                                <Button
                                  key={player.id}
                                  variant="outline"
                                  size="sm"
                                  className="w-full justify-start"
                                  onClick={() => replacePlayer(position.id, player)}
                                >
                                  <div className="flex items-center">
                                    <div className="w-6 h-6 rounded-full bg-white flex items-center justify-center text-black text-xs font-bold mr-2">
                                      {Math.round(player.scoutMetrics.roleScore)}
                                    </div>
                                    <div>
                                      <div className="text-sm">{player.name}</div>
                                      <div className="text-xs text-muted-foreground">{player.team}</div>
                                    </div>
                                  </div>
                                </Button>
                              ))}
                            </div>
                          </CardContent>
                          <CardFooter className="p-3">
                            <Button 
                              variant="ghost" 
                              size="sm" 
                              className="w-full"
                              onClick={() => {
                                setReplacementSuggestions([]);
                                setSelectedPosition(null);
                              }}
                            >
                              Close
                            </Button>
                          </CardFooter>
                        </Card>
                      )}
                    </div>
                  ))}
                </div>
              </DragDropContext>
            </CardContent>
          </Card>
          
          {/* Chemistry Network */}
          <Card className="mt-4">
            <CardHeader>
              <CardTitle>Team Chemistry Analysis</CardTitle>
              <CardDescription>
                See how players work together and their synergistic relationships
              </CardDescription>
            </CardHeader>
            <CardContent>
              {positions.some(p => p.player) ? (
                <>
                  {/* Player synergy network visualization */}
                  <div className="relative h-[240px] border rounded-lg p-4 mb-4">
                    <div className="flex flex-wrap gap-2 justify-center items-center h-full">
                      {positions.filter(p => p.player).map((position, index) => {
                        const positionsWithPlayers = positions.filter(p => p.player);
                        const totalPlayers = positionsWithPlayers.length;
                        // Calculate angular position in a circle for more than 2 players
                        const angle = (2 * Math.PI * index) / totalPlayers;
                        const radius = 100; // pixels
                        const centerX = 50; // percentage
                        const centerY = 50; // percentage
                        
                        // Only create position if we have more than 1 player
                        const x = totalPlayers > 2 ? centerX + (radius * Math.cos(angle) / 240 * 100) : (index === 0 ? 30 : 70);
                        const y = totalPlayers > 2 ? centerY + (radius * Math.sin(angle) / 240 * 100) : 50;
                        
                        return (
                          <div 
                            key={position.id} 
                            className="absolute"
                            style={{
                              left: `${x}%`,
                              top: `${y}%`,
                              transform: 'translate(-50%, -50%)'
                            }}
                          >
                            <div className={`w-16 h-16 rounded-full flex items-center justify-center`}
                                style={{
                                  backgroundColor: position.player?.isIGL ? '#a855f7' : '#3b82f6',
                                  opacity: 0.8,
                                  border: '2px solid white'
                                }}
                            >
                              <div className="text-center text-white">
                                <div className="text-xs font-bold">{position.player?.name.split(' ')[0]}</div>
                                <RoleBadge role={position.player?.role || PlayerRole.Support} size="xs" />
                              </div>
                            </div>
                          </div>
                        );
                      })}
                      
                      {/* Draw connection lines between players */}
                      {positions.filter(p => p.player).length > 1 && teamChemistry.length > 0 && (
                        <svg className="absolute inset-0 w-full h-full" style={{ zIndex: -1 }}>
                          {positions.filter(p => p.player).flatMap((pos1, i) => {
                            return positions.filter(p => p.player).slice(i + 1).map((pos2, j) => {
                              const totalPlayers = positions.filter(p => p.player).length;
                              
                              // Calculate positions
                              const angle1 = (2 * Math.PI * i) / totalPlayers;
                              const angle2 = (2 * Math.PI * (i + j + 1)) / totalPlayers;
                              
                              const radius = 100; // pixels
                              const centerX = 240 / 2; // pixels
                              const centerY = 240 / 2; // pixels
                              
                              // Position calculations
                              const x1 = totalPlayers > 2 ? centerX + (radius * Math.cos(angle1)) : (i === 0 ? centerX - 50 : centerX + 50);
                              const y1 = totalPlayers > 2 ? centerY + (radius * Math.sin(angle1)) : centerY;
                              const x2 = totalPlayers > 2 ? centerX + (radius * Math.cos(angle2)) : (i === 0 ? centerX + 50 : centerX - 50);
                              const y2 = totalPlayers > 2 ? centerY + (radius * Math.sin(angle2)) : centerY;
                              
                              // Chemistry value
                              const chemistryIndex = (i * (totalPlayers - 1)) + j - (i * (i + 1)) / 2;
                              const chemistry = teamChemistry[chemistryIndex] || 50;
                              
                              // Line color based on chemistry
                              const lineColor = chemistry > 75 ? '#10b981' : chemistry > 50 ? '#f59e0b' : '#ef4444';
                              const lineWidth = chemistry / 20;
                              
                              return (
                                <line
                                  key={`${pos1.id}-${pos2.id}`}
                                  x1={x1}
                                  y1={y1}
                                  x2={x2}
                                  y2={y2}
                                  stroke={lineColor}
                                  strokeWidth={lineWidth}
                                  strokeOpacity={0.7}
                                />
                              );
                            });
                          })}
                        </svg>
                      )}
                    </div>
                  </div>
                  
                  {/* Chemistry ratings */}
                  {teamChemistry.length > 0 && (
                    <div>
                      <div className="text-sm font-medium mb-2">Player Chemistry Pairs</div>
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                        {teamChemistry.map((chemistry, index) => {
                          const positionsWithPlayers = positions.filter(p => p.player);
                          
                          // Map the chemistry index back to player pairs
                          let pair1Index = 0;
                          let pair2Index = 0;
                          let count = 0;
                          
                          for (let i = 0; i < positionsWithPlayers.length - 1; i++) {
                            for (let j = i + 1; j < positionsWithPlayers.length; j++) {
                              if (count === index) {
                                pair1Index = i;
                                pair2Index = j;
                                break;
                              }
                              count++;
                            }
                            if (count === index) break;
                          }
                          
                          const player1 = positionsWithPlayers[pair1Index].player;
                          const player2 = positionsWithPlayers[pair2Index].player;
                          
                          if (!player1 || !player2) return null;
                          
                          return (
                            <div key={index} className="border rounded-md p-2">
                              <div className="flex justify-between mb-1">
                                <div className="text-xs font-medium truncate">{player1.name.split(' ')[0]}</div>
                                <div className="text-xs font-medium truncate">{player2.name.split(' ')[0]}</div>
                              </div>
                              <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                                <div 
                                  className="h-full" 
                                  style={{ 
                                    width: `${chemistry}%`,
                                    backgroundColor: 
                                      chemistry > 75 ? '#10b981' : 
                                      chemistry > 50 ? '#f59e0b' : 
                                      '#ef4444' 
                                  }}
                                />
                              </div>
                              <div className="text-xs text-center mt-1">{chemistry.toFixed(0)}%</div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </>
              ) : (
                <div className="flex flex-col items-center justify-center p-8 text-center">
                  <div className="text-muted-foreground mb-2">Add players to your lineup to see chemistry analysis</div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
        
        {/* Right sidebar */}
        <div>
          <Card>
            <CardHeader>
              <CardTitle>Team Stats</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <div className="text-sm font-medium mb-1">Team Synergy</div>
                  <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                    <div 
                      className="bg-primary h-full" 
                      style={{ width: `${teamSynergy}%` }} 
                    />
                  </div>
                  <div className="flex justify-between text-xs mt-1">
                    <span>0</span>
                    <span>50</span>
                    <span>100</span>
                  </div>
                </div>
                
                <div>
                  <div className="text-sm font-medium mb-2">Role Coverage</div>
                  <div className="space-y-3">
                    <div>
                      <div className="text-xs font-semibold mb-1 text-amber-500">T Side</div>
                      <div className="grid grid-cols-2 gap-2">
                        {Object.values(PlayerRole).map(role => {
                          const hasRole = positions.some(p => p.player && 
                            (p.player.tRole === role));
                          
                          return (
                            <div key={`T-${role}`} className="flex items-center">
                              <div 
                                className={`w-3 h-3 rounded-full mr-2 ${
                                  hasRole ? 'bg-green-500' : 'bg-red-500'
                                }`} 
                              />
                              <div className="text-xs">{role}</div>
                            </div>
                          );
                        })}
                      </div>
                    </div>

                    <div>
                      <div className="text-xs font-semibold mb-1 text-blue-500">CT Side</div>
                      <div className="grid grid-cols-2 gap-2">
                        {Object.values(PlayerRole).map(role => {
                          const hasRole = positions.some(p => p.player && 
                            (p.player.ctRole === role));
                          
                          return (
                            <div key={`CT-${role}`} className="flex items-center">
                              <div 
                                className={`w-3 h-3 rounded-full mr-2 ${
                                  hasRole ? 'bg-green-500' : 'bg-red-500'
                                }`} 
                              />
                              <div className="text-xs">{role}</div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                </div>
                
                <div>
                  <div className="text-sm font-medium mb-1">Average PIV</div>
                  <div className="text-2xl font-bold">
                    {positions.some(p => p.player) ? 
                      (positions
                        .filter(p => p.player)
                        .reduce((sum, p) => sum + (p.player?.piv || 0), 0) / 
                        positions.filter(p => p.player).length
                      ).toFixed(2) : 
                      "0.00"
                    }
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card className="mt-4">
            <CardHeader>
              <CardTitle>Team Builder Tips</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3 text-sm">
                <div className="flex items-start">
                  <div className="w-3 h-3 rounded-full bg-green-500 mt-1 mr-2" />
                  <div>Every team needs at least one IGL and AWPer</div>
                </div>
                <div className="flex items-start">
                  <div className="w-3 h-3 rounded-full bg-green-500 mt-1 mr-2" />
                  <div>Balance roles between CT and T sides</div>
                </div>
                <div className="flex items-start">
                  <div className="w-3 h-3 rounded-full bg-green-500 mt-1 mr-2" />
                  <div>Higher synergy scores lead to better team performance</div>
                </div>
                <div className="flex items-start">
                  <div className="w-3 h-3 rounded-full bg-green-500 mt-1 mr-2" />
                  <div>Use "Auto-Optimize" for quick optimal lineup suggestions</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
      
      {/* Player search dialog */}
      <Dialog 
        open={isSearchDialogOpen} 
        onOpenChange={setIsSearchDialogOpen}
      >
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Find Players</DialogTitle>
            <DialogDescription>
              Search for players to add to your lineup
            </DialogDescription>
          </DialogHeader>
          
          <div className="my-4">
            <div className="relative mb-4">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search players..."
                className="pl-10"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            
            <div className="flex flex-wrap gap-2 mb-4">
              <Button 
                variant={roleFilter === "ANY" ? "default" : "outline"}
                size="sm"
                onClick={() => setRoleFilter("ANY")}
              >
                Any Role
              </Button>
              {Object.values(PlayerRole).map(role => (
                <Button 
                  key={role}
                  variant={roleFilter === role ? "default" : "outline"}
                  size="sm"
                  onClick={() => setRoleFilter(role)}
                >
                  {role}
                </Button>
              ))}
            </div>
            
            <div className="space-y-2 max-h-[300px] overflow-y-auto">
              {filteredPlayers.map((player) => (
                <div
                  key={player.id}
                  className="flex items-center border rounded-md p-2 hover:bg-accent cursor-pointer"
                  onClick={() => selectedPosition && handlePlayerSelect(selectedPosition, player)}
                >
                  <div className="w-8 h-8 rounded-full bg-white flex items-center justify-center text-black text-sm font-bold mr-3">
                    {Math.round(player.scoutMetrics.roleScore)}
                  </div>
                  <div className="flex-1">
                    <div className="font-medium">{player.name}</div>
                    <div className="text-xs text-muted-foreground">
                      <span>{player.team}</span>
                    </div>
                    <div className="text-xs flex items-center gap-2 mt-1">
                      <span className="text-amber-500 font-medium">T:</span>
                      <RoleBadge role={player.tRole} size="xs" />
                      <span className="text-blue-500 font-medium">CT:</span>
                      <RoleBadge role={player.ctRole} size="xs" />
                      {player.isIGL && <Badge variant="outline" className="text-xs ml-1">IGL</Badge>}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="grid grid-cols-2 gap-x-3 text-xs">
                      <div>Synergy</div>
                      <div>PIV</div>
                      <div className="font-medium">{player.scoutMetrics.synergy.toFixed(0)}</div>
                      <div className="font-medium">{player.piv.toFixed(2)}</div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="secondary" onClick={() => setIsSearchDialogOpen(false)}>
              Cancel
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
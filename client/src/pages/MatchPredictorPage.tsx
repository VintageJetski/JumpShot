import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { 
  Box, 
  TrendingUp, 
  BarChart, 
  Users, 
  Map, 
  Zap,
  AlignCenter
} from "lucide-react";
import { PlayerWithPIV, TeamWithTIR } from "@shared/schema";
import ConfidenceRatingSystem from "@/components/match-predictor/ConfidenceRatingSystem";

export default function MatchPredictorPage() {
  const [team1Id, setTeam1Id] = useState<string>("");
  const [team2Id, setTeam2Id] = useState<string>("");
  const [searchQuery1, setSearchQuery1] = useState<string>("");
  const [searchQuery2, setSearchQuery2] = useState<string>("");
  
  // Fetch teams
  const { data: teams = [], isLoading: isLoadingTeams } = useQuery<TeamWithTIR[]>({
    queryKey: ["/api/teams"],
  });
  
  // Fetch players for roster display
  const { data: allPlayers = [], isLoading: isLoadingPlayers } = useQuery<PlayerWithPIV[]>({
    queryKey: ["/api/players"],
  });
  
  // Filter players for selected teams
  const team1 = teams.find(t => t.id === team1Id);
  const team2 = teams.find(t => t.id === team2Id);
  
  const team1Players = allPlayers.filter(p => p.team === team1?.name);
  const team2Players = allPlayers.filter(p => p.team === team2?.name);
  
  // Auto-select first two teams if none selected
  if (teams.length >= 2 && !team1Id && !team2Id) {
    // Find two teams that aren't the same
    const firstTeam = teams[0];
    const secondTeam = teams[1];
    
    setTeam1Id(firstTeam.id);
    setTeam2Id(secondTeam.id);
  }
  
  // If loading, show skeleton UI
  if (isLoadingTeams || isLoadingPlayers) {
    return (
      <div className="container mx-auto py-6 space-y-6 px-4">
        <h1 className="text-3xl font-bold">Match Predictor</h1>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Skeleton className="h-[300px] w-full rounded-lg" />
          <Skeleton className="h-[300px] w-full rounded-lg" />
        </div>
        <Skeleton className="h-[200px] w-full rounded-lg" />
      </div>
    );
  }
  
  return (
    <div className="container mx-auto py-6 space-y-6 px-4 min-h-screen">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold flex items-center">
            <BarChart className="mr-2 h-8 w-8 text-primary" />
            Match Predictor
          </h1>
          <p className="text-gray-400 mt-1">
            Advanced match prediction with confidence rating system
          </p>
        </div>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Team Selection Section */}
        <div className="lg:col-span-8 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Team Selection</CardTitle>
              <CardDescription>
                Select two teams to predict match outcome
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Team 1 Selection */}
                <div className="space-y-4">
                  <h3 className="font-medium">Team 1</h3>
                  
                  <div className="space-y-2">
                    <Input
                      placeholder="Search teams..."
                      value={searchQuery1}
                      onChange={(e) => setSearchQuery1(e.target.value)}
                      className="mb-2"
                    />
                    
                    <div className="h-48 overflow-y-auto rounded-md border border-gray-700 bg-background p-2">
                      {teams
                        .filter(t => 
                          t.name.toLowerCase().includes(searchQuery1.toLowerCase())
                        )
                        .map(team => (
                          <div
                            key={team.id}
                            className={`flex items-center justify-between p-2 rounded-md cursor-pointer hover:bg-gray-800 ${
                              team1Id === team.id ? 'bg-blue-950 border border-blue-500' : ''
                            }`}
                            onClick={() => setTeam1Id(team.id)}
                          >
                            <div className="flex items-center gap-3">
                              <div className="w-8 h-8 rounded-full bg-blue-900/30 flex items-center justify-center text-xs font-medium">
                                {team.name.substring(0, 2)}
                              </div>
                              <div>
                                <div className="font-medium text-sm">{team.name}</div>
                                <div className="text-xs text-gray-400">TIR: {team.tir.toFixed(2)}</div>
                              </div>
                            </div>
                          </div>
                        ))}
                    </div>
                  </div>
                  
                  {team1 && (
                    <div className="p-3 rounded-lg bg-gray-800/50">
                      <div className="flex items-center gap-3 mb-3">
                        <div className="w-10 h-10 rounded-full bg-blue-900/50 flex items-center justify-center text-sm font-medium">
                          {team1.name.substring(0, 2)}
                        </div>
                        <div>
                          <div className="font-medium">{team1.name}</div>
                          <div className="text-sm text-gray-400">
                            Team Impact Rating: {team1.tir.toFixed(2)}
                          </div>
                        </div>
                      </div>
                      
                      <div className="mt-3">
                        <div className="text-xs text-gray-400 mb-1">Core Players:</div>
                        <div className="flex flex-wrap gap-1">
                          {team1Players.slice(0, 5).map(player => (
                            <Badge key={player.id} variant="outline" className="bg-blue-900/20">
                              {player.name}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
                
                {/* Team 2 Selection */}
                <div className="space-y-4">
                  <h3 className="font-medium">Team 2</h3>
                  
                  <div className="space-y-2">
                    <Input
                      placeholder="Search teams..."
                      value={searchQuery2}
                      onChange={(e) => setSearchQuery2(e.target.value)}
                      className="mb-2"
                    />
                    
                    <div className="h-48 overflow-y-auto rounded-md border border-gray-700 bg-background p-2">
                      {teams
                        .filter(t => 
                          t.name.toLowerCase().includes(searchQuery2.toLowerCase())
                        )
                        .map(team => (
                          <div
                            key={team.id}
                            className={`flex items-center justify-between p-2 rounded-md cursor-pointer hover:bg-gray-800 ${
                              team2Id === team.id ? 'bg-blue-950 border border-blue-500' : ''
                            }`}
                            onClick={() => setTeam2Id(team.id)}
                          >
                            <div className="flex items-center gap-3">
                              <div className="w-8 h-8 rounded-full bg-blue-900/30 flex items-center justify-center text-xs font-medium">
                                {team.name.substring(0, 2)}
                              </div>
                              <div>
                                <div className="font-medium text-sm">{team.name}</div>
                                <div className="text-xs text-gray-400">TIR: {team.tir.toFixed(2)}</div>
                              </div>
                            </div>
                          </div>
                        ))}
                    </div>
                  </div>
                  
                  {team2 && (
                    <div className="p-3 rounded-lg bg-gray-800/50">
                      <div className="flex items-center gap-3 mb-3">
                        <div className="w-10 h-10 rounded-full bg-blue-900/50 flex items-center justify-center text-sm font-medium">
                          {team2.name.substring(0, 2)}
                        </div>
                        <div>
                          <div className="font-medium">{team2.name}</div>
                          <div className="text-sm text-gray-400">
                            Team Impact Rating: {team2.tir.toFixed(2)}
                          </div>
                        </div>
                      </div>
                      
                      <div className="mt-3">
                        <div className="text-xs text-gray-400 mb-1">Core Players:</div>
                        <div className="flex flex-wrap gap-1">
                          {team2Players.slice(0, 5).map(player => (
                            <Badge key={player.id} variant="outline" className="bg-blue-900/20">
                              {player.name}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
          
          {/* Confidence Rating System */}
          {team1 && team2 && (
            <ConfidenceRatingSystem 
              teamA={team1}
              teamB={team2}
              playersA={team1Players}
              playersB={team2Players}
            />
          )}
        </div>
        
        {/* Supplementary prediction tools */}
        <div className="lg:col-span-4 space-y-6">
          {team1 && team2 && (
            <>
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Zap className="h-5 w-5 text-yellow-400" />
                    Key Win Factors
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {/* Team 1 Strengths */}
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <div className="h-6 w-6 bg-blue-900/30 rounded-full flex items-center justify-center text-xs">
                          {team1.name.substring(0, 2)}
                        </div>
                        <span className="text-sm font-medium">{team1.name} Strengths</span>
                      </div>
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <TrendingUp className="h-4 w-4 text-green-500" />
                          <span className="text-xs">Strong {getTeamStrength(team1)}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Users className="h-4 w-4 text-green-500" />
                          <span className="text-xs">{getRoleStrength(team1Players)}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Map className="h-4 w-4 text-green-500" />
                          <span className="text-xs">{getMapStrength(team1)}</span>
                        </div>
                      </div>
                    </div>
                    
                    <Separator />
                    
                    {/* Team 2 Strengths */}
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <div className="h-6 w-6 bg-blue-900/30 rounded-full flex items-center justify-center text-xs">
                          {team2.name.substring(0, 2)}
                        </div>
                        <span className="text-sm font-medium">{team2.name} Strengths</span>
                      </div>
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <TrendingUp className="h-4 w-4 text-green-500" />
                          <span className="text-xs">Strong {getTeamStrength(team2)}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Users className="h-4 w-4 text-green-500" />
                          <span className="text-xs">{getRoleStrength(team2Players)}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Map className="h-4 w-4 text-green-500" />
                          <span className="text-xs">{getMapStrength(team2)}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Box className="h-5 w-5 text-primary" />
                    Map Selection
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <Select>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a map" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="de_inferno">Inferno</SelectItem>
                        <SelectItem value="de_mirage">Mirage</SelectItem>
                        <SelectItem value="de_nuke">Nuke</SelectItem>
                        <SelectItem value="de_overpass">Overpass</SelectItem>
                        <SelectItem value="de_ancient">Ancient</SelectItem>
                        <SelectItem value="de_vertigo">Vertigo</SelectItem>
                        <SelectItem value="de_anubis">Anubis</SelectItem>
                      </SelectContent>
                    </Select>
                    
                    <div className="p-3 bg-gray-800/30 rounded-lg">
                      <div className="flex items-center justify-between gap-2 mb-2">
                        <div className="flex items-center gap-2">
                          <div className="h-6 w-6 bg-blue-900/30 rounded-full flex items-center justify-center text-xs">
                            {team1.name.substring(0, 2)}
                          </div>
                          <span className="text-xs font-medium">{team1.name}</span>
                        </div>
                        <span className="text-xs font-medium">vs</span>
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-medium">{team2.name}</span>
                          <div className="h-6 w-6 bg-blue-900/30 rounded-full flex items-center justify-center text-xs">
                            {team2.name.substring(0, 2)}
                          </div>
                        </div>
                      </div>
                      
                      <div className="text-center text-xs text-gray-400">
                        Select a map to see detailed predictions
                      </div>
                    </div>
                    
                    <Button className="w-full" variant="secondary">
                      <AlignCenter className="h-4 w-4 mr-2" />
                      Run Map Analysis
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

// Helper functions to generate strengths based on team data
function getTeamStrength(team: TeamWithTIR): string {
  // In a real implementation, this would be based on actual team metrics
  const strengths = [
    "T-side executes",
    "CT-side defense",
    "pistol round performance",
    "team coordination",
    "economy management",
    "clutch situations",
    "mid-round adaptability"
  ];
  
  // Use team ID to ensure consistent strength for the same team
  const strengthIndex = team.id.charCodeAt(0) % strengths.length;
  return strengths[strengthIndex];
}

function getRoleStrength(players: PlayerWithPIV[]): string {
  if (players.length === 0) return "Balanced roster composition";
  
  // In a real implementation, would analyze player roles and metrics
  const hasStar = players.some(p => p.piv > 1.5);
  const hasIGL = players.some(p => p.isIGL);
  const hasAWP = players.some(p => p.role === 'AWP');
  
  if (hasStar && hasIGL) return "Strong IGL with star player support";
  if (hasStar && hasAWP) return "Elite AWP presence and firepower";
  if (hasIGL) return "Tactically-minded roster";
  if (hasAWP) return "Strong AWP fundamentals";
  
  return "Balanced roster composition";
}

function getMapStrength(team: TeamWithTIR): string {
  // In a real implementation, would be based on map win rates
  const maps = [
    "Inferno",
    "Mirage", 
    "Nuke",
    "Overpass", 
    "Ancient",
    "Vertigo", 
    "Anubis"
  ];
  
  // Use team ID to ensure consistent map for the same team
  const mapIndex = (team.id.charCodeAt(0) + team.id.charCodeAt(1)) % maps.length;
  return `${maps[mapIndex]} specialist`;
}
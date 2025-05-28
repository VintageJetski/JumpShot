import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle,
  CardFooter
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
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Progress } from "@/components/ui/progress";
import { 
  Box, 
  TrendingUp, 
  BarChart, 
  Users, 
  Map, 
  Zap,
  AlignCenter,
  ChevronRight,
  Percent,
  Gauge,
  Award,
  Shield,
  Target,
  Eye
} from "lucide-react";
import { PlayerWithPIV, TeamWithTIR } from "@shared/schema";
import ConfidenceRatingSystem from "@/components/match-predictor/ConfidenceRatingSystem";
import { cn } from "@/lib/utils";

// Helper component for toggle options
function ToggleOption({ 
  label, 
  isActive, 
  onChange 
}: { 
  label: string;
  isActive: boolean;
  onChange: () => void;
}) {
  return (
    <button 
      className={`px-3 py-1 text-xs rounded-full ${isActive ? 'bg-blue-900/40 text-blue-200 border border-blue-500/50' : 'bg-gray-800 text-gray-400'}`}
      onClick={onChange}
    >
      {label}
    </button>
  );
}

// Calculate average PIV of a team's players
function calculateAvgPIV(players: PlayerWithPIV[]): number {
  if (players.length === 0) return 1.0;
  
  const sum = players.reduce((acc, player) => acc + player.piv, 0);
  return sum / players.length;
}

// Calculate role coverage percentage (how well team covers necessary roles)
function calculateRoleCoverage(players: PlayerWithPIV[]): number {
  if (players.length === 0) return 50;
  
  // Check for necessary roles
  const hasIGL = players.some(p => p.isIGL);
  const hasAWP = players.some(p => p.role === "AWP");
  const hasEntry = players.some(p => p.role === "Spacetaker" || p.tRole === "Spacetaker");
  const hasSupport = players.some(p => p.role === "Support" || p.tRole === "Support");
  const hasLurker = players.some(p => p.role === "Lurker" || p.tRole === "Lurker");
  
  // Calculate percentage
  let coverage = 60; // Base coverage
  if (hasIGL) coverage += 10;
  if (hasAWP) coverage += 10;
  if (hasEntry) coverage += 7;
  if (hasSupport) coverage += 7;
  if (hasLurker) coverage += 6;
  
  return Math.min(100, coverage);
}

// Calculate win probability based on team data and contextual factors
function calculateWinProbability(
  team1: TeamWithTIR,
  team2: TeamWithTIR,
  team1Players: PlayerWithPIV[],
  team2Players: PlayerWithPIV[],
  contextualFactors: {
    recentForm: number;
    headToHead: number;
    mapSelection: number;
    tournamentTier: number;
  }
): number {
  // Base probability using TIR
  let baseProb = team1.tir / (team1.tir + team2.tir);
  
  // Adjust for Average PIV (15% weight)
  const team1AvgPIV = calculateAvgPIV(team1Players);
  const team2AvgPIV = calculateAvgPIV(team2Players);
  const pivRatio = team1AvgPIV / (team1AvgPIV + team2AvgPIV);
  
  // Adjust for role coverage (15% weight)
  const team1RoleCoverage = calculateRoleCoverage(team1Players);
  const team2RoleCoverage = calculateRoleCoverage(team2Players);
  const roleRatio = team1RoleCoverage / (team1RoleCoverage + team2RoleCoverage);
  
  // Calculate weighted base probability
  baseProb = baseProb * 0.7 + pivRatio * 0.15 + roleRatio * 0.15;
  
  // Adjust for contextual factors (each 5% weight)
  // Transform 0-100 scale to -0.1 to 0.1 adjustment
  const recentFormAdjust = ((contextualFactors.recentForm - 50) / 500);
  const headToHeadAdjust = ((contextualFactors.headToHead - 50) / 500);
  const mapSelectionAdjust = ((contextualFactors.mapSelection - 50) / 500);
  
  // Tournament tier has an impact on consistency (higher tier = closer to baseline)
  const tournamentTierImpact = contextualFactors.tournamentTier / 100;
  
  // Apply adjustments with diminishing returns for extreme values
  let adjustedProb = baseProb + recentFormAdjust + headToHeadAdjust + mapSelectionAdjust;
  
  // Tournament tier affects how much the predictions can deviate from 50/50
  // Higher tier tournaments tend to have less upsets
  adjustedProb = 0.5 + (adjustedProb - 0.5) * (0.7 + 0.3 * tournamentTierImpact);
  
  // Ensure probability is between 0 and 100
  adjustedProb = Math.max(0.05, Math.min(0.95, adjustedProb));
  
  // Convert to percentage
  return adjustedProb * 100;
}

// Get tournament tier name from numerical value
function getTournamentTier(value: number): string {
  if (value >= 75) return "S-Tier Major";
  if (value >= 50) return "A-Tier";
  if (value >= 25) return "B-Tier";
  return "C-Tier";
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

export default function MatchPredictorPage() {
  const [team1Id, setTeam1Id] = useState<string>("");
  const [team2Id, setTeam2Id] = useState<string>("");
  const [searchQuery1, setSearchQuery1] = useState<string>("");
  const [searchQuery2, setSearchQuery2] = useState<string>("");
  const [selectedMap, setSelectedMap] = useState<string>(""); 
  const [analysisTab, setAnalysisTab] = useState<string>("confidence");
  const [contextualFactors, setContextualFactors] = useState({
    recentForm: 50,
    headToHead: 50,
    mapSelection: 50, 
    tournamentTier: 50
  });
  const [advancedOptions, setAdvancedOptions] = useState({
    psychologyFactors: true,
    tournamentContext: true,
    roleSpecificMatchups: true
  });
  
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
  
  const playersArray = Array.isArray(allPlayers) ? allPlayers : (allPlayers?.players || []);
  const team1Players = playersArray.filter(p => p.team === team1?.name);
  const team2Players = playersArray.filter(p => p.team === team2?.name);
  
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
          
          {/* Analysis View with Tabs - Original prediction AND confidence rating */}
          {team1 && team2 && (
            <Tabs defaultValue="confidence" className="w-full" value={analysisTab} onValueChange={setAnalysisTab}>
              <TabsList className="grid grid-cols-3 mb-4">
                <TabsTrigger value="confidence" className="flex items-center gap-1">
                  <Gauge className="h-4 w-4" />
                  <span>Confidence Rating</span>
                </TabsTrigger>
                <TabsTrigger value="prediction" className="flex items-center gap-1">
                  <Percent className="h-4 w-4" />
                  <span>Prediction</span>
                </TabsTrigger>
                <TabsTrigger value="contextual" className="flex items-center gap-1">
                  <Shield className="h-4 w-4" />
                  <span>Contextual Factors</span>
                </TabsTrigger>
              </TabsList>
              
              <TabsContent value="confidence" className="space-y-4 mt-0">
                <ConfidenceRatingSystem 
                  teamA={team1}
                  teamB={team2}
                  playersA={team1Players}
                  playersB={team2Players}
                />
              </TabsContent>
              
              <TabsContent value="prediction" className="space-y-4 mt-0">
                <Card className="border-blue-900/30 glassmorphism">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-lg font-bold flex items-center gap-2">
                      <Percent className="h-5 w-5 text-blue-400" />
                      Match Prediction
                    </CardTitle>
                    <CardDescription>
                      Base prediction using Team Impact Ratings and role weights
                    </CardDescription>
                  </CardHeader>
                  
                  <CardContent>
                    <div className="space-y-8">
                      {/* Prediction Display */}
                      <div className="grid grid-cols-5 gap-2 items-center">
                        {/* Team 1 */}
                        <div className="col-span-2 text-center">
                          <div className="h-16 w-16 rounded-full bg-blue-900/40 flex items-center justify-center text-lg font-bold mx-auto">
                            {team1.name.substring(0, 2)}
                          </div>
                          <div className="mt-2 font-medium">{team1.name}</div>
                          <div className="text-2xl font-bold mt-1 bg-gradient-to-r from-blue-400 to-blue-600 bg-clip-text text-transparent">
                            {calculateWinProbability(team1, team2, team1Players, team2Players, contextualFactors).toFixed(1)}%
                          </div>
                        </div>
                        
                        {/* VS */}
                        <div className="flex flex-col items-center justify-center">
                          <div className="text-xl font-bold">VS</div>
                          <div className="h-0.5 w-16 bg-gray-700 my-2"></div>
                          <div className="text-xs text-gray-400">{selectedMap || "All Maps"}</div>
                        </div>
                        
                        {/* Team 2 */}
                        <div className="col-span-2 text-center">
                          <div className="h-16 w-16 rounded-full bg-blue-900/40 flex items-center justify-center text-lg font-bold mx-auto">
                            {team2.name.substring(0, 2)}
                          </div>
                          <div className="mt-2 font-medium">{team2.name}</div>
                          <div className="text-2xl font-bold mt-1 bg-gradient-to-r from-purple-400 to-purple-600 bg-clip-text text-transparent">
                            {(100 - calculateWinProbability(team1, team2, team1Players, team2Players, contextualFactors)).toFixed(1)}%
                          </div>
                        </div>
                      </div>
                      
                      {/* Prediction Factors */}
                      <div>
                        <h3 className="text-sm font-medium mb-3">Prediction Factors</h3>
                        <div className="space-y-3">
                          <div className="space-y-1">
                            <div className="flex justify-between text-xs">
                              <span>Team Impact Rating</span>
                              <div className="flex items-center gap-2">
                                <span>{team1.tir.toFixed(2)}</span>
                                <span className="text-gray-500">vs</span>
                                <span>{team2.tir.toFixed(2)}</span>
                              </div>
                            </div>
                            <div className="h-1.5 w-full bg-gray-800 rounded-full overflow-hidden">
                              <div 
                                className="h-full bg-blue-500" 
                                style={{ 
                                  width: `${(team1.tir / (team1.tir + team2.tir)) * 100}%` 
                                }}
                              ></div>
                            </div>
                          </div>
                          
                          <div className="space-y-1">
                            <div className="flex justify-between text-xs">
                              <span>Average PIV</span>
                              <div className="flex items-center gap-2">
                                <span>{calculateAvgPIV(team1Players).toFixed(2)}</span>
                                <span className="text-gray-500">vs</span>
                                <span>{calculateAvgPIV(team2Players).toFixed(2)}</span>
                              </div>
                            </div>
                            <div className="h-1.5 w-full bg-gray-800 rounded-full overflow-hidden">
                              <div 
                                className="h-full bg-blue-500" 
                                style={{ 
                                  width: `${(calculateAvgPIV(team1Players) / (calculateAvgPIV(team1Players) + calculateAvgPIV(team2Players))) * 100}%` 
                                }}
                              ></div>
                            </div>
                          </div>
                          
                          <div className="space-y-1">
                            <div className="flex justify-between text-xs">
                              <span>Role Coverage</span>
                              <div className="flex items-center gap-2">
                                <span>{calculateRoleCoverage(team1Players).toFixed(1)}%</span>
                                <span className="text-gray-500">vs</span>
                                <span>{calculateRoleCoverage(team2Players).toFixed(1)}%</span>
                              </div>
                            </div>
                            <div className="h-1.5 w-full bg-gray-800 rounded-full overflow-hidden">
                              <div 
                                className="h-full bg-blue-500" 
                                style={{ 
                                  width: `${(calculateRoleCoverage(team1Players) / (calculateRoleCoverage(team1Players) + calculateRoleCoverage(team2Players))) * 100}%` 
                                }}
                              ></div>
                            </div>
                          </div>
                        </div>
                      </div>
                      
                      {/* Predicted Score */}
                      <div className="pt-4 border-t border-gray-800">
                        <h3 className="text-sm font-medium mb-2">Predicted Score (BO3)</h3>
                        <div className="flex items-center justify-center gap-3 text-sm">
                          <div className={`px-3 py-1 rounded-full ${calculateWinProbability(team1, team2, team1Players, team2Players, contextualFactors) > 60 ? 'bg-blue-900/50 text-blue-200' : 'bg-gray-800 text-gray-300'}`}>
                            {team1.name} 2-0
                          </div>
                          <div className={`px-3 py-1 rounded-full ${calculateWinProbability(team1, team2, team1Players, team2Players, contextualFactors) > 40 && calculateWinProbability(team1, team2, team1Players, team2Players, contextualFactors) <= 60 ? 'bg-blue-900/50 text-blue-200' : 'bg-gray-800 text-gray-300'}`}>
                            2-1 (close)
                          </div>
                          <div className={`px-3 py-1 rounded-full ${calculateWinProbability(team1, team2, team1Players, team2Players, contextualFactors) <= 40 ? 'bg-blue-900/50 text-blue-200' : 'bg-gray-800 text-gray-300'}`}>
                            {team2.name} 2-0
                          </div>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
              
              <TabsContent value="contextual" className="space-y-4 mt-0">
                <Card className="border-blue-900/30 glassmorphism">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-lg font-bold flex items-center gap-2">
                      <Shield className="h-5 w-5 text-blue-400" />
                      Contextual Adjustment Factors
                    </CardTitle>
                    <CardDescription>
                      Fine-tune prediction by adjusting contextual factors
                    </CardDescription>
                  </CardHeader>
                  
                  <CardContent className="space-y-5">
                    <div className="space-y-5">
                      {/* Recent Form */}
                      <div className="space-y-2">
                        <div className="flex justify-between">
                          <div className="flex items-center gap-2">
                            <TrendingUp className="h-4 w-4 text-blue-400" />
                            <span className="text-sm font-medium">Recent Form</span>
                          </div>
                          <div className="flex items-center gap-2 text-xs">
                            <span className="text-blue-300">{team1.name}</span>
                            <span className="text-xs text-gray-500">-</span>
                            <span className="text-purple-300">{team2.name}</span>
                          </div>
                        </div>
                        <div className="flex items-center gap-4">
                          <span className="text-xs text-gray-400">Favor {team2.name}</span>
                          <div className="flex-1">
                            <input
                              type="range"
                              min="0"
                              max="100"
                              value={contextualFactors.recentForm}
                              onChange={(e) => setContextualFactors({
                                ...contextualFactors,
                                recentForm: parseInt(e.target.value)
                              })}
                              className="w-full"
                            />
                          </div>
                          <span className="text-xs text-gray-400">Favor {team1.name}</span>
                        </div>
                      </div>
                      
                      {/* Head-to-Head History */}
                      <div className="space-y-2">
                        <div className="flex justify-between">
                          <div className="flex items-center gap-2">
                            <Users className="h-4 w-4 text-blue-400" />
                            <span className="text-sm font-medium">Head-to-Head History</span>
                          </div>
                          <div className="text-xs text-gray-400">{contextualFactors.headToHead}%</div>
                        </div>
                        <div className="flex items-center gap-4">
                          <span className="text-xs text-gray-400">Favor {team2.name}</span>
                          <div className="flex-1">
                            <input
                              type="range"
                              min="0"
                              max="100"
                              value={contextualFactors.headToHead}
                              onChange={(e) => setContextualFactors({
                                ...contextualFactors,
                                headToHead: parseInt(e.target.value)
                              })}
                              className="w-full"
                            />
                          </div>
                          <span className="text-xs text-gray-400">Favor {team1.name}</span>
                        </div>
                      </div>
                      
                      {/* Map Selection Advantage */}
                      <div className="space-y-2">
                        <div className="flex justify-between">
                          <div className="flex items-center gap-2">
                            <Map className="h-4 w-4 text-blue-400" />
                            <span className="text-sm font-medium">Map Selection Advantage</span>
                          </div>
                          <div className="text-xs text-gray-400">{contextualFactors.mapSelection}%</div>
                        </div>
                        <div className="flex items-center gap-4">
                          <span className="text-xs text-gray-400">Favor {team2.name}</span>
                          <div className="flex-1">
                            <input
                              type="range"
                              min="0"
                              max="100"
                              value={contextualFactors.mapSelection}
                              onChange={(e) => setContextualFactors({
                                ...contextualFactors,
                                mapSelection: parseInt(e.target.value)
                              })}
                              className="w-full"
                            />
                          </div>
                          <span className="text-xs text-gray-400">Favor {team1.name}</span>
                        </div>
                      </div>
                      
                      {/* Tournament Tier */}
                      <div className="space-y-2">
                        <div className="flex justify-between">
                          <div className="flex items-center gap-2">
                            <Award className="h-4 w-4 text-blue-400" />
                            <span className="text-sm font-medium">Tournament Tier</span>
                          </div>
                          <div className="text-xs">
                            {getTournamentTier(contextualFactors.tournamentTier)}
                          </div>
                        </div>
                        <div className="flex items-center gap-4">
                          <span className="text-xs text-gray-400">C-Tier</span>
                          <div className="flex-1">
                            <input
                              type="range"
                              min="0"
                              max="100"
                              value={contextualFactors.tournamentTier}
                              onChange={(e) => setContextualFactors({
                                ...contextualFactors,
                                tournamentTier: parseInt(e.target.value)
                              })}
                              className="w-full"
                            />
                          </div>
                          <span className="text-xs text-gray-400">S-Tier</span>
                        </div>
                      </div>
                    </div>
                    
                    {/* Advanced Options */}
                    <div className="pt-4 border-t border-gray-800">
                      <h3 className="text-sm font-medium mb-3">Advanced Options</h3>
                      <div className="flex flex-wrap gap-3">
                        <ToggleOption 
                          label="Psychology Factors" 
                          isActive={advancedOptions.psychologyFactors}
                          onChange={() => setAdvancedOptions({
                            ...advancedOptions,
                            psychologyFactors: !advancedOptions.psychologyFactors
                          })}
                        />
                        <ToggleOption 
                          label="Tournament Context" 
                          isActive={advancedOptions.tournamentContext}
                          onChange={() => setAdvancedOptions({
                            ...advancedOptions,
                            tournamentContext: !advancedOptions.tournamentContext
                          })}
                        />
                        <ToggleOption 
                          label="Role-specific Matchups" 
                          isActive={advancedOptions.roleSpecificMatchups}
                          onChange={() => setAdvancedOptions({
                            ...advancedOptions,
                            roleSpecificMatchups: !advancedOptions.roleSpecificMatchups
                          })}
                        />
                      </div>
                    </div>
                  </CardContent>
                  
                  <CardFooter>
                    <Button className="w-full" onClick={() => setAnalysisTab("prediction")}>
                      <Eye className="h-4 w-4 mr-2" />
                      Apply and View Prediction
                    </Button>
                  </CardFooter>
                </Card>
              </TabsContent>
            </Tabs>
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
                    <Select onValueChange={setSelectedMap} value={selectedMap}>
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
import { useState, useEffect, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { PlayerWithPIV, TeamWithTIR, PlayerRole } from "@shared/schema";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { SearchSelect, SearchOption } from "@/components/ui/search-select";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  Legend,
} from 'recharts';
import {
  ArrowRightLeft,
  Award,
  Brain,
  ChevronRight,
  Clock,
  ExternalLink,
  GanttChart,
  Info,
  Map,
  Percent,
  Shield,
  Trophy,
  Users
} from "lucide-react";

const MAPS = ["Mirage", "Inferno", "Nuke", "Ancient", "Anubis", "Overpass", "Vertigo"];

interface TeamStats {
  name: string;
  tir: number;
  players: PlayerWithPIV[];
  avgPIV: number;
  synergy: number;
  mapPerformance: { [key: string]: number };
  roleCoverage: number;
}

interface MatchPrediction {
  team1WinProbability: number;
  team2WinProbability: number;
  confidenceScore: number;
  keyFactors: {
    name: string;
    team1Value: number;
    team2Value: number;
    weight: number;
    favorsTeam: number; // 1 = team1, 2 = team2, 0 = neutral
  }[];
  predictedScore: {
    team1: number;
    team2: number;
  };
  keyPlayers: {
    team1: {
      player: PlayerWithPIV;
      impactScore: number;
    }[];
    team2: {
      player: PlayerWithPIV;
      impactScore: number;
    }[];
  };
  mapAdvantages: {
    [key: string]: number; // 1 = team1, 2 = team2, 0 = neutral
  };
}

export default function MatchPredictorPage() {
  const [team1Id, setTeam1Id] = useState<string>("");
  const [team2Id, setTeam2Id] = useState<string>("");
  const [selectedMap, setSelectedMap] = useState<string>("Inferno");
  const [adjustmentFactors, setAdjustmentFactors] = useState({
    recentForm: 50, // 0-100 slider for team1's recent form (50 = neutral)
    headToHead: 50, // 0-100 slider for team1's head-to-head record (50 = neutral)
    mapVeto: 50,    // 0-100 slider for team1's map selection advantage (50 = neutral)
    tournamentTier: 50, // 0-100 slider for tournament tier and significance
  });
  const [advancedOptions, setAdvancedOptions] = useState({
    enablePsychologyFactors: true,
    useTournamentContext: true,
    useRoleMatchups: true,
  });
  
  const { data: teams = [], isLoading: teamsLoading } = useQuery<TeamWithTIR[]>({
    queryKey: ["/api/teams"],
    staleTime: 1000 * 60 * 5, // 5 minutes
    refetchOnMount: true,
    refetchOnWindowFocus: false
  });
  
  const { data: players = [], isLoading: playersLoading } = useQuery<PlayerWithPIV[]>({
    queryKey: ["/api/players"],
    staleTime: 1000 * 60 * 5, // 5 minutes
    refetchOnMount: true,
    refetchOnWindowFocus: false
  });
  
  // Select first two teams if none selected
  useEffect(() => {
    if (teams.length >= 2 && !team1Id && !team2Id) {
      // Find two teams with highest TIR
      const sortedTeams = [...teams].sort((a, b) => b.tir - a.tir);
      setTeam1Id(sortedTeams[0].id);
      setTeam2Id(sortedTeams[1].id);
    }
  }, [teams, team1Id, team2Id]);
  
  // Get selected teams' data
  const team1 = useMemo(() => 
    teams.find(t => t.id === team1Id), [teams, team1Id]
  );
  
  const team2 = useMemo(() => 
    teams.find(t => t.id === team2Id), [teams, team2Id]
  );

  // Debug functions
  const testDirectApiCall = async () => {
    try {
      const response = await fetch('/api/teams');
      const data = await response.json();
      console.log('Direct fetch response:', data);
      alert(`Directly fetched ${data.length} teams: ${data.map((t: TeamWithTIR) => t.name).join(', ')}`);
    } catch (error: unknown) {
      console.error('Direct fetch error:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      alert(`Error: ${errorMessage}`);
    }
  };

  // Generate synthetic map performance data for demo
  // In a real system, this would come from map-specific stats
  const getTeamMapPerformance = (teamName: string): { [key: string]: number } => {
    const randomSeed = teamName.split("").reduce((acc, char) => acc + char.charCodeAt(0), 0);
    
    return MAPS.reduce((acc, map) => {
      // Generate pseudo-random values seeded by team name
      // This ensures consistency across renders but gives unique values per team
      const baseValue = ((randomSeed + map.length) % 25) / 100;
      const randomComponent = Math.sin(randomSeed * map.charCodeAt(0)) * 0.15;
      // 0.5 to 0.85 range for win rates
      const value = Math.max(0.5, Math.min(0.85, 0.65 + baseValue + randomComponent));
      
      acc[map] = parseFloat(value.toFixed(2));
      return acc;
    }, {} as { [key: string]: number });
  };
  
  // Build enhanced team stats objects with additional analytical metrics
  const enhancedTeamStats: { [key: string]: TeamStats } = useMemo(() => {
    if (!teams.length || !players.length) return {};
    
    return teams.reduce((acc, team) => {
      const teamPlayers = players.filter(p => p.team === team.name);
      
      const roleCoverage = calculateRoleCoverage(teamPlayers);
      
      acc[team.id] = {
        name: team.name,
        tir: team.tir,
        players: teamPlayers,
        avgPIV: team.avgPIV,
        synergy: team.synergy,
        mapPerformance: getTeamMapPerformance(team.name),
        roleCoverage,
      };
      
      return acc;
    }, {} as { [key: string]: TeamStats });
  }, [teams, players]);
  
  // Calculate how well a team covers all key roles
  function calculateRoleCoverage(teamPlayers: PlayerWithPIV[]): number {
    const roles = Object.values(PlayerRole);
    const coveredRoles = new Set(teamPlayers.map(p => p.role));
    
    // Base coverage percentage
    const basePercentage = (coveredRoles.size / roles.length) * 100;
    
    // Check quality of role coverage (are role players actually good at their roles?)
    const qualityModifier = teamPlayers.reduce((acc, player) => {
      const roleScore = player.metrics.roleScores[player.role] || 0.5;
      return acc + (roleScore - 0.5) * 10; // -5 to +5 range per player
    }, 0);
    
    // Calculate final coverage score (0-100)
    return Math.min(100, Math.max(0, basePercentage + qualityModifier));
  }
  
  // Run match prediction algorithm when teams are selected
  const prediction = useMemo<MatchPrediction | null>(() => {
    if (!team1 || !team2 || !enhancedTeamStats[team1.id] || !enhancedTeamStats[team2.id]) 
      return null;
    
    const team1Stats = enhancedTeamStats[team1.id];
    const team2Stats = enhancedTeamStats[team2.id];
    
    // Core predictive factors with weights
    const factors = [
      {
        name: "Team Impact Rating",
        team1Value: team1Stats.tir,
        team2Value: team2Stats.tir,
        weight: 0.30,
        favorsTeam: team1Stats.tir > team2Stats.tir ? 1 : team1Stats.tir < team2Stats.tir ? 2 : 0
      },
      {
        name: "Average PIV",
        team1Value: team1Stats.avgPIV * 100,
        team2Value: team2Stats.avgPIV * 100,
        weight: 0.15,
        favorsTeam: team1Stats.avgPIV > team2Stats.avgPIV ? 1 : team1Stats.avgPIV < team2Stats.avgPIV ? 2 : 0
      },
      {
        name: "Team Synergy",
        team1Value: team1Stats.synergy * 100,
        team2Value: team2Stats.synergy * 100,
        weight: 0.20,
        favorsTeam: team1Stats.synergy > team2Stats.synergy ? 1 : team1Stats.synergy < team2Stats.synergy ? 2 : 0
      },
      {
        name: "Map Win Rate",
        team1Value: (team1Stats.mapPerformance[selectedMap] || 0.5) * 100,
        team2Value: (team2Stats.mapPerformance[selectedMap] || 0.5) * 100,
        weight: 0.20,
        favorsTeam: (team1Stats.mapPerformance[selectedMap] || 0.5) > (team2Stats.mapPerformance[selectedMap] || 0.5) ? 1 
          : (team1Stats.mapPerformance[selectedMap] || 0.5) < (team2Stats.mapPerformance[selectedMap] || 0.5) ? 2 : 0
      },
      {
        name: "Role Coverage",
        team1Value: team1Stats.roleCoverage,
        team2Value: team2Stats.roleCoverage,
        weight: 0.15,
        favorsTeam: team1Stats.roleCoverage > team2Stats.roleCoverage ? 1 
          : team1Stats.roleCoverage < team2Stats.roleCoverage ? 2 : 0
      }
    ];
    
    // Apply external adjustment factors
    const applyAdjustmentFactor = (baseProb: number, factor: number, weight: number) => {
      // Convert 0-100 slider to -0.2 to +0.2 effect
      const effect = ((factor - 50) / 50) * 0.2;
      return baseProb + (effect * weight);
    };
    
    // Base win probability calculation
    let team1BaseProb = factors.reduce((acc, factor) => {
      const ratio = factor.team1Value / (factor.team1Value + factor.team2Value);
      return acc + (ratio * factor.weight);
    }, 0);
    
    // Apply adjustment factors
    team1BaseProb = applyAdjustmentFactor(team1BaseProb, adjustmentFactors.recentForm, 0.1);
    team1BaseProb = applyAdjustmentFactor(team1BaseProb, adjustmentFactors.headToHead, 0.1);
    team1BaseProb = applyAdjustmentFactor(team1BaseProb, adjustmentFactors.mapVeto, 0.1);
    team1BaseProb = applyAdjustmentFactor(team1BaseProb, adjustmentFactors.tournamentTier, 0.1);
    
    // Ensure probabilities are valid
    team1BaseProb = Math.min(0.95, Math.max(0.05, team1BaseProb));
    const team2BaseProb = 1 - team1BaseProb;
    
    // Calculate confidence based on the skew of probabilities and the TIR difference
    const tirDifference = Math.abs(team1Stats.tir - team2Stats.tir);
    const skew = Math.abs(team1BaseProb - 0.5) * 2; // 0 to 1 scale
    const confidenceScore = (tirDifference * 10 + skew * 50) / 2; // 0-100 scale
    
    // Predict map score based on probabilities
    // For simplicity, use a normal distribution around win probabilities
    // more sophisticated versions would consider historical scorelines, etc.
    const generateScore = (winProb: number): [number, number] => {
      const roundsToWin = 16; // Standard CS2 match format (first to 16)
      
      if (winProb > 0.8) {
        // Dominant win scenarios
        return [roundsToWin, Math.floor(Math.random() * 10)];
      } else if (winProb > 0.65) {
        // Clear win scenarios
        return [roundsToWin, Math.floor(10 + Math.random() * 4)];
      } else if (winProb > 0.45) {
        // Close match scenarios
        const winner = Math.random() < 0.5 ? 0 : 1;
        if (winner === 0) {
          return [roundsToWin, Math.floor(13 + Math.random() * 3)];
        } else {
          return [Math.floor(13 + Math.random() * 3), roundsToWin];
        }
      } else if (winProb > 0.3) {
        // Clear loss scenarios
        return [Math.floor(10 + Math.random() * 4), roundsToWin];
      } else {
        // Dominant loss scenarios
        return [Math.floor(Math.random() * 10), roundsToWin];
      }
    };
    
    // Determine score based on which team has higher win probability
    let predictedScore;
    if (team1BaseProb >= team2BaseProb) {
      const [t1, t2] = generateScore(team1BaseProb);
      predictedScore = { team1: t1, team2: t2 };
    } else {
      const [t2, t1] = generateScore(team2BaseProb);
      predictedScore = { team1: t1, team2: t2 };
    }
    
    // Identify key players based on PIV, context and consistency
    const getKeyPlayers = (teamPlayers: PlayerWithPIV[], mapName: string): {player: PlayerWithPIV, impactScore: number}[] => {
      // Calculate adjusted impact scores based on player roles and selected map
      const playersWithImpact = teamPlayers.map(player => {
        // Base impact is PIV
        let impactScore = player.piv;
        
        // Adjust based on role's effectiveness on the specific map
        // This would normally come from historical data
        const mapRoleEffectiveness: Record<string, Record<PlayerRole, number>> = {
          "Mirage": {
            [PlayerRole.AWP]: 1.2,
            [PlayerRole.IGL]: 1.0,
            [PlayerRole.Lurker]: 1.15,
            [PlayerRole.Spacetaker]: 1.1,
            [PlayerRole.Support]: 0.9,
            [PlayerRole.Anchor]: 0.95,
            [PlayerRole.Rotator]: 1.05
          },
          "Inferno": {
            [PlayerRole.AWP]: 0.9,
            [PlayerRole.IGL]: 1.1,
            [PlayerRole.Lurker]: 0.8,
            [PlayerRole.Spacetaker]: 1.05,
            [PlayerRole.Support]: 1.2,
            [PlayerRole.Anchor]: 1.1,
            [PlayerRole.Rotator]: 1.15
          },
          // other maps...
          "Vertigo": {
            [PlayerRole.AWP]: 0.85,
            [PlayerRole.IGL]: 1.1,
            [PlayerRole.Lurker]: 0.9,
            [PlayerRole.Spacetaker]: 1.05,
            [PlayerRole.Support]: 1.25,
            [PlayerRole.Anchor]: 1.15,
            [PlayerRole.Rotator]: 1.1
          }
        };

        // Apply map-specific adjustment
        const mapAdjustment = mapRoleEffectiveness[mapName]?.[player.role] || 1.0;
        impactScore *= mapAdjustment;
        
        return { player, impactScore };
      });
      
      // Return top 3 players by impact score
      return playersWithImpact.sort((a, b) => b.impactScore - a.impactScore).slice(0, 3);
    };
    
    // Calculate map advantages across all maps
    const mapAdvantages = MAPS.reduce((acc, map) => {
      const team1Rate = team1Stats.mapPerformance[map] || 0.5;
      const team2Rate = team2Stats.mapPerformance[map] || 0.5;
      
      // Determine advantage (1 = team1, 2 = team2, 0 = neutral)
      let advantage = 0;
      const threshold = 0.05; // Minimum difference to consider an advantage
      
      if (team1Rate - team2Rate > threshold) advantage = 1;
      else if (team2Rate - team1Rate > threshold) advantage = 2;
      
      acc[map] = advantage;
      return acc;
    }, {} as { [key: string]: number });
    
    return {
      team1WinProbability: team1BaseProb,
      team2WinProbability: team2BaseProb,
      confidenceScore,
      keyFactors: factors,
      predictedScore,
      keyPlayers: {
        team1: getKeyPlayers(team1Stats.players, selectedMap),
        team2: getKeyPlayers(team2Stats.players, selectedMap)
      },
      mapAdvantages
    };
  }, [team1, team2, selectedMap, adjustmentFactors, enhancedTeamStats]);
  
  // Generate detailed insights based on prediction
  const insights = useMemo(() => {
    if (!prediction || !team1 || !team2) return [];
    
    const insights = [];
    
    // Top factor for each team
    const team1Factors = prediction.keyFactors
      .filter(f => f.favorsTeam === 1)
      .sort((a, b) => b.weight - a.weight);
      
    const team1TopFactor = team1Factors.length > 0 ? team1Factors[0] : null;
    
    const team2Factors = prediction.keyFactors
      .filter(f => f.favorsTeam === 2)
      .sort((a, b) => b.weight - a.weight);
      
    const team2TopFactor = team2Factors.length > 0 ? team2Factors[0] : null;
      
    if (team1TopFactor) {
      insights.push({
        title: `${team1.name} Strength`,
        content: `${team1.name}'s ${team1TopFactor.name.toLowerCase()} (${Math.round(team1TopFactor.team1Value)}) gives them an edge over ${team2.name} (${Math.round(team1TopFactor.team2Value)}).`
      });
    }
    
    if (team2TopFactor) {
      insights.push({
        title: `${team2.name} Strength`,
        content: `${team2.name}'s ${team2TopFactor.name.toLowerCase()} (${Math.round(team2TopFactor.team2Value)}) counters ${team1.name}'s weaker ${team2TopFactor.name.toLowerCase()} (${Math.round(team2TopFactor.team1Value)}).`
      });
    }
    
    // Map-specific insights
    const mapAdvantage = prediction.mapAdvantages[selectedMap];
    if (mapAdvantage === 1) {
      insights.push({
        title: "Map Advantage",
        content: `${team1.name} historically performs well on ${selectedMap} with a ${Math.round((enhancedTeamStats[team1.id].mapPerformance[selectedMap] || 0.5) * 100)}% win rate.`
      });
    } else if (mapAdvantage === 2) {
      insights.push({
        title: "Map Advantage", 
        content: `${team2.name} has a ${Math.round((enhancedTeamStats[team2.id].mapPerformance[selectedMap] || 0.5) * 100)}% win rate on ${selectedMap}, giving them a strong advantage.`
      });
    }
    
    // Key players insight
    if (prediction.keyPlayers.team1.length > 0) {
      const keyPlayer = prediction.keyPlayers.team1[0];
      insights.push({
        title: "Key Player",
        content: `${keyPlayer.player.name} (${keyPlayer.player.role}) is crucial for ${team1.name}'s success with a PIV of ${Math.round(keyPlayer.player.piv * 100)}.`
      });
    }
    
    // Create prediction summary
    const favored = prediction.team1WinProbability > prediction.team2WinProbability ? team1.name : team2.name;
    const winProb = prediction.team1WinProbability > prediction.team2WinProbability ? 
      Math.round(prediction.team1WinProbability * 100) : 
      Math.round(prediction.team2WinProbability * 100);
      
    insights.push({
      title: "Prediction Summary",
      content: `${favored} is favored to win with a ${winProb}% probability. Predicted score: ${prediction.predictedScore.team1}-${prediction.predictedScore.team2}.`
    });
    
    return insights;
  }, [prediction, team1, team2, selectedMap]);
  
  // If loading, show skeleton
  if (teamsLoading || playersLoading) {
    return (
      <div className="container mx-auto py-6 space-y-6 px-4">
        <h1 className="text-3xl font-bold">Match Predictor</h1>
        <div className="h-80 animate-pulse bg-gray-800 rounded-lg"></div>
        <Button onClick={testDirectApiCall}>Test API Directly</Button>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-6 space-y-6 px-4 min-h-screen">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold flex items-center">
            <Percent className="mr-2 h-8 w-8 text-primary" />
            Match Predictor
          </h1>
          <p className="text-gray-400 mt-1">
            AI-powered CS2 match outcome prediction and analysis
          </p>
        </div>
        <div>
          <Button onClick={testDirectApiCall} variant="outline">
            Test API Directly
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Team selection and configuration - 8 columns on large screens */}
        <div className="lg:col-span-8 space-y-6">
          <Card>
            <CardHeader className="pb-0">
              <div className="flex items-center justify-between">
                <CardTitle>Match Setup</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-4">
                {/* Team 1 Selection */}
                <div className="space-y-4">
                  <select 
                    className="w-full p-2 border rounded-md bg-background"
                    value={team1Id}
                    onChange={(e) => setTeam1Id(e.target.value)}
                  >
                    <option value="">Select first team</option>
                    {teams.map(team => (
                      <option key={team.id} value={team.id}>
                        {team.name} (TIR: {Math.round(team.tir)})
                      </option>
                    ))}
                  </select>
                  
                  {team1 && enhancedTeamStats[team1.id] && (
                    <div className="space-y-3 bg-background-light p-3 rounded-md">
                      <div className="flex items-center justify-between">
                        <div className="font-bold text-lg">{team1.name}</div>
                        <div className="bg-primary/20 text-primary rounded-full px-3 py-1 text-sm font-medium">
                          TIR: {Math.round(team1.tir)}
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-3 gap-2 text-center text-xs">
                        <div className="bg-background p-2 rounded-md">
                          <div className="text-gray-400">Avg PIV</div>
                          <div className="font-medium">{Math.round(team1.avgPIV * 100)}</div>
                        </div>
                        <div className="bg-background p-2 rounded-md">
                          <div className="text-gray-400">Synergy</div>
                          <div className="font-medium">{Math.round(team1.synergy * 100)}%</div>
                        </div>
                        <div className="bg-background p-2 rounded-md">
                          <div className="text-gray-400">{selectedMap} Win</div>
                          <div className="font-medium">
                            {Math.round((enhancedTeamStats[team1.id].mapPerformance[selectedMap] || 0.5) * 100)}%
                          </div>
                        </div>
                      </div>
                      
                      <div className="text-xs text-gray-400 mt-1">
                        Key Players: {team1.players.slice(0, 3).map(p => p.name).join(", ")}
                      </div>
                    </div>
                  )}
                </div>
                
                {/* Team 2 Selection */}
                <div className="space-y-4">
                  <select 
                    className="w-full p-2 border rounded-md bg-background"
                    value={team2Id}
                    onChange={(e) => setTeam2Id(e.target.value)}
                  >
                    <option value="">Select second team</option>
                    {teams.map(team => (
                      <option key={team.id} value={team.id}>
                        {team.name} (TIR: {Math.round(team.tir)})
                      </option>
                    ))}
                  </select>
                  
                  {team2 && enhancedTeamStats[team2.id] && (
                    <div className="space-y-3 bg-background-light p-3 rounded-md">
                      <div className="flex items-center justify-between">
                        <div className="font-bold text-lg">{team2.name}</div>
                        <div className="bg-primary/20 text-primary rounded-full px-3 py-1 text-sm font-medium">
                          TIR: {Math.round(team2.tir)}
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-3 gap-2 text-center text-xs">
                        <div className="bg-background p-2 rounded-md">
                          <div className="text-gray-400">Avg PIV</div>
                          <div className="font-medium">{Math.round(team2.avgPIV * 100)}</div>
                        </div>
                        <div className="bg-background p-2 rounded-md">
                          <div className="text-gray-400">Synergy</div>
                          <div className="font-medium">{Math.round(team2.synergy * 100)}%</div>
                        </div>
                        <div className="bg-background p-2 rounded-md">
                          <div className="text-gray-400">{selectedMap} Win</div>
                          <div className="font-medium">
                            {Math.round((enhancedTeamStats[team2.id].mapPerformance[selectedMap] || 0.5) * 100)}%
                          </div>
                        </div>
                      </div>
                      
                      <div className="text-xs text-gray-400 mt-1">
                        Key Players: {team2.players.slice(0, 3).map(p => p.name).join(", ")}
                      </div>
                    </div>
                  )}
                </div>
              </div>
              
              <div className="mt-6 space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="font-medium">Map Selection</h3>
                  <Dialog>
                    <DialogTrigger asChild>
                      <Button variant="outline" size="sm">
                        Map Stats <ChevronRight className="h-4 w-4 ml-1" />
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Map Performance Comparison</DialogTitle>
                        <DialogDescription>
                          Historical win rates for both teams across all maps
                        </DialogDescription>
                      </DialogHeader>
                      
                      {team1 && team2 && enhancedTeamStats[team1.id] && enhancedTeamStats[team2.id] && (
                        <div className="h-72 mt-4">
                          <ResponsiveContainer width="100%" height="100%">
                            <BarChart
                              data={MAPS.map(map => ({
                                name: map,
                                [team1.name]: Math.round((enhancedTeamStats[team1.id].mapPerformance[map] || 0.5) * 100),
                                [team2.name]: Math.round((enhancedTeamStats[team2.id].mapPerformance[map] || 0.5) * 100),
                              }))}
                              margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                            >
                              <CartesianGrid strokeDasharray="3 3" />
                              <XAxis dataKey="name" />
                              <YAxis domain={[40, 90]} />
                              <RechartsTooltip />
                              <Legend />
                              <Bar dataKey={team1?.name || ""} fill="#8884d8" />
                              <Bar dataKey={team2?.name || ""} fill="#82ca9d" />
                            </BarChart>
                          </ResponsiveContainer>
                        </div>
                      )}
                    </DialogContent>
                  </Dialog>
                </div>
                
                <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-2">
                  {MAPS.map(map => (
                    <button
                      key={map}
                      className={`px-4 py-2 rounded-md text-sm font-medium transition 
                        ${selectedMap === map ? 
                          'bg-primary text-white' : 
                          'bg-background-light text-gray-300 hover:bg-gray-700'}`}
                      onClick={() => setSelectedMap(map)}
                    >
                      {map}
                    </button>
                  ))}
                </div>
              </div>
              
              <div className="mt-6 space-y-4">
                <h3 className="font-medium">Contextual Factors</h3>
                <div className="space-y-6">
                  {/* Recent Form slider */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label htmlFor="recent-form" className="text-sm flex items-center gap-1">
                        <Clock className="h-4 w-4" />
                        Recent Form
                      </Label>
                      <div className="flex gap-3 items-center text-xs">
                        <span className="text-gray-400">{team2?.name}</span>
                        <Badge variant={adjustmentFactors.recentForm === 50 ? "outline" : "default"}>
                          {adjustmentFactors.recentForm === 50 ? "Neutral" : adjustmentFactors.recentForm > 50 ? "Favors " + team1?.name : "Favors " + team2?.name}
                        </Badge>
                        <span className="text-gray-400">{team1?.name}</span>
                      </div>
                    </div>
                    <Slider
                      id="recent-form"
                      value={[adjustmentFactors.recentForm]}
                      onValueChange={values => setAdjustmentFactors({ 
                        ...adjustmentFactors, 
                        recentForm: values[0] 
                      })}
                      max={100}
                      step={5}
                    />
                  </div>
                  
                  {/* Head to Head slider */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label htmlFor="head-to-head" className="text-sm flex items-center gap-1">
                        <ArrowRightLeft className="h-4 w-4" />
                        Head-to-Head History
                      </Label>
                      <div className="flex gap-3 items-center text-xs">
                        <span className="text-gray-400">{team2?.name}</span>
                        <Badge variant={adjustmentFactors.headToHead === 50 ? "outline" : "default"}>
                          {adjustmentFactors.headToHead === 50 ? "Neutral" : adjustmentFactors.headToHead > 50 ? "Favors " + team1?.name : "Favors " + team2?.name}
                        </Badge>
                        <span className="text-gray-400">{team1?.name}</span>
                      </div>
                    </div>
                    <Slider
                      id="head-to-head"
                      value={[adjustmentFactors.headToHead]}
                      onValueChange={values => setAdjustmentFactors({ 
                        ...adjustmentFactors, 
                        headToHead: values[0] 
                      })}
                      max={100}
                      step={5}
                    />
                  </div>
                  
                  {/* Map Veto slider */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label htmlFor="map-veto" className="text-sm flex items-center gap-1">
                        <Map className="h-4 w-4" />
                        Map Selection Advantage
                      </Label>
                      <div className="flex gap-3 items-center text-xs">
                        <span className="text-gray-400">{team2?.name}</span>
                        <Badge variant={adjustmentFactors.mapVeto === 50 ? "outline" : "default"}>
                          {adjustmentFactors.mapVeto === 50 ? "Neutral" : adjustmentFactors.mapVeto > 50 ? "Favors " + team1?.name : "Favors " + team2?.name}
                        </Badge>
                        <span className="text-gray-400">{team1?.name}</span>
                      </div>
                    </div>
                    <Slider
                      id="map-veto"
                      value={[adjustmentFactors.mapVeto]}
                      onValueChange={values => setAdjustmentFactors({ 
                        ...adjustmentFactors, 
                        mapVeto: values[0] 
                      })}
                      max={100}
                      step={5}
                    />
                  </div>
                  
                  {/* Tournament Tier slider */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label htmlFor="tournament-tier" className="text-sm flex items-center gap-1">
                        <Trophy className="h-4 w-4" />
                        Tournament Tier
                      </Label>
                      <div className="flex gap-3 items-center text-xs">
                        <span className="text-gray-400">Lower Tier</span>
                        <Badge variant={adjustmentFactors.tournamentTier === 50 ? "outline" : "default"}>
                          {adjustmentFactors.tournamentTier === 50 ? "Mid Tier" : 
                           adjustmentFactors.tournamentTier > 75 ? "S-Tier Major" : 
                           adjustmentFactors.tournamentTier > 50 ? "A-Tier" : 
                           adjustmentFactors.tournamentTier > 25 ? "B-Tier" : "C-Tier"}
                        </Badge>
                        <span className="text-gray-400">Major</span>
                      </div>
                    </div>
                    <Slider
                      id="tournament-tier"
                      value={[adjustmentFactors.tournamentTier]}
                      onValueChange={values => setAdjustmentFactors({ 
                        ...adjustmentFactors, 
                        tournamentTier: values[0] 
                      })}
                      max={100}
                      step={5}
                    />
                  </div>
                </div>
              </div>
              
              <div className="mt-6 space-y-2">
                <div className="flex items-center justify-between">
                  <h3 className="font-medium">Advanced Options</h3>
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button variant="ghost" size="icon">
                          <Info className="h-4 w-4" />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p className="max-w-xs text-sm">
                          These options enable additional predictive factors based on psychological analysis, tournament context, and role-specific matchups.
                        </p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </div>
                
                <div className="space-y-3 bg-background-light p-3 rounded-md">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Brain className="h-4 w-4 text-primary" />
                      <Label htmlFor="psychology-factors" className="text-sm">Psychology Factors</Label>
                    </div>
                    <Switch
                      id="psychology-factors"
                      checked={advancedOptions.enablePsychologyFactors}
                      onCheckedChange={checked => setAdvancedOptions({
                        ...advancedOptions,
                        enablePsychologyFactors: checked
                      })}
                    />
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Award className="h-4 w-4 text-yellow-400" />
                      <Label htmlFor="tournament-context" className="text-sm">Tournament Context</Label>
                    </div>
                    <Switch
                      id="tournament-context"
                      checked={advancedOptions.useTournamentContext}
                      onCheckedChange={checked => setAdvancedOptions({
                        ...advancedOptions,
                        useTournamentContext: checked
                      })}
                    />
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Users className="h-4 w-4 text-blue-400" />
                      <Label htmlFor="role-matchups" className="text-sm">Role-specific Matchups</Label>
                    </div>
                    <Switch
                      id="role-matchups"
                      checked={advancedOptions.useRoleMatchups}
                      onCheckedChange={checked => setAdvancedOptions({
                        ...advancedOptions,
                        useRoleMatchups: checked
                      })}
                    />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
        
        {/* Prediction results and visualizations - 4 columns on large screens */}
        <div className="lg:col-span-4 space-y-6">
          {!prediction ? (
            <Card className="border-dashed border-2 border-gray-700 bg-gray-900/50">
              <CardContent className="flex flex-col items-center justify-center py-10">
                <Shield className="h-16 w-16 text-gray-600 mb-4" />
                <h3 className="text-lg font-medium text-gray-400">Select Both Teams</h3>
                <p className="text-sm text-gray-500 text-center mt-2">
                  Choose two teams to see detailed match predictions and analytics
                </p>
              </CardContent>
            </Card>
          ) : (
            <>
              {/* Win Probability Card */}
              <Card>
                <CardHeader className="pb-0">
                  <CardTitle className="text-lg">Win Probability</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between text-sm mt-4 mb-1">
                    <span className="font-medium">{team1?.name}</span>
                    <span className="font-medium">{team2?.name}</span>
                  </div>
                  
                  <div className="relative h-6 bg-gray-800 rounded-full overflow-hidden">
                    <div 
                      className="absolute top-0 left-0 h-full bg-gradient-to-r from-indigo-600 to-blue-500"
                      style={{ width: `${Math.round(prediction.team1WinProbability * 100)}%` }}
                    ></div>
                    <div 
                      className="absolute top-0 right-0 h-full bg-gradient-to-r from-pink-500 to-red-500"
                      style={{ width: `${Math.round(prediction.team2WinProbability * 100)}%` }}
                    ></div>
                    <div className="absolute inset-0 flex items-center justify-center text-xs font-bold text-white">
                      {Math.round(prediction.team1WinProbability * 100)}% - {Math.round(prediction.team2WinProbability * 100)}%
                    </div>
                  </div>
                  
                  <div className="flex flex-col gap-2 mt-6">
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-gray-400">Predicted Score</span>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-lg">
                          {prediction.predictedScore.team1}
                        </span>
                        <span className="text-sm text-gray-400">-</span>
                        <span className="font-bold text-lg">
                          {prediction.predictedScore.team2}
                        </span>
                      </div>
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-gray-400">Confidence</span>
                      <div className="flex items-center gap-1">
                        <span className="font-medium">
                          {Math.round(prediction.confidenceScore)}%
                        </span>
                        <div className="w-24 h-2 bg-gray-800 rounded-full overflow-hidden">
                          <div 
                            className="h-full bg-gradient-to-r from-green-500 to-emerald-500"
                            style={{ width: `${prediction.confidenceScore}%` }}
                          ></div>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
              
              {/* Key Factors Card */}
              <Card>
                <CardHeader className="pb-0">
                  <CardTitle className="text-lg">Key Factors</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4 mt-4">
                    {prediction.keyFactors.map((factor, i) => (
                      <div key={factor.name} className="space-y-1">
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-medium">{factor.name}</span>
                          <Badge variant={factor.favorsTeam === 0 ? "outline" : "default"}>
                            {factor.favorsTeam === 0 ? "Neutral" : factor.favorsTeam === 1 ? "Favors " + team1?.name : "Favors " + team2?.name}
                          </Badge>
                        </div>
                        
                        <div className="h-6 bg-gray-800 rounded-full relative overflow-hidden">
                          <div 
                            className="absolute top-0 left-0 h-full bg-blue-600"
                            style={{ width: `${(factor.team1Value / (factor.team1Value + factor.team2Value)) * 100}%` }}
                          ></div>
                          <div className="absolute inset-0 flex items-center">
                            <div 
                              className="text-xs font-medium text-white text-right pr-2"
                              style={{ width: `${(factor.team1Value / (factor.team1Value + factor.team2Value)) * 100}%` }}
                            >
                              {Math.round(factor.team1Value)}
                            </div>
                            <div 
                              className="text-xs font-medium text-white pl-2"
                              style={{ width: `${(factor.team2Value / (factor.team1Value + factor.team2Value)) * 100}%` }}
                            >
                              {Math.round(factor.team2Value)}
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
              
              {/* Key Insights Card */}
              <Card>
                <CardHeader className="pb-0">
                  <CardTitle className="text-lg">Match Insights</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3 mt-4">
                    {insights.map((insight, i) => (
                      <div key={i} className="border-l-2 border-primary pl-3 py-1">
                        <h4 className="text-sm font-medium">{insight.title}</h4>
                        <p className="text-xs text-gray-400 mt-0.5">{insight.content}</p>
                      </div>
                    ))}
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

// Trophy icon is already imported from Lucide
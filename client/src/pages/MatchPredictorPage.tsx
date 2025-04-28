import React, { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { Helmet } from 'react-helmet';
import { useToast } from '@/hooks/use-toast';
import { 
  GlobeIcon, 
  Loader2Icon, 
  ArrowRightIcon, 
  ActivityIcon,
  BarChart3Icon,
  AlertCircleIcon
} from 'lucide-react';
import { Separator } from '@/components/ui/separator';
import { Button } from '@/components/ui/button';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { 
  Card, 
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
  CardFooter
} from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';

// Define interfaces for the application
interface TeamWithTIR {
  id: string;
  name: string;
  tir: number;
  sumPIV?: number;
  synergy?: number;
  avgPIV?: number;
  topPlayerName?: string;
  topPlayerPIV?: number;
  players?: any[];
}

// Import prediction components
import TeamLineup from '@/components/match-prediction/TeamLineup';

// Define available maps for BO3/BO5
const availableMaps = [
  'ancient', 'anubis', 'inferno', 'mirage', 'nuke', 'overpass', 'vertigo'
];

const MatchPredictorPage: React.FC = () => {
  const { toast } = useToast();
  
  // State for user selections
  const [matchType, setMatchType] = useState<'bo1' | 'bo3' | 'bo5'>('bo1');
  const [team1Id, setTeam1Id] = useState<string | undefined>();
  const [team2Id, setTeam2Id] = useState<string | undefined>();
  
  // BO1 state
  const [selectedMap, setSelectedMap] = useState<string>('');
  
  // BO3/BO5 state
  const [team1Picks, setTeam1Picks] = useState<string[]>([]);
  const [team2Picks, setTeam2Picks] = useState<string[]>([]);
  const [deciderMaps, setDeciderMaps] = useState<string[]>([]);
  const [currentStage, setCurrentStage] = useState<'team1' | 'team2' | 'decider'>('team1');

  // Fetch teams data
  const { data: teams = [], isLoading: isLoadingTeams } = useQuery<TeamWithTIR[]>({
    queryKey: ['/api/teams'],
    staleTime: 10 * 60 * 1000, // 10 minutes
  });

  // Mutation for match prediction
  const predictionMutation = useMutation({
    mutationFn: async (data: { team1Id: string; team2Id: string; map: string; isBO3?: boolean; maps?: string[] }) => {
      const response = await fetch('/api/match-prediction', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      
      if (!response.ok) {
        throw new Error(`Error: ${response.status}`);
      }
      
      return response.json();
    },
    onSuccess: (data) => {
      console.log("Prediction success:", data);
      toast({
        title: 'Prediction Complete',
        description: 'Match prediction analysis has been calculated',
      });
    },
    onError: (error) => {
      console.error("Prediction error:", error);
      toast({
        title: 'Prediction Failed',
        description: 'There was an error generating the match prediction',
        variant: 'destructive',
      });
    },
  });

  // Handle prediction button click
  const handleRunPrediction = () => {
    if (!team1Id || !team2Id) {
      toast({
        title: 'Missing Teams',
        description: 'Please select two teams first',
        variant: 'destructive',
      });
      return;
    }

    if (matchType === 'bo1') {
      if (!selectedMap) {
        toast({
          title: 'Missing Map',
          description: 'Please select a map for the BO1',
          variant: 'destructive',
        });
        return;
      }
      
      predictionMutation.mutate({
        team1Id,
        team2Id,
        map: selectedMap,
        isBO3: false
      });
    } else {
      // BO3/BO5 mode
      const mapsNeeded = matchType === 'bo3' ? 1 : 2;
      const deciderNeeded = 1;
      
      if (team1Picks.length < mapsNeeded || team2Picks.length < mapsNeeded || deciderMaps.length < deciderNeeded) {
        toast({
          title: 'Missing Maps',
          description: `Please complete the map picks for ${matchType.toUpperCase()}`,
          variant: 'destructive',
        });
        return;
      }
      
      const allMaps = [...team1Picks, ...team2Picks, ...deciderMaps];
      
      predictionMutation.mutate({
        team1Id,
        team2Id,
        map: allMaps[0], // primary map
        isBO3: true,
        maps: allMaps
      });
    }
  };

  // Get the prediction result
  const prediction = predictionMutation.data?.prediction;
  
  // Calculate win probabilities for visualization
  const team1Chance = prediction?.team1WinProbability 
    ? Math.round(prediction.team1WinProbability * 100) 
    : null;
  const team2Chance = prediction?.team2WinProbability 
    ? Math.round(prediction.team2WinProbability * 100) 
    : null;
    
  // Handle map picks for BO3/BO5
  const handleMapPick = (map: string) => {
    const neededMapsPerTeam = matchType === 'bo3' ? 1 : 2; // BO3: 1 map per team, BO5: 2 maps per team
    
    if (currentStage === 'team1') {
      if (team1Picks.length < neededMapsPerTeam) {
        setTeam1Picks([...team1Picks, map]);
        if (team1Picks.length + 1 >= neededMapsPerTeam) {
          setCurrentStage('team2');
        }
      }
    } else if (currentStage === 'team2') {
      if (team2Picks.length < neededMapsPerTeam) {
        setTeam2Picks([...team2Picks, map]);
        if (team2Picks.length + 1 >= neededMapsPerTeam) {
          setCurrentStage('decider');
        }
      }
    } else if (currentStage === 'decider') {
      // For decider maps
      const neededDeciders = matchType === 'bo3' ? 1 : 1; // BO3: 1 decider, BO5: 1 decider
      if (deciderMaps.length < neededDeciders) {
        setDeciderMaps([...deciderMaps, map]);
      }
    }
  };
  
  // Reset map selections
  const resetMapSelections = () => {
    setTeam1Picks([]);
    setTeam2Picks([]);
    setDeciderMaps([]);
    setCurrentStage('team1');
  };

  // Is a map available to pick?
  const isMapAvailable = (map: string) => {
    const selectedMaps = [...team1Picks, ...team2Picks, ...deciderMaps];
    return !selectedMaps.includes(map);
  };
  
  // Get current pick stage label
  const getPickingStageLabel = () => {
    if (currentStage === 'team1') return `${team1Id || 'Team 1'} Picking`;
    if (currentStage === 'team2') return `${team2Id || 'Team 2'} Picking`;
    return "Select Decider Map";
  };

  return (
    <div className="container mx-auto py-6">
      <Helmet>
        <title>Match Predictor | CS2 Analytics Platform</title>
      </Helmet>

      <div className="flex flex-col space-y-2 mb-6">
        <div className="flex items-center">
          <GlobeIcon className="mr-2 h-6 w-6 text-primary" />
          <h1 className="text-3xl font-bold tracking-tight">Match Predictor</h1>
        </div>
        <p className="text-muted-foreground">
          Predict match outcomes based on team performance and round-by-round analysis
        </p>
      </div>

      <div className="space-y-8">
        {/* MATCH SETUP SECTION */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Team selection */}
          <Card>
            <CardHeader>
              <CardTitle>Team Selection</CardTitle>
              <CardDescription>Choose the teams competing in this match</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Team 1</label>
                  <Select value={team1Id} onValueChange={setTeam1Id}>
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Select team 1" />
                    </SelectTrigger>
                    <SelectContent>
                      {teams
                        .filter(team => team.name && !team.name.includes("Opening") && !team.name.includes("K/D") && !team.name.includes("Zone"))
                        .map((team) => (
                          <SelectItem key={team.id} value={team.name}>
                            {team.name} (TIR: {Math.round(team.tir * 10)})
                          </SelectItem>
                        ))}
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="space-y-2">
                  <label className="text-sm font-medium">Team 2</label>
                  <Select value={team2Id} onValueChange={setTeam2Id}>
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Select team 2" />
                    </SelectTrigger>
                    <SelectContent>
                      {teams
                        .filter(team => team.name && !team.name.includes("Opening") && !team.name.includes("K/D") && !team.name.includes("Zone"))
                        .map((team) => (
                          <SelectItem key={team.id} value={team.name}>
                            {team.name} (TIR: {Math.round(team.tir * 10)})
                          </SelectItem>
                        ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>
          
          {/* Match configuration */}
          <Card>
            <CardHeader>
              <CardTitle>Match Configuration</CardTitle>
              <CardDescription>Choose match type and map selections</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Match Type</label>
                  <RadioGroup 
                    value={matchType} 
                    onValueChange={(value: string) => {
                      setMatchType(value as 'bo1' | 'bo3' | 'bo5');
                      resetMapSelections();
                      setSelectedMap('');
                    }} 
                    className="flex gap-4"
                  >
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="bo1" id="bo1" />
                      <label htmlFor="bo1">Best of 1</label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="bo3" id="bo3" />
                      <label htmlFor="bo3">Best of 3</label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="bo5" id="bo5" />
                      <label htmlFor="bo5">Best of 5</label>
                    </div>
                  </RadioGroup>
                </div>
                
                {matchType === 'bo1' ? (
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Map</label>
                    <Select value={selectedMap} onValueChange={setSelectedMap}>
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Select a map" />
                      </SelectTrigger>
                      <SelectContent>
                        {availableMaps.map((map) => (
                          <SelectItem key={map} value={map}>
                            {map.charAt(0).toUpperCase() + map.slice(1)}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <label className="text-sm font-medium">
                        {getPickingStageLabel()}
                      </label>
                      <div className="grid grid-cols-3 gap-2">
                        {availableMaps.map((map) => (
                          <Button
                            key={map}
                            variant={
                              team1Picks.includes(map) 
                                ? "default" 
                                : team2Picks.includes(map) 
                                  ? "secondary" 
                                  : deciderMaps.includes(map) 
                                    ? "outline" 
                                    : "ghost"
                            }
                            size="sm"
                            disabled={!isMapAvailable(map)}
                            onClick={() => handleMapPick(map)}
                            className="text-xs capitalize justify-start"
                          >
                            {map}
                            {team1Picks.includes(map) && <Badge className="ml-auto bg-blue-500">Team 1</Badge>}
                            {team2Picks.includes(map) && <Badge className="ml-auto bg-yellow-500">Team 2</Badge>}
                            {deciderMaps.includes(map) && <Badge className="ml-auto">Decider</Badge>}
                          </Button>
                        ))}
                      </div>
                    </div>
                    
                    <div className="space-y-1">
                      <div className="flex justify-between text-sm">
                        <span>{team1Id} pick: {team1Picks.join(', ')}</span>
                        <span>{team2Id} pick: {team2Picks.join(', ')}</span>
                      </div>
                      <div className="text-sm">
                        Decider map: {deciderMaps.join(', ')}
                      </div>
                    </div>
                    
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={resetMapSelections}
                      className="w-full"
                    >
                      Reset Map Picks
                    </Button>
                  </div>
                )}
              </div>
            </CardContent>
            <CardFooter>
              <Button 
                className="w-full" 
                onClick={handleRunPrediction}
                disabled={predictionMutation.isPending || !team1Id || !team2Id || 
                  (matchType === 'bo1' && !selectedMap) || 
                  (matchType === 'bo3' && (team1Picks.length === 0 || team2Picks.length === 0 || deciderMaps.length === 0))||
                  (matchType === 'bo5' && (team1Picks.length < 2 || team2Picks.length < 2 || deciderMaps.length === 0))}
              >
                {predictionMutation.isPending ? (
                  <>
                    <Loader2Icon className="mr-2 h-4 w-4 animate-spin" />
                    Calculating Prediction...
                  </>
                ) : (
                  <>
                    Run {matchType.toUpperCase()} Prediction
                    <ArrowRightIcon className="ml-2 h-4 w-4" />
                  </>
                )}
              </Button>
            </CardFooter>
          </Card>
        </div>

        {/* TEAM LINEUPS SECTION */}
        {(team1Id || team2Id) && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Team 1 Lineup */}
            {team1Id && (
              <Card className="overflow-hidden">
                <CardHeader className="bg-card/50 border-b pb-3">
                  <CardTitle>
                    {team1Id} Lineup
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                  <TeamLineup teamName={team1Id} className="p-4" />
                </CardContent>
              </Card>
            )}
            
            {/* Team 2 Lineup */}
            {team2Id && (
              <Card className="overflow-hidden">
                <CardHeader className="bg-card/50 border-b pb-3">
                  <CardTitle>
                    {team2Id} Lineup
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                  <TeamLineup teamName={team2Id} className="p-4" />
                </CardContent>
              </Card>
            )}
          </div>
        )}

        {/* PREDICTION RESULTS SECTION */}
        {prediction && (
          <div className="space-y-6">
            {/* Main prediction card */}
            <Card className="border-primary/20">
              <CardHeader className="bg-primary/5 border-b pb-3">
                <CardTitle className="flex items-center">
                  <BarChart3Icon className="mr-2 h-5 w-5 text-primary" />
                  Match Prediction: {matchType.toUpperCase()}
                </CardTitle>
                <CardDescription>
                  Maps: {matchType === 'bo1' 
                    ? selectedMap
                    : [...team1Picks, ...team2Picks, ...deciderMaps].join(', ')}
                </CardDescription>
              </CardHeader>
              <CardContent className="p-6">
                <div className="space-y-6">
                  {/* Win probability visualization */}
                  <div>
                    <div className="flex justify-between items-center mb-2">
                      <div className="flex items-center">
                        <div className="w-3 h-3 rounded-full bg-blue-500 mr-2"></div>
                        <span>{team1Id}</span>
                      </div>
                      <div className="flex items-center">
                        <span>{team2Id}</span>
                        <div className="w-3 h-3 rounded-full bg-yellow-500 ml-2"></div>
                      </div>
                    </div>
                    <div className="w-full h-3 bg-muted rounded-full overflow-hidden flex">
                      <div 
                        className="bg-blue-500 h-full" 
                        style={{ width: `${team1Chance}%` }} 
                      />
                      <div 
                        className="bg-yellow-500 h-full" 
                        style={{ width: `${team2Chance}%` }} 
                      />
                    </div>
                    <div className="flex justify-between mt-1">
                      <span className="text-blue-500">{team1Chance}%</span>
                      <span className="text-yellow-500">{team2Chance}%</span>
                    </div>
                    <div className="text-center mt-4 space-y-2">
                      <span className="font-medium">
                        Predicted winner: {team1Chance! > team2Chance! ? team1Id : team2Id}
                      </span>
                      
                      {prediction.actualScore && (
                        <div className="flex justify-center items-center space-x-3 mt-2">
                          <span className="text-sm text-muted-foreground">Actual Score:</span>
                          <span className="font-semibold">
                            {team1Id} {prediction.actualScore.team1Score} - {prediction.actualScore.team2Score} {team2Id}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                  
                  {/* Key Performance Factors */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
                    <div>
                      <h3 className="text-lg font-semibold flex items-center mb-3">
                        <ActivityIcon className="h-4 w-4 mr-2" />
                        Key Performance Factors
                      </h3>
                      {prediction.keyRoundFactors ? (
                        <div className="space-y-3">
                          {prediction.keyRoundFactors.map((factor: any, index: number) => (
                            <div 
                              key={index} 
                              className="flex items-start space-x-3 text-sm"
                            >
                              <span className="font-medium text-primary">{index + 1}.</span>
                              <div className="flex-1">
                                <div className="flex justify-between mb-1">
                                  <span className="font-medium">{factor.name}</span>
                                  <div className="flex space-x-3">
                                    <span className={factor.advantage === 1 ? "text-blue-500 font-medium" : ""}>{factor.team1Value.toFixed(1)}%</span>
                                    <span className={factor.advantage === 2 ? "text-yellow-500 font-medium" : ""}>{factor.team2Value.toFixed(1)}%</span>
                                  </div>
                                </div>
                                <div className="w-full h-2 bg-muted rounded-full overflow-hidden flex">
                                  <div 
                                    className={`h-full ${factor.advantage === 1 ? "bg-blue-500" : "bg-blue-400"}`}
                                    style={{ width: `${factor.team1Value}%` }} 
                                  />
                                  <div 
                                    className={`h-full ${factor.advantage === 2 ? "bg-yellow-500" : "bg-yellow-400"}`}
                                    style={{ width: `${factor.team2Value}%` }} 
                                  />
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="flex items-center space-x-2 text-muted-foreground">
                          <AlertCircleIcon className="h-4 w-4" />
                          <span>No performance factors available</span>
                        </div>
                      )}
                    </div>
                    
                    <div>
                      <h3 className="text-lg font-semibold mb-3">Key Insights</h3>
                      {prediction.insights ? (
                        <div className="space-y-3">
                          {prediction.insights.map((insight: any, index: number) => (
                            <div 
                              key={index} 
                              className="flex items-start space-x-3 text-sm"
                            >
                              <span className="font-medium text-primary">{index + 1}.</span>
                              <span>{insight}</span>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="text-muted-foreground">
                          No insights available
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            {/* Map Breakdown */}
            {matchType !== 'bo1' && (
              <Card>
                <CardHeader>
                  <CardTitle>Map Breakdown</CardTitle>
                  <CardDescription>Detailed analysis for each map in the series</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-6">
                    {[...team1Picks, ...team2Picks, ...deciderMaps].map((map, index) => {
                      // Get map-specific data if available
                      const mapData = prediction.mapBreakdown && prediction.mapBreakdown[map];
                      const team1Chance = mapData ? Math.round(mapData.team1WinChance * 100) : 50;
                      const team2Chance = mapData ? Math.round(mapData.team2WinChance * 100) : 50;
                      
                      return (
                        <div key={map} className="p-4 border rounded-md">
                          <div className="flex justify-between items-center mb-2">
                            <h3 className="font-medium capitalize">
                              {map}
                              {team1Picks.includes(map) && 
                                <Badge className="ml-2 bg-blue-500/20 text-blue-500">{team1Id} Pick</Badge>
                              }
                              {team2Picks.includes(map) && 
                                <Badge className="ml-2 bg-yellow-500/20 text-yellow-500">{team2Id} Pick</Badge>
                              }
                              {deciderMaps.includes(map) && 
                                <Badge className="ml-2">Decider</Badge>
                              }
                            </h3>
                            <div className="flex space-x-1 text-sm">
                              <span className="text-blue-500 font-medium">{team1Chance}%</span>
                              <span>-</span>
                              <span className="text-yellow-500 font-medium">{team2Chance}%</span>
                            </div>
                          </div>
                          <div className="w-full h-2 bg-muted rounded-full overflow-hidden flex">
                            <div className="bg-blue-500 h-full" style={{ width: `${team1Chance}%` }} />
                            <div className="bg-yellow-500 h-full" style={{ width: `${team2Chance}%` }} />
                          </div>
                          <div className="mt-4 text-sm text-muted-foreground">
                            {mapData && mapData.keyFactors ? (
                              <ul className="list-disc pl-5 space-y-1">
                                {mapData.keyFactors.map((factor, i) => (
                                  <li key={i}>{factor}</li>
                                ))}
                              </ul>
                            ) : (
                              <p>Key factors: Strong CT side for {team1Id}, better utility usage</p>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default MatchPredictorPage;